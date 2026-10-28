/**
 * Clinical Decision-Support Engine for Inpatient Pediatric Acute Malnutrition Management
 * Implements the WHO 2023 Guideline on the Prevention and Management of Wasting and
 * Nutritional Oedema (Acute Malnutrition) in Infants and Children Under 5 Years,
 * alongside established WHO F-75/F-100 therapeutic milk formulation standards,
 * zero-hallucination deterministic calculations, and physiological safety guardrails.
 */

export const WHO_GUIDELINE_EDITION = 'WHO 2023 Guideline';
export const WHO_GUIDELINE_FULL_TITLE =
  'WHO guideline on the prevention and management of wasting and nutritional oedema (acute malnutrition) in infants and children under 5 years (2023)';
export const WHO_FORMULA_STANDARD_REF =
  'WHO Inpatient Management Protocols (F-75 Stabilization & F-100 Rehabilitation Standards)';
export const GHANA_IMAM_GUIDELINE_TITLE =
  'Ghana Health Service (GHS) / UNICEF National Guidelines for Integrated Management of Acute Malnutrition (IMAM) & CMAM Protocols';
export const GHANA_MOH_GHS_EDITION = 'Ghana Health Service (GHS) / UNICEF IMAM Protocols';


import {
  getWHOThresholds,
  getWHOWfaThresholds,
  getWHOLfaThresholds,
  getWHOHcfaThresholds,
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
  muac_mm?: number;
  head_circumference_cm?: number;
}

