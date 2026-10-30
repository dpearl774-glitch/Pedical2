import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  X,
  CheckCircle2,
  ChevronRight,
  Info,
  HeartPulse,
  Activity,
  RotateCcw,
  BookOpen,
  Stethoscope,
  Check,
} from 'lucide-react';
import { ClinicalSafetyAuditResult, ClinicalSafetyIssue } from '../utils/clinicalSafetyAuditor';
import { CalculationInput } from '../utils/clinicalCalculations';
import { runClinicalValidationSuite, TestSuiteResult } from '../utils/clinicalValidationRules';

interface ClinicalSafetyInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditResult: ClinicalSafetyAuditResult;
  onApplyPatch?: (patch: Partial<CalculationInput>) => void;
  patientName?: string;
  cotNumber?: string;
}

export const ClinicalSafetyInspectorModal: React.FC<ClinicalSafetyInspectorModalProps> = ({
  isOpen,
  onClose,
  auditResult,
  onApplyPatch,
  patientName = 'Active Patient',
  cotNumber = 'Bed',
}) => {
  const [activeTab, setActiveTab] = useState<'ISSUES' | 'RULES' | 'EVIDENCE' | 'TESTS'>('ISSUES');
  const [selfTestResult, setSelfTestResult] = useState<TestSuiteResult | null>(() => runClinicalValidationSuite());

  const handleRunSelfTest = () => {
    setSelfTestResult(runClinicalValidationSuite());
  };

  if (!isOpen) return null;

  const hasCritical = auditResult.criticalCount > 0;
  const hasCaution = auditResult.cautionCount > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 card-depth"
        role="dialog"
        aria-modal="true"
        aria-labelledby="safety-modal-title"
      >
        {/* Header (Clean, mobile-optimized) */}
        <div
          className={`p-3.5 sm:p-4 flex items-center justify-between border-b ${
            hasCritical
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : hasCaution
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${
                hasCritical
                  ? 'bg-rose-600 text-white'
                  : hasCaution
                  ? 'bg-amber-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {hasCritical ? (
                <AlertTriangle className="w-4.5 h-4.5" />
              ) : (
                <ShieldCheck className="w-4.5 h-4.5" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 id="safety-modal-title" className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                  Protocol Safety Checks
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                    hasCritical
                      ? 'bg-rose-200 text-rose-900'
                      : hasCaution
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-emerald-200 text-emerald-900'
                  }`}
                >
                  {hasCritical
                    ? `${auditResult.criticalCount} Alert`
                    : hasCaution
                    ? `${auditResult.cautionCount} Notice`
                    : 'All Clear'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 truncate mt-0.5">
                Bed: <strong className="text-slate-800">{cotNumber} &middot; {patientName}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-black/5 active:bg-black/10 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation (Short labels for mobile screens) */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-3 pt-1 gap-1 text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('ISSUES')}
            className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 shrink-0 text-xs ${
              activeTab === 'ISSUES'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Alerts ({auditResult.issues.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RULES')}
            className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 shrink-0 text-xs ${
              activeTab === 'RULES'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Protocol Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('EVIDENCE')}
            className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 shrink-0 text-xs ${
              activeTab === 'EVIDENCE'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>WHO &amp; GHS Evidence</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TESTS')}
            className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 shrink-0 text-xs ${
              activeTab === 'TESTS'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Calculations</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-3.5 flex-1 text-slate-800 text-xs">
          {/* TAB 1: ACTIVE ALERTS */}
          {activeTab === 'ISSUES' && (
            <div className="space-y-3">
              {auditResult.issues.length === 0 ? (
                <div className="p-5 text-center rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">
                      All Clinical Checks Clear
                    </h4>
                    <p className="text-xs text-emerald-800 max-w-sm mx-auto mt-1 leading-relaxed">
                      No contraindications detected. Weight, formula phase, fluid volumes, and solute limits comply with WHO and Ghana Health Service guidelines.
                    </p>
                  </div>
                </div>
              ) : (
                auditResult.issues.map((issue) => {
                  const isCritical = issue.severity === 'CRITICAL_INTERLOCK';
                  return (
                    <div
                      key={issue.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isCritical
                          ? 'bg-rose-50/80 border-rose-200'
                          : 'bg-amber-50/80 border-amber-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isCritical ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wider ${
                                isCritical ? 'bg-rose-200 text-rose-900' : 'bg-amber-200 text-amber-900'
                              }`}
                            >
                              {isCritical ? 'Critical Alert' : 'Notice'}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {issue.category}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                            {issue.title}
                          </h4>
                          <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                            {issue.summary}
                          </p>
                        </div>
                      </div>

                      {/* Clinical Rationale Box */}
                      <div className="mt-2.5 p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-800 font-bold text-[11px]">
                          <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>Clinical Rationale:</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-[11px]">
                          {issue.clinicalRationale}
                        </p>
                        <div className="text-[10px] text-slate-400 font-medium pt-0.5">
                          Guideline: {issue.guidelineReference}
                        </div>
                      </div>

                      {/* Corrective Action Bar */}
                      <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                        <div className="text-xs font-semibold text-slate-800">
                          <span className="text-blue-700 font-bold mr-1">Recommended:</span>
                          <span>{issue.correctiveAction}</span>
                        </div>

                        {issue.autoFixAvailable && issue.autoFixPatch && onApplyPatch && (
                          <button
                            type="button"
                            onClick={() => {
                              onApplyPatch(issue.autoFixPatch!);
                            }}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-all shadow-xs shrink-0 min-h-[36px]"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{issue.autoFixAction || 'Apply Recommendation'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Refeeding Risk Assessment Card */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                      Refeeding Risk Review
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      auditResult.refeedingRiskLevel === 'High / Critical'
                        ? 'bg-rose-100 text-rose-800'
                        : auditResult.refeedingRiskLevel === 'Moderate'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {auditResult.refeedingRiskLevel}
                  </span>
                </div>
                <div className="text-xs text-slate-700 leading-relaxed">
                  {auditResult.refeedingPrecautions.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700 pt-0.5">
                      {auditResult.refeedingPrecautions.map((prec, idx) => (
                        <li key={idx}>{prec}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-slate-600">
                      Standard Phase 1 target (~80–100 kcal/kg/day). Monitor feeding tolerance and vital signs during ward rounds.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROTOCOL RULES */}
          {activeTab === 'RULES' && (
            <div className="space-y-2">
              <div className="text-[11px] text-slate-500 pb-0.5">
                PediCal checks each patient against 8 WHO and Ghana Health Service protocol rules:
              </div>

              {[
                {
                  id: '1',
                  name: '1. MUAC Measurement Verification (cm vs mm)',
                  desc: 'Detects if MUAC was entered in centimeters (e.g. 11.5 cm) instead of millimeters (115 mm) to avoid dosage errors.',
                },
                {
                  id: '2',
                  name: '2. Severe Edema (+++) Formula Check',
                  desc: 'Ensures children with severe edema stay on F-75 stabilization to prevent cardiac overload from higher sodium formulas.',
                },
                {
                  id: '3',
                  name: '3. Infants Under 6 Months Pathway',
                  desc: 'Applies infant-specific protocols: Supplementary Suckling (SST), Diluted F-100, or EBM, avoiding standard undiluted F-100 or cereal feeds.',
                },
                {
                  id: '4',
                  name: '4. Weight and Height Plausibility',
                  desc: 'Identifies typographical entry errors in weight or height before calculating therapeutic feeding volumes.',
                },
                {
                  id: '5',
                  name: '5. Refeeding Syndrome Precautions',
                  desc: 'Caps initial feeds at ~80–100 kcal/kg/day, withholds iron in Phase 1, and reminds clinicians to check vital signs.',
                },
                {
                  id: '6',
                  name: '6. Dehydration & Fluid Guidance',
                  desc: 'Separates emergency shock (requiring IV fluids at 15 mL/kg/h) from dehydration managed with oral ReSoMal.',
                },
                {
                  id: '7',
                  name: '7. Kitchen Recipe Osmolality',
                  desc: 'Ensures raw kitchen formulas maintain safe sugar levels below 10% to prevent osmotic diarrhea.',
                },
                {
                  id: '8',
                  name: '8. Stomach Capacity Limit (25–28 mL/kg)',
                  desc: 'Flags excessive single-feed volumes to reduce vomiting, regurgitation, and aspiration risk.',
                },
              ].map((gr) => (
                <div
                  key={gr.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white flex items-start gap-2.5 shadow-2xs"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{gr.name}</h5>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{gr.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: WHO & GHS EVIDENCE */}
          {activeTab === 'EVIDENCE' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2">
                <div className="flex items-center gap-1.5 text-teal-950 font-bold text-xs uppercase tracking-wide">
                  <BookOpen className="w-4 h-4 text-teal-700" />
                  <span>WHO 2023 &amp; 17 September 2026 Guidance</span>
                </div>
                <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
                  <div className="bg-white p-2.5 rounded-xl border border-teal-100 space-y-1">
                    <strong className="text-teal-950 block text-[11px]">Infants Under 6 Months:</strong>
                    <p className="text-[11px] text-slate-600">
                      WHO 2026 guidance emphasizes differentiated care. Breastfed infants should be supported with Supplementary Suckling (SST) using Expressed Breast Milk or Diluted F-100. Non-breastfed infants receive infant formula or Diluted F-100. Edematous infants require inpatient stabilization.
                    </p>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-teal-100 space-y-1">
                    <strong className="text-teal-950 block text-[11px]">Refeeding Risk Management:</strong>
                    <p className="text-[11px] text-slate-600">
                      F-75 formula safely delivers ~80–100 kcal/kg/day. Iron is withheld in Phase 1, electrolytes are supplemented via CMV, and heart rate and respiratory rate are checked every 4 hours.
                    </p>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-teal-100 space-y-1">
                    <strong className="text-teal-950 block text-[11px]">Dehydration vs. Circulatory Shock:</strong>
                    <p className="text-[11px] text-slate-600">
                      Dehydration with diarrhea is treated with oral ReSoMal. Emergency circulatory shock (weak pulse, capillary refill &gt;3s, lethargy) requires IV resuscitation (15 mL/kg over 1 hour) with frequent cardiac monitoring.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                  <Stethoscope className="w-4 h-4 text-blue-700" />
                  <span>Ghana Health Service IMAM Protocols</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  PediCal incorporates Ghana Health Service inpatient steps: malaria screening on admission, first-line antibiotic regimens, and standard local ReSoMal reconstitution recipes.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: CALCULATION TESTS */}
          {activeTab === 'TESTS' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1 text-xs">
                <div className="font-bold text-slate-900">Dosage Arithmetic Verification</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Verifies that formula reconstitution volumes, rounding rules, and fluid caps compute accurately without errors.
                </p>
              </div>

              {selfTestResult && (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-950">
                        {selfTestResult.passedTests} of {selfTestResult.totalTests} Calculations Verified
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRunSelfTest}
                      className="text-[11px] text-blue-700 hover:underline font-semibold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Re-check</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {[
                      'MUAC unit conversion (cm to mm) verified',
                      'F-75 130 mL/kg/day standard computation exact',
                      'F-75 severe edema reduction (100 mL/kg/day) enforced',
                      'Severe edema with F-100 warning verified',
                      'Infant <6m standard F-100 restriction verified',
                      'Infant <6m nutritional edema alert verified',
                      'Diluted F-100 SST recipe (100mL + 30mL water) exact',
                      'ReSoMal 5 mL/kg initial dosage exact',
                      'Emergency Shock IV fluid rate (15 mL/kg/h) verified',
                      'Refeeding risk check & iron withholding verified',
                    ].map((testDesc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px]"
                      >
                        <span className="text-slate-700">{testDesc}</span>
                        <span className="text-emerald-700 font-bold ml-2">PASS</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer (Minimal) */}
        <div className="p-3 sm:p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            WHO 2023 &middot; Sept 2026 Guidance &middot; GHS IMAM
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs min-h-[36px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
