import React from 'react';
import {
  CalculationInput,
  CalculationMode,
  TherapeuticPhase,
  EdemaSeverity,
  FeedingInterval,
  LocalMilkSource,
  ChildSex,
} from '../utils/clinicalCalculations';
import { RefreshCw, Minus, Plus, AlertCircle, Sparkles } from 'lucide-react';

interface ParameterControlsProps {
  input: CalculationInput;
  onChange: (updated: CalculationInput) => void;
  onReset: () => void;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  input,
  onChange,
  onReset,
}) => {
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

  const applyPreset = (preset: Partial<CalculationInput>) => {
    onChange({
      ...input,
      ...preset,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-6">
      {/* Top Title & Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Patient Parameters &amp; Clinical Controls
          </h2>
          <div className="text-xs text-slate-500 mt-0.5">
            WHO Child Growth Standards &middot; Inpatient SAM Protocols
          </div>
        </div>

        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 min-h-[40px] self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Quick Ward Presets */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Quick Inpatient Presets:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
            className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all min-h-[52px]"
          >
            <div className="font-semibold text-xs text-slate-900">Kwashiorkor (+++)</div>
            <div className="text-slate-500 text-[11px] font-mono mt-0.5">
              5.2kg · 63cm · F-75 · 2h
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
            className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all min-h-[52px]"
          >
            <div className="font-semibold text-xs text-slate-900">Marasmus (WHZ &lt; -3)</div>
            <div className="text-slate-500 text-[11px] font-mono mt-0.5">
              4.5kg · 65cm · F-75 · 3h
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
            className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all min-h-[52px]"
          >
            <div className="font-semibold text-xs text-slate-900">F-100 Catch-Up</div>
            <div className="text-slate-500 text-[11px] font-mono mt-0.5">
              6.8kg · 71cm · F-100 · 4h
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
            className="text-left p-2.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-50 hover:border-rose-300 transition-all min-h-[52px]"
          >
            <div className="font-semibold text-xs text-rose-900 flex items-center justify-between">
              <span>Safety Rule 2 Test</span>
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-rose-700 text-[11px] font-mono mt-0.5">
              F-100 with Edema (+++)
            </div>
          </button>
        </div>
      </div>

      {/* 1. calculation_mode */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
          Calculation Mode
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => update('calculation_mode', 'Full WHO Assessment + Calculator')}
            className={`p-3 text-left rounded-lg transition-all min-h-[48px] flex items-start justify-between ${
              input.calculation_mode === 'Full WHO Assessment + Calculator'
                ? 'bg-white text-blue-800 shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div>
              <div className="text-xs font-bold">Full WHO Assessment + Calculator</div>
              <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                Evaluates WHZ &lt; -3 cut-offs, clinical edema &amp; recipes
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => update('calculation_mode', 'Quick Calculator Override')}
            className={`p-3 text-left rounded-lg transition-all min-h-[48px] flex items-start justify-between ${
              input.calculation_mode === 'Quick Calculator Override'
                ? 'bg-white text-blue-800 shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div>
              <div className="text-xs font-bold">Quick Calculator Override</div>
              <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                Bypasses growth chart diagnostics; calculates fluids directly
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Patient Weight (kg) with Mobile Steppers */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800">
              Patient Weight (kg)
            </label>
            <span className="text-[11px] font-mono text-slate-400">1.5 - 25.0 kg</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => adjustWeight(-0.1)}
              className="w-11 h-11 flex items-center justify-center rounded-lg border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all text-sm font-bold shrink-0"
              title="Decrease 0.1 kg"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="relative flex-1">
              <input
                type="number"
                step="0.1"
                min="1.5"
                max="25.0"
                value={input.weight_kg}
                onChange={(e) =>
                  update('weight_kg', Math.max(0.1, parseFloat(e.target.value) || 0))
                }
                className="w-full text-center font-mono text-xl font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg h-11 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <span className="absolute right-2.5 top-3 text-[11px] font-mono font-bold text-slate-400">
                kg
              </span>
            </div>

            <button
              type="button"
              onClick={() => adjustWeight(0.1)}
              className="w-11 h-11 flex items-center justify-center rounded-lg border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all text-sm font-bold shrink-0"
              title="Increase 0.1 kg"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick weight chips */}
          <div className="flex items-center gap-1 pt-1 overflow-x-auto pb-0.5">
            {[-1.0, -0.5, +0.5, +1.0].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => adjustWeight(step)}
                className="text-[11px] font-mono py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0"
              >
                {step > 0 ? `+${step}` : step}k
              </button>
            ))}
          </div>
        </div>

        {/* Optional Diagnostic Fields (Full WHO mode only) */}
        {input.calculation_mode === 'Full WHO Assessment + Calculator' && (
          <>
            {/* Height (cm) with Mobile Steppers */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Length / Stature (cm)
                </label>
                <span className="text-[11px] font-mono text-slate-400">45 - 110 cm</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustHeight(-0.5)}
                  className="w-11 h-11 flex items-center justify-center rounded-lg border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all text-sm font-bold shrink-0"
                  title="Decrease 0.5 cm"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.5"
                    min="45"
                    max="110"
                    value={input.height_cm ?? 60.0}
                    onChange={(e) =>
                      update('height_cm', Math.max(45, parseFloat(e.target.value) || 45))
                    }
                    className="w-full text-center font-mono text-xl font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg h-11 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="absolute right-2.5 top-3 text-[11px] font-mono font-bold text-slate-400">
                    cm
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => adjustHeight(0.5)}
                  className="w-11 h-11 flex items-center justify-center rounded-lg border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all text-sm font-bold shrink-0"
                  title="Increase 0.5 cm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="text-[11px] text-slate-500 pt-1">
                Recumbent length (&lt;87cm) or standing height (&ge;87cm)
              </div>
            </div>

            {/* Age (months) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Child Age (Months)
                </label>
                <span className="text-[11px] font-mono text-slate-400">0 - 60 mo</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => update('age_months', Math.max(0, (input.age_months ?? 12) - 1))}
                  className="w-11 h-11 flex items-center justify-center rounded-lg border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all text-sm font-bold shrink-0"
                  title="Decrease 1 month"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={input.age_months ?? 12}
                    onChange={(e) =>
                      update('age_months', Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="w-full text-center font-mono text-xl font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg h-11 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="absolute right-2.5 top-3 text-[11px] font-mono font-bold text-slate-400">
                    mo
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => update('age_months', Math.min(60, (input.age_months ?? 12) + 1))}
                  className="w-11 h-11 flex items-center justify-center rounded-lg border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all text-sm font-bold shrink-0"
                  title="Increase 1 month"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="text-[11px] text-slate-500 pt-1">
                Completed months for Weight-for-Age &amp; Length-for-Age
              </div>
            </div>

            {/* Sex Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Child Biological Sex
              </label>
              <div className="grid grid-cols-2 gap-2 h-11">
                {(['Boy', 'Girl'] as ChildSex[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => update('sex', s)}
                    className={`h-full rounded-lg text-xs font-bold border transition-all flex items-center justify-center ${
                      input.sex === s
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                Applies sex-specific WHO z-score growth distributions
              </div>
            </div>
          </>
        )}

        {/* Therapeutic Phase */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-800">
            Therapeutic Milk Phase
          </label>
          <div className="space-y-2">
            {(['F-75 Stabilization', 'F-100 Rehabilitation'] as TherapeuticPhase[]).map((p) => {
              const isSelected = input.therapeutic_phase === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => update('therapeutic_phase', p)}
                  className={`w-full p-2.5 rounded-lg text-left text-xs border transition-all min-h-[46px] ${
                    isSelected
                      ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                      : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="font-bold">{p}</div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    {p === 'F-75 Stabilization'
                      ? 'Phase 1 acute (75 kcal / 100 mL · low sodium)'
                      : 'Phase 2 catch-up (100 kcal / 100 mL)'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Edema Severity */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-800">
            Bilateral Pitting Edema
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
              return (
                <button
                  key={sev}
                  type="button"
                  onClick={() => update('edema_severity', sev)}
                  className={`w-full py-2 px-3 rounded-lg text-left text-xs border transition-all min-h-[42px] flex items-center justify-between ${
                    isSelected
                      ? isSevere
                        ? 'bg-rose-50 border-rose-600 text-rose-900 font-bold'
                        : 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                      : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-white'
                  }`}
                >
                  <span>{sev}</span>
                  {isSevere && (
                    <span className="text-[10px] font-mono font-bold text-rose-700">
                      High Fluid Risk
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feeding Interval */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-800">
            Feeding Interval Frequency
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([2, 3, 4] as FeedingInterval[]).map((hrs) => {
              const feeds = hrs === 2 ? '12 feeds' : hrs === 3 ? '8 feeds' : '6 feeds';
              return (
                <button
                  key={hrs}
                  type="button"
                  onClick={() => update('feeding_interval_hours', hrs)}
                  className={`py-2 px-1 rounded-lg text-center border transition-all min-h-[50px] flex flex-col items-center justify-center ${
                    input.feeding_interval_hours === hrs
                      ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                      : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="text-sm font-mono font-bold">{hrs} Hours</div>
                  <div className="text-[10px] text-slate-500">{feeds}/day</div>
                </button>
              );
            })}
          </div>
          <div className="text-[11px] text-slate-500 pt-1">
            2-hourly recommended during critical early stabilization
          </div>
        </div>

        {/* Local Milk Source */}
        <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
          <label className="block text-xs font-bold text-slate-800">
            Local Milk Source (For Manual Ingredient Scaler)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                className={`p-3 rounded-lg text-left border transition-all min-h-[52px] ${
                  input.local_milk_source === m
                    ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                    : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-white'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">{m}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {m === 'Dried Skimmed Milk Powder' && '25g F-75 / 80g F-100 per L'}
                  {m === 'Dried Whole Milk Powder' && '35g F-75 / 110g F-100 per L'}
                  {m === 'Fresh Cow / UHT Milk' && '300mL F-75 / 880mL F-100 per L'}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
