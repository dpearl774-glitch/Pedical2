/**
 * Clinical Decision-Support Engine for Inpatient Pediatric SAM Management
 * Implements strict WHO protocols, zero-hallucination deterministic calculations,
 * and physiological safety guardrails.
 */

import {
  getWHOThresholds,
  getWHOWfaThresholds,
  getWHOLfaThresholds,
  WHOLengthPoint,
} from '../data/whoGrowthStandards';

export type CalculationMode = 'Quick Calculator Override' | 'Full WHO Assessment + Calculator';
export type TherapeuticPhase = 'F-75 Stabilization' | 'F-100 Rehabilitation';
export type EdemaSeverity = 'None' | 'Mild/Moderate (+ / ++)' | 'Severe (+++)';
export type FeedingInterval = 2 | 3 | 4;
export type LocalMilkSource =
  | 'Dried Skimmed Milk Powder'
  | 'Dried Whole Milk Powder'
  | 'Fresh Cow / UHT Milk';
export type ChildSex = 'Boy' | 'Girl';

export interface CalculationInput {
  patient_id?: string;
  cot_number?: string;
  patient_name?: string;
  mrn?: string;
  age_months?: number;
  calculation_mode: CalculationMode;
  weight_kg: number;
  therapeutic_phase: TherapeuticPhase;
  edema_severity: EdemaSeverity;
  feeding_interval_hours: FeedingInterval;
  local_milk_source: LocalMilkSource;
  height_cm?: number;
  sex?: ChildSex;
}

export interface GrowthAssessmentResult {
  anthropometricProfile: {
    weight_kg: number;
    height_cm: number;
    sex: ChildSex;
    age_months?: number;
  };
  classificationStatus: string;
  diagnosticIndicator: string;
  isSam: boolean;
  whoThresholds?: WHOLengthPoint;
  zScoreCategory: '< -3 SD' | '-3 to -2 SD' | '-2 to -1 SD' | 'Median / Normal' | '> +1 SD';
  exactSdDiffKg: number; // Difference from -3 SD threshold
  wflZScore: number;
  wfaZScore?: number;
  lfaZScore?: number;
}

export interface FeedingTargetSummary {
  targetVolumePerFeed: number; // rounded to nearest 5 mL
  unroundedPerFeed: number;
  dailyVolume: number;
  safeMinimumVolume: number; // 80% / safe minimum threshold
  feedsPerDay: number;
  feedingIntervalHours: FeedingInterval;
  mlPerKgPerDay: number;
  safeMinMlPerKg: number;
}

export interface BatchRecipeItem {
  name: string;
  amount: number;
  unit: string;
  description?: string;
}

export interface BatchRecipeResult {
  dailyVolume: number;
  scaleFactor: number;
  milkBase: BatchRecipeItem;
  sugarGrams: number;
  vegetableOilGrams: number;
  cerealFlourGrams: number;
  cmvLiquidMl: number; // Liquid CMV solution in mL (20 mL per 1,000 mL milk formula)
  preparationStep: string;
  sugarVolumePercentage: number;
  energyKcalTotal: number;
  energyKcalPer100ml: number;
}

export interface SafetyVerificationResult {
  rule1F75OsmolalityTriggered: boolean;
  rule1NoticeText?: string;
  sugarPercentageOfVolume: number;
  rule2FluidOverloadHalted: boolean;
  rule2ErrorText?: string;
  allClear: boolean;
}

export interface ClinicalDirectiveResult {
  directiveText: string;
  therapeuticPhase: TherapeuticPhase;
}

export interface FullEvaluationResult {
  input: CalculationInput;
  growthAssessment?: GrowthAssessmentResult;
  feedingSummary: FeedingTargetSummary;
  recipe?: BatchRecipeResult;
  safety: SafetyVerificationResult;
  clinicalDirective: ClinicalDirectiveResult;
  timestamp: string;
}

/**
 * Execute Part 1: WHO Growth Assessment Diagnostic Logic
 */
