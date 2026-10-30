import React, { useState } from 'react';
import {
  X,
  FileText,
  ShieldCheck,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Lock,
  AlertTriangle,
  BookOpen,
  Building,
  HeartHandshake,
  Smartphone,
  Info,
} from 'lucide-react';

export type LegalModalTab = 'terms' | 'privacy' | 'contact';

interface LegalAndPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalModalTab;
}

export const LegalAndPrivacyModal: React.FC<LegalAndPrivacyModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
}) => {
  const [activeTab, setActiveTab] = useState<LegalModalTab>(initialTab);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Sync tab if initialTab changes when opened
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

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

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-300/80 my-auto flex flex-col max-h-[90vh] card-depth overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-800 shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Legal, Privacy &amp; Contact</span>
                <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-blue-200">
                  PediCal v3.0
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Terms of Use &middot; Local Privacy Policy &middot; balancdvisuals@gmail.com
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 pt-2 bg-slate-50/50 gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 py-2.5 px-4 font-bold text-xs border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-blue-600 text-blue-800 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 rounded-t-xl'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Terms of Use</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 py-2.5 px-4 font-bold text-xs border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 rounded-t-xl'
            }`}
          >
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Privacy Policy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-2 py-2.5 px-4 font-bold text-xs border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'contact'
                ? 'border-amber-600 text-amber-800 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 rounded-t-xl'
            }`}
          >
            <Mail className="w-4 h-4 text-amber-600" />
            <span>Contact &amp; Support</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 leading-relaxed flex-1">
          {/* TAB 1: TERMS OF USE */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block font-bold text-xs text-amber-950">
                    Mandatory Clinical Decision Support Notice
                  </strong>
                  <p className="text-[11px] leading-relaxed text-amber-900">
                    PediCal is an offline clinical decision support calculation tool intended solely for qualified healthcare professionals. It performs dosage, reconstitution, and therapeutic feeding arithmetic based on published WHO and Ghana Health Service guidelines. It does not provide medical diagnoses or replace independent clinical judgment.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                <section className="space-y-1.5">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[11px] font-black">
                      1
                    </span>
                    <span>Intended Purpose &amp; User Eligibility</span>
                  </h3>
                  <p className="pl-7 text-slate-600 text-xs leading-relaxed">
                    PediCal is designed exclusively for licensed pediatricians, clinical dietitians, medical nutrition officers, nurses, and authorized healthcare trainees involved in the inpatient (TFC/SAM unit) and outpatient (OTP) management of Severe Acute Malnutrition (SAM) and Moderate Acute Malnutrition (MAM). By using this application, you attest that you possess appropriate clinical training or are operating under the supervision of a licensed practitioner.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[11px] font-black">
                      2
                    </span>
                    <span>Clinical Reference Standards &amp; Formulations</span>
                  </h3>
                  <div className="pl-7 space-y-2 text-slate-600 text-xs leading-relaxed">
                    <p>
                      Calculations within PediCal are formulated in alignment with:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      <li><strong>World Health Organization (WHO) 2023 Guideline:</strong> Prevention and management of acute malnutrition in infants and children.</li>
                      <li><strong>WHO Implementation Guidance (Published 17 September 2026):</strong> Comprehensive inpatient and outpatient clinical pathways, including specialized protocols for infants under six months of age.</li>
                      <li><strong>Ghana Health Service (GHS):</strong> National Guidelines for the Integrated Management of Acute Malnutrition (IMAM).</li>
                      <li><strong>Dual Formulation F-75 &amp; F-100 Support:</strong> Standard milk-based therapeutic feeds (~333 mOsm/kg) and low-osmolality cereal-based therapeutic feeds (~280 mOsm/kg) for children with persistent osmotic diarrhea or severe mucosal compromise.</li>
                    </ul>
                  </div>
                </section>

                <section className="space-y-1.5">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[11px] font-black">
                      3
                    </span>
                    <span>Independent Verification &amp; Prescribing Responsibility</span>
                  </h3>
                  <p className="pl-7 text-slate-600 text-xs leading-relaxed">
                    Every calculation generated by this software—including hourly feeding volumes, ReSoMal hydration rates, catch-up growth targets, and raw kitchen recipe measurements—must be independently verified against the patient&apos;s hemodynamic state, respiratory rate, degree of edema, and serial weight changes before administration. The attending healthcare team assumes full, sole responsibility for patient care, orders, and treatment plans.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[11px] font-black">
                      4
                    </span>
                    <span>Disclaimer of Warranties &amp; Limitation of Liability</span>
                  </h3>
                  <p className="pl-7 text-slate-600 text-xs leading-relaxed">
                    PediCal is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express or implied. To the maximum extent permitted under applicable law, the authors, developers, and distributors disclaim all liability for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use this software or from clinical decisions made based on its outputs.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[11px] font-black">
                      5
                    </span>
                    <span>Inquiries &amp; Legal Notices</span>
                  </h3>
                  <p className="pl-7 text-slate-600 text-xs leading-relaxed">
                    For inquiries regarding the Terms of Use, copyright, or clinical calculations, please contact us directly at <span className="font-semibold text-slate-900 font-mono">balancdvisuals@gmail.com</span>.
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* TAB 2: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block font-bold text-xs text-emerald-950">
                    100% Offline, Local-First Architecture
                  </strong>
                  <p className="text-[11px] leading-relaxed text-emerald-900">
                    PediCal operates entirely in your local browser. No patient names, hospital numbers (MRNs), weights, heights, or feeding logs are ever transmitted across the internet, uploaded to cloud servers, or shared with third parties.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                <section className="space-y-1.5">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-black">
                      1
                    </span>
                    <span>Zero Data Collection &amp; Zero Cloud Telemetry</span>
                  </h3>
                  <div className="pl-7 space-y-2 text-slate-600 text-xs leading-relaxed">
                    <p>
                      We believe patient health information in clinical settings demands the highest standard of privacy. Accordingly:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      <li>We do not operate backend patient servers, user trackers, or database synchronization engines.</li>
                      <li>We do not use advertising trackers, analytics SDKs, or third-party cookies.</li>
                      <li>We do not sell, rent, monetize, or harvest clinical data under any circumstances.</li>
                    </ul>
                  </div>
                </section>

                <section className="space-y-1.5">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-black">
                      2
                    </span>
                    <span>Local Data Storage &amp; Encryption</span>
                  </h3>
                  <p className="pl-7 text-slate-600 text-xs leading-relaxed">
                    All patient admissions, anthropometric values, and bedside feeding entries are saved directly inside your device&apos;s sandboxed browser storage (IndexedDB and LocalStorage). For enhanced security in shared clinical wards, PediCal includes optional PIN lock and hardware-accelerated AES-GCM 256-bit encryption with a 32-character Master Recovery Key.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-black">
                      3
                    </span>
                    <span>User Data Control &amp; Deletion</span>
                  </h3>
                  <p className="pl-7 text-slate-600 text-xs leading-relaxed">
                    You have complete control over your local records. You can:
                  </p>
                  <ul className="list-disc pl-12 space-y-1 text-slate-700">
                    <li>Discharge or delete individual patients at any time.</li>
                    <li>Export password-protected encrypted JSON backups for ward transfer or records keeping.</li>
                    <li>Perform an instantaneous Emergency Local Wipe from the Settings screen or Lockout screen, which purges all stored records permanently from device memory.</li>
                  </ul>
                </section>

                <section className="space-y-1.5">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-black">
                      4
                    </span>
                    <span>Bedside Best Practice Recommendation</span>
                  </h3>
                  <p className="pl-7 text-slate-600 text-xs leading-relaxed">
                    To maintain strict hospital de-identification standards, we advise clinical teams to identify patients by bed or cot designations (e.g. &quot;Cot 04&quot;) and institutional admission codes rather than full legal names whenever possible.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-black">
                      5
                    </span>
                    <span>Privacy Officer Contact</span>
                  </h3>
                  <p className="pl-7 text-slate-600 text-xs leading-relaxed">
                    If you have questions about our local-first privacy practices or need assistance with data security audits, reach out to <span className="font-semibold text-slate-900 font-mono">balancdvisuals@gmail.com</span>.
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT & SUPPORT */}
          {activeTab === 'contact' && (
            <div className="space-y-5">
              <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 text-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-blue-900">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Developer &amp; Clinical Lead Contact</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We welcome feedback, protocol inquiries, bug reports, and collaboration opportunities from pediatricians, nutrition officers, and humanitarian health organizations.
                </p>
              </div>

              {/* Main Contact Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Official Contact Email
                    </span>
                    <a
                      href={`mailto:${contactEmail}`}
                      className="text-base sm:text-lg font-black text-blue-700 hover:text-blue-900 font-mono break-all hover:underline"
                    >
                      {contactEmail}
                    </a>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs min-h-[38px]"
                    >
                      {copiedEmail ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy Address</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`mailto:${contactEmail}?subject=PediCal%20Clinical%20Inquiry`}
                      className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs min-h-[38px] btn-tactile-primary"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Send Email</span>
                    </a>
                  </div>
                </div>

                <div className="border-t border-slate-200/80 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <strong className="block text-slate-900 font-bold mb-0.5">Clinical Feedback</strong>
                    <span className="text-slate-600 text-[11px]">
                      Share feedback on WHO 2023 or 17 Sept 2026 guidance integration, GHS IMAM alignment, or raw formula recipes.
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <strong className="block text-slate-900 font-bold mb-0.5">Technical &amp; Ward Support</strong>
                    <span className="text-slate-600 text-[11px]">
                      Report calculation bugs, device responsiveness issues, or request assistance with encrypted backup migrations.
                    </span>
                  </div>
                </div>
              </div>

              {/* Offline Deployment & Distribution Note */}
              <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-200 text-slate-600 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Offline Field Deployment:</strong> PediCal is designed as an installable Progressive Web App (PWA). Once installed, it continues to function completely without network access in remote health posts, district hospitals, and disaster relief zones.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
            <span>Support:</span>
            <a
              href={`mailto:${contactEmail}`}
              className="text-blue-700 hover:underline font-semibold"
            >
              {contactEmail}
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors min-h-[38px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
