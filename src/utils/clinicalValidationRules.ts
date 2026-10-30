/**
 * Software Implementation Invariant Suite for PediCal
 * 
 * IMPORTANT CLINICAL GOVERNANCE NOTICE:
 * These automated unit tests demonstrate that the programmed mathematical algorithms,
 * conditional branches, volume targets, and safety interlocks execute as coded without
 * computational drift.
 * 
 * Software test passes do NOT, in isolation, establish the empirical clinical correctness
 * or medical appropriateness of treatment guidelines. Clinical validity is grounded in
 * peer-reviewed empirical evidence, specifically:
 * - WHO 2023 Guideline on the Prevention and Management of Wasting and Nutritional Oedema
 * - WHO Implementation Guidance (covering Inpatient/Outpatient Care & Infants <6m, published 17 Sept 2026)
 * - Ghana Health Service (GHS) / UNICEF National IMAM Guidelines
 * 
 * Final clinical decisions must always be made by a licensed healthcare provider at the bedside.
 */

import {
  evaluatePatient,
  calculateFeedingTargets,
  calculateBatchRecipe,
  calculateReSoMalProtocol,
  calculateShockResuscitation,
  calculateDilutedF100Recipe,
  CalculationInput,
} from './clinicalCalculations';
import { auditClinicalSafety, detectMuacUnitConfusion } from './clinicalSafetyAuditor';

export interface TestSuiteResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  failures: string[];
  executionTimeMs: number;
  clinicalGovernanceStatement: string;
}

