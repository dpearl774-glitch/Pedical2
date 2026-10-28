import React, { useState, useEffect, useMemo } from 'react';
import { WardPatient } from '../data/wardPatients';
import { PediatricReminder } from '../utils/reminders';
import { IDBStats, getIndexedDBStats } from '../utils/indexedDBStorage';
import { usePWA } from '../hooks/usePWA';
import {
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Calendar,
  Bed,
  Droplets,
  AlertTriangle,
  Clock,
  Shuffle,
  ChevronRight,
  ArrowRight,
  Download,
  Database,
  Wifi,
  Sparkles,
  HeartPulse,
  Activity,
  Plus,
  Scale,
  Beaker,
  ShieldCheck,
  Check,
  FileText,
} from 'lucide-react';

interface ClinicalTip {
  id: number;
  category: 'Fluid Safety' | 'Infants Under 6m' | 'Transition Phase' | 'Electrolytes' | 'Anthropometry' | 'Feeding Protocol';
  title: string;
  body: string;
  source: string;
}

const CLINICAL_TIPS: ClinicalTip[] = [
  {
    id: 1,
    category: 'Fluid Safety',
    title: 'Zero IV Fluids for Malnourished Children Without Shock',
    body: 'Never administer intravenous fluids to a child with severe acute malnutrition unless they are in confirmed hypovolaemic shock. Rehydration must be given orally or via nasogastric tube using ReSoMal to prevent fatal cardiac volume overload.',
    source: 'WHO 2023 Acute Malnutrition Guideline',
  },
  {
    id: 2,
    category: 'Infants Under 6m',
    title: 'Prioritize Exclusive Breastfeeding Assessment',
    body: 'For infants under six months with wasting or nutritional oedema, establish maternal lactation capacity, latch, and effective suckling before supplemental milk. Never prescribe older-child RUTF or adult MUAC cutoffs.',
    source: 'WHO 2023 Guideline Recommendation 4.1',
  },
  {
    id: 3,
    category: 'Electrolytes',
    title: 'No Iron During Phase 1 Stabilization',
    body: 'Do not administer iron supplements during the initial stabilization phase. Free circulating iron promotes bacterial proliferation and aggravates systemic oxidative stress until tissue protein repair is well underway.',
    source: 'WHO Inpatient Management Protocols',
  },
  {
    id: 4,
    category: 'Feeding Protocol',
    title: 'Frequent 2-Hour Feeds for Critical Cases',
    body: 'Children with severe hypoglycemia risk, profound lethargy, or extreme hypothermia should receive F-75 feeds every 2 hours day and night. Night feeds prevent fatal nocturnal hypoglycemia.',
    source: 'Ghana Health Service IMAM Protocol',
  },
  {
    id: 5,
    category: 'Fluid Safety',
    title: 'Strict F-75 Volume Cap (100 mL/kg/day)',
    body: 'In Phase 1 Stabilization, dietary energy must not exceed 100 kcal/kg/day and fluid must remain capped at 100–130 mL/kg/day (100 mL/kg/day for severe oedema +++). Excess energy or fluid triggers refeeding syndrome.',
    source: 'WHO Inpatient Management Standards',
  },
  {
    id: 6,
    category: 'Anthropometry',
    title: 'Supine Length for Children Under 87 cm',
    body: 'Measure recumbent length for children younger than 24 months or under 87 cm. If standing height is taken instead, subtract 0.7 cm to ensure accurate Weight-for-Length z-score interpretation against WHO standards.',
    source: 'WHO Child Growth Standards',
  },
  {
    id: 7,
    category: 'Electrolytes',
    title: 'High Potassium, Low Sodium Formula Balance',
    body: 'Malnourished cellular pumps leak potassium and retain intracellular sodium. Standard oral rehydration salts (ORS) contain excessive sodium; always use ReSoMal or add CMV mineral mix to therapeutic milk.',
    source: 'WHO CMAM Clinical Technical Notes',
  },
  {
    id: 8,
    category: 'Transition Phase',
    title: '48-Hour F-100 Transition Tolerance Period',
    body: 'When transitioning from F-75 to F-100, maintain the identical volume (100–130 mL/kg/day) for 48 hours to evaluate gut and cardiovascular tolerance before advancing to free-demand rehabilitation.',
    source: 'WHO Clinical Nutrition Training Course',
  },
];

