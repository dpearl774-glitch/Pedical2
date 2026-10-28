/**
 * Inpatient Pediatric Malnutrition Ward Reference Management
 * Handles multi-child inpatient management, de-identified bed roster, and batch milk calculations.
 * Strict De-Identification: Uses Cot numbers and anonymous case codes (No Protected Health Information).
 */

import { CalculationInput, evaluatePatient, FullEvaluationResult } from '../utils/clinicalCalculations';

export interface FeedRecord {
  id: number;
  timeSlot: string; // Scheduled slot (e.g. "06:00")
  timeAdministered: string; // Time nurse gave/dispensed feed (e.g. "06:00")
  timePrepared?: string; // Backwards-compatible alias
  preparedMl: number; // Dose dispensed from 24h batch for this feed (mL)
  estimatedFinishTime: string; // e.g. "06:35" (30-35 min window)
  toleratedMl: number; // Volume successfully consumed / tolerated (mL)
  regurgitation: 'None' | 'Spit-up (<5 mL)' | 'Vomited (>50%)';
  route: 'Oral (Cup/Spoon)' | 'NG Tube';
  status: 'pending' | 'completed' | 'shortfall' | 'vomited';
  durationMinutes: number; // standard safe duration (30-40 min)
  notes?: string;
}

export type DischargeOutcome =
  | 'Discharged to Outpatient OTP'
  | 'Cured / Fully Recovered'
  | 'Transferred to Tertiary Hospital'
  | 'Defaulted / Left Against Advice';

export interface WardPatient {
  id: string;
  cotNumber: string;
  name: string;      // Anonymous Bed Tag / Case Label (e.g. "Cot 01" or optional initials)
  mrn: string;       // Anonymous Reference ID (e.g. "Ref-101")
  admissionDate: string;
  notes?: string;    // Clinical presentation summary (e.g. "Severe bilateral edema +++")
  input: CalculationInput;
  feedingRecords?: FeedRecord[];
  shiftStartTime?: string;
  dietitianBatchPrepTime?: string;

  // Discharge & Step-down tracking
  isDischarged?: boolean;
  dischargeDate?: string;
  dischargeOutcome?: DischargeOutcome;
  dischargeWeightKg?: number;
  dischargeMuacMm?: number;
  dischargeEdema?: string;
  dischargeNotes?: string;
}

export const INITIAL_WARD_PATIENTS: WardPatient[] = [
  {
    id: 'cot-1',
    cotNumber: 'Cot 01',
    name: 'Cot 01 (A.K.)',
    mrn: 'Ref-101',
    admissionDate: '2026-10-18',
    notes: 'Severe bilateral pitting edema (+++), stabilization day 3, hypothermia resolved',
    input: {
      patient_id: 'cot-1',
      cot_number: 'Cot 01',
      patient_name: 'Cot 01 (A.K.)',
      mrn: 'Ref-101',
      age_months: 8,
      calculation_mode: 'Full WHO Assessment + Calculator',
      weight_kg: 5.2,
      height_cm: 63.0,
      sex: 'Girl',
      therapeutic_phase: 'F-75 Stabilization',
      edema_severity: 'Severe (+++)',
      feeding_interval_hours: 2,
      local_milk_source: 'Dried Skimmed Milk Powder',
    },
  },
  {
    id: 'cot-2',
    cotNumber: 'Cot 02',
    name: 'Cot 02 (S.O.)',
    mrn: 'Ref-102',
    admissionDate: '2026-10-19',
    notes: 'Severe wasting (WHZ < -3 SD), eager feeder, good appetite',
    input: {
      patient_id: 'cot-2',
      cot_number: 'Cot 02',
      patient_name: 'Cot 02 (S.O.)',
      mrn: 'Ref-102',
      age_months: 14,
      calculation_mode: 'Full WHO Assessment + Calculator',
      weight_kg: 4.8,
      height_cm: 68.0,
      sex: 'Boy',
      therapeutic_phase: 'F-75 Stabilization',
      edema_severity: 'None',
      feeding_interval_hours: 3,
      local_milk_source: 'Dried Skimmed Milk Powder',
    },
  },
  {
    id: 'cot-3',
    cotNumber: 'Cot 03',
    name: 'Cot 03 (D.M.)',
    mrn: 'Ref-103',
    admissionDate: '2026-10-15',
    notes: 'Completed 48h transition protocol, appetite test positive, advancing on F-100',
    input: {
      patient_id: 'cot-3',
      cot_number: 'Cot 03',
      patient_name: 'Cot 03 (D.M.)',
      mrn: 'Ref-103',
      age_months: 20,
      calculation_mode: 'Full WHO Assessment + Calculator',
      weight_kg: 7.2,
      height_cm: 76.5,
      sex: 'Boy',
      therapeutic_phase: 'F-100 Rehabilitation',
      edema_severity: 'None',
      feeding_interval_hours: 3,
      local_milk_source: 'Fresh Cow / UHT Milk',
    },
  },
  {
    id: 'cot-4',
    cotNumber: 'Cot 04',
    name: 'Cot 04 (F.B.)',
    mrn: 'Ref-104',
    admissionDate: '2026-10-20',
    notes: 'Mild pedal edema (+), Day 2 of stabilization, watch for feed refusal',
    input: {
      patient_id: 'cot-4',
      cot_number: 'Cot 04',
      patient_name: 'Cot 04 (F.B.)',
      mrn: 'Ref-104',
      age_months: 10,
      calculation_mode: 'Full WHO Assessment + Calculator',
      weight_kg: 5.6,
      height_cm: 66.0,
      sex: 'Girl',
      therapeutic_phase: 'F-75 Stabilization',
      edema_severity: 'Mild/Moderate (+ / ++)',
      feeding_interval_hours: 3,
      local_milk_source: 'Dried Whole Milk Powder',
    },
  },
  {
    id: 'cot-5',
    cotNumber: 'Cot 05',
    name: 'Cot 05 (I.T.)',
    mrn: 'Ref-105',
    admissionDate: '2026-10-12',
    notes: 'Rapid catch-up weight gain (12 g/kg/day), preparing for outpatient RUTF transition',
    input: {
      patient_id: 'cot-5',
      cot_number: 'Cot 05',
      patient_name: 'Cot 05 (I.T.)',
      mrn: 'Ref-105',
      age_months: 28,
      calculation_mode: 'Full WHO Assessment + Calculator',
      weight_kg: 8.5,
      height_cm: 82.0,
      sex: 'Boy',
      therapeutic_phase: 'F-100 Rehabilitation',
      edema_severity: 'None',
      feeding_interval_hours: 4,
      local_milk_source: 'Dried Skimmed Milk Powder',
    },
  },
];