export function evaluateGrowthStatus(
  weight_kg: number,
  height_cm: number,
  sex: ChildSex,
  edema_severity: EdemaSeverity,
  age_months?: number
): GrowthAssessmentResult {
  const whoThresholds = getWHOThresholds(height_cm, sex);
  const diffFromSd3 = weight_kg - whoThresholds.sd3neg;

  // Precise continuous Z-score calculations
  let wflZScore = 0;
  if (weight_kg === whoThresholds.median) {
    wflZScore = 0;
  } else if (weight_kg < whoThresholds.median) {
    const sdDistance = (whoThresholds.median - whoThresholds.sd3neg) / 3;
    wflZScore = Number(((weight_kg - whoThresholds.median) / sdDistance).toFixed(2));
  } else {
    const sdDistance = (whoThresholds.sd3 - whoThresholds.median) / 3;
    wflZScore = Number(((weight_kg - whoThresholds.median) / sdDistance).toFixed(2));
  }

  let wfaZScore: number | undefined = undefined;
  let lfaZScore: number | undefined = undefined;

  if (age_months !== undefined && age_months >= 0) {
    const wfaTh = getWHOWfaThresholds(age_months, sex);
    const sdDistWfa = (wfaTh.median - wfaTh.sd3neg) / 3;
    wfaZScore = Number(((weight_kg - wfaTh.median) / sdDistWfa).toFixed(2));

    const lfaTh = getWHOLfaThresholds(age_months, sex);
    const sdDistLfa = (lfaTh.median - lfaTh.sd3neg) / 3;
    lfaZScore = Number(((height_cm - lfaTh.median) / sdDistLfa).toFixed(2));
  }

  let zScoreCategory: GrowthAssessmentResult['zScoreCategory'] = 'Median / Normal';
  if (weight_kg < whoThresholds.sd3neg) {
    zScoreCategory = '< -3 SD';
  } else if (weight_kg < whoThresholds.sd2neg) {
    zScoreCategory = '-3 to -2 SD';
  } else if (weight_kg < whoThresholds.sd1neg) {
    zScoreCategory = '-2 to -1 SD';
  } else if (weight_kg > whoThresholds.sd1) {
    zScoreCategory = '> +1 SD';
  }

  // Condition 1: Bilateral clinical edema (+ / ++ or +++)
  if (edema_severity === 'Mild/Moderate (+ / ++)' || edema_severity === 'Severe (+++)') {
    return {
      anthropometricProfile: { weight_kg, height_cm, sex, age_months },
      classificationStatus: 'SEVERE ACUTE MALNUTRITION (SAM) via Clinical Edema',
      diagnosticIndicator: 'Bilateral pitting edema present',
      isSam: true,
      whoThresholds,
      zScoreCategory,
      exactSdDiffKg: Number(diffFromSd3.toFixed(2)),
      wflZScore,
      wfaZScore,
      lfaZScore,
    };
  }

  // Condition 2: Weight below -3 SD threshold
  if (weight_kg < whoThresholds.sd3neg) {
    return {
      anthropometricProfile: { weight_kg, height_cm, sex, age_months },
      classificationStatus: 'SEVERE ACUTE MALNUTRITION (SAM) via Severe Wasting (WHZ < -3)',
      diagnosticIndicator:
        'Weight is below -3 Standard Deviations on the WHO Weight-for-Length Growth Standard',
      isSam: true,
      whoThresholds,
      zScoreCategory,
      exactSdDiffKg: Number(diffFromSd3.toFixed(2)),
      wflZScore,
      wfaZScore,
      lfaZScore,
    };
  }

  // Otherwise: Moderate Malnutrition / Verify Clinical Criteria
  return {
    anthropometricProfile: { weight_kg, height_cm, sex, age_months },
    classificationStatus: 'Moderate Malnutrition / Verify Clinical Criteria',
    diagnosticIndicator: `Weight (${weight_kg.toFixed(1)} kg) is at or above -3 SD threshold (${whoThresholds.sd3neg.toFixed(1)} kg for ${height_cm} cm) with no bilateral pitting edema. Check mid-upper arm circumference (MUAC) and medical complications.`,
    isSam: false,
    whoThresholds,
    zScoreCategory,
    exactSdDiffKg: Number(diffFromSd3.toFixed(2)),
    wflZScore,
    wfaZScore,
    lfaZScore,
  };
}

/**
 * Execute Part 2: Liquid Volume Calculation Logic
 */
export function calculateFeedingTargets(
  weight_kg: number,
  therapeutic_phase: TherapeuticPhase,
  edema_severity: EdemaSeverity,
  feeding_interval_hours: FeedingInterval
): FeedingTargetSummary {
  let mlPerKgPerDay = 130;
  let safeMinMlPerKg = 105;

  if (therapeutic_phase === 'F-75 Stabilization') {
    if (edema_severity === 'Severe (+++)') {
      mlPerKgPerDay = 100;
      safeMinMlPerKg = 80;
    } else {
      mlPerKgPerDay = 130;
      safeMinMlPerKg = 105;
    }
  } else if (therapeutic_phase === 'F-100 Rehabilitation') {
    mlPerKgPerDay = 150;
    safeMinMlPerKg = 120;
  }

  const dailyVolume = Math.round(weight_kg * mlPerKgPerDay);
  const safeMinimumVolume = Math.round(weight_kg * safeMinMlPerKg);

  // Map feeds per day: 2-hourly = 12, 3-hourly = 8, 4-hourly = 6
  const feedsMap: Record<FeedingInterval, number> = {
    2: 12,
    3: 8,
    4: 6,
  };
  const feedsPerDay = feedsMap[feeding_interval_hours] || 8;

  const unroundedPerFeed = dailyVolume / feedsPerDay;
  // Target Volume Per Feed = (Daily Volume ÷ feeds per day), rounded to nearest multiple of 5 mL
  const targetVolumePerFeed = Math.round(unroundedPerFeed / 5) * 5;

  return {
    targetVolumePerFeed,
    unroundedPerFeed: Number(unroundedPerFeed.toFixed(1)),
    dailyVolume,
    safeMinimumVolume,
    feedsPerDay,
    feedingIntervalHours: feeding_interval_hours,
    mlPerKgPerDay,
    safeMinMlPerKg,
  };
}

