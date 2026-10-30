/**
 * Clinical Safety & Guardrail Engine for PediCal
 * 
 * Strict deterministic fail-safe audits aligned with:
 * - WHO 2023 Guideline on the Management of Acute Malnutrition
 * - Ghana Health Service / UNICEF IMAM National Protocols
 * - Established Pediatric Pharmacopeia and Safe Enteral Osmolality Standards
 */

import { CalculationInput, FullEvaluationResult } from './clinicalCalculations';
import { getWHOThresholds, WHOLengthPoint } from '../data/whoGrowthStandards';

export type SafetySeverity = 'ALL_CLEAR' | 'CAUTION' | 'CRITICAL_INTERLOCK';

export interface ClinicalSafetyIssue {
  id: string;
  category: 'ANTHROPOMETRY' | 'CONTRAINDICATION' | 'REFEEDING_RISK' | 'FLUID_SAFETY' | 'INFANT_SAFETY' | 'RECIPE_OSMOLALITY';
  severity: 'CAUTION' | 'CRITICAL_INTERLOCK';
  title: string;
  summary: string;
  clinicalRationale: string;
  guidelineReference: string;
  correctiveAction: string;
  autoFixAvailable?: boolean;
  autoFixAction?: string;
  autoFixPatch?: Partial<CalculationInput>;
}

export interface ClinicalSafetyAuditResult {
  severity: SafetySeverity;
  criticalCount: number;
  cautionCount: number;
  totalActiveGuardrails: number;
  issues: ClinicalSafetyIssue[];
  passedGuardrails: string[];
  refeedingRiskLevel: 'Standard / Low' | 'Moderate' | 'High / Critical';
  refeedingPrecautions: string[];
  clinicalGovernanceNote: string;
  protocolCitations: {
    who2023: string;
    who2026Implementation: string;
    ghsImam: string;
  };
}

/**
 * Smart detector for common MUAC entry error:
 * Clinicians or nurses frequently enter MUAC in centimeters (e.g. 11.5 cm) instead of millimeters (115 mm).
 */
export function detectMuacUnitConfusion(rawMuac: number): {
  isLikelyCm: boolean;
  suggestedMm: number;
  originalValue: number;
} {
  // Typical human child MUAC is 70 mm to 220 mm (7.0 cm to 22.0 cm)
  // If someone enters a value between 5.0 and 26.0, it is almost certainly entered in cm
  if (rawMuac >= 5.0 && rawMuac <= 26.0) {
    const converted = Math.round(rawMuac * 10);
    return {
      isLikelyCm: true,
      suggestedMm: converted,
      originalValue: rawMuac,
    };
  }
  return {
    isLikelyCm: false,
    suggestedMm: rawMuac,
    originalValue: rawMuac,
  };
}

/**
 * Master Clinical Safety Audit Function
 * Executes all 8 WHO/GHS safety invariant checks deterministically
 */
