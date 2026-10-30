import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  FileText,
  Mail,
  Copy,
  Check,
  Lock,
} from 'lucide-react';
import { LegalAndPrivacyModal } from './LegalAndPrivacyModal';

interface ClinicalLockoutScreenProps {
  onReviewTerms: () => void;
  onResetSession: () => void;
}

export const ClinicalLockoutScreen: React.FC<ClinicalLockoutScreenProps> = ({
  onReviewTerms,
  onResetSession,
}) => {
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const contactEmail = 'balancdvisuals@gmail.com';

  const handleCopyEmail = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(contactEmail);
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-xl flex flex-col items-center justify-center p-4 select-none safe-bottom">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center space-y-5 card-depth">
          {/* Lockout Icon */}
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>

          {/* Title & Governance Notice */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase bg-amber-950/60 border border-amber-800/60 px-3 py-1 rounded-full">
              Agreement Required
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Clinical Agreement Required
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              Access to PediCal requires confirming that you are a qualified healthcare professional and agreeing to our independent clinical verification guidelines and privacy policy.
            </p>
          </div>

          {/* Reasons Card */}
          <div className="w-full bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 text-left space-y-2.5 text-xs">
            <div className="flex items-start gap-2.5 text-slate-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Healthcare Professional Verification:</strong> PediCal is strictly an arithmetic calculation aid for clinical staff; all therapeutic feeding and rehydration rates must be verified.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-slate-300">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>100% Local Privacy:</strong> All patient data remains strictly on your device memory. Zero cloud transmission, zero server tracking.
              </span>
            </div>
          </div>

          {/* Contact Bar */}
          <div className="w-full bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 truncate">
              <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">Contact:</span>
              <a
                href={`mailto:${contactEmail}`}
                className="font-mono text-blue-400 hover:underline truncate"
              >
                {contactEmail}
              </a>
            </div>

            <button
              type="button"
              onClick={handleCopyEmail}
              className="text-[10px] bg-slate-700/80 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded transition-colors shrink-0 flex items-center gap-1"
            >
              {copiedEmail ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-2.5 pt-1">
            <button
              type="button"
              onClick={onReviewTerms}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all min-h-[44px]"
            >
              <FileText className="w-4 h-4" />
              <span>Review &amp; Agree to Terms</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLegalModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors min-h-[38px] border border-slate-700/60"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Read Full Terms &amp; Privacy Policy</span>
            </button>

            <button
              type="button"
              onClick={onResetSession}
              className="w-full py-2 px-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/60 text-slate-500 hover:text-slate-300 font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Local Session &amp; Reload</span>
            </button>
          </div>

          {/* Footer Note */}
          <div className="text-[10px] text-slate-500 font-mono">
            PediCal &middot; Offline PWA &middot; balancdvisuals@gmail.com
          </div>
        </div>
      </div>

      <LegalAndPrivacyModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
      />
    </>
  );
};
