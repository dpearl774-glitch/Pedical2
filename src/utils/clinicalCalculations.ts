/**
 * Clinical Decision-Support Engine for Inpatient Pediatric Acute Malnutrition Management
 * Implements the WHO 2023 Guideline on the Prevention and Management of Wasting and
 * Nutritional Oedema (Acute Malnutrition) in Infants and Children Under 5 Years,
 * alongside established WHO F-75/F-100 therapeutic milk formulation standards,
 * zero-hallucination deterministic calculations, and physiological safety guardrails.
 */

export const WHO_GUIDELINE_EDITION = 'WHO 2023 Guideline & 2026 Implementation Guidance';
export const WHO_GUIDELINE_FULL_TITLE =
  'WHO guideline on the prevention and management of wasting and nutritional oedema (acute malnutrition) in infants and children under 5 years (2023)';
export const WHO_2026_IMPLEMENTATION_GUIDANCE_TITLE =
  'WHO Implementation guidance for the prevention and management of wasting and nutritional oedema in infants and children, covering inpatient and outpatient management, including infants under six months (Published 17 September 2026)';
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
export type F75Type = 'Standard (Milk-based / Non-cereal)' | 'Cereal-based (Low Osmolality)';
export type F100Type = 'Standard (Milk-based / Non-cereal)' | 'Cereal-based (Low Osmolality)';
export type EdemaSeverity = 'None' | 'Mild/Moderate (+ / ++)' | 'Severe (+++)';
export type FeedingInterval = 2 | 3 | 4;
export type LocalMilkSource =
  | 'Dried Skimmed Milk Powder'
  | 'Dried Whole Milk Powder'
  | 'Fresh Cow / UHT Milk';
export type ChildSex = 'Boy' | 'Girl';

export type InfantUnder6mFeedingScenario =
  | 'breastfed_sst' // Breastfed with mother present: Supplementary Suckling Technique (EBM or Diluted F-100)
  | 'non_breastfed_formula' // Non-breastfed / mother absent: Infant Formula or Diluted F-100
  | 'edematous_unstable'; // Bilateral oedema or medically unstable: Inpatient Phase 1 stabilization

export type FluidClinicalScenario =
  | 'euvolemic' // Normal hydration, no acute diarrhea
  | 'dehydration_no_shock' // Profuse watery diarrhea/vomiting without circulatory shock -> oral/NG ReSoMal
  | 'circulatory_shock' // Emergency shock (lethargic, cold extremities, CRT > 3s, weak pulse) -> Emergency IV fluids
  | 'oedema_no_diarrhea' // Kwashiorkor/edema without diarrhea -> rehydration strictly withheld
  | 'oedema_watery_diarrhea'; // Kwashiorkor with confirmed watery diarrhea -> cautious ReSoMal under strict monitoring

