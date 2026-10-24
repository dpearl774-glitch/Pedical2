import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PediatricReminder,
  loadRemindersFromStorage,
  saveRemindersToStorage,
  playClinicalChime,
  showNativeBrowserNotification,
  toDateTimeLocalString,
} from '../utils/reminders';

export function useReminders() {
  const [reminders, setReminders] = useState<PediatricReminder[]>(() => loadRemindersFromStorage());
  const [activeBannerReminder, setActiveBannerReminder] = useState<PediatricReminder | null>(null);
  const alertedIdsRef = useRef<Set<string>>(new Set());

  // Save changes to localStorage
  useEffect(() => {
    saveRemindersToStorage(reminders);
  }, [reminders]);

  // Compute due and overdue active reminders
  const dueReminders = reminders.filter((r) => {
    if (r.completed) return false;
    const dueTime = new Date(r.dueDateTime).getTime();
    return dueTime <= Date.now();
  });

  // Heartbeat monitor: polls every 15 seconds
  const checkDueReminders = useCallback(() => {
    const now = Date.now();
    const currentDue = reminders.filter((r) => {
      if (r.completed) return false;
      const dueTime = new Date(r.dueDateTime).getTime();
      return dueTime <= now;
    });

    // Check for newly due reminders that haven't sounded chime
    const newlyDue = currentDue.filter((r) => !alertedIdsRef.current.has(r.id));

    if (newlyDue.length > 0) {
      // Play clinical alert chime
      playClinicalChime();

      // Trigger browser notification
      const first = newlyDue[0];
      showNativeBrowserNotification(
        `Pedical Alert: ${first.title}`,
        `${first.patientIdentifier} (${first.childName}) is due now.`
      );

      // Add to alerted set
      newlyDue.forEach((r) => alertedIdsRef.current.add(r.id));

      // Display sliding top alert banner
      setActiveBannerReminder(first);
    } else if (currentDue.length > 0 && !activeBannerReminder) {
      // Keep showing top due reminder if not yet dismissed
      setActiveBannerReminder(currentDue[0]);
    }
  }, [reminders, activeBannerReminder]);

  useEffect(() => {
    // Initial check
    checkDueReminders();

    // 15-second heartbeat interval
    const interval = setInterval(checkDueReminders, 15000);
    return () => clearInterval(interval);
  }, [checkDueReminders]);

  // Add reminder
  const addReminder = useCallback((newReminder: Omit<PediatricReminder, 'id' | 'completed'>) => {
    const item: PediatricReminder = {
      ...newReminder,
      id: `rem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      completed: false,
    };
    setReminders((prev) => [item, ...prev]);
  }, []);

  // Mark done
  const markComplete = useCallback((id: string) => {
    setReminders((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              completed: true,
              completedAt: new Date().toISOString(),
            }
          : r
      )
    );
    setActiveBannerReminder((current) => (current?.id === id ? null : current));
  }, []);

  // Snooze reminder by X minutes (default: 15)
  const snoozeReminder = useCallback((id: string, minutes: number = 15) => {
    const newDue = new Date(Date.now() + minutes * 60000);
    const newDueStr = toDateTimeLocalString(newDue);

    setReminders((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              dueDateTime: newDueStr,
            }
          : r
      )
    );
    // Remove from alerted set so it will chime again when snooze expires
    alertedIdsRef.current.delete(id);
    setActiveBannerReminder((current) => (current?.id === id ? null : current));
  }, []);

  // Dismiss top banner without changing due time
  const dismissBanner = useCallback((id: string) => {
    setActiveBannerReminder((current) => (current?.id === id ? null : current));
  }, []);

  // Delete reminder
  const deleteReminder = useCallback((id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    setActiveBannerReminder((current) => (current?.id === id ? null : current));
  }, []);

  // Clear completed history
  const clearCompleted = useCallback(() => {
    setReminders((prev) => prev.filter((r) => !r.completed));
  }, []);

  return {
    reminders,
    dueReminders,
    dueCount: dueReminders.length,
    activeBannerReminder,
    addReminder,
    markComplete,
    snoozeReminder,
    dismissBanner,
    deleteReminder,
    clearCompleted,
    setReminders,
  };
}
