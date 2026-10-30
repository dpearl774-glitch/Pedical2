import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  BookOpen,
  AlertTriangle,
  X,
  ShieldAlert,
  LogOut,
  CheckSquare,
  Square,
  FileText,
  Mail,
  Copy,
  Check,
  ExternalLink,
  UserCheck,
} from 'lucide-react';
import { LegalAndPrivacyModal, LegalModalTab } from './LegalAndPrivacyModal';

interface ClinicalDisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose?: () => void;
  onDecline?: () => void;
  isVoluntaryReview?: boolean;
}

export const ClinicalDisclaimerModal: React.FC<ClinicalDisclaimerModalProps> = ({
  isOpen,
  onAccept,
  onClose,
  onDecline,
  isVoluntaryReview = false,
}) => {
  // Explicit mandatory first-use agreement states
  const [isHealthProfessional, setIsHealthProfessional] = useState(false);
  const [hasAgreedTermsAndPrivacy, setHasAgreedTermsAndPrivacy] = useState(false);

  // Sub-modal for detailed Terms / Privacy / Contact inspection
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalModalTab>('terms');
  const [copiedEmail, setCopiedEmail] = useState(false);

  const contactEmail = 'balancdvisuals@gmail.com';

  const handleCopyEmail = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const openLegalTab = (tab: LegalModalTab) => {
    setLegalModalTab(tab);
    setLegalModalOpen(true);
  };

  if (!isOpen) return null;

  const canProceed = isVoluntaryReview || (isHealthProfessional && hasAgreedTermsAndPrivacy);

  const handleAcceptClick = () => {
    if (!canProceed) return;
    onAccept();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      if (isVoluntaryReview && onClose) {
        onClose();
      } else if (!isVoluntaryReview && onDecline) {
        onDecline();
      }
    }
  };

  return (
    <>
      <div
        onClick={handleBackdropClick}
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      >
        <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-300/80 p-6 sm:p-7 my-auto space-y-5 card-depth">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-800 shrink-0 shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Clinical Reference &amp; Privacy Agreement</span>
                  {!isVoluntaryReview && (
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-200">
                      Required for Use
                    </span>
                  )}
                  {isVoluntaryReview && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-200">
                      Agreement Active
                    </span>
                  )}
                </h2>
                <div className="text-xs text-slate-500 font-mono">
                  PediCal &middot; WHO 2023 &amp; 17 Sept 2026 Guidance &middot; GHS IMAM
                </div>
              </div>
            </div>

            {/* Close button ONLY shown during voluntary review, NEVER in mandatory gate */}
            {isVoluntaryReview && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                aria-label="Close Notice"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mandatory Pre-Condition Notice */}
          {!isVoluntaryReview ? (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs font-medium flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                To access PediCal, you must confirm your healthcare role and agree to our clinical verification guidelines and privacy policy.
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 text-xs font-medium flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Healthcare Professional &amp; Privacy Agreement is currently active on this device.
              </span>
            </div>
          )}

          {/* Core Principles */}
          <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
            <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200 flex items-start gap-2.5 shadow-2xs">
              <BookOpen className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
              <div>
                <strong className="text-blue-950 block mb-0.5">
                  WHO &amp; Ghana Health Service IMAM Calculation Aid
                </strong>
                <span>
                  PediCal is an arithmetic calculation aid strictly aligned with the published World Health
                  Organization (WHO 2023) Guidelines, WHO 17 September 2026 Implementation Guidance (inpatient/outpatient care and infants &lt;6m), and Ghana Health Service National IMAM Protocols, alongside inpatient therapeutic milk protocols (Standard &amp; Cereal-based F-75, F-100, and ReSoMal). Designed exclusively for qualified healthcare professionals.
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 flex items-start gap-2.5 shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <strong className="text-amber-950 block mb-0.5">
                  Mandatory Independent Clinical Verification
                </strong>
                <span>
                  This software does not make independent clinical decisions, diagnose medical conditions, or replace
                  licensed professional judgment. Every calculated feed volume, dehydration rehydration rate, and raw
                  recipe formulation must be verified by the attending clinician against the child&apos;s individual hemodynamic
                  status before administration.
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-start gap-2.5 shadow-2xs">
              <Lock className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
              <div>
                <strong className="text-emerald-950 block mb-0.5">
                  100% Patient Privacy on This Device
                </strong>
                <span>
                  All calculations and patient records remain strictly private on this device.
                  No patient names, clinical numbers, or medical data are ever uploaded to the internet or stored on external servers.
                </span>
              </div>
            </div>
          </div>

          {/* Quick Legal Links & Contact Info Banner */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1 text-slate-600">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Read Full Documents:</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => openLegalTab('terms')}
                className="text-blue-700 hover:text-blue-900 font-bold underline text-[11px] flex items-center gap-0.5"
              >
                <span>Terms of Use</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <span className="text-slate-300">&bull;</span>
              <button
                type="button"
                onClick={() => openLegalTab('privacy')}
                className="text-emerald-700 hover:text-emerald-900 font-bold underline text-[11px] flex items-center gap-0.5"
              >
                <span>Privacy Policy</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <span className="text-slate-300">&bull;</span>
              <button
                type="button"
                onClick={() => openLegalTab('contact')}
                className="text-amber-700 hover:text-amber-900 font-bold underline text-[11px] flex items-center gap-0.5"
              >
                <span>Contact Info</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Contact Bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-blue-50/50 rounded-xl border border-blue-100 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Contact:</span>
              <a
                href={`mailto:${contactEmail}`}
                className="font-mono font-bold text-blue-700 hover:underline"
              >
                {contactEmail}
              </a>
            </div>

            <button
              type="button"
              onClick={handleCopyEmail}
              className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200"
            >
              {copiedEmail ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* MANDATORY CHECKBOXES (Required on first use) */}
          {!isVoluntaryReview && (
            <div className="space-y-2.5 pt-1 border-t border-slate-200">
              <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={isHealthProfessional}
                  onChange={(e) => setIsHealthProfessional(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-700 rounded border-slate-300 focus:ring-blue-500 shrink-0 cursor-pointer"
                />
                <span className="text-xs text-slate-800 font-medium leading-snug">
                  <strong>I confirm that I am a healthcare professional</strong> (pediatrician, medical officer, dietitian, clinical nutritionist, nurse, or authorized trainee) using this tool in a clinical or educational capacity.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={hasAgreedTermsAndPrivacy}
                  onChange={(e) => setHasAgreedTermsAndPrivacy(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-700 rounded border-slate-300 focus:ring-blue-500 shrink-0 cursor-pointer"
                />
                <span className="text-xs text-slate-800 font-medium leading-snug">
                  <strong>I have read and agree to the Terms of Use, Privacy Policy, and Medical Disclaimer</strong>, acknowledging that calculations are decision aids requiring independent clinical verification before patient administration.
                </span>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
            {!isVoluntaryReview ? (
              <>
                <button
                  type="button"
                  onClick={onDecline}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 min-h-[42px]"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-500" />
                  <span>Decline &amp; Lock App</span>
                </button>

                <button
                  type="button"
                  onClick={handleAcceptClick}
                  disabled={!canProceed}
                  className={`w-full sm:w-auto px-5 py-2.5 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 min-h-[42px] ${
                    canProceed
                      ? 'bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white btn-tactile-primary cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>I Agree &amp; Enter PediCal</span>
                </button>
              </>
            ) : (
              <div className="w-full flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => openLegalTab('terms')}
                  className="text-xs text-blue-700 hover:underline font-semibold flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Full Legal &amp; Privacy Terms</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors min-h-[42px]"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Full Legal & Privacy Modal */}
      <LegalAndPrivacyModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalModalTab}
      />
    </>
  );
};
