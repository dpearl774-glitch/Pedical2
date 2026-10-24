import React, { useState } from 'react';
import {
  X,
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Plus,
  Trash2,
  RotateCcw,
  Volume2,
  Calendar,
  Sparkles,
  User,
  Bed,
  Check,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  PediatricReminder,
  ReminderCategory,
  ReminderPriority,
  PROTOCOL_PRESETS,
  ProtocolPreset,
  formatReminderDueDate,
  toDateTimeLocalString,
  playClinicalChime,
  requestNotificationPermission,
} from '../utils/reminders';
import { WardPatient } from '../data/wardPatients';

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: PediatricReminder[];
  onAddReminder: (reminder: Omit<PediatricReminder, 'id' | 'completed'>) => void;
  onMarkComplete: (id: string) => void;
  onSnooze: (id: string, minutes?: number) => void;
  onDelete: (id: string) => void;
  onClearCompleted: () => void;
  patients: WardPatient[];
  activePatientId?: string;
}

export const RemindersModal: React.FC<RemindersModalProps> = ({
  isOpen,
  onClose,
  reminders,
  onAddReminder,
  onMarkComplete,
  onSnooze,
  onDelete,
  onClearCompleted,
  patients,
  activePatientId,
}) => {
  const [activeTab, setActiveTab] = useState<'due' | 'upcoming' | 'completed'>('due');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // New Reminder Form State
  const activePatient = patients.find((p) => p.id === activePatientId) || patients[0];
  const [childName, setChildName] = useState<string>(activePatient?.name || 'Inpatient Child');
  const [patientIdentifier, setPatientIdentifier] = useState<string>(activePatient?.cotNumber || 'Cot 01');
  const [title, setTitle] = useState<string>('2-Hour F-75 Feed & Hypoglycemia Check');
  const [category, setCategory] = useState<ReminderCategory>('stabilization_feed');
  const [priority, setPriority] = useState<ReminderPriority>('urgent');
  const [dueDateTime, setDueDateTime] = useState<string>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return toDateTimeLocalString(d);
  });
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const now = Date.now();

  // Due / Today (overdue or due within today)
  const dueItems = reminders.filter((r) => {
    if (r.completed) return false;
    const dueTime = new Date(r.dueDateTime).getTime();
    return dueTime <= now + 12 * 60 * 60 * 1000; // Due now or within next 12 hours
  });

  // Upcoming (future beyond 12 hours or not yet due)
  const upcomingItems = reminders.filter((r) => {
    if (r.completed) return false;
    const dueTime = new Date(r.dueDateTime).getTime();
    return dueTime > now + 12 * 60 * 60 * 1000;
  });

  // Completed history
  const completedItems = reminders.filter((r) => r.completed);

  // Current list to show
  const currentList =
    activeTab === 'due' ? dueItems : activeTab === 'upcoming' ? upcomingItems : completedItems;

  const handleApplyPreset = (preset: ProtocolPreset) => {
    setTitle(preset.title);
    setCategory(preset.category);
    setPriority(preset.priority);
    setDueDateTime(preset.calculateDueDateTime());
  };

  const handlePatientSelectChange = (patientId: string) => {
    const p = patients.find((item) => item.id === patientId);
    if (p) {
      setPatientIdentifier(p.cotNumber);
      setChildName(p.name);
    }
  };

  const handleSubmitNewReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !patientIdentifier.trim()) return;

    onAddReminder({
      childName: childName.trim() || 'Patient',
      patientIdentifier: patientIdentifier.trim(),
      title: title.trim(),
      category,
      priority,
      dueDateTime: dueDateTime || toDateTimeLocalString(new Date()),
      notes: notes.trim() || undefined,
    });

    setShowAddForm(false);
    setNotes('');
  };

  const getPriorityBadge = (p: ReminderPriority) => {
    switch (p) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700 border border-rose-200">
            <Flame className="w-3 h-3 text-rose-600" />
            urgent
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            high
          </span>
        );
      case 'routine':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-400" />
            routine
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-slate-900">
                  Reminders
                </h2>
                {dueItems.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                    {dueItems.length} due
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={playClinicalChime}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-slate-200/60 transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center"
              title="Test chime"
              aria-label="Test chime"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher & Quick Add Action */}
        <div className="px-3 sm:px-5 py-1.5 border-b border-slate-200 bg-white flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('due');
                setShowAddForm(false);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[34px] flex items-center gap-1 ${
                activeTab === 'due' && !showAddForm
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Due</span>
              {dueItems.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {dueItems.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('upcoming');
                setShowAddForm(false);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[34px] flex items-center gap-1 ${
                activeTab === 'upcoming' && !showAddForm
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Upcoming ({upcomingItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('completed');
                setShowAddForm(false);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[34px] flex items-center gap-1 ${
                activeTab === 'completed' && !showAddForm
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>History ({completedItems.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 min-h-[34px] ${
              showAddForm
                ? 'bg-slate-200 text-slate-800'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {showAddForm ? (
              <span>Cancel</span>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </>
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Form to Add New Clinical Reminder */}
          {showAddForm ? (
            <form onSubmit={handleSubmitNewReminder} className="space-y-4">
              <div className="p-2.5 sm:p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-blue-950">
                <div className="font-semibold flex items-center gap-1.5 mb-1.5 text-xs text-blue-900">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Protocol presets</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {PROTOCOL_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-2 py-1 rounded-md bg-white hover:bg-blue-100 border border-blue-200 text-blue-900 text-[11px] font-medium transition-colors flex items-center gap-1 min-h-[32px]"
                    >
                      <span>{preset.label}</span>
                      <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-1 py-0.2 rounded">
                        {preset.suggestedOffset}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Patient linking dropdown & bed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Inpatient bed
                  </label>
                  <select
                    onChange={(e) => handlePatientSelectChange(e.target.value)}
                    className="w-full text-base sm:text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[40px]"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.cotNumber}: {p.name} ({p.input.weight_kg} kg)
                      </option>
                    ))}
                    <option value="custom">Custom / outpatient card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bed &amp; child name
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={patientIdentifier}
                      onChange={(e) => setPatientIdentifier(e.target.value)}
                      placeholder="Cot 03"
                      className="w-1/3 text-base sm:text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[40px]"
                      required
                    />
                    <input
                      type="text"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      placeholder="Name"
                      className="w-2/3 text-base sm:text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[40px]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Action / order
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="2h F-75 feed and glucose check"
                    className="w-full text-base sm:text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[40px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as ReminderPriority)}
                    className="w-full text-base sm:text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[40px]"
                  >
                    <option value="urgent">urgent</option>
                    <option value="high">high</option>
                    <option value="routine">routine</option>
                  </select>
                </div>
              </div>

              {/* Due Date & Time Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due time
                  </label>
                  <input
                    type="datetime-local"
                    value={dueDateTime}
                    onChange={(e) => setDueDateTime(e.target.value)}
                    className="w-full text-base sm:text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[40px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ReminderCategory)}
                    className="w-full text-base sm:text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[40px]"
                  >
                    <option value="stabilization_feed">stabilization feed</option>
                    <option value="refeeding_monitor">refeeding monitor</option>
                    <option value="appetite_test">appetite test</option>
                    <option value="weight_velocity">weight velocity</option>
                    <option value="edema_check">edema check</option>
                    <option value="follow_up">MAM follow-up</option>
                    <option value="discharge_review">discharge review</option>
                    <option value="general">general bedside</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Target volume, NG feed instructions, etc."
                  className="w-full text-base sm:text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 font-normal focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[40px]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 min-h-[36px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1 shadow-xs transition-colors min-h-[36px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Notification Permission Banner if not granted */}
              {typeof window !== 'undefined' &&
                'Notification' in window &&
                Notification.permission === 'default' && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between gap-3 text-xs">
                    <div className="text-blue-900">
                      <strong>Enable Bedside Audio &amp; Pop-up Alerts:</strong> Allow browser notifications so critical feeding and refeeding alarms alert you even if you switch tabs.
                    </div>
                    <button
                      type="button"
                      onClick={requestNotificationPermission}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shrink-0 min-h-[44px]"
                    >
                      Enable
                    </button>
                  </div>
                )}

              {/* Empty state */}
              {currentList.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                    {activeTab === 'completed' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <Bell className="w-6 h-6" />
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {activeTab === 'due'
                      ? 'No Due Bedside Reminders Right Now'
                      : activeTab === 'upcoming'
                      ? 'No Upcoming Reminders Scheduled'
                      : 'No Completed History Yet'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {activeTab === 'due'
                      ? 'All pediatric nutritional feeds, refeeding checks, and appetite tests are up to date!'
                      : 'Schedule 2h stabilization feeds, refeeding labs, or daily weight velocity checks.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs min-h-[48px]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Reminder</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {currentList.map((reminder) => {
                    const dueTime = new Date(reminder.dueDateTime).getTime();
                    const isOverdue = !reminder.completed && dueTime <= now;

                    return (
                      <div
                        key={reminder.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          reminder.completed
                            ? 'bg-slate-50/70 border-slate-200 opacity-75'
                            : isOverdue
                            ? 'bg-rose-50/40 border-rose-300 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          {/* Left: Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {getPriorityBadge(reminder.priority)}
                              <span className="font-extrabold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                {reminder.patientIdentifier}
                              </span>
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {reminder.childName}
                              </span>
                            </div>

                            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{reminder.title}</span>
                            </div>

                            {reminder.notes && (
                              <p className="text-[11px] text-slate-500 mt-0.5 italic">
                                &quot;{reminder.notes}&quot;
                              </p>
                            )}

                            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                              <span
                                className={`font-bold flex items-center gap-1 ${
                                  isOverdue
                                    ? 'text-rose-600 animate-pulse'
                                    : reminder.completed
                                    ? 'text-emerald-600'
                                    : 'text-slate-600'
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                {formatReminderDueDate(reminder.dueDateTime)}
                              </span>
                              <span>&middot;</span>
                              <span>{new Date(reminder.dueDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {reminder.completed && reminder.completedAt && (
                                <>
                                  <span>&middot;</span>
                                  <span className="text-emerald-700 font-semibold">
                                    Done at {new Date(reminder.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            {!reminder.completed ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onMarkComplete(reminder.id)}
                                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs transition-colors min-h-[44px]"
                                  title="Mark as completed"
                                >
                                  <Check className="w-4 h-4" />
                                  <span>Done</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onSnooze(reminder.id, 15)}
                                  className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors min-h-[44px]"
                                  title="Snooze 15 minutes"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>+15m</span>
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onDelete(reminder.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                title="Delete from history"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {activeTab === 'completed' && completedItems.length > 0 ? (
            <button
              type="button"
              onClick={onClearCompleted}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-rose-50 min-h-[44px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Completed History</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-500">
              Active local reminders: <strong>{reminders.filter((r) => !r.completed).length}</strong>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl min-h-[44px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
