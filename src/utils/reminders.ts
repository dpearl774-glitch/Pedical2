/**
 * Pediatric SAM & MAM Clinical Reminder Engine
 * Zero-Cloud, Local-First Clinical Decision Support Reminders
 */

export type ReminderCategory =
  | 'stabilization_feed'
  | 'refeeding_monitor'
  | 'appetite_test'
  | 'weight_velocity'
  | 'edema_check'
  | 'follow_up'
  | 'discharge_review'
  | 'general';

export type ReminderPriority = 'urgent' | 'high' | 'routine';

export interface PediatricReminder {
  id: string;
  childName: string;
  patientIdentifier: string; // e.g. "Cot 01" or "MAM-Card #104"
  title: string;
  category: ReminderCategory;
  priority: ReminderPriority;
  dueDateTime: string; // ISO string or YYYY-MM-DDTHH:mm
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

export interface ProtocolPreset {
  id: string;
  label: string;
  title: string;
  category: ReminderCategory;
  priority: ReminderPriority;
  suggestedOffset: string; // e.g. "+2 hours", "Tomorrow 07:00"
  calculateDueDateTime: () => string;
}

export const REMINDERS_STORAGE_KEY = 'pedical_clinical_reminders_v1';

// Helper to format ISO date time string for datetime-local input
export function toDateTimeLocalString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Format concise relative time
export function formatReminderDueDate(dateTimeStr: string): string {
  const due = new Date(dateTimeStr);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const isPast = diffMs < 0;
  const absDiffMin = Math.round(Math.abs(diffMs) / 60000);

  if (Math.abs(diffMs) < 60000) {
    return 'now';
  }
  if (absDiffMin < 60) {
    return isPast ? `${absDiffMin}m overdue` : `in ${absDiffMin}m`;
  }
  const absDiffHours = Math.round(absDiffMin / 60);
  if (absDiffHours < 24) {
    return isPast ? `${absDiffHours}h overdue` : `in ${absDiffHours}h`;
  }
  return due.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 1-Click protocol presets (minimalist wording)
export const PROTOCOL_PRESETS: ProtocolPreset[] = [
  {
    id: 'preset-feed',
    label: '2h F-75 feed',
    title: '2h F-75 feed and glucose check',
    category: 'stabilization_feed',
    priority: 'urgent',
    suggestedOffset: '+2h',
    calculateDueDateTime: () => {
      const d = new Date();
      d.setHours(d.getHours() + 2);
      return toDateTimeLocalString(d);
    },
  },
  {
    id: 'preset-refeeding',
    label: 'refeeding check',
    title: 'refeeding electrolytes and fluid monitor',
    category: 'refeeding_monitor',
    priority: 'urgent',
    suggestedOffset: '+4h',
    calculateDueDateTime: () => {
      const d = new Date();
      d.setHours(d.getHours() + 4);
      return toDateTimeLocalString(d);
    },
  },
  {
    id: 'preset-appetite',
    label: 'appetite test',
    title: 'RUTF appetite test challenge',
    category: 'appetite_test',
    priority: 'high',
    suggestedOffset: '+3h',
    calculateDueDateTime: () => {
      const d = new Date();
      d.setHours(d.getHours() + 3);
      return toDateTimeLocalString(d);
    },
  },
  {
    id: 'preset-weight',
    label: 'weight velocity',
    title: 'morning weigh-in and weight velocity',
    category: 'weight_velocity',
    priority: 'high',
    suggestedOffset: '07:00',
    calculateDueDateTime: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(7, 0, 0, 0);
      return toDateTimeLocalString(d);
    },
  },
  {
    id: 'preset-edema',
    label: 'edema audit',
    title: 'bilateral pitting edema grading',
    category: 'edema_check',
    priority: 'routine',
    suggestedOffset: '08:00',
    calculateDueDateTime: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(8, 0, 0, 0);
      return toDateTimeLocalString(d);
    },
  },
  {
    id: 'preset-mam',
    label: 'MAM 14d MUAC',
    title: 'supplementation 14-day MUAC check',
    category: 'follow_up',
    priority: 'routine',
    suggestedOffset: '+14d',
    calculateDueDateTime: () => {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      d.setHours(9, 0, 0, 0);
      return toDateTimeLocalString(d);
    },
  },
  {
    id: 'preset-discharge',
    label: 'discharge review',
    title: 'sustained MUAC >= 12.5 cm audit',
    category: 'discharge_review',
    priority: 'high',
    suggestedOffset: '+14d',
    calculateDueDateTime: () => {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      d.setHours(10, 0, 0, 0);
      return toDateTimeLocalString(d);
    },
  },
];

// Initial seed reminders (first seed is due now so badge and banner are active)
export const INITIAL_REMINDERS: PediatricReminder[] = [
  {
    id: 'rem-seed-1',
    childName: 'Kwame Mensah',
    patientIdentifier: 'Cot 01',
    title: '2h F-75 feed and glucose check',
    category: 'stabilization_feed',
    priority: 'urgent',
    dueDateTime: toDateTimeLocalString(new Date(Date.now() - 5 * 60000)), // 5 mins overdue (active now)
    completed: false,
    notes: 'Severe wasting stabilization. Verify volume retention >= 80%.',
  },
  {
    id: 'rem-seed-2',
    childName: 'Fatima Al-Hassan',
    patientIdentifier: 'Cot 02',
    title: 'Bilateral pitting edema grading',
    category: 'edema_check',
    priority: 'high',
    dueDateTime: toDateTimeLocalString(new Date(Date.now() + 45 * 60000)), // in 45 mins
    completed: false,
    notes: 'Assess pretibial and dorsal foot edema resolution.',
  },
];

export function loadRemindersFromStorage(): PediatricReminder[] {
  try {
    const raw = localStorage.getItem(REMINDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return INITIAL_REMINDERS;
}

export function saveRemindersToStorage(reminders: PediatricReminder[]): void {
  try {
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
  } catch {
    // ignore
  }
}

// Web Audio API: Zero-Asset Two-Tone Clinical Chime (587Hz D5 -> 880Hz A5)
let audioCtx: AudioContext | null = null;

export function playClinicalChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Tone 1: D5 (587.33 Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.2, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Tone 2: A5 (880.00 Hz)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.16);
    gain2.gain.setValueAtTime(0.001, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.19);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.16);
    osc2.stop(now + 0.45);
  } catch {
    // browser audio policies may block if no interaction yet
  }
}

// Request and trigger native browser notification
export function requestNotificationPermission(): void {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}

export function showNativeBrowserNotification(title: string, body: string): void {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch {
        // ignore
      }
    }
  }
}
