import React from 'react';
import {
  Bell,
  Clock,
  Check,
  X,
  Flame,
} from 'lucide-react';
import {
  PediatricReminder,
  formatReminderDueDate,
} from '../utils/reminders';

interface ReminderNotificationBannerProps {
  reminder: PediatricReminder | null;
  onMarkDone: (id: string) => void;
  onSnooze: (id: string, minutes?: number) => void;
  onDismiss: (id: string) => void;
  onOpenCenter: () => void;
}

export const ReminderNotificationBanner: React.FC<ReminderNotificationBannerProps> = ({
  reminder,
  onMarkDone,
  onSnooze,
  onDismiss,
  onOpenCenter,
}) => {
  if (!reminder) return null;

  const isUrgent = reminder.priority === 'urgent';
  const isHigh = reminder.priority === 'high';

  return (
    <aside
      aria-label="Clinical alert"
      className="no-print sticky top-[44px] sm:top-[50px] z-30 w-full bg-slate-900 border-b border-slate-800 text-slate-100 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-1.5 sm:py-2 flex items-center justify-between gap-2 text-xs">
        {/* Left: Indicator & Brief Message */}
        <div
          onClick={onOpenCenter}
          className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
          title="Open reminders"
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isUrgent
                ? 'bg-rose-500 animate-pulse'
                : isHigh
                ? 'bg-amber-400'
                : 'bg-blue-400'
            }`}
          />

          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span className="font-bold text-white shrink-0">
              {reminder.patientIdentifier}
            </span>
            <span className="text-slate-400 shrink-0">&middot;</span>
            <span className="truncate text-slate-200">
              {reminder.title}
            </span>
            <span className="text-[11px] text-amber-300 font-medium shrink-0 ml-1">
              ({formatReminderDueDate(reminder.dueDateTime)})
            </span>
          </div>
        </div>

        {/* Right: Minimal Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onMarkDone(reminder.id)}
            className="px-2 sm:px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-md flex items-center gap-1 min-h-[32px] transition-colors"
            title="Mark done"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Done</span>
          </button>

          <button
            type="button"
            onClick={() => onSnooze(reminder.id, 15)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium text-xs rounded-md min-h-[32px] transition-colors"
            title="Snooze 15 minutes"
          >
            +15m
          </button>

          <button
            type="button"
            onClick={() => onDismiss(reminder.id)}
            className="p-1.5 text-slate-400 hover:text-white rounded-md min-h-[32px] min-w-[32px] flex items-center justify-center transition-colors"
            title="Dismiss"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