export function runClinicalValidationSuite(): TestSuiteResult {
  const startTime = performance.now();
  const failures: string[] = [];
  let testCount = 0;
  let passedCount = 0;

  const assert = (condition: boolean, testName: string, detail?: string) => {
    testCount++;
    if (condition) {
      passedCount++;
    } else {
      failures.push(`${testName}: ${detail || 'Assertion failed'}`);
    }
  };

  // Test 1: MUAC unit confusion detector (11.5 cm -> 115 mm)
  const muac11_5 = detectMuacUnitConfusion(11.5);
  assert(
    muac11_5.isLikelyCm && muac11_5.suggestedMm === 115,
    'MUAC Unit Confusion (11.5 cm)',
    `Expected 11.5 to be detected as cm and converted to 115 mm, got ${JSON.stringify(muac11_5)}`
  );

  const muac110 = detectMuacUnitConfusion(110);
  assert(
    !muac110.isLikelyCm && muac110.suggestedMm === 110,
    'MUAC Normal mm (110 mm)',
    `Expected 110 to remain mm, got ${JSON.stringify(muac110)}`
  );

  // Test 2: F-75 Stabilization Volume Targets (5.0 kg child with mild edema)
  const f75Targets = calculateFeedingTargets(5.0, 'F-75 Stabilization', 'Mild/Moderate (+ / ++)', 3);
  // 5.0 kg * 130 mL/kg/day = 650 mL/day
  // 8 feeds per day = 650 / 8 = 81.25 -> rounded to 80 mL per feed
  assert(
    f75Targets.dailyVolume === 650,
    'F-75 Daily Volume (5kg mild edema)',
    `Expected 650 mL, got ${f75Targets.dailyVolume}`
  );
  assert(
    f75Targets.targetVolumePerFeed === 80,
    'F-75 Target Per Feed Rounded (5kg, 3-hourly)',
    `Expected 80 mL, got ${f75Targets.targetVolumePerFeed}`
  );

  // Test 3: Severe Edema (+++) Volume Reduction (6.0 kg child)
  // Per WHO guideline, severe edema gets 100 mL/kg/day instead of 130 mL/kg/day to prevent heart failure
  const severeEdemaTargets = calculateFeedingTargets(6.0, 'F-75 Stabilization', 'Severe (+++)', 2);
  assert(
    severeEdemaTargets.dailyVolume === 600,
    'F-75 Severe Edema Volume Reduction (6kg)',
    `Expected 600 mL (100 mL/kg), got ${severeEdemaTargets.dailyVolume}`
  );
  assert(
    severeEdemaTargets.targetVolumePerFeed === 50,
    'F-75 Severe Edema 2-hourly feed volume (12 feeds)',
    `Expected 50 mL, got ${severeEdemaTargets.targetVolumePerFeed}`
  );

  // Test 4: Critical Interlock - Severe Edema + F-100 must be halted
  const f100SevereEdemaInput: CalculationInput = {
    weight_kg: 7.0,
    height_cm: 70.0,
    age_months: 18,
    sex: 'Boy',
    calculation_mode: 'Full WHO Assessment + Calculator',
    therapeutic_phase: 'F-100 Rehabilitation',
    edema_severity: 'Severe (+++)',
    feeding_interval_hours: 3,
    local_milk_source: 'Dried Skimmed Milk Powder',
  };
  const f100Eval = evaluatePatient(f100SevereEdemaInput);
  assert(
    f100Eval.safety.rule2FluidOverloadHalted === true,
    'Severe Edema + F-100 Interlock Halted in Engine',
    'Rule 2 did not trigger for F-100 + Severe Edema'
  );
  assert(
    f100Eval.recipe === undefined,
    'Severe Edema + F-100 Recipe Suppressed',
    'Recipe should be withheld when rule 2 triggers'
  );

  const f100Audit = auditClinicalSafety(f100SevereEdemaInput, f100Eval);
  assert(
    f100Audit.severity === 'CRITICAL_INTERLOCK',
    'Severe Edema + F-100 Auditor Severity',
    `Expected CRITICAL_INTERLOCK, got ${f100Audit.severity}`
  );

  // Test 5: Infant under 6 months + Standard F-100 Interlock (WHO 2023 & Sept 2026 Guidance)
  const infantInput: CalculationInput = {
    weight_kg: 4.0,
    height_cm: 55.0,
    age_months: 3,
    sex: 'Girl',
    calculation_mode: 'Full WHO Assessment + Calculator',
    therapeutic_phase: 'F-100 Rehabilitation',
    edema_severity: 'None',
    feeding_interval_hours: 2,
    local_milk_source: 'Dried Skimmed Milk Powder',
  };
  const infantAudit = auditClinicalSafety(infantInput);
  assert(
    infantAudit.issues.some((i) => i.id === 'GR3_INFANT_UNDER_6M_F100'),
    'Infant <6m Standard F-100 Guardrail',
    'Did not flag infant under 6 months on standard F-100'
  );

  // Test 6: Infant <6m with Nutritional Oedema (Inpatient admission alert per Sept 2026 Guidance)
  const infantEdemaInput: CalculationInput = {
    weight_kg: 4.5,
    height_cm: 56.0,
    age_months: 4,
    sex: 'Boy',
    calculation_mode: 'Full WHO Assessment + Calculator',
    therapeutic_phase: 'F-75 Stabilization',
    edema_severity: 'Mild/Moderate (+ / ++)',
    feeding_interval_hours: 2,
    local_milk_source: 'Dried Skimmed Milk Powder',
  };
  const infantEdemaAudit = auditClinicalSafety(infantEdemaInput);
  assert(
    infantEdemaAudit.issues.some((i) => i.id === 'GR3_INFANT_UNDER_6M_EDEMA'),
    'Infant <6m Oedema Inpatient Guardrail',
    'Did not flag infant under 6m with oedema'
  );

  // Test 7: Diluted F-100 formulation calculation for SST
  const dilutedRecipe = calculateDilutedF100Recipe(520);
  assert(
    dilutedRecipe.energyKcalPer100ml === 77 && dilutedRecipe.preparationInstructions.includes('30% extra safe water'),
    'Diluted F-100 SST Recipe Generation',
    'Diluted F-100 formula parameters incorrect'
  );

  // Test 8: ReSoMal Dosage Engine
  const resomal6kg = calculateReSoMalProtocol(6.0, 'None');
  // First 2 hours: 5 mL/kg every 30m = 30 mL q30m
  assert(
    resomal6kg.first2Hours.volumePer30Min === 30,
    'ReSoMal 6kg 30-min dose',
    `Expected 30 mL, got ${resomal6kg.first2Hours.volumePer30Min}`
  );
  assert(
    resomal6kg.first2Hours.total2HourVolume === 120,
    'ReSoMal 6kg 2-hour total volume',
    `Expected 120 mL, got ${resomal6kg.first2Hours.total2HourVolume}`
  );

  // Test 9: ReSoMal Contraindication in Kwashiorkor
  const resomalEdema = calculateReSoMalProtocol(6.0, 'Severe (+++)');
  assert(
    resomalEdema.isContraindicated === true,
    'ReSoMal Contraindication in Severe Edema',
    'ReSoMal should flag contraindication in active edema'
  );

  // Test 10: Emergency Shock IV Resuscitation (15 mL/kg/h) vs Oral ReSoMal Differentiation
  const shockResus = calculateShockResuscitation(6.0);
  assert(
    shockResus.bolusRateMlPerHour === 90, // 6kg * 15 mL/kg = 90 mL/h
    'Shock IV Resuscitation Rate (6kg)',
    `Expected 90 mL/h, got ${shockResus.bolusRateMlPerHour}`
  );
  assert(
    shockResus.monitoringIntervalMinutes === 10,
    'Shock Cardiopulmonary Monitoring Interval',
    'Monitoring interval should be 10 minutes'
  );

  // Test 11: Circulatory Shock Emergency Interlock
  const shockInput: CalculationInput = {
    weight_kg: 5.5,
    height_cm: 62.0,
    age_months: 10,
    sex: 'Boy',
    calculation_mode: 'Full WHO Assessment + Calculator',
    therapeutic_phase: 'F-75 Stabilization',
    edema_severity: 'None',
    feeding_interval_hours: 2,
    local_milk_source: 'Dried Skimmed Milk Powder',
    fluid_scenario: 'circulatory_shock',
  };
  const shockAudit = auditClinicalSafety(shockInput);
  assert(
    shockAudit.issues.some((i) => i.id === 'GR6_CIRCULATORY_SHOCK_EMERGENCY'),
    'Emergency Circulatory Shock Interlock Triggered',
    'Did not flag circulatory shock emergency'
  );

  // Test 12: Refeeding Syndrome Contextual Stratification (Profound wasting)
  const severeWastingInput: CalculationInput = {
    weight_kg: 3.8, // severe wasting for 65cm
    height_cm: 65.0,
    age_months: 12,
    sex: 'Boy',
    calculation_mode: 'Full WHO Assessment + Calculator',
    therapeutic_phase: 'F-75 Stabilization',
    edema_severity: 'None',
    muac_mm: 95, // extreme low MUAC <100 mm
    feeding_interval_hours: 2,
    local_milk_source: 'Dried Skimmed Milk Powder',
  };
  const refeedingAudit = auditClinicalSafety(severeWastingInput);
  assert(
    refeedingAudit.refeedingRiskLevel === 'High / Critical',
    'Refeeding Risk Level Stratification (MUAC < 100mm)',
    `Expected High / Critical, got ${refeedingAudit.refeedingRiskLevel}`
  );
  assert(
    refeedingAudit.refeedingPrecautions.some((p) => p.includes('iron')),
    'Refeeding Iron Withholding Precaution Present',
    'Precautions must include iron withholding'
  );

  // Test 13: Standard (Non-Cereal) F-100 Recipe Invariants (1000 mL batch)
  const stdF100Recipe = calculateBatchRecipe(1000, 'F-100 Rehabilitation', 'Dried Skimmed Milk Powder', 'Standard (Milk-based / Non-cereal)');
  assert(
    stdF100Recipe.cerealFlourGrams === 0,
    'Standard F-100 Non-Cereal Zero Flour Invariant',
    `Expected 0g cereal flour in non-cereal F-100, got ${stdF100Recipe.cerealFlourGrams}g`
  );
  assert(
    stdF100Recipe.sugarGrams === 50,
    'Standard F-100 Sugar Content (50g/L)',
    `Expected 50g sugar, got ${stdF100Recipe.sugarGrams}g`
  );
  assert(
    stdF100Recipe.estimatedOsmolalityMOsmKg === 419,
    'Standard F-100 Osmolality (~419 mOsm/kg)',
    `Expected 419 mOsm/kg, got ${stdF100Recipe.estimatedOsmolalityMOsmKg}`
  );

  // Test 14: Cereal-Based (Low Osmolality) F-100 Recipe Invariants (1000 mL batch)
  const cerealF100Recipe = calculateBatchRecipe(1000, 'F-100 Rehabilitation', 'Dried Skimmed Milk Powder', 'Cereal-based (Low Osmolality)');
  assert(
    cerealF100Recipe.cerealFlourGrams === 35,
    'Cereal-based F-100 Cooked Flour Content (35g/L)',
    `Expected 35g cereal flour, got ${cerealF100Recipe.cerealFlourGrams}g`
  );
  assert(
    cerealF100Recipe.sugarGrams === 25,
    'Cereal-based F-100 Reduced Sugar (25g/L - 50% reduction)',
    `Expected 25g sugar, got ${cerealF100Recipe.sugarGrams}g`
  );
  assert(
    cerealF100Recipe.estimatedOsmolalityMOsmKg === 300,
    'Cereal-based F-100 Low Osmolality (~300 mOsm/kg)',
    `Expected 300 mOsm/kg, got ${cerealF100Recipe.estimatedOsmolalityMOsmKg}`
  );
  assert(
    cerealF100Recipe.preparationStep.includes('4–5 minutes'),
    'Cereal-based F-100 Starch Cooking Step',
    'Preparation step must instruct boiling cereal flour for 4-5 minutes'
  );

  // Test 15: Cereal-Based F-100 Infant <6m Contraindication Interlock
  const infantCerealInput: CalculationInput = {
    weight_kg: 4.2,
    height_cm: 54.0,
    age_months: 3,
    sex: 'Boy',
    calculation_mode: 'Full WHO Assessment + Calculator',
    therapeutic_phase: 'F-100 Rehabilitation',
    f100_type: 'Cereal-based (Low Osmolality)',
    edema_severity: 'None',
    feeding_interval_hours: 2,
    local_milk_source: 'Dried Skimmed Milk Powder',
  };
  const infantCerealAudit = auditClinicalSafety(infantCerealInput);
  assert(
    infantCerealAudit.issues.some((i) => i.id === 'GR3_INFANT_UNDER_6M_CEREAL_F100'),
    'Infant <6m Cereal-Based F-100 Interlock',
    'Did not flag cereal-based F-100 contraindication in infant <6 months'
  );
  assert(
    infantCerealAudit.severity === 'CRITICAL_INTERLOCK',
    'Infant <6m Cereal F-100 Critical Interlock Severity',
    `Expected CRITICAL_INTERLOCK, got ${infantCerealAudit.severity}`
  );

  // Test 16: Standard (Non-Cereal) F-75 Recipe Invariants (1000 mL batch)
  const stdF75Recipe = calculateBatchRecipe(
    1000,
    'F-75 Stabilization',
    'Dried Skimmed Milk Powder',
    'Standard (Milk-based / Non-cereal)',
    'Standard (Milk-based / Non-cereal)'
  );
  assert(
    stdF75Recipe.cerealFlourGrams === 0,
    'Standard F-75 Non-Cereal Zero Flour Invariant',
    `Expected 0g cereal flour in non-cereal F-75, got ${stdF75Recipe.cerealFlourGrams}g`
  );
  assert(
    stdF75Recipe.sugarGrams === 70,
    'Standard F-75 Sugar Content (70g/L)',
    `Expected 70g sugar, got ${stdF75Recipe.sugarGrams}g`
  );
  assert(
    stdF75Recipe.estimatedOsmolalityMOsmKg === 333,
    'Standard F-75 Osmolality (~333 mOsm/kg)',
    `Expected 333 mOsm/kg, got ${stdF75Recipe.estimatedOsmolalityMOsmKg}`
  );
  assert(
    stdF75Recipe.formulaCategory === 'Standard F-75 (Milk-based / Non-cereal)',
    'Standard F-75 Category Name Invariant',
    `Expected Standard F-75 (Milk-based / Non-cereal), got ${stdF75Recipe.formulaCategory}`
  );

  // Test 17: Cereal-Based (Low Osmolality) F-75 Recipe Invariants (1000 mL batch)
  const cerealF75Recipe = calculateBatchRecipe(
    1000,
    'F-75 Stabilization',
    'Dried Skimmed Milk Powder',
    'Standard (Milk-based / Non-cereal)',
    'Cereal-based (Low Osmolality)'
  );
  assert(
    cerealF75Recipe.cerealFlourGrams === 35,
    'Cereal-based F-75 Cooked Flour Content (35g/L)',
    `Expected 35g cereal flour, got ${cerealF75Recipe.cerealFlourGrams}g`
  );
  assert(
    cerealF75Recipe.sugarGrams === 35,
    'Cereal-based F-75 Reduced Sugar (35g/L - 50% reduction)',
    `Expected 35g sugar, got ${cerealF75Recipe.sugarGrams}g`
  );
  assert(
    cerealF75Recipe.estimatedOsmolalityMOsmKg === 280,
    'Cereal-based F-75 Low Osmolality (~280 mOsm/kg)',
    `Expected 280 mOsm/kg, got ${cerealF75Recipe.estimatedOsmolalityMOsmKg}`
  );
  assert(
    cerealF75Recipe.preparationStep.includes('4–5 minutes'),
    'Cereal-based F-75 Starch Cooking Step',
    'Preparation step must instruct boiling cereal flour for 4-5 minutes'
  );
  assert(
    cerealF75Recipe.formulaCategory === 'Cereal-based F-75 (Low Osmolality)',
    'Cereal-based F-75 Category Name Invariant',
    `Expected Cereal-based F-75 (Low Osmolality), got ${cerealF75Recipe.formulaCategory}`
  );

  // Test 18: Cereal-Based F-75 Infant <6m Contraindication Interlock
  const infantCerealF75Input: CalculationInput = {
    weight_kg: 3.9,
    height_cm: 53.0,
    age_months: 4,
    sex: 'Girl',
    calculation_mode: 'Full WHO Assessment + Calculator',
    therapeutic_phase: 'F-75 Stabilization',
    f75_type: 'Cereal-based (Low Osmolality)',
    edema_severity: 'None',
    feeding_interval_hours: 2,
    local_milk_source: 'Dried Skimmed Milk Powder',
  };
  const infantCerealF75Audit = auditClinicalSafety(infantCerealF75Input);
  assert(
    infantCerealF75Audit.issues.some((i) => i.id === 'GR3_INFANT_UNDER_6M_CEREAL_F75'),
    'Infant <6m Cereal-Based F-75 Interlock',
    'Did not flag cereal-based F-75 contraindication in infant <6 months'
  );
  assert(
    infantCerealF75Audit.severity === 'CRITICAL_INTERLOCK',
    'Infant <6m Cereal F-75 Critical Interlock Severity',
    `Expected CRITICAL_INTERLOCK, got ${infantCerealF75Audit.severity}`
  );

  const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

  return {
    passed: failures.length === 0,
    totalTests: testCount,
    passedTests: passedCount,
    failedTests: failures.length,
    failures,
    executionTimeMs,
    clinicalGovernanceStatement:
      'Verification suite validates deterministic execution of programmatic logic and calculations. It does not replace empirical clinical trials or qualified pediatric bedside decision-making.',
  };
}

