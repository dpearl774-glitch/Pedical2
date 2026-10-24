import React from 'react';
import { ShieldCheck, Lock, BookOpen, AlertTriangle, X } from 'lucide-react';

interface ClinicalDisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose?: () => void;
  isVoluntaryReview?: boolean;
}

export const ClinicalDisclaimerModal: React.FC<ClinicalDisclaimerModalProps> = ({
  isOpen,
  onAccept,
  onClose,
  isVoluntaryReview = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-300 p-6 sm:p-7 my-auto space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-800 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Clinical Reference &amp; Privacy Notice
              </h2>
              <div className="text-xs text-slate-500 font-mono">
                pedical &middot; WHO 2023 Acute Malnutrition Guidelines Aligned
              </div>
            </div>
          </div>

          {isVoluntaryReview && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Core Principles */}
        <div className="space-y-3.5 text-xs text-slate-700 leading-relaxed">
          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 flex items-start gap-2.5">
            <BookOpen className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
            <div>
              <strong className="text-blue-950 block mb-0.5">
                Open WHO Guidelines Reference (2023 Standards)
              </strong>
              <span>
                pedical is a calculation reference tool aligned with the published World Health
                Organization (WHO 2023) Guidelines on the Prevention and Management of Wasting and
                Nutritional Oedema in Infants and Children Under 5 Years, alongside established inpatient
                therapeutic milk formulation standards (F-75 &amp; F-100). It is an arithmetic aid designed
                for qualified healthcare professionals (dietitians, pediatricians, and clinical nurses).
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <strong className="text-amber-950 block mb-0.5">
                Independent Clinical Verification Required
              </strong>
              <span>
                This software does not prescribe treatment, diagnose patients, or substitute for
                independent professional clinical judgment. All calculated volumes, feeding intervals,
                and raw recipes must be verified by the attending clinician against individual patient
                status and institutional guidelines before administration.
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
            <div>
              <strong className="text-emerald-950 block mb-0.5">
                100% Client-Side Privacy (Zero Cloud Storage)
              </strong>
              <span>
                All computations and ward roster entries run exclusively in your local browser session.
                No patient names, identifiers, or clinical inputs are ever transmitted, collected, or
                stored on external servers. Use de-identified bed tags (e.g. Cot 01) rather than full legal names.
              </span>
            </div>
          </div>
        </div>

        {/* Acceptance Action */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onAccept}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 min-h-[42px]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>I Understand &amp; Agree to Verify Calculations</span>
          </button>
        </div>
      </div>
    </div>
  );
};