export interface WardMilkKitchenSummary {
  totalF75Ml: number;
  totalF100Ml: number;
  totalPatientsCount: number;
  f75PatientsCount: number;
  f100PatientsCount: number;
  totalCmvSolutionMl: number;
  totalSugarGrams: number;
  totalOilGrams: number;
  totalCerealFlourGrams: number;
  totalSkimmedMilkPowderGrams: number;
}

/**
 * Calculates aggregated formula preparation requirements for all children in the ward
 */
export function calculateWardMilkKitchen(patients: WardPatient[]): WardMilkKitchenSummary {
  let totalF75Ml = 0;
  let totalF100Ml = 0;
  let f75PatientsCount = 0;
  let f100PatientsCount = 0;

  let totalCmvSolutionMl = 0;
  let totalSugarGrams = 0;
  let totalOilGrams = 0;
  let totalCerealFlourGrams = 0;
  let totalSkimmedMilkPowderGrams = 0;

  const activePatients = patients.filter((p) => !p.isDischarged);

  for (const patient of activePatients) {
    const evalRes: FullEvaluationResult = evaluatePatient(patient.input);
    const dailyMl = evalRes.feedingSummary.dailyVolume;

    if (patient.input.therapeutic_phase === 'F-75 Stabilization') {
      totalF75Ml += dailyMl;
      f75PatientsCount++;
    } else {
      totalF100Ml += dailyMl;
      f100PatientsCount++;
    }

    if (evalRes.recipe) {
      totalCmvSolutionMl += evalRes.recipe.cmvLiquidMl;
      totalSugarGrams += evalRes.recipe.sugarGrams;
      totalOilGrams += evalRes.recipe.vegetableOilGrams;
      totalCerealFlourGrams += evalRes.recipe.cerealFlourGrams;
      if (evalRes.recipe.milkBase.name === 'Dried Skimmed Milk Powder') {
        totalSkimmedMilkPowderGrams += evalRes.recipe.milkBase.amount;
      }
    }
  }

  return {
    totalF75Ml,
    totalF100Ml,
    totalPatientsCount: patients.length,
    f75PatientsCount,
    f100PatientsCount,
    totalCmvSolutionMl: Number(totalCmvSolutionMl.toFixed(1)),
    totalSugarGrams: Number(totalSugarGrams.toFixed(1)),
    totalOilGrams: Number(totalOilGrams.toFixed(1)),
    totalCerealFlourGrams: Number(totalCerealFlourGrams.toFixed(1)),
    totalSkimmedMilkPowderGrams: Number(totalSkimmedMilkPowderGrams.toFixed(1)),
  };
}
