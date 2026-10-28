import React, { useState, useEffect } from 'react';
import { AppSettings, DEFAULT_APP_SETTINGS } from '../utils/appSettings';
import {
  X,
  Sliders,
  Building2,
  Eye,
  Activity,
  RotateCcw,
  Check,
  Printer,
  FileDown,
  Trash2,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Layers,
  Lock,
  KeyRound,
  ShieldAlert,
  HardDrive,
  Upload,
  Info,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { WardPatient } from '../data/wardPatients';
import { loadRemindersFromStorage } from '../utils/reminders';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onSave: (updated: AppSettings) => void;
  onClose: () => void;
  onResetWard?: () => void;
  onClearScreeningLog?: () => void;
  onOpenPrintModal?: () => void;
  onOpenDisclaimer?: () => void;
  patients?: WardPatient[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onSave,
  onClose,
  onResetWard,
  onClearScreeningLog,
  onOpenPrintModal,
  onOpenDisclaimer,
  patients = [],
}) => {
  const [form, setForm] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'interface' | 'facility' | 'clinical' | 'security' | 'data'>('interface');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [storagePersisted, setStoragePersisted] = useState<boolean | null>(null);
  const [restoreError, setRestoreError] = useState<string>('');
  const [restoreSuccess, setRestoreSuccess] = useState<string>('');

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then((persisted) => {
        setStoragePersisted(persisted);
      }).catch(() => setStoragePersisted(false));
    }
  }, []);

  const handleRequestPersistence = async () => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      setStoragePersisted(isPersisted);
    }
  };

  if (!isOpen) return null;

  const handleToggle = (key: keyof AppSettings) => {
    setForm((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleUpdate = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveAndApply = () => {
    onSave(form);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleResetDefaults = () => {
    setForm(DEFAULT_APP_SETTINGS);
  };

  // Export full clinical JSON backup
  const handleExportData = () => {
    const reminders = loadRemindersFromStorage();
    const backupData = {
      application: 'Pdical Pediatric Clinical Suite',
      version: '3.0',
      timestamp: new Date().toISOString(),
      facility: form.facilityName,
      ward: form.wardSubtitle,
      patients: patients,
      settings: form,
      reminders: reminders,
    };
    const dateStr = new Date().toISOString().split('T')[0];
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdical-clinical-backup-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Restore from JSON backup file
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        if (!data || typeof data !== 'object') {
          throw new Error('Invalid JSON format.');
        }

        // Restore patients
        if (Array.isArray(data.patients)) {
          localStorage.setItem('pedical_ward_inpatients_v3', JSON.stringify(data.patients));
        }
        // Restore settings
        if (data.settings && typeof data.settings === 'object') {
          localStorage.setItem('pedical_user_settings_v1', JSON.stringify(data.settings));
          setForm(data.settings);
          onSave(data.settings);
        }
        // Restore reminders
        if (Array.isArray(data.reminders)) {
          localStorage.setItem('pedical_clinical_reminders_v1', JSON.stringify(data.reminders));
        }

        setRestoreSuccess('Backup successfully restored! Reloading app in 1.5s...');
        setRestoreError('');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        setRestoreError((err as Error).message || 'Failed to parse backup file.');
        setRestoreSuccess('');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Application Settings &amp; Customization</h2>
              <p className="text-[11px] text-slate-500">Declutter interface &middot; PIN lock &middot; Local Backup</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          className="px-4 sm:px-5 pt-2 pb-1.5 border-b border-slate-200 bg-white flex items-center gap-1 overflow-x-auto overflow-y-hidden flex-nowrap whitespace-nowrap text-xs font-semibold"
          style={{ overflowX: 'auto', overflowY: 'hidden' }}
        >
          {[
            { id: 'interface', label: 'UI & Declutter', icon: Eye },
            { id: 'facility', label: 'Facility Branding', icon: Building2 },
            { id: 'clinical', label: 'Clinical Protocols', icon: Activity },
            { id: 'security', label: 'Security', icon: Lock },
            { id: 'data', label: 'Data & Backup', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg transition-all shrink-0 ${
                  isActive
                    ? 'bg-blue-50 text-blue-800 border border-blue-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {/* TAB 1: UI & DECLUTTER */}
          {activeTab === 'interface' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-blue-900">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-xs">
                  <Smartphone className="w-3.5 h-3.5 text-blue-700" />
                  <span>Streamline &amp; Declutter Workspace</span>
                </div>
                <div className="text-[11px] text-blue-800/90 leading-relaxed">
                  Turn off elements that clutter the screen during high-tempo ward rounds. Mobile viewports will stay clean, fast, and focused on essential dosing.
                </div>
              </div>

              <div className="space-y-3">
                {/* Hide Print on Mobile */}
                <div className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition-colors">
                  <div className="pr-3">
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>Hide Print Buttons on Mobile</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Recommended</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                      Hides all print buttons from phones where printers are not connected. Keeps the header, patient cards, and screening forms completely clean and uncluttered.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={form.hidePrintOnMobile}
                      onChange={() => handleToggle('hidePrintOnMobile')}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Show/Hide Quick Presets */}
                <div className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition-colors">
                  <div className="pr-3">
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Show Inpatient Quick Presets</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                      Displays the 4 quick clinical scenario shortcut buttons (&quot;Kwashiorkor +++&quot;, &quot;Marasmus Severe&quot;, etc.) at the top of the Inpatient calculator. Turn off for a more compact form.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={form.showQuickPresets}
                      onChange={() => handleToggle('showQuickPresets')}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Show Diagnostic Guidance Notes */}
                <div className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition-colors">
                  <div className="pr-3">
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Show Protocol Guidance Banners</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                      Displays educational WHO guideline advice boxes, diagnostic notes, and fluid phase warnings. Turn off for pure calculation without explanatory text.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={form.showDiagnosticGuidanceNotes}
                      onChange={() => handleToggle('showDiagnosticGuidanceNotes')}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Compact Ward Roster View */}
                <div className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition-colors">
                  <div className="pr-3">
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>High-Density / Compact Ward Cards</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                      Reduces padding and compresses bed cards so you can see more inpatient beds on screen at once during morning rounds.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={form.compactWardView}
                      onChange={() => handleToggle('compactWardView')}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FACILITY BRANDING */}
          {activeTab === 'facility' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                <div className="font-bold text-slate-900 mb-1 text-xs">Printable Sheet &amp; Ward Branding</div>
                <div className="text-[11px] text-slate-500 leading-relaxed">
                  Customize your institution name, ward subtitle, and clinician details. These appear at the top of printed bedside cards, OTP summaries, and ward census worksheets.
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Your Name / Clinician Name
                  </label>
                  <input
                    type="text"
                    value={form.clinicianName || ''}
                    onChange={(e) => handleUpdate('clinicianName', e.target.value)}
                    placeholder="e.g. Ama Mensah or Dr. Kofi"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-xs focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Your first name will replace the default &quot;Clinician&quot; greeting on your Today dashboard.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Hospital / Facility Name
                  </label>
                  <input
                    type="text"
                    value={form.facilityName}
                    onChange={(e) => handleUpdate('facilityName', e.target.value)}
                    placeholder="e.g. St. Jude District Hospital"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Ward or Clinic Department
                  </label>
                  <input
                    type="text"
                    value={form.wardSubtitle}
                    onChange={(e) => handleUpdate('wardSubtitle', e.target.value)}
                    placeholder="e.g. Pediatric Stabilization Centre (SC) &amp; CMAM"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Clinician / Team Title
                  </label>
                  <input
                    type="text"
                    value={form.clinicianRole}
                    onChange={(e) => handleUpdate('clinicianRole', e.target.value)}
                    placeholder="e.g. Medical Officer / Pediatric Nutrition Team"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Live Preview Box */}
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 space-y-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Live Header Preview on Printed Sheets:
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{form.facilityName || 'Facility Name'}</div>
                  <div className="text-[11px] text-slate-600 font-medium">
                    {form.wardSubtitle || 'Ward Unit'} &middot; {form.clinicianRole || 'Clinical Team'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLINICAL PROTOCOLS */}
          {activeTab === 'clinical' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-xs mb-1">Clinical Calculation Defaults</div>
                <div className="text-[11px] text-slate-500">
                  Configure default feeding schedules, local milk bases, and dosing precision standards.
                </div>
              </div>

              {/* Default Feeding Interval */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Default Inpatient Feeding Interval
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 2, label: '2-hourly', sub: '12 feeds/day (Kwashiorkor / Critical)' },
                    { val: 3, label: '3-hourly', sub: '8 feeds/day (Standard WHO Protocol)' },
                    { val: 4, label: '4-hourly', sub: '6 feeds/day (Late Transition)' },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => handleUpdate('defaultFeedingIntervalHours', item.val)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        form.defaultFeedingIntervalHours === item.val
                          ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-xs">{item.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{item.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Local Milk Recipe */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Default Local Milk Formula Source
                </label>
                <select
                  value={form.defaultLocalMilkSource}
                  onChange={(e) => handleUpdate('defaultLocalMilkSource', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-xs bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Dried Skimmed Milk Powder">Dried Skimmed Milk Powder (DSM) + Oil + Sugar + Flour</option>
                  <option value="Dried Whole Milk Powder">Dried Whole Milk Powder (DWM) + Sugar + Flour</option>
                  <option value="Fresh Cow Milk">Fresh Cow Milk + Oil + Sugar + Flour</option>
                </select>
              </div>

              {/* Fluid Rounding Precision */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Feed Volume Dispensing Precision
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'round5', label: 'Round to 5 mL', note: 'Standard syringe / cup' },
                    { id: 'round10', label: 'Round to 10 mL', note: 'Large batch measuring' },
                    { id: 'exact', label: 'Exact (0.1 mL)', note: 'Strict scientific weight' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleUpdate('fluidRoundingMode', opt.id as 'exact' | 'round5' | 'round10')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        form.fluidRoundingMode === opt.id
                          ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-xs">{opt.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{opt.note}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Guidelines Standard */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Active Clinical Guideline Standard
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      id: 'GHS / UNICEF IMAM (Ghana) & WHO 2023',
                      label: 'Ghana Health Service (GHS) & WHO 2023',
                      sub: 'Ghana IMAM / CMAM Protocol + ReSoMal + Ghana antibiotic & malaria guidelines',
                    },
                    {
                      id: 'WHO 2023 Guidelines',
                      label: 'WHO 2023 Global Guideline',
                      sub: 'Standard WHO Prevention & Management of Wasting & Nutritional Oedema',
                    },
                  ].map((gl) => (
                    <button
                      key={gl.id}
                      type="button"
                      onClick={() => handleUpdate('guidelineVersion', gl.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        form.guidelineVersion === gl.id
                          ? 'border-teal-500 bg-teal-50/70 text-teal-950 font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-xs flex items-center justify-between">
                        <span>{gl.label}</span>
                        {form.guidelineVersion === gl.id && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-200 text-teal-900 font-bold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 leading-tight">{gl.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY & PRIVACY */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-900 rounded-xl text-white">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-xs text-amber-400">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Security &amp; Local Privacy Suite</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Protect pediatric patient records when conducting busy ward rounds. When locked, an authorized 4-digit PIN or Clinician Recovery Secret is required to access data.
                </p>
              </div>

              {/* PIN Lock Toggle */}
              <div className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition-colors">
                <div className="pr-3">
                  <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                    <span>PIN lock</span>
                    {form.pinLockEnabled && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-1.5 py-0.2 rounded">
                        active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Require 4-digit PIN to access patient records. Provides 1-tap lock in header.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={form.pinLockEnabled}
                    onChange={() => handleToggle('pinLockEnabled')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* PIN Code Setup */}
              {form.pinLockEnabled && (
                <div className="space-y-3 p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                        <span>4-digit PIN</span>
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={form.pinCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                          handleUpdate('pinCode', val);
                        }}
                        placeholder="1234"
                        className="w-full text-base sm:text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-bold tracking-widest text-slate-900 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[40px]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Auto-lock</span>
                      </label>
                      <select
                        value={form.autoLockMinutes}
                        onChange={(e) => handleUpdate('autoLockMinutes', Number(e.target.value))}
                        className="w-full text-base sm:text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[40px]"
                      >
                        <option value={0}>Immediate on app blur</option>
                        <option value={5}>5 minutes</option>
                        <option value={15}>15 minutes (default)</option>
                        <option value={30}>30 minutes</option>
                        <option value={-1}>Manual lock only</option>
                      </select>
                    </div>
                  </div>

                  {/* Clinician Recovery Secret */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Recovery secret (optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.recoveryKey}
                      onChange={(e) => handleUpdate('recoveryKey', e.target.value)}
                      placeholder="Staff ID or secret phrase"
                      className="w-full text-base sm:text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[40px]"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Allows unlocking if PIN is forgotten without losing data.
                    </p>
                  </div>
                </div>
              )}

              {/* Safeguards Card */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-slate-900">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>Security safeguards</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  5 wrong attempts triggers a 30s penalty lock. If credentials are lost, typing &quot;WIPE&quot; resets app data to protect patient privacy.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: DATA, STORAGE & BACKUP */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              {/* Storage Persistence Status */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                    <span>Persistent storage</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {storagePersisted === true
                      ? 'Protected: Browser will not evict local records during low disk cleanups.'
                      : storagePersisted === false
                      ? 'Standard: Not currently marked persistent.'
                      : 'Checking status...'}
                  </p>
                </div>
                {storagePersisted !== true && (
                  <button
                    type="button"
                    onClick={handleRequestPersistence}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shrink-0 min-h-[36px]"
                  >
                    Request persistence
                  </button>
                )}
                {storagePersisted === true && (
                  <div className="flex items-center gap-1 text-emerald-700 font-semibold text-xs shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Active</span>
                  </div>
                )}
              </div>

              {/* Cache Clarification Card */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-emerald-950 text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-emerald-900">
                  <Info className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Local storage guarantee</span>
                </div>
                <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                  Clearing browser cache or updating the page updates application code, but <strong>never deletes child patient records</strong> or reminders stored on this device.
                </p>
              </div>

              {/* 1-Click Clinical Backup & Restore */}
              <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-200 space-y-2.5">
                <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                  <FileDown className="w-3.5 h-3.5 text-blue-600" />
                  <span>Clinical backup &amp; restore</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Export or restore all admissions, feeding plans, and reminders as a local JSON file:
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg flex items-center gap-1 shadow-xs transition-colors min-h-[36px]"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Export backup (.json)</span>
                  </button>

                  <label className="py-1.5 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors min-h-[36px]">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Restore file</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileRestore}
                      className="sr-only"
                    />
                  </label>
                </div>

                {restoreSuccess && (
                  <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{restoreSuccess}</span>
                  </div>
                )}
                {restoreError && (
                  <div className="p-2.5 bg-rose-100 text-rose-900 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
                    <span>{restoreError}</span>
                  </div>
                )}
              </div>

              {/* Direct Print Trigger */}
              {onOpenPrintModal && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5 text-blue-600" />
                    <span>Bedside Worksheet &amp; Flowsheet Printing</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Generate printable bedside cards or batch rosters directly from settings:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPrintModal();
                    }}
                    className="w-full py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors min-h-[44px]"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Open Printable Bedside Cards Preview</span>
                  </button>
                </div>
              )}

              {/* Data Reset Actions */}
              <div className="p-3.5 bg-rose-50/40 rounded-xl border border-rose-200 space-y-2.5">
                <div className="font-bold text-rose-950 text-xs flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Ward &amp; Screening Reset Actions</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {onClearScreeningLog && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Clear all children records recorded during this screening session?')) {
                          onClearScreeningLog();
                        }
                      }}
                      className="py-1.5 px-3 bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 font-semibold rounded-lg flex items-center gap-1.5 transition-colors min-h-[44px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Screening Tally Log</span>
                    </button>
                  )}

                  {onResetWard && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Reset all inpatient beds to initial default roster? This cannot be undone.')) {
                          onResetWard();
                        }
                      }}
                      className="py-1.5 px-3 bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 font-semibold rounded-lg flex items-center gap-1.5 transition-colors min-h-[44px]"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Inpatient Beds to Default</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Clinical Legal Review */}
              {onOpenDisclaimer && (
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Need to review clinical terms &amp; disclaimer?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDisclaimer();
                    }}
                    className="text-blue-700 hover:underline font-bold flex items-center gap-1 min-h-[44px]"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Review Disclaimer</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndApply}
              className="py-2 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save &amp; Apply</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