export interface CalculationInput {
  patient_id?: string;
  cot_number?: string;
  patient_name?: string;
  mrn?: string;
  age_months?: number;
  calculation_mode: CalculationMode;
  weight_kg: number;
  therapeutic_phase: TherapeuticPhase;
  f75_type?: F75Type;
  f100_type?: F100Type;
  edema_severity: EdemaSeverity;
  feeding_interval_hours: FeedingInterval;
  local_milk_source: LocalMilkSource;
  height_cm?: number;
  sex?: ChildSex;
  muac_mm?: number;
  head_circumference_cm?: number;
  infant_scenario?: InfantUnder6mFeedingScenario;
  fluid_scenario?: FluidClinicalScenario;
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
  formulaCategory:
    | 'Standard F-75 (Milk-based / Non-cereal)'
    | 'Cereal-based F-75 (Low Osmolality)'
    | 'F-75 Stabilization'
    | 'Standard F-100 (Milk-based / Non-cereal)'
    | 'Cereal-based F-100 (Low Osmolality)';
  f75Type?: F75Type;
  f100Type?: F100Type;
  milkBase: BatchRecipeItem;
  sugarGrams: number;
  vegetableOilGrams: number;
  cerealFlourGrams: number;
  cmvLiquidMl: number; // Liquid CMV solution in mL (20 mL per 1,000 mL milk formula)
  preparationStep: string;
  sugarVolumePercentage: number;
  energyKcalTotal: number;
  energyKcalPer100ml: number;
  estimatedOsmolalityMOsmKg: number;
  clinicalIndicationNote: string;
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
 * Accurately implements WHO recipes for:
 * 1. F-75 Stabilization (35g cereal flour, 70g sugar, low sodium/protein, ~330 mOsm/kg)
 * 2. Standard F-100 (Non-cereal milk-based: 0g flour, 50g sugar, 100 kcal/100 mL, ~419 mOsm/kg)
 * 3. Cereal-based F-100 (35g cereal flour, 25g sugar, low osmolality ~300 mOsm/kg for osmotic diarrhea)
 */
export function calculateBatchRecipe(
  dailyVolume: number,
  therapeutic_phase: TherapeuticPhase,
  local_milk_source: LocalMilkSource,
  f100_type: F100Type = 'Standard (Milk-based / Non-cereal)',
  f75_type: F75Type = 'Standard (Milk-based / Non-cereal)'
): BatchRecipeResult {
  const scaleFactor = dailyVolume / 1000;

  let milkBase: BatchRecipeItem;
  let sugarGrams = 0;
  let vegetableOilGrams = 0;
  let cerealFlourGrams = 0;
  let preparationStep = '';
  let energyKcalTotal = 0;
  let formulaCategory: BatchRecipeResult['formulaCategory'];
  let estimatedOsmolalityMOsmKg = 333;
  let clinicalIndicationNote = '';

  if (therapeutic_phase === 'F-75 Stabilization') {
    const isCerealBasedF75 = f75_type === 'Cereal-based (Low Osmolality)';

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

    if (isCerealBasedF75) {
      formulaCategory = 'Cereal-based F-75 (Low Osmolality)';
      estimatedOsmolalityMOsmKg = 280;
      // In Cereal-based F-75, cooked cereal flour (35g/L) replaces 50% of the simple sugar (35g/L vs 70g/L), reducing osmolality from ~333 to ~280 mOsm/kg
      cerealFlourGrams = Number((scaleFactor * 35).toFixed(1));
      sugarGrams = Number((scaleFactor * 35).toFixed(1)); // Reduced sugar (50% reduction)

      preparationStep = `Mix cereal flour (${cerealFlourGrams}g) and sugar (${sugarGrams}g) in cold safe water. Boil gently for 4–5 minutes to cook and gelatinize the starch, hydrolyzing it into low-osmolar dextrins. Remove from heat and allow to cool below 40°C. Whisk in ${milkBase.amount} ${milkBase.unit} of ${milkBase.name}, ${vegetableOilGrams}g vegetable oil, and ${Number((scaleFactor * 20).toFixed(1))} mL CMV solution. Top up with safe water exactly to the ${dailyVolume} mL mark.`;
      energyKcalTotal = Math.round(scaleFactor * 750);
      clinicalIndicationNote =
        'Cereal-based F-75 is formulated with 35 g/L cooked cereal flour replacing 50% simple sugar, lowering osmolality from ~333 to ~280 mOsm/kg. Indicated during Phase 1 stabilization for children with severe persistent osmotic diarrhea, profuse watery stools, or carbohydrate malabsorption. NOTE: Strictly contraindicated in infants under 6 months due to immature pancreatic amylase.';
    } else {
      formulaCategory = 'Standard F-75 (Milk-based / Non-cereal)';
      estimatedOsmolalityMOsmKg = 333;
      cerealFlourGrams = 0; // Explicitly zero flour in non-cereal F-75
      sugarGrams = Number((scaleFactor * 70).toFixed(1));

      preparationStep = `Dissolve milk powder (${milkBase.amount} ${milkBase.unit}), sugar (${sugarGrams}g), and vegetable oil (${vegetableOilGrams}g) into warm, pre-boiled safe water. Add ${Number((scaleFactor * 20).toFixed(1))} mL liquid CMV solution and whisk until smooth. Top up with safe water exactly to the ${dailyVolume} mL mark. Do not boil once milk is added (boiling denatures therapeutic milk proteins).`;
      energyKcalTotal = Math.round(scaleFactor * 750);
      clinicalIndicationNote =
        'Standard non-cereal F-75 is the primary Phase 1 stabilization formula (75 kcal/100 mL, 0.9g protein/100 mL, ~333 mOsm/kg) designed to restore cellular homeostasis, avoid sodium/protein overload, and prevent refeeding syndrome.';
    }
  } else {
    // F-100 Rehabilitation: Check whether Standard (Non-Cereal) or Cereal-Based
    const isCerealBased = f100_type === 'Cereal-based (Low Osmolality)';

    if (isCerealBased) {
      formulaCategory = 'Cereal-based F-100 (Low Osmolality)';
      estimatedOsmolalityMOsmKg = 300;
      // In Cereal-based F-100, cooked cereal flour (35g/L) replaces half the sugar (25g/L vs 50g/L), lowering osmolarity to ~300 mOsm/kg
      cerealFlourGrams = Number((scaleFactor * 35).toFixed(1));

      if (local_milk_source === 'Dried Skimmed Milk Powder') {
        milkBase = {
          name: 'Dried Skimmed Milk Powder',
          amount: Number((scaleFactor * 80).toFixed(1)),
          unit: 'g',
        };
        sugarGrams = Number((scaleFactor * 25).toFixed(1)); // Reduced sugar
        vegetableOilGrams = Number((scaleFactor * 60).toFixed(1));
      } else if (local_milk_source === 'Dried Whole Milk Powder') {
        milkBase = {
          name: 'Dried Whole Milk Powder',
          amount: Number((scaleFactor * 110).toFixed(1)),
          unit: 'g',
        };
        sugarGrams = Number((scaleFactor * 25).toFixed(1)); // Reduced sugar
        vegetableOilGrams = Number((scaleFactor * 30).toFixed(1));
      } else {
        // Fresh Cow / UHT Milk
        milkBase = {
          name: 'Fresh Whole Milk',
          amount: Number((scaleFactor * 880).toFixed(1)),
          unit: 'mL',
        };
        sugarGrams = Number((scaleFactor * 35).toFixed(1)); // Reduced sugar (from 75g down to 35g)
        vegetableOilGrams = Number((scaleFactor * 20).toFixed(1));
      }

      preparationStep = `Mix cereal flour (${cerealFlourGrams}g) and sugar (${sugarGrams}g) in cold safe water. Boil gently for 4–5 minutes to cook and gelatinize the starch, hydrolyzing it into low-osmolar dextrins. Remove from heat and allow to cool below 40°C. Whisk in ${milkBase.amount} ${milkBase.unit} of ${milkBase.name}, ${vegetableOilGrams}g vegetable oil, and ${Number((scaleFactor * 20).toFixed(1))} mL CMV solution. Top up with safe water exactly to the ${dailyVolume} mL mark.`;
      energyKcalTotal = Math.round(scaleFactor * 1000);
      clinicalIndicationNote =
        'Cereal-based F-100 is indicated for children developing persistent osmotic diarrhea or watery stools on standard F-100. Cooked cereal starch hydrolyzes into low-osmolar maltodextrins, reducing osmolality from ~419 to ~300 mOsm/kg. NOTE: Strictly contraindicated in infants under 6 months due to immature pancreatic amylase.';
    } else {
      // Standard (Milk-based / Non-cereal) F-100
      formulaCategory = 'Standard F-100 (Milk-based / Non-cereal)';
      estimatedOsmolalityMOsmKg = 419;
      cerealFlourGrams = 0; // Explicitly zero flour in non-cereal F-100

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

      preparationStep = `Dissolve milk powder (${milkBase.amount} ${milkBase.unit}), sugar (${sugarGrams}g), and vegetable oil (${vegetableOilGrams}g) into warm, pre-boiled safe water. Add ${Number((scaleFactor * 20).toFixed(1))} mL liquid CMV solution and whisk until smooth. Top up with safe water exactly to the ${dailyVolume} mL mark. Do not boil once milk is added (boiling denatures high milk proteins).`;
      // F-100 provides 100 kcal per 100 mL
      energyKcalTotal = Math.round(scaleFactor * 1000);
      clinicalIndicationNote =
        'Standard non-cereal F-100 is the default catch-up growth formula for Transition & Phase 2 (100 kcal/100 mL, 2.9g protein/100 mL, ~419 mOsm/kg). Also used as the base for preparing Diluted F-100 for infants under 6 months.';
    }
  }

  // Liquid CMV mineral solution: 20 mL per 1000 mL of milk
  const cmvLiquidMl = Number((scaleFactor * 20).toFixed(1));
  // Sugar percentage of total volume: (sugar weight in g / total volume in mL) * 100
  const sugarVolumePercentage = Number(((sugarGrams / dailyVolume) * 100).toFixed(1));
  const energyKcalPer100ml = therapeutic_phase === 'F-75 Stabilization' ? 75 : 100;

  return {
    dailyVolume,
    scaleFactor: Number(scaleFactor.toFixed(3)),
    formulaCategory,
    f75Type: therapeutic_phase === 'F-75 Stabilization' ? f75_type : undefined,
    f100Type: therapeutic_phase === 'F-100 Rehabilitation' ? f100_type : undefined,
    milkBase,
    sugarGrams,
    vegetableOilGrams,
    cerealFlourGrams,
    cmvLiquidMl,
    preparationStep,
    sugarVolumePercentage,
    energyKcalTotal,
    energyKcalPer100ml,
    estimatedOsmolalityMOsmKg,
    clinicalIndicationNote,
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
    input.local_milk_source,
    input.f100_type,
    input.f75_type
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

/**
 * Emergency IV Fluid Resuscitation Protocol for SAM in Circulatory Shock
 * Aligned with WHO 2023 Guidelines, WHO Sept 2026 Implementation Guidance & GHS IMAM Protocols.
 *
 * CRITICAL CLINICAL DIFFERENTIATION:
 * - Simple dehydration (alert, drinking, no shock): treated with ORAL ReSoMal.
 * - Circulatory shock (lethargic, limp, cold extremities, capillary refill >3s, weak/absent rapid pulse):
 *   Oral fluids CANNOT be given. IV resuscitation is life-saving, but requires strict cardiac surveillance.
 * - Fluid: Half-Strength Darrow's with 5% Dextrose OR Ringer's Lactate with 5% Dextrose.
 * - Rate: 15 mL/kg infused over 1 hour.
 * - NEVER use standard normal saline bolus (20 mL/kg) or rapid push in SAM.
 */
export interface ShockResuscitationResult {
  weight_kg: number;
  bolusRateMlPerHour: number; // 15 mL/kg/h
  bolusRateDropsPerMinMicro: number; // microdrip 60 gtt/mL
  recommendedFluids: string[];
  monitoringIntervalMinutes: number; // 10 minutes
  warningSignsOfHeartFailure: string[];
  reassessmentSteps: {
    ifImproved: string;
    ifNotImprovedAfter1Hour: string;
    ifHeartFailureSigns: string;
  };
}

export function calculateShockResuscitation(weight_kg: number): ShockResuscitationResult {
  const bolusRateMlPerHour = Math.round(weight_kg * 15);
  // Microdrip (60 drops/mL): rate in mL/h equals drops/min
  const bolusRateDropsPerMinMicro = bolusRateMlPerHour;

  return {
    weight_kg,
    bolusRateMlPerHour,
    bolusRateDropsPerMinMicro,
    recommendedFluids: [
      "Half-strength Darrow's solution with 5% Dextrose (Preferred in GHS & WHO)",
      "Ringer's Lactate with 5% Dextrose (Alternative if Darrow's unavailable)",
      "0.45% Saline (Half-Normal Saline) with 5% Dextrose (Second alternative)",
    ],
    monitoringIntervalMinutes: 10,
    warningSignsOfHeartFailure: [
      'Respiratory rate increases by >= 5 breaths per minute from baseline',
      'Pulse rate increases by >= 15 beats per minute from baseline',
      'Development of basal lung crepitations / rales',
      'Liver enlargement (tender liver margin palpated lower in abdomen)',
      'Jugular venous distension or acute facial puffiness',
    ],
    reassessmentSteps: {
      ifImproved:
        'Pulse slows, capillary refill < 3 seconds, extremities warm: STOP IV fluids immediately. Switch to oral or NG ReSoMal at 10 mL/kg/h for up to 10 hours alternating with F-75.',
      ifNotImprovedAfter1Hour:
        'Child still in shock: Give second IV infusion of 15 mL/kg over 1 hour. If still unimproved, suspect septic shock or severe anemia; initiate whole blood transfusion (10 mL/kg packed cells over 3 hours) and broad-spectrum IV antibiotics.',
      ifHeartFailureSigns:
        'STOP IV infusion immediately! Do not administer further fluids. Administer IV Furosemide (1 mg/kg) if pulmonary edema is present, keep child warm, and elevate head of bed.',
    },
  };
}

/**
 * Diluted F-100 Formulation for Supplementary Suckling Technique (SST) & Infants <6 Months
 * Aligned with WHO 2023 Guidelines & 17 September 2026 Implementation Guidance.
 */
export interface DilutedF100RecipeResult {
  dailyVolumeTargetMl: number;
  preparationInstructions: string;
  energyKcalPer100ml: number;
  clinicalObjective: string;
}

export function calculateDilutedF100Recipe(dailyVolumeTargetMl: number): DilutedF100RecipeResult {
  return {
    dailyVolumeTargetMl,
    preparationInstructions:
      'Prepare Standard (Milk-based / Non-cereal) F-100, then dilute by adding 30% extra safe water (e.g., take 100 mL of prepared Standard F-100 and add 30 mL clean boiled water to make 130 mL of Diluted F-100; or dissolve 100g F-100 powder in 1,300 mL water instead of 1,000 mL). NOTE: NEVER use Cereal-based F-100 to prepare Diluted F-100 because infants under 6 months cannot enzymatically digest cereal starches.',
    energyKcalPer100ml: 77,
    clinicalObjective:
      'Provides ~77 kcal/100 mL with safe osmolar and renal solute load tailored to immature glomerular filtration in infants <6 months undergoing Supplementary Suckling Technique (SST) or replacement feeding. Formulated exclusively with Standard (non-cereal) milk base.',
  };
}

