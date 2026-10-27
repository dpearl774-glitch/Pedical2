import React, { useState, useMemo } from 'react';
import { getWHOThresholds, WHOLengthPoint } from '../data/whoGrowthStandards';
import { CalculationInput } from '../utils/clinicalCalculations';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RotateCcw,
  PlusCircle,
  Copy,
  Check,
  Printer,
  ChevronRight,
  TrendingDown,
  Info,
  Layers,
  ArrowRight,
  Sparkles,
  Download,
  Trash2,
  Minus,
  Plus,
} from 'lucide-react';
import { ClinicalNumberInput } from './ClinicalNumberInput';

export interface ScreenedChildRecord {
  id: string;
  number: number;
  sex: 'Boy' | 'Girl';
  ageMonths: number;
  heightCm: number;
  weightKg: number;
  muacMm: number;
  edema: 'None' | 'Grade + (Mild)' | 'Grade ++ (Moderate)' | 'Grade +++ (Severe)';
  whzScore: number;
  classification: 'SAM' | 'MAM' | 'Normal';
  primaryTriggers: string[];
  action: string;
  timestamp: string;
}

interface QuickScreeningSectionProps {
  onAdmitToInpatient?: (input: Partial<CalculationInput>) => void;
  onSendToOutpatient?: (childData: {
    weightKg: number;
    ageMonths: number;
    heightCm: number;
    muacMm: number;
    edema: 'None' | 'Grade + (Mild)' | 'Grade ++ (Moderate)' | 'Grade +++ (Severe)';
  }) => void;
}