export interface GrowthAssessmentResult {
  anthropometricProfile: {
    weight_kg: number;
    height_cm: number;
    sex: ChildSex;
    age_months?: number;
    muac_mm?: number;
    head_circumference_cm?: number;
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
  muacStatus?: 'Red (< 115 mm - SAM)' | 'Yellow (115-124 mm - MAM)' | 'Green (≥ 125 mm - Normal)' | 'Not Recorded';
  headCircumferenceStatus?: 'Microcephaly (< -2 SD)' | 'Normal (Median ± 2 SD)' | 'Macrocephaly (> +2 SD)' | 'Not Recorded';
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
  // Dietitian Macronutrient Delivery Metrics
  dailyEnergyKcal: number;
  energyKcalPerKgDay: number;
  dailyProteinGrams: number;
  proteinGramsPerKgDay: number;
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
  age_months?: number,
  muac_mm?: number,
  head_circumference_cm?: number
): GrowthAssessmentResult {
  const whoThresholds = getWHOThresholds(height_cm, sex);
  const diffFromSd3 = weight_kg - whoThresholds.sd3neg;

  // MUAC status evaluation for pediatric nutritionists
  let muacStatus: GrowthAssessmentResult['muacStatus'] = 'Not Recorded';
  if (muac_mm !== undefined && muac_mm > 0) {
    if (muac_mm < 115) {
      muacStatus = 'Red (< 115 mm - SAM)';
    } else if (muac_mm <= 124) {
      muacStatus = 'Yellow (115-124 mm - MAM)';
    } else {
      muacStatus = 'Green (≥ 125 mm - Normal)';
    }
  }

  // Head Circumference evaluation (OFC for microcephaly/macrocephaly)
  let headCircumferenceStatus: GrowthAssessmentResult['headCircumferenceStatus'] = 'Not Recorded';
  if (head_circumference_cm !== undefined && head_circumference_cm > 0 && age_months !== undefined && age_months >= 0) {
    const hcTh = getWHOHcfaThresholds(age_months, sex);
    if (head_circumference_cm < hcTh.sd2neg) {
      headCircumferenceStatus = 'Microcephaly (< -2 SD)';
    } else if (head_circumference_cm > hcTh.sd2) {
      headCircumferenceStatus = 'Macrocephaly (> +2 SD)';
    } else {
      headCircumferenceStatus = 'Normal (Median ± 2 SD)';
    }
  }

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

  const isMuacSam = muac_mm !== undefined && muac_mm > 0 && muac_mm < 115;

  // Condition 1: Bilateral clinical edema (+ / ++ or +++)
  if (edema_severity === 'Mild/Moderate (+ / ++)' || edema_severity === 'Severe (+++)') {
    return {
      anthropometricProfile: { weight_kg, height_cm, sex, age_months, muac_mm, head_circumference_cm },
      classificationStatus: 'ACUTE MALNUTRITION: Nutritional Oedema (WHO 2023)',
      diagnosticIndicator: 'Bilateral pitting oedema present (inpatient stabilization required)',
      isSam: true,
      whoThresholds,
      zScoreCategory,
      exactSdDiffKg: Number(diffFromSd3.toFixed(2)),
      wflZScore,
      wfaZScore,
      lfaZScore,
      muacStatus,
      headCircumferenceStatus,
    };
  }

  // Condition 2: Weight below -3 SD threshold or MUAC < 115 mm
  if (weight_kg < whoThresholds.sd3neg || isMuacSam) {
    const reason = isMuacSam && weight_kg >= whoThresholds.sd3neg
      ? `MUAC is ${muac_mm} mm (< 115 mm cutoff for Severe Acute Malnutrition)`
      : 'Weight is below -3 Standard Deviations on the WHO Weight-for-Length Growth Standard';

    return {
      anthropometricProfile: { weight_kg, height_cm, sex, age_months, muac_mm, head_circumference_cm },
      classificationStatus: 'ACUTE MALNUTRITION: Severe Wasting (WHO 2023)',
      diagnosticIndicator: reason,
      isSam: true,
      whoThresholds,
      zScoreCategory,
      exactSdDiffKg: Number(diffFromSd3.toFixed(2)),
      wflZScore,
      wfaZScore,
      lfaZScore,
      muacStatus,
      headCircumferenceStatus,
    };
  }

  // Otherwise: Moderate Malnutrition / Verify Clinical Criteria
  return {
    anthropometricProfile: { weight_kg, height_cm, sex, age_months, muac_mm, head_circumference_cm },
    classificationStatus: 'Moderate Wasting / Clinical Verification (WHO 2023)',
    diagnosticIndicator: `Weight (${weight_kg.toFixed(1)} kg) is at or above -3 SD threshold (${whoThresholds.sd3neg.toFixed(1)} kg for ${height_cm} cm) with no bilateral pitting oedema. Check MUAC (${muac_mm ? `${muac_mm} mm` : 'not logged'}) and medical complications.`,
    isSam: false,
    whoThresholds,
    zScoreCategory,
    exactSdDiffKg: Number(diffFromSd3.toFixed(2)),
    wflZScore,
    wfaZScore,
    lfaZScore,
    muacStatus,
    headCircumferenceStatus,
  };
}

/**
 * Execute Part 2: Liquid Volume Calculation Logic & Macronutrient Breakdown
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

  // Dietitian Macronutrient Delivery
  // F-75: 75 kcal/100 mL, 0.9g protein/100 mL
  // F-100: 100 kcal/100 mL, 2.9g protein/100 mL
  const energyPer100ml = therapeutic_phase === 'F-75 Stabilization' ? 75 : 100;
  const proteinPer100ml = therapeutic_phase === 'F-75 Stabilization' ? 0.9 : 2.9;

  const dailyEnergyKcal = Math.round((dailyVolume * energyPer100ml) / 100);
  const energyKcalPerKgDay = Number((dailyEnergyKcal / weight_kg).toFixed(1));
  const dailyProteinGrams = Number(((dailyVolume * proteinPer100ml) / 100).toFixed(1));
  const proteinGramsPerKgDay = Number((dailyProteinGrams / weight_kg).toFixed(1));

  return {
    targetVolumePerFeed,
    unroundedPerFeed: Number(unroundedPerFeed.toFixed(1)),
    dailyVolume,
    safeMinimumVolume,
    feedsPerDay,
    feedingIntervalHours: feeding_interval_hours,
    mlPerKgPerDay,
    safeMinMlPerKg,
    dailyEnergyKcal,
    energyKcalPerKgDay,
    dailyProteinGrams,
    proteinGramsPerKgDay,
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
      directiveText: `Monitor intake closely. If a child takes less than the ${safeMinimumVolume} mL threshold for 2 consecutive feeds, evaluate for Nasogastric (NG) tube placement. In accordance with WHO 2023 guidelines, assess appetite daily once medical complications stabilize to prepare for transition to RUTF or Phase 2.`,
    };
  } else {
    return {
      therapeuticPhase: 'F-100 Rehabilitation',
      directiveText:
        'Ensure the child has completed a successful 48-hour transition protocol at uniform volumes. Per WHO 2023 guidelines, prioritize transition to Ready-to-Use Therapeutic Food (RUTF) as soon as appetite is sustained and oedema has resolved.',
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
      input.age_months,
      input.muac_mm,
      input.head_circumference_cm
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

/**
 * ReSoMal (Rehydration Solution for Malnutrition) Protocol Engine
 * Standardized according to Ghana Health Service (GHS) IMAM & WHO Clinical Guidelines.
 *
 * Safe Administration Rationale:
 * - SAM children have defective sodium pumps; intracellular sodium is high while serum potassium is low.
 * - Standard Low-Osmolarity ORS contains 75 mmol/L Na+, which causes acute hypernatremic fluid overload and heart failure.
 * - ReSoMal contains 45 mmol/L Na+, 40 mmol/L K+, plus zinc and magnesium.
 * - In Ghana Health Service protocols, ReSoMal is given at 5 mL/kg q30m for the first 2 hours,
 *   then 5-10 mL/kg/h alternating hourly with F-75 for up to 10 hours.
 * - Strictly CONTRAINDICATED in edematous malnutrition (Kwashiorkor) unless confirmed cholera or profuse watery diarrhea.
 */
export interface ReSoMalProtocolResult {
  weight_kg: number;
  hasEdema: boolean;
  isContraindicated: boolean;
  contraindicationWarning?: string;
  first2Hours: {
    volumePer30Min: number; // 5 mL/kg every 30 mins
    total2HourVolume: number; // 20 mL/kg over 2 hours
    numberOfDoses: number; // 4 doses
    frequencyText: string;
  };
  nextHoursAlternate: {
    minHourlyRateMl: number; // 5 mL/kg/h
    maxHourlyRateMl: number; // 10 mL/kg/h
    alternatingScheduleText: string;
    maxDurationHours: number; // 10 hours
  };
  looseStoolReplacement: {
    childAgeGroup: '< 2 years' | '>= 2 years';
    volumePerLooseStool: string;
  };
  recipe: {
    whoOrsPackets: number; // 1 standard 1L packet
    cleanWaterLiters: number; // 2.0 L
    sugarGrams: number; // 50 g
    cmvLiquidMl: number; // 40 mL
    instructions: string;
  };
  safetyMonitoringChecklist: {
    rule: string;
    trigger: string;
    action: string;
  }[];
}

export function calculateReSoMalProtocol(
  weight_kg: number,
  edema_severity: EdemaSeverity,
  age_months?: number
): ReSoMalProtocolResult {
  const hasEdema = edema_severity === 'Mild/Moderate (+ / ++)' || edema_severity === 'Severe (+++)';
  const isContraindicated = hasEdema;

  const contraindicationWarning = hasEdema
    ? 'CRITICAL CONTRAINDICATION: Bilateral pitting oedema (Kwashiorkor / Marasmic Kwashiorkor) is present. In Ghana Health Service (GHS) IMAM & WHO protocols, ReSoMal and IV rehydration fluids are strictly contraindicated in edematous malnutrition unless there is proven, profuse watery diarrhea or cholera with hypovolemic dehydration. Malnourished children with edema are already fluid-expanded; administering ReSoMal precipitates fatal acute heart failure and pulmonary edema.'
    : undefined;

  // First 2 hours: 5 mL/kg every 30 minutes for 2 hours (4 doses = 20 mL/kg total)
  const volumePer30Min = Math.round(weight_kg * 5);
  const total2HourVolume = volumePer30Min * 4;

  // Next hours: 5 to 10 mL/kg/hour alternating with F-75
  const minHourlyRateMl = Math.round(weight_kg * 5);
  const maxHourlyRateMl = Math.round(weight_kg * 10);

  const childAgeGroup: '< 2 years' | '>= 2 years' =
    age_months !== undefined && age_months < 24 ? '< 2 years' : '>= 2 years';

  const volumePerLooseStool =
    childAgeGroup === '< 2 years'
      ? '50 – 100 mL after each loose watery stool'
      : '100 – 200 mL after each loose watery stool';

  return {
    weight_kg,
    hasEdema,
    isContraindicated,
    contraindicationWarning,
    first2Hours: {
      volumePer30Min,
      total2HourVolume,
      numberOfDoses: 4,
      frequencyText: `Give ${volumePer30Min} mL every 30 minutes orally (cup & spoon) or by NG tube for the first 2 hours (${total2HourVolume} mL total).`,
    },
    nextHoursAlternate: {
      minHourlyRateMl,
      maxHourlyRateMl,
      alternatingScheduleText: `Give ${minHourlyRateMl}–${maxHourlyRateMl} mL/hour alternating hourly with F-75 therapeutic milk (Hour 3: ReSoMal, Hour 4: F-75, Hour 5: ReSoMal, Hour 6: F-75...) for up to 10 hours maximum until rehydration is complete.`,
      maxDurationHours: 10,
    },
    looseStoolReplacement: {
      childAgeGroup,
      volumePerLooseStool,
    },
    recipe: {
      whoOrsPackets: 1,
      cleanWaterLiters: 2.0,
      sugarGrams: 50,
      cmvLiquidMl: 40,
      instructions:
        'Dissolve 1 standard 1-Litre WHO Low-Osmolarity ORS packet into 2.0 Litres of cooled, safe boiled water (NOT 1 Litre). Add 50 g of white commercial sugar (approx. 10 level teaspoons) and 40 mL of Combined Mineral Vitamin (CMV) liquid solution (or 1 sachet ReSoMal mineral mix). Mix thoroughly. Never administer standard undiluted ORS because its high sodium content (75 mmol/L) induces fatal hypernatremic fluid overload.',
    },
    safetyMonitoringChecklist: [
      {
        rule: 'Respiratory Rate (RR) Surveillance',
        trigger: 'RR increases by >= 5 breaths per minute from baseline',
        action: 'STOP ReSoMal immediately. Switch to maintenance F-75 or observe.',
      },
      {
        rule: 'Pulse Rate Surveillance',
        trigger: 'Pulse increases by >= 15 beats per minute from baseline',
        action: 'STOP ReSoMal immediately. Indicates cardiovascular volume overload.',
      },
      {
        rule: 'Oedema & Venous Engorgement Check',
        trigger: 'Puffy eyelids, facial swelling, engorged neck veins, or enlarging liver appear',
        action: 'STOP all oral and IV fluids immediately. Give 1 mg/kg IV Furosemide if acute pulmonary edema.',
      },
      {
        rule: 'Assessment Interval',
        trigger: 'First 2 hours: assess every 30 minutes; Hours 3 to 10: assess hourly',
        action: 'Record pulse, respiration, stool frequency, vomiting, and hydration signs on bedside flow sheet.',
      },
    ],
  };
}

/**
 * Calculates rate of weight gain (g/kg/day) for dietitians monitoring rehabilitation / catch-up growth
 */
export interface WeightGainRateResult {
  weightGainGramsDay: number;
  weightGainGPerKgDay: number;
  classification: 'Poor (< 5 g/kg/day)' | 'Moderate (5 - 10 g/kg/day)' | 'Good / Excellent (> 10 g/kg/day)';
  clinicalInterpretation: string;
}

export function calculateWeightGainRate(
  initialWeightKg: number,
  currentWeightKg: number,
  daysElapsed: number
): WeightGainRateResult {
  if (daysElapsed <= 0 || initialWeightKg <= 0) {
    return {
      weightGainGramsDay: 0,
      weightGainGPerKgDay: 0,
      classification: 'Poor (< 5 g/kg/day)',
      clinicalInterpretation: 'Insufficient observation period or invalid initial weight.',
    };
  }

  const weightDiffGrams = (currentWeightKg - initialWeightKg) * 1000;
  const weightGainGramsDay = Number((weightDiffGrams / daysElapsed).toFixed(1));
  const weightGainGPerKgDay = Number((weightGainGramsDay / initialWeightKg).toFixed(1));

  let classification: WeightGainRateResult['classification'] = 'Poor (< 5 g/kg/day)';
  let clinicalInterpretation = 'Poor weight gain (< 5 g/kg/day). Investigate persistent diarrhea, TB, HIV, UTI, anorexia, or feed refusal.';

  if (weightGainGPerKgDay >= 10) {
    classification = 'Good / Excellent (> 10 g/kg/day)';
    clinicalInterpretation = 'Good catch-up growth (> 10 g/kg/day). Continue rehabilitation plan and assess for outpatient OTP discharge.';
  } else if (weightGainGPerKgDay >= 5) {
    classification = 'Moderate (5 - 10 g/kg/day)';
    clinicalInterpretation = 'Moderate weight gain (5–10 g/kg/day). Verify feed compliance and dietary energy intake.';
  }

  return {
    weightGainGramsDay,
    weightGainGPerKgDay,
    classification,
    clinicalInterpretation,
  };
}

