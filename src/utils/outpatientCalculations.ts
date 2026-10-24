/**
 * WHO 2023 Outpatient Management of Wasting and Nutritional Oedema (Acute Malnutrition)
 * Protocol & Dosage Engine for Outpatient Therapeutic Programs (OTP / CMAM)
 */

export interface RUTFRationResult {
  weight_kg: number;
  sachetsPerDay: number;
  sachets7Days: number;
  sachets14Days: number;
  kcalPerDay: number;
  kcalPerKgPerDay: number;
  proteinGramsPerDay: number;
  sachetGrams: number;
  appetiteTestMinPortion: string;
}

export interface OutpatientTriageResult {
  isEligibleForOTP: boolean;
  triageCategory: 'Eligible for Outpatient Care (OTP)' | 'Inpatient Referral Required' | 'Moderate Wasting (Supplementary Care)' | 'Verify Criteria';
  reasons: string[];
  referralUrgency?: 'Emergency (Immediate Transfer)' | 'High (Same-Day Transfer)' | 'None';
  primaryAction: string;
}

export interface AmoxicillinDose {
  weight_kg: number;
  doseMgPerDose: number;
  frequency: string;
  durationDays: number;
  dispersibleTablet250mg: string;
  syrup125mgPer5ml: string;
  syrup250mgPer5ml: string;
}

/**
 * Calculate WHO standard RUTF (92g / 500 kcal paste) dosing by body weight
 */
export function calculateRUTFDose(weight_kg: number): RUTFRationResult {
  const w = Math.max(3.0, weight_kg);

  let sachetsPerDay = 2;
  let appetitePortion = '1/4 sachet (approx 23g)';

  if (w < 4.0) {
    sachetsPerDay = 1.5;
    appetitePortion = '1/4 sachet (approx 23g)';
  } else if (w < 5.5) {
    sachetsPerDay = 2.0;
    appetitePortion = '1/4 sachet (approx 23g)';
  } else if (w < 7.0) {
    sachetsPerDay = 2.5;
    appetitePortion = '1/4 sachet (approx 23g)';
  } else if (w < 8.5) {
    sachetsPerDay = 3.0;
    appetitePortion = '1/3 sachet (approx 30g)';
  } else if (w < 9.5) {
    sachetsPerDay = 3.5;
    appetitePortion = '1/3 sachet (approx 30g)';
  } else if (w < 10.5) {
    sachetsPerDay = 4.0;
    appetitePortion = '1/2 sachet (approx 46g)';
  } else if (w < 12.0) {
    sachetsPerDay = 4.5;
    appetitePortion = '1/2 sachet (approx 46g)';
  } else {
    sachetsPerDay = 5.0;
    appetitePortion = '3/4 sachet (approx 70g)';
  }

  const sachets7Days = Math.ceil(sachetsPerDay * 7);
  const sachets14Days = Math.ceil(sachetsPerDay * 14);
  const kcalPerDay = Math.round(sachetsPerDay * 500);
  const kcalPerKgPerDay = Number((kcalPerDay / w).toFixed(0));
  const proteinGramsPerDay = Number((sachetsPerDay * 12.8).toFixed(1));

  return {
    weight_kg: w,
    sachetsPerDay,
    sachets7Days,
    sachets14Days,
    kcalPerDay,
    kcalPerKgPerDay,
    proteinGramsPerDay,
    sachetGrams: 92,
    appetiteTestMinPortion: appetitePortion,
  };
}

/**
 * Calculate WHO routine Amoxicillin dosing for outpatient acute malnutrition
 * standard 50-100 mg/kg/day in 2 divided doses for 5 to 7 days
 */
export function calculateAmoxicillinDose(weight_kg: number): AmoxicillinDose {
  const w = weight_kg;

  if (w < 5.0) {
    return {
      weight_kg: w,
      doseMgPerDose: 125,
      frequency: 'Every 12 hours (Twice daily)',
      durationDays: 5,
      dispersibleTablet250mg: '1/2 tablet',
      syrup125mgPer5ml: '5.0 mL',
      syrup250mgPer5ml: '2.5 mL',
    };
  } else if (w < 10.0) {
    return {
      weight_kg: w,
      doseMgPerDose: 250,
      frequency: 'Every 12 hours (Twice daily)',
      durationDays: 5,
      dispersibleTablet250mg: '1 tablet',
      syrup125mgPer5ml: '10.0 mL',
      syrup250mgPer5ml: '5.0 mL',
    };
  } else if (w < 15.0) {
    return {
      weight_kg: w,
      doseMgPerDose: 375,
      frequency: 'Every 12 hours (Twice daily)',
      durationDays: 5,
      dispersibleTablet250mg: '1.5 tablets',
      syrup125mgPer5ml: '15.0 mL',
      syrup250mgPer5ml: '7.5 mL',
    };
  } else {
    return {
      weight_kg: w,
      doseMgPerDose: 500,
      frequency: 'Every 12 hours (Twice daily)',
      durationDays: 5,
      dispersibleTablet250mg: '2 tablets',
      syrup125mgPer5ml: '20.0 mL',
      syrup250mgPer5ml: '10.0 mL',
    };
  }
}

/**
 * Evaluate WHO 2023 Outpatient Admission vs Inpatient Referral Triage
 */
