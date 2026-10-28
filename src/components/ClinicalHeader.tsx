import React, { useState, useRef, useEffect } from 'react';
import { Printer, BookOpen, ChevronDown, Check, UserPlus, ShieldCheck, Settings, Bell, Lock, Activity } from 'lucide-react';
import { WardPatient } from '../data/wardPatients';

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
    <header className="no-print bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40 text-slate-900 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 px-3 sm:px-6 py-2">
        {/* Left: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onTabChange('today')}
            className="flex items-center gap-2 group text-left py-1 transition-all rounded-lg"
            title="PediCal Workspace"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-700 text-white font-black text-sm flex items-center justify-center shadow-xs group-hover:bg-blue-800 transition-colors">
              P
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 leading-none">
                PediCal
              </span>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase mt-0.5 hidden xs:inline">
                Pediatric Clinical Engine
              </span>
            </div>
          </button>
        </div>

        {/* Center: Active Cot & Patient Switcher */}
        <div className="flex items-center justify-center flex-1 max-w-[160px] xs:max-w-[200px] sm:max-w-xs md:max-w-sm px-1">
          <div className="relative w-full" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-all min-h-[36px] shadow-2xs group"
              title="Switch patient bed"
              aria-label="Active patient selector"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ring-2 ring-emerald-100" />
                <div className="truncate text-left">
                  <div className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {activePatient ? (
                      <>
                        <span>{activePatient.cotNumber}</span>
                        <span className="text-slate-500 font-normal ml-1.5 truncate">
                          {activePatient.name.split(' ')[0]}
                        </span>
                      </>
                    ) : (
                      'No Active Bed'
                    )}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0 transition-colors" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-1.5 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-xs">
                <div className="px-3.5 py-2 border-b border-slate-100 text-xs font-bold text-slate-700 flex justify-between items-center bg-slate-50/50">
                  <span>Admitted Inpatients ({patients.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onTabChange('ward');
                    }}
                    className="text-blue-700 hover:text-blue-800 font-semibold text-xs transition-colors"
                  >
                    View Roster
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-100">
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
                        className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors min-h-[44px] ${
                          isSelected ? 'bg-blue-50/80 font-bold text-blue-900' : 'text-slate-700'
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

        {/* Right: Security, Reminders, Protocols, Settings */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 1-Tap PIN Lock */}
          {pinLockEnabled && onLockScreen && (
            <button
              type="button"
              onClick={onLockScreen}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors shrink-0 shadow-2xs"
              title="Lock screen"
              aria-label="Lock screen"
            >
              <Lock className="w-4 h-4 text-amber-700" />
            </button>
          )}

          {/* Pediatric Reminders Bell */}
          {onOpenReminders && (
            <button
              type="button"
              onClick={onOpenReminders}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors shrink-0 shadow-2xs"
              title="Reminders & Alarms"
              aria-label="Reminders"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              {badgeCount > 0 && (
                <span
                  className={`absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-white shadow-2xs ${
                    isDueBadge ? 'bg-rose-600 animate-pulse' : 'bg-blue-700'
                  }`}
                >
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenReference}
            className="hidden md:flex px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 items-center gap-1.5 text-xs font-semibold transition-colors min-h-[36px] shadow-2xs"
            title="Clinical Protocols"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-600" />
            <span>Protocols</span>
          </button>

          {onOpenDisclaimer && (
            <button
              type="button"
              onClick={onOpenDisclaimer}
              className="hidden lg:flex px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 items-center gap-1.5 text-xs font-semibold transition-colors min-h-[36px] shadow-2xs"
              title="Clinical Disclaimer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Notice</span>
            </button>
          )}

          <button
            type="button"
            onClick={onPrint}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 transition-colors rounded-xl shrink-0 min-h-[36px] shadow-2xs"
            title="Print Patient Worksheet"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Print</span>
          </button>

          {/* Settings */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors shrink-0 shadow-2xs"
              title="Settings"
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
