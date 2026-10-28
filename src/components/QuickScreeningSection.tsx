import React, { useState, useMemo } from 'react';
import { getWHOThresholds, WHOLengthPoint, getWHOHcfaThresholds } from '../data/whoGrowthStandards';
import { CalculationInput } from '../utils/clinicalCalculations';
import { Minus, Plus, Check, Copy, ArrowRight, Trash2, Printer, Download, X, FileText } from 'lucide-react';
import { ClinicalNumberInput } from './ClinicalNumberInput';

export interface ScreenedChildRecord {
  id: string;
  code: string;
  name: string;
  sex: 'Boy' | 'Girl';
  ageMonths: number;
  heightCm: number;
  weightKg: number;
  muacMm: number;
  headCircumferenceCm: number;
  headCircumferenceStatus: 'Microcephaly (< -2 SD)' | 'Macrocephaly (> +2 SD)' | 'Normal (Median ± 2 SD)';
  edema: 'None' | 'Grade + (Mild)' | 'Grade ++ (Moderate)' | 'Grade +++ (Severe)';
  whzScore: number;
  classification: 'SAM' | 'MAM' | 'Normal';
  primaryTriggers: string[];
  action: string;
  timestamp: string;
  date: string;
}

interface QuickScreeningSectionProps {
  facilityName?: string;
  clinicianName?: string;
  onAdmitToInpatient?: (input: Partial<CalculationInput>) => void;
  onSendToOutpatient?: (childData: {
    weightKg: number;
    ageMonths: number;
    heightCm: number;
    muacMm: number;
    headCircumferenceCm: number;
    edema: 'None' | 'Grade + (Mild)' | 'Grade ++ (Moderate)' | 'Grade +++ (Severe)';
    code: string;
    name: string;
  }) => void;
}

// Initial realistic screening cohort representing field community triage
const INITIAL_SCREENING_RECORDS: ScreenedChildRecord[] = [
  {
    id: 'scn-1',
    code: 'SCN-2026-001',
    name: 'Ibrahim S.',
    sex: 'Boy',
    ageMonths: 14,
    heightCm: 69.0,
    weightKg: 6.2,
    muacMm: 110,
    headCircumferenceCm: 44.5,
    headCircumferenceStatus: 'Normal (Median ± 2 SD)',
    edema: 'None',
    whzScore: -3.3,
    classification: 'SAM',
    primaryTriggers: ['MUAC < 115 mm (110 mm, Red Tape)', 'WHZ < -3 SD (-3.3 SD)'],
    action: 'SAM without medical complications. Perform WHO Appetite Test. If passed, enroll in Outpatient OTP with RUTF.',
    timestamp: '08:45',
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: 'scn-2',
    code: 'SCN-2026-002',
    name: 'Fatima Z.',
    sex: 'Girl',
    ageMonths: 22,
    heightCm: 79.5,
    weightKg: 8.4,
    muacMm: 120,
    headCircumferenceCm: 46.8,
    headCircumferenceStatus: 'Normal (Median ± 2 SD)',
    edema: 'None',
    whzScore: -2.3,
    classification: 'MAM',
    primaryTriggers: ['MUAC between 115 and 124 mm (120 mm, Yellow Tape)', 'WHZ between -3 and -2 SD (-2.3 SD)'],
    action: 'Moderate Acute Malnutrition. Enroll in Supplementary Feeding (RUSF / CSB++). Monitor weight bi-weekly.',
    timestamp: '09:10',
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: 'scn-3',
    code: 'SCN-2026-003',
    name: 'Amina K.',
    sex: 'Girl',
    ageMonths: 9,
    heightCm: 65.5,
    weightKg: 5.8,
    muacMm: 108,
    headCircumferenceCm: 42.0,
    headCircumferenceStatus: 'Normal (Median ± 2 SD)',
    edema: 'Grade ++ (Moderate)',
    whzScore: -3.5,
    classification: 'SAM',
    primaryTriggers: ['Bilateral pitting edema (Grade ++ (Moderate))', 'MUAC < 115 mm (108 mm)', 'WHZ < -3 SD'],
    action: 'Urgent Inpatient Admission. SAM with bilateral pitting edema requires Phase 1 stabilization with F-75 formula.',
    timestamp: '09:35',
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: 'scn-4',
    code: 'SCN-2026-004',
    name: 'Musa D.',
    sex: 'Boy',
    ageMonths: 36,
    heightCm: 94.0,
    weightKg: 13.8,
    muacMm: 145,
    headCircumferenceCm: 49.5,
    headCircumferenceStatus: 'Normal (Median ± 2 SD)',
    edema: 'None',
    whzScore: 0.1,
    classification: 'Normal',
    primaryTriggers: ['MUAC ≥ 125 mm (145 mm, Green Tape)', 'WHZ ≥ -2 SD (+0.1 SD)'],
    action: 'Adequate nutrition and linear growth. Continue routine monthly growth monitoring and age-appropriate feeding counseling.',
    timestamp: '10:05',
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: 'scn-5',
    code: 'SCN-2026-005',
    name: 'Zainab T.',
    sex: 'Girl',
    ageMonths: 18,
    heightCm: 76.0,
    weightKg: 7.7,
    muacMm: 122,
    headCircumferenceCm: 45.4,
    headCircumferenceStatus: 'Normal (Median ± 2 SD)',
    edema: 'None',
    whzScore: -2.1,
    classification: 'MAM',
    primaryTriggers: ['MUAC between 115 and 124 mm (122 mm, Yellow Tape)', 'WHZ between -3 and -2 SD (-2.1 SD)'],
    action: 'Moderate Acute Malnutrition. Enroll in Supplementary Feeding (RUSF / CSB++). Monitor weight bi-weekly.',
    timestamp: '10:30',
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: 'scn-6',
    code: 'SCN-2026-006',
    name: 'Bilal M.',
    sex: 'Boy',
    ageMonths: 28,
    heightCm: 88.5,
    weightKg: 12.3,
    muacMm: 140,
    headCircumferenceCm: 48.6,
    headCircumferenceStatus: 'Normal (Median ± 2 SD)',
    edema: 'None',
    whzScore: -0.2,
    classification: 'Normal',
    primaryTriggers: ['MUAC ≥ 125 mm (140 mm, Green Tape)', 'WHZ ≥ -2 SD (-0.2 SD)'],
    action: 'Adequate nutrition and linear growth. Continue routine monthly growth monitoring and age-appropriate feeding counseling.',
    timestamp: '11:00',
    date: new Date().toISOString().split('T')[0],
  },
];

