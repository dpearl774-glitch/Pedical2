export interface AppSettings {
  // Facility & Custom Branding
  facilityName: string;
  wardSubtitle: string;
  clinicianRole: string;

  // Inpatient & Outpatient Defaults
  defaultFeedingIntervalHours: number;
  defaultLocalMilkSource: string;
  fluidRoundingMode: 'exact' | 'round5' | 'round10';
  catchUpWeightGainTarget: number; // g/kg/day (5=moderate, 10=good)

  // Decluttering & Display Customization
  hidePrintOnMobile: boolean;
  showQuickPresets: boolean;
  showDiagnosticGuidanceNotes: boolean;
  compactWardView: boolean;
  guidelineVersion: string;

  // Bedside Security & Local Privacy Suite
  pinLockEnabled: boolean;
  pinCode: string;
  autoLockMinutes: number; // 0 for immediate on tab blur, 5, 15, 30, -1 for manual only
  recoveryKey: string; // Clinician recovery secret (Staff ID, license, or passphrase)
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  facilityName: 'Ghana Health Service (GHS) Nutrition Rehabilitation Centre',
  wardSubtitle: 'Pediatric Inpatient SAM / TFC Unit & CMAM Clinic',
  clinicianRole: 'Registered Dietitian (RD) / Nutrition Officer',
  defaultFeedingIntervalHours: 3,
  defaultLocalMilkSource: 'Dried Skimmed Milk Powder',
  fluidRoundingMode: 'round5',
  catchUpWeightGainTarget: 10,
  hidePrintOnMobile: true,
  showQuickPresets: true,
  showDiagnosticGuidanceNotes: true,
  compactWardView: false,
  guidelineVersion: 'GHS / UNICEF IMAM (Ghana) & WHO 2023',

  // Bedside Security Defaults
  pinLockEnabled: false,
  pinCode: '1234',
  autoLockMinutes: 15,
  recoveryKey: '',
};

const SETTINGS_STORAGE_KEY = 'pedical_user_settings_v1';

export function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_APP_SETTINGS,
        ...parsed,
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_APP_SETTINGS;
}

export function saveAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
