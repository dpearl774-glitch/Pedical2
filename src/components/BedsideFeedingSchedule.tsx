import React, { useState } from 'react';
import { FeedingTargetSummary } from '../utils/clinicalCalculations';
import { Check, AlertCircle, RefreshCw } from 'lucide-react';

interface BedsideFeedingScheduleProps {
  feedingSummary: FeedingTargetSummary;
  patientWeight: number;
}

interface FeedRecord {
  id: number;
  timeSlot: string;
  targetMl: number;
  givenMl: number;
  status: 'pending' | 'completed' | 'shortfall';
}

export const BedsideFeedingSchedule: React.FC<BedsideFeedingScheduleProps> = ({
  feedingSummary,
  patientWeight,
}) => {
  const [startTime, setStartTime] = useState<string>('06:00');
  const [records, setRecords] = useState<FeedRecord[]>(() =>
    generateSchedule(
      feedingSummary.feedsPerDay,
      feedingSummary.feedingIntervalHours,
      '06:00',
      feedingSummary.targetVolumePerFeed
    )
  );

  React.useEffect(() => {
    setRecords(
      generateSchedule(
        feedingSummary.feedsPerDay,
        feedingSummary.feedingIntervalHours,
        startTime,
        feedingSummary.targetVolumePerFeed
      )
    );
  }, [
    feedingSummary.feedsPerDay,
    feedingSummary.feedingIntervalHours,
    feedingSummary.targetVolumePerFeed,
    startTime,
  ]);

  function generateSchedule(
    feedsCount: number,
    intervalHrs: number,
    start: string,
    targetMl: number
  ): FeedRecord[] {
    const [startH, startM] = start.split(':').map(Number);
    const result: FeedRecord[] = [];

    for (let i = 0; i < feedsCount; i++) {
      const feedHour = (startH + i * intervalHrs) % 24;
      const formattedTime = `${String(feedHour).padStart(2, '0')}:${String(startM || 0).padStart(2, '0')}`;
      result.push({
        id: i + 1,
        timeSlot: formattedTime,
        targetMl,
        givenMl: targetMl,
        status: 'pending',
      });
    }
    return result;
  }

  const toggleFeedStatus = (id: number) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (r.status === 'pending') {
          return { ...r, status: 'completed' };
        } else if (r.status === 'completed') {
          return { ...r, status: 'shortfall', givenMl: Math.round(r.targetMl * 0.6) };
        } else {
          return { ...r, status: 'pending', givenMl: r.targetMl };
        }
      })
    );
  };

  const updateGivenMl = (id: number, val: number) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const newStatus = val >= r.targetMl * 0.8 ? 'completed' : 'shortfall';
        return { ...r, givenMl: val, status: newStatus };
      })
    );
  };

  const resetAll = () => {
    setRecords(
      generateSchedule(
        feedingSummary.feedsPerDay,
        feedingSummary.feedingIntervalHours,
        startTime,
        feedingSummary.targetVolumePerFeed
      )
    );
  };

  const perFeedThreshold = Math.round(
    feedingSummary.safeMinimumVolume / feedingSummary.feedsPerDay
  );

  let consecutiveShortfallCount = 0;
  let ngTubeAlertTriggered = false;

  for (const r of records) {
    if (r.status !== 'pending' && r.givenMl < perFeedThreshold) {
      consecutiveShortfallCount++;
      if (consecutiveShortfallCount >= 2) {
        ngTubeAlertTriggered = true;
      }
    } else if (r.status === 'completed') {
      consecutiveShortfallCount = 0;
    }
  }

  const totalAdministered = records
    .filter((r) => r.status !== 'pending')
    .reduce((acc, curr) => acc + curr.givenMl, 0);

  const completedCount = records.filter((r) => r.status === 'completed').length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Bedside 24-Hour Feeding Log &amp; NG Monitor
          </h3>
          <div className="text-xs text-slate-500 mt-0.5">
            Administer {feedingSummary.targetVolumePerFeed} mL every{' '}
            {feedingSummary.feedingIntervalHours}h &middot; Threshold: &lt; {perFeedThreshold} mL for
            2 consecutive feeds
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Start:</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="text-xs font-mono font-semibold border border-slate-300 rounded-md px-2 py-1 bg-slate-50 h-8"
            />
          </div>
          <button
            onClick={resetAll}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Reset schedule"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Critical NG Alert */}
      {ngTubeAlertTriggered && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-950 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold uppercase tracking-wider text-rose-900">
              Safety Directive: 2 Consecutive Feed Shortfalls Detected
            </div>
            <div className="mt-0.5">
              Child consumed under the minimum intake ({perFeedThreshold} mL) for 2 consecutive
              feeds. Evaluate for Nasogastric (NG) tube placement immediately.
            </div>
          </div>
        </div>
      )}

      {/* Grid of feed slots */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {records.map((record) => {
          const isShortfall =
            record.status === 'shortfall' ||
            (record.status !== 'pending' && record.givenMl < perFeedThreshold);
          const isDone = record.status === 'completed';

          return (
            <div
              key={record.id}
              className={`p-3 rounded-lg border text-xs transition-all ${
                isShortfall
                  ? 'bg-rose-50/70 border-rose-300'
                  : isDone
                  ? 'bg-emerald-50/60 border-emerald-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between font-mono font-bold text-slate-700 mb-1">
                <span className="text-[11px] text-slate-500">Feed {record.id}</span>
                <span className="text-slate-900">{record.timeSlot}</span>
              </div>

              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[11px] text-slate-500">Target:</span>
                <span className="font-mono font-bold text-slate-900">{record.targetMl} mL</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500">Vol:</span>
                  <input
                    type="number"
                    value={record.givenMl}
                    onChange={(e) => updateGivenMl(record.id, parseInt(e.target.value) || 0)}
                    className="w-full text-right font-mono font-bold text-xs border border-slate-300 rounded px-1.5 py-1 bg-white h-7"
                  />
                  <span className="text-[10px] text-slate-500">mL</span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleFeedStatus(record.id)}
                  className={`w-full py-1.5 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 min-h-[32px] transition-colors ${
                    isDone
                      ? 'bg-emerald-700 text-white'
                      : isShortfall
                      ? 'bg-rose-700 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {isDone ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Full</span>
                    </>
                  ) : isShortfall ? (
                    <>
                      <AlertCircle className="w-3 h-3" />
                      <span>Shortfall</span>
                    </>
                  ) : (
                    <span>Record</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress & Intake Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-slate-500">Total Administered: </span>
            <strong className="font-mono text-slate-900">{totalAdministered} mL</strong>
            <span className="text-slate-400 font-mono"> / {feedingSummary.dailyVolume} mL</span>
          </div>
          <div>
            <span className="text-slate-500">Completed Feeds: </span>
            <strong className="font-mono text-slate-900">
              {completedCount} / {feedingSummary.feedsPerDay}
            </strong>
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          Tap button to cycle: Pending &rarr; Completed &rarr; Shortfall
        </div>
      </div>
    </div>
  );
};
