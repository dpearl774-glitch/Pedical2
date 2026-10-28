export interface AppSettings {
  // Clinician & Facility Branding
  clinicianName: string; // Clinician First/Full Name (e.g., "Ama", "Dr. Mensah")
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

  // Security & Local Privacy Suite
  pinLockEnabled: boolean;
  pinCode: string;
  autoLockMinutes: number; // 0 for immediate on tab blur, 5, 15, 30, -1 for manual only
  recoveryKey: string; // Clinician recovery secret (Staff ID, license, or passphrase)
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  clinicianName: '',
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

  // Security Defaults
  pinLockEnabled: false,
  pinCode: '1234',
  autoLockMinutes: 15,
  recoveryKey: '',
};

export function getClinicianFirstName(fullName?: string): string {
  if (!fullName || !fullName.trim()) return 'Clinician';
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length > 1 && /^(dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?|nurse|sister)$/i.test(parts[0])) {
    return `${parts[0]} ${parts[1]}`;
  }
  return parts[0];
}

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