export function evaluateOutpatientTriage(params: {
  age_months: number;
  weight_kg: number;
  muac_mm?: number;
  wfl_zscore?: number;
  edema_grade: 'None' | 'Grade + (Mild)' | 'Grade ++ (Moderate)' | 'Grade +++ (Severe)';
  appetite_test_status: 'Passed' | 'Failed' | 'Not Performed';
  has_medical_complications: boolean;
  complication_notes?: string[];
}): OutpatientTriageResult {
  const reasons: string[] = [];
  const {
    age_months,
    muac_mm,
    wfl_zscore,
    edema_grade,
    appetite_test_status,
    has_medical_complications,
  } = params;

  // Age restriction check
  if (age_months < 6) {
    return {
      isEligibleForOTP: false,
      triageCategory: 'Inpatient Referral Required',
      referralUrgency: 'High (Same-Day Transfer)',
      reasons: [
        'Infant under 6 months of age (or < 3 kg). Infants require specialized inpatient lactation management or pediatric stabilization, not outpatient RUTF.',
      ],
      primaryAction: 'Refer to inpatient pediatric unit for lactation support / infant stabilization.',
    };
  }

  // 1. Severe edema is strictly an inpatient emergency
  if (edema_grade === 'Grade +++ (Severe)') {
    return {
      isEligibleForOTP: false,
      triageCategory: 'Inpatient Referral Required',
      referralUrgency: 'Emergency (Immediate Transfer)',
      reasons: [
        'Severe generalized bilateral pitting oedema (+++ / Kwashiorkor) with high risk of myocardial failure and systemic collapse.',
      ],
      primaryAction: 'Immediate admission for F-75 stabilization; outpatient care is strictly contraindicated.',
    };
  }

  // 2. Medical complications require inpatient stabilization
  if (has_medical_complications) {
    return {
      isEligibleForOTP: false,
      triageCategory: 'Inpatient Referral Required',
      referralUrgency: 'Emergency (Immediate Transfer)',
      reasons: [
        'Acute medical complications present (e.g. fever/hypothermia, intractable vomiting, lethargy, severe respiratory distress, or severe dehydration).',
      ],
      primaryAction: 'Admit to inpatient stabilization care (F-75) with concurrent treatment of medical complications.',
    };
  }

  // 3. Failed appetite test requires inpatient care
  if (appetite_test_status === 'Failed') {
    return {
      isEligibleForOTP: false,
      triageCategory: 'Inpatient Referral Required',
      referralUrgency: 'High (Same-Day Transfer)',
      reasons: [
        'Child failed the WHO Appetite Test (unable or unwilling to consume RUTF paste within 30 minutes).',
      ],
      primaryAction: 'Admit to inpatient care for F-75 therapeutic milk feeding until appetite returns.',
    };
  }

  // 4. Check anthropometric criteria
  const hasSevereWastingMuac = muac_mm !== undefined && muac_mm < 115;
  const hasSevereWastingZscore = wfl_zscore !== undefined && wfl_zscore < -3;
  const hasNutritionalEdema = edema_grade === 'Grade + (Mild)' || edema_grade === 'Grade ++ (Moderate)';

  const isSevere = hasSevereWastingMuac || hasSevereWastingZscore || hasNutritionalEdema;

  if (isSevere) {
    if (appetite_test_status === 'Not Performed') {
      return {
        isEligibleForOTP: false,
        triageCategory: 'Verify Criteria',
        reasons: [
          'Child meets anthropometric criteria for severe acute malnutrition, but WHO Appetite Test has not yet been performed.',
        ],
        primaryAction: 'Conduct the 30-minute WHO Appetite Test with RUTF paste before confirming outpatient admission.',
      };
    }

    // Passed appetite test, no complications, severe wasting or mild/mod oedema
    reasons.push(
      hasNutritionalEdema
        ? `Bilateral pitting oedema (${edema_grade}) present without severe +++ generalized oedema.`
        : hasSevereWastingMuac
        ? `MUAC ${muac_mm} mm (< 115 mm cut-off indicating severe wasting).`
        : `Weight-for-Length Z-score < -3 SD indicating severe wasting.`
    );
    reasons.push('Passed WHO Appetite Test eagerly within 30 minutes.');
    reasons.push('Alert, conscious, and free of acute medical complications.');

    return {
      isEligibleForOTP: true,
      triageCategory: 'Eligible for Outpatient Care (OTP)',
      referralUrgency: 'None',
      reasons,
      primaryAction: 'Admit to Outpatient Therapeutic Program (OTP) with weekly RUTF ration and oral amoxicillin.',
    };
  }

  // Moderate wasting check
  const hasModerateWastingMuac = muac_mm !== undefined && muac_mm >= 115 && muac_mm < 125;
  const hasModerateWastingZscore = wfl_zscore !== undefined && wfl_zscore >= -3 && wfl_zscore < -2;

  if (hasModerateWastingMuac || hasModerateWastingZscore) {
    return {
      isEligibleForOTP: false,
      triageCategory: 'Moderate Wasting (Supplementary Care)',
      reasons: [
        'Child has Moderate Wasting (MUAC 115–124 mm or WHZ -3 to -2 SD) without bilateral oedema.',
      ],
      primaryAction: 'Refer to Targeted Supplementary Feeding Program (TSFP) / supplementary nutritional support and monthly growth monitoring.',
    };
  }

  return {
    isEligibleForOTP: false,
    triageCategory: 'Verify Criteria',
    reasons: [
      'Child is not currently classified as severely wasted (MUAC ≥ 125 mm and WHZ ≥ -2 SD with no pitting oedema).',
    ],
    primaryAction: 'Provide infant and young child feeding (IYCF) counseling and routine immunization check.',
  };
}
