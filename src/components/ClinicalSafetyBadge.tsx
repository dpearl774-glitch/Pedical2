import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle } from 'lucide-react';
import { ClinicalSafetyAuditResult } from '../utils/clinicalSafetyAuditor';

interface ClinicalSafetyBadgeProps {
  auditResult: ClinicalSafetyAuditResult;
  onClick: () => void;
  className?: string;
  variant?: 'compact' | 'full';
}

export const ClinicalSafetyBadge: React.FC<ClinicalSafetyBadgeProps> = ({
  auditResult,
  onClick,
  className = '',
  variant = 'compact',
}) => {
  const hasCritical = auditResult.criticalCount > 0;
  const hasCaution = auditResult.cautionCount > 0;

  if (hasCritical) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`relative w-9 h-9 sm:w-auto sm:px-2.5 sm:py-1.5 flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 hover:bg-rose-100 active:scale-95 transition-all text-xs font-bold shadow-xs shrink-0 ${className}`}
        title="Protocol Alert: Click to review dosage guidance"
        aria-label="Protocol alert"
      >
        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
        <span className="hidden sm:inline">Alert ({auditResult.criticalCount})</span>
        <span className="sm:hidden absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center border-2 border-white shadow-xs">
          {auditResult.criticalCount}
        </span>
      </button>
    );
  }

  if (hasCaution) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`relative w-9 h-9 sm:w-auto sm:px-2.5 sm:py-1.5 flex items-center justify-center gap-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 active:scale-95 transition-all text-xs font-bold shadow-xs shrink-0 ${className}`}
        title="Protocol Notice: Click to review recommendations"
        aria-label="Protocol notice"
      >
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="hidden sm:inline">Notice ({auditResult.cautionCount})</span>
        <span className="sm:hidden absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 rounded-full bg-amber-600 text-white font-black text-[10px] flex items-center justify-center border-2 border-white shadow-xs">
          {auditResult.cautionCount}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-9 h-9 sm:w-auto sm:px-2.5 sm:py-1.5 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 active:scale-95 transition-all text-xs font-bold shadow-2xs shrink-0 ${className}`}
      title="All protocol checks verified"
      aria-label="Protocol checks passed"
    >
      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
      <span className="hidden sm:inline">
        {variant === 'full' ? 'WHO Protocols OK' : 'Protocols OK'}
      </span>
    </button>
  );
};
