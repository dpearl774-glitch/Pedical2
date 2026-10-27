import React, { useState } from 'react';
import {
  calculateRUTFDose,
  calculateAmoxicillinDose,
  evaluateOutpatientTriage,
  RUTFRationResult,
  AmoxicillinDose,
} from '../utils/outpatientCalculations';
import { WardPatient } from '../data/wardPatients';
import {
  PackageCheck,
  HeartHandshake,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Droplet,
  Printer,
  ChevronRight,
  ShieldCheck,
  Pill,
  Sparkles,
  Info,
  Calendar,
  User,
  ArrowUpRight,
  Check,
  Copy,
} from 'lucide-react';
import { ClinicalNumberInput } from './ClinicalNumberInput';

interface OutpatientManagementSectionProps {
  currentWardPatient?: WardPatient;
  onNavigateToInpatientWard?: () => void;
  onNavigateToGrowthChart?: () => void;
}

export const OutpatientManagementSection: React.FC<OutpatientManagementSectionProps> = ({
  currentWardPatient,
  onNavigateToInpatientWard,
  onNavigateToGrowthChart,
}) => {
  // Input states for Outpatient Clinic Assessment
  const [patientName, setPatientName] = useState<string>(
    currentWardPatient ? currentWardPatient.name : 'Outpatient 01'
  );
  const [cotRef, setCotRef] = useState<string>(
    currentWardPatient ? currentWardPatient.cotNumber : 'OTP-01'
  );
  const [weightKg, setWeightKg] = useState<number>(
    currentWardPatient ? currentWardPatient.input.weight_kg : 6.5
  );
  const [ageMonths, setAgeMonths] = useState<number>(
    currentWardPatient ? currentWardPatient.input.age_months ?? 14 : 14
  );
  const [heightCm, setHeightCm] = useState<number>(
    currentWardPatient ? currentWardPatient.input.height_cm ?? 68 : 68
  );
  const [muacMm, setMuacMm] = useState<number>(112);
  const [wflZScore, setWflZScore] = useState<number>(-3.2);

  const [edemaGrade, setEdemaGrade] = useState<
    'None' | 'Grade + (Mild)' | 'Grade ++ (Moderate)' | 'Grade +++ (Severe)'
  >('None');

  const [appetiteStatus, setAppetiteStatus] = useState<'Passed' | 'Failed' | 'Not Performed'>('Passed');
  const [hasMedicalComplications, setHasMedicalComplications] = useState<boolean>(false);
  const [selectedComplications, setSelectedComplications] = useState<string[]>([]);

  // Weekly Follow-up Mock log
  const [visitWeeks, setVisitWeeks] = useState<number>(1);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Sync with current inpatient bed
  const handleSyncFromInpatient = () => {
    if (currentWardPatient) {
      setPatientName(currentWardPatient.name);
      setCotRef(currentWardPatient.cotNumber);
      setWeightKg(currentWardPatient.input.weight_kg);
      setAgeMonths(currentWardPatient.input.age_months ?? 14);
      setHeightCm(currentWardPatient.input.height_cm ?? 68);
      if (currentWardPatient.input.edema_severity === 'Severe (+++)') {
        setEdemaGrade('Grade +++ (Severe)');
      } else if (currentWardPatient.input.edema_severity === 'Mild/Moderate (+ / ++)') {
        setEdemaGrade('Grade + (Mild)');
      } else {
        setEdemaGrade('None');
      }
    }
  };

  const toggleComplication = (comp: string) => {
    setSelectedComplications((prev) => {
      const next = prev.includes(comp) ? prev.filter((c) => c !== comp) : [...prev, comp];
      setHasMedicalComplications(next.length > 0);
      return next;
    });
  };

  // Perform Calculations
  const rutfRation: RUTFRationResult = calculateRUTFDose(weightKg);
  const amoxDose: AmoxicillinDose = calculateAmoxicillinDose(weightKg);

  const triage = evaluateOutpatientTriage({
    age_months: ageMonths,
    weight_kg: weightKg,
    muac_mm: muacMm,
    wfl_zscore: wflZScore,
    edema_grade: edemaGrade,
    appetite_test_status: appetiteStatus,
    has_medical_complications: hasMedicalComplications || selectedComplications.length > 0,
    complication_notes: selectedComplications,
  });

  const handleCopySummary = () => {
    const text = `PEDICAL - WHO 2023 OUTPATIENT THERAPEUTIC PROGRAM (OTP) SUMMARY
Date: ${new Date().toLocaleDateString()}
Patient: ${patientName} (${cotRef}) | Age: ${ageMonths} mo | Weight: ${weightKg} kg | MUAC: ${muacMm} mm
Status: ${triage.triageCategory}
Appetite Test: ${appetiteStatus} | Oedema: ${edemaGrade}
RUTF PRESCRIPTION:
- Daily: ${rutfRation.sachetsPerDay} sachets/day (~${rutfRation.kcalPerDay} kcal/day)
- 7-Day Supply: ${rutfRation.sachets7Days} sachets (weekly visit)
- 14-Day Supply: ${rutfRation.sachets14Days} sachets (bi-weekly visit)
ROUTINE MEDICATIONS:
- Amoxicillin: ${amoxDose.doseMgPerDose} mg orally twice daily for 5 days (${amoxDose.dispersibleTablet250mg} or ${amoxDose.syrup250mgPer5ml})
- Vitamin A: ${ageMonths < 12 ? '100,000 IU' : '200,000 IU'} single dose (if no oedema)
- Deworming: ${ageMonths >= 24 ? 'Albendazole 400 mg' : ageMonths >= 12 ? 'Albendazole 200 mg' : 'Not indicated (< 12 mo)'} at Week 2
SAFETY: Plenty of safe drinking water; breastfeed before RUTF; NO separate iron supplements.`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handlePrintOtpSheet = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <h2 className="font-serif text-xl sm:text-2xl text-slate-900 tracking-tight font-normal">
                Outpatient therapeutic program (OTP)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 pl-10.5">
              RUTF protocol dosing, WHO appetite test validation, and routine community medications.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {currentWardPatient && (
              <button
                type="button"
                onClick={handleSyncFromInpatient}
                className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 min-h-[36px]"
                title="Sync clinical parameters from current inpatient bed"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sync bed ({currentWardPatient.cotNumber})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 min-h-[36px]"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSummary ? 'Copied' : 'Copy summary'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintOtpSheet}
              className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors items-center gap-1.5 shadow-xs min-h-[36px]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print sheet</span>
            </button>
          </div>
        </div>

        {/* Triage Decision Banner */}
        <div className="mt-4">
          <div
            className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              triage.isEligibleForOTP
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : triage.triageCategory === 'Inpatient Referral Required'
                ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                : 'bg-amber-50/80 border-amber-300 text-amber-950'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {triage.isEligibleForOTP ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                ) : triage.triageCategory === 'Inpatient Referral Required' ? (
                  <AlertOctagon className="w-5 h-5 text-rose-700 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                )}
                <span className="font-bold text-sm tracking-wide">
                  {triage.triageCategory}
                </span>
                {triage.referralUrgency && triage.referralUrgency !== 'None' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 font-bold">
                    {triage.referralUrgency}
                  </span>
                )}
              </div>
              <p className="text-xs font-medium leading-relaxed">
                {triage.primaryAction}
              </p>
              <ul className="text-[11px] list-disc list-inside space-y-0.5 text-slate-700 pt-1 font-sans">
                {triage.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            {!triage.isEligibleForOTP && triage.triageCategory === 'Inpatient Referral Required' && onNavigateToInpatientWard && (
              <button
                type="button"
                onClick={onNavigateToInpatientWard}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs rounded-xl shadow-xs shrink-0 flex items-center justify-center gap-1.5 min-h-[42px]"
              >
                <span>Transfer to inpatient</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Left Column (Triage & Appetite Test) | Right Column (RUTF & Meds) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Assessment & Appetite Test (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Form Controls */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                1. Clinical inputs
              </h3>
              <span className="text-[11px] font-mono text-slate-500">De-identified</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Clinic Bed / Ref</label>
                <input
                  type="text"
                  value={cotRef}
                  onChange={(e) => setCotRef(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Patient Identifier</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Anthropometric inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Weight (kg)</label>
                <ClinicalNumberInput
                  value={weightKg}
                  onChange={(val) => setWeightKg(val)}
                  min={3.0}
                  max={25.0}
                  step={0.1}
                  unit="kg"
                  className="w-full text-center h-12 min-h-[48px] rounded-xl border border-slate-300 text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white shadow-xs"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Age (months)</label>
                <ClinicalNumberInput
                  value={ageMonths}
                  onChange={(val) => setAgeMonths(val)}
                  min={6}
                  max={59}
                  isInteger={true}
                  unit="mo"
                  className="w-full text-center h-12 min-h-[48px] rounded-xl border border-slate-300 text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white shadow-xs"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">MUAC (mm)</label>
                <ClinicalNumberInput
                  value={muacMm}
                  onChange={(val) => setMuacMm(val)}
                  min={80}
                  max={200}
                  isInteger={true}
                  unit="mm"
                  className={`w-full text-center h-12 min-h-[48px] rounded-xl border font-bold text-base focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white shadow-xs ${
                    muacMm < 115
                      ? 'border-red-300 bg-red-50 text-red-900'
                      : muacMm < 125
                      ? 'border-amber-300 bg-amber-50 text-amber-900'
                      : 'border-slate-300 text-slate-900'
                  }`}
                />
                <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
                  {muacMm < 115 ? 'Red / SAM (<115mm)' : muacMm < 125 ? 'Yellow / MAM (115-124mm)' : 'Green / Normal (≥125mm)'}
                </span>
              </div>
            </div>

            {/* Oedema Grade */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Bilateral Pitting Oedema
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(
                  [
                    'None',
                    'Grade + (Mild)',
                    'Grade ++ (Moderate)',
                    'Grade +++ (Severe)',
                  ] as const
                ).map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setEdemaGrade(grade)}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all min-h-[48px] flex items-center justify-between ${
                      edemaGrade === grade
                        ? grade === 'Grade +++ (Severe)'
                          ? 'bg-red-50 text-red-600 border-red-300 font-bold shadow-xs'
                          : grade === 'None'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold shadow-xs'
                          : 'bg-amber-50 text-amber-700 border-amber-300 font-bold shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{grade}</span>
                    {edemaGrade === grade && <Check className="w-3.5 h-3.5 text-blue-700" />}
                  </button>
                ))}
              </div>
              {edemaGrade === 'Grade +++ (Severe)' && (
                <div className="p-3 mt-2 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs leading-relaxed flex items-start gap-2">
                  <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Contraindicated for Outpatient:</strong> Generalized +++ oedema requires immediate inpatient stabilization with F-75 fluid restriction.
                  </span>
                </div>
              )}
            </div>

            {/* Medical Complications Checklist */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block text-slate-700 font-semibold text-xs">
                Danger Signs &amp; Acute Medical Complications
              </label>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                {[
                  'Fever (>38.5°C) or Hypothermia (<35.0°C)',
                  'Intractable vomiting or diarrhea',
                  'Lethargy, limpness, or unconsciousness',
                  'Severe respiratory distress or fast breathing',
                  'Severe dehydration (shock / absent pulse)',
                ].map((comp) => {
                  const isChecked = selectedComplications.includes(comp);
                  return (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => toggleComplication(comp)}
                      className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                        isChecked
                          ? 'bg-rose-50 border-rose-400 text-rose-900 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{comp}</span>
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                          isChecked
                            ? 'bg-rose-600 text-white border-rose-700'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 text-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive WHO Appetite Test Module */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-700" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  2. WHO appetite test
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold">
                Mandatory for OTP
              </span>
            </div>

            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2 text-xs">
              <div className="font-bold text-blue-950 flex items-center justify-between">
                <span>Minimum Required Intake for {weightKg} kg Child:</span>
                <span className="font-mono bg-blue-700 text-white px-2 py-0.5 rounded text-[11px]">
                  {rutfRation.appetiteTestMinPortion}
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                The appetite test is the most critical physiological test to differentiate inpatient metabolic failure from outpatient capability.
              </p>
            </div>

            {/* Protocol Steps Checklist */}
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-start gap-2 p-2 rounded bg-slate-50 border border-slate-200">
                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  1
                </span>
                <span>Conduct test in a quiet, low-stress area; calm both child and caregiver.</span>
              </div>

              <div className="flex items-start gap-2 p-2 rounded bg-slate-50 border border-slate-200">
                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  2
                </span>
                <span>Caregiver and child wash hands with clean water and soap.</span>
              </div>

              <div className="flex items-start gap-2 p-2 rounded bg-slate-50 border border-slate-200">
                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  3
                </span>
                <span>Offer open sachet gently on caregiver finger or clean spoon. <strong>Do NOT force-feed</strong>.</span>
              </div>

              <div className="flex items-start gap-2 p-2 rounded bg-slate-50 border border-slate-200">
                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  4
                </span>
                <span>Offer clean drinking water alongside. Observe child over 15 to 30 minutes.</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-slate-600 font-semibold text-xs mb-1.5">
                Appetite Test Clinical Outcome:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAppetiteStatus('Passed')}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 ${
                    appetiteStatus === 'Passed'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Passed</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAppetiteStatus('Failed')}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 ${
                    appetiteStatus === 'Failed'
                      ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <AlertOctagon className="w-4 h-4" />
                  <span>Failed</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAppetiteStatus('Not Performed')}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 ${
                    appetiteStatus === 'Not Performed'
                      ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Pending</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RUTF Ration, Meds & Follow-up (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* RUTF Ration Breakdown Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-emerald-700" />
                  <span>3. RUTF ration</span>
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Standard 92g sachet &middot; ~500 kcal / 12.8g protein
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-200">
                {rutfRation.sachetsPerDay} sachets/day
              </span>
            </div>

            {/* Big Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200">
                <span className="text-xs font-semibold text-emerald-900">Daily dose</span>
                <div className="text-3xl font-bold text-slate-900 mt-1">
                  {rutfRation.sachetsPerDay}
                  <span className="text-sm font-normal text-emerald-700 ml-1">sachets/d</span>
                </div>
                <div className="text-xs text-emerald-800 mt-1 font-medium">
                  ~{rutfRation.kcalPerDay} kcal/day ({rutfRation.kcalPerKgPerDay} kcal/kg/d)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200">
                <span className="text-xs font-semibold text-blue-900">7-day supply</span>
                <div className="text-3xl font-bold text-slate-900 mt-1">
                  {rutfRation.sachets7Days}
                  <span className="text-sm font-normal text-blue-700 ml-1">sachets</span>
                </div>
                <div className="text-xs text-blue-800 mt-1 font-medium">
                  Standard weekly visit
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">14-day supply</span>
                <div className="text-3xl font-bold text-slate-900 mt-1">
                  {rutfRation.sachets14Days}
                  <span className="text-sm font-normal text-slate-600 ml-1">sachets</span>
                </div>
                <div className="text-xs text-slate-600 mt-1 font-medium">
                  Bi-weekly visit
                </div>
              </div>
            </div>

            {/* Essential Caregiver Guidance Guardrails */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
              <div className="font-bold text-amber-950 uppercase text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>RUTF caregiver rules</span>
              </div>
              <ul className="space-y-1 text-slate-700 leading-relaxed text-[11px]">
                <li>
                  &bull; <strong>Clean water:</strong> Provide plenty of clean boiled drinking water with RUTF.
                </li>
                <li>
                  &bull; <strong>Breastmilk first:</strong> Breastfeed on demand prior to offering RUTF.
                </li>
                <li>
                  &bull; <strong>Do not dilute:</strong> Never mix RUTF with water or porridge.
                </li>
                <li>
                  &bull; <strong>No iron drops:</strong> RUTF already contains therapeutic iron.
                </li>
                <li>
                  &bull; <strong>Not family food:</strong> For the malnourished child only; do not share.
                </li>
              </ul>
            </div>
          </div>

          {/* Routine Medications Protocol Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-blue-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  4. Routine medications
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">WHO 2023</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Amoxicillin */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900 font-bold">1. Amoxicillin (Oral)</strong>
                  <span className="font-mono text-[10px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-bold">
                    Day 1 to 5
                  </span>
                </div>
                <div className="text-slate-700 leading-relaxed">
                  Dose for <strong>{weightKg} kg</strong>: <strong>{amoxDose.doseMgPerDose} mg</strong> orally twice daily ({amoxDose.frequency}) for 5 days.
                </div>
                <div className="text-[11px] font-mono text-slate-600 bg-white p-2 rounded border border-slate-200">
                  Tablet: {amoxDose.dispersibleTablet250mg} (250mg) <br />
                  Syrup: {amoxDose.syrup250mgPer5ml} (250mg/5mL)
                </div>
              </div>

              {/* Vitamin A */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900 font-bold">2. Vitamin A</strong>
                  <span className="font-mono text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold">
                    Single Dose
                  </span>
                </div>
                <div className="text-slate-700 leading-relaxed">
                  {ageMonths < 12 ? (
                    <span><strong>100,000 IU</strong> (blue capsule) single oral dose at discharge (or admission if non-oedematous).</span>
                  ) : (
                    <span><strong>200,000 IU</strong> (red capsule) single oral dose at discharge (or admission if non-oedematous).</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 italic">
                  *Do not administer if child has severe bilateral oedema or already received Vitamin A in the past month.
                </div>
              </div>

              {/* Deworming */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900 font-bold">3. Deworming</strong>
                  <span className="font-mono text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                    Week 2 Visit
                  </span>
                </div>
                <div className="text-slate-700 leading-relaxed">
                  {ageMonths < 12 ? (
                    <span className="text-slate-500">Not indicated in infants under 12 months.</span>
                  ) : ageMonths < 24 ? (
                    <span><strong>Albendazole 200 mg</strong> (or Mebendazole 100 mg bid x 3d) single oral dose at Week 2 follow-up.</span>
                  ) : (
                    <span><strong>Albendazole 400 mg</strong> single chewable tablet oral dose at Week 2 follow-up.</span>
                  )}
                </div>
              </div>

              {/* Measles Vaccine */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900 font-bold">4. Measles Immunization</strong>
                  <span className="font-mono text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                    &ge; 9 Months
                  </span>
                </div>
                <div className="text-slate-700 leading-relaxed">
                  Verify child immunization card. Administer measles vaccine at 9 months of age (or from 6 months in outbreak/refugee context).
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Follow-up & Discharge Criteria */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-700" />
                <span>5. Monitoring &amp; discharge</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">WHO 2023</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                <div className="font-bold text-emerald-950 uppercase text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Discharge criteria</span>
                </div>
                <div className="space-y-1.5 text-slate-700 text-[11px]">
                  <div>&bull; <strong>Edema-free:</strong> Absent for at least 14 days (2 consecutive weekly visits).</div>
                  <div>&bull; <strong>Anthropometry:</strong> WHZ &ge; -2 SD or MUAC &ge; 125 mm across 2 visits.</div>
                  <div>&bull; <strong>Clinical state:</strong> Afebrile, alert, eating family foods alongside breastmilk.</div>
                </div>
              </div>

              <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 space-y-2">
                <div className="font-bold text-rose-950 uppercase text-[11px] flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-rose-700" />
                  <span>Red flags (inpatient transfer)</span>
                </div>
                <div className="space-y-1.5 text-slate-700 text-[11px]">
                  <div>&bull; Weight loss on 2 consecutive weekly visits.</div>
                  <div>&bull; Static weight for 3 consecutive weekly visits.</div>
                  <div>&bull; Failure of the appetite test at any follow-up visit.</div>
                  <div>&bull; Development of edema or medical danger signs.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