/**
 * Execute Part 3: Local Raw Ingredient Recipe Logic
 */
export function calculateBatchRecipe(
  dailyVolume: number,
  therapeutic_phase: TherapeuticPhase,
  local_milk_source: LocalMilkSource
): BatchRecipeResult {
  const scaleFactor = dailyVolume / 1000;

  let milkBase: BatchRecipeItem;
  let sugarGrams = 0;
  let vegetableOilGrams = 0;
  let cerealFlourGrams = 0;
  let preparationStep = '';
  let energyKcalTotal = 0;

  if (therapeutic_phase === 'F-75 Stabilization') {
    sugarGrams = Number((scaleFactor * 70).toFixed(1));
    cerealFlourGrams = Number((scaleFactor * 35).toFixed(1));

    if (local_milk_source === 'Dried Skimmed Milk Powder') {
      milkBase = {
        name: 'Dried Skimmed Milk Powder',
        amount: Number((scaleFactor * 25).toFixed(1)),
        unit: 'g',
      };
      vegetableOilGrams = Number((scaleFactor * 30).toFixed(1));
    } else if (local_milk_source === 'Dried Whole Milk Powder') {
      milkBase = {
        name: 'Dried Whole Milk Powder',
        amount: Number((scaleFactor * 35).toFixed(1)),
        unit: 'g',
      };
      vegetableOilGrams = Number((scaleFactor * 20).toFixed(1));
    } else {
      // Fresh Cow / UHT Milk
      milkBase = {
        name: 'Fresh Whole Milk',
        amount: Number((scaleFactor * 300).toFixed(1)),
        unit: 'mL',
      };
      vegetableOilGrams = Number((scaleFactor * 20).toFixed(1));
    }

    preparationStep = `Mix ingredients with a small amount of warm water, boil gently for 4 minutes to cook the flour starch, cool, then top up with safe water exactly to the ${dailyVolume} mL line.`;
    // F-75 provides 75 kcal per 100 mL
    energyKcalTotal = Math.round(scaleFactor * 750);
  } else {
    // F-100 Rehabilitation
    cerealFlourGrams = 0;

    if (local_milk_source === 'Dried Skimmed Milk Powder') {
      milkBase = {
        name: 'Dried Skimmed Milk Powder',
        amount: Number((scaleFactor * 80).toFixed(1)),
        unit: 'g',
      };
      sugarGrams = Number((scaleFactor * 50).toFixed(1));
      vegetableOilGrams = Number((scaleFactor * 60).toFixed(1));
    } else if (local_milk_source === 'Dried Whole Milk Powder') {
      milkBase = {
        name: 'Dried Whole Milk Powder',
        amount: Number((scaleFactor * 110).toFixed(1)),
        unit: 'g',
      };
      sugarGrams = Number((scaleFactor * 50).toFixed(1));
      vegetableOilGrams = Number((scaleFactor * 30).toFixed(1));
    } else {
      // Fresh Cow / UHT Milk
      milkBase = {
        name: 'Fresh Whole Milk',
        amount: Number((scaleFactor * 880).toFixed(1)),
        unit: 'mL',
      };
      sugarGrams = Number((scaleFactor * 75).toFixed(1));
      vegetableOilGrams = Number((scaleFactor * 20).toFixed(1));
    }

    preparationStep = `Whisk ingredients with warm, pre-boiled water to dissolve, then top up with water exactly to the ${dailyVolume} mL line. Do not boil.`;
    // F-100 provides 100 kcal per 100 mL
    energyKcalTotal = Math.round(scaleFactor * 1000);
  }

  // Liquid CMV mineral solution: 20 mL per 1000 mL of milk
  const cmvLiquidMl = Number((scaleFactor * 20).toFixed(1));
  // Sugar percentage of total volume: (sugar weight in g / total volume in mL) * 100
  const sugarVolumePercentage = Number(((sugarGrams / dailyVolume) * 100).toFixed(1));
  const energyKcalPer100ml = therapeutic_phase === 'F-75 Stabilization' ? 75 : 100;

  return {
    dailyVolume,
    scaleFactor: Number(scaleFactor.toFixed(3)),
    milkBase,
    sugarGrams,
    vegetableOilGrams,
    cerealFlourGrams,
    cmvLiquidMl,
    preparationStep,
    sugarVolumePercentage,
    energyKcalTotal,
    energyKcalPer100ml,
  };
}

