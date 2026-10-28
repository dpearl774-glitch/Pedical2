/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  CalculationInput,
  evaluatePatient,
  TherapeuticPhase,
} from './utils/clinicalCalculations';
import { INITIAL_WARD_PATIENTS, WardPatient, FeedRecord } from './data/wardPatients';
import { ClinicalHeader } from './components/ClinicalHeader';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ParameterControls } from './components/ParameterControls';
import { FormattedClinicalReport } from './components/FormattedClinicalReport';
import { WHOGrowthChart } from './components/WHOGrowthChart';
import { BedsideFeedingSchedule } from './components/BedsideFeedingSchedule';
import { ProtocolReferenceSection } from './components/ProtocolReferenceSection';
import { PrintableBedsideCard } from './components/PrintableBedsideCard';
import { WardOverview } from './components/WardOverview';
import { ClinicalDisclaimerModal } from './components/ClinicalDisclaimerModal';
import { OutpatientManagementSection } from './components/OutpatientManagementSection';
import { QuickScreeningSection } from './components/QuickScreeningSection';
import { ReSoMalManagementSection } from './components/ReSoMalManagementSection';
import { SettingsModal } from './components/SettingsModal';
import { PinLockScreen } from './components/PinLockScreen';
import { ReminderNotificationBanner } from './components/ReminderNotificationBanner';
import { RemindersModal } from './components/RemindersModal';
import { useReminders } from './hooks/useReminders';
import { AppSettings, loadAppSettings, saveAppSettings } from './utils/appSettings';
import { TodayDashboard } from './components/TodayDashboard';
import {
  savePatientsToIDB,
  saveFeedingLogToIDB,
  migrateLocalStorageToIndexedDB,
} from './utils/indexedDBStorage';
import { Printer, ChevronRight, User, ShieldCheck, Lock, HeartHandshake, Activity, Droplets, Bed, Plus } from 'lucide-react';

const STORAGE_KEY = 'pedical_ward_inpatients_v3';
const DISCLAIMER_STORAGE_KEY = 'pedical_disclaimer_accepted_v1';
const PIN_LOCK_STORAGE_KEY = 'pedical_is_locked_v1';

