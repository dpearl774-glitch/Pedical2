import React, { useState, useRef, useEffect } from 'react';
import { Printer, BookOpen, ChevronDown, Check, UserPlus, ShieldCheck } from 'lucide-react';
import { WardPatient } from '../data/wardPatients';

interface ClinicalHeaderProps {
  onPrint: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenReference: () => void;
  onOpenDisclaimer?: () => void;
  patients: WardPatient[];
  activePatientId: string;
  onSelectPatient: (patientId: string) => void;
  onAdmitNewChild: () => void;
}

export const ClinicalHeader: React.FC<ClinicalHeaderProps> = ({
  onPrint,
  activeTab,
  onTabChange,
  onOpenReference,
  onOpenDisclaimer,
  patients,
  activePatientId,
  onSelectPatient,
  onAdmitNewChild,
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

  return (
    <header className="no-print bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-slate-100">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-3 sm:px-6 py-2.5">
        {/* Zone 1: Brand wordmark (pedical) + Quick Patient Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onTabChange('ward')}
            className="flex items-center gap-2 group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-xs group-hover:bg-blue-500 transition-colors">
              p
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white lowercase">
                pedical
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400 ml-2">
                WHO Clinical Reference
              </span>
            </div>
          </button>

          {/* Quick Patient Selector Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition-all font-mono"
              title="Switch Inpatient Bed"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span className="font-bold text-white max-w-[110px] sm:max-w-[140px] truncate">
                {activePatient ? `${activePatient.cotNumber}: ${activePatient.name}` : 'Select Bed'}
              </span>
              <span className="text-[10px] text-slate-400 hidden md:inline">
                ({activePatient?.input.weight_kg}kg)
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-800 text-[10px] font-bold uppercase text-slate-400 tracking-wider flex justify-between items-center">
                  <span>De-Identified Inpatients ({patients.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onTabChange('ward');
                    }}
                    className="text-blue-400 hover:text-blue-300 capitalize text-[11px]"
                  >
                    View Roster
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto py-1">
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
                        className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-800 transition-colors ${
                          isSelected ? 'bg-blue-900/40 text-blue-300 font-bold' : 'text-slate-300'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-slate-400">{p.cotNumber}:</span>
                            <span className="truncate">{p.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {p.input.weight_kg}kg &middot; {p.input.therapeutic_phase.split(' ')[0]} &middot;{' '}
                            {p.input.edema_severity}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="p-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onAdmitNewChild();
                    }}
                    className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Inpatient Bed</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zone 2: Desktop clean single-line nav tabs */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-medium text-slate-300">
          {[
            { id: 'ward', label: `Ward Roster (${patients.length})` },
            { id: 'calculator', label: 'Child Assessment' },
            { id: 'chart', label: 'WHO Growth Chart' },
            { id: 'feeding', label: 'Feeding Targets' },
            { id: 'recipe', label: 'Batch Recipe' },
            { id: 'schedule', label: 'Bedside Log' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onOpenReference}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'reference'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>References</span>
          </button>
        </nav>

        {/* Zone 3: Disclaimer & Print Action */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenDisclaimer && (
            <button
              type="button"
              onClick={onOpenDisclaimer}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center gap-1 text-xs transition-colors"
              title="Clinical Disclaimer & Privacy Notice"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden xl:inline text-[11px]">Notice</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenReference}
            className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            title="Protocol References"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 shadow-xs min-h-[36px]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Worksheet</span>
            <span className="sm:hidden">Print</span>
          </button>
        </div>
      </div>
    </header>
  );
};
