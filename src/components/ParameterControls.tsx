import React, { useState } from 'react';
import {
  CalculationInput,
  TherapeuticPhase,
  EdemaSeverity,
  FeedingInterval,
  LocalMilkSource,
  ChildSex,
} from '../utils/clinicalCalculations';
import {
  RefreshCw,
  Minus,
  Plus,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Milk,
  Layers,
} from 'lucide-react';
import { ClinicalNumberInput } from './ClinicalNumberInput';

interface ParameterControlsProps {
  input: CalculationInput;
  onChange: (updated: CalculationInput) => void;
  onReset: () => void;
  showQuickPresets?: boolean;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  input,
  onChange,
  onReset,
  showQuickPresets = true,
}) => {
  const [presetsExpanded, setPresetsExpanded] = useState<boolean>(false);
  const [milkSettingsExpanded, setMilkSettingsExpanded] = useState<boolean>(false);

  const update = <K extends keyof CalculationInput>(field: K, val: CalculationInput[K]) => {
    onChange({
      ...input,
      [field]: val,
    });
  };

  const adjustWeight = (delta: number) => {
    const next = Math.max(1.5, Math.min(25.0, Number((input.weight_kg + delta).toFixed(1))));
    update('weight_kg', next);
  };

  const adjustHeight = (delta: number) => {
    const current = input.height_cm ?? 60.0;
    const next = Math.max(45.0, Math.min(110.0, Number((current + delta).toFixed(1))));
    update('height_cm', next);
  };

  const adjustAge = (delta: number) => {
    const current = input.age_months ?? 12;
    const next = Math.max(0, Math.min(60, current + delta));
    update('age_months', next);
  };

  const applyPreset = (preset: Partial<CalculationInput>) => {
    onChange({
      ...input,
      ...preset,
    });
  };

  const isFullAssessment = input.calculation_mode === 'Full WHO Assessment + Calculator';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-5">
      {/* Header bar: Title & Reset Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Parameters
          </h2>
          <div className="text-xs text-slate-500 mt-0.5">
            Anthropometrics and feeding settings
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors py-2 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 min-h-[44px] self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span>Reset</span>
        </button>
      </div>

      {/* Accordion 1: Quick Clinical Presets (Collapsible to prevent scroll fatigue) */}
      {showQuickPresets && (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60">
          <button
            type="button"
            onClick={() => setPresetsExpanded(!presetsExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100/60 transition-colors min-h-[44px]"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-slate-800">
                Clinical presets
              </span>
            </div>
            {presetsExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {presetsExpanded && (
            <div className="p-3.5 border-t border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    calculation_mode: 'Full WHO Assessment + Calculator',
                    weight_kg: 5.2,
                    height_cm: 63.0,
                    sex: 'Boy',
                    edema_severity: 'Severe (+++)',
                    therapeutic_phase: 'F-75 Stabilization',
                    feeding_interval_hours: 2,
                    local_milk_source: 'Dried Skimmed Milk Powder',
                  })
                }
                className="text-left p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all min-h-[48px]"
              >
                <div className="font-semibold text-xs text-slate-900">Kwashiorkor (+++)</div>
                <div className="text-slate-500 text-xs mt-0.5">
                  5.2 kg &middot; 63 cm &middot; F-75 &middot; q2h
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    calculation_mode: 'Full WHO Assessment + Calculator',
                    weight_kg: 4.5,
                    height_cm: 65.0,
                    sex: 'Girl',
                    edema_severity: 'None',
                    therapeutic_phase: 'F-75 Stabilization',
                    feeding_interval_hours: 3,
                    local_milk_source: 'Dried Whole Milk Powder',
                  })
                }
                className="text-left p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all min-h-[48px]"
              >
                <div className="font-semibold text-xs text-slate-900">Marasmus (WHZ &lt; -3)</div>
                <div className="text-slate-500 text-xs mt-0.5">
                  4.5 kg &middot; 65 cm &middot; F-75 &middot; q3h
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    calculation_mode: 'Full WHO Assessment + Calculator',
                    weight_kg: 6.8,
                    height_cm: 71.0,
                    sex: 'Boy',
                    edema_severity: 'None',
                    therapeutic_phase: 'F-100 Rehabilitation',
                    feeding_interval_hours: 4,
                    local_milk_source: 'Fresh Cow / UHT Milk',
                  })
                }
                className="text-left p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all min-h-[48px]"
              >
                <div className="font-semibold text-xs text-slate-900">F-100 Catch-Up</div>
                <div className="text-slate-500 text-xs mt-0.5">
                  6.8 kg &middot; 71 cm &middot; F-100 &middot; q4h
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    calculation_mode: 'Full WHO Assessment + Calculator',
                    weight_kg: 5.5,
                    height_cm: 64.0,
                    sex: 'Boy',
                    edema_severity: 'Severe (+++)',
                    therapeutic_phase: 'F-100 Rehabilitation',
                    feeding_interval_hours: 3,
                    local_milk_source: 'Dried Skimmed Milk Powder',
                  })
                }
                className="text-left p-3 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 hover:border-red-300 transition-all min-h-[48px]"
              >
                <div className="font-semibold text-xs text-red-900 flex items-center justify-between">
                  <span>Safety Rule 2 Test</span>
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                </div>
                <div className="text-red-700 text-xs mt-0.5">
                  F-100 with Edema (+++)
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode Selector */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Assessment mode
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => update('calculation_mode', 'Full WHO Assessment + Calculator')}
            className={`p-3 text-left rounded-lg transition-all min-h-[44px] flex items-center justify-between ${
              input.calculation_mode === 'Full WHO Assessment + Calculator'
                ? 'bg-white text-blue-900 shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div>
              <div className="text-xs font-bold text-slate-900">Full WHO assessment</div>
              <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                WHZ cutoffs, edema &amp; recipes
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => update('calculation_mode', 'Quick Calculator Override')}
            className={`p-3 text-left rounded-lg transition-all min-h-[44px] flex items-center justify-between ${
              input.calculation_mode === 'Quick Calculator Override'
                ? 'bg-white text-blue-900 shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div>
              <div className="text-xs font-bold text-slate-900">Quick calculator</div>
              <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                Direct fluid targets
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Compact Grid Row 1: Core Anthropometric Numbers (Weight, Height, Age) */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Measurements
        </div>
        <div className={`grid grid-cols-1 ${isFullAssessment ? 'sm:grid-cols-2 lg:grid-cols-3' : ''} gap-4`}>
          {/* Patient Weight (kg) with 48px Steppers */}
          <div className="space-y-1.5 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">
                Weight (kg)
              </label>
              <span className="text-xs font-medium text-slate-500">1.5 – 25.0 kg</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustWeight(-0.1)}
                className="w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 transition-all font-bold shrink-0 shadow-xs"
                title="Decrease 0.1 kg"
                aria-label="Decrease weight by 0.1 kg"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="relative flex-1">
                <ClinicalNumberInput
                  value={input.weight_kg}
                  onChange={(val) => update('weight_kg', val)}
                  min={1.5}
                  max={25.0}
                  step={0.1}
                  unit="kg"
                  className="w-full text-center text-lg sm:text-xl font-bold text-slate-900 bg-white border border-slate-300 rounded-xl h-12 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                />
              </div>

              <button
                type="button"
                onClick={() => adjustWeight(0.1)}
                className="w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 transition-all font-bold shrink-0 shadow-xs"
                title="Increase 0.1 kg"
                aria-label="Increase weight by 0.1 kg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick weight adjust chips */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-0.5">
              {[-1.0, -0.5, +0.5, +1.0].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => adjustWeight(step)}
                  className="text-xs font-semibold py-1 px-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shrink-0 min-h-[32px]"
                >
                  {step > 0 ? `+${step}` : step} kg
                </button>
              ))}
            </div>
          </div>

          {/* Diagnostic Fields (Full WHO mode only) */}
          {isFullAssessment && (
            <>
              {/* Height / Length (cm) with 48px Steppers */}
              <div className="space-y-1.5 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">
                    Length / Height (cm)
                  </label>
                  <span className="text-xs font-medium text-slate-500">45 – 110 cm</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustHeight(-0.5)}
                    className="w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 transition-all font-bold shrink-0 shadow-xs"
                    title="Decrease 0.5 cm"
                    aria-label="Decrease height by 0.5 cm"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="relative flex-1">
                    <ClinicalNumberInput
                      value={input.height_cm ?? 60.0}
                      onChange={(val) => update('height_cm', val)}
                      min={45.0}
                      max={110.0}
                      step={0.5}
                      unit="cm"
                      className="w-full text-center text-lg sm:text-xl font-bold text-slate-900 bg-white border border-slate-300 rounded-xl h-12 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => adjustHeight(0.5)}
                    className="w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 transition-all font-bold shrink-0 shadow-xs"
                    title="Increase 0.5 cm"
                    aria-label="Increase height by 0.5 cm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 pt-1">
                  Recumbent (&lt;87 cm) or standing (&ge;87 cm)
                </div>
              </div>

              {/* Age (months) with 48px Steppers */}
              <div className="space-y-1.5 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">
                    Age (Months)
                  </label>
                  <span className="text-xs font-medium text-slate-500">0 – 60 mo</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustAge(-1)}
                    className="w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 transition-all font-bold shrink-0 shadow-xs"
                    title="Decrease 1 month"
                    aria-label="Decrease age by 1 month"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="relative flex-1">
                    <ClinicalNumberInput
                      value={input.age_months ?? 12}
                      onChange={(val) => update('age_months', val)}
                      min={0}
                      max={60}
                      isInteger={true}
                      unit="mo"
                      className="w-full text-center text-lg sm:text-xl font-bold text-slate-900 bg-white border border-slate-300 rounded-xl h-12 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => adjustAge(1)}
                    className="w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 transition-all font-bold shrink-0 shadow-xs"
                    title="Increase 1 month"
                    aria-label="Increase age by 1 month"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 pt-1">
                  Completed months for WHO WAZ &amp; HAZ curves
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Compact Grid Row 2: Clinical Parameters (Sex, Edema, Phase, Interval) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        {/* Sex Selector (if full assessment) */}
        {isFullAssessment && (
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Sex
            </label>
            <div className="grid grid-cols-2 gap-2 h-12">
              {(['Boy', 'Girl'] as ChildSex[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => update('sex', s)}
                  className={`h-full rounded-xl text-xs font-bold border transition-all flex items-center justify-center min-h-[44px] ${
                    input.sex === s
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bilateral Pitting Edema Severity with Clinical Highlights */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">
            Bilateral pitting edema
          </label>
          <div className="space-y-1.5">
            {(
              [
                'None',
                'Mild/Moderate (+ / ++)',
                'Severe (+++)',
              ] as EdemaSeverity[]
            ).map((sev) => {
              const isSelected = input.edema_severity === sev;
              const isSevere = sev === 'Severe (+++)';
              const isMod = sev === 'Mild/Moderate (+ / ++)';

              let activeStyles = 'bg-slate-100 border-slate-300 text-slate-800 font-semibold';
              if (isSelected) {
                if (isSevere) {
                  activeStyles = 'bg-red-50 border-red-300 text-red-700 font-bold shadow-xs';
                } else if (isMod) {
                  activeStyles = 'bg-amber-50 border-amber-300 text-amber-700 font-bold shadow-xs';
                } else {
                  activeStyles = 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold shadow-xs';
                }
              }

              return (
                <button
                  key={sev}
                  type="button"
                  onClick={() => update('edema_severity', sev)}
                  className={`w-full py-2 px-3 rounded-xl text-left text-xs border transition-all min-h-[44px] flex items-center justify-between ${activeStyles}`}
                >
                  <span>{sev}</span>
                  {isSevere && (
                    <span className="text-[11px] font-bold text-red-600 px-1.5 py-0.5 rounded bg-red-100/60">
                      High fluid risk
                    </span>
                  )}
                  {isMod && (
                    <span className="text-[11px] font-semibold text-amber-600">
                      Moderate
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Therapeutic Milk Phase */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">
            Therapeutic phase
          </label>
          <div className="space-y-1.5">
            {(['F-75 Stabilization', 'F-100 Rehabilitation'] as TherapeuticPhase[]).map((p) => {
              const isSelected = input.therapeutic_phase === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => update('therapeutic_phase', p)}
                  className={`w-full p-2.5 rounded-xl text-left text-xs border transition-all min-h-[44px] flex flex-col justify-center ${
                    isSelected
                      ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold">{p}</div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    {p === 'F-75 Stabilization'
                      ? '75 kcal / 100 mL'
                      : '100 kcal / 100 mL'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feeding Interval Frequency */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">
            Feeding interval
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {([2, 3, 4] as FeedingInterval[]).map((hrs) => {
              const feeds = hrs === 2 ? '12 feeds' : hrs === 3 ? '8 feeds' : '6 feeds';
              return (
                <button
                  key={hrs}
                  type="button"
                  onClick={() => update('feeding_interval_hours', hrs)}
                  className={`py-2 px-1 rounded-xl text-center border transition-all min-h-[44px] flex flex-col items-center justify-center ${
                    input.feeding_interval_hours === hrs
                      ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm font-bold text-slate-900">{hrs}h</div>
                  <div className="text-[10px] text-slate-500 font-medium">{feeds}</div>
                </button>
              );
            })}
          </div>
          <div className="text-[11px] text-slate-500 pt-1">
            2-hourly for severe or hypothermic cases
          </div>
        </div>
      </div>

      {/* Accordion 2: Local Milk Formula & Batch Recipe Settings (Collapsible to prevent scroll fatigue) */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60 pt-1">
        <button
          type="button"
          onClick={() => setMilkSettingsExpanded(!milkSettingsExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100/60 transition-colors min-h-[44px]"
        >
          <div className="flex items-center gap-2">
            <Milk className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-slate-800">
              Milk source
            </span>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              ({input.local_milk_source})
            </span>
          </div>
          {milkSettingsExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {milkSettingsExpanded && (
          <div className="p-3.5 border-t border-slate-200 bg-white">
            <div className="text-xs text-slate-600 mb-2">
              Select the locally available milk commodity used when preparing non-commercial hospital formula batches:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(
                [
                  'Dried Skimmed Milk Powder',
                  'Dried Whole Milk Powder',
                  'Fresh Cow / UHT Milk',
                ] as LocalMilkSource[]
              ).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => update('local_milk_source', m)}
                  className={`p-3 rounded-xl text-left border transition-all min-h-[48px] ${
                    input.local_milk_source === m
                      ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">{m}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {m === 'Dried Skimmed Milk Powder' && '25g F-75 / 80g F-100 per L'}
                    {m === 'Dried Whole Milk Powder' && '35g F-75 / 110g F-100 per L'}
                    {m === 'Fresh Cow / UHT Milk' && '300mL F-75 / 880mL F-100 per L'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
