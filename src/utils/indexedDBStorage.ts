/**
 * IndexedDB Clinical Data Storage Engine for PediCal
 * Provides structured offline persistence for Ward Patients, Bedside Feeding Logs,
 * Reminders, and Clinical Settings with native AES-GCM 256-bit Dual-Layer Encryption.
 */

import { WardPatient } from '../data/wardPatients';
import { AppSettings } from './appSettings';
import {
  getActiveMasterKey,
  encryptObject,
  decryptObject,
  isVaultConfigured,
} from './cryptoStorage';

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
  isEncrypted: boolean;
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
 * Persist entire patient roster into IndexedDB with AES-GCM 256-bit encryption
 * whenever an active Master Key is loaded into the session.
 */
export async function savePatientsToIDB(patients: WardPatient[]): Promise<void> {
  if (!isIndexedDBSupported()) return;
  try {
    const db = await openDatabase();
    const tx = db.transaction(['patients', 'meta'], 'readwrite');
    const store = tx.objectStore('patients');
    const masterKey = getActiveMasterKey();

    // Clear and re-populate
    store.clear();
    for (const patient of patients) {
      if (masterKey) {
        // Encrypt patient object with Master Key
        const encrypted = await encryptObject(masterKey, patient);
        store.put({
          id: patient.id,
          isEncrypted: true,
          iv: encrypted.iv,
          ciphertext: encrypted.ciphertext,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Plaintext persistence (when encryption not configured)
        store.put({
          ...patient,
          isEncrypted: false,
        });
      }
    }

    const metaStore = tx.objectStore('meta');
    metaStore.put({
      key: 'last_patients_sync',
      timestamp: new Date().toISOString(),
      encrypted: !!masterKey,
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[PediCal IDB] Could not save patients to IndexedDB:', err);
  }
}

/**
 * Retrieve all patients from IndexedDB, automatically decrypting records
 * using the active Master Key.
 */
export async function getAllPatientsFromIDB(): Promise<WardPatient[]> {
  if (!isIndexedDBSupported()) return [];
  try {
    const db = await openDatabase();
    const tx = db.transaction('patients', 'readonly');
    const store = tx.objectStore('patients');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        const rawRecords = request.result || [];
        const masterKey = getActiveMasterKey();
        const output: WardPatient[] = [];

        for (const record of rawRecords) {
          if (record.isEncrypted && record.ciphertext && record.iv) {
            if (masterKey) {
              try {
                const decrypted = await decryptObject<WardPatient>(masterKey, {
                  iv: record.iv,
                  ciphertext: record.ciphertext,
                });
                output.push(decrypted);
              } catch (e) {
                console.warn('[PediCal IDB] Failed to decrypt patient record:', record.id, e);
              }
            } else {
              // Master Key not yet unlocked
              console.warn('[PediCal IDB] Cannot read patient record: session locked');
            }
          } else {
            // Unencrypted legacy record
            const { isEncrypted, ...cleanPatient } = record;
            output.push(cleanPatient as WardPatient);
          }
        }

        resolve(output);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[PediCal IDB] Could not fetch patients from IndexedDB:', err);
    return [];
  }
}

/**
 * Persist feeding log for a patient to IndexedDB (AES-GCM encrypted if master key loaded)
 */
export async function saveFeedingLogToIDB(patientId: string, logData: any): Promise<void> {
  if (!isIndexedDBSupported() || !patientId) return;
  try {
    const db = await openDatabase();
    const tx = db.transaction('feeding_logs', 'readwrite');
    const store = tx.objectStore('feeding_logs');
    const masterKey = getActiveMasterKey();

    if (masterKey) {
      const encrypted = await encryptObject(masterKey, logData);
      store.put({
        patientId,
        isEncrypted: true,
        iv: encrypted.iv,
        ciphertext: encrypted.ciphertext,
        updatedAt: new Date().toISOString(),
      });
    } else {
      store.put({
        patientId,
        ...logData,
        isEncrypted: false,
        updatedAt: new Date().toISOString(),
      });
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[PediCal IDB] Could not save feeding log to IndexedDB:', err);
  }
}

/**
 * Get feeding log for a patient from IndexedDB (automatically decrypted)
 */
export async function getFeedingLogFromIDB(patientId: string): Promise<any | null> {
  if (!isIndexedDBSupported() || !patientId) return null;
  try {
    const db = await openDatabase();
    const tx = db.transaction('feeding_logs', 'readonly');
    const store = tx.objectStore('feeding_logs');
    const request = store.get(patientId);

    return new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        const record = request.result;
        if (!record) {
          resolve(null);
          return;
        }

        if (record.isEncrypted && record.ciphertext && record.iv) {
          const masterKey = getActiveMasterKey();
          if (!masterKey) {
            resolve(null);
            return;
          }
          try {
            const decrypted = await decryptObject<any>(masterKey, {
              iv: record.iv,
              ciphertext: record.ciphertext,
            });
            resolve(decrypted);
          } catch (e) {
            console.warn('[PediCal IDB] Could not decrypt feeding log for patient:', patientId, e);
            resolve(null);
          }
        } else {
          resolve(record);
        }
      };
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
 * Encrypt all unencrypted data in IndexedDB using newly activated Master Key
 */
export async function encryptExistingIndexedDBData(masterKey: CryptoKey): Promise<number> {
  if (!isIndexedDBSupported()) return 0;
  let count = 0;
  try {
    const db = await openDatabase();
    
    // 1. Re-encrypt patients
    const patientTx = db.transaction('patients', 'readwrite');
    const patientStore = patientTx.objectStore('patients');
    const allPatientsReq = patientStore.getAll();

    await new Promise<void>((resolve, reject) => {
      allPatientsReq.onsuccess = async () => {
        const records = allPatientsReq.result || [];
        for (const p of records) {
          if (!p.isEncrypted) {
            const encrypted = await encryptObject(masterKey, p);
            patientStore.put({
              id: p.id,
              isEncrypted: true,
              iv: encrypted.iv,
              ciphertext: encrypted.ciphertext,
              updatedAt: new Date().toISOString(),
            });
            count++;
          }
        }
        resolve();
      };
      allPatientsReq.onerror = () => reject(allPatientsReq.error);
    });

    // 2. Re-encrypt feeding logs
    const logTx = db.transaction('feeding_logs', 'readwrite');
    const logStore = logTx.objectStore('feeding_logs');
    const allLogsReq = logStore.getAll();

    await new Promise<void>((resolve, reject) => {
      allLogsReq.onsuccess = async () => {
        const records = allLogsReq.result || [];
        for (const l of records) {
          if (!l.isEncrypted) {
            const { patientId, ...logData } = l;
            const encrypted = await encryptObject(masterKey, logData);
            logStore.put({
              patientId,
              isEncrypted: true,
              iv: encrypted.iv,
              ciphertext: encrypted.ciphertext,
              updatedAt: new Date().toISOString(),
            });
            count++;
          }
        }
        resolve();
      };
      allLogsReq.onerror = () => reject(allLogsReq.error);
    });

  } catch (err) {
    console.warn('[PediCal IDB] Error migrating data to encrypted state:', err);
  }
  return count;
}

/**
 * Get health stats and count of records in IndexedDB
 */
export async function getIndexedDBStats(): Promise<IDBStats> {
  const isEncrypted = isVaultConfigured();

  if (!isIndexedDBSupported()) {
    return {
      supported: false,
      ready: false,
      dbName: DB_NAME,
      version: DB_VERSION,
      patientCount: 0,
      feedingLogCount: 0,
      lastSynced: 'N/A',
      isEncrypted,
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
          lastSynced: metaReq.result?.timestamp
            ? new Date(metaReq.result.timestamp).toLocaleTimeString()
            : 'Active',
          isEncrypted,
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
          isEncrypted,
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
      isEncrypted,
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
    const savedSettings = localStorage.getItem('pedical_user_settings_v1');
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