export const QuickScreeningSection: React.FC<QuickScreeningSectionProps> = ({
  onAdmitToInpatient,
  onSendToOutpatient,
}) => {
  // Rapid Form Input States (No admission required)
  const [sex, setSex] = useState<'Boy' | 'Girl'>('Boy');
  const [ageMonths, setAgeMonths] = useState<number>(18);
  const [heightCm, setHeightCm] = useState<number>(75.0);
  const [weightKg, setWeightKg] = useState<number>(7.2);
  const [muacMm, setMuacMm] = useState<number>(112);
  const [edema, setEdema] = useState<
    'None' | 'Grade + (Mild)' | 'Grade ++ (Moderate)' | 'Grade +++ (Severe)'
  >('None');

  // Scroll-safe precision steppers (replaces touch-hijacking sliders)
  const adjustWeight = (delta: number) => {
    setWeightKg((prev) => Math.max(1.5, Math.min(30.0, Number((prev + delta).toFixed(1)))));
  };

  const adjustHeight = (delta: number) => {
    setHeightCm((prev) => Math.max(45.0, Math.min(115.0, Number((prev + delta).toFixed(1)))));
  };

  const adjustMuac = (delta: number) => {
    setMuacMm((prev) => Math.max(70, Math.min(180, prev + delta)));
  };

  const adjustAge = (delta: number) => {
    setAgeMonths((prev) => Math.max(0, Math.min(59, prev + delta)));
  };

  // Quick Session Screening Tally Log
  const [screeningLog, setScreeningLog] = useState<ScreenedChildRecord[]>([]);
  const [copiedTally, setCopiedTally] = useState<boolean>(false);

  // Compute live WHO thresholds and continuous WHZ
  const evaluation = useMemo(() => {
    const thresholds: WHOLengthPoint = getWHOThresholds(heightCm, sex);
    const diffFromSd3 = weightKg - thresholds.sd3neg;
    const diffFromSd2 = weightKg - thresholds.sd2neg;

    // Continuous WHZ calculation
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

    // Diagnostic Triggers
    const triggers: string[] = [];
    const isEdematous = edema !== 'None';
    const isSevereEdema = edema === 'Grade +++ (Severe)';
    const isInfantUnder6m = ageMonths < 6;

    let classification: 'SAM' | 'MAM' | 'Normal' = 'Normal';
    let action = 'Adequate nutrition status. Continue routine growth monitoring and preventive counseling.';

    if (isInfantUnder6m) {
      // -----------------------------------------------------------------------
      // INFANTS UNDER 6 MONTHS (< 6 months / 0–5 months)
      // Authoritative Source: WHO 2023 Guideline on Wasting & Nutritional Oedema
      // & WHO 2013 Updates on Management of SAM in Infants and Children.
      // - Standard MUAC cutoffs (<115 mm / 115–124 mm) are NOT diagnostic for <6m.
      // - Older-child appetite test and OTP with RUTF are strictly CONTRAINDICATED.
      // -----------------------------------------------------------------------
      const isSamZScore = weightKg < thresholds.sd3neg;
      const isMamZScore = !isSamZScore && weightKg < thresholds.sd2neg;

      if (isEdematous || isSamZScore) {
        classification = 'SAM';
        if (isEdematous) triggers.push(`Bilateral pitting edema (${edema}) in infant < 6m`);
        if (isSamZScore) triggers.push(`WHZ < -3 SD (${wflZScore} SD, ref ${thresholds.sd3neg} kg) in infant < 6m`);

        if (isSevereEdema) {
          action = 'Urgent Inpatient Admission: Severe edema in infant < 6m carries high mortality risk. Admit for stabilization with F-75 / specialized support. RUTF is contraindicated.';
        } else if (isEdematous) {
          action = 'Inpatient Referral: Bilateral edema in infant < 6m warrants inpatient stabilization, investigation of underlying causes, and skilled lactation support. RUTF is contraindicated.';
        } else {
          action = 'Severe wasting in infant < 6m: Detailed clinical & breastfeeding assessment. Admit to inpatient if complicated, failing to feed, or severe growth faltering (use Supplementary Suckling Technique / diluted F-100 / formula). If clinically stable, alert, and suckling effectively without danger signs, provide skilled outpatient lactation support. (RUTF contraindicated).';
        }
      } else if (isMamZScore) {
        classification = 'MAM';
        triggers.push(`WHZ between -3 and -2 SD (${wflZScore} SD) in infant < 6m`);
        action = 'Moderate acute malnutrition in infant < 6m: Outpatient IYCF and skilled breastfeeding assessment. Verify attachment, maternal nutrition, and hydration; monitor weight weekly. (RUTF/RUSF contraindicated; inpatient admission not indicated unless danger signs develop).';
      } else {
        triggers.push(`WHZ ≥ -2 SD (${wflZScore} SD) in infant < 6m`);
        triggers.push('No bilateral pitting edema');
        action = 'Adequate nutrition status for infant < 6m. Support exclusive breastfeeding on demand and routine monthly growth monitoring.';
      }

      // Explicitly document MUAC status for infants < 6m without incorrectly triggering SAM/MAM
      triggers.push(`MUAC ${muacMm} mm (Note: <115 mm cutoff not validated for diagnosis in infants < 6m; guided by WFL & clinical signs)`);
    } else {
      // -----------------------------------------------------------------------
      // CHILDREN AGED 6 TO 59 MONTHS (Standard WHO / Ghana Health Service Protocol)
      // -----------------------------------------------------------------------
      const isSamMuac = muacMm < 115;
      const isSamZScore = weightKg < thresholds.sd3neg;
      const isMamMuac = muacMm >= 115 && muacMm < 125;
      const isMamZScore = !isSamZScore && weightKg < thresholds.sd2neg;

      if (isEdematous || isSamMuac || isSamZScore) {
        classification = 'SAM';
        if (isEdematous) triggers.push(`Bilateral pitting edema (${edema})`);
        if (isSamMuac) triggers.push(`MUAC ${muacMm} mm (< 115 mm)`);
        if (isSamZScore) triggers.push(`WHZ < -3 SD (${wflZScore} SD, ref ${thresholds.sd3neg} kg)`);

        if (isSevereEdema) {
          action = 'Emergency: Refer to inpatient F-75 due to generalized severe edema.';
        } else {
          action = 'Appetite test: If passed and stable, admit to OTP (RUTF). If failed, refer to inpatient F-75.';
        }
      } else if (isMamMuac || isMamZScore) {
        classification = 'MAM';
        if (isMamMuac) triggers.push(`MUAC ${muacMm} mm (115–124 mm)`);
        if (isMamZScore) triggers.push(`WHZ between -3 and -2 SD (${wflZScore} SD)`);
        action = 'Admit to supplementary feeding (RUSF) and IYCF counseling.';
      } else {
        triggers.push(`MUAC ${muacMm} mm (≥ 125 mm)`);
        triggers.push(`WHZ ≥ -2 SD (${wflZScore} SD)`);
        triggers.push('No bilateral pitting edema');
      }
    }

    return {
      thresholds,
      wflZScore,
      diffFromSd3: Number(diffFromSd3.toFixed(2)),
      diffFromSd2: Number(diffFromSd2.toFixed(2)),
      classification,
      triggers,
      action,
    };
  }, [sex, heightCm, weightKg, muacMm, edema, ageMonths]);

  // Handle Log & Next Child
  const handleLogAndNext = () => {
    const nextChild: ScreenedChildRecord = {
      id: `child-${Date.now()}`,
      number: screeningLog.length + 1,
      sex,
      ageMonths,
      heightCm,
      weightKg,
      muacMm,
      edema,
      whzScore: evaluation.wflZScore,
      classification: evaluation.classification,
      primaryTriggers: evaluation.triggers,
      action: evaluation.action,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setScreeningLog((prev) => [nextChild, ...prev]);

    // Fast-reset default inputs for next child
    setWeightKg(8.0);
    setHeightCm(75.0);
    setMuacMm(125);
    setEdema('None');
  };

  const handleClearLog = () => {
    if (confirm('Clear the current community screening session log?')) {
      setScreeningLog([]);
    }
  };

  const handleCopyTally = () => {
    let summary = `PEDICAL - COMMUNITY MALNUTRITION SCREENING TALLY\n`;
    summary += `Date: ${new Date().toLocaleDateString()} | Total Screened: ${screeningLog.length}\n`;
    const samCount = screeningLog.filter((c) => c.classification === 'SAM').length;
    const mamCount = screeningLog.filter((c) => c.classification === 'MAM').length;
    const normalCount = screeningLog.filter((c) => c.classification === 'Normal').length;
    summary += `Summary: SAM: ${samCount} | MAM: ${mamCount} | Normal: ${normalCount}\n\n`;
    summary += `ID | Sex | Age | Wt(kg) | Ht(cm) | MUAC(mm) | Oedema | WHZ | Result\n`;
    screeningLog.forEach((c) => {
      summary += `#${c.number} | ${c.sex} | ${c.ageMonths}m | ${c.weightKg} | ${c.heightCm} | ${c.muacMm} | ${c.edema} | ${c.whzScore} | ${c.classification}\n`;
    });

    navigator.clipboard.writeText(summary);
    setCopiedTally(true);
    setTimeout(() => setCopiedTally(false), 2000);
  };

  // Screening Session Stats
  const stats = useMemo(() => {
    const total = screeningLog.length;
    const sam = screeningLog.filter((c) => c.classification === 'SAM').length;
    const mam = screeningLog.filter((c) => c.classification === 'MAM').length;
    const normal = screeningLog.filter((c) => c.classification === 'Normal').length;
    return {
      total,
      sam,
      mam,
      normal,
      samPct: total > 0 ? Math.round((sam / total) * 100) : 0,
      mamPct: total > 0 ? Math.round((mam / total) * 100) : 0,
      normalPct: total > 0 ? Math.round((normal / total) * 100) : 0,
    };
  }, [screeningLog]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
                <Activity className="w-4 h-4" />
              </div>
              <h2 className="font-serif text-xl sm:text-2xl text-slate-900 tracking-tight font-normal">
                Rapid screening &amp; triage
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 pl-10.5">
              Field assessment with instant WHO classification, MUAC cutoffs, and acute wasting routing.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span>Zero-registration mode</span>
            </span>
          </div>
        </div>

        {/* Live Classification Result Card (Instant zero-latency feedback) */}
        <div className="mt-4">
          <div
            className={`p-4 sm:p-5 rounded-xl border transition-all ${
              evaluation.classification === 'SAM'
                ? 'bg-red-50 border-red-200 text-red-950 shadow-xs'
                : evaluation.classification === 'MAM'
                ? 'bg-amber-50 border-amber-200 text-amber-950 shadow-xs'
                : 'bg-emerald-50 border-emerald-200 text-emerald-950 shadow-xs'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {evaluation.classification === 'SAM' ? (
                    <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold text-xs tracking-wide uppercase flex items-center gap-1.5">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>SAM</span>
                    </span>
                  ) : evaluation.classification === 'MAM' ? (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-xs tracking-wide uppercase flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>MAM</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs tracking-wide uppercase flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Normal</span>
                    </span>
                  )}

                  <span className="text-xs font-bold text-slate-800">
                    WHZ: {evaluation.wflZScore > 0 ? `+${evaluation.wflZScore}` : evaluation.wflZScore} SD &middot; MUAC: {muacMm} mm
                  </span>
                </div>

                <div className="text-xs font-medium text-slate-900 leading-relaxed max-w-3xl">
                  <strong>Action:</strong> {evaluation.action}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {evaluation.triggers.map((t, idx) => (
                    <span
                      key={idx}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                        evaluation.classification === 'SAM'
                          ? 'bg-red-100/90 border-red-200 text-red-800'
                          : evaluation.classification === 'MAM'
                          ? 'bg-amber-100/90 border-amber-200 text-amber-800'
                          : 'bg-emerald-100/90 border-emerald-200 text-emerald-800'
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action buttons (Optionally transfer to Inpatient / Outpatient) */}
              <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                {evaluation.classification === 'SAM' && onAdmitToInpatient && (
                  <button
                    type="button"
                    onClick={() =>
                      onAdmitToInpatient({
                        weight_kg: weightKg,
                        height_cm: heightCm,
                        sex,
                        age_months: ageMonths,
                        edema_severity:
                          edema === 'Grade +++ (Severe)'
                            ? 'Severe (+++)'
                            : edema === 'None'
                            ? 'None'
                            : 'Mild/Moderate (+ / ++)',
                      })
                    }
                    className="px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
                    title="Transfer child details to Inpatient F-75 Stabilization ward"
                  >
                    <span>Admit to inpatient</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {/* Outpatient OTP/RUTF is only clinically appropriate for older children (>= 6 months) */}
                {ageMonths >= 6 && (evaluation.classification === 'SAM' || evaluation.classification === 'MAM') && onSendToOutpatient && (
                  <button
                    type="button"
                    onClick={() =>
                      onSendToOutpatient({
                        weightKg,
                        ageMonths,
                        heightCm,
                        muacMm,
                        edema,
                      })
                    }
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
                    title="Transfer child details to Outpatient OTP Calculator"
                  >
                    <span>Open in OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Screener Form (Left) & MUAC Visual Gauge + WHO Thresholds (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Rapid Field Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Measurements
              </h3>
              <span className="text-[11px] font-mono text-slate-500">Live evaluation</span>
            </div>

            {/* Sex & Age */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sex</label>
                <div className="grid grid-cols-2 gap-2 h-12">
                  <button
                    type="button"
                    onClick={() => setSex('Boy')}
                    className={`h-full rounded-xl border font-bold transition-all text-center flex items-center justify-center min-h-[48px] ${
                      sex === 'Boy'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Boy
                  </button>
                  <button
                    type="button"
                    onClick={() => setSex('Girl')}
                    className={`h-full rounded-xl border font-bold transition-all text-center flex items-center justify-center min-h-[48px] ${
                      sex === 'Girl'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Girl
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-semibold text-slate-700">Age (months)</label>
                  <span className="text-xs font-semibold text-slate-500">{ageMonths} mo</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustAge(-1)}
                    className="w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 transition-all text-sm font-bold shrink-0 shadow-xs"
                    title="Decrease 1 month"
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
                      className="w-full text-center h-12 min-h-[48px] rounded-xl border border-slate-300 text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white shadow-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => adjustAge(1)}
                    className="w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 transition-all text-sm font-bold shrink-0 shadow-xs"
                    title="Increase 1 month"
                    aria-label="Increase age by 1 month"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 pt-1.5 overflow-x-auto">
                  {[6, 12, 18, 24, 36].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setAgeMonths(m)}
                      className={`text-xs font-semibold py-1 px-2.5 rounded-lg border transition-colors min-h-[32px] ${
                        ageMonths === m
                          ? 'bg-blue-100 border-blue-400 text-blue-900 font-bold'
                          : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {m} mo
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Weight and Height with 48px Stepper Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-semibold text-slate-700">Weight (kg)</label>
                  <span className="text-xs font-semibold text-slate-500">{weightKg.toFixed(1)} kg</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustWeight(-0.1)}
                    className="w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 transition-all text-sm font-bold shrink-0 shadow-xs"
                    title="Decrease 0.1 kg"
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
                      className="w-full text-center h-12 min-h-[48px] rounded-xl border border-slate-300 text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white shadow-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => adjustWeight(0.1)}
                    className="w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 transition-all text-sm font-bold shrink-0 shadow-xs"
                    title="Increase 0.1 kg"
                    aria-label="Increase weight by 0.1 kg"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 pt-1.5 overflow-x-auto">
                  {[-1.0, -0.5, +0.5, +1.0].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => adjustWeight(step)}
                      className="text-xs font-semibold py-1 px-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shrink-0 min-h-[32px]"
                    >
                      {step > 0 ? `+${step}` : step} kg
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-semibold text-slate-700">Length / Height (cm)</label>
                  <span className="text-xs font-semibold text-slate-500">{heightCm.toFixed(1)} cm</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustHeight(-0.5)}
                    className="w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 transition-all text-sm font-bold shrink-0 shadow-xs"
                    title="Decrease 0.5 cm"
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
                      className="w-full text-center h-12 min-h-[48px] rounded-xl border border-slate-300 text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white shadow-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => adjustHeight(0.5)}
                    className="w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 transition-all text-sm font-bold shrink-0 shadow-xs"
                    title="Increase 0.5 cm"
                    aria-label="Increase length by 0.5 cm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 pt-1.5 overflow-x-auto">
                  {[-2.0, -1.0, +1.0, +2.0].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => adjustHeight(step)}
                      className="text-xs font-semibold py-1 px-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shrink-0 min-h-[32px]"
                    >
                      {step > 0 ? `+${step}` : step} cm
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* MUAC with Realistic WHO Calibrated Strap Gauge & 48px Steppers */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <div>
                  <span className="font-bold text-sm text-slate-900 block">MUAC (Mid-Upper Arm Circumference)</span>
                  <span className="text-slate-500 text-xs">
                    {ageMonths < 6
                      ? 'Calibrated for ages 6–59 months; not diagnostic for SAM/MAM under 6 months'
                      : 'Standard WHO tape calibrated for ages 6 to 59 months'}
                  </span>
                </div>
                {/* 48px Stepper controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustMuac(-1)}
                    className="w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 transition-all text-sm font-bold shrink-0 shadow-xs"
                    title="Decrease 1 mm"
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
                      className="w-full text-center h-12 min-h-[48px] rounded-xl border border-slate-300 text-base font-bold text-slate-900 bg-white shadow-xs focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => adjustMuac(1)}
                    className="w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 transition-all text-sm font-bold shrink-0 shadow-xs"
                    title="Increase 1 mm"
                    aria-label="Increase MUAC by 1 mm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Realistic Visual MUAC Strap with dynamic pointer - 100% scroll safe */}
              <div className="space-y-1.5 pt-1">
                {/* Visual strap bar */}
                <div className="relative h-7 rounded-lg overflow-hidden flex border border-slate-300 shadow-inner">
                  {/* Red Band < 115 mm (85 to 115 mm = 30/75 = 40%) */}
                  <div className="w-[40%] bg-rose-500 flex items-center justify-center text-[10px] font-mono text-white font-black tracking-tight border-r border-rose-600">
                    &lt; 115 (SAM)
                  </div>
                  {/* Yellow Band 115-124 mm (115 to 125 mm = 10/75 = 13.3%) */}
                  <div className="w-[13.3%] bg-amber-400 flex items-center justify-center text-[10px] font-mono text-amber-950 font-black tracking-tight border-r border-amber-500">
                    MAM
                  </div>
                  {/* Green Band >= 125 mm (125 to 160 mm = 35/75 = 46.7%) */}
                  <div className="w-[46.7%] bg-emerald-500 flex items-center justify-center text-[10px] font-mono text-white font-black tracking-tight">
                    &ge; 125 (Normal)
                  </div>

                  {/* Indicator needle marker on the tape */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-slate-950 shadow-md transition-all duration-150 pointer-events-none"
                    style={{
                      left: `calc(${Math.min(100, Math.max(0, ((muacMm - 85) / (160 - 85)) * 100))}% - 2px)`,
                    }}
                  >
                    <div className="w-2.5 h-2.5 -top-1 -left-[3px] absolute bg-slate-900 rotate-45 border border-white"></div>
                  </div>
                </div>

                {/* Sub-strap quick bump buttons & WHO triage cutoffs */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold mr-0.5">Quick:</span>
                    {[-5, -1, +1, +5].map((delta) => (
                      <button
                        key={delta}
                        type="button"
                        onClick={() => adjustMuac(delta)}
                        className="px-1.5 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px]"
                      >
                        {delta > 0 ? `+${delta}` : delta}
                      </button>
                    ))}
                  </div>

                  {/* Triage Cutoff Pills */}
                  <div className="flex items-center gap-1">
                    {[
                      { val: 110, label: '110 (SAM)', cls: 'hover:bg-rose-100 text-rose-700 border-rose-300' },
                      { val: 115, label: '115 (MAM)', cls: 'hover:bg-amber-100 text-amber-800 border-amber-300' },
                      { val: 125, label: '125 (Normal)', cls: 'hover:bg-emerald-100 text-emerald-800 border-emerald-300' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setMuacMm(item.val)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border bg-white font-bold transition-colors ${item.cls} ${
                          muacMm === item.val ? 'ring-1 ring-blue-500 shadow-xs' : ''
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 pt-0.5 font-medium">
                  <span>85 mm</span>
                  <span
                    className={`font-bold px-2.5 py-1 rounded-lg text-xs ${
                      ageMonths < 6
                        ? 'bg-slate-100 text-slate-700 border border-slate-200'
                        : muacMm < 115
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : muacMm < 125
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    Current: {muacMm} mm {ageMonths < 6 ? '(Cutoffs apply to 6–59m)' : `(${muacMm < 115 ? 'Red / SAM' : muacMm < 125 ? 'Yellow / MAM' : 'Green / Normal'})`}
                  </span>
                  <span>160 mm</span>
                </div>

                {ageMonths < 6 && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-snug">
                    <strong>Infant &lt; 6 months (WHO 2023):</strong> Standard older-child MUAC cutoffs (&lt;115 mm / 115–124 mm) are not validated for acute malnutrition diagnosis under 6 months. Triage relies on Weight-for-Length and bilateral oedema. RUTF and appetite tests are contraindicated.
                  </div>
                )}
              </div>
            </div>

            {/* Bilateral Pitting Oedema */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Bilateral pitting edema
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
                  let activeStyle = 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50';
                  if (isSelected) {
                    if (g === 'Grade +++ (Severe)') {
                      activeStyle = 'bg-red-50 text-red-600 border-red-300 font-bold shadow-xs';
                    } else if (g === 'Grade ++ (Moderate)' || g === 'Grade + (Mild)') {
                      activeStyle = 'bg-amber-50 text-amber-700 border-amber-300 font-bold shadow-xs';
                    } else {
                      activeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold shadow-xs';
                    }
                  }

                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setEdema(g)}
                      className={`p-2.5 rounded-xl border text-center font-semibold transition-all min-h-[48px] flex items-center justify-center ${activeStyle}`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Log & Next Action Button */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleLogAndNext}
                className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-800 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 min-h-[48px]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Save child &amp; next</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: WHO Thresholds Reference & Live Math (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Exact Comparison Against WHO Reference Standards */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                WHO standards ({heightCm} cm {sex})
              </h3>
              <span className="text-xs font-semibold text-slate-500">WHZ score</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-200">
                <div>
                  <span className="font-bold text-red-900 block">-3 SD (SAM cutoff):</span>
                  <span className="text-xs text-red-700">Severe wasting</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 text-base">{evaluation.thresholds.sd3neg} kg</div>
                  <div className="text-xs font-medium text-red-800">
                    {evaluation.diffFromSd3 < 0
                      ? `${Math.abs(evaluation.diffFromSd3)} kg below`
                      : `${evaluation.diffFromSd3} kg above`}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div>
                  <span className="font-bold text-amber-900 block">-2 SD (MAM cutoff):</span>
                  <span className="text-xs text-amber-700">Moderate wasting</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 text-base">{evaluation.thresholds.sd2neg} kg</div>
                  <div className="text-xs font-medium text-amber-800">
                    {evaluation.diffFromSd2 < 0
                      ? `${Math.abs(evaluation.diffFromSd2)} kg below`
                      : `${evaluation.diffFromSd2} kg above`}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block">Median (0 SD):</span>
                  <span className="text-xs text-slate-500">Normal weight</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 text-base">{evaluation.thresholds.median} kg</div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-[11px] text-slate-700 leading-relaxed">
              {ageMonths < 6 ? (
                <span>
                  <strong>Infants &lt; 6 months (WHO 2023):</strong> Classified by WHZ &lt; -3 SD or bilateral pitting edema. Standard older-child MUAC cutoffs and RUTF/appetite tests are contraindicated.
                </span>
              ) : (
                <span>
                  <strong>Rule (Ages 6–59m):</strong> Any child with MUAC &lt; 115 mm, WHZ &lt; -3 SD, or pitting edema is classified as <strong>SAM</strong>.
                </span>
              )}
            </div>
          </div>

          {/* Screening Session Tally Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Session tally ({stats.total})
              </h3>
              <div className="flex items-center gap-1.5">
                {stats.total > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleCopyTally}
                      className="p-1 text-slate-500 hover:text-slate-800"
                      title="Copy tally report"
                    >
                      {copiedTally ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearLog}
                      className="p-1 text-slate-400 hover:text-rose-600"
                      title="Clear session log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Quick Stats Bars */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <div className="text-xs font-bold text-red-700">SAM</div>
                <div className="text-2xl font-bold text-slate-900 mt-0.5">{stats.sam}</div>
                <div className="text-xs text-red-600 font-semibold">{stats.samPct}%</div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="text-xs font-bold text-amber-700">MAM</div>
                <div className="text-2xl font-bold text-slate-900 mt-0.5">{stats.mam}</div>
                <div className="text-xs text-amber-600 font-semibold">{stats.mamPct}%</div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-xs font-bold text-emerald-700">Normal</div>
                <div className="text-2xl font-bold text-slate-900 mt-0.5">{stats.normal}</div>
                <div className="text-xs text-emerald-600 font-semibold">{stats.normalPct}%</div>
              </div>
            </div>

            {/* Recent Screened Children List */}
            {screeningLog.length > 0 ? (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pt-1 text-xs">
                {screeningLog.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-slate-900">#{c.number}</span>
                      <span className="text-slate-600 font-medium">
                        {c.sex[0]} &middot; {c.ageMonths}m &middot; {c.weightKg}kg &middot; {c.muacMm}mm
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-lg font-bold text-xs ${
                        c.classification === 'SAM'
                          ? 'bg-red-100 text-red-700'
                          : c.classification === 'MAM'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {c.classification}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                Tap &ldquo;Save to Screening Tally &amp; Next Child&rdquo; to record rapid community checks here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