export default function App() {
  // App Settings & Customization
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings());
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Security PIN Lock State (Persistent across reload while locked)
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const currentSettings = loadAppSettings();
      if (!currentSettings.pinLockEnabled) return false;
      return localStorage.getItem(PIN_LOCK_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const lastActivityRef = React.useRef<number>(Date.now());

  // Atomic lock state updater: updates in-memory state and persists key
  const setLockState = useCallback((locked: boolean) => {
    setIsLocked(locked);
    try {
      if (locked) {
        localStorage.setItem(PIN_LOCK_STORAGE_KEY, 'true');
      } else {
        localStorage.removeItem(PIN_LOCK_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  // Pediatric Reminder Engine Hook
  const {
    reminders,
    dueCount,
    activeBannerReminder,
    addReminder,
    markComplete,
    snoozeReminder,
    dismissBanner,
    deleteReminder,
    clearCompleted,
  } = useReminders();
  const [showRemindersModal, setShowRemindersModal] = useState<boolean>(false);

  // Call navigator.storage.persist() and initialize IndexedDB engine on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {
        // ignore
      });
    }

    // Auto-migrate any existing LocalStorage records into IndexedDB
    migrateLocalStorageToIndexedDB()
      .then(() => savePatientsToIDB(patients))
      .catch((err) => {
        console.warn('IndexedDB initial sync notice:', err);
      });
  }, []);

  // Inactivity & Visibility Auto-Lock Engine
  useEffect(() => {
    if (!settings.pinLockEnabled) return;

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (settings.autoLockMinutes === 0) {
          setLockState(true);
        }
      } else {
        lastActivityRef.current = Date.now();
      }
    };

    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });
    window.addEventListener('scroll', handleUserActivity, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(() => {
      if (settings.autoLockMinutes > 0) {
        const elapsedMinutes = (Date.now() - lastActivityRef.current) / 60000;
        if (elapsedMinutes >= settings.autoLockMinutes) {
          setLockState(true);
        }
      }
    }, 10000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [settings.pinLockEnabled, settings.autoLockMinutes, setLockState]);

  // Emergency Security Wipe Handler: Permanently purges all localStorage
  const handleEmergencyWipe = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  // Disclaimer state
  const [showDisclaimerModal, setShowDisclaimerModal] = useState<boolean>(() => {
    try {
      return !localStorage.getItem(DISCLAIMER_STORAGE_KEY);
    } catch {
      return false;
    }
  });
  const [isVoluntaryDisclaimerReview, setIsVoluntaryDisclaimerReview] = useState<boolean>(false);

  // Ward Patients Roster State (Safely supports 0 patients)
  const [patients, setPatients] = useState<WardPatient[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_WARD_PATIENTS;
  });

  const [activePatientId, setActivePatientId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].id;
        }
        if (Array.isArray(parsed) && parsed.length === 0) {
          return '';
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_WARD_PATIENTS[0]?.id || '';
  });

  const [activeTab, setActiveTab] = useState<string>('today');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printBatchMode, setPrintBatchMode] = useState<boolean>(false);

  // Active patient object safely derived without crashing on empty roster
  const activePatient = useMemo(() => {
    if (!patients || patients.length === 0) return undefined;
    const activeList = patients.filter((p) => !p.isDischarged);
    if (activeList.length > 0) {
      return activeList.find((p) => p.id === activePatientId) || activeList[0];
    }
    return patients.find((p) => p.id === activePatientId) || patients[0];
  }, [patients, activePatientId]);

  // Synchronize activePatientId if stale or missing
  useEffect(() => {
    if (patients.length === 0) {
      if (activePatientId !== '') {
        setActivePatientId('');
      }
    } else {
      const exists = patients.some((p) => p.id === activePatientId);
      if (!exists) {
        setActivePatientId(patients[0].id);
      }
    }
  }, [patients, activePatientId]);

  // Current calculation input is synced with active patient (undefined when ward has zero patients)
  const input = activePatient?.input;

  // Save patients whenever they change (synchronous LocalStorage + asynchronous IndexedDB engine)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    } catch {
      // Ignore quota errors
    }
    // Asynchronously persist to IndexedDB
    savePatientsToIDB(patients).catch(() => {});
  }, [patients]);

  const handleAcceptDisclaimer = () => {
    try {
      localStorage.setItem(DISCLAIMER_STORAGE_KEY, 'true');
    } catch {
      // Ignore
    }
    setShowDisclaimerModal(false);
    setIsVoluntaryDisclaimerReview(false);
  };

  const handleOpenDisclaimer = () => {
    setIsVoluntaryDisclaimerReview(true);
    setShowDisclaimerModal(true);
  };

  const handleSaveSettings = (updated: AppSettings) => {
    setSettings(updated);
    saveAppSettings(updated);
    if (!updated.pinLockEnabled) {
      setLockState(false);
    }
  };

  // Instant deterministic calculation for active patient (undefined when ward has zero patients)
  const evaluation = useMemo(() => {
    if (!input) return undefined;
    return evaluatePatient(input);
  }, [input]);

  // Update input for active patient
  const handleUpdateInput = (newInput: CalculationInput) => {
    if (!activePatientId) return;
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === activePatientId) {
          return {
            ...p,
            name: newInput.patient_name || p.name,
            cotNumber: newInput.cot_number || p.cotNumber,
            mrn: newInput.mrn || p.mrn,
            input: newInput,
          };
        }
        return p;
      })
    );
  };

  const handleResetActivePatient = () => {
    if (!activePatient) return;
    const defaultForPatient: CalculationInput = {
      patient_id: activePatient.id,
      cot_number: activePatient.cotNumber,
      patient_name: activePatient.name,
      mrn: activePatient.mrn,
      age_months: activePatient.input?.age_months || 12,
      calculation_mode: 'Full WHO Assessment + Calculator',
      weight_kg: 5.0,
      height_cm: 65.0,
      sex: activePatient.input?.sex || 'Boy',
      therapeutic_phase: 'F-75 Stabilization',
      edema_severity: 'None',
      feeding_interval_hours: 3,
      local_milk_source: 'Dried Skimmed Milk Powder',
    };
    handleUpdateInput(defaultForPatient);
  };

  const handleSwitchTherapeuticPhase = (phase: TherapeuticPhase) => {
    if (!input) return;
    handleUpdateInput({
      ...input,
      therapeutic_phase: phase,
    });
  };

  const handleChartSelectPoint = (lengthCm: number, weightKg: number) => {
    if (!input) return;
    handleUpdateInput({
      ...input,
      weight_kg: weightKg,
      height_cm: lengthCm,
    });
  };

  const handleChartUpdateSex = (sex: 'Boy' | 'Girl') => {
    if (!input) return;
    handleUpdateInput({
      ...input,
      sex,
    });
  };

  // Add new inpatient to ward
  const handleAddPatient = (newPatient: WardPatient) => {
    setPatients((prev) => [newPatient, ...prev]);
    setActivePatientId(newPatient.id);
    setActiveTab('calculator');
  };

  // Delete patient from ward safely
  const handleDeletePatient = (patientId: string) => {
    setPatients((prev) => {
      const filtered = prev.filter((p) => p.id !== patientId);
      if (filtered.length === 0) {
        setActivePatientId('');
      } else if (patientId === activePatientId) {
        setActivePatientId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Print individual patient from ward
  const handlePrintIndividualPatient = (patient: WardPatient) => {
    setActivePatientId(patient.id);
    setPrintBatchMode(false);
    setShowPrintModal(true);
  };

  // Batch print all ward patients
  const handleBatchPrint = () => {
    if (patients.length === 0) return;
    setPrintBatchMode(true);
    setShowPrintModal(true);
  };

  // Discharge inpatient with WHO outcome and step-down tracking
  const handleDischargePatient = (
    patientId: string,
    dischargeData: Partial<WardPatient>,
    navigateToOtp?: boolean
  ) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            isDischarged: true,
            dischargeDate: dischargeData.dischargeDate || new Date().toISOString().split('T')[0],
            dischargeOutcome: dischargeData.dischargeOutcome || 'Discharged to Outpatient OTP',
            dischargeWeightKg: dischargeData.dischargeWeightKg ?? p.input.weight_kg,
            dischargeMuacMm: dischargeData.dischargeMuacMm ?? 120,
            dischargeEdema: dischargeData.dischargeEdema || 'None',
            dischargeNotes: dischargeData.dischargeNotes || '',
          };
        }
        return p;
      })
    );

    if (navigateToOtp) {
      setActivePatientId(patientId);
      setActiveTab('outpatient');
    }
  };

  // Re-admit previously discharged patient back into active bed roster
  const handleReadmitPatient = (patientId: string) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            isDischarged: false,
          };
        }
        return p;
      })
    );
    setActivePatientId(patientId);
  };

  // Directly navigate to Outpatient OTP tab with patient pre-selected
  const handleNavigateToOtp = (patient: WardPatient) => {
    setActivePatientId(patient.id);
    setActiveTab('outpatient');
  };

  // Synchronize and persist feeding records for individual active patient
  const handleUpdatePatientFeedingRecords = useCallback(
    (
      patientId: string,
      records: FeedRecord[],
      shiftStartTime?: string,
      dietitianBatchPrepTime?: string
    ) => {
      setPatients((prev) =>
        prev.map((p) => {
          if (p.id === patientId) {
            return {
              ...p,
              feedingRecords: records,
              shiftStartTime: shiftStartTime ?? p.shiftStartTime,
              dietitianBatchPrepTime: dietitianBatchPrepTime ?? p.dietitianBatchPrepTime,
            };
          }
          return p;
        })
      );
      // Persist feeding log to IndexedDB
      saveFeedingLogToIDB(patientId, records).catch(() => {});
    },
    []
  );

  // Bridge from Quick Screener to Inpatient Admission
  const handleAdmitFromScreener = (childData: Partial<CalculationInput>) => {
    const nextCotNum = `Cot ${String(patients.length + 1).padStart(2, '0')}`;
    const nextMrn = childData.mrn || `Ref-${100 + patients.length + 1}`;
    const baseInput: Partial<CalculationInput> = activePatient ? activePatient.input : {};
    const patientName = childData.patient_name || `Screened Child (${nextCotNum})`;
    const newPatient: WardPatient = {
      id: `cot-${Date.now()}`,
      name: patientName,
      cotNumber: nextCotNum,
      mrn: nextMrn,
      admissionDate: new Date().toISOString().split('T')[0],
      input: {
        calculation_mode: 'Full WHO Assessment + Calculator',
        therapeutic_phase: 'F-75 Stabilization',
        feeding_interval_hours: 3,
        local_milk_source: 'Dried Skimmed Milk Powder',
        ...baseInput,
        weight_kg: childData.weight_kg ?? 7.0,
        height_cm: childData.height_cm ?? 70.0,
        age_months: childData.age_months ?? 12,
        sex: childData.sex ?? 'Boy',
        muac_mm: childData.muac_mm ?? 110,
        head_circumference_cm: childData.head_circumference_cm ?? 46.0,
        edema_severity: childData.edema_severity ?? 'None',
        cot_number: nextCotNum,
        mrn: nextMrn,
        patient_name: patientName,
      },
    };
    setPatients((prev) => [...prev, newPatient]);
    setActivePatientId(newPatient.id);
    setActiveTab('calculator');
  };

  const handleSendToOutpatientFromScreener = () => {
    setActiveTab('outpatient');
  };

  const renderEmptyWardPrompt = () => (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 my-8 shadow-xs">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
        <Bed className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-slate-900">No active inpatient</h3>
        <p className="text-xs text-slate-500 leading-relaxed font-sans">
          The ward roster currently has zero admitted children. Admit a child or use the quick screener to begin therapeutic care planning.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
        <button
          type="button"
          onClick={() => setActiveTab('ward')}
          className="w-full sm:w-auto px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors min-h-[40px]"
        >
          <Plus className="w-4 h-4" />
          <span>Admit child to ward</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('screener')}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors min-h-[40px]"
        >
          <span>Open screener</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 text-slate-900 flex flex-col font-sans antialiased pb-20 lg:pb-8">
      {/* Top Header with Interactive Patient Switcher & Notice */}
      <ClinicalHeader
        onPrint={() => {
          setPrintBatchMode(false);
          setShowPrintModal(true);
        }}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenReference={() => setActiveTab('reference')}
        onOpenDisclaimer={handleOpenDisclaimer}
        onOpenSettings={() => setShowSettingsModal(true)}
        facilityName={settings.facilityName}
        patients={patients}
        activePatientId={activePatientId}
        onSelectPatient={(id) => setActivePatientId(id)}
        onAdmitNewChild={() => setActiveTab('ward')}
        dueReminderCount={dueCount}
        activeReminderCount={reminders.filter((r) => !r.completed).length}
        onOpenReminders={() => setShowRemindersModal(true)}
        pinLockEnabled={settings.pinLockEnabled}
        onLockScreen={() => setLockState(true)}
      />

      {/* Top Slide-Down Alert Banner for Due/Overdue SAM/MAM Reminders */}
      <ReminderNotificationBanner
        reminder={activeBannerReminder}
        onMarkDone={markComplete}
        onSnooze={snoozeReminder}
        onDismiss={dismissBanner}
        onOpenCenter={() => setShowRemindersModal(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 overflow-x-hidden">
        {/* Desktop View Navigation Pill Tabs (Clean segmented control with signature PediCal blue) */}
        <div className="hidden lg:flex items-center justify-between bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1 text-xs">
            {[
              { id: 'today', label: 'Today' },
              { id: 'ward', label: `Ward (${patients.filter((p) => !p.isDischarged).length})` },
              { id: 'calculator', label: 'Inpatient Calculator' },
              { id: 'schedule', label: 'Bedside Feed Log' },
              { id: 'chart', label: 'Growth Chart' },
              { id: 'screener', label: 'Field Screener' },
              { id: 'outpatient', label: 'Outpatient OTP' },
              { id: 'resomal', label: 'ReSoMal' },
              { id: 'reference', label: 'Protocols' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-blue-700 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!activePatient}
              onClick={() => {
                if (!activePatient) return;
                setPrintBatchMode(false);
                setShowPrintModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:pointer-events-none shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print {activePatient ? activePatient.cotNumber : 'Bed'}</span>
            </button>
          </div>
        </div>

        {/* TAB: TODAY DASHBOARD */}
        {activeTab === 'today' && (
          <TodayDashboard
            patients={patients}
            reminders={reminders}
            facilityName={settings.facilityName}
            clinicianName={settings.clinicianName}
            onNavigate={(tab: string, patientId?: string) => {
              if (patientId) {
                setActivePatientId(patientId);
              }
              setActiveTab(tab);
            }}
            onAdmitNewChild={() => {
              setActiveTab('ward');
            }}
            onOpenReminders={() => setShowRemindersModal(true)}
          />
        )}

        {/* TAB: QUICK SCREENER */}
        {activeTab === 'screener' && (
          <QuickScreeningSection
            facilityName={settings.facilityName}
            clinicianName={settings.clinicianName}
            onAdmitToInpatient={handleAdmitFromScreener}
            onSendToOutpatient={handleSendToOutpatientFromScreener}
          />
        )}

        {/* TAB 0: WARD ROSTER */}
        {activeTab === 'ward' && (
          <WardOverview
            patients={patients}
            activePatientId={activePatientId}
            onSelectPatient={(id) => {
              setActivePatientId(id);
              setActiveTab('calculator');
            }}
            onAddPatient={handleAddPatient}
            onDeletePatient={handleDeletePatient}
            onPrintPatient={handlePrintIndividualPatient}
            onBatchPrint={handleBatchPrint}
            onDischargePatient={handleDischargePatient}
            onReadmitPatient={handleReadmitPatient}
            onNavigateToOtp={handleNavigateToOtp}
          />
        )}

        {/* TAB 1: CALCULATOR */}
        {activeTab === 'calculator' && (!activePatient || !input || !evaluation ? renderEmptyWardPrompt() : (
          <div className="space-y-4">
            {/* Sticky Key Output Summary Bar */}
            <div className="sticky top-[52px] sm:top-[58px] z-20 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-2.5 sm:p-3 shadow-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3 sm:gap-4">
                <div>
                  <div className="text-[10px] font-medium text-slate-500">
                    Per feed
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-xl font-bold text-slate-900">
                      {evaluation.feedingSummary.targetVolumePerFeed}
                    </span>
                    <span className="text-xs font-medium text-blue-700">mL</span>
                    <span className="text-[11px] text-slate-400 ml-1">
                      q{input.feeding_interval_hours}h
                    </span>
                  </div>
                </div>

                <div className="h-6 w-px bg-slate-200" />

                <div>
                  <div className="text-[10px] font-medium text-slate-500">
                    24h total
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-xl font-bold text-slate-900">
                      {evaluation.feedingSummary.dailyVolume}
                    </span>
                    <span className="text-xs text-slate-500">mL</span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline ml-1">
                      ({evaluation.feedingSummary.mlPerKgPerDay} mL/kg)
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Indicator Chip */}
              <div className="flex items-center gap-1.5">
                {evaluation.safety.rule2FluidOverloadHalted ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                    overload risk
                  </span>
                ) : evaluation.growthAssessment?.isSam || input.edema_severity !== 'None' ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                    SAM
                  </span>
                ) : evaluation.growthAssessment?.classificationStatus?.includes('Moderate') ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    MAM
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {input.therapeutic_phase.split(' ')[0]}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('feeding-target-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs font-medium text-blue-700 hover:underline px-1"
                >
                  Details &darr;
                </button>
              </div>
            </div>

            {/* Active Bed Bar */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="font-semibold text-slate-800">
                  {activePatient.cotNumber}: {activePatient.name}
                </span>
                <span className="text-slate-400 hidden sm:inline">
                  &middot; {activePatient.mrn}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('ward')}
                className="text-blue-700 hover:underline font-medium text-xs shrink-0"
              >
                Switch
              </button>
            </div>

            {/* ReSoMal Quick Notice */}
            <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span className="text-teal-950">
                  <strong>Watery diarrhea:</strong> Standard ORS contraindicated. Administer <strong>ReSoMal</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('resomal')}
                className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-lg shrink-0 text-xs transition-colors self-start sm:self-auto min-h-[30px]"
              >
                Open ReSoMal &rarr;
              </button>
            </div>

            <ParameterControls
              input={input}
              onChange={handleUpdateInput}
              onReset={handleResetActivePatient}
              showQuickPresets={settings.showQuickPresets}
            />

            <FormattedClinicalReport
              evaluation={evaluation}
              onSwitchTherapeuticPhase={handleSwitchTherapeuticPhase}
              onNavigateToChart={() => setActiveTab('chart')}
            />
          </div>
        ))}

        {/* TAB: RESOMAL REHYDRATION (Ghana Health Service / UNICEF IMAM Protocol) */}
        {activeTab === 'resomal' && (!activePatient || !input ? renderEmptyWardPrompt() : (
          <div className="space-y-6">
            <ReSoMalManagementSection
              initialWeightKg={input.weight_kg}
              initialEdemaSeverity={input.edema_severity}
              initialAgeMonths={input.age_months ?? 18}
              cotNumber={activePatient.cotNumber}
              patientName={activePatient.name}
              onJumpToF75={() => setActiveTab('calculator')}
            />
          </div>
        ))}

        {/* TAB: OUTPATIENT MANAGEMENT (OTP / CMAM / RUTF) */}
        {activeTab === 'outpatient' && (
          <OutpatientManagementSection
            currentWardPatient={activePatient}
            onNavigateToInpatientWard={() => setActiveTab('calculator')}
            onNavigateToGrowthChart={() => setActiveTab('chart')}
          />
        )}

        {/* TAB 2: INTERACTIVE WHO GROWTH CHART (Plottable Graphs) */}
        {activeTab === 'chart' && (!activePatient || !input ? renderEmptyWardPrompt() : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  WHO Growth Chart &middot; {activePatient.cotNumber}: {activePatient.name}
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  Official WHO Child Growth Standards &middot; Weight-for-Length, Weight-for-Age, Length-for-Age
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('calculator')}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Edit Anthropometric Parameters</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <WHOGrowthChart
              currentWeightKg={input.weight_kg}
              currentHeightCm={input.height_cm ?? 65.0}
              currentAgeMonths={input.age_months ?? 12}
              sex={input.sex ?? 'Boy'}
              patientName={activePatient.name}
              cotNumber={activePatient.cotNumber}
              onSelectPoint={handleChartSelectPoint}
              onUpdateSex={handleChartUpdateSex}
            />
          </div>
        ))}

        {/* TAB 3: FEEDING TARGETS */}
        {activeTab === 'feeding' && (!activePatient || !input || !evaluation ? renderEmptyWardPrompt() : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900">
                  Feeding Targets &middot; {activePatient.cotNumber}: {activePatient.name} ({input.therapeutic_phase})
                </h3>
                <span className="text-xs text-slate-500 font-semibold">
                  {input.weight_kg} kg &middot; {input.edema_severity} Edema
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                  <div className="text-xs font-bold text-blue-900 uppercase">Target Per Feed</div>
                  <div className="text-3xl font-bold text-slate-900 mt-1">
                    {evaluation.feedingSummary.targetVolumePerFeed}
                    <span className="text-sm font-normal text-blue-700 ml-1">mL</span>
                  </div>
                  <div className="text-xs text-blue-800 mt-1">
                    q{evaluation.feedingSummary.feedingIntervalHours}h ({evaluation.feedingSummary.feedsPerDay} feeds/day)
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-700 uppercase">Total 24h Fluid</div>
                  <div className="text-3xl font-bold text-slate-900 mt-1">
                    {evaluation.feedingSummary.dailyVolume}
                    <span className="text-sm font-normal text-slate-500 ml-1">mL/day</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {evaluation.feedingSummary.mlPerKgPerDay} mL/kg/day
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                  <div className="text-xs font-bold text-amber-900 uppercase">Safe Minimum (80%)</div>
                  <div className="text-3xl font-bold text-amber-950 mt-1">
                    {evaluation.feedingSummary.safeMinimumVolume}
                    <span className="text-sm font-normal text-amber-700 ml-1">mL/day</span>
                  </div>
                  <div className="text-xs text-amber-800 mt-1">
                    {evaluation.feedingSummary.safeMinMlPerKg} mL/kg/day (NG tube watch threshold)
                  </div>
                </div>
              </div>
            </div>

            <BedsideFeedingSchedule
              patientId={activePatient.id}
              feedingSummary={evaluation.feedingSummary}
              patientWeight={input.weight_kg}
              patientName={activePatient.name}
              cotNumber={activePatient.cotNumber}
              therapeuticPhase={input.therapeutic_phase}
              initialRecords={activePatient.feedingRecords}
              initialShiftStartTime={activePatient.shiftStartTime}
              initialDietitianBatchPrepTime={activePatient.dietitianBatchPrepTime}
              onUpdateFeedingRecords={handleUpdatePatientFeedingRecords}
            />
          </div>
        ))}

        {/* TAB 4: MANUAL BATCH RECIPE */}
        {activeTab === 'recipe' && (!activePatient || !input || !evaluation ? renderEmptyWardPrompt() : (
          <div className="space-y-6">
            {evaluation.safety.rule2FluidOverloadHalted ? (
              <div className="bg-rose-50 border-2 border-rose-600 rounded-xl p-6 text-rose-950 space-y-3">
                <div className="text-base font-bold">
                  {evaluation.safety.rule2ErrorText}
                </div>
                <p className="text-xs text-rose-800">
                  F-100 contains high protein and sodium relative to the cardiac reserve of an infant with severe edema. Return patient to F-75 stabilization immediately.
                </p>
                <button
                  type="button"
                  onClick={() => handleSwitchTherapeuticPhase('F-75 Stabilization')}
                  className="px-4 py-2 bg-rose-700 text-white font-bold text-xs rounded-lg hover:bg-rose-800 min-h-[44px]"
                >
                  Switch Patient to F-75 Stabilization
                </button>
              </div>
            ) : evaluation.recipe ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Manual 24-Hour Batch Recipe for {activePatient.cotNumber} ({evaluation.recipe.dailyVolume} mL total)
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Base Milk: {evaluation.recipe.milkBase.name} &middot; Scale Factor: {evaluation.recipe.scaleFactor}
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-blue-50 text-blue-800 font-bold">
                    {input.therapeutic_phase}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="text-slate-500 font-bold">1. Milk Base</div>
                      <div className="font-semibold text-slate-900">{evaluation.recipe.milkBase.name}</div>
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      {evaluation.recipe.milkBase.amount} {evaluation.recipe.milkBase.unit}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="text-slate-500 font-bold">2. Sugar</div>
                      <div className="font-semibold text-slate-900">Commercial White Sugar</div>
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      {evaluation.recipe.sugarGrams} g
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="text-slate-500 font-bold">3. Vegetable Oil</div>
                      <div className="font-semibold text-slate-900">Refined cooking oil</div>
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      {evaluation.recipe.vegetableOilGrams} g
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="text-slate-500 font-bold">4. Cereal Flour</div>
                      <div className="font-semibold text-slate-900">
                        {evaluation.recipe.cerealFlourGrams > 0 ? 'Milled rice / cereal' : 'None (0g for F-100)'}
                      </div>
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      {evaluation.recipe.cerealFlourGrams} g
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center sm:col-span-2">
                    <div>
                      <div className="text-slate-500 font-bold">5. CMV Solution (Combined Mineral Vitamin)</div>
                      <div className="font-semibold text-slate-900">Liquid mineral mix (20 mL per 1,000 mL milk formula)</div>
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      {evaluation.recipe.cmvLiquidMl} mL
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200 text-xs text-slate-800">
                  <div className="font-bold text-blue-950 uppercase tracking-wider mb-1">
                    Preparation Step:
                  </div>
                  <div>{evaluation.recipe.preparationStep}</div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab('schedule')}
                    className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 min-h-[44px]"
                  >
                    <span>Open Feed Log &amp; Batch Custody Tracker &rarr;</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ))}

        {/* TAB 5: BEDSIDE LOG */}
        {activeTab === 'schedule' && (!activePatient || !input || !evaluation ? renderEmptyWardPrompt() : (
          <div className="space-y-6">
            <BedsideFeedingSchedule
              patientId={activePatient.id}
              feedingSummary={evaluation.feedingSummary}
              patientWeight={input.weight_kg}
              patientName={activePatient.name}
              cotNumber={activePatient.cotNumber}
              therapeuticPhase={input.therapeutic_phase}
              initialRecords={activePatient.feedingRecords}
              initialShiftStartTime={activePatient.shiftStartTime}
              initialDietitianBatchPrepTime={activePatient.dietitianBatchPrepTime}
              onUpdateFeedingRecords={handleUpdatePatientFeedingRecords}
            />
          </div>
        ))}

        {/* TAB 6: PROTOCOLS & REFERENCES (Consolidated at one single place) */}
        {activeTab === 'reference' && (
          <div className="space-y-6">
            <ProtocolReferenceSection />
          </div>
        )}

        {/* Client-Side Privacy & Legal Notice Footer */}
        <footer className="pt-6 border-t border-stone-200/80 text-stone-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 font-sans">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              <strong>Zero Cloud Storage:</strong> All calculations run 100% locally in your browser. No patient data is transmitted or stored externally.
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenDisclaimer}
            className="text-stone-800 hover:text-stone-950 font-medium underline flex items-center gap-1 shrink-0 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-stone-600" />
            <span>Clinical Reference &amp; Privacy Notice</span>
          </button>
        </footer>
      </main>

      {/* Mobile Ergonomic Bottom Tab Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        patientCount={patients.filter((p) => !p.isDischarged).length}
      />

      {/* Bedside Order Print Modal (Supports Single Patient & Batch Ward) */}
      {showPrintModal && evaluation && (
        <PrintableBedsideCard
          evaluation={evaluation}
          allPatients={patients}
          isBatchMode={printBatchMode}
          facilityName={settings.facilityName}
          wardSubtitle={settings.wardSubtitle}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* Settings & Customization Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        settings={settings}
        onSave={handleSaveSettings}
        onClose={() => setShowSettingsModal(false)}
        onResetWard={() => {
          setPatients(INITIAL_WARD_PATIENTS);
          setActivePatientId(INITIAL_WARD_PATIENTS[0]?.id || '');
        }}
        onOpenPrintModal={() => {
          setPrintBatchMode(false);
          setShowPrintModal(true);
        }}
        onOpenDisclaimer={handleOpenDisclaimer}
        patients={patients}
      />

      {/* Clinical Disclaimer & Terms Modal */}
      <ClinicalDisclaimerModal
        isOpen={showDisclaimerModal}
        onAccept={handleAcceptDisclaimer}
        onClose={() => setShowDisclaimerModal(false)}
        isVoluntaryReview={isVoluntaryDisclaimerReview}
      />

      {/* Pediatric Reminders Center Modal */}
      <RemindersModal
        isOpen={showRemindersModal}
        onClose={() => setShowRemindersModal(false)}
        reminders={reminders}
        onAddReminder={addReminder}
        onMarkComplete={markComplete}
        onSnooze={snoozeReminder}
        onDelete={deleteReminder}
        onClearCompleted={clearCompleted}
        patients={patients}
        activePatientId={activePatientId}
      />

      {/* Security PIN Lock Screen Overlay (Zero Unauthorized Access) */}
      {isLocked && settings.pinLockEnabled && (
        <PinLockScreen
          facilityName={settings.facilityName}
          clinicianRole={settings.clinicianRole}
          correctPin={settings.pinCode || '1234'}
          recoveryKey={settings.recoveryKey}
          onUnlock={() => setLockState(false)}
          onEmergencyWipe={handleEmergencyWipe}
        />
      )}
    </div>
  );
}
