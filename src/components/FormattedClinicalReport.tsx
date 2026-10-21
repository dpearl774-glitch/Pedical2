import React, { useState } from 'react';
import {
  FullEvaluationResult,
  TherapeuticPhase,
} from '../utils/clinicalCalculations';
import {
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Droplet,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface FormattedClinicalReportProps {
  evaluation: FullEvaluationResult;
  onSwitchTherapeuticPhase?: (phase: TherapeuticPhase) => void;
  onNavigateToChart?: () => void;
}

export const FormattedClinicalReport: React.FC<FormattedClinicalReportProps> = ({
  evaluation,
  onSwitchTherapeuticPhase,
  onNavigateToChart,
}) => {
  const [copied, setCopied] = useState(false);
  const { input, growthAssessment, feedingSummary, recipe, safety, clinicalDirective } = evaluation;

  // Plain-text export for hospital electronic medical records
  const generatePlainTextReport = () => {
    let report = `PEDICAL CLINICAL EVALUATION REPORT - INPATIENT SAM\n`;
    report += `Timestamp: ${new Date(evaluation.timestamp).toLocaleString()}\n`;
    report += `Calculation Mode: ${input.calculation_mode}\n\n`;

    if (input.calculation_mode === 'Full WHO Assessment + Calculator' && growthAssessment) {
      report += `WHO Growth Assessment Output\n`;
      report += `- Anthropometric Profile: ${growthAssessment.anthropometricProfile.weight_kg} kg, ${growthAssessment.anthropometricProfile.height_cm} cm, ${growthAssessment.anthropometricProfile.sex}.\n`;
      report += `- Classification Status: ${growthAssessment.classificationStatus}\n`;
      report += `- Diagnostic Indicator: ${growthAssessment.diagnosticIndicator}\n\n`;
    }

    report += `Patient Feeding Target Summary\n`;
    report += `- Target Volume Per Feed: ${feedingSummary.targetVolumePerFeed} mL administered every ${feedingSummary.feedingIntervalHours} hours.\n`;
    report += `- Total Fluid Volume per 24 hours: ${feedingSummary.dailyVolume} mL/day.\n`;
    report += `- Critical Minimum Daily Intake (80%): ${feedingSummary.safeMinimumVolume} mL/day.\n\n`;

    if (safety.rule2FluidOverloadHalted) {
      report += `${safety.rule2ErrorText}\n\n`;
    } else if (recipe) {
      report += `Manual 24-Hour Batch Recipe\n`;
      report += `To prepare exactly ${recipe.dailyVolume} mL of therapeutic milk, combine:\n`;
      report += `1. Milk Base: ${recipe.milkBase.amount} ${recipe.milkBase.unit} (${recipe.milkBase.name})\n`;
      report += `2. Sugar: ${recipe.sugarGrams} g\n`;
      report += `3. Vegetable Oil: ${recipe.vegetableOilGrams} g\n`;
      report += `4. Cereal Flour: ${recipe.cerealFlourGrams} g\n`;
      report += `5. CMV Solution: ${recipe.cmvLiquidMl} mL (liquid Combined Mineral Vitamin solution)\n`;
      report += `(Top up with warm, pre-boiled water until the final solution hits exactly the ${recipe.dailyVolume} mL mark).\n\n`;
      report += `Preparation Step:\n${recipe.preparationStep}\n\n`;
    }

    if (safety.rule1F75OsmolalityTriggered) {
      report += `${safety.rule1NoticeText}\n\n`;
    }

    report += `Clinical Directive Alert\n`;
    report += `${clinicalDirective.directiveText}\n`;

    return report;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatePlainTextReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span>CLINICAL REPORT</span>
          <span aria-hidden="true">&middot;</span>
          <span>DETERMINISTIC EVALUATION</span>
        </div>

        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-95 transition-all shadow-xs min-h-[36px]"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy EMR Summary'}</span>
        </button>
      </div>

      {/* =========================================================================
          SECTION 1: WHO Growth Assessment Output (Full Mode Only)
         ========================================================================= */}
      {input.calculation_mode === 'Full WHO Assessment + Calculator' && growthAssessment && (
        <section
          id="who-growth-section"
          className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              WHO Growth Assessment Output
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span>WHO Child Growth Standard</span>
              {onNavigateToChart && (
                <button
                  onClick={onNavigateToChart}
                  className="text-blue-700 hover:text-blue-800 font-semibold underline decoration-blue-300 flex items-center gap-1 ml-1"
                >
                  <span>View Chart</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Anthropometric Profile */}
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Anthropometric Profile
              </div>
              <div className="text-base font-mono font-bold text-slate-900">
                {growthAssessment.anthropometricProfile.weight_kg} kg,{' '}
                {growthAssessment.anthropometricProfile.height_cm} cm,{' '}
                {growthAssessment.anthropometricProfile.sex}.
              </div>
              {growthAssessment.anthropometricProfile.age_months !== undefined && (
                <div className="flex flex-wrap items-center gap-3 mt-2 pt-2 border-t border-slate-200 text-xs font-mono">
                  <span>Age: <strong>{growthAssessment.anthropometricProfile.age_months} mo</strong></span>
                  <span>&middot;</span>
                  <span>WHZ: <strong className={growthAssessment.wflZScore < -3 ? 'text-rose-700 font-bold' : 'text-slate-800'}>{growthAssessment.wflZScore > 0 ? `+${growthAssessment.wflZScore}` : growthAssessment.wflZScore} SD</strong></span>
                  {growthAssessment.wfaZScore !== undefined && (
                    <>
                      <span>&middot;</span>
                      <span>WAZ: <strong className={growthAssessment.wfaZScore < -3 ? 'text-rose-700 font-bold' : 'text-slate-800'}>{growthAssessment.wfaZScore > 0 ? `+${growthAssessment.wfaZScore}` : growthAssessment.wfaZScore} SD</strong></span>
                    </>
                  )}
                  {growthAssessment.lfaZScore !== undefined && (
                    <>
                      <span>&middot;</span>
                      <span>HAZ: <strong className={growthAssessment.lfaZScore < -3 ? 'text-rose-700 font-bold' : 'text-slate-800'}>{growthAssessment.lfaZScore > 0 ? `+${growthAssessment.lfaZScore}` : growthAssessment.lfaZScore} SD</strong></span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Classification Status */}
            <div>
              <div className="text-xs font-semibold text-slate-600 mb-1">
                Classification Status:
              </div>
              <div
                className={`p-3.5 rounded-lg border text-sm font-bold flex items-center justify-between ${
                  growthAssessment.isSam
                    ? 'bg-rose-50/90 border-rose-300 text-rose-900'
                    : 'bg-amber-50/90 border-amber-300 text-amber-900'
                }`}
              >
                <span>{growthAssessment.classificationStatus}</span>
                {growthAssessment.whoThresholds && (
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/70">
                    -3 SD: {growthAssessment.whoThresholds.sd3neg} kg
                  </span>
                )}
              </div>
            </div>

            {/* Diagnostic Indicator */}
            <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200">
              <div className="text-xs font-semibold text-slate-600 mb-1">
                Diagnostic Indicator:
              </div>
              <div className="text-sm font-medium text-slate-800 leading-relaxed">
                {growthAssessment.diagnosticIndicator}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 2: Patient Feeding Target Summary
         ========================================================================= */}
      <section
        id="feeding-target-section"
        className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Patient Feeding Target Summary
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold self-start sm:self-auto">
            {input.therapeutic_phase} &middot; {feedingSummary.feedsPerDay} Feeds/Day
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Target Volume Per Feed */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-blue-900 mb-1">
                <span className="uppercase tracking-wider">Target Volume Per Feed</span>
                <Clock className="w-4 h-4 text-blue-700" />
              </div>
              <div className="text-3xl font-mono font-bold text-blue-950">
                {feedingSummary.targetVolumePerFeed}
                <span className="text-sm font-sans font-normal text-blue-700 ml-1.5">mL</span>
              </div>
            </div>
            <div className="text-xs text-blue-800 mt-2">
              Administered every <strong>{feedingSummary.feedingIntervalHours} hours</strong> (rounded to nearest 5 mL).
            </div>
          </div>

          {/* Total Fluid Volume per 24 hours */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span className="uppercase tracking-wider">Total Fluid Volume (24h)</span>
                <Droplet className="w-4 h-4 text-slate-600" />
              </div>
              <div className="text-3xl font-mono font-bold text-slate-900">
                {feedingSummary.dailyVolume}
                <span className="text-sm font-sans font-normal text-slate-500 ml-1.5">mL/day</span>
              </div>
            </div>
            <div className="text-xs text-slate-600 mt-2">
              Calculated at <strong>{feedingSummary.mlPerKgPerDay} mL/kg/day</strong>.
            </div>
          </div>

          {/* Critical Minimum Daily Intake (80%) */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1">
                <span className="uppercase tracking-wider">Critical Minimum Intake (80%)</span>
                <AlertTriangle className="w-4 h-4 text-amber-700" />
              </div>
              <div className="text-3xl font-mono font-bold text-amber-950">
                {feedingSummary.safeMinimumVolume}
                <span className="text-sm font-sans font-normal text-amber-700 ml-1.5">mL/day</span>
              </div>
            </div>
            <div className="text-xs text-amber-800 mt-2">
              Safe baseline threshold (<strong>{feedingSummary.safeMinMlPerKg} mL/kg/day</strong>).
            </div>
          </div>
        </div>

        {/* Verbatim summary text format */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1.5">
          <div>
            &bull; <strong>Target Volume Per Feed:</strong> <strong className="font-mono text-blue-800">{feedingSummary.targetVolumePerFeed} mL</strong> administered every {feedingSummary.feedingIntervalHours} hours.
          </div>
          <div>
            &bull; <strong>Total Fluid Volume per 24 hours:</strong> <span className="font-mono font-bold text-slate-900">{feedingSummary.dailyVolume} mL/day</span>.
          </div>
          <div>
            &bull; <strong>Critical Minimum Daily Intake (80%):</strong> <span className="font-mono font-bold text-amber-900">{feedingSummary.safeMinimumVolume} mL/day</span>.
          </div>
          <div className="pt-2 mt-2 border-t border-slate-200 font-mono text-[11px] text-slate-500">
            <strong>Calculation Breakdown (WHO Table 7):</strong> {input.weight_kg} kg &times; {feedingSummary.mlPerKgPerDay} mL/kg/d = {Math.round(input.weight_kg * feedingSummary.mlPerKgPerDay)} mL &divide; {feedingSummary.feedsPerDay} feeds = {feedingSummary.unroundedPerFeed} mL &rarr; {feedingSummary.targetVolumePerFeed} mL per feed (rounded to 5 mL).
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: CRITICAL SAFETY ERROR (Rule 2 Fluid Overload Check)
         ========================================================================= */}
      {safety.rule2FluidOverloadHalted && (
        <section
          id="critical-safety-error"
          className="rounded-xl border-2 border-rose-600 bg-rose-50 p-5 sm:p-6 shadow-sm"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-rose-600 text-white shrink-0 mt-0.5">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-3 flex-1">
              <div className="text-base font-extrabold text-rose-950 leading-snug">
                {safety.rule2ErrorText}
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                F-100 contains high protein and sodium relative to the cardiac reserve of an infant with kwashiorkor. Administering F-100 during severe edema expands intravascular plasma volume uncontrollably, triggering acute cardiac failure.
              </p>
              {onSwitchTherapeuticPhase && (
                <div className="pt-1">
                  <button
                    onClick={() => onSwitchTherapeuticPhase('F-75 Stabilization')}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 active:scale-95 rounded-lg shadow-xs transition-all flex items-center gap-2 min-h-[44px]"
                  >
                    <span>Switch Patient to F-75 Stabilization Immediately</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 4: Manual 24-Hour Batch Recipe
          *(Do not display this section if Rule 2 Fluid Overload Check fails)*
         ========================================================================= */}
      {!safety.rule2FluidOverloadHalted && recipe && (
        <section
          id="batch-recipe-section"
          className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Manual 24-Hour Batch Recipe
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span>Scale Factor: {recipe.scaleFactor}</span>
              <span>&middot;</span>
              <span>Total: {recipe.dailyVolume} mL</span>
            </div>
          </div>

          <div className="mb-4 text-sm text-slate-800">
            To prepare exactly <strong>{recipe.dailyVolume} mL</strong> of therapeutic milk, combine:
          </div>

          {/* Ingredient items list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {/* 1. Milk Base */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500">1. Milk Base</div>
                <div className="text-xs font-semibold text-slate-900">{recipe.milkBase.name}</div>
              </div>
              <div className="text-right">
                <span className="text-lg font-mono font-bold text-blue-800">
                  {recipe.milkBase.amount}
                </span>
                <span className="text-xs font-mono text-slate-500 ml-1">{recipe.milkBase.unit}</span>
              </div>
            </div>

            {/* 2. Sugar */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500">2. Sugar</div>
                <div className="text-xs font-semibold text-slate-900">White Sugar</div>
              </div>
              <div className="text-right">
                <span className="text-lg font-mono font-bold text-blue-800">{recipe.sugarGrams}</span>
                <span className="text-xs font-mono text-slate-500 ml-1">g</span>
              </div>
            </div>

            {/* 3. Vegetable Oil */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500">3. Vegetable Oil</div>
                <div className="text-xs font-semibold text-slate-900">Refined vegetable oil</div>
              </div>
              <div className="text-right">
                <span className="text-lg font-mono font-bold text-blue-800">
                  {recipe.vegetableOilGrams}
                </span>
                <span className="text-xs font-mono text-slate-500 ml-1">g</span>
              </div>
            </div>

            {/* 4. Cereal Flour */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500">4. Cereal Flour</div>
                <div className="text-xs font-semibold text-slate-900">
                  {recipe.cerealFlourGrams > 0 ? 'Milled rice / cereal flour' : 'None (0g for F-100)'}
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-mono font-bold text-blue-800">
                  {recipe.cerealFlourGrams}
                </span>
                <span className="text-xs font-mono text-slate-500 ml-1">g</span>
              </div>
            </div>

            {/* 5. CMV Solution */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between md:col-span-2">
              <div>
                <div className="text-[11px] font-bold text-slate-500">5. CMV Solution (Combined Mineral Vitamin)</div>
                <div className="text-xs font-semibold text-slate-900">
                  Liquid electrolyte &amp; micronutrient solution (20 mL per 1,000 mL milk)
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-mono font-bold text-blue-800">{recipe.cmvLiquidMl}</span>
                <span className="text-xs font-mono text-slate-500 ml-1">mL</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 mb-4 italic">
            *(Top up with warm, pre-boiled water until the final solution hits exactly the{' '}
            <strong className="text-slate-900">{recipe.dailyVolume} mL</strong> mark).*
          </div>

          {/* Preparation Step */}
          <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200 mb-4">
            <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
              Preparation Step:
            </div>
            <div className="text-xs font-medium text-slate-800 leading-relaxed">
              {recipe.preparationStep}
            </div>
          </div>

          {/* Rule 1 Osmolality Warning notice box (if triggered) */}
          {safety.rule1F75OsmolalityTriggered && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 mb-4">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>{safety.rule1NoticeText}</span>
              </div>
              <div className="text-xs text-amber-800 mt-1">
                Current sugar concentration: <strong>{safety.sugarPercentageOfVolume}% w/v</strong> (safe threshold &le;10%).
              </div>
            </div>
          )}

          {/* Caloric & Osmolar Profile strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-xs">
            <div className="p-2 rounded bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500">Energy Density:</span>
              <div className="font-mono font-bold text-slate-900 mt-0.5">
                {recipe.energyKcalPer100ml} kcal / 100mL
              </div>
            </div>
            <div className="p-2 rounded bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500">24h Energy:</span>
              <div className="font-mono font-bold text-slate-900 mt-0.5">
                {recipe.energyKcalTotal} kcal/day
              </div>
            </div>
            <div className="p-2 rounded bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500">Sugar Concentration:</span>
              <div className="font-mono font-bold text-slate-900 mt-0.5">
                {recipe.sugarVolumePercentage}% w/v
              </div>
            </div>
            <div className="p-2 rounded bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500">Osmolality:</span>
              <div className="font-mono font-bold text-slate-900 mt-0.5">
                {input.therapeutic_phase === 'F-75 Stabilization' ? '~330 mOsm/kg' : '~415 mOsm/kg'}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 5: Clinical Directive Alert
         ========================================================================= */}
      <section
        id="clinical-directive-section"
        className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Clinical Directive Alert
          </h3>
          <span className="text-xs font-mono text-slate-500">Inpatient Nursing Directive</span>
        </div>

        <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-300">
          <div className="text-xs font-semibold text-slate-900 leading-relaxed">
            {clinicalDirective.directiveText}
          </div>
        </div>
      </section>
    </div>
  );
};
