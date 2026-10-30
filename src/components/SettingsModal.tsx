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
  Copy,
  Download,
  FileLock2,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { WardPatient } from '../data/wardPatients';
import { loadRemindersFromStorage } from '../utils/reminders';
import {
  generateRecoveryKey,
  initializeSecurityVault,
  loadSecurityVault,
  createEncryptedBackup,
  restoreEncryptedBackup,
  getActiveMasterKey,
  saveSecurityVault,
  updateVaultPin,
  normalizeRecoveryKey,
} from '../utils/cryptoStorage';
import { encryptExistingIndexedDBData, savePatientsToIDB, saveSettingsToIDB } from '../utils/indexedDBStorage';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onSave: (updated: AppSettings) => void;
  onClose: () => void;
  onResetWard?: () => void;
  onClearScreeningLog?: () => void;
  onOpenPrintModal?: () => void;
  onOpenDisclaimer?: () => void;
  onOpenLegal?: (tab?: 'terms' | 'privacy' | 'contact') => void;
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
  onOpenLegal,
  patients = [],
}) => {
  const [form, setForm] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'interface' | 'facility' | 'clinical' | 'security' | 'data' | 'legal'>('interface');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [storagePersisted, setStoragePersisted] = useState<boolean | null>(null);

  // Recovery Key Setup & Copy state
  const [copiedKey, setCopiedKey] = useState(false);
  const [keyNoticeConfirmed, setKeyNoticeConfirmed] = useState(false);

  // Encrypted Backup Export Modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [backupPasswordConfirm, setBackupPasswordConfirm] = useState('');
  const [exportError, setExportError] = useState('');

  // Encrypted Backup Import Modal state
  const [pendingImportContent, setPendingImportContent] = useState<string | null>(null);
  const [importPassword, setImportPassword] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [restoreSuccess, setRestoreSuccess] = useState('');

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then((persisted) => {
        setStoragePersisted(persisted);
      }).catch(() => setStoragePersisted(false));
    }
  }, []);

  // Ensure recovery key is populated when PIN lock is enabled
  useEffect(() => {
    if (form.pinLockEnabled && (!form.recoveryKey || form.recoveryKey.trim().length === 0)) {
      const freshKey = generateRecoveryKey();
      setForm((prev) => ({ ...prev, recoveryKey: freshKey }));
    }
  }, [form.pinLockEnabled]);

  const handleRequestPersistence = async () => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      setStoragePersisted(isPersisted);
    }
  };

  if (!isOpen) return null;

  const handleToggle = (key: keyof AppSettings) => {
    setForm((prev) => {
      const nextVal = !prev[key];
      // If turning on PIN lock and no recovery key, auto-generate 32-character key
      if (key === 'pinLockEnabled' && nextVal && !prev.recoveryKey) {
        return {
          ...prev,
          [key]: nextVal,
          recoveryKey: generateRecoveryKey(),
        };
      }
      return {
        ...prev,
        [key]: nextVal,
      };
    });
  };

  const handleUpdate = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveAndApply = async () => {
    // If PIN lock is enabled, guarantee cryptographic Master Key vault initialization
    if (form.pinLockEnabled) {
      const cleanPin = form.pinCode?.trim() || '1234';
      const cleanRecovery = form.recoveryKey?.trim() || generateRecoveryKey();

      try {
        const existingVault = loadSecurityVault();
        const activeKey = getActiveMasterKey();

        if (!existingVault) {
          // Initialize fresh dual-layer vault
          const { masterKey } = await initializeSecurityVault(cleanPin, cleanRecovery);
          await encryptExistingIndexedDBData(masterKey);
        } else if (activeKey && cleanPin !== settings.pinCode) {
          // Update existing vault with new PIN
          await updateVaultPin(cleanPin, activeKey);
        }
      } catch (err) {
        console.warn('[PediCal Settings] Vault sync notice:', err);
      }
    }

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

  const handleCopyRecoveryKey = () => {
    if (!form.recoveryKey) return;
    navigator.clipboard.writeText(form.recoveryKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleDownloadRecoveryKey = () => {
    if (!form.recoveryKey) return;
    const content = `PEDICAL MASTER RECOVERY KEY (OFFLINE BACKUP)\n` +
      `Facility: ${form.facilityName}\n` +
      `Generated: ${new Date().toISOString()}\n\n` +
      `32-Character Recovery Key:\n` +
      `${form.recoveryKey}\n\n` +
      `CRITICAL INSTRUCTIONS:\n` +
      `- PediCal operates 100% offline with zero cloud server recovery.\n` +
      `- If you forget your PIN, this key is the ONLY cryptographic method to unwrap your AES-256 Master Key.\n` +
      `- Store this text file or paper copy in your secure clinical ward office.\n`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedical-master-recovery-key-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Secure Encrypted JSON Backup Export
  const handleExecuteEncryptedExport = async () => {
    setExportError('');
    if (!backupPassword || backupPassword.length < 4) {
      setExportError('Backup password must be at least 4 characters long.');
      return;
    }
    if (backupPassword !== backupPasswordConfirm) {
      setExportError('Password confirmation does not match.');
      return;
    }

    try {
      const reminders = loadRemindersFromStorage();
      const rawData = {
        application: 'PediCal Pediatric Clinical Decision Support Suite',
        version: '3.0',
        exportedAt: new Date().toISOString(),
        facility: form.facilityName,
        ward: form.wardSubtitle,
        patients: patients,
        settings: form,
        reminders: reminders,
      };

      const encryptedJson = await createEncryptedBackup(rawData, backupPassword, form.facilityName);
      const dateStr = new Date().toISOString().split('T')[0];
      const blob = new Blob([encryptedJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pedical-encrypted-backup-${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setShowExportModal(false);
      setBackupPassword('');
      setBackupPasswordConfirm('');
    } catch (err: any) {
      setExportError(err.message || 'Failed to encrypt backup.');
    }
  };

  // File selector handler for backup restore
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const parsed = JSON.parse(content);
        if (parsed.format === 'pedical-encrypted-backup-v1' || parsed.ciphertext) {
          // Encrypted backup: require password modal
          setPendingImportContent(content);
          setImportPassword('');
          setRestoreError('');
        } else {
          // Legacy unencrypted backup
          restoreParsedData(parsed);
        }
      } catch (err: any) {
        setRestoreError(err.message || 'Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Decrypt and restore pending encrypted file
  const handleDecryptAndRestore = async () => {
    if (!pendingImportContent) return;
    setRestoreError('');

    try {
      const decryptedData = await restoreEncryptedBackup(pendingImportContent, importPassword);
      restoreParsedData(decryptedData);
      setPendingImportContent(null);
      setImportPassword('');
    } catch (err: any) {
      setRestoreError(err.message || 'Failed to decrypt backup. Verify your password.');
    }
  };

  const restoreParsedData = (data: any) => {
    try {
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid clinical data structure in backup.');
      }

      if (Array.isArray(data.patients)) {
        localStorage.setItem('pedical_ward_inpatients_v3', JSON.stringify(data.patients));
        savePatientsToIDB(data.patients);
      }
      if (data.settings && typeof data.settings === 'object') {
        localStorage.setItem('pedical_user_settings_v1', JSON.stringify(data.settings));
        saveSettingsToIDB(data.settings);
        setForm(data.settings);
        onSave(data.settings);
      }
      if (Array.isArray(data.reminders)) {
        localStorage.setItem('pedical_clinical_reminders_v1', JSON.stringify(data.reminders));
      }

      setRestoreSuccess('Encrypted backup successfully verified & restored! Reloading app in 1.5s...');
      setRestoreError('');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setRestoreError(err.message || 'Failed to restore records from backup.');
      setRestoreSuccess('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 card-depth">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-2xs">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Application Settings &amp; Security</h2>
              <p className="text-[11px] text-slate-500">Bedside PIN Lock &middot; Patient Privacy &middot; Local Backup</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-100/70 px-4 gap-1 overflow-x-auto text-xs py-1.5">
          {[
            { id: 'interface', label: 'Display & UI', icon: Eye },
            { id: 'facility', label: 'Facility Branding', icon: Building2 },
            { id: 'clinical', label: 'Protocols & Math', icon: Activity },
            { id: 'security', label: 'Security & PIN', icon: Lock },
            { id: 'data', label: 'Backup & Restore', icon: HardDrive },
            { id: 'legal', label: 'Legal & Contact', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-slate-800 text-xs">
          {/* TAB 1: INTERFACE */}
          {activeTab === 'interface' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-200 text-slate-700">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-xs text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Bedside Interface Streamlining</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Tailor the bedside interface to minimize distractions during rapid inpatient rounds and fieldwork.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white">
                  <div>
                    <div className="font-semibold text-slate-900">Compact ward cot view</div>
                    <p className="text-[11px] text-slate-500">Display denser patient roster cards</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.compactWardView}
                    onChange={() => handleToggle('compactWardView')}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white">
                  <div>
                    <div className="font-semibold text-slate-900">Show diagnostic guidance notes</div>
                    <p className="text-[11px] text-slate-500">Include WHO transition criteria and appetite alerts</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.showDiagnosticGuidanceNotes}
                    onChange={() => handleToggle('showDiagnosticGuidanceNotes')}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white">
                  <div>
                    <div className="font-semibold text-slate-900">Hide print button on mobile screens</div>
                    <p className="text-[11px] text-slate-500">Optimizes screen real estate on phones</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.hidePrintOnMobile}
                    onChange={() => handleToggle('hidePrintOnMobile')}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FACILITY */}
          {activeTab === 'facility' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Health Facility / Hospital Name:
                </label>
                <input
                  type="text"
                  value={form.facilityName}
                  onChange={(e) => handleUpdate('facilityName', e.target.value)}
                  placeholder="e.g. Tamale Teaching Hospital"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Ward Subtitle / Unit:
                </label>
                <input
                  type="text"
                  value={form.wardSubtitle}
                  onChange={(e) => handleUpdate('wardSubtitle', e.target.value)}
                  placeholder="e.g. Pediatric Inpatient SAM / TFC Unit"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium min-h-[40px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Clinician Name:
                  </label>
                  <input
                    type="text"
                    value={form.clinicianName}
                    onChange={(e) => handleUpdate('clinicianName', e.target.value)}
                    placeholder="e.g. Ama Mensah, RD"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium min-h-[40px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Professional Role:
                  </label>
                  <input
                    type="text"
                    value={form.clinicianRole}
                    onChange={(e) => handleUpdate('clinicianRole', e.target.value)}
                    placeholder="e.g. Senior Nutrition Officer"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium min-h-[40px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLINICAL */}
          {activeTab === 'clinical' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Catch-up Growth Weight Gain Target (g/kg/day):
                </label>
                <select
                  value={form.catchUpWeightGainTarget}
                  onChange={(e) => handleUpdate('catchUpWeightGainTarget', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium min-h-[40px]"
                >
                  <option value={5}>5 g/kg/day (Moderate target)</option>
                  <option value={10}>10 g/kg/day (Standard WHO target - Recommended)</option>
                  <option value={15}>15 g/kg/day (Aggressive catch-up target)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Active Clinical Guideline Standard:
                </label>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 font-semibold text-slate-900">
                  {form.guidelineVersion}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY & BEDSIDE PIN */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-900 rounded-2xl text-white space-y-1.5 shadow-sm">
                <div className="font-bold flex items-center gap-1.5 text-xs text-amber-400">
                  <ShieldAlert className="w-4 h-4" />
                  <span>PIN Lock &amp; Bedside Privacy</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Protects child patient records from unauthorized view during busy ward rounds. When enabled, your PIN or Emergency Recovery Code is required to unlock the app.
                </p>
              </div>

              {/* PIN Lock Toggle */}
              <div className="flex items-start justify-between p-3.5 rounded-2xl border border-slate-200 bg-white">
                <div className="pr-3">
                  <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                    <span>PIN lock protection</span>
                    {form.pinLockEnabled && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full border border-emerald-200">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Requires a 4 to 6 digit PIN whenever the app is opened or left idle.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={form.pinLockEnabled}
                    onChange={() => handleToggle('pinLockEnabled')}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {form.pinLockEnabled && (
                <div className="space-y-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                        <span>4 to 6 digit PIN</span>
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={form.pinCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                          handleUpdate('pinCode', val);
                        }}
                        placeholder="1234"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-bold tracking-widest text-slate-900 min-h-[40px]"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Length: {form.pinCode?.length || 0} digits (4-6 recommended)
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Auto-lock timeout</span>
                      </label>
                      <select
                        value={form.autoLockMinutes}
                        onChange={(e) => handleUpdate('autoLockMinutes', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium text-slate-800 min-h-[40px]"
                      >
                        <option value={0}>Immediate on app blur</option>
                        <option value={5}>5 minutes</option>
                        <option value={15}>15 minutes (default)</option>
                        <option value={30}>30 minutes</option>
                        <option value={-1}>Manual lock only</option>
                      </select>
                    </div>
                  </div>

                  {/* 32-Character Emergency Recovery Code Card */}
                  <div className="p-3.5 rounded-2xl bg-white border border-blue-200 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Emergency Recovery Code</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const fresh = generateRecoveryKey();
                          handleUpdate('recoveryKey', fresh);
                          setKeyNoticeConfirmed(false);
                        }}
                        className="text-[10px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1"
                        title="Generate a new code"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Generate new code</span>
                      </button>
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded-xl text-emerald-400 font-mono text-xs font-bold tracking-wider select-all break-all text-center border border-slate-800">
                      {form.recoveryKey || 'GENERATING-CODE...'}
                    </div>

                    {/* Offline Notice */}
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300/80 text-amber-950 text-[11px] leading-relaxed space-y-1">
                      <strong className="block text-amber-900 uppercase font-black tracking-wide text-[10px]">
                        Offline Notice:
                      </strong>
                      <p>
                        PediCal runs 100% offline without any remote cloud servers. If you forget your PIN, this Emergency Recovery Code is the only way to recover access to your patient records. Please copy or write it down.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCopyRecoveryKey}
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-blue-200 transition-colors min-h-[38px]"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey ? 'Code Copied!' : 'Copy Recovery Code'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadRecoveryKey}
                        className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-200 transition-colors min-h-[38px]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Save .TXT</span>
                      </button>
                    </div>

                    <label className="flex items-start gap-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={keyNoticeConfirmed}
                        onChange={(e) => setKeyNoticeConfirmed(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded mt-0.5"
                      />
                      <span className="text-[11px] text-slate-700 font-medium">
                        I confirm that I have written down or saved my Recovery Code.
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DATA & ENCRYPTED BACKUP */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              {/* Storage Persistence Status */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                    <span>Persistent storage guarantee</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {storagePersisted === true
                      ? 'Protected: Browser will not evict local records during low disk cleanups.'
                      : 'Standard: Request browser persistence flag for ward records.'}
                  </p>
                </div>
                {storagePersisted !== true && (
                  <button
                    type="button"
                    onClick={handleRequestPersistence}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shrink-0 min-h-[36px]"
                  >
                    Request persistence
                  </button>
                )}
                {storagePersisted === true && (
                  <div className="flex items-center gap-1 text-emerald-700 font-bold text-xs shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Active</span>
                  </div>
                )}
              </div>

              {/* Secure Encrypted JSON Backup & Restore Card */}
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <FileLock2 className="w-4 h-4 text-blue-700" />
                    <span>Secure Patient Data Backup</span>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                    Protected
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Export a protected backup file of all admissions, feeding plans, and reminders. You can restore this file on this or another device using your password.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setExportError('');
                      setBackupPassword('');
                      setBackupPasswordConfirm('');
                      setShowExportModal(true);
                    }}
                    className="py-2 px-3.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors min-h-[38px] btn-tactile-primary"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Export Secure Backup (.json)</span>
                  </button>

                  <label className="py-2 px-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors min-h-[38px] shadow-2xs">
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>Restore Backup File</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="sr-only"
                    />
                  </label>
                </div>

                {restoreSuccess && (
                  <div className="p-3 bg-emerald-100 text-emerald-950 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-300">
                    <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{restoreSuccess}</span>
                  </div>
                )}
                {restoreError && (
                  <div className="p-3 bg-rose-100 text-rose-950 rounded-xl text-xs font-bold flex items-center gap-2 border border-rose-300">
                    <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
                    <span>{restoreError}</span>
                  </div>
                )}
              </div>

              {/* Reset ward database */}
              {onResetWard && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 text-xs">Reset ward to default demo cots</div>
                    <p className="text-[11px] text-slate-500">Replaces current ward list with 5 standard WHO training patients</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Reset ward patients to default training demo list?')) {
                        onResetWard();
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl transition-colors min-h-[36px]"
                  >
                    Reset cots
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: LEGAL, PRIVACY & CONTACT */}
          {activeTab === 'legal' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-900 rounded-2xl text-white space-y-1.5 shadow-sm">
                <div className="font-bold flex items-center gap-1.5 text-xs text-blue-400">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Clinical Reference &amp; Privacy Compliance</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  PediCal operates under strict offline-first privacy standards. All patient data remains 100% on this local device with zero cloud telemetry.
                </p>
              </div>

              {/* Agreement Status Card */}
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-emerald-950 text-xs flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-700" />
                    <span>Healthcare Professional Agreement Active</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Affirmed compliance with independent clinical verification guidelines.
                  </p>
                </div>
                {onOpenDisclaimer && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDisclaimer();
                    }}
                    className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs rounded-xl transition-colors shrink-0 min-h-[36px]"
                  >
                    Review agreement
                  </button>
                )}
              </div>

              {/* Full Legal Documents */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <FileLock2 className="w-4 h-4 text-blue-700" />
                  <span>Legal &amp; Clinical Policies</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Review complete Terms of Use, WHO 2023 / 17 Sept 2026 clinical guidelines scope, and local-first Privacy Policy.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {onOpenLegal && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenLegal('terms');
                        }}
                        className="py-2 px-3.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors min-h-[38px] btn-tactile-primary"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Terms of Use</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenLegal('privacy');
                        }}
                        className="py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors min-h-[38px]"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Privacy Policy</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Contact Information Card */}
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-blue-700" />
                    <span>Contact Information &amp; Support</span>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                    Official
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  For clinical questions, guideline adjustments, error reports, or hospital deployment inquiries:
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-blue-200/80">
                  <a
                    href="mailto:balancdvisuals@gmail.com"
                    className="font-mono font-bold text-xs text-blue-700 hover:underline"
                  >
                    balancdvisuals@gmail.com
                  </a>

                  <div className="flex items-center gap-2">
                    <a
                      href="mailto:balancdvisuals@gmail.com?subject=PediCal%20Clinical%20Inquiry"
                      className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Email</span>
                    </a>
                    {onOpenLegal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenLegal('contact');
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs min-h-[38px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndApply}
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm min-h-[38px] btn-tactile-primary"
            >
              {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : null}
              <span>{savedSuccess ? 'Settings Saved!' : 'Save & Apply'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Encrypted Backup Password Prompt (Export) */}
      {showExportModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 card-depth">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileLock2 className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-sm text-slate-900">Protect Backup File</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Choose a password to secure all patient and ward records in this backup file. You will need this password to restore your records.
            </p>

            <div className="space-y-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Backup Password:
                </label>
                <input
                  type="password"
                  value={backupPassword}
                  onChange={(e) => setBackupPassword(e.target.value)}
                  placeholder="Enter backup password..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 min-h-[40px]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Confirm Password:
                </label>
                <input
                  type="password"
                  value={backupPasswordConfirm}
                  onChange={(e) => setBackupPasswordConfirm(e.target.value)}
                  placeholder="Repeat password..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 min-h-[40px]"
                />
              </div>

              {exportError && (
                <div className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-200">
                  {exportError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold min-h-[38px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteEncryptedExport}
                className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold min-h-[38px] flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Backup File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Decrypt Backup Password Prompt (Restore) */}
      {pendingImportContent && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 card-depth">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileLock2 className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-sm text-slate-900">Protected Backup File</h3>
              </div>
              <button
                type="button"
                onClick={() => setPendingImportContent(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This backup file is password-protected. Enter the password chosen when the file was created to restore your patient records.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Enter Backup Password:
              </label>
              <input
                type="password"
                value={importPassword}
                onChange={(e) => setImportPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 min-h-[40px]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleDecryptAndRestore();
                }}
              />
              {restoreError && (
                <div className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-200 mt-2">
                  {restoreError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPendingImportContent(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold min-h-[38px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDecryptAndRestore}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold min-h-[38px] flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Decrypt &amp; Restore</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
