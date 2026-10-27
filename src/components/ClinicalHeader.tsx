import React, { useState, useRef, useEffect } from 'react';
import { Printer, BookOpen, ChevronDown, Check, UserPlus, ShieldCheck, Settings, Bell, Lock } from 'lucide-react';
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
    <header className="no-print bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-slate-100">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 sm:gap-2 px-2 sm:px-6 py-1 sm:py-1.5">
        {/* Left: App title / logo */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onTabChange('today')}
            className="flex items-center gap-2 group text-left min-h-[36px] py-1 px-1 rounded-xl hover:bg-slate-800/80 transition-colors"
            title="Today dashboard"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs group-hover:bg-blue-500 transition-colors">
              p
            </div>
            <span className="font-serif text-base sm:text-lg font-normal tracking-tight text-white lowercase">
              pedical
            </span>
          </button>
        </div>

        {/* Center: Active Cot / Patient Identifier Badge (compact on mobile) */}
        <div className="flex items-center justify-center flex-1 max-w-[135px] xs:max-w-[170px] sm:max-w-xs md:max-w-sm px-0.5">
          <div className="relative w-full" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all min-h-[34px] sm:min-h-[38px] shadow-xs"
              title="Switch bed"
              aria-label="Active patient selector"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <div className="truncate text-left">
                  <div className="text-[11px] sm:text-xs font-semibold text-white truncate leading-tight">
                    {activePatient ? (
                      <>
                        <span>{activePatient.cotNumber}</span>
                        <span className="text-slate-400 font-normal ml-1 truncate">
                          {activePatient.name.split(' ')[0]}
                        </span>
                      </>
                    ) : (
                      'Beds'
                    )}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-0.5" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-1 w-64 sm:w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl py-1.5 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-semibold text-slate-400 flex justify-between items-center">
                  <span>Inpatients ({patients.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onTabChange('ward');
                    }}
                    className="text-blue-400 hover:text-blue-300 font-medium text-xs underline"
                  >
                    View roster
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto py-1 divide-y divide-slate-800/60">
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
                        className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-800 transition-colors min-h-[40px] ${
                          isSelected ? 'bg-blue-950/70 text-blue-200 font-semibold' : 'text-slate-300'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="flex items-center gap-1.5 text-xs text-white">
                            <span className="text-slate-400 font-medium">{p.cotNumber}:</span>
                            <span className="truncate">{p.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {p.input.weight_kg} kg &middot; {p.input.therapeutic_phase.split(' ')[0]}
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="p-1.5 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onAdmitNewChild();
                    }}
                    className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors text-xs min-h-[36px]"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add bed</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Security Lock, Reminders Bell, Settings */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* 1-Tap Bedside Lock */}
          {pinLockEnabled && onLockScreen && (
            <button
              type="button"
              onClick={onLockScreen}
              className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center rounded-xl border border-amber-500/40 bg-amber-950/40 text-amber-300 hover:text-white transition-colors shrink-0"
              title="Lock screen"
              aria-label="Lock screen"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            </button>
          )}

          {/* Pediatric Reminders Bell with persistent number badge */}
          {onOpenReminders && (
            <button
              type="button"
              onClick={onOpenReminders}
              className="relative w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:text-white transition-colors shrink-0 shadow-xs"
              title="Reminders"
              aria-label="Reminders"
            >
              <Bell className="w-3.5 h-3.5 text-blue-400" />
              {badgeCount > 0 && (
                <span
                  className={`absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 rounded-full text-white font-bold text-[9px] flex items-center justify-center border border-slate-900 shadow-xs ${
                    isDueBadge ? 'bg-rose-600 animate-pulse' : 'bg-blue-600'
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
            className="hidden md:flex px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white items-center gap-1.5 text-xs transition-colors min-h-[34px] shadow-xs"
            title="Protocols"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Protocols</span>
          </button>

          {onOpenDisclaimer && (
            <button
              type="button"
              onClick={onOpenDisclaimer}
              className="hidden lg:flex px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white items-center gap-1.5 text-xs transition-colors min-h-[34px] shadow-xs"
              title="Notice"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Notice</span>
            </button>
          )}

          <button
            type="button"
            onClick={onPrint}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 min-h-[34px] shadow-xs"
            title="Print worksheet"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Print</span>
          </button>

          {/* Settings */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:text-white transition-colors shrink-0 shadow-xs"
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="w-3.5 h-3.5 text-blue-400" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
