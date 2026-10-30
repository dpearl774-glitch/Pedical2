import React, { useState } from 'react';
import {
  FullEvaluationResult,
  TherapeuticPhase,
  calculateWeightGainRate,
} from '../utils/clinicalCalculations';
import {
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Calculator,
  Pill,
} from 'lucide-react';
import { ClinicalNumberInput } from './ClinicalNumberInput';

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
  const [showWeightGainCalc, setShowWeightGainCalc] = useState(false);

  // Weight gain calculator states
  const { input, growthAssessment, feedingSummary, recipe, safety, clinicalDirective } = evaluation;
  const [calcInitWeight, setCalcInitWeight] = useState<number>(input.weight_kg - 0.4 > 1.5 ? Number((input.weight_kg - 0.4).toFixed(1)) : input.weight_kg);
  const [calcCurrWeight, setCalcCurrWeight] = useState<number>(input.weight_kg);
  const [calcDays, setCalcDays] = useState<number>(7);

  const weightGainResult = calculateWeightGainRate(calcInitWeight, calcCurrWeight, calcDays);

  // Plain-text export for hospital electronic medical records
  const generatePlainTextReport = () => {
    let report = `PEDICAL CLINICAL EVALUATION REPORT - WHO 2023 ACUTE MALNUTRITION\n`;
    report += `Timestamp: ${new Date(evaluation.timestamp).toLocaleString()}\n`;
    report += `Calculation Mode: ${input.calculation_mode}\n\n`;

    if (input.calculation_mode === 'Full WHO Assessment + Calculator' && growthAssessment) {
      report += `WHO Growth Assessment Output\n`;
      report += `- Anthropometric Profile: ${growthAssessment.anthropometricProfile.weight_kg} kg, ${growthAssessment.anthropometricProfile.height_cm} cm, ${growthAssessment.anthropometricProfile.sex}, MUAC: ${input.muac_mm ? `${input.muac_mm} mm` : 'Not recorded'}.\n`;
      report += `- Classification Status: ${growthAssessment.classificationStatus}\n`;
      report += `- Diagnostic Indicator: ${growthAssessment.diagnosticIndicator}\n\n`;
    }

    report += `Patient Feeding & Macronutrient Target Summary\n`;
    report += `- Target Volume Per Feed: ${feedingSummary.targetVolumePerFeed} mL administered every ${feedingSummary.feedingIntervalHours} hours.\n`;
    report += `- Total Fluid Volume per 24 hours: ${feedingSummary.dailyVolume} mL/day (${feedingSummary.mlPerKgPerDay} mL/kg/day).\n`;
    report += `- Critical Minimum Daily Intake (80%): ${feedingSummary.safeMinimumVolume} mL/day.\n`;
    report += `- Energy Delivery: ${feedingSummary.dailyEnergyKcal} kcal/day (${feedingSummary.energyKcalPerKgDay} kcal/kg/day).\n`;
    report += `- Protein Delivery: ${feedingSummary.dailyProteinGrams} g/day (${feedingSummary.proteinGramsPerKgDay} g/kg/day).\n\n`;

    if (safety.rule2FluidOverloadHalted) {
      report += `${safety.rule2ErrorText}\n\n`;
    } else if (recipe) {
      report += `Manual 24-Hour Batch Recipe (${recipe.formulaCategory})\n`;
      report += `Osmolality: ~${recipe.estimatedOsmolalityMOsmKg} mOsm/kg | Energy: ${recipe.energyKcalPer100ml} kcal/100 mL\n`;
      report += `To prepare exactly ${recipe.dailyVolume} mL of therapeutic milk, combine:\n`;
      report += `1. Milk Base: ${recipe.milkBase.amount} ${recipe.milkBase.unit} (${recipe.milkBase.name})\n`;
      report += `2. Sugar: ${recipe.sugarGrams} g\n`;
      report += `3. Vegetable Oil: ${recipe.vegetableOilGrams} g\n`;
      report += `4. Cereal Flour: ${recipe.cerealFlourGrams} g ${recipe.cerealFlourGrams === 0 ? '(Non-cereal formulation)' : '(Cooked cereal flour)'}\n`;
      report += `5. CMV Solution: ${recipe.cmvLiquidMl} mL (liquid Combined Mineral Vitamin solution)\n`;
      report += `(Top up with warm, pre-boiled water until final solution hits exactly the ${recipe.dailyVolume} mL mark).\n\n`;
      report += `Preparation Step:\n${recipe.preparationStep}\n\n`;
      report += `Clinical Indication Note:\n${recipe.clinicalIndicationNote}\n\n`;
    }

    report += `Clinical Directive\n`;
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
  const isInfantUnder6m = input.age_months !== undefined && input.age_months < 6;

  return (
    <div className="space-y-5">
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span className="uppercase tracking-wider">Clinical evaluation</span>
          <span aria-hidden="true">&middot;</span>
          <span className="text-blue-700 font-bold">WHO 2023 Guidelines</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEmrPreview(!showEmrPreview)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all min-h-[44px]"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>{showEmrPreview ? 'Hide EMR text' : 'EMR text'}</span>
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

      {/* EMR Plaintext Preview */}
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

      {/* Infant under 6 months Clinical Warning */}
      {isInfantUnder6m && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1">
          <div className="font-bold text-amber-900">
            Infant Under 6 Months Protocol (WHO 2023 Recommendation 4.1)
          </div>
          <p className="text-amber-800 leading-relaxed">
            Prioritize breastfeeding assessment and Supplementary Suckling Technique (SST). F-75 is safe for stabilization. If F-100 is selected for rehabilitation, use <strong>Diluted F-100</strong> (100 mL F-100 + 35 mL safe water) to protect renal solute clearance.
          </p>
        </div>
      )}

      {/* SECTION 1: Prescribed Feeding & Macronutrient Targets */}
      <section
        id="feeding-target-section"
        className="card-depth rounded-2xl p-5 sm:p-6 space-y-4 bg-white"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Prescribed Feeding Targets
            </h3>
            <div className="text-xs text-slate-500 mt-0.5">
              {input.therapeutic_phase} &middot; WHO 2023 Standards
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-xl bg-blue-50 text-blue-800 font-bold border border-blue-200 shadow-2xs">
              {feedingSummary.feedsPerDay} feeds/day
            </span>
          </div>
        </div>

        {/* 3 Prominent Stat Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Target Volume Per Feed */}
          <div className="p-4.5 rounded-xl border border-blue-300/80 bg-gradient-to-br from-blue-50/90 via-white to-blue-50/40 shadow-xs flex flex-col justify-between min-h-[110px]">
            <div>
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                Per feed
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1 font-mono tabular-nums">
                {feedingSummary.targetVolumePerFeed}
                <span className="text-base font-bold text-blue-700 ml-1.5">mL</span>
              </div>
            </div>
            <div className="text-xs text-slate-700 mt-2">
              Every <strong className="text-slate-900">{feedingSummary.feedingIntervalHours} hours</strong> (rounded to 5 mL).
            </div>
          </div>

          {/* Total Fluid Volume per 24 hours */}
          <div className="p-4.5 rounded-xl border border-slate-300/80 bg-gradient-to-br from-slate-50/90 via-white to-slate-50/40 shadow-xs flex flex-col justify-between min-h-[110px]">
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                24h volume
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1 font-mono tabular-nums">
                {feedingSummary.dailyVolume}
                <span className="text-base font-bold text-slate-500 ml-1.5">mL/day</span>
              </div>
            </div>
            <div className="text-xs text-slate-700 mt-2">
              At <strong className="text-slate-900">{feedingSummary.mlPerKgPerDay} mL/kg/day</strong>.
            </div>
          </div>

          {/* Critical Minimum Daily Intake (80%) */}
          <div className="p-4.5 rounded-xl border border-amber-300/80 bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 shadow-xs flex flex-col justify-between min-h-[110px]">
            <div>
              <div className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                Minimum safe (80%)
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-950 mt-1 font-mono tabular-nums">
                {feedingSummary.safeMinimumVolume}
                <span className="text-base font-bold text-amber-800 ml-1.5">mL/day</span>
              </div>
            </div>
            <div className="text-xs text-amber-900 mt-2">
              NG tube threshold (<strong className="text-amber-950">{feedingSummary.safeMinMlPerKg} mL/kg/day</strong>).
            </div>
          </div>
        </div>

        {/* Dietitian Macronutrient Delivery Breakdown */}
        <div className="p-4 rounded-xl surface-sunken space-y-2 text-xs">
          <div className="font-bold text-slate-900 uppercase tracking-wider">
            Dietitian Macronutrient Delivery
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-2.5 rounded-lg card-depth">
              <span className="text-slate-500 text-[10px] font-semibold block">Daily Energy</span>
              <strong className="text-slate-900 text-sm font-bold font-mono tabular-nums">{feedingSummary.dailyEnergyKcal} kcal/day</strong>
            </div>
            <div className="p-2.5 rounded-lg card-depth">
              <span className="text-slate-500 text-[10px] font-semibold block">Energy Density</span>
              <strong className="text-slate-900 text-sm font-bold font-mono tabular-nums">{feedingSummary.energyKcalPerKgDay} kcal/kg/day</strong>
            </div>
            <div className="p-2.5 rounded-lg card-depth">
              <span className="text-slate-500 text-[10px] font-semibold block">Daily Protein</span>
              <strong className="text-slate-900 text-sm font-bold font-mono tabular-nums">{feedingSummary.dailyProteinGrams} g/day</strong>
            </div>
            <div className="p-2.5 rounded-lg card-depth">
              <span className="text-slate-500 text-[10px] font-semibold block">Protein Delivery</span>
              <strong className="text-slate-900 text-sm font-bold font-mono tabular-nums">{feedingSummary.proteinGramsPerKgDay} g/kg/day</strong>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: CRITICAL SAFETY ERROR */}
      {safety.rule2FluidOverloadHalted && (
        <section
          id="critical-safety-error"
          className="rounded-xl border-2 border-red-500 bg-red-50 p-4 sm:p-5 shadow-xs"
        >
          <div className="space-y-3">
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
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-xl transition-all min-h-[44px]"
                >
                  <span>Switch to F-75 stabilization</span>
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECTION 3: WHO Growth Assessment */}
      {input.calculation_mode === 'Full WHO Assessment + Calculator' && growthAssessment && (
        <section
          id="who-growth-section"
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
        >
          <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setGrowthDetailsOpen(!growthDetailsOpen)}
              className="flex-1 flex items-center justify-between text-left group min-h-[40px]"
            >
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                  WHO Growth Assessment
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Anthropometric Z-scores, MUAC, and malnutrition diagnostics
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
                  {growthAssessment.anthropometricProfile.weight_kg} kg &middot;{' '}
                  {growthAssessment.anthropometricProfile.height_cm} cm &middot;{' '}
                  {growthAssessment.anthropometricProfile.sex}
                  {input.muac_mm ? ` · MUAC: ${input.muac_mm} mm` : ''}
                  {input.head_circumference_cm ? ` · OFC: ${input.head_circumference_cm} cm` : ''}
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-2.5 pt-2.5 border-t border-slate-200 text-xs">
                  <span className="font-medium text-slate-600">
                    Age: <strong className="text-slate-900">{growthAssessment.anthropometricProfile.age_months ?? '--'} mo</strong>
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
                  {growthAssessment.muacStatus && (
                    <>
                      <span className="text-slate-400">&middot;</span>
                      <span className="font-medium text-slate-600">
                        MUAC Triage:{' '}
                        <strong className="text-slate-900 font-bold">{growthAssessment.muacStatus}</strong>
                      </span>
                    </>
                  )}
                  {growthAssessment.headCircumferenceStatus && growthAssessment.headCircumferenceStatus !== 'Not Recorded' && (
                    <>
                      <span className="text-slate-400">&middot;</span>
                      <span className="font-medium text-slate-600">
                        OFC:{' '}
                        <strong className="text-slate-900 font-bold">{input.head_circumference_cm} cm ({growthAssessment.headCircumferenceStatus})</strong>
                      </span>
                    </>
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

      {/* SECTION 4: DIETITIAN WEIGHT GAIN RATE CALCULATOR */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-700" />
            <h3 className="text-base font-bold text-slate-900">
              Dietitian Weight Gain Rate Calculator
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowWeightGainCalc(!showWeightGainCalc)}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            {showWeightGainCalc ? 'Hide' : 'Calculate g/kg/day'}
          </button>
        </div>

        {showWeightGainCalc && (
          <div className="pt-2 space-y-3 text-xs border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Weight (kg)</label>
                <ClinicalNumberInput
                  value={calcInitWeight}
                  onChange={(val) => setCalcInitWeight(val)}
                  min={1.5}
                  max={25.0}
                  step={0.1}
                  unit="kg"
                  className="w-full h-10 border border-slate-300 rounded-lg px-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Weight (kg)</label>
                <ClinicalNumberInput
                  value={calcCurrWeight}
                  onChange={(val) => setCalcCurrWeight(val)}
                  min={1.5}
                  max={25.0}
                  step={0.1}
                  unit="kg"
                  className="w-full h-10 border border-slate-300 rounded-lg px-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Days Elapsed</label>
                <ClinicalNumberInput
                  value={calcDays}
                  onChange={(val) => setCalcDays(val)}
                  min={1}
                  max={90}
                  isInteger={true}
                  unit="days"
                  className="w-full h-10 border border-slate-300 rounded-lg px-2.5 font-bold"
                />
              </div>
            </div>

            <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 space-y-1">
              <div className="flex items-center justify-between text-slate-900 font-bold text-sm">
                <span>Rate of Weight Gain:</span>
                <span className="text-base text-blue-900 font-extrabold">{weightGainResult.weightGainGPerKgDay} g/kg/day</span>
              </div>
              <div className="text-slate-700">
                Classification: <strong>{weightGainResult.classification}</strong> ({weightGainResult.weightGainGramsDay} g/day)
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed pt-1">
                {weightGainResult.clinicalInterpretation}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 5: Manual 24-Hour Batch Recipe */}
      {!safety.rule2FluidOverloadHalted && recipe && (
        <section
          id="batch-recipe-section"
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
        >
          <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setRecipeAccordionOpen(!recipeAccordionOpen)}
              className="flex-1 flex items-center justify-between text-left group min-h-[40px]"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                    24h Kitchen Batch Recipe
                  </h3>
                  <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    recipe.formulaCategory.includes('Cereal-based')
                      ? 'bg-teal-50 text-teal-800 border-teal-200'
                      : recipe.formulaCategory.includes('Standard')
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                  }`}>
                    {recipe.formulaCategory}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {recipe.dailyVolume} mL &middot; scale factor {recipe.scaleFactor} &middot; {recipe.milkBase.name} &middot; ~{recipe.estimatedOsmolalityMOsmKg} mOsm/kg
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
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-700">1. Milk Base</div>
                    <div className="text-xs text-slate-900 font-medium">{recipe.milkBase.name}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-slate-900">{recipe.milkBase.amount}</span>
                    <span className="text-xs font-medium text-slate-500 ml-1">{recipe.milkBase.unit}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-700">2. Sugar</div>
                    <div className="text-xs text-slate-900 font-medium">
                      {recipe.formulaCategory.includes('Cereal-based')
                        ? recipe.formulaCategory.includes('F-75')
                          ? 'White Sugar (Reduced 35g/L)'
                          : 'White Sugar (Reduced 25g/L)'
                        : 'Commercial White Sugar'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-slate-900">{recipe.sugarGrams}</span>
                    <span className="text-xs font-medium text-slate-500 ml-1">g</span>
                  </div>
                </div>

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

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-700">4. Cereal Flour</div>
                    <div className="text-xs text-slate-900 font-medium">
                      {recipe.cerealFlourGrams > 0
                        ? 'Cooked rice / maize flour (boiled 4–5 min)'
                        : 'None (0g · Non-cereal formulation)'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-slate-900">{recipe.cerealFlourGrams}</span>
                    <span className="text-xs font-medium text-slate-500 ml-1">g</span>
                  </div>
                </div>

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
                *(Top up with warm, pre-boiled water until final solution reaches exactly the <strong className="text-slate-900">{recipe.dailyVolume} mL</strong> mark).*
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

              {/* Clinical Indication & Rationale Callout */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Clinical Directive &amp; Osmolar Rationale:
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {recipe.clinicalIndicationNote}
                </p>
              </div>

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
                    ~{recipe.estimatedOsmolalityMOsmKg} mOsm/kg
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* SECTION 6: ROUTINE INPATIENT MEDICATIONS & MICRONUTRIENTS */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Pill className="w-4 h-4 text-blue-700" />
          <h3 className="text-base font-bold text-slate-900">
            Routine Inpatient Medications Schedule (WHO 2023 / IMAM)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">Broad-Spectrum Antibiotic</span>
            <div className="text-slate-700 font-medium">Amoxicillin: 15 mg/kg 8-hourly for 5 days</div>
            <div className="text-slate-500 text-[11px]">Given on admission to all SAM inpatients without complications.</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">Vitamin A Supplementation</span>
            <div className="text-slate-700 font-medium">Day 1 single dose (if no edema)</div>
            <div className="text-slate-500 text-[11px]">&lt;6m: 50,000 IU &middot; 6-11m: 100,000 IU &middot; &ge;12m: 200,000 IU</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">Folic Acid &amp; Zinc</span>
            <div className="text-slate-700 font-medium">Folic Acid: 5 mg Day 1, then 1 mg daily</div>
            <div className="text-slate-500 text-[11px]">Zinc 10–20 mg/day for 14 days during acute watery diarrhea.</div>
          </div>
        </div>
      </section>

      {/* SECTION 7: Clinical Directive Alert */}
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
