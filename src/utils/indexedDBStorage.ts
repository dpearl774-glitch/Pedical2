/**
 * IndexedDB Clinical Data Storage Engine for PediCal
 * Provides structured offline persistence for Ward Patients, Bedside Feeding Logs,
 * Reminders, and Clinical Settings with seamless LocalStorage sync and migration.
 */

import { WardPatient } from '../data/wardPatients';
import { AppSettings } from './appSettings';

const DB_NAME = 'pedical_indexed_db_v1';
const DB_VERSION = 1;

export interface IDBStats {
  supported: boolean;
  ready: boolean;
  dbName: string;
  version: number;
  patientCount: number;
  feedingLogCount: number;
  lastSynced: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('patients')) {
        db.createObjectStore('patients', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('feeding_logs')) {
        db.createObjectStore('feeding_logs', { keyPath: 'patientId' });
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Check if IndexedDB is supported by the client browser
 */
export function isIndexedDBSupported(): boolean {
  return typeof window !== 'undefined' && !!window.indexedDB;
}

/**
 * Persist entire patient roster into IndexedDB
 */
export async function savePatientsToIDB(patients: WardPatient[]): Promise<void> {
  if (!isIndexedDBSupported()) return;
  try {
    const db = await openDatabase();
    const tx = db.transaction(['patients', 'meta'], 'readwrite');
    const store = tx.objectStore('patients');

    // Clear and re-populate to keep in exact sync
    store.clear();
    for (const patient of patients) {
      store.put(patient);
    }

    const metaStore = tx.objectStore('meta');
    metaStore.put({ key: 'last_patients_sync', timestamp: new Date().toISOString() });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[PediCal IDB] Could not save patients to IndexedDB:', err);
  }
}

/**
 * Retrieve all patients from IndexedDB
 */
export async function getAllPatientsFromIDB(): Promise<WardPatient[]> {
  if (!isIndexedDBSupported()) return [];
  try {
    const db = await openDatabase();
    const tx = db.transaction('patients', 'readonly');
    const store = tx.objectStore('patients');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[PediCal IDB] Could not fetch patients from IndexedDB:', err);
    return [];
  }
}

/**
 * Persist feeding log for a patient to IndexedDB
 */
export async function saveFeedingLogToIDB(patientId: string, logData: any): Promise<void> {
  if (!isIndexedDBSupported() || !patientId) return;
  try {
    const db = await openDatabase();
    const tx = db.transaction('feeding_logs', 'readwrite');
    const store = tx.objectStore('feeding_logs');
    store.put({
      patientId,
      ...logData,
      updatedAt: new Date().toISOString(),
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[PediCal IDB] Could not save feeding log to IndexedDB:', err);
  }
}

/**
 * Get feeding log for a patient from IndexedDB
 */
export async function getFeedingLogFromIDB(patientId: string): Promise<any | null> {
  if (!isIndexedDBSupported() || !patientId) return null;
  try {
    const db = await openDatabase();
    const tx = db.transaction('feeding_logs', 'readonly');
    const store = tx.objectStore('feeding_logs');
    const request = store.get(patientId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[PediCal IDB] Could not fetch feeding log from IndexedDB:', err);
    return null;
  }
}

/**
 * Persist App Settings into IndexedDB
 */
export async function saveSettingsToIDB(settings: AppSettings): Promise<void> {
  if (!isIndexedDBSupported()) return;
  try {
    const db = await openDatabase();
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    store.put({ id: 'app_settings', ...settings });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[PediCal IDB] Could not save settings to IndexedDB:', err);
  }
}

/**
 * Get health stats and count of records in IndexedDB
 */
export async function getIndexedDBStats(): Promise<IDBStats> {
  if (!isIndexedDBSupported()) {
    return {
      supported: false,
      ready: false,
      dbName: DB_NAME,
      version: DB_VERSION,
      patientCount: 0,
      feedingLogCount: 0,
      lastSynced: 'N/A',
    };
  }

  try {
    const db = await openDatabase();
    const tx = db.transaction(['patients', 'feeding_logs', 'meta'], 'readonly');
    const patientStore = tx.objectStore('patients');
    const logStore = tx.objectStore('feeding_logs');
    const metaStore = tx.objectStore('meta');

    const patientCountReq = patientStore.count();
    const logCountReq = logStore.count();
    const metaReq = metaStore.get('last_patients_sync');

    return new Promise((resolve) => {
      tx.oncomplete = () => {
        resolve({
          supported: true,
          ready: true,
          dbName: DB_NAME,
          version: DB_VERSION,
          patientCount: patientCountReq.result || 0,
          feedingLogCount: logCountReq.result || 0,
          lastSynced: metaReq.result?.timestamp ? new Date(metaReq.result.timestamp).toLocaleTimeString() : 'Active',
        });
      };
      tx.onerror = () => {
        resolve({
          supported: true,
          ready: false,
          dbName: DB_NAME,
          version: DB_VERSION,
          patientCount: 0,
          feedingLogCount: 0,
          lastSynced: 'Error',
        });
      };
    });
  } catch {
    return {
      supported: true,
      ready: false,
      dbName: DB_NAME,
      version: DB_VERSION,
      patientCount: 0,
      feedingLogCount: 0,
      lastSynced: 'Unavailable',
    };
  }
}

/**
 * Migration utility: automatically copies existing localStorage data to IndexedDB
 */
export async function migrateLocalStorageToIndexedDB(): Promise<void> {
  if (!isIndexedDBSupported()) return;

  try {
    // 1. Migrate patients
    const savedPatients = localStorage.getItem('pedical_ward_inpatients_v3');
    if (savedPatients) {
      try {
        const parsed = JSON.parse(savedPatients);
        if (Array.isArray(parsed) && parsed.length > 0) {
          await savePatientsToIDB(parsed);
        }
      } catch {
        // ignore
      }
    }

    // 2. Migrate settings
    const savedSettings = localStorage.getItem('pedical_app_settings_v1');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed) {
          await saveSettingsToIDB(parsed);
        }
      } catch {
        // ignore
      }
    }

    // 3. Migrate feeding logs
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pedical_feed_records_patient_')) {
        const patientId = key.replace('pedical_feed_records_patient_', '');
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const data = JSON.parse(raw);
            await saveFeedingLogToIDB(patientId, data);
          } catch {
            // ignore
          }
        }
      }
    }
  } catch (err) {
    console.warn('[PediCal IDB] Migration completed with warnings:', err);
  }
}
