import React, { useState, useRef, useEffect } from 'react';
import { Printer, BookOpen, ChevronDown, Check, UserPlus, ShieldCheck, Settings, Bell, Lock, Activity } from 'lucide-react';
import { WardPatient } from '../data/wardPatients';
import { ClinicalSafetyAuditResult } from '../utils/clinicalSafetyAuditor';
import { ClinicalSafetyBadge } from './ClinicalSafetyBadge';

interface ClinicalHeaderProps {
  onPrint: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenReference: () => void;
  onOpenDisclaimer?: () => void;
  onOpenSettings?: () => void;
  facilityName?: string;
  patients: WardPatient[];
  activePatientId: string;
  onSelectPatient: (patientId: string) => void;
  onAdmitNewChild: () => void;
  dueReminderCount?: number;
  activeReminderCount?: number;
  onOpenReminders?: () => void;
  pinLockEnabled?: boolean;
  onLockScreen?: () => void;
  auditResult?: ClinicalSafetyAuditResult;
  onOpenSafetyInspector?: () => void;
}

export const ClinicalHeader: React.FC<ClinicalHeaderProps> = ({
  onPrint,
  activeTab,
  onTabChange,
  onOpenReference,
  onOpenDisclaimer,
  onOpenSettings,
  facilityName,
  patients,
  activePatientId,
  onSelectPatient,
  onAdmitNewChild,
  dueReminderCount = 0,
  activeReminderCount = 0,
  onOpenReminders,
  pinLockEnabled = false,
  onLockScreen,
  auditResult,
  onOpenSafetyInspector,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activePatient = patients.find((p) => p.id === activePatientId) || patients[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const badgeCount = dueReminderCount > 0 ? dueReminderCount : activeReminderCount;
  const isDueBadge = dueReminderCount > 0;

  return (
    <header className="no-print bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-[0_1px_8px_-2px_rgba(15,23,42,0.06)] sticky top-0 z-40 text-slate-900 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2 px-2.5 sm:px-6 py-2">
        {/* Left: Brand Wordmark (Compact on mobile) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onTabChange('today')}
            className="flex items-center gap-1.5 sm:gap-2 group text-left py-1 transition-all rounded-lg"
            title="PediCal Dashboard"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white font-black text-sm flex items-center justify-center shadow-xs shadow-blue-700/30 group-hover:from-blue-700 group-hover:to-blue-900 transition-all shrink-0">
              P
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 leading-none">
                PediCal
              </span>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase mt-0.5 hidden md:inline">
                Clinical Decision Support
              </span>
            </div>
          </button>
        </div>

        {/* Center: Active Cot & Patient Switcher (Responsive width so it never crowds right icons) */}
        <div className="flex items-center justify-center flex-1 max-w-[110px] xs:max-w-[150px] sm:max-w-xs md:max-w-sm px-1 min-w-0">
          <div className="relative w-full" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl stepper-tactile text-slate-800 transition-all min-h-[36px] sm:min-h-[38px] group"
              title="Switch patient bed"
              aria-label="Active patient selector"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ring-2 ring-emerald-100 shadow-2xs" />
                <div className="truncate text-left">
                  <div className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {activePatient ? (
                      <>
                        <span className="text-blue-800 font-bold">{activePatient.cotNumber}</span>
                        <span className="text-slate-600 font-medium ml-1 truncate hidden xs:inline">
                          {activePatient.name.split(' ')[0]}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">No active bed</span>
                    )}
                  </div>
                  {activePatient && (
                    <div className="text-[10px] text-slate-500 font-mono hidden sm:block truncate">
                      {activePatient.mrn} &middot; {activePatient.input.weight_kg} kg
                    </div>
                  )}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform shrink-0" />
            </button>

            {/* Quick Switch Dropdown */}
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 card-depth">
                <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Ward Beds ({patients.filter((p) => !p.isDischarged).length})
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Select to view</span>
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100/80 p-1">
                  {patients.map((p) => {
                    const isSelected = p.id === activePatientId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onSelectPatient(p.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-blue-50/80 text-blue-900 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="flex items-center gap-1.5 text-xs text-slate-900">
                            <span className="text-blue-700 font-bold">{p.cotNumber}:</span>
                            <span className="truncate">{p.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                            {p.input.weight_kg} kg &middot; {p.input.therapeutic_phase.split(' ')[0]}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-700 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onAdmitNewChild();
                    }}
                    className="w-full py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors text-xs shadow-2xs min-h-[38px]"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Admit New Inpatient</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Security, Reminders, Safety Badge, Settings (Guaranteed visible on mobile) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* 1-Tap PIN Lock (when enabled) */}
          {pinLockEnabled && onLockScreen && (
            <button
              type="button"
              onClick={onLockScreen}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl border border-amber-300/80 bg-gradient-to-b from-amber-50 to-amber-100/70 text-amber-800 hover:from-amber-100 hover:to-amber-200/70 transition-all shrink-0 shadow-xs"
              title="Lock screen"
              aria-label="Lock screen"
            >
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700" />
            </button>
          )}

          {/* Pediatric Reminders Bell */}
          {onOpenReminders && (
            <button
              type="button"
              onClick={onOpenReminders}
              className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl stepper-tactile text-slate-700 hover:text-slate-900 transition-all shrink-0"
              title="Reminders & Feeding Alerts"
              aria-label="Reminders"
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
              {badgeCount > 0 && (
                <span
                  className={`absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 rounded-full text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-white shadow-xs ${
                    isDueBadge ? 'bg-rose-600 animate-pulse' : 'bg-blue-700'
                  }`}
                >
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
            </button>
          )}

          {/* Clinical Protocol Safety Checks Badge */}
          {auditResult && onOpenSafetyInspector && (
            <ClinicalSafetyBadge
              auditResult={auditResult}
              onClick={onOpenSafetyInspector}
              variant="compact"
            />
          )}

          {/* Desktop-only action items */}
          <button
            type="button"
            onClick={onOpenReference}
            className="hidden md:flex px-3 py-2 rounded-xl stepper-tactile text-slate-700 hover:text-slate-950 items-center gap-1.5 text-xs font-bold transition-all min-h-[36px]"
            title="Clinical Protocols"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-600" />
            <span>Protocols</span>
          </button>

          {onOpenDisclaimer && (
            <button
              type="button"
              onClick={onOpenDisclaimer}
              className="hidden lg:flex px-3 py-2 rounded-xl stepper-tactile text-slate-700 hover:text-slate-950 items-center gap-1.5 text-xs font-bold transition-all min-h-[36px]"
              title="Clinical Disclaimer & Terms"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Notice</span>
            </button>
          )}

          <button
            type="button"
            onClick={onPrint}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white btn-tactile-primary rounded-xl shrink-0 min-h-[36px]"
            title="Print Patient Worksheet"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Print</span>
          </button>

          {/* Settings Button: ALWAYS visible on mobile & desktop */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl stepper-tactile text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-all shrink-0"
              title="Settings & Policies"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 text-slate-700" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