export const QuickScreeningSection: React.FC<QuickScreeningSectionProps> = ({
  facilityName = 'Nutrition Stabilization Clinic',
  clinicianName = 'Clinical Nutritionist',
  onAdmitToInpatient,
  onSendToOutpatient,
}) => {
  // Rapid Form Input States
  const [sex, setSex] = useState<'Boy' | 'Girl'>('Boy');
  const [ageMonths, setAgeMonths] = useState<number>(18);
  const [heightCm, setHeightCm] = useState<number>(75.0);
  const [weightKg, setWeightKg] = useState<number>(7.2);
  const [muacMm, setMuacMm] = useState<number>(112);
  const [headCircumferenceCm, setHeadCircumferenceCm] = useState<number>(46.0);
  const [edema, setEdema] = useState<
    'None' | 'Grade + (Mild)' | 'Grade ++ (Moderate)' | 'Grade +++ (Severe)'
  >('None');
  const [childName, setChildName] = useState<string>('');

  // Precision Stepper Adjustments
  const adjustWeight = (delta: number) => {
    setWeightKg((prev) => Math.max(1.5, Math.min(30.0, Number((prev + delta).toFixed(1)))));
  };

  const adjustHeight = (delta: number) => {
    setHeightCm((prev) => Math.max(45.0, Math.min(115.0, Number((prev + delta).toFixed(1)))));
  };

  const adjustMuac = (delta: number) => {
    setMuacMm((prev) => Math.max(70, Math.min(180, prev + delta)));
  };

  const adjustHeadCircumference = (delta: number) => {
    setHeadCircumferenceCm((prev) => Math.max(30.0, Math.min(58.0, Number((prev + delta).toFixed(1)))));
  };

  const adjustAge = (delta: number) => {
    setAgeMonths((prev) => Math.max(0, Math.min(59, prev + delta)));
  };

  // Screening Session Register
  const [screeningLog, setScreeningLog] = useState<ScreenedChildRecord[]>(INITIAL_SCREENING_RECORDS);
  const [copiedTally, setCopiedTally] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'SAM' | 'MAM' | 'Normal'>('ALL');
  const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);

  // Next Generated Trackable Screening Code
  const currentYear = new Date().getFullYear();
  const nextChildCode = useMemo(() => {
    const nextSeq = screeningLog.length + 1;
    return `SCN-${currentYear}-${String(nextSeq).padStart(3, '0')}`;
  }, [screeningLog.length, currentYear]);

  // Compute live WHO thresholds, WHZ score, and Head Circumference status
  const evaluation = useMemo(() => {
    const thresholds: WHOLengthPoint = getWHOThresholds(heightCm, sex);
    const diffFromSd3 = Number((weightKg - thresholds.sd3neg).toFixed(2));
    const diffFromSd2 = Number((weightKg - thresholds.sd2neg).toFixed(2));

    let wflZScore = 0;
    if (weightKg === thresholds.median) {
      wflZScore = 0;
    } else if (weightKg < thresholds.median) {
      const sdDist = (thresholds.median - thresholds.sd3neg) / 3;
      wflZScore = Number(((weightKg - thresholds.median) / sdDist).toFixed(2));
    } else {
      const sdDist = (thresholds.sd3 - thresholds.median) / 3;
      wflZScore = Number(((weightKg - thresholds.median) / sdDist).toFixed(2));
    }

    // Head Circumference for Age Evaluation
    const hcfaTh = getWHOHcfaThresholds(ageMonths, sex);
    let headCircumferenceStatus: 'Microcephaly (< -2 SD)' | 'Macrocephaly (> +2 SD)' | 'Normal (Median ± 2 SD)' =
      'Normal (Median ± 2 SD)';
    if (headCircumferenceCm < hcfaTh.sd2neg) {
      headCircumferenceStatus = 'Microcephaly (< -2 SD)';
    } else if (headCircumferenceCm > hcfaTh.sd2) {
      headCircumferenceStatus = 'Macrocephaly (> +2 SD)';
    }

    const triggers: string[] = [];
    const isEdematous = edema !== 'None';
    const isSevereEdema = edema === 'Grade +++ (Severe)';
    const isInfantUnder6m = ageMonths < 6;

    let classification: 'SAM' | 'MAM' | 'Normal' = 'Normal';
    let action = 'Adequate nutrition and linear growth. Continue routine monthly growth monitoring and IYCF counseling.';

    if (isInfantUnder6m) {
      // INFANTS UNDER 6 MONTHS (< 6 months)
      const isSamZScore = weightKg < thresholds.sd3neg;
      const isMamZScore = !isSamZScore && weightKg < thresholds.sd2neg;

      if (isEdematous || isSamZScore) {
        classification = 'SAM';
        if (isEdematous) triggers.push(`Bilateral edema (${edema}) in infant < 6m`);
        if (isSamZScore) triggers.push(`WHZ < -3 SD (${wflZScore} SD, cutoff ${thresholds.sd3neg} kg)`);

        if (isSevereEdema) {
          action = 'Urgent Inpatient Admission: Severe edema in infant < 6m. Admit for stabilization with F-75. RUTF is contraindicated.';
        } else if (isEdematous) {
          action = 'Inpatient Referral: Bilateral edema in infant < 6m requires inpatient stabilization and skilled lactation support.';
        } else {
          action = 'Severe wasting in infant < 6m: Admit to inpatient if complicated or failing to feed. Provide skilled lactation support.';
        }
      } else if (isMamZScore) {
        classification = 'MAM';
        triggers.push(`WHZ between -3 and -2 SD (${wflZScore} SD) in infant < 6m`);
        action = 'Moderate acute malnutrition in infant < 6m: Provide skilled breastfeeding assessment and monitor weekly. RUTF is contraindicated.';
      } else {
        triggers.push(`WHZ ≥ -2 SD (${wflZScore} SD)`);
        action = 'Adequate nutrition status for infant < 6m. Support exclusive breastfeeding.';
      }
    } else {
      // CHILDREN AGED 6–59 MONTHS
      const isSamMuac = muacMm < 115;
      const isMamMuac = muacMm >= 115 && muacMm < 125;
      const isSamZScore = weightKg < thresholds.sd3neg;
      const isMamZScore = !isSamZScore && weightKg < thresholds.sd2neg;

      if (isEdematous || isSamMuac || isSamZScore) {
        classification = 'SAM';
        if (isEdematous) triggers.push(`Bilateral pitting edema (${edema})`);
        if (isSamMuac) triggers.push(`MUAC < 115 mm (${muacMm} mm, Red Tape)`);
        if (isSamZScore) triggers.push(`WHZ < -3 SD (${wflZScore} SD, cutoff ${thresholds.sd3neg} kg)`);

        if (isEdematous || isSevereEdema) {
          action = 'Inpatient Admission: SAM with bilateral edema. Admit for Phase 1 stabilization with F-75 formula.';
        } else if (isSamMuac || isSamZScore) {
          action = 'SAM without medical complications: Perform WHO Appetite Test. If passed, enroll in Outpatient OTP with RUTF. If failed, admit to Inpatient.';
        }
      } else if (isMamMuac || isMamZScore) {
        classification = 'MAM';
        if (isMamMuac) triggers.push(`MUAC between 115 and 124 mm (${muacMm} mm, Yellow Tape)`);
        if (isMamZScore) triggers.push(`WHZ between -3 and -2 SD (${wflZScore} SD)`);
        action = 'Moderate Acute Malnutrition: Enroll in Supplementary Feeding Program (SFP/RUSF) or counseling. Monitor weight bi-weekly.';
      } else {
        triggers.push(`MUAC ≥ 125 mm (${muacMm} mm, Green Tape)`);
        triggers.push(`WHZ ≥ -2 SD (${wflZScore} SD)`);
        action = 'Normal nutrition status. Continue monthly growth monitoring and IYCF counseling.';
      }
    }

    if (headCircumferenceStatus !== 'Normal (Median ± 2 SD)') {
      triggers.push(`OFC: ${headCircumferenceStatus} (${headCircumferenceCm} cm)`);
    }

    return {
      thresholds,
      hcfaTh,
      headCircumferenceStatus,
      wflZScore,
      diffFromSd3,
      diffFromSd2,
      classification,
      triggers,
      action,
    };
  }, [sex, ageMonths, heightCm, weightKg, muacMm, headCircumferenceCm, edema]);

  const handleLogChild = () => {
    const assignedCode = nextChildCode;
    const finalName = childName.trim() ? childName.trim() : `Child ${assignedCode.split('-').pop()}`;

    const newRecord: ScreenedChildRecord = {
      id: `child-${Date.now()}`,
      code: assignedCode,
      name: finalName,
      sex,
      ageMonths,
      heightCm,
      weightKg,
      muacMm,
      headCircumferenceCm,
      headCircumferenceStatus: evaluation.headCircumferenceStatus,
      edema,
      whzScore: evaluation.wflZScore,
      classification: evaluation.classification,
      primaryTriggers: evaluation.triggers,
      action: evaluation.action,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
    };

    setScreeningLog((prev) => [newRecord, ...prev]);
    setChildName('');
  };

  const handleClearLog = () => {
    if (confirm('Clear screening session register? This will purge all recorded screening records.')) {
      setScreeningLog([]);
    }
  };

  const handleCopyTally = () => {
    let summary = `PEDICAL FIELD SCREENING ANALYSIS REPORT\n`;
    summary += `Facility: ${facilityName} | Screener: ${clinicianName}\n`;
    summary += `Date: ${new Date().toLocaleDateString()} | Total Screened: ${screeningLog.length}\n`;
    const samCount = screeningLog.filter((c) => c.classification === 'SAM').length;
    const mamCount = screeningLog.filter((c) => c.classification === 'MAM').length;
    const normalCount = screeningLog.filter((c) => c.classification === 'Normal').length;
    summary += `Prevalence: SAM: ${samCount} (${stats.samPct}%) | MAM: ${mamCount} (${stats.mamPct}%) | Normal: ${normalCount} (${stats.normalPct}%)\n`;
    summary += `Global Acute Malnutrition (GAM): ${stats.sam + stats.mam} (${stats.gamPct}%)\n\n`;
    summary += `Code | Name | Sex | Age | Wt(kg) | Ht(cm) | WHZ | MUAC(mm) | HC(cm) | Edema | Result\n`;
    screeningLog.forEach((c) => {
      summary += `${c.code} | ${c.name} | ${c.sex} | ${c.ageMonths}m | ${c.weightKg}kg | ${c.heightCm}cm | ${c.whzScore} | ${c.muacMm}mm | ${c.headCircumferenceCm}cm | ${c.edema} | ${c.classification}\n`;
    });

    navigator.clipboard.writeText(summary);
    setCopiedTally(true);
    setTimeout(() => setCopiedTally(false), 2000);
  };

  const handleExportCSV = () => {
    const headers = [
      'Screening Code',
      'Child Name',
      'Date',
      'Time',
      'Sex',
      'Age (Months)',
      'Weight (kg)',
      'Height (cm)',
      'WHZ Score (SD)',
      'MUAC (mm)',
      'Head Circumference (cm)',
      'HC Status',
      'Edema',
      'Classification',
      'Action Protocol',
    ];

    const rows = screeningLog.map((r) => [
      `"${r.code}"`,
      `"${r.name}"`,
      `"${r.date}"`,
      `"${r.timestamp}"`,
      `"${r.sex}"`,
      r.ageMonths,
      r.weightKg,
      r.heightCm,
      r.whzScore,
      r.muacMm,
      r.headCircumferenceCm,
      `"${r.headCircumferenceStatus}"`,
      `"${r.edema}"`,
      `"${r.classification}"`,
      `"${r.action.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pedical-screening-analysis-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = useMemo(() => {
    const total = screeningLog.length;
    const sam = screeningLog.filter((c) => c.classification === 'SAM').length;
    const mam = screeningLog.filter((c) => c.classification === 'MAM').length;
    const normal = screeningLog.filter((c) => c.classification === 'Normal').length;
    const microcephaly = screeningLog.filter((c) => c.headCircumferenceStatus === 'Microcephaly (< -2 SD)').length;
    const macrocephaly = screeningLog.filter((c) => c.headCircumferenceStatus === 'Macrocephaly (> +2 SD)').length;
    const edemaCount = screeningLog.filter((c) => c.edema !== 'None').length;
    const boysCount = screeningLog.filter((c) => c.sex === 'Boy').length;
    const girlsCount = screeningLog.filter((c) => c.sex === 'Girl').length;

    const infantsUnder6m = screeningLog.filter((c) => c.ageMonths < 6).length;
    const age6to23m = screeningLog.filter((c) => c.ageMonths >= 6 && c.ageMonths < 24).length;
    const age24to59m = screeningLog.filter((c) => c.ageMonths >= 24).length;

    const gam = sam + mam;
    const gamPct = total > 0 ? Math.round((gam / total) * 100) : 0;

    return {
      total,
      sam,
      mam,
      normal,
      gam,
      gamPct,
      microcephaly,
      macrocephaly,
      edemaCount,
      boysCount,
      girlsCount,
      infantsUnder6m,
      age6to23m,
      age24to59m,
      samPct: total > 0 ? Math.round((sam / total) * 100) : 0,
      mamPct: total > 0 ? Math.round((mam / total) * 100) : 0,
      normalPct: total > 0 ? Math.round((normal / total) * 100) : 0,
    };
  }, [screeningLog]);

  const filteredLog = useMemo(() => {
    if (activeFilter === 'ALL') return screeningLog;
    return screeningLog.filter((r) => r.classification === activeFilter);
  }, [screeningLog, activeFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Field Screening &amp; Malnutrition Triage
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Community triage with instant WHO acute malnutrition classification, Head Circumference ($OFC$) evaluation, and session cohort reporting.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowAnalysisModal(true)}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 min-h-[40px]"
          >
            <Printer className="w-4 h-4" />
            <span>Analysis Report &amp; PDF</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Workflow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Step 1. Child Measurements Form (7 Cols) */}
        <div className="lg:col-span-7 card-depth rounded-2xl p-5 sm:p-6 space-y-5 bg-white">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Step 1</span>
              <h3 className="text-base font-bold text-slate-900">Enter Child Anthropometrics</h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Assigned Code</span>
              <span className="text-xs font-mono font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md shadow-2xs">
                {nextChildCode}
              </span>
            </div>
          </div>

          {/* Child Name / Identification (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Child Name or Identification (Optional)
            </label>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="e.g. Aisha Bello or Household #14"
              className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-300 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
            />
          </div>

          {/* Sex & Age */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Sex</label>
              <div className="grid grid-cols-2 gap-2 h-11">
                <button
                  type="button"
                  onClick={() => setSex('Boy')}
                  className={`rounded-xl font-bold transition-all text-center flex items-center justify-center min-h-[44px] ${
                    sex === 'Boy'
                      ? 'btn-tactile-primary text-white font-bold'
                      : 'stepper-tactile text-slate-700'
                  }`}
                >
                  Boy
                </button>
                <button
                  type="button"
                  onClick={() => setSex('Girl')}
                  className={`rounded-xl font-bold transition-all text-center flex items-center justify-center min-h-[44px] ${
                    sex === 'Girl'
                      ? 'btn-tactile-primary text-white font-bold'
                      : 'stepper-tactile text-slate-700'
                  }`}
                >
                  Girl
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Age (Months)</label>
                <span className="text-xs font-mono font-bold text-slate-900">{ageMonths} mo</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustAge(-1)}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl stepper-tactile text-slate-800 font-bold shrink-0"
                  aria-label="Decrease age by 1 month"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1">
                  <ClinicalNumberInput
                    value={ageMonths}
                    onChange={(val) => setAgeMonths(val)}
                    min={0}
                    max={59}
                    isInteger={true}
                    unit="mo"
                    className="w-full text-center h-11 min-h-[44px] rounded-xl border border-slate-300 text-base font-bold text-slate-900 bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => adjustAge(1)}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl stepper-tactile text-slate-800 font-bold shrink-0"
                  aria-label="Increase age by 1 month"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Special Guidance Note for Infants < 6 Months */}
          {ageMonths < 6 && (
            <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 leading-relaxed font-sans shadow-2xs">
              <strong>Infant &lt; 6 months (WHO 2023):</strong> Diagnosed primarily by Weight-for-Length and bilateral edema. MUAC cutoffs (&lt;115 mm) and RUTF appetite tests are not diagnostic for infants under 6 months.
            </div>
          )}

          {/* Weight & Length Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Weight (kg)</label>
                <span className="text-xs font-mono font-bold text-slate-900">{weightKg.toFixed(1)} kg</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustWeight(-0.1)}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl stepper-tactile text-slate-800 font-bold shrink-0"
                  aria-label="Decrease weight by 0.1 kg"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1">
                  <ClinicalNumberInput
                    value={weightKg}
                    onChange={(val) => setWeightKg(val)}
                    min={1.5}
                    max={30.0}
                    step={0.1}
                    unit="kg"
                    className="w-full text-center h-11 min-h-[44px] rounded-xl border border-slate-300 text-base font-bold text-slate-900 bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => adjustWeight(0.1)}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl stepper-tactile text-slate-800 font-bold shrink-0"
                  aria-label="Increase weight by 0.1 kg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Length / Height (cm)</label>
                <span className="text-xs font-mono font-bold text-slate-900">{heightCm.toFixed(1)} cm</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustHeight(-0.5)}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl stepper-tactile text-slate-800 font-bold shrink-0"
                  aria-label="Decrease length by 0.5 cm"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1">
                  <ClinicalNumberInput
                    value={heightCm}
                    onChange={(val) => setHeightCm(val)}
                    min={45.0}
                    max={115.0}
                    step={0.5}
                    unit="cm"
                    className="w-full text-center h-11 min-h-[44px] rounded-xl border border-slate-300 text-base font-bold text-slate-900 bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => adjustHeight(0.5)}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl stepper-tactile text-slate-800 font-bold shrink-0"
                  aria-label="Increase length by 0.5 cm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Head Circumference (OFC) Input */}
          <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Head Circumference / OFC (cm)
                </label>
                <span className="text-[11px] text-slate-500 font-medium">Occipitofrontal Circumference (0–60 mo WHO Standard)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustHeadCircumference(-0.5)}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl stepper-tactile text-slate-800 font-bold shrink-0"
                  aria-label="Decrease Head Circumference by 0.5 cm"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="w-28">
                  <ClinicalNumberInput
                    value={headCircumferenceCm}
                    onChange={(val) => setHeadCircumferenceCm(val)}
                    min={30.0}
                    max={58.0}
                    step={0.1}
                    unit="cm"
                    className="w-full text-center h-11 min-h-[44px] rounded-xl border border-slate-300 text-base font-bold text-slate-900 bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => adjustHeadCircumference(0.5)}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl stepper-tactile text-slate-800 font-bold shrink-0"
                  aria-label="Increase Head Circumference by 0.5 cm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Head Circumference Interpretation */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-600">
                WHO Reference ({ageMonths} mo {sex}): <strong className="font-mono text-slate-900">{evaluation.hcfaTh.median} cm</strong> (Median)
              </span>
              <span
                className={`font-bold px-2.5 py-0.5 rounded-lg text-[11px] shadow-2xs ${
                  evaluation.headCircumferenceStatus === 'Microcephaly (< -2 SD)'
                    ? 'bg-rose-100 border border-rose-200 text-rose-800'
                    : evaluation.headCircumferenceStatus === 'Macrocephaly (> +2 SD)'
                    ? 'bg-amber-100 border border-amber-200 text-amber-900'
                    : 'bg-emerald-100 border border-emerald-200 text-emerald-800'
                }`}
              >
                {evaluation.headCircumferenceStatus}
              </span>
            </div>
          </div>

          {/* MUAC Input & Visual Tape Gauge */}
          <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  MUAC Tape Measurement (mm)
                </label>
                <span className="text-[11px] text-slate-500 font-medium">Mid-Upper Arm Circumference</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustMuac(-1)}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl stepper-tactile text-slate-800 font-bold shrink-0"
                  aria-label="Decrease MUAC by 1 mm"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="w-28">
                  <ClinicalNumberInput
                    value={muacMm}
                    onChange={(val) => setMuacMm(val)}
                    min={70}
                    max={180}
                    isInteger={true}
                    unit="mm"
                    className="w-full text-center h-11 min-h-[44px] rounded-xl border border-slate-300 text-base font-bold text-slate-900 bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => adjustMuac(1)}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl stepper-tactile text-slate-800 font-bold shrink-0"
                  aria-label="Increase MUAC by 1 mm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Visual WHO MUAC Color Tape Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="relative h-7 rounded-xl overflow-hidden flex shadow-inner">
                <div className="w-[40%] bg-rose-500 flex items-center justify-center text-[10px] text-white font-extrabold">
                  &lt; 115 (Red / SAM)
                </div>
                <div className="w-[13.3%] bg-amber-400 flex items-center justify-center text-[10px] text-amber-950 font-extrabold">
                  115-124 (Yellow / MAM)
                </div>
                <div className="w-[46.7%] bg-emerald-500 flex items-center justify-center text-[10px] text-white font-extrabold">
                  &ge; 125 (Green / Normal)
                </div>

                {/* Tape Needle Indicator */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-slate-950 transition-all duration-150 pointer-events-none"
                  style={{
                    left: `calc(${Math.min(100, Math.max(0, ((muacMm - 85) / (160 - 85)) * 100))}% - 2px)`,
                  }}
                >
                  <div className="w-2.5 h-2.5 -top-1 -left-[3px] absolute bg-slate-900 rotate-45 border border-white" />
                </div>
              </div>

              {/* Quick Cutoff Buttons */}
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <span>85 mm</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMuacMm(110)}
                    className="px-2.5 py-1 rounded-lg stepper-tactile hover:bg-rose-50 text-rose-700 text-[11px] font-bold"
                  >
                    110 mm
                  </button>
                  <button
                    type="button"
                    onClick={() => setMuacMm(120)}
                    className="px-2.5 py-1 rounded-lg stepper-tactile hover:bg-amber-50 text-amber-800 text-[11px] font-bold"
                  >
                    120 mm
                  </button>
                  <button
                    type="button"
                    onClick={() => setMuacMm(130)}
                    className="px-2.5 py-1 rounded-lg stepper-tactile hover:bg-emerald-50 text-emerald-800 text-[11px] font-bold"
                  >
                    130 mm
                  </button>
                </div>
                <span>160 mm</span>
              </div>
            </div>
          </div>

          {/* Bilateral Pitting Edema */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Bilateral Pitting Edema
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {(
                [
                  'None',
                  'Grade + (Mild)',
                  'Grade ++ (Moderate)',
                  'Grade +++ (Severe)',
                ] as const
              ).map((g) => {
                const isSelected = edema === g;
                let activeStyle = 'stepper-tactile text-slate-700 hover:text-slate-900';
                if (isSelected) {
                  if (g === 'Grade +++ (Severe)') {
                    activeStyle = 'bg-rose-700 border border-rose-800 text-white font-bold shadow-xs';
                  } else if (g === 'Grade ++ (Moderate)' || g === 'Grade + (Mild)') {
                    activeStyle = 'bg-amber-600 border border-amber-700 text-white font-bold shadow-xs';
                  } else {
                    activeStyle = 'bg-emerald-700 border border-emerald-800 text-white font-bold shadow-xs';
                  }
                }

                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setEdema(g)}
                    className={`p-2.5 rounded-xl text-center font-bold transition-all min-h-[44px] flex items-center justify-center ${activeStyle}`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save to Register Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleLogChild}
              className="w-full py-3.5 px-4 btn-tactile-primary text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 min-h-[46px]"
            >
              <span>Save Child to Session Register ({nextChildCode})</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Step 2. Triage Result & The SAM / MAM / Normal Cards (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card-depth rounded-2xl p-5 sm:p-6 space-y-4 bg-white">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Step 2</span>
                <h3 className="text-base font-bold text-slate-900">WHO Triage Classification</h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
                WHZ: {evaluation.wflZScore > 0 ? `+${evaluation.wflZScore}` : evaluation.wflZScore} SD
              </span>
            </div>

            {/* THREE CARDS: SAM, MAM, NORMAL */}
            <div className="space-y-3">
              
              {/* CARD 1: SAM */}
              <div
                className={`rounded-2xl p-4.5 transition-all ${
                  evaluation.classification === 'SAM'
                    ? 'bg-gradient-to-br from-rose-50/95 via-white to-rose-50/50 border border-rose-300 ring-2 ring-rose-500 shadow-[0_4px_20px_-2px_rgba(225,29,72,0.18)]'
                    : 'card-depth opacity-75 hover:opacity-100 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase ${
                        evaluation.classification === 'SAM'
                          ? 'bg-rose-700 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      SAM
                    </span>
                    <span className="text-xs font-bold text-slate-900">Severe Acute Malnutrition</span>
                  </div>
                  {evaluation.classification === 'SAM' && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-rose-200 border border-rose-300 text-rose-900 shadow-2xs">
                      Active Match
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-600 mt-2 space-y-1">
                  <div><strong>Criteria:</strong> MUAC &lt; 115 mm OR WHZ &lt; -3 SD ({evaluation.thresholds.sd3neg} kg) OR Bilateral Edema</div>
                  <div><strong>Target Care:</strong> Inpatient F-75 Stabilization (if edema or complicated) / Outpatient OTP (RUTF)</div>
                </div>

                {evaluation.classification === 'SAM' && (
                  <div className="mt-3 pt-3 border-t border-rose-200/80 space-y-2">
                    <p className="text-xs font-semibold text-rose-950 leading-relaxed">
                      {evaluation.action}
                    </p>

                    <div className="flex flex-col gap-2 pt-1">
                      {onAdmitToInpatient && (
                        <button
                          type="button"
                          onClick={() =>
                            onAdmitToInpatient({
                              weight_kg: weightKg,
                              height_cm: heightCm,
                              sex,
                              age_months: ageMonths,
                              muac_mm: muacMm,
                              head_circumference_cm: headCircumferenceCm,
                              mrn: nextChildCode,
                              patient_name: childName.trim() ? childName.trim() : `Child ${nextChildCode}`,
                              edema_severity:
                                edema === 'Grade +++ (Severe)'
                                  ? 'Severe (+++)'
                                  : edema === 'None'
                                  ? 'None'
                                  : 'Mild/Moderate (+ / ++)',
                            })
                          }
                          className="w-full py-2.5 px-3.5 btn-tactile-primary text-white font-bold text-xs rounded-xl flex items-center justify-between min-h-[42px]"
                        >
                          <span>Admit Child to Inpatient Ward</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}

                      {ageMonths >= 6 && onSendToOutpatient && (
                        <button
                          type="button"
                          onClick={() =>
                            onSendToOutpatient({
                              weightKg,
                              ageMonths,
                              heightCm,
                              muacMm,
                              headCircumferenceCm,
                              edema,
                              code: nextChildCode,
                              name: childName.trim() ? childName.trim() : `Child ${nextChildCode}`,
                            })
                          }
                          className="w-full py-2.5 px-3.5 bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 border border-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-between min-h-[42px]"
                        >
                          <span>Open in Outpatient OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* CARD 2: MAM */}
              <div
                className={`rounded-2xl p-4.5 transition-all ${
                  evaluation.classification === 'MAM'
                    ? 'bg-gradient-to-br from-amber-50/95 via-white to-amber-50/50 border border-amber-300 ring-2 ring-amber-500 shadow-[0_4px_20px_-2px_rgba(217,119,6,0.18)]'
                    : 'card-depth opacity-75 hover:opacity-100 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase ${
                        evaluation.classification === 'MAM'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      MAM
                    </span>
                    <span className="text-xs font-bold text-slate-900">Moderate Acute Malnutrition</span>
                  </div>
                  {evaluation.classification === 'MAM' && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-200 border border-amber-300 text-amber-900 shadow-2xs">
                      Active Match
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-600 mt-2 space-y-1">
                  <div><strong>Criteria:</strong> MUAC 115–124 mm OR WHZ -3 to -2 SD ({evaluation.thresholds.sd3neg}–{evaluation.thresholds.sd2neg} kg) without edema</div>
                  <div><strong>Target Care:</strong> Supplementary Feeding (RUSF / CSB++), bi-weekly weight monitoring, home counseling</div>
                </div>

                {evaluation.classification === 'MAM' && (
                  <div className="mt-3 pt-3 border-t border-amber-200/80 space-y-2">
                    <p className="text-xs font-semibold text-amber-950 leading-relaxed">
                      {evaluation.action}
                    </p>

                    {ageMonths >= 6 && onSendToOutpatient && (
                      <button
                        type="button"
                        onClick={() =>
                          onSendToOutpatient({
                            weightKg,
                            ageMonths,
                            heightCm,
                            muacMm,
                            headCircumferenceCm,
                            edema,
                            code: nextChildCode,
                            name: childName.trim() ? childName.trim() : `Child ${nextChildCode}`,
                          })
                        }
                        className="w-full py-2.5 px-3.5 bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 border border-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-between min-h-[42px]"
                      >
                        <span>Open in Supplementary / OTP Clinic</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* CARD 3: NORMAL */}
              <div
                className={`rounded-2xl p-4.5 transition-all ${
                  evaluation.classification === 'Normal'
                    ? 'bg-gradient-to-br from-emerald-50/95 via-white to-emerald-50/50 border border-emerald-300 ring-2 ring-emerald-500 shadow-[0_4px_20px_-2px_rgba(16,185,129,0.18)]'
                    : 'card-depth opacity-75 hover:opacity-100 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase ${
                        evaluation.classification === 'Normal'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      NORMAL
                    </span>
                    <span className="text-xs font-bold text-slate-900">Adequate Growth</span>
                  </div>
                  {evaluation.classification === 'Normal' && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-200 border border-emerald-300 text-emerald-900 shadow-2xs">
                      Active Match
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-600 mt-2 space-y-1">
                  <div><strong>Criteria:</strong> MUAC &ge; 125 mm AND WHZ &ge; -2 SD ({evaluation.thresholds.sd2neg} kg) without edema</div>
                  <div><strong>Target Care:</strong> Monthly growth monitoring and promotion (GMP), routine immunizations, and IYCF counseling</div>
                </div>

                {evaluation.classification === 'Normal' && (
                  <div className="mt-3 pt-3 border-t border-emerald-200/80">
                    <p className="text-xs font-semibold text-emerald-950 leading-relaxed">
                      {evaluation.action}
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* WHO Cutoffs Reference Pill */}
            <div className="pt-2 border-t border-slate-100 text-xs flex items-center justify-between text-slate-500">
              <span>Cutoffs ({heightCm} cm {sex}):</span>
              <span className="font-mono text-slate-700">
                -3 SD: <strong>{evaluation.thresholds.sd3neg}kg</strong> &middot; -2 SD: <strong>{evaluation.thresholds.sd2neg}kg</strong> &middot; Median: <strong>{evaluation.thresholds.median}kg</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Session Register & Cohort Tally */}
      <div className="card-depth rounded-2xl p-5 sm:p-6 space-y-4 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Step 3</span>
            <h3 className="text-base font-bold text-slate-900">Screening Register ({stats.total} Children)</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAnalysisModal(true)}
              className="px-3.5 py-1.5 btn-tactile-primary text-white font-bold text-xs rounded-xl flex items-center gap-1.5 min-h-[36px]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Analysis Report &amp; PDF</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={screeningLog.length === 0}
              className="px-3 py-1.5 stepper-tactile text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 min-h-[36px] disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleCopyTally}
              disabled={screeningLog.length === 0}
              className="px-3 py-1.5 stepper-tactile text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 min-h-[36px] disabled:opacity-40"
            >
              {copiedTally ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedTally ? 'Copied' : 'Copy'}</span>
            </button>
            {screeningLog.length > 0 && (
              <button
                type="button"
                onClick={handleClearLog}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 min-h-[36px]"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Tally Stats Grid with 3 Cards: SAM, MAM, Normal */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* ALL FILTER */}
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`p-3.5 rounded-xl text-left transition-all ${
              activeFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-900'
                : 'card-depth card-depth-hover text-slate-700 bg-white'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Total Cohort</div>
            <div className="text-2xl font-black font-mono mt-1 tabular-nums">{stats.total}</div>
            <div className="text-xs font-semibold mt-0.5 opacity-80">GAM: {stats.gamPct}%</div>
          </button>

          {/* SAM CARD */}
          <button
            type="button"
            onClick={() => setActiveFilter('SAM')}
            className={`p-3.5 rounded-xl text-left transition-all ${
              activeFilter === 'SAM'
                ? 'bg-rose-700 text-white shadow-md ring-2 ring-rose-700'
                : 'card-depth card-depth-hover text-rose-950 bg-gradient-to-br from-rose-50/70 via-white to-rose-50/30 border-rose-200/80'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-85">SAM</div>
            <div className="text-2xl font-black font-mono mt-1 tabular-nums">{stats.sam}</div>
            <div className="text-xs font-semibold mt-0.5 opacity-85">{stats.samPct}% of cohort</div>
          </button>

          {/* MAM CARD */}
          <button
            type="button"
            onClick={() => setActiveFilter('MAM')}
            className={`p-3.5 rounded-xl text-left transition-all ${
              activeFilter === 'MAM'
                ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-600'
                : 'card-depth card-depth-hover text-amber-950 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 border-amber-200/80'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-85">MAM</div>
            <div className="text-2xl font-black font-mono mt-1 tabular-nums">{stats.mam}</div>
            <div className="text-xs font-semibold mt-0.5 opacity-85">{stats.mamPct}% of cohort</div>
          </button>

          {/* NORMAL CARD */}
          <button
            type="button"
            onClick={() => setActiveFilter('Normal')}
            className={`p-3.5 rounded-xl text-left transition-all ${
              activeFilter === 'Normal'
                ? 'bg-emerald-700 text-white shadow-md ring-2 ring-emerald-700'
                : 'card-depth card-depth-hover text-emerald-950 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 border-emerald-200/80'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-85">Normal</div>
            <div className="text-2xl font-black font-mono mt-1 tabular-nums">{stats.normal}</div>
            <div className="text-xs font-semibold mt-0.5 opacity-85">{stats.normalPct}% of cohort</div>
          </button>
        </div>

        {/* Log Records Table with Trackable Codes */}
        {filteredLog.length > 0 ? (
          <div className="overflow-x-auto pt-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Child Name</th>
                  <th className="py-2.5 px-3">Sex/Age</th>
                  <th className="py-2.5 px-3 font-mono">Weight / Height</th>
                  <th className="py-2.5 px-3 font-mono">WHZ</th>
                  <th className="py-2.5 px-3 font-mono">MUAC</th>
                  <th className="py-2.5 px-3 font-mono">OFC (cm)</th>
                  <th className="py-2.5 px-3">Edema</th>
                  <th className="py-2.5 px-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLog.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">
                      {c.code}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900">
                      {c.name}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {c.sex} &middot; {c.ageMonths}m
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {c.weightKg.toFixed(1)}kg / {c.heightCm.toFixed(1)}cm
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                      {c.whzScore > 0 ? `+${c.whzScore}` : c.whzScore} SD
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                      {c.muacMm} mm
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {c.headCircumferenceCm ? `${c.headCircumferenceCm}cm` : '—'}
                    </td>
                    <td className="py-3 px-3">
                      {c.edema !== 'None' ? (
                        <span className="font-bold text-rose-700">{c.edema}</span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg font-bold text-xs ${
                          c.classification === 'SAM'
                            ? 'bg-rose-100 text-rose-800'
                            : c.classification === 'MAM'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {c.classification}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs italic bg-slate-50/70 rounded-xl">
            {activeFilter === 'ALL'
              ? 'No children recorded yet. Tap "Save Child to Session Register" above to log field visits.'
              : `No children with classification "${activeFilter}" in this session.`}
          </div>
        )}
      </div>

      {/* ANALYSIS PDF & PRINT REPORT MODAL */}
      {showAnalysisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Top Actions Bar (Hidden on print) */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0 no-print">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm sm:text-base font-bold">Field Screening Analysis Report</h3>
                  <p className="text-[11px] text-slate-400">Exportable clinical cohort summary for EMR and DHIS2 reporting</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 min-h-[36px]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAnalysisModal(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  aria-label="Close Analysis Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Analysis Content Sheet */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 print:p-0 print:space-y-4 print:text-black">
              {/* Report Document Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-bold text-blue-700 tracking-wider uppercase">
                    PediCal Clinical Nutrition Suite &middot; Field Triage
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                    Field Screening &amp; Epidemiological Analysis
                  </h1>
                  <p className="text-xs text-slate-600 mt-1">
                    Facility: <strong className="text-slate-900">{facilityName}</strong> &middot; Evaluator: <strong className="text-slate-900">{clinicianName}</strong>
                  </p>
                </div>

                <div className="text-right text-xs text-slate-600 space-y-0.5 font-sans">
                  <div>Date: <strong className="font-mono text-slate-900">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
                  <div>Protocol: <strong>WHO 2023 Child Malnutrition Standards</strong></div>
                  <div>Cohort Size: <strong className="font-mono text-slate-900">{stats.total} Children</strong></div>
                </div>
              </div>

              {/* Epidemiological Summary KPI Cards */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Cohort Malnutrition Prevalence
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Global Malnutrition (GAM)</span>
                    <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">{stats.gamPct}%</span>
                    <span className="text-[11px] text-slate-500 font-medium">({stats.gam} of {stats.total} children)</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Severe Acute (SAM)</span>
                    <span className="text-2xl font-bold font-mono text-rose-950 mt-1 block">{stats.samPct}%</span>
                    <span className="text-[11px] text-rose-800 font-medium">({stats.sam} children)</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Moderate Acute (MAM)</span>
                    <span className="text-2xl font-bold font-mono text-amber-950 mt-1 block">{stats.mamPct}%</span>
                    <span className="text-[11px] text-amber-800 font-medium">({stats.mam} children)</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Normal Growth</span>
                    <span className="text-2xl font-bold font-mono text-emerald-950 mt-1 block">{stats.normalPct}%</span>
                    <span className="text-[11px] text-emerald-800 font-medium">({stats.normal} children)</span>
                  </div>
                </div>
              </div>

              {/* Clinical & Neurological Indicators Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sex Breakdown</span>
                  <div className="mt-1 font-semibold text-slate-900">
                    Boys: <span className="font-mono">{stats.boysCount}</span> &middot; Girls: <span className="font-mono">{stats.girlsCount}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Age Distribution</span>
                  <div className="mt-1 font-semibold text-slate-900">
                    &lt;6m: <span className="font-mono">{stats.infantsUnder6m}</span> &middot; 6–23m: <span className="font-mono">{stats.age6to23m}</span> &middot; 24–59m: <span className="font-mono">{stats.age24to59m}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Clinical Alerts</span>
                  <div className="mt-1 font-semibold text-slate-900">
                    Edema cases: <span className="font-mono font-bold text-rose-700">{stats.edemaCount}</span> &middot; Microcephaly: <span className="font-mono font-bold text-amber-700">{stats.microcephaly}</span>
                  </div>
                </div>
              </div>

              {/* Comprehensive Screened Children Register Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Individual Screened Children Register ({screeningLog.length} Records)
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                        <th className="py-2 px-2.5">Code</th>
                        <th className="py-2 px-2.5">Name</th>
                        <th className="py-2 px-2.5">Sex/Age</th>
                        <th className="py-2 px-2.5 font-mono">Weight</th>
                        <th className="py-2 px-2.5 font-mono">Length</th>
                        <th className="py-2 px-2.5 font-mono">WHZ</th>
                        <th className="py-2 px-2.5 font-mono">MUAC</th>
                        <th className="py-2 px-2.5 font-mono">OFC (cm)</th>
                        <th className="py-2 px-2.5">Edema</th>
                        <th className="py-2 px-2.5">Diagnosis</th>
                        <th className="py-2 px-2.5">Action Protocol</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {screeningLog.map((c) => (
                        <tr key={c.id} className="text-[11px]">
                          <td className="py-2 px-2.5 font-mono font-bold text-blue-800">{c.code}</td>
                          <td className="py-2 px-2.5 font-medium text-slate-900">{c.name}</td>
                          <td className="py-2 px-2.5 text-slate-600">{c.sex} / {c.ageMonths}m</td>
                          <td className="py-2 px-2.5 font-mono">{c.weightKg.toFixed(1)}kg</td>
                          <td className="py-2 px-2.5 font-mono">{c.heightCm.toFixed(1)}cm</td>
                          <td className="py-2 px-2.5 font-mono font-bold">
                            {c.whzScore > 0 ? `+${c.whzScore}` : c.whzScore}
                          </td>
                          <td className="py-2 px-2.5 font-mono">{c.muacMm}mm</td>
                          <td className="py-2 px-2.5 font-mono">{c.headCircumferenceCm}cm</td>
                          <td className="py-2 px-2.5">
                            {c.edema !== 'None' ? (
                              <span className="font-bold text-rose-700">{c.edema}</span>
                            ) : (
                              'None'
                            )}
                          </td>
                          <td className="py-2 px-2.5 font-bold">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                c.classification === 'SAM'
                                  ? 'bg-rose-100 text-rose-800'
                                  : c.classification === 'MAM'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {c.classification}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-[10px] text-slate-600 max-w-[200px] truncate" title={c.action}>
                            {c.action}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sign-off Signature Block */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-slate-600">
                <div className="space-y-6">
                  <div>Prepared by (Nutritionist / Dietitian):</div>
                  <div className="border-b border-slate-400 pb-1 font-semibold text-slate-900">
                    {clinicianName}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>Supervising Medical Officer:</div>
                  <div className="border-b border-slate-400 pb-1 text-slate-400 italic">
                    Signature &amp; Stamp
                  </div>
                </div>

                <div className="space-y-6">
                  <div>Date of Verification:</div>
                  <div className="border-b border-slate-400 pb-1 font-mono text-slate-900">
                    {new Date().toISOString().split('T')[0]}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Modal Actions (Hidden on print) */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between no-print">
              <span className="text-xs text-slate-500">
                Print preview formatted for Letter/A4 clinical audit records
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl transition-colors"
                >
                  Download CSV
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Analysis Sheet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