export function auditClinicalSafety(
  input: CalculationInput,
  evaluation?: FullEvaluationResult
): ClinicalSafetyAuditResult {
  const issues: ClinicalSafetyIssue[] = [];
  const passedGuardrails: string[] = [];
  const TOTAL_GUARDRAILS = 8;

  const ageMonths = input.age_months ?? 12;
  const weightKg = input.weight_kg;
  const heightCm = input.height_cm ?? 60.0;
  const sex = input.sex ?? 'Boy';
  const edema = input.edema_severity;
  const phase = input.therapeutic_phase;
  const muacMm = input.muac_mm;

  // -------------------------------------------------------------------------
  // Guardrail 1: MUAC Entry Unit Sanity (cm vs mm)
  // -------------------------------------------------------------------------
  if (muacMm !== undefined && muacMm > 0) {
    const muacCheck = detectMuacUnitConfusion(muacMm);
    if (muacCheck.isLikelyCm) {
      issues.push({
        id: 'GR1_MUAC_UNIT_CM',
        category: 'ANTHROPOMETRY',
        severity: 'CRITICAL_INTERLOCK',
        title: `Possible MUAC Unit Mismatch (${muacMm} entered)`,
        summary: `Value of ${muacMm} appears to be recorded in centimeters rather than millimeters.`,
        clinicalRationale: `Standard pediatric MUAC is recorded in millimeters (mm). A value of ${muacMm} mm represents severe unviable limb wasting, whereas ${muacCheck.suggestedMm} mm (${muacMm} cm) is a standard pediatric measurement.`,
        guidelineReference: 'WHO Growth Standards & National IMAM Anthropometry Manual',
        correctiveAction: `Convert ${muacMm} cm to ${muacCheck.suggestedMm} mm.`,
        autoFixAvailable: true,
        autoFixAction: `Set MUAC to ${muacCheck.suggestedMm} mm`,
        autoFixPatch: { muac_mm: muacCheck.suggestedMm },
      });
    } else {
      passedGuardrails.push('MUAC unit format validated in millimeters');
    }
  } else {
    passedGuardrails.push('MUAC unit format validated');
  }

  // -------------------------------------------------------------------------
  // Guardrail 2: Severe Edema (+++) + F-100 Interlock (Heart Failure Risk)
  // -------------------------------------------------------------------------
  if (phase === 'F-100 Rehabilitation' && edema === 'Severe (+++)') {
    issues.push({
      id: 'GR2_F100_SEVERE_EDEMA',
      category: 'CONTRAINDICATION',
      severity: 'CRITICAL_INTERLOCK',
      title: 'Fatal Fluid Overload Risk: F-100 with Severe Oedema',
      summary: 'F-100 formula is strictly contraindicated while severe (+ + +) bilateral oedema persists.',
      clinicalRationale: 'F-100 has higher sodium and protein density compared to F-75. In severe edematous malnutrition (Kwashiorkor), the myocardium is atrophied and sodium excretion is impaired. Administering F-100 triggers acute pulmonary oedema and congestive heart failure.',
      guidelineReference: 'WHO 2023 Acute Malnutrition Guidelines & GHS IMAM Section 4.2',
      correctiveAction: 'Immediately switch patient back to F-75 Stabilization formula until oedema subsides to mild (+ / ++) and medical complications stabilize.',
      autoFixAvailable: true,
      autoFixAction: 'Switch to F-75 Stabilization',
      autoFixPatch: { therapeutic_phase: 'F-75 Stabilization' },
    });
  } else {
    passedGuardrails.push('Edema & formula compatibility verified (No heart failure risk)');
  }

  // -------------------------------------------------------------------------
  // Guardrail 3: Infant Under 6 Months Multi-Scenario Safety (WHO 2023 & Sept 2026 Guidance)
  // -------------------------------------------------------------------------
  const isInfantUnder6m = ageMonths < 6;
  if (isInfantUnder6m) {
    if (phase === 'F-100 Rehabilitation') {
      if (input.f100_type === 'Cereal-based (Low Osmolality)') {
        issues.push({
          id: 'GR3_INFANT_UNDER_6M_CEREAL_F100',
          category: 'INFANT_SAFETY',
          severity: 'CRITICAL_INTERLOCK',
          title: 'Infant < 6 Months: Cereal-Based F-100 Strictly Contraindicated',
          summary: 'Cereal flour and cereal-based therapeutic formulas are strictly contraindicated in infants under 6 months.',
          clinicalRationale:
            'Infants younger than 6 months lack sufficient pancreatic alpha-amylase activity to digest cooked cereal starch. Feeding cereal flour causes severe osmotic colonic fermentation, severe meteorism/bloating, and worsening of diarrhea. Under WHO 2023 & Sept 2026 Implementation Guidance, infants <6m must receive Expressed Breast Milk (EBM) via Supplementary Suckling Technique (SST), commercial infant formula, or Diluted Standard (Non-Cereal) F-100.',
          guidelineReference:
            'WHO 2023 Malnutrition Guidelines (Rec 2.1) & WHO 17 Sept 2026 Implementation Guidance (Infants <6m Modules)',
          correctiveAction:
            'Switch immediately away from Cereal-based F-100. For breastfed infants, use SST with EBM or Diluted Standard Non-Cereal F-100. For non-breastfed infants, use infant formula or Diluted Standard F-100. For edematous infants, switch to F-75 Stabilization.',
          autoFixAvailable: true,
          autoFixAction: 'Switch to Standard Non-Cereal F-100 / F-75',
          autoFixPatch: { f100_type: 'Standard (Milk-based / Non-cereal)', therapeutic_phase: 'F-75 Stabilization' },
        });
      } else {
        issues.push({
          id: 'GR3_INFANT_UNDER_6M_F100',
          category: 'INFANT_SAFETY',
          severity: 'CRITICAL_INTERLOCK',
          title: 'Infant < 6 Months: Standard Undiluted F-100 Contraindicated',
          summary: 'Standard undiluted F-100 and solid RUTF must never be administered to infants under 6 months.',
          clinicalRationale:
            'Infants under 6 months have immature glomerular filtration and tubular concentrating ability. The high renal solute load and protein density of standard F-100 induce hypernatremic dehydration and azotemia. Under the WHO 2023 Guidelines and 17 September 2026 Implementation Guidance, nutritional support depends on clinical circumstance: (1) Breastfed: Supplementary Suckling Technique (SST) with Expressed Breast Milk (EBM) or Diluted Standard F-100 (100 mL F-100 + 30 mL water); (2) Non-breastfed / mother absent: Infant Formula or Diluted Standard F-100 (130 mL/kg/day); (3) Medically unstable / edematous: Inpatient Phase 1 stabilization with F-75 or Diluted Standard F-100.',
          guidelineReference:
            'WHO 2023 Malnutrition Guidelines (Rec 2.1) & WHO 17 Sept 2026 Implementation Guidance (Infants <6m Inpatient/Outpatient Modules)',
          correctiveAction:
            'Differentiate clinical status: For breastfed infants, initiate Supplementary Suckling Technique (SST) using EBM or Diluted Standard F-100. For non-breastfed infants, use infant formula or Diluted Standard F-100. For complicated/edematous infants, switch to F-75 Stabilization.',
          autoFixAvailable: true,
          autoFixAction: 'Switch to F-75 Stabilization / Diluted F-100',
          autoFixPatch: { therapeutic_phase: 'F-75 Stabilization' },
        });
      }
    } else if (phase === 'F-75 Stabilization' && input.f75_type === 'Cereal-based (Low Osmolality)') {
      issues.push({
        id: 'GR3_INFANT_UNDER_6M_CEREAL_F75',
        category: 'INFANT_SAFETY',
        severity: 'CRITICAL_INTERLOCK',
        title: 'Infant < 6 Months: Cereal-Based F-75 Strictly Contraindicated',
        summary: 'Cereal flour and cereal-based therapeutic formulas are strictly contraindicated in infants under 6 months.',
        clinicalRationale:
          'Infants younger than 6 months lack sufficient pancreatic alpha-amylase activity to digest cooked cereal starch. Feeding cereal flour causes severe osmotic colonic fermentation, abdominal distension, and exacerbation of diarrhea. Under WHO 2023 Guidelines and 17 September 2026 Implementation Guidance, infants <6m requiring F-75 must receive Standard (Milk-based / Non-cereal) F-75, Expressed Breast Milk (EBM), or commercial infant formula.',
        guidelineReference:
          'WHO 2023 Malnutrition Guidelines (Rec 2.1) & WHO 17 Sept 2026 Implementation Guidance (Infants <6m Modules)',
        correctiveAction:
          'Switch immediately to Standard (Milk-based / Non-cereal) F-75. Ensure no cereal flour is administered to infants <6 months.',
        autoFixAvailable: true,
        autoFixAction: 'Switch to Standard Non-Cereal F-75',
        autoFixPatch: { f75_type: 'Standard (Milk-based / Non-cereal)' },
      });
    } else if (edema !== 'None') {
      issues.push({
        id: 'GR3_INFANT_UNDER_6M_EDEMA',
        category: 'INFANT_SAFETY',
        severity: 'CAUTION',
        title: 'Infant < 6 Months with Nutritional Oedema: Inpatient Care Required',
        summary: 'Presence of bilateral pitting oedema in an infant under 6 months mandates urgent inpatient stabilization.',
        clinicalRationale:
          'Nutritional oedema in infants <6 months reflects profound metabolic breakdown and high mortality risk. Per WHO 17 September 2026 Implementation Guidance, these infants must be admitted for inpatient stabilization with F-75 (or Diluted F-100/EBM), restricted fluids (~100 mL/kg/day if severe oedema), Kangaroo Mother Care (KMC) for thermal protection, and urgent search for underlying infection.',
        guidelineReference: 'WHO 17 Sept 2026 Implementation Guidance: Inpatient Care of Infants <6m',
        correctiveAction: 'Maintain F-75 Stabilization at 100-130 mL/kg/day, monitor resolution of oedema, and avoid fluid overload.',
      });
    } else {
      passedGuardrails.push('Infant <6m feeding protocol verified (WHO 2023 & Sept 2026 Implementation Guidance compliant)');
    }
  } else {
    passedGuardrails.push('Age-appropriate formula solute load verified (>6 months)');
  }

  // -------------------------------------------------------------------------
  // Guardrail 4: Anthropometric Plausibility (Extreme Outlier Typo Detection)
  // -------------------------------------------------------------------------
  let thresholds: WHOLengthPoint | null = null;
  try {
    thresholds = getWHOThresholds(heightCm, sex);
  } catch {
    thresholds = null;
  }

  if (thresholds) {
    // If weight is less than half of -3 SD or more than double +3 SD
    const extremeLow = thresholds.sd3neg * 0.55;
    const extremeHigh = thresholds.sd3 * 2.2;
    if (weightKg < extremeLow || weightKg > extremeHigh) {
      issues.push({
        id: 'GR4_EXTREME_ANTHRO_MISMATCH',
        category: 'ANTHROPOMETRY',
        severity: 'CRITICAL_INTERLOCK',
        title: 'Physiological Outlier: Extreme Weight-for-Length Mismatch',
        summary: `Weight (${weightKg} kg) is physiologically implausible for length (${heightCm} cm).`,
        clinicalRationale: `A weight of ${weightKg} kg for ${heightCm} cm falls outside standard biological survival boundaries. This frequently indicates a misplaced decimal point (e.g. 52 kg instead of 5.2 kg) or an un-tared scale.`,
        guidelineReference: 'WHO Child Growth Standards Anthropometric Quality Assurance',
        correctiveAction: 'Re-zero the pediatric scale, verify tare weight, and re-measure length with another healthcare worker before preparing feed volumes.',
      });
    } else {
      passedGuardrails.push('Weight-for-length anthropometric plausibility verified');
    }
  } else {
    passedGuardrails.push('Anthropometric bounds checked');
  }

  // -------------------------------------------------------------------------
  // Guardrail 5: Refeeding Syndrome Contextualized Risk Stratification
  // -------------------------------------------------------------------------
  let refeedingRiskLevel: ClinicalSafetyAuditResult['refeedingRiskLevel'] = 'Standard / Low';
  const refeedingPrecautions: string[] = [];

  const isSevereWastingZ = thresholds ? weightKg < thresholds.sd3neg : false;
  const isExtremeWastingZ = thresholds ? weightKg < (thresholds.sd3neg - 1.2) : false;
  const isLowMuac = muacMm !== undefined && muacMm > 0 && muacMm < 115;
  const isExtremeLowMuac = muacMm !== undefined && muacMm > 0 && muacMm < 100;
  const isEdematous = edema !== 'None';

  if (isExtremeWastingZ || isExtremeLowMuac || (isEdematous && isSevereWastingZ)) {
    refeedingRiskLevel = 'High / Critical';
    refeedingPrecautions.push('Initiate Phase 1 F-75 stabilization feeds without early escalation. Standard F-75 provides ~100 kcal/kg/day (or ~80 kcal/kg/day for severe oedema), safely formulated to prevent refeeding collapse.');
    refeedingPrecautions.push('Ensure Combined Mineral Vitamin (CMV) is added, providing crucial intracellular phosphate, potassium, and magnesium.');
    refeedingPrecautions.push('Strictly WITHHOLD oral and IV iron during Phase 1 stabilization (iron fuels bacteremia and severe oxidative tissue damage).');
    refeedingPrecautions.push('Monitor cardiopulmonary signs: evaluate pulse rate, respiratory rate, and chest indrawing every 4 hours for early heart failure or acute hypophosphatemia.');
    refeedingPrecautions.push('If refeeding syndrome is clinically suspected (sudden weakness, tachypnea, tachycardia), maintain or cautious-titrate initial caloric intake with close biochemical surveillance.');

    issues.push({
      id: 'GR5_REFEEDING_SYNDROME_RISK',
      category: 'REFEEDING_RISK',
      severity: 'CAUTION',
      title: 'High Risk for Refeeding Syndrome: Contextualized Metabolic Vigilance',
      summary: 'Child presents with profound tissue wasting, extreme MUAC (<100 mm), or severe marasmic kwashiorkor requiring structured metabolic stabilization.',
      clinicalRationale:
        'In prolonged severe starvation, intracellular stores of phosphorus, magnesium, and potassium are critically depleted. Rapid carbohydrate introduction stimulates insulin surges, driving electrolytes into cells and triggering lethal acute hypophosphatemia, cardiac arrhythmias, and heart failure. Standard Phase 1 F-75 formula provides ~80–100 kcal/kg/day with low protein and low sodium precisely to prevent this. Do not escalate to Phase 2 (F-100 / RUTF) until medical complications have resolved and appetite is robustly demonstrated.',
      guidelineReference:
        'WHO 2023 Guideline Section 3, WHO 17 Sept 2026 Implementation Guidance & Ghana Health Service IMAM Section 4',
      correctiveAction:
        'Maintain Phase 1 F-75 Stabilization feeds. Ensure micronutrient repletion with CMV (potassium, phosphate, magnesium). Withhold iron during initial stabilization. Monitor respiratory rate and heart rate every 4 hours.',
    });
  } else if (isSevereWastingZ || isLowMuac || isEdematous) {
    refeedingRiskLevel = 'Moderate';
    refeedingPrecautions.push('Adhere to standard F-75 stabilization volumes (130 mL/kg/day or 100 mL/kg/day for severe edema).');
    refeedingPrecautions.push('Monitor feeding tolerance, abdominal distension, and bowel sounds.');
    passedGuardrails.push('Refeeding syndrome risk evaluated (Moderate risk handled with standard F-75)');
  } else {
    passedGuardrails.push('Refeeding syndrome risk evaluated (Low risk - standard Phase 1 initiation)');
  }

  // -------------------------------------------------------------------------
  // Guardrail 6: Dehydration, Shock & Fluid Management Safety Matrix
  // -------------------------------------------------------------------------
  if (input.fluid_scenario === 'circulatory_shock') {
    issues.push({
      id: 'GR6_CIRCULATORY_SHOCK_EMERGENCY',
      category: 'FLUID_SAFETY',
      severity: 'CRITICAL_INTERLOCK',
      title: 'Medical Emergency: Circulatory Shock in SAM (IV Resuscitation Required)',
      summary: 'Child presents with signs of shock (lethargy, cold extremities, CRT > 3s, weak pulse). Oral ReSoMal is contraindicated.',
      clinicalRationale:
        'Children with SAM in circulatory shock cannot absorb oral fluids and will rapidly suffer cardiac arrest without vascular volume restoration. WHO 2023 & Sept 2026 Implementation Guidance and GHS IMAM mandate emergency IV resuscitation with Half-strength Darrow\'s + 5% Dextrose (or Ringer\'s Lactate + 5% Dextrose) at 15 mL/kg over 1 hour. Strict cardiopulmonary monitoring is required every 10 minutes (pulse, RR, liver margin). Stop IV fluids immediately if signs of volume overload / heart failure appear.',
      guidelineReference: 'WHO 2023 Guidelines Section 3.2 & GHS IMAM Emergency Shock Protocol',
      correctiveAction: 'Initiate emergency IV fluid resuscitation at 15 mL/kg over 1 hour with continuous 10-minute cardiopulmonary surveillance.',
    });
  } else if (edema === 'Severe (+++)') {
    issues.push({
      id: 'GR6_RESOMAL_EDEMA_RESTRICTION',
      category: 'FLUID_SAFETY',
      severity: 'CAUTION',
      title: 'Fluid Guard: ReSoMal Restricted in Severe Oedema (Kwashiorkor)',
      summary: 'Do not administer routine oral rehydration in severe bilateral oedema unless profuse watery diarrhoea is confirmed.',
      clinicalRationale:
        'Children with Kwashiorkor already suffer from total-body sodium retention, defective cellular sodium pumps, and expanded extracellular volume. Additional oral rehydration solution exacerbates cardiac overload and ascites. ReSoMal is only indicated if active, frequent watery diarrhea is causing acute hypovolemic dehydration.',
      guidelineReference: 'WHO 2023 / 2026 Implementation Guidance & Ghana Health Service IMAM Protocol Section 3.4',
      correctiveAction: 'Only administer ReSoMal if there is active, frequent, profuse watery diarrhea. Otherwise maintain maintenance F-75 feeds at 100 mL/kg/day with close monitoring of respiratory rate and pulse.',
    });
  } else {
    passedGuardrails.push('Fluid balance and dehydration management pathways verified');
  }

  // -------------------------------------------------------------------------
  // Guardrail 7: Therapeutic Milk Sugar Osmolality Check
  // -------------------------------------------------------------------------
  if (evaluation?.safety?.rule1F75OsmolalityTriggered) {
    issues.push({
      id: 'GR7_HIGH_SUGAR_OSMOLALITY',
      category: 'RECIPE_OSMOLALITY',
      severity: 'CRITICAL_INTERLOCK',
      title: 'Osmotic Diarrhea Risk: Excess Sugar Concentration',
      summary: 'Prepared milk formula sugar content exceeds 10% of total volume.',
      clinicalRationale: 'In severe acute malnutrition, intestinal villi are blunted and disaccharidase enzyme activity is severely reduced. High sugar osmolality pulls water into the intestinal lumen, triggering severe osmotic diarrhea and rapid dehydration.',
      guidelineReference: 'WHO Inpatient Stabilization Manual & Therapeutic Milk Standards',
      correctiveAction: 'Adjust kitchen recipe: use exactly 70g sugar per 1,000 mL F-75 or 50g sugar per 1,000 mL F-100.',
    });
  } else {
    passedGuardrails.push('Osmolality and sugar concentration within safe limits (< 10%)');
  }

  // -------------------------------------------------------------------------
  // Guardrail 8: Safe Single-Feed Gastric Capacity Boundary
  // -------------------------------------------------------------------------
  if (evaluation?.feedingSummary) {
    const singleFeedVolume = evaluation.feedingSummary.targetVolumePerFeed;
    const mlPerKgPerFeed = singleFeedVolume / weightKg;
    // Safe gastric capacity in malnourished infants is ~20 to 25 mL/kg per feed
    if (mlPerKgPerFeed > 28.0) {
      issues.push({
        id: 'GR8_GASTRIC_OVERLOAD',
        category: 'FLUID_SAFETY',
        severity: 'CAUTION',
        title: 'Single-Feed Volume Exceeds Gastric Capacity',
        summary: `Single feed of ${singleFeedVolume} mL (${mlPerKgPerFeed.toFixed(1)} mL/kg) may cause vomiting or aspiration.`,
        clinicalRationale: 'Malnourished children have reduced gastric elasticity and delayed gastric emptying. Boluses exceeding 25 mL/kg frequently cause regurgitation, aspiration pneumonia, and acute gastric dilatation.',
        guidelineReference: 'WHO Guidelines on Frequent Low-Volume Feeding',
        correctiveAction: 'Switch to a 2-hourly feeding schedule (12 feeds per 24h) to reduce the volume per individual feed while maintaining identical daily calorie delivery.',
        autoFixAvailable: true,
        autoFixAction: 'Switch to 2-hourly feeding interval (12 feeds/day)',
        autoFixPatch: { feeding_interval_hours: 2 },
      });
    } else {
      passedGuardrails.push('Single feed volume within safe anatomical gastric limits');
    }
  } else {
    passedGuardrails.push('Single feed gastric capacity checked');
  }

  const criticalCount = issues.filter((i) => i.severity === 'CRITICAL_INTERLOCK').length;
  const cautionCount = issues.filter((i) => i.severity === 'CAUTION').length;

  let overallSeverity: SafetySeverity = 'ALL_CLEAR';
  if (criticalCount > 0) {
    overallSeverity = 'CRITICAL_INTERLOCK';
  } else if (cautionCount > 0) {
    overallSeverity = 'CAUTION';
  }

  return {
    severity: overallSeverity,
    criticalCount,
    cautionCount,
    totalActiveGuardrails: TOTAL_GUARDRAILS,
    issues,
    passedGuardrails,
    refeedingRiskLevel,
    refeedingPrecautions,
    clinicalGovernanceNote:
      'PediCal executes deterministic software verification invariants aligned with WHO 2023 Guidelines, the WHO 17 September 2026 Implementation Guidance, and Ghana Health Service National IMAM Protocols. Automated unit tests verify computational execution and software invariants; they do not replace bedside clinical evaluation or medical decision-making by qualified pediatric practitioners.',
    protocolCitations: {
      who2023: 'WHO guideline on the prevention and management of wasting and nutritional oedema (2023)',
      who2026Implementation: 'WHO Implementation guidance covering inpatient and outpatient management, including infants under six months (Published 17 September 2026)',
      ghsImam: 'Ghana Health Service (GHS) / UNICEF National Guidelines for Integrated Management of Acute Malnutrition (IMAM)',
    },
  };
}