/**
 * Execute Part 4: Clinical Safety Verification Guardrails
 */
export function checkSafetyVerification(
  therapeutic_phase: TherapeuticPhase,
  edema_severity: EdemaSeverity,
  recipe?: BatchRecipeResult,
  customSugarGrams?: number,
  dailyVolume?: number
): SafetyVerificationResult {
  // Rule 2 Check: Fluid overload check in F-100 with severe edema
  if (therapeutic_phase === 'F-100 Rehabilitation' && edema_severity === 'Severe (+++)') {
    return {
      rule1F75OsmolalityTriggered: false,
      sugarPercentageOfVolume: 0,
      rule2FluidOverloadHalted: true,
      rule2ErrorText:
        'CRITICAL SAFETY ERROR: F-100 is strictly contraindicated while severe edema is present due to acute risk of heart failure. Return patient to F-75 stabilization phase immediately.',
      allClear: false,
    };
  }

  // Rule 1 Check: F-75 High Osmolality Check
  let rule1F75OsmolalityTriggered = false;
  let rule1NoticeText: string | undefined = undefined;

  const currentVolume = dailyVolume || (recipe ? recipe.dailyVolume : 0);
  const sugarG = customSugarGrams !== undefined ? customSugarGrams : recipe ? recipe.sugarGrams : 0;
  const sugarRatio = currentVolume > 0 ? sugarG / currentVolume : 0;
  const sugarPercent = Number((sugarRatio * 100).toFixed(1));

  if (therapeutic_phase === 'F-75 Stabilization' && sugarRatio > 0.1) {
    rule1F75OsmolalityTriggered = true;
    rule1NoticeText =
      'Verification Check: Re-verify sugar weight accuracy to prevent osmotic diarrhea.';
  }

  return {
    rule1F75OsmolalityTriggered,
    rule1NoticeText,
    sugarPercentageOfVolume: sugarPercent,
    rule2FluidOverloadHalted: false,
    allClear: !rule1F75OsmolalityTriggered,
  };
}

/**
 * Generate Clinical Directive Alert
 */
export function generateClinicalDirective(
  therapeutic_phase: TherapeuticPhase,
  safeMinimumVolume: number
): ClinicalDirectiveResult {
  if (therapeutic_phase === 'F-75 Stabilization') {
    return {
      therapeuticPhase: 'F-75 Stabilization',
      directiveText: `Monitor intake closely. If a child takes less than the ${safeMinimumVolume} mL threshold for 2 consecutive feeds, evaluate for Nasogastric (NG) tube placement.`,
    };
  } else {
    return {
      therapeuticPhase: 'F-100 Rehabilitation',
      directiveText:
        'Ensure the child has completed a successful 48-hour transition protocol at uniform volumes before expanding to full catch-up milk amounts.',
    };
  }
}

/**
 * Master evaluation function linking Part 1, 2, 3, 4
 */
export function evaluatePatient(input: CalculationInput): FullEvaluationResult {
  let growthAssessment: GrowthAssessmentResult | undefined = undefined;

  // Part 1: Diagnostic Logic
  if (input.calculation_mode === 'Full WHO Assessment + Calculator') {
    const height = input.height_cm ?? 60.0;
    const sex = input.sex ?? 'Boy';
    growthAssessment = evaluateGrowthStatus(
      input.weight_kg,
      height,
      sex,
      input.edema_severity,
      input.age_months
    );
  }

  // Part 2: Liquid Volume Targets
  const feedingSummary = calculateFeedingTargets(
    input.weight_kg,
    input.therapeutic_phase,
    input.edema_severity,
    input.feeding_interval_hours
  );

  // Preliminary recipe calculation (if Rule 2 is not halting)
  const initialRecipe = calculateBatchRecipe(
    feedingSummary.dailyVolume,
    input.therapeutic_phase,
    input.local_milk_source
  );

  // Part 4: Safety Verification Guardrails
  const safety = checkSafetyVerification(
    input.therapeutic_phase,
    input.edema_severity,
    initialRecipe,
    undefined,
    feedingSummary.dailyVolume
  );

  // If Rule 2 triggers, halt recipe display
  const recipe = safety.rule2FluidOverloadHalted ? undefined : initialRecipe;

  // Clinical Directive Alert
  const clinicalDirective = generateClinicalDirective(
    input.therapeutic_phase,
    feedingSummary.safeMinimumVolume
  );

  return {
    input,
    growthAssessment,
    feedingSummary,
    recipe,
    safety,
    clinicalDirective,
    timestamp: new Date().toISOString(),
  };
}
