import React, { useState } from 'react';
import {
  Droplets,
  AlertTriangle,
  ShieldAlert,
  Clock,
  HeartPulse,
  CheckCircle2,
  Copy,
  Check,
  Info,
  Beaker,
  AlertCircle,
  Activity,
  FileText,
} from 'lucide-react';
import {
  calculateReSoMalProtocol,
  EdemaSeverity,
  GHANA_IMAM_GUIDELINE_TITLE,
} from '../utils/clinicalCalculations';
import { ClinicalNumberInput } from './ClinicalNumberInput';

interface ReSoMalManagementSectionProps {
  initialWeightKg: number;
  initialEdemaSeverity: EdemaSeverity;
  initialAgeMonths?: number;
  cotNumber?: string;
  patientName?: string;
  onJumpToF75?: () => void;
}

export const ReSoMalManagementSection: React.FC<ReSoMalManagementSectionProps> = ({
  initialWeightKg,
  initialEdemaSeverity,
  initialAgeMonths = 18,
  cotNumber = 'Cot 01',
  patientName = 'Active Inpatient',
  onJumpToF75,
}) => {
  const [weightKg, setWeightKg] = useState<number>(initialWeightKg);
  const [edemaSeverity, setEdemaSeverity] = useState<EdemaSeverity>(initialEdemaSeverity);
  const [ageMonths, setAgeMonths] = useState<number>(initialAgeMonths);
  const [choleraOverride, setCholeraOverride] = useState<boolean>(false);
  const [dosesGiven, setDosesGiven] = useState<Record<number, boolean>>({});
  const [baselineRR, setBaselineRR] = useState<number>(36);
  const [currentRR, setCurrentRR] = useState<number>(36);
  const [baselinePulse, setBaselinePulse] = useState<number>(115);
  const [currentPulse, setCurrentPulse] = useState<number>(115);
  const [copied, setCopied] = useState<boolean>(false);

  const protocol = calculateReSoMalProtocol(weightKg, edemaSeverity, ageMonths);
  const isBlockedByEdema = protocol.hasEdema && !choleraOverride;

  const toggleDose = (idx: number) => {
    setDosesGiven((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const rrDelta = currentRR - baselineRR;
  const pulseDelta = currentPulse - baselinePulse;
  const isFluidOverloadRisk = rrDelta >= 5 || pulseDelta >= 15;

  const copyReSoMalPlan = () => {
    const text = `GHANA HEALTH SERVICE (GHS) / UNICEF IMAM PROTOCOL
RESOMAL REHYDRATION ORDER & CLINICAL MONITORING
Patient: ${cotNumber} - ${patientName} (${weightKg} kg, ${ageMonths} mo)
Nutritional Oedema: ${edemaSeverity} ${choleraOverride ? '(Cholera/Severe Watery Diarrhea Override Active)' : ''}

1. FIRST 2 HOURS (INITIAL REHYDRATION):
- Rate: 5 mL/kg every 30 minutes
- Volume per dose: ${protocol.first2Hours.volumePer30Min} mL q30m (Doses at 0m, 30m, 60m, 90m)
- Total 2-hour target: ${protocol.first2Hours.total2HourVolume} mL

2. HOURS 3 TO 10 (ALTERNATING SCHEDULE):
- Alternate hourly: ReSoMal (${protocol.nextHoursAlternate.minHourlyRateMl}–${protocol.nextHoursAlternate.maxHourlyRateMl} mL/h) with F-75 therapeutic milk
- Max duration: 10 hours or until clinically rehydrated

3. ONGOING DIARRHEA REPLACEMENT:
- ${protocol.looseStoolReplacement.volumePerLooseStool}

4. RESOMAL PREPARATION (GHS / WHO FORMULA):
- 1 packet WHO Low-Osmolarity ORS (1L size)
- 2.0 Litres clean boiled, cooled safe water (NOT 1L)
- 50 g commercial white sugar (approx. 10 level teaspoons)
- 40 mL liquid Combined Mineral Vitamin (CMV) solution

5. SAFETY MONITORING & STOP RULES:
- Baseline: RR ${baselineRR} bpm, Pulse ${baselinePulse} bpm | Current: RR ${currentRR} bpm, Pulse ${currentPulse} bpm
- STOP ReSoMal immediately if RR increases >= 5 bpm, pulse increases >= 15 bpm, or facial puffiness/engorged neck veins appear.

Protocol: ${GHANA_IMAM_GUIDELINE_TITLE}
Timestamp: ${new Date().toLocaleString()}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-6">
      {/* 1. Header with Ghana Health Service & UNICEF IMAM Badge */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                <Droplets className="w-4 h-4" />
              </div>
              <h2 className="font-serif text-xl sm:text-2xl text-slate-900 tracking-tight font-normal">
                ReSoMal rehydration protocol
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 pl-10.5">
              Ghana Health Service IMAM protocol &amp; WHO rehydration guidelines for complicated severe wasting.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyReSoMalPlan}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold min-h-[40px] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy order'}</span>
            </button>
            {onJumpToF75 && (
              <button
                type="button"
                onClick={onJumpToF75}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold min-h-[40px] transition-colors"
              >
                F-75 &rarr;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Patient Profile & Clinical Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
        <div>
          <label className="block text-slate-600 font-semibold mb-1">Weight (kg):</label>
          <ClinicalNumberInput
            value={weightKg}
            onChange={(val) => setWeightKg(val)}
            min={1.5}
            max={35}
            step={0.1}
            unit="kg"
            className="w-full font-bold text-sm"
          />
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Age (months):</label>
          <ClinicalNumberInput
            value={ageMonths}
            onChange={(val) => setAgeMonths(val)}
            min={0}
            max={60}
            isInteger={true}
            unit="mo"
            className="w-full font-bold text-sm"
          />
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Bilateral edema:</label>
          <select
            value={edemaSeverity}
            onChange={(e) => setEdemaSeverity(e.target.value as EdemaSeverity)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold text-xs"
          >
            <option value="None">None (Severe wasting / marasmus)</option>
            <option value="Mild/Moderate (+ / ++)">Mild / moderate (+ / ++)</option>
            <option value="Severe (+++)">Severe (+++ kwashiorkor)</option>
          </select>
        </div>
      </div>

      {/* 3. Severe Safety Alert: Kwashiorkor Contraindication */}
      {protocol.hasEdema && (
        <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-400 text-rose-950 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-bold text-rose-900 uppercase tracking-wide text-xs">
                Contraindication: edema present
              </div>
              <p className="leading-relaxed text-rose-900">
                Children with bilateral pitting edema have fluid retention. ReSoMal expands intravascular volume and can precipitate heart failure.
              </p>
              <p className="text-[11px] text-rose-800">
                <strong>Exception:</strong> Profuse watery diarrhea (e.g., cholera) with clear dehydration under cardiac surveillance.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-rose-200 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-rose-950">
              <input
                type="checkbox"
                checked={choleraOverride}
                onChange={(e) => setCholeraOverride(e.target.checked)}
                className="w-4 h-4 rounded border-rose-400 text-rose-600 focus:ring-rose-500"
              />
              <span>Clinician override: profuse watery diarrhea</span>
            </label>
            <span className="text-[10px] text-rose-700 font-semibold uppercase">
              {choleraOverride ? 'Override active' : 'Halted'}
            </span>
          </div>
        </div>
      )}

      {/* When Blocked by Edema */}
      {isBlockedByEdema ? (
        <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <div className="text-sm font-bold text-slate-800">
            ReSoMal blocked: nutritional edema
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Edematous children should be rehydrated through careful initial F-75 stabilization feeding without sodium overload.
          </p>
          {onJumpToF75 && (
            <button
              type="button"
              onClick={onJumpToF75}
              className="px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold text-xs min-h-[44px]"
            >
              Go to F-75 targets
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 4. Phase 1: First 2 Hours Dosing Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>1. First 2 hours ({protocol.first2Hours.total2HourVolume} mL total)</span>
              </h3>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                5 mL/kg every 30 minutes
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { doseNum: 1, timeLabel: '0 min (Stat)', volume: protocol.first2Hours.volumePer30Min },
                { doseNum: 2, timeLabel: '30 min', volume: protocol.first2Hours.volumePer30Min },
                { doseNum: 3, timeLabel: '60 min (1 hour)', volume: protocol.first2Hours.volumePer30Min },
                { doseNum: 4, timeLabel: '90 min (1.5 hr)', volume: protocol.first2Hours.volumePer30Min },
              ].map((dose) => {
                const isChecked = !!dosesGiven[dose.doseNum];
                return (
                  <div
                    key={dose.doseNum}
                    onClick={() => toggleDose(dose.doseNum)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs space-y-1.5 ${
                      isChecked
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Dose {dose.doseNum}</span>
                      <span
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      {dose.volume} <span className="text-xs font-normal text-slate-500">mL</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">{dose.timeLabel}</div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500">
              Administer slowly with a cup and spoon or syringe. If vomiting occurs, pause for 10 minutes and then resume at a slower rate. If unable to swallow, administer via nasogastric (NG) tube.
            </p>
          </div>

          {/* 5. Phase 2: Hours 2 to 10 Alternating Schedule */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-blue-600" />
                <span>2. Hours 3 to 10: Alternating schedule</span>
              </h3>
              <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {protocol.nextHoursAlternate.minHourlyRateMl}–{protocol.nextHoursAlternate.maxHourlyRateMl} mL/kg/h
              </span>
            </div>

            <p className="text-slate-600 leading-relaxed text-[11px]">
              Alternate <strong>ReSoMal</strong> and <strong>F-75</strong> hourly until rehydrated (up to 10 hours max):
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg">
                <div className="text-[10px] uppercase font-bold text-teal-800">Hour 3</div>
                <div className="font-bold text-teal-950 mt-0.5">ReSoMal</div>
                <div className="text-[11px] text-teal-700">
                  {protocol.nextHoursAlternate.minHourlyRateMl}–{protocol.nextHoursAlternate.maxHourlyRateMl} mL
                </div>
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-[10px] uppercase font-bold text-blue-800">Hour 4</div>
                <div className="font-bold text-blue-950 mt-0.5">F-75</div>
                <div className="text-[11px] text-blue-700">Maintenance</div>
              </div>

              <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg">
                <div className="text-[10px] uppercase font-bold text-teal-800">Hour 5</div>
                <div className="font-bold text-teal-950 mt-0.5">ReSoMal</div>
                <div className="text-[11px] text-teal-700">
                  {protocol.nextHoursAlternate.minHourlyRateMl}–{protocol.nextHoursAlternate.maxHourlyRateMl} mL
                </div>
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-[10px] uppercase font-bold text-blue-800">Hour 6</div>
                <div className="font-bold text-blue-950 mt-0.5">F-75</div>
                <div className="text-[11px] text-blue-700">Maintenance</div>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-600 text-[11px]">
              <strong>Breastfeeding:</strong> Offer breastmilk between ReSoMal and F-75 feeds.
            </div>
          </div>

          {/* 6. Ongoing Diarrhea Stool Replacement */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-2">
            <div className="font-bold text-amber-950 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>3. Loose stool replacement</span>
            </div>
            <p className="text-amber-900 leading-relaxed text-[11px]">
              For every watery, loose stool passed during recovery:
            </p>
            <div className="p-2.5 bg-white rounded-lg border border-amber-200 font-bold text-amber-950 text-xs">
              {protocol.looseStoolReplacement.volumePerLooseStool}
            </div>
          </div>

          {/* 7. ReSoMal Reconstitution & Batch Preparation Recipe */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-teal-700 text-white rounded-lg">
                <Beaker className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">
                  ReSoMal recipe
                </h4>
                <div className="text-[11px] text-slate-500">
                  Local reconstitution (2L dilution)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-500 font-semibold text-[10px]">Standard ORS</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">1 Packet (1L)</div>
                <div className="text-[10px] text-slate-500">Low-osmolarity</div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-500 font-semibold text-[10px]">Boiled Water</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">2.0 Litres</div>
                <div className="text-[10px] text-teal-700 font-semibold">NOT 1L (2x dilution)</div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-500 font-semibold text-[10px]">Sugar</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">50 g</div>
                <div className="text-[10px] text-slate-500">~10 level tsp</div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-500 font-semibold text-[10px]">CMV solution</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">40 mL</div>
                <div className="text-[10px] text-slate-500">Mineral mix</div>
              </div>
            </div>

            <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-200 text-teal-950 text-[11px] leading-relaxed">
              <strong>Rationale:</strong> Standard WHO ORS contains 75 mmol/L sodium. Diluting 1 packet in 2 Litres halves sodium to safe 37.5–45 mmol/L, avoiding fatal fluid overload in malnourished infants.
            </div>
          </div>

          {/* 8. Fluid Overload Surveillance & Emergency Stop Triggers */}
          <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-600" />
                <h4 className="font-bold text-red-950 text-xs uppercase tracking-wide">
                  Fluid overload monitoring
                </h4>
              </div>
              <span className="text-[10px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded">
                Assess q30m x 2h, then hourly
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Respiratory Rate check */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-800">Respiratory Rate (RR):</span>
                  <span
                    className={`font-bold ${
                      rrDelta >= 5 ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    Delta: {rrDelta >= 0 ? `+${rrDelta}` : rrDelta} bpm
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-500">Baseline RR:</span>
                    <ClinicalNumberInput
                      value={baselineRR}
                      onChange={(v) => setBaselineRR(v)}
                      min={10}
                      max={100}
                      isInteger={true}
                      unit="bpm"
                      className="w-full text-xs font-bold"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-500">Current RR:</span>
                    <ClinicalNumberInput
                      value={currentRR}
                      onChange={(v) => setCurrentRR(v)}
                      min={10}
                      max={100}
                      isInteger={true}
                      unit="bpm"
                      className="w-full text-xs font-bold"
                    />
                  </div>
                </div>
                {rrDelta >= 5 && (
                  <div className="text-[10px] font-bold text-red-700">
                    &bull; RR increased &ge; 5 bpm: STOP ReSoMal immediately!
                  </div>
                )}
              </div>

              {/* Pulse Rate check */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-800">Pulse Rate:</span>
                  <span
                    className={`font-bold ${
                      pulseDelta >= 15 ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    Delta: {pulseDelta >= 0 ? `+${pulseDelta}` : pulseDelta} bpm
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-500">Baseline Pulse:</span>
                    <ClinicalNumberInput
                      value={baselinePulse}
                      onChange={(v) => setBaselinePulse(v)}
                      min={40}
                      max={220}
                      isInteger={true}
                      unit="bpm"
                      className="w-full text-xs font-bold"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-500">Current Pulse:</span>
                    <ClinicalNumberInput
                      value={currentPulse}
                      onChange={(v) => setCurrentPulse(v)}
                      min={40}
                      max={220}
                      isInteger={true}
                      unit="bpm"
                      className="w-full text-xs font-bold"
                    />
                  </div>
                </div>
                {pulseDelta >= 15 && (
                  <div className="text-[10px] font-bold text-red-700">
                    &bull; Pulse increased &ge; 15 bpm: STOP ReSoMal immediately!
                  </div>
                )}
              </div>
            </div>

            {/* Overload Alert Warning */}
            {isFluidOverloadRisk && (
              <div className="p-3 rounded-lg bg-red-600 text-white font-bold text-xs flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>
                  EMERGENCY STOP TRIGGERED: Fluid overload detected. Stop ReSoMal immediately. Give nothing orally or IV. Notify medical officer on call.
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* 9. Ghana Protocol Reference Note */}
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-[11px] flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-teal-700" />
          <span>
            Ghana Health Service (GHS) / UNICEF IMAM National Guidelines &middot; Inpatient Rehydration Protocol
          </span>
        </span>
        <button
          type="button"
          onClick={copyReSoMalPlan}
          className="text-teal-700 font-bold hover:underline"
        >
          Copy Prescription &rarr;
        </button>
      </div>
    </div>
  );
};