import { getClinicianFirstName } from '../utils/appSettings';

export interface TodayDashboardProps {
  patients: WardPatient[];
  activePatient?: WardPatient;
  facilityName?: string;
  clinicianName?: string;
  reminders: PediatricReminder[];
  onNavigate: (tabId: string, patientId?: string) => void;
  onAdmitNewChild: () => void;
  onOpenReminders: () => void;
}

export const TodayDashboard: React.FC<TodayDashboardProps> = ({
  patients,
  activePatient,
  facilityName = 'Pediatric Nutrition Unit',
  clinicianName = '',
  reminders,
  onNavigate,
  onAdmitNewChild,
  onOpenReminders,
}) => {
  const pwa = usePWA();
  const [idbStats, setIdbStats] = useState<IDBStats | null>(null);

  // Tip rotation state
  const [currentTipIndex, setCurrentTipIndex] = useState<number>(() =>
    Math.floor(Math.random() * CLINICAL_TIPS.length)
  );
  const [tipProgress, setTipProgress] = useState<number>(0);
  const [isTipPaused, setIsTipPaused] = useState<boolean>(false);

  // Refresh IndexedDB statistics
  useEffect(() => {
    let mounted = true;
    getIndexedDBStats().then((stats) => {
      if (mounted) setIdbStats(stats);
    });
    return () => {
      mounted = false;
    };
  }, [patients]);

  // Automated Tip Rotation (Every 18 seconds)
  useEffect(() => {
    if (isTipPaused) return;

    const interval = 200;
    const duration = 18000;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setTipProgress((prev) => {
        if (prev >= 100) {
          setCurrentTipIndex((curr) => (curr + 1) % CLINICAL_TIPS.length);
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isTipPaused]);

  const handleNextTip = () => {
    setTipProgress(0);
    setCurrentTipIndex((prev) => (prev + 1) % CLINICAL_TIPS.length);
  };

  const handleShuffleTip = () => {
    setTipProgress(0);
    let next = Math.floor(Math.random() * CLINICAL_TIPS.length);
    if (next === currentTipIndex) next = (next + 1) % CLINICAL_TIPS.length;
    setCurrentTipIndex(next);
  };

  // Time-of-day greeting
  const greetingData = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    let text = 'Good morning';
    let icon = Sunrise;
    let color = 'text-blue-700 bg-blue-50 border border-blue-100';

    if (hour >= 12 && hour < 17) {
      text = 'Good afternoon';
      icon = Sun;
      color = 'text-amber-600 bg-amber-50 border border-amber-100';
    } else if (hour >= 17 && hour < 22) {
      text = 'Good evening';
      icon = Sunset;
      color = 'text-indigo-600 bg-indigo-50 border border-indigo-100';
    } else {
      text = 'Good night';
      icon = Moon;
      color = 'text-slate-600 bg-slate-100 border border-slate-200';
    }

    const dateFormatted = now.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    return { text, icon, color, dateFormatted };
  }, []);

  // Today's Work Summary Metrics
  const summary = useMemo(() => {
    const totalPatients = patients.length;
    const f75Count = patients.filter((p) => p.input.therapeutic_phase === 'F-75 Stabilization').length;
    const f100Count = patients.filter((p) => p.input.therapeutic_phase === 'F-100 Rehabilitation').length;

    // High risk alerts
    const severeEdemaPatients = patients.filter(
      (p) => p.input.edema_severity === 'Severe (+++)' || p.input.edema_severity === 'Mild/Moderate (+ / ++)'
    );

    // Active reminders due today
    const now = Date.now();
    const dueReminders = reminders.filter((r) => {
      if (r.completed) return false;
      const dueTime = new Date(r.dueDateTime).getTime();
      return dueTime <= now + 3600000;
    });
    const overdueReminders = reminders.filter((r) => {
      if (r.completed) return false;
      const dueTime = new Date(r.dueDateTime).getTime();
      return dueTime < now;
    });

    return {
      totalPatients,
      f75Count,
      f100Count,
      severeEdemaPatients,
      dueRemindersCount: dueReminders.length,
      overdueRemindersCount: overdueReminders.length,
    };
  }, [patients, reminders]);

  const activeTip = CLINICAL_TIPS[currentTipIndex];
  const GreetingIcon = greetingData.icon;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. TOP HERO: Professional Clinical Header with Original PediCal Blue */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${greetingData.color}`}>
                <GreetingIcon className="w-4 h-4" />
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {greetingData.dateFormatted} &middot; <span className="text-blue-700 font-bold">{facilityName}</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
              {greetingData.text}, {getClinicianFirstName(clinicianName)}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl font-sans leading-relaxed">
              Inpatient pediatric nutrition census, therapeutic milk feeds, and growth monitoring schedule.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <button
              type="button"
              onClick={onAdmitNewChild}
              className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span>Admit Child</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('screener')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 min-h-[40px]"
            >
              <Activity className="w-4 h-4 text-blue-700" />
              <span>Field Screener</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. WARD BREAKDOWN: Metric Cards (Clean minimal tiles with signature PediCal blue accents) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Ward Breakdown
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Active Roster
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Tile 1: Total Census */}
          <div
            onClick={() => onNavigate('ward')}
            className="bg-white rounded-2xl p-4 sm:p-5 hover:bg-blue-50/20 transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Bed className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs text-slate-600 font-semibold">
                Ward Census
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {String(summary.totalPatients).padStart(2, '0')}
              </span>
              <span className="text-xs text-slate-400 font-normal">
                Beds
              </span>
            </div>
          </div>

          {/* Tile 2: F-75 Stabilization */}
          <div
            onClick={() => onNavigate('calculator')}
            className="bg-white rounded-2xl p-4 sm:p-5 hover:bg-blue-50/20 transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                <Droplets className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs text-blue-900 font-semibold">
                F-75 Stabilization
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-blue-950 tracking-tight">
                {String(summary.f75Count).padStart(2, '0')}
              </span>
              <span className="text-xs text-blue-600 font-normal">
                Children
              </span>
            </div>
          </div>

          {/* Tile 3: F-100 Rehabilitation */}
          <div
            onClick={() => onNavigate('recipe')}
            className="bg-white rounded-2xl p-4 sm:p-5 hover:bg-emerald-50/20 transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Scale className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs text-emerald-900 font-semibold">
                F-100 Rehabilitation
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-emerald-950 tracking-tight">
                {String(summary.f100Count).padStart(2, '0')}
              </span>
              <span className="text-xs text-emerald-600 font-normal">
                Advancing
              </span>
            </div>
          </div>

          {/* Tile 4: Reminders Due */}
          <div
            onClick={onOpenReminders}
            className={`rounded-2xl p-4 sm:p-5 transition-all cursor-pointer group shadow-xs ${
              summary.overdueRemindersCount > 0
                ? 'bg-rose-50/70 hover:bg-rose-100/70'
                : 'bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                summary.overdueRemindersCount > 0
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                <Clock className="w-3.5 h-3.5" />
              </span>
              <span className={`text-xs font-semibold ${
                summary.overdueRemindersCount > 0 ? 'text-rose-800' : 'text-slate-600'
              }`}>
                Reminders Due
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                summary.overdueRemindersCount > 0 ? 'text-rose-950' : 'text-slate-900'
              }`}>
                {String(summary.dueRemindersCount).padStart(2, '0')}
              </span>
              <span className="text-xs text-slate-500 font-normal">
                {summary.overdueRemindersCount > 0 ? 'Overdue' : 'Active'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SIGNATURE CLINICAL FEATURE BANNER: Deep Blue / Indigo Brand Gradient */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Evidence-Based Standards</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Clinical Protocol Safeguards Active
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              Calculations adhere strictly to WHO 2023 Guidelines and Ghana Health Service IMAM protocols. Fluid overload limits and age-specific pathways are enforced automatically.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('reference')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl border border-white/15 transition-colors"
            >
              View Guidelines
            </button>
            <button
              type="button"
              onClick={() => onNavigate('schedule')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
            >
              Bedside Feeds
            </button>
          </div>
        </div>
      </div>

      {/* 4. CLINICAL TIP OF THE DAY: Clean White Card with PediCal Blue Timer Line */}
      <div
        className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs relative overflow-hidden"
        onMouseEnter={() => setIsTipPaused(true)}
        onMouseLeave={() => setIsTipPaused(false)}
      >
        {/* Subtle timer progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
          <div
            className="h-full bg-blue-600 transition-all duration-200 ease-linear"
            style={{ width: `${tipProgress}%` }}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
              {activeTip.category}
            </span>
            <span className="text-[11px] text-slate-400 font-sans">
              Tip {activeTip.id} of {CLINICAL_TIPS.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleShuffleTip}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              title="Shuffle tip"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextTip}
              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {activeTip.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl font-sans">
            {activeTip.body}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-sans">
          <span>Standard: {activeTip.source}</span>
          <span>{isTipPaused ? 'Paused on hover' : 'Advances every 18 seconds'}</span>
        </div>
      </div>

      {/* 5. TODAY'S CLINICAL WORK QUEUE & SYSTEMS OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Clinical Action Queue (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Inpatient Work Queue
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Current Bed: {activePatient ? activePatient.cotNumber : 'None'}
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Task Card 1: Feeds due */}
            <div
              onClick={() => onNavigate('schedule')}
              className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer group flex items-start justify-between gap-3 shadow-xs"
            >
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Droplets className="w-4 h-4" />
                </span>
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                    Administer &amp; Reconcile Feeds
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Check bedside feeding log for {activePatient ? `${activePatient.cotNumber} (${activePatient.name})` : 'all inpatients'}. Verify intake and remaining volume.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
            </div>

            {/* Task Card 2: Severe Edema watch (if applicable) */}
            {summary.severeEdemaPatients.length > 0 && (
              <div
                onClick={() => {
                  onNavigate('calculator', summary.severeEdemaPatients[0].id);
                }}
                className="bg-amber-50/70 rounded-2xl border border-amber-200 p-4 hover:border-amber-300 transition-all cursor-pointer group flex items-start justify-between gap-3 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-sm font-semibold text-amber-950">
                        Bilateral Oedema Monitoring ({summary.severeEdemaPatients.length})
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                        Priority
                      </span>
                    </div>
                    <p className="text-xs text-amber-900/80 leading-relaxed font-sans">
                      {summary.severeEdemaPatients.map((p) => `${p.cotNumber} (${p.input.edema_severity})`).join(', ')}. Strict F-75 fluid restriction (100 mL/kg/day).
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-700 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </div>
            )}

            {/* Task Card 3: Batch Milk Preparation */}
            <div
              onClick={() => onNavigate('recipe')}
              className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer group flex items-start justify-between gap-3 shadow-xs"
            >
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Beaker className="w-4 h-4" />
                </span>
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                    24-Hour Therapeutic Milk Batch Recipe
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Prepare kitchen recipes for skimmed milk powder, white sugar, refined vegetable oil, and CMV mineral mix for prescribed daily totals.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
            </div>

            {/* Task Card 4: Daily Weight & Charting */}
            <div
              onClick={() => onNavigate('chart')}
              className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer group flex items-start justify-between gap-3 shadow-xs"
            >
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Scale className="w-4 h-4" />
                </span>
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                    Daily Weight &amp; WHO Growth Standards
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Record morning fasting weights and plot Length/Height-for-Age and Weight-for-Length z-scores to assess recovery velocity.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
            </div>
          </div>
        </div>

        {/* Right Column: Quick Ward Actions & App Install (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Clinical Actions
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Direct Access
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            {/* View Roster Primary Action */}
            <button
              type="button"
              onClick={() => onNavigate('ward')}
              className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-between min-h-[44px]"
            >
              <div className="flex items-center gap-2">
                <Bed className="w-4 h-4" />
                <span>Inpatient Ward Roster ({patients.length} Beds)</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Screener Shortcut */}
            <button
              type="button"
              onClick={() => onNavigate('screener')}
              className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs rounded-xl border border-slate-200 transition-colors flex items-center justify-between min-h-[40px]"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-700" />
                <span>Rapid Field Screener</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* ReSoMal Rehydration Shortcut */}
            <button
              type="button"
              onClick={() => onNavigate('resomal')}
              className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs rounded-xl border border-slate-200 transition-colors flex items-center justify-between min-h-[40px]"
            >
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-teal-700" />
                <span>ReSoMal Rehydration Protocol</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Optional PWA Offline App Installation (Brief & Uncluttered) */}
            {pwa.canInstall && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => pwa.promptInstall()}
                  className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Install App for Bedside Offline Use</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
