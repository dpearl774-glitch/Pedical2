import React, { useState, useEffect, useRef } from 'react';
import { FeedingTargetSummary } from '../utils/clinicalCalculations';
import { FeedRecord } from '../data/wardPatients';
import {
  Check,
  AlertCircle,
  RefreshCw,
  Clock,
  Droplets,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Copy,
  Info,
  Timer,
  ChevronDown,
  ChevronUp,
  Beaker,
  ShieldCheck,
  History,
} from 'lucide-react';
import { ClinicalNumberInput } from './ClinicalNumberInput';

export type { FeedRecord };

const FEEDING_STORAGE_PREFIX = 'pedical_feed_records_patient_';

export function getPersistedPatientFeeding(patientId: string): {
  records?: FeedRecord[];
  shiftStartTime?: string;
  dietitianBatchPrepTime?: string;
} | null {
  if (!patientId) return null;
  try {
    const raw = localStorage.getItem(`${FEEDING_STORAGE_PREFIX}${patientId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.records)) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function savePersistedPatientFeeding(
  patientId: string,
  data: {
    records: FeedRecord[];
    shiftStartTime?: string;
    dietitianBatchPrepTime?: string;
  }
): void {
  if (!patientId) return;
  try {
    localStorage.setItem(`${FEEDING_STORAGE_PREFIX}${patientId}`, JSON.stringify(data));
  } catch {
    // ignore
  }
}

interface BedsideFeedingScheduleProps {
  patientId?: string;
  feedingSummary: FeedingTargetSummary;
  patientWeight: number;
  patientName?: string;
  cotNumber?: string;
  therapeuticPhase?: string;
  initialRecords?: FeedRecord[];
  initialShiftStartTime?: string;
  initialDietitianBatchPrepTime?: string;
  onUpdateFeedingRecords?: (
    patientId: string,
    records: FeedRecord[],
    shiftStartTime?: string,
    dietitianBatchPrepTime?: string
  ) => void;
}

export const BedsideFeedingSchedule: React.FC<BedsideFeedingScheduleProps> = ({
  patientId = '',
  feedingSummary,
  patientWeight,
  patientName = 'Active Inpatient',
  cotNumber = 'Cot 01',
  therapeuticPhase = 'F-75 Stabilization',
  initialRecords,
  initialShiftStartTime,
  initialDietitianBatchPrepTime,
  onUpdateFeedingRecords,
}) => {
  const [defaultDurationMin] = useState<number>(35);
  const [copied, setCopied] = useState(false);
  const [showCollectiveInfo, setShowCollectiveInfo] = useState<boolean>(true);
  const [showBatchAudit, setShowBatchAudit] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'recorded' | 'shortfall'>('all');

  // Calculate estimated finish time from administration start time and duration
  function calculateFinishTime(startTimeStr: string, durationMin: number = 35): string {
    if (!startTimeStr || !startTimeStr.includes(':')) return '--:--';
    const [h, m] = startTimeStr.split(':').map(Number);
    const totalMinutes = h * 60 + (m || 0) + durationMin;
    const finishH = Math.floor(totalMinutes / 60) % 24;
    const finishM = totalMinutes % 60;
    return `${String(finishH).padStart(2, '0')}:${String(finishM).padStart(2, '0')}`;
  }

  function generateSchedule(
    feedsCount: number,
    intervalHrs: number,
    start: string,
    targetMl: number,
    durationMin: number
  ): FeedRecord[] {
    const [startH, startM] = start.split(':').map(Number);
    const result: FeedRecord[] = [];

    for (let i = 0; i < feedsCount; i++) {
      const feedHour = (startH + i * intervalHrs) % 24;
      const formattedTime = `${String(feedHour).padStart(2, '0')}:${String(startM || 0).padStart(2, '0')}`;
      result.push({
        id: i + 1,
        timeSlot: formattedTime,
        timeAdministered: formattedTime,
        timePrepared: formattedTime,
        preparedMl: targetMl,
        estimatedFinishTime: calculateFinishTime(formattedTime, durationMin),
        toleratedMl: targetMl,
        regurgitation: 'None',
        route: 'Oral (Cup/Spoon)',
        status: 'pending',
        durationMinutes: durationMin,
      });
    }
    return result;
  }

  // Safe resolution helpers checking: prop -> namespaced persistent storage -> fresh default
  const resolveShiftStart = (pid: string) => {
    if (initialShiftStartTime) return initialShiftStartTime;
    const persisted = getPersistedPatientFeeding(pid);
    if (persisted?.shiftStartTime) return persisted.shiftStartTime;
    return '06:00';
  };

  const resolveBatchTime = (pid: string) => {
    if (initialDietitianBatchPrepTime) return initialDietitianBatchPrepTime;
    const persisted = getPersistedPatientFeeding(pid);
    if (persisted?.dietitianBatchPrepTime) return persisted.dietitianBatchPrepTime;
    return '06:00';
  };

  const resolveRecords = (pid: string, shift: string): FeedRecord[] => {
    if (initialRecords && Array.isArray(initialRecords) && initialRecords.length > 0) {
      return initialRecords;
    }
    const persisted = getPersistedPatientFeeding(pid);
    if (persisted?.records && Array.isArray(persisted.records) && persisted.records.length > 0) {
      return persisted.records;
    }
    return generateSchedule(
      feedingSummary.feedsPerDay,
      feedingSummary.feedingIntervalHours,
      shift,
      feedingSummary.targetVolumePerFeed,
      defaultDurationMin
    );
  };

  const [shiftStartTime, setShiftStartTime] = useState<string>(() => resolveShiftStart(patientId));
  const [dietitianBatchPrepTime, setDietitianBatchPrepTime] = useState<string>(() => resolveBatchTime(patientId));
  const [records, setRecords] = useState<FeedRecord[]>(() => resolveRecords(patientId, resolveShiftStart(patientId)));

  const [dietitianBatchTotalMl, setDietitianBatchTotalMl] = useState<number>(feedingSummary.dailyVolume);
  const [physicalStockCheckActive, setPhysicalStockCheckActive] = useState<boolean>(false);
  const [actualMeasuredRemainingMl, setActualMeasuredRemainingMl] = useState<number>(feedingSummary.dailyVolume);

  // Sync default batch total if dailyVolume changes
  useEffect(() => {
    setDietitianBatchTotalMl(feedingSummary.dailyVolume);
    setActualMeasuredRemainingMl(feedingSummary.dailyVolume);
  }, [feedingSummary.dailyVolume]);

  // Synchronize when active patientId changes without cross-over
  const activePatientIdRef = useRef(patientId);
  useEffect(() => {
    if (patientId !== activePatientIdRef.current) {
      activePatientIdRef.current = patientId;
      const newShift = resolveShiftStart(patientId);
      const newBatch = resolveBatchTime(patientId);
      const newRecs = resolveRecords(patientId, newShift);
      setShiftStartTime(newShift);
      setDietitianBatchPrepTime(newBatch);
      setRecords(newRecs);
    }
  }, [patientId, initialRecords, initialShiftStartTime, initialDietitianBatchPrepTime]);

  // Central persistence writer
  const persistChanges = (
    updatedRecords: FeedRecord[],
    updatedShift: string = shiftStartTime,
    updatedBatch: string = dietitianBatchPrepTime
  ) => {
    if (patientId) {
      savePersistedPatientFeeding(patientId, {
        records: updatedRecords,
        shiftStartTime: updatedShift,
        dietitianBatchPrepTime: updatedBatch,
      });
      onUpdateFeedingRecords?.(patientId, updatedRecords, updatedShift, updatedBatch);
    }
  };

  const updateRecords = (updater: (prev: FeedRecord[]) => FeedRecord[]) => {
    setRecords((prev) => {
      const next = updater(prev);
      persistChanges(next);
      return next;
    });
  };

  // Reconcile if feeding target prescription changes, strictly preserving non-pending entries
  const lastSummaryRef = useRef({
    feedsPerDay: feedingSummary.feedsPerDay,
    feedingIntervalHours: feedingSummary.feedingIntervalHours,
    targetVolumePerFeed: feedingSummary.targetVolumePerFeed,
  });

  useEffect(() => {
    const last = lastSummaryRef.current;
    if (
      last.feedsPerDay === feedingSummary.feedsPerDay &&
      last.feedingIntervalHours === feedingSummary.feedingIntervalHours &&
      last.targetVolumePerFeed === feedingSummary.targetVolumePerFeed
    ) {
      return;
    }
    lastSummaryRef.current = {
      feedsPerDay: feedingSummary.feedsPerDay,
      feedingIntervalHours: feedingSummary.feedingIntervalHours,
      targetVolumePerFeed: feedingSummary.targetVolumePerFeed,
    };

    setRecords((prev) => {
      const newSchedule = generateSchedule(
        feedingSummary.feedsPerDay,
        feedingSummary.feedingIntervalHours,
        shiftStartTime,
        feedingSummary.targetVolumePerFeed,
        defaultDurationMin
      );

      const reconciled = newSchedule.map((fresh, idx) => {
        const existing = prev[idx];
        if (existing && existing.status !== 'pending') {
          return {
            ...fresh,
            timeAdministered: existing.timeAdministered || fresh.timeAdministered,
            timePrepared: existing.timeAdministered || fresh.timeAdministered,
            preparedMl: existing.preparedMl || fresh.preparedMl,
            estimatedFinishTime: existing.estimatedFinishTime || fresh.estimatedFinishTime,
            toleratedMl: existing.toleratedMl,
            regurgitation: existing.regurgitation,
            route: existing.route,
            status: existing.status,
            notes: existing.notes,
          };
        }
        return fresh;
      });

      persistChanges(reconciled);
      return reconciled;
    });
  }, [
    feedingSummary.feedsPerDay,
    feedingSummary.feedingIntervalHours,
    feedingSummary.targetVolumePerFeed,
    shiftStartTime,
    defaultDurationMin,
  ]);

  // Safe minimum volume per feed threshold (80% rule)
  const perFeedSafeThreshold = Math.round(
    feedingSummary.safeMinimumVolume / feedingSummary.feedsPerDay
  );

  // Set Dietitian prep time to current local time
  const handleSetPrepTimeToNow = () => {
    const now = new Date();
    const currentH = String(now.getHours()).padStart(2, '0');
    const currentM = String(now.getMinutes()).padStart(2, '0');
    const newTime = `${currentH}:${currentM}`;
    setDietitianBatchPrepTime(newTime);
    persistChanges(records, shiftStartTime, newTime);
  };

  const handleShiftStartTimeChange = (newTime: string) => {
    setShiftStartTime(newTime);
    persistChanges(records, newTime, dietitianBatchPrepTime);
  };

  const handleDietitianBatchPrepTimeChange = (newTime: string) => {
    setDietitianBatchPrepTime(newTime);
    persistChanges(records, shiftStartTime, newTime);
  };

  // Update administration time for a feed
  const updateTimeAdministered = (id: number, newTime: string) => {
    updateRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          timeAdministered: newTime,
          timePrepared: newTime,
          estimatedFinishTime: calculateFinishTime(newTime, r.durationMinutes || defaultDurationMin),
        };
      })
    );
  };

  // Update volume drawn from batch for this feed
  const updatePreparedMl = (id: number, val: number) => {
    updateRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          preparedMl: val,
        };
      })
    );
  };

  // Update volume tolerated
  const updateToleratedMl = (id: number, val: number) => {
    updateRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        let newStatus: FeedRecord['status'] = 'completed';
        if (r.regurgitation === 'Vomited (>50%)') {
          newStatus = 'vomited';
        } else if (val < perFeedSafeThreshold) {
          newStatus = 'shortfall';
        }
        return {
          ...r,
          toleratedMl: val,
          status: newStatus,
        };
      })
    );
  };

  // Set quick preset tolerance %
  const setQuickTolerance = (id: number, fraction: number) => {
    updateRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const volume = Math.round(r.preparedMl * fraction);
        let newStatus: FeedRecord['status'] = 'completed';
        if (fraction === 0 || r.regurgitation === 'Vomited (>50%)') {
          newStatus = r.regurgitation === 'Vomited (>50%)' ? 'vomited' : 'shortfall';
        } else if (volume < perFeedSafeThreshold) {
          newStatus = 'shortfall';
        }
        return {
          ...r,
          toleratedMl: volume,
          status: newStatus,
        };
      })
    );
  };

  // Update route
  const toggleRoute = (id: number) => {
    updateRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          route: r.route === 'Oral (Cup/Spoon)' ? 'NG Tube' : 'Oral (Cup/Spoon)',
        };
      })
    );
  };

  // Update regurgitation
  const setRegurgitation = (id: number, reg: FeedRecord['regurgitation']) => {
    updateRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        let newStatus = r.status;
        let tolerated = r.toleratedMl;
        if (reg === 'Vomited (>50%)') {
          newStatus = 'vomited';
          tolerated = Math.round(r.preparedMl * 0.2);
        } else if (r.status === 'vomited') {
          newStatus = tolerated >= perFeedSafeThreshold ? 'completed' : 'shortfall';
        }
        return {
          ...r,
          regurgitation: reg,
          toleratedMl: tolerated,
          status: newStatus,
        };
      })
    );
  };

  // Toggle feed status cycle
  const toggleFeedStatus = (id: number) => {
    updateRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (r.status === 'pending') {
          return { ...r, status: 'completed', toleratedMl: r.preparedMl };
        } else if (r.status === 'completed') {
          return {
            ...r,
            status: 'shortfall',
            toleratedMl: Math.round(r.preparedMl * 0.5),
          };
        } else if (r.status === 'shortfall') {
          return {
            ...r,
            status: 'vomited',
            regurgitation: 'Vomited (>50%)',
            toleratedMl: Math.round(r.preparedMl * 0.1),
          };
        } else {
          return {
            ...r,
            status: 'pending',
            regurgitation: 'None',
            toleratedMl: r.preparedMl,
          };
        }
      })
    );
  };

  // Update notes
  const updateNotes = (id: number, notes: string) => {
    updateRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          notes,
        };
      })
    );
  };

  const resetAll = () => {
    if (confirm('Reset entire 24-hour feeding log to initial scheduled state?')) {
      const fresh = generateSchedule(
        feedingSummary.feedsPerDay,
        feedingSummary.feedingIntervalHours,
        shiftStartTime,
        feedingSummary.targetVolumePerFeed,
        defaultDurationMin
      );
      setRecords(fresh);
      persistChanges(fresh);
      setPhysicalStockCheckActive(false);
      setActualMeasuredRemainingMl(dietitianBatchTotalMl);
    }
  };

  // ---------------------------------------------------------------------------
  // BATCH CUSTODY & STOCK AUDIT CALCULATIONS
  // ---------------------------------------------------------------------------
  const recordedFeeds = records.filter((r) => r.status !== 'pending');
  const completedCount = records.filter((r) => r.status === 'completed').length;
  const shortfallCount = records.filter((r) => r.status === 'shortfall').length;
  const vomitedCount = records.filter((r) => r.status === 'vomited' || r.regurgitation === 'Vomited (>50%)').length;
  const ngFeedCount = records.filter((r) => r.status !== 'pending' && r.route === 'NG Tube').length;

  // Cumulative volume drawn/dispensed from the 24h batch by ward staff
  const totalVolumeDispensedFromBatch = recordedFeeds.reduce((acc, curr) => acc + curr.preparedMl, 0);
  const totalTolerated = recordedFeeds.reduce((acc, curr) => acc + curr.toleratedMl, 0);
  const tolerancePercentage = totalVolumeDispensedFromBatch > 0 ? Math.round((totalTolerated / totalVolumeDispensedFromBatch) * 100) : 0;
  const dailyTargetPercentage = Math.round((totalTolerated / feedingSummary.dailyVolume) * 100);

  // Expected batch stock remaining in the ward flask/jug
  const expectedStockRemaining = Math.max(0, dietitianBatchTotalMl - totalVolumeDispensedFromBatch);
  const remainingFeedsCount = records.filter((r) => r.status === 'pending').length;

  // Volume variance if physical stock was audited
  const stockDiscrepancyMl = physicalStockCheckActive
    ? actualMeasuredRemainingMl - expectedStockRemaining
    : 0;

  // ---------------------------------------------------------------------------
  // COLLECTIVE DIAGNOSTIC INTELLIGENCE
  // ---------------------------------------------------------------------------
  let consecutiveShortfallCount = 0;
  let ngTubeMandatoryTriggered = false;

  for (const r of recordedFeeds) {
    const isBelowSafeMin = r.toleratedMl < perFeedSafeThreshold || r.status === 'vomited';
    if (isBelowSafeMin) {
      consecutiveShortfallCount++;
      if (consecutiveShortfallCount >= 2) {
        ngTubeMandatoryTriggered = true;
      }
    } else {
      consecutiveShortfallCount = 0;
    }
  }

  type CollectiveStatus = 'critical_ng' | 'vomiting_intolerance' | 'caution_shortfall' | 'optimal_progression' | 'pending';

  let collectiveStatus: CollectiveStatus = 'pending';
  if (ngTubeMandatoryTriggered) {
    collectiveStatus = 'critical_ng';
  } else if (vomitedCount >= 2) {
    collectiveStatus = 'vomiting_intolerance';
  } else if (shortfallCount > 0 || consecutiveShortfallCount === 1) {
    collectiveStatus = 'caution_shortfall';
  } else if (completedCount >= 3) {
    collectiveStatus = 'optimal_progression';
  }

  // Copy clinical handover note including Batch Audit details
  const copyHandoverSummary = () => {
    const reportText = `PEDICAL INPATIENT 24-HOUR FEEDING LOG & BATCH RECONCILIATION
Patient: ${cotNumber} - ${patientName} (${patientWeight} kg)
Phase: ${therapeuticPhase}
Prescribed Regimen: ${feedingSummary.targetVolumePerFeed} mL q${feedingSummary.feedingIntervalHours}h (${feedingSummary.feedsPerDay} feeds/day)
24h Prescribed Target: ${feedingSummary.dailyVolume} mL | Safe 80% Minimum: ${feedingSummary.safeMinimumVolume} mL

DIETITIAN 24-HOUR BATCH CUSTODY AUDIT:
- Batch Prepared At: ${dietitianBatchPrepTime} (Dietitian / Central Kitchen)
- Total Batch Volume Prepared: ${dietitianBatchTotalMl} mL
- Volume Dispensed & Administered: ${totalVolumeDispensedFromBatch} mL (${recordedFeeds.length} feeds logged)
- Expected In-Ward Supply Remaining: ${expectedStockRemaining} mL (${remainingFeedsCount} feeds remaining)
${physicalStockCheckActive ? `- Physical Ward Stock Audit: ${actualMeasuredRemainingMl} mL measured (${stockDiscrepancyMl < 0 ? `Unaccounted Deficit of ${Math.abs(stockDiscrepancyMl)} mL` : stockDiscrepancyMl > 0 ? `Surplus of ${stockDiscrepancyMl} mL` : 'Balanced (0 mL discrepancy)'})` : '- Physical Stock Status: Unaudited'}

FEEDING TOLERANCE & INTAKE:
- Total Volume Tolerated by Child: ${totalTolerated} mL (${tolerancePercentage}% retention)
- Feeds Completed: ${completedCount} | Shortfalls: ${shortfallCount} | Vomited: ${vomitedCount}
- Route: ${recordedFeeds.length - ngFeedCount} Oral / ${ngFeedCount} NG Tube

COLLECTIVE CLINICAL ASSESSMENT:
${
  collectiveStatus === 'critical_ng'
    ? 'CRITICAL ALERT: 2+ consecutive feed shortfalls (<80% intake). As per WHO 2023 Guidelines, child cannot maintain normoglycemia orally. Insert 6Fr/8Fr NG tube immediately.'
    : collectiveStatus === 'vomiting_intolerance'
    ? 'HIGH RISK: Recurrent vomiting detected. Evaluate for abdominal distension and paralytic ileus. Slow feeding down or initiate continuous gravity NG drip.'
    : collectiveStatus === 'caution_shortfall'
    ? 'CAUTION: Single shortfall logged. Monitor upcoming feed closely; failure to achieve >= 80% mandates NG tube placement.'
    : collectiveStatus === 'optimal_progression'
    ? 'OPTIMAL TOLERANCE: Caloric intake on track. Minimal risk of hypoglycemia. If sustained for 24-48h with resolved edema, prepare for Transition Phase appetite test.'
    : 'Awaiting further feed logs to determine 24-hour tolerance trajectory.'
}
Report Generated: ${new Date().toLocaleString()}`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter records
  const filteredRecords = records.filter((r) => {
    if (selectedFilter === 'recorded') return r.status !== 'pending';
    if (selectedFilter === 'shortfall') return r.status === 'shortfall' || r.status === 'vomited';
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5">
      {/* 1. Header Bar: Identity & Global Shift Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
              <Droplets className="w-4 h-4" />
            </div>
            <h2 className="font-serif text-xl sm:text-2xl text-slate-900 tracking-tight font-normal">
              Bedside feeding schedule
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-10.5">
            {cotNumber}: <strong className="text-slate-800">{patientName}</strong> ({patientWeight} kg) &middot;{' '}
            <span className="font-semibold text-blue-700">{therapeuticPhase}</span> &middot; Target:{' '}
            <strong className="text-slate-900">{feedingSummary.targetVolumePerFeed} mL</strong> q
            {feedingSummary.feedingIntervalHours}h ({feedingSummary.feedsPerDay} feeds/day)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Shift Start Picker */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Shift:</span>
            <input
              type="time"
              value={shiftStartTime}
              onChange={(e) => handleShiftStartTimeChange(e.target.value)}
              className="px-1.5 py-0.5 rounded border border-slate-300 bg-white font-bold text-xs"
            />
          </div>

          {/* Copy Handover */}
          <button
            type="button"
            onClick={copyHandoverSummary}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold min-h-[36px] transition-colors"
            title="Copy clinical handover note"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Handover'}</span>
          </button>

          {/* Reset Schedule */}
          <button
            type="button"
            onClick={resetAll}
            className="p-2 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
            title="Reset 24h log"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. DIETITIAN 24-HOUR BATCH PREPARATION & STOCK AUDIT PANEL */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg">
              <Beaker className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                24h batch custody &amp; audit
              </h3>
              <p className="text-[11px] text-slate-500">
                Batch prep time and ward stock tracking
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowBatchAudit(!showBatchAudit)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded"
          >
            {showBatchAudit ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showBatchAudit && (
          <div className="space-y-3 pt-1">
            {/* Batch Preparation Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Batch Prep Time */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px]">
                  <span className="flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-blue-600" /> Batch Prepared At:
                  </span>
                  <button
                    type="button"
                    onClick={handleSetPrepTimeToNow}
                    className="text-[10px] text-blue-700 hover:underline font-bold"
                  >
                    Set to Now
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={dietitianBatchPrepTime}
                    onChange={(e) => handleDietitianBatchPrepTimeChange(e.target.value)}
                    className="px-2 py-1 border border-slate-300 rounded font-bold text-slate-900 bg-slate-50 text-sm focus:bg-white"
                  />
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Active 24h Batch
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Reconstituted therapeutic milk shelf life: 24h chilled
                </div>
              </div>

              {/* Total 24h Volume Prepared by Dietitian */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="text-slate-500 font-semibold text-[11px]">
                  Total Batch Prepared:
                </div>
                <div className="flex items-center gap-2">
                  <ClinicalNumberInput
                    value={dietitianBatchTotalMl}
                    onChange={(val) => setDietitianBatchTotalMl(val)}
                    min={100}
                    max={3000}
                    isInteger={true}
                    unit="mL"
                    className="w-24 font-bold text-slate-900 text-sm"
                  />
                  <span className="text-[11px] text-slate-500">
                    ({feedingSummary.feedsPerDay} &times; {feedingSummary.targetVolumePerFeed} mL)
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Prepared by Dietitian / Nutrition Unit
                </div>
              </div>

              {/* Expected Stock Remaining in Ward Supply */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="text-slate-500 font-semibold text-[11px]">
                  Expected In Ward Supply:
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-slate-900">
                    {expectedStockRemaining}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">mL remaining</span>
                </div>
                <div className="text-[11px] font-medium text-slate-600 flex items-center justify-between">
                  <span>{totalVolumeDispensedFromBatch} mL dispensed</span>
                  <span className="font-semibold text-blue-700">{remainingFeedsCount} feeds left</span>
                </div>
              </div>
            </div>

            {/* Batch Stock Meter */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-[11px] font-semibold">
                <span className="text-slate-700">
                  Batch Volume Distribution (Prepared at {dietitianBatchPrepTime})
                </span>
                <span className="text-slate-500">
                  {totalVolumeDispensedFromBatch} / {dietitianBatchTotalMl} mL dispensed
                </span>
              </div>

              {/* Multi-segment stock bar */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      dietitianBatchTotalMl > 0 ? (totalVolumeDispensedFromBatch / dietitianBatchTotalMl) * 100 : 0
                    )}%`,
                  }}
                  title={`Dispensed to patient: ${totalVolumeDispensedFromBatch} mL`}
                />
                <div
                  className="bg-emerald-400 h-full transition-all duration-300 opacity-80"
                  style={{
                    width: `${Math.max(
                      0,
                      dietitianBatchTotalMl > 0 ? (expectedStockRemaining / dietitianBatchTotalMl) * 100 : 0
                    )}%`,
                  }}
                  title={`Remaining in ward container: ${expectedStockRemaining} mL`}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                  Dispensed &amp; Logged: {totalVolumeDispensedFromBatch} mL
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  Expected In Flask: {expectedStockRemaining} mL
                </span>
              </div>
            </div>

            {/* Physical Stock Audit Verification */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Physical Stock Audit (Verification Check)
                </div>
                <div className="text-[11px] text-slate-500">
                  Verify actual volume remaining in the ward flask against expected {expectedStockRemaining} mL.
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {!physicalStockCheckActive ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPhysicalStockCheckActive(true);
                      setActualMeasuredRemainingMl(expectedStockRemaining);
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-slate-700 text-xs min-h-[36px] shadow-xs"
                  >
                    Conduct Stock Audit
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-600">Actual in flask:</span>
                    <ClinicalNumberInput
                      value={actualMeasuredRemainingMl}
                      onChange={(val) => setActualMeasuredRemainingMl(val)}
                      min={0}
                      max={dietitianBatchTotalMl}
                      isInteger={true}
                      unit="mL"
                      className="w-20 font-bold text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setPhysicalStockCheckActive(false)}
                      className="text-[10px] text-slate-500 hover:text-slate-800 underline ml-1"
                    >
                      Clear Audit
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Discrepancy Warning if Ward Container Is Emptied Prematurely */}
            {physicalStockCheckActive && stockDiscrepancyMl < 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-900">
                    Volume Discrepancy Alert: {Math.abs(stockDiscrepancyMl)} mL Unaccounted For
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Dietitian prepared <strong>{dietitianBatchTotalMl} mL</strong> at{' '}
                    <strong>{dietitianBatchPrepTime}</strong>. Only{' '}
                    <strong>{totalVolumeDispensedFromBatch} mL</strong> has been logged across{' '}
                    {recordedFeeds.length} feeds. The expected remaining balance is{' '}
                    <strong>{expectedStockRemaining} mL</strong>, but physical stock is recorded as{' '}
                    <strong>{actualMeasuredRemainingMl} mL</strong>. Check for unlogged feeds, spillage,
                    or unauthorized discarding.
                  </p>
                </div>
              </div>
            )}

            {physicalStockCheckActive && stockDiscrepancyMl === 0 && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium text-[11px]">
                  Physical stock matches expected balance exactly ({expectedStockRemaining} mL remaining).
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. "WHAT THEY COLLECTIVELY MEAN" CLINICAL INTELLIGENCE PANEL */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowCollectiveInfo(!showCollectiveInfo)}
            className="flex items-center gap-2 text-xs font-bold text-slate-900 hover:text-blue-700 group"
          >
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="uppercase tracking-wider text-[11px]">
              What These Logged Feeds Collectively Mean (Clinical Synthesis)
            </span>
            {showCollectiveInfo ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700" />
            )}
          </button>
          <span className="text-[11px] font-semibold text-slate-500">
            {recordedFeeds.length} of {feedingSummary.feedsPerDay} Feeds Administered
          </span>
        </div>

        {showCollectiveInfo && (
          <div className="space-y-3">
            {/* 4 Diagnostic Status KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Card 1: 24h Fluid Progress */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Total Tolerated Volume
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-slate-900">{totalTolerated}</span>
                  <span className="text-xs font-semibold text-slate-500">
                    / {feedingSummary.dailyVolume} mL
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      dailyTargetPercentage >= 80
                        ? 'bg-emerald-600'
                        : dailyTargetPercentage >= 50
                        ? 'bg-blue-600'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, dailyTargetPercentage)}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between font-medium">
                  <span>Target: {feedingSummary.dailyVolume} mL</span>
                  <span>{dailyTargetPercentage}%</span>
                </div>
              </div>

              {/* Card 2: Retention & Tolerance Rate */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Tolerance &amp; Retention
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-xl font-bold ${
                      tolerancePercentage >= 85
                        ? 'text-emerald-700'
                        : tolerancePercentage >= 70
                        ? 'text-amber-700'
                        : 'text-red-700'
                    }`}
                  >
                    {totalVolumeDispensedFromBatch > 0 ? `${tolerancePercentage}%` : '--'}
                  </span>
                  <span className="text-xs font-medium text-slate-500">retention</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  {completedCount} full &middot; {shortfallCount} partial &middot;{' '}
                  <span className={vomitedCount > 0 ? 'text-red-600 font-bold' : ''}>
                    {vomitedCount} vomited
                  </span>
                </div>
              </div>

              {/* Card 3: Safe Minimum Threshold Compliance (80%) */}
              <div
                className={`p-3.5 rounded-xl border space-y-1 ${
                  totalTolerated >= feedingSummary.safeMinimumVolume
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                }`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider opacity-75">
                  Safe Minimum Standard (80%)
                </div>
                <div className="text-xl font-bold">
                  {feedingSummary.safeMinimumVolume} <span className="text-xs font-normal">mL/day</span>
                </div>
                <div className="text-[11px] font-medium leading-tight">
                  Per feed cutoff: <strong>{perFeedSafeThreshold} mL</strong> (Shortfalls below this
                  count toward NG trigger)
                </div>
              </div>

              {/* Card 4: Consecutive Shortfall & NG Tracker */}
              <div
                className={`p-3.5 rounded-xl border space-y-1 ${
                  ngTubeMandatoryTriggered
                    ? 'bg-red-50 border-red-300 text-red-950'
                    : consecutiveShortfallCount === 1
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                }`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider opacity-75">
                  Consecutive Shortfalls
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold">
                    {consecutiveShortfallCount}
                  </span>
                  <span className="text-xs font-semibold opacity-75">/ 2 max allowed</span>
                </div>
                <div className="text-[11px] font-bold">
                  {ngTubeMandatoryTriggered
                    ? 'NG Tube Triggered (>= 2)'
                    : consecutiveShortfallCount === 1
                    ? '1 Shortfall - Watch Next'
                    : '0 Shortfalls - Stable'}
                </div>
              </div>
            </div>

            {/* Comprehensive Synthesis Directives */}
            {collectiveStatus === 'critical_ng' && (
              <div className="p-4 rounded-xl bg-red-50 border-2 border-red-400 text-red-950 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-red-900 uppercase tracking-wide text-xs">
                    Clinical Directive: Nasogastric (NG) Tube Insertion Required Immediately
                  </div>
                  <p className="leading-relaxed text-red-900">
                    <strong>What this intake pattern collectively means:</strong> The child has failed
                    to consume the safe minimum intake ({perFeedSafeThreshold} mL) for 2 consecutive
                    feeds. Severely malnourished children have severely depleted liver glycogen and
                    cannot fast. Repeated feed shortfalls rapidly trigger fatal hypoglycemia and
                    hypothermia. Per WHO 2023 Guidelines, transition to an NG tube immediately.
                  </p>
                </div>
              </div>
            )}

            {collectiveStatus === 'vomiting_intolerance' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-amber-900 uppercase tracking-wide text-xs">
                    Clinical Directive: Feed Intolerance / Paralytic Ileus Alert
                  </div>
                  <p className="leading-relaxed text-amber-900">
                    <strong>What this intake pattern collectively means:</strong> Multiple vomiting
                    episodes have occurred. Malnourished gut mucosa may suffer from delayed gastric
                    emptying or hypokalemic paralytic ileus. Do not force oral feeds. Check for
                    abdominal distension, verify serum potassium/phosphate, and consider switching to
                    2-hourly smaller volumes or a slow gravity drip via NG tube.
                  </p>
                </div>
              </div>
            )}

            {collectiveStatus === 'caution_shortfall' && (
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-amber-900 uppercase tracking-wide text-xs">
                    Clinical Note: 1 Feed Shortfall Logged &middot; Next Feed Critical
                  </div>
                  <p className="leading-relaxed text-amber-900">
                    <strong>What this intake pattern collectively means:</strong> The child missed the
                    minimum target on one feed ({perFeedSafeThreshold} mL). If the upcoming feed also
                    results in a shortfall, the 2-feed safety rule will be breached and an NG tube will
                    become mandatory. Warm the feed, encourage the mother/caregiver, and feed slowly
                    with a cup and spoon.
                  </p>
                </div>
              </div>
            )}

            {collectiveStatus === 'optimal_progression' && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-emerald-900 uppercase tracking-wide text-xs">
                    Clinical Assessment: Optimal Caloric &amp; Volume Tolerance
                  </div>
                  <p className="leading-relaxed text-emerald-900">
                    <strong>What this intake pattern collectively means:</strong> The child is
                    retaining feeds consistently ({totalTolerated} mL tolerated so far) with zero
                    consecutive shortfalls and no vomiting. Metabolism is stabilizing, and hypoglycemia
                    risk is minimized. When this stable oral intake is maintained for 24–48 hours with
                    reduction in edema, the child is ready for the Transition Phase appetite test.
                  </p>
                </div>
              </div>
            )}

            {collectiveStatus === 'pending' && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Log administered feeds below. The clinical diagnostic engine will evaluate volume
                  retention, duration, remaining batch stock, and NG thresholds automatically.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. LOG CHART CONTROLS & FILTERS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-semibold mr-1">Filter:</span>
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedFilter === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Feeds ({records.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('recorded')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedFilter === 'recorded'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Administered ({recordedFeeds.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('shortfall')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedFilter === 'shortfall'
                ? 'bg-red-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Shortfalls / Vomit ({shortfallCount + vomitedCount})
          </button>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Tolerated
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Shortfall (&lt;
            {perFeedSafeThreshold} mL)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Vomited
          </span>
        </div>
      </div>

      {/* 5. INPATIENT FEEDING TIMELINE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {filteredRecords.map((record) => {
          const isDone = record.status === 'completed';
          const isShortfall = record.status === 'shortfall';
          const isVomited = record.status === 'vomited';

          const feedPercent =
            record.preparedMl > 0
              ? Math.min(100, Math.round((record.toleratedMl / record.preparedMl) * 100))
              : 0;

          return (
            <div
              key={record.id}
              className={`p-4 rounded-xl border transition-all text-xs flex flex-col justify-between space-y-3 ${
                isVomited
                  ? 'bg-red-50/90 border-red-300 shadow-xs'
                  : isShortfall
                  ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                  : isDone
                  ? 'bg-emerald-50/70 border-emerald-200 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Card Header: Slot & Status Badge */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[11px]">
                    Feed {record.id}
                  </span>
                  <span className="text-sm">{record.timeSlot}</span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : isShortfall
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : isVomited
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {isDone ? 'Administered' : isShortfall ? 'Shortfall' : isVomited ? 'Vomited' : 'Pending'}
                </span>
              </div>

              {/* Timing Details: Time Administered by Nurse & Estimated Finish Time */}
              <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> Administered At:
                  </span>
                  <input
                    type="time"
                    value={record.timeAdministered}
                    onChange={(e) => updateTimeAdministered(record.id, e.target.value)}
                    className="px-1.5 py-0.5 text-xs font-bold border border-slate-300 rounded bg-white text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Timer className="w-3 h-3 text-blue-500" /> Est. Finish Time:
                  </span>
                  <strong className="text-blue-900 font-bold">
                    {record.estimatedFinishTime}
                  </strong>
                </div>
                <div className="text-[10px] text-slate-400 italic">
                  WHO standard: 30–40 min feeding window to prevent hypothermia &amp; exhaustion
                </div>
              </div>

              {/* Feed Volume: Portion Dispensed from 24h Batch vs Child Tolerated */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold text-xs">Dispensed Dose:</span>
                  <div className="flex items-center gap-1">
                    <ClinicalNumberInput
                      value={record.preparedMl}
                      onChange={(val) => updatePreparedMl(record.id, val)}
                      min={0}
                      max={500}
                      isInteger={true}
                      unit="mL"
                      className="w-20 text-right font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-bold text-xs">Child Tolerated:</span>
                  <div className="flex items-center gap-1">
                    <ClinicalNumberInput
                      value={record.toleratedMl}
                      onChange={(val) => updateToleratedMl(record.id, val)}
                      min={0}
                      max={record.preparedMl * 1.5}
                      isInteger={true}
                      unit="mL"
                      className="w-24 text-right font-bold text-sm"
                    />
                  </div>
                </div>

                {/* Quick Presets: 100%, 75%, 50%, 0% */}
                <div className="grid grid-cols-4 gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setQuickTolerance(record.id, 1.0)}
                    className="py-1 px-1 text-[10px] font-bold rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                    title="Child drank 100% full volume"
                  >
                    100%
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickTolerance(record.id, 0.75)}
                    className="py-1 px-1 text-[10px] font-bold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="75% volume"
                  >
                    75%
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickTolerance(record.id, 0.5)}
                    className="py-1 px-1 text-[10px] font-bold rounded bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors"
                    title="50% volume (Borderline)"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickTolerance(record.id, 0)}
                    className="py-1 px-1 text-[10px] font-bold rounded bg-red-100 hover:bg-red-200 text-red-800 transition-colors"
                    title="0% refused"
                  >
                    0 mL
                  </button>
                </div>
              </div>

              {/* Route & Regurgitation Selectors */}
              <div className="pt-2 border-t border-slate-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">Route:</span>
                  <button
                    type="button"
                    onClick={() => toggleRoute(record.id)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                      record.route === 'NG Tube'
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {record.route}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">Vomiting:</span>
                  <select
                    value={record.regurgitation}
                    onChange={(e) =>
                      setRegurgitation(record.id, e.target.value as FeedRecord['regurgitation'])
                    }
                    className={`px-2 py-1 rounded text-xs font-semibold border ${
                      record.regurgitation === 'Vomited (>50%)'
                        ? 'bg-red-100 border-red-300 text-red-900 font-bold'
                        : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  >
                    <option value="None">None (Retained)</option>
                    <option value="Spit-up (<5 mL)">Minor Spit-up (&lt;5 mL)</option>
                    <option value="Vomited (>50%)">Vomited (&gt;50% lost)</option>
                  </select>
                </div>

                {/* Bedside Tolerance / Clinical Note */}
                <div className="pt-0.5">
                  <input
                    type="text"
                    value={record.notes || ''}
                    onChange={(e) => updateNotes(record.id, e.target.value)}
                    placeholder="Tolerance note (e.g., slow feeder, spit-up)..."
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Status Action Button */}
              <button
                type="button"
                onClick={() => toggleFeedStatus(record.id)}
                className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 min-h-[44px] transition-colors ${
                  isDone
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : isShortfall
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                    : isVomited
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                    : 'bg-blue-700 hover:bg-blue-800 text-white shadow-xs'
                }`}
              >
                {isDone ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Administered ({feedPercent}%)</span>
                  </>
                ) : isShortfall ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span>Shortfall Logged ({record.toleratedMl} mL)</span>
                  </>
                ) : isVomited ? (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span>Vomited Feed</span>
                  </>
                ) : (
                  <span>Record Administration</span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* 6. Footer Summary Guidance */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>WHO 2023 Protocol:</strong> 24h therapeutic milk batch prepared by the dietitian
            must be kept refrigerated and used within 24h. Each feed must be consumed within 30–40 min.
            Failure to tolerate $\ge 80\%$ volume over 2 consecutive feeds mandates an NG tube.
          </span>
        </div>
        <button
          type="button"
          onClick={copyHandoverSummary}
          className="text-blue-700 hover:underline font-bold shrink-0 self-start sm:self-auto"
        >
          Copy Shift Summary &rarr;
        </button>
      </div>
    </div>
  );
};
