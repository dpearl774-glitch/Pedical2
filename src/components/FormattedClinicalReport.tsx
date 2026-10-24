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
  ChevronDown,
  ChevronUp,
  FileText,
  Beaker,
  CheckCircle2,
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
  const [showEmrPreview, setShowEmrPreview] = useState(false);
  const [recipeAccordionOpen, setRecipeAccordionOpen] = useState(false);
  const [growthDetailsOpen, setGrowthDetailsOpen] = useState(true);

  const { input, growthAssessment, feedingSummary, recipe, safety, clinicalDirective } = evaluation;

  // Plain-text export for hospital electronic medical records
  const generatePlainTextReport = () => {
    let report = `PEDICAL CLINICAL EVALUATION REPORT - WHO 2023 ACUTE MALNUTRITION\n`;
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

  const isSam = growthAssessment?.isSam || input.edema_severity !== 'None';
  const isMam = !isSam && growthAssessment?.classificationStatus?.includes('Moderate');

  return (
    <div className="space-y-5">
      {/* =========================================================================
          TOP ACTION BAR: EMR Copy & Report Status
         ========================================================================= */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span className="uppercase tracking-wider">Clinical evaluation</span>
          <span aria-hidden="true">&middot;</span>
          <span className="text-emerald-700 font-bold">WHO 2023</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEmrPreview(!showEmrPreview)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all min-h-[44px]"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>{showEmrPreview ? 'Hide text' : 'EMR text'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 active:scale-95 transition-all shadow-xs min-h-[44px]"
            title="Copy plain-text report for hospital charts"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-600" />
                <span>Copy EMR</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Optional EMR Plaintext Preview Box (Monospace strictly allowed here) */}
      {showEmrPreview && (
        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
            <span className="font-semibold uppercase tracking-wider">EMR export text</span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-blue-400 hover:text-blue-300 text-xs font-semibold"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap p-2 bg-slate-950 rounded-lg text-slate-300 max-h-60 overflow-y-auto">
            {generatePlainTextReport()}
          </pre>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: Patient Feeding Target Summary (PRIMARY CLINICAL OUTPUT)
         ========================================================================= */}
      <section
        id="feeding-target-section"
        className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Feeding targets
            </h3>
            <div className="text-xs text-slate-500 mt-0.5">
              {input.therapeutic_phase} &middot; WHO Table 7
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold">
              {feedingSummary.feedsPerDay} feeds/day
            </span>
          </div>
        </div>

        {/* 3 Prominent Stat Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Target Volume Per Feed */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-col justify-between min-h-[120px]">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-blue-900 mb-1">
                <span className="uppercase tracking-wider">Per feed</span>
                <Clock className="w-4 h-4 text-blue-700" />
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-slate-900 mt-1">
                {feedingSummary.targetVolumePerFeed}
                <span className="text-base font-medium text-blue-700 ml-1.5">mL</span>
              </div>
            </div>
            <div className="text-xs text-slate-700 mt-2">
              Every <strong className="text-slate-900">{feedingSummary.feedingIntervalHours} hours</strong> (rounded to 5 mL).
            </div>
          </div>

          {/* Total Fluid Volume per 24 hours */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between min-h-[120px]">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span className="uppercase tracking-wider">24h volume</span>
                <Droplet className="w-4 h-4 text-slate-600" />
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-slate-900 mt-1">
                {feedingSummary.dailyVolume}
                <span className="text-base font-medium text-slate-500 ml-1.5">mL/day</span>
              </div>
            </div>
            <div className="text-xs text-slate-700 mt-2">
              At <strong className="text-slate-900">{feedingSummary.mlPerKgPerDay} mL/kg/day</strong>.
            </div>
          </div>

          {/* Critical Minimum Daily Intake (80%) */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 flex flex-col justify-between min-h-[120px]">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1">
                <span className="uppercase tracking-wider">Minimum safe (80%)</span>
                <AlertTriangle className="w-4 h-4 text-amber-700" />
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-amber-950 mt-1">
                {feedingSummary.safeMinimumVolume}
                <span className="text-base font-medium text-amber-800 ml-1.5">mL/day</span>
              </div>
            </div>
            <div className="text-xs text-amber-900 mt-2">
              NG tube threshold (<strong className="text-amber-950">{feedingSummary.safeMinMlPerKg} mL/kg/day</strong>).
            </div>
          </div>
        </div>

        {/* Verbatim summary text format */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-slate-400">&bull;</span>
            <span>
              <strong className="text-slate-900">Per feed:</strong>{' '}
              <span className="text-sm font-bold text-slate-900">{feedingSummary.targetVolumePerFeed} mL</span> every {feedingSummary.feedingIntervalHours} hours.
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-slate-400">&bull;</span>
            <span>
              <strong className="text-slate-900">24h volume:</strong>{' '}
              <span className="font-bold text-slate-900">{feedingSummary.dailyVolume} mL/day</span>.
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-slate-400">&bull;</span>
            <span>
              <strong className="text-slate-900">Minimum safe (80%):</strong>{' '}
              <span className="font-bold text-amber-900">{feedingSummary.safeMinimumVolume} mL/day</span>.
            </span>
          </div>
          <div className="pt-2 mt-2 border-t border-slate-200 text-xs text-slate-500">
            <strong className="text-slate-700">Math (Table 7):</strong> {input.weight_kg} kg &times; {feedingSummary.mlPerKgPerDay} mL/kg/d = {Math.round(input.weight_kg * feedingSummary.mlPerKgPerDay)} mL &divide; {feedingSummary.feedsPerDay} feeds = {feedingSummary.unroundedPerFeed} mL &rarr; {feedingSummary.targetVolumePerFeed} mL/feed.
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: CRITICAL SAFETY ERROR (Rule 2 Fluid Overload Check)
         ========================================================================= */}
      {safety.rule2FluidOverloadHalted && (
        <section
          id="critical-safety-error"
          className="rounded-xl border-2 border-red-500 bg-red-50 p-4 sm:p-5 shadow-xs"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-red-600 text-white shrink-0 mt-0.5">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-3 flex-1">
              <div className="text-base font-bold text-red-950 leading-snug">
                {safety.rule2ErrorText}
              </div>
              <p className="text-xs text-red-800 leading-relaxed">
                F-100 contains high protein and sodium relative to the cardiac reserve of an infant with kwashiorkor. Administering F-100 during severe edema expands intravascular plasma volume uncontrollably, triggering acute cardiac failure.
              </p>
              {onSwitchTherapeuticPhase && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => onSwitchTherapeuticPhase('F-75 Stabilization')}
                    className="px-4 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 active:scale-95 rounded-xl shadow-xs transition-all flex items-center gap-2 min-h-[44px]"
                  >
                    <span>Switch to F-75 stabilization</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 3: WHO Growth Assessment Output (Collapsible Accordion)
         ========================================================================= */}
      {input.calculation_mode === 'Full WHO Assessment + Calculator' && growthAssessment && (
        <section
          id="who-growth-section"
          className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
        >
          <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setGrowthDetailsOpen(!growthDetailsOpen)}
              className="flex-1 flex items-center justify-between text-left group min-h-[40px]"
            >
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                  WHO growth assessment
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Z-scores and diagnostics
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    isSam
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : isMam
                      ? 'bg-amber-50 text-amber-600 border-amber-200'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}
                >
                  {growthAssessment.classificationStatus}
                </span>
                {growthDetailsOpen ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>
          </div>

          {growthDetailsOpen && (
            <div className="p-4 sm:p-5 space-y-4">
              {/* Anthropometric Profile Card */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Profile
                </div>
                <div className="text-base font-bold text-slate-900">
                  {growthAssessment.anthropometricProfile.weight_kg} kg,{' '}
                  {growthAssessment.anthropometricProfile.height_cm} cm,{' '}
                  {growthAssessment.anthropometricProfile.sex}.
                </div>

                {growthAssessment.anthropometricProfile.age_months !== undefined && (
                  <div className="flex flex-wrap items-center gap-3 mt-2.5 pt-2.5 border-t border-slate-200 text-xs">
                    <span className="font-medium text-slate-600">
                      Age: <strong className="text-slate-900">{growthAssessment.anthropometricProfile.age_months} mo</strong>
                    </span>
                    <span className="text-slate-400">&middot;</span>
                    <span className="font-medium text-slate-600">
                      WHZ:{' '}
                      <strong className={`text-sm ${growthAssessment.wflZScore < -3 ? 'text-red-600 font-bold' : 'text-slate-900 font-bold'}`}>
                        {growthAssessment.wflZScore > 0 ? `+${growthAssessment.wflZScore}` : growthAssessment.wflZScore} SD
                      </strong>
                    </span>
                    {growthAssessment.wfaZScore !== undefined && (
                      <>
                        <span className="text-slate-400">&middot;</span>
                        <span className="font-medium text-slate-600">
                          WAZ:{' '}
                          <strong className={`text-sm ${growthAssessment.wfaZScore < -3 ? 'text-red-600 font-bold' : 'text-slate-900 font-bold'}`}>
                            {growthAssessment.wfaZScore > 0 ? `+${growthAssessment.wfaZScore}` : growthAssessment.wfaZScore} SD
                          </strong>
                        </span>
                      </>
                    )}
                    {growthAssessment.lfaZScore !== undefined && (
                      <>
                        <span className="text-slate-400">&middot;</span>
                        <span className="font-medium text-slate-600">
                          HAZ:{' '}
                          <strong className={`text-sm ${growthAssessment.lfaZScore < -3 ? 'text-red-600 font-bold' : 'text-slate-900 font-bold'}`}>
                            {growthAssessment.lfaZScore > 0 ? `+${growthAssessment.lfaZScore}` : growthAssessment.lfaZScore} SD
                          </strong>
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Classification Status Card with explicit Clinical Highlight Colors */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Classification:
                </label>
                <div
                  className={`p-3.5 rounded-xl border text-sm font-bold flex flex-wrap items-center justify-between gap-2 ${
                    isSam
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : isMam
                      ? 'bg-amber-50 border-amber-200 text-amber-600'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{growthAssessment.classificationStatus}</span>
                  </div>
                  {growthAssessment.whoThresholds && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/80 border border-slate-200 text-slate-800">
                      -3 SD cutoff: <strong>{growthAssessment.whoThresholds.sd3neg} kg</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Diagnostic Indicator */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Diagnostic indicator:
                </label>
                <div className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                  {growthAssessment.diagnosticIndicator}
                </div>
              </div>

              {/* Growth Chart Link */}
              {onNavigateToChart && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onNavigateToChart}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 min-h-[44px]"
                  >
                    <span>View WHO growth charts &rarr;</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          SECTION 4: Manual 24-Hour Batch Recipe (Collapsible Accordion)
         ========================================================================= */}
      {!safety.rule2FluidOverloadHalted && recipe && (
        <section
          id="batch-recipe-section"
          className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
        >
          <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setRecipeAccordionOpen(!recipeAccordionOpen)}
              className="flex-1 flex items-center justify-between text-left group min-h-[40px]"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <Beaker className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                    Batch recipe
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {recipe.dailyVolume} mL &middot; scale: {recipe.scaleFactor} &middot; {recipe.milkBase.name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 px-2.5 py-1 rounded-lg bg-slate-100 hidden sm:inline">
                  {recipe.dailyVolume} mL
                </span>
                {recipeAccordionOpen ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>
          </div>

          {recipeAccordionOpen && (
            <div className="p-4 sm:p-5 space-y-4">
              <div className="text-xs text-slate-600">
                To prepare exactly <strong className="text-slate-900">{recipe.dailyVolume} mL</strong> of therapeutic milk for this patient, combine:
              </div>

              {/* Ingredient Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Milk Base */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-700">1. Milk Base</div>
                    <div className="text-xs text-slate-900 font-medium">{recipe.milkBase.name}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-slate-900">
                      {recipe.milkBase.amount}
                    </span>
                    <span className="text-xs font-medium text-slate-500 ml-1">{recipe.milkBase.unit}</span>
                  </div>
                </div>

                {/* 2. Sugar */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-700">2. Sugar</div>
                    <div className="text-xs text-slate-900 font-medium">Commercial White Sugar</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-slate-900">{recipe.sugarGrams}</span>
                    <span className="text-xs font-medium text-slate-500 ml-1">g</span>
                  </div>
                </div>

                {/* 3. Vegetable Oil */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-700">3. Vegetable Oil</div>
                    <div className="text-xs text-slate-900 font-medium">Refined cooking oil</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-slate-900">{recipe.vegetableOilGrams}</span>
                    <span className="text-xs font-medium text-slate-500 ml-1">g</span>
                  </div>
                </div>

                {/* 4. Cereal Flour */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-700">4. Cereal Flour</div>
                    <div className="text-xs text-slate-900 font-medium">
                      {recipe.cerealFlourGrams > 0 ? 'Milled rice / cereal flour' : 'None (0g for F-100)'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-slate-900">{recipe.cerealFlourGrams}</span>
                    <span className="text-xs font-medium text-slate-500 ml-1">g</span>
                  </div>
                </div>

                {/* 5. CMV Solution */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between sm:col-span-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-700">5. CMV Solution (Combined Mineral Vitamin)</div>
                    <div className="text-xs text-slate-900 font-medium">
                      Liquid electrolyte &amp; micronutrient solution (20 mL per 1,000 mL milk)
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-slate-900">{recipe.cmvLiquidMl}</span>
                    <span className="text-xs font-medium text-slate-500 ml-1">mL</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 italic">
                *(Top up with warm, pre-boiled water until the final solution reaches exactly the <strong className="text-slate-900">{recipe.dailyVolume} mL</strong> mark).*
              </div>

              {/* Preparation Step */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
                <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                  Preparation Step:
                </div>
                <div className="text-xs font-medium text-slate-800 leading-relaxed">
                  {recipe.preparationStep}
                </div>
              </div>

              {/* Rule 1 Osmolality Warning notice box (if triggered) */}
              {safety.rule1F75OsmolalityTriggered && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900">
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
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">Energy Density:</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {recipe.energyKcalPer100ml} kcal / 100mL
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">24h Energy:</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {recipe.energyKcalTotal} kcal/day
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">Sugar Conc:</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {recipe.sugarVolumePercentage}% w/v
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">Osmolality:</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {input.therapeutic_phase === 'F-75 Stabilization' ? '~330 mOsm/kg' : '~415 mOsm/kg'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          SECTION 5: Clinical Directive Alert
         ========================================================================= */}
      <section
        id="clinical-directive-section"
        className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Clinical directive
          </h3>
          <span className="text-xs font-semibold text-slate-500">Nursing directive</span>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-300">
          <div className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
            {clinicalDirective.directiveText}
          </div>
        </div>
      </section>
    </div>
  );
};
