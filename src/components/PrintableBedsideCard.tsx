import React, { useState } from 'react';
import { FullEvaluationResult, evaluatePatient } from '../utils/clinicalCalculations';
import { WardPatient } from '../data/wardPatients';
import { Printer, X, Download, Copy, Check, FileText, Table } from 'lucide-react';

interface PrintableBedsideCardProps {
  evaluation: FullEvaluationResult;
  allPatients?: WardPatient[];
  isBatchMode?: boolean;
  onClose: () => void;
}

export const PrintableBedsideCard: React.FC<PrintableBedsideCardProps> = ({
  evaluation,
  allPatients = [],
  isBatchMode = false,
  onClose,
}) => {
  const [printMode, setPrintMode] = useState<'single' | 'batch' | 'census'>(
    isBatchMode ? 'batch' : 'single'
  );
  const [copied, setCopied] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  // Trigger print with safety catch
  const handlePrint = () => {
    try {
      setPrintError(null);
      window.print();
    } catch {
      setPrintError(
        'Browser print was intercepted. Please use "Download Sheet" or "Copy Order" below to save or print.'
      );
    }
  };

  // Generate downloadable self-contained HTML file
  const handleDownloadHtml = () => {
    const printContent = document.getElementById('printable-ward-area')?.innerHTML || '';
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>pedical - Inpatient Diet Orders</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 20px; color: #000; background: #fff; }
    .page-break { page-break-after: always; break-after: page; margin-bottom: 30px; }
    .card { border: 2px solid #000; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .highlight { background: #f1f5f9; padding: 8px; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { border: 1px solid #333; padding: 8px; text-align: left; font-size: 12px; }
    th { background: #e2e8f0; }
    @media print { body { margin: 10mm; } button { display: none; } }
  </style>
</head>
<body>
  ${printContent}
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedical-inpatient-orders-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyPrescriptionText = () => {
    const text = `pedical INPATIENT NUTRITION ORDER
Date: ${new Date().toLocaleDateString()}
Patient: ${evaluation.input.patient_name || 'Inpatient'} (${evaluation.input.cot_number || 'Cot 1'})
MRN: ${evaluation.input.mrn || 'N/A'}
Weight: ${evaluation.input.weight_kg} kg | Length: ${evaluation.input.height_cm || 'N/A'} cm
Phase: ${evaluation.input.therapeutic_phase} | Edema: ${evaluation.input.edema_severity}
TARGET PER FEED: ${evaluation.feedingSummary.targetVolumePerFeed} mL q${evaluation.feedingSummary.feedingIntervalHours}h (${evaluation.feedingSummary.feedsPerDay} feeds/day)
24H TOTAL VOLUME: ${evaluation.feedingSummary.dailyVolume} mL/day (${evaluation.feedingSummary.mlPerKgPerDay} mL/kg/d)
CRITICAL SAFE MINIMUM: ${evaluation.feedingSummary.safeMinimumVolume} mL/day (NG watch if below)
Directive: ${evaluation.clinicalDirective.directiveText}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-4 sm:p-7 border border-slate-300 print:border-none print:shadow-none print:p-0 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Controls (hidden on paper) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-200 gap-3">
          <div>
            <div className="text-sm font-bold text-slate-900">
              pedical &middot; Inpatient Bedside Diet Order Preview
            </div>
            <div className="text-xs text-slate-500">
              {printMode === 'single'
                ? `Active Child: ${evaluation.input.cot_number || 'Cot 1'}`
                : printMode === 'batch'
                ? `Batch Cards: All ${allPatients.length} Ward Children`
                : `Ward Census Summary Table (${allPatients.length} Children)`}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {allPatients.length > 1 && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPrintMode('single')}
                  className={`px-2.5 py-1.5 rounded-md transition-all ${
                    printMode === 'single'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Single Card
                </button>
                <button
                  type="button"
                  onClick={() => setPrintMode('batch')}
                  className={`px-2.5 py-1.5 rounded-md transition-all ${
                    printMode === 'batch'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Cards ({allPatients.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPrintMode('census')}
                  className={`px-2.5 py-1.5 rounded-md transition-all ${
                    printMode === 'census'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Ward Census Table
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={copyPrescriptionText}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 min-h-[36px]"
              title="Copy clinical text to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 min-h-[36px]"
              title="Download standalone HTML flowsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download Sheet</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg flex items-center gap-1.5 shadow-xs min-h-[36px]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Order</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {printError && (
          <div className="no-print mb-3 p-2 bg-amber-50 border border-amber-300 rounded text-amber-900 text-xs">
            {printError}
          </div>
        )}

        {/* Scrollable Printable Flowsheets Area */}
        <div
          id="printable-ward-area"
          className="overflow-y-auto space-y-6 pr-1 print:overflow-visible print:space-y-0"
        >
          {printMode === 'census' ? (
            /* WARD CENSUS SUMMARY TABLE */
            <div className="p-4 bg-white text-slate-900 space-y-4 font-sans">
              <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-start">
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase text-slate-600">
                    pedical &middot; WHO PROTOCOL INPATIENT ROSTER &amp; BEDSIDE SUMMARY
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-0.5">
                    INPATIENT BEDSIDE SUMMARY &amp; FEEDING ESTIMATES
                  </h2>
                </div>
                <div className="text-right text-xs font-mono">
                  <div>Date: {new Date().toLocaleDateString()}</div>
                  <div className="text-slate-500 font-bold">{allPatients.length} De-Identified Beds</div>
                </div>
              </div>

              <table className="w-full border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                    <th className="p-2 border border-slate-300 text-left">Cot #</th>
                    <th className="p-2 border border-slate-300 text-left">Patient Name &amp; MRN</th>
                    <th className="p-2 border border-slate-300 text-left">Sex / Age</th>
                    <th className="p-2 border border-slate-300 text-left">Weight</th>
                    <th className="p-2 border border-slate-300 text-left">Edema</th>
                    <th className="p-2 border border-slate-300 text-left">Phase</th>
                    <th className="p-2 border border-slate-300 text-right">Target Feed (mL)</th>
                    <th className="p-2 border border-slate-300 text-right">24h Total (mL)</th>
                    <th className="p-2 border border-slate-300 text-right">Safe Min (mL)</th>
                  </tr>
                </thead>
                <tbody>
                  {allPatients.map((p) => {
                    const pEval = evaluatePatient(p.input);
                    return (
                      <tr key={p.id} className="border-b border-slate-200 hover:bg-slate-50 font-mono">
                        <td className="p-2 border border-slate-300 font-bold text-blue-900">
                          {p.cotNumber}
                        </td>
                        <td className="p-2 border border-slate-300 font-sans">
                          <strong>{p.name}</strong>
                          <div className="text-[10px] text-slate-500 font-mono">{p.mrn}</div>
                        </td>
                        <td className="p-2 border border-slate-300">
                          {p.input.sex || '--'} / {p.input.age_months || '--'}m
                        </td>
                        <td className="p-2 border border-slate-300 font-bold">
                          {p.input.weight_kg} kg
                        </td>
                        <td className="p-2 border border-slate-300">
                          {p.input.edema_severity}
                        </td>
                        <td className="p-2 border border-slate-300 font-sans">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              p.input.therapeutic_phase === 'F-75 Stabilization'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.input.therapeutic_phase.split(' ')[0]}
                          </span>
                        </td>
                        <td className="p-2 border border-slate-300 text-right font-bold text-blue-900">
                          {pEval.feedingSummary.targetVolumePerFeed} mL q{p.input.feeding_interval_hours}h
                        </td>
                        <td className="p-2 border border-slate-300 text-right font-bold">
                          {pEval.feedingSummary.dailyVolume} mL
                        </td>
                        <td className="p-2 border border-slate-300 text-right text-amber-800">
                          {pEval.feedingSummary.safeMinimumVolume} mL
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="pt-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-slate-500 mb-6">Ward Dietitian in Charge:</div>
                  <div className="border-b border-slate-400"></div>
                </div>
                <div>
                  <div className="text-slate-500 mb-6">Nursing Shift Supervisor:</div>
                  <div className="border-b border-slate-400"></div>
                </div>
              </div>
            </div>
          ) : printMode === 'batch' && allPatients.length > 0 ? (
            allPatients.map((p, idx) => {
              const pEval = evaluatePatient(p.input);
              return (
                <div key={p.id} className={`${idx > 0 ? 'print:break-before-page pt-4' : ''}`}>
                  <SinglePatientCard
                    evaluation={pEval}
                    patientName={p.name}
                    cotNumber={p.cotNumber}
                    mrn={p.mrn}
                  />
                </div>
              );
            })
          ) : (
            <SinglePatientCard
              evaluation={evaluation}
              patientName={evaluation.input.patient_name}
              cotNumber={evaluation.input.cot_number}
              mrn={evaluation.input.mrn}
            />
          )}
        </div>
      </div>
    </div>
  );
};

interface SinglePatientCardProps {
  evaluation: FullEvaluationResult;
  patientName?: string;
  cotNumber?: string;
  mrn?: string;
}

const SinglePatientCard: React.FC<SinglePatientCardProps> = ({
  evaluation,
  patientName = 'Pediatric Patient',
  cotNumber = 'Cot 1',
  mrn = 'PED-2026-081',
}) => {
  const { input, growthAssessment, feedingSummary, recipe, safety, clinicalDirective } = evaluation;

  return (
    <div className="border-2 border-slate-900 p-5 sm:p-6 rounded-lg space-y-4 text-slate-900 font-sans bg-white mb-6">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
        <div>
          <div className="text-[11px] uppercase font-mono font-bold tracking-wider text-slate-600">
            pedical &middot; WHO 2013 INPATIENT SAM PROTOCOL &middot; BEDSIDE WORKSHEET
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 mt-0.5">
            BEDSIDE NUTRITIONAL CALCULATION WORKSHEET
          </h2>
          <div className="text-xs text-slate-600 mt-0.5">
            Bed Identifier: <strong>{patientName}</strong> &middot; Case Ref: <span className="font-mono">{mrn}</span>
          </div>
        </div>
        <div className="text-right text-xs font-mono">
          <div>Date: {new Date().toLocaleDateString()}</div>
          <div className="font-black text-blue-900 text-sm mt-1 px-2.5 py-0.5 border border-slate-900 rounded inline-block">
            {cotNumber}
          </div>
        </div>
      </div>

      {/* Patient Profile */}
      <div className="grid grid-cols-4 gap-2 bg-slate-100 p-3 rounded text-xs font-mono">
        <div>
          <span className="text-slate-500 block text-[10px]">WEIGHT</span>
          <strong className="text-sm">{input.weight_kg} kg</strong>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">LENGTH</span>
          <strong className="text-sm">{input.height_cm ?? '--'} cm</strong>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">SEX / AGE</span>
          <strong className="text-sm">
            {input.sex ?? '--'} / {input.age_months ?? '--'}m
          </strong>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">EDEMA SEVERITY</span>
          <strong className="text-sm">{input.edema_severity}</strong>
        </div>
      </div>

      {/* Diagnostic status */}
      {growthAssessment && (
        <div className="border border-slate-300 p-2.5 rounded text-xs">
          <div>
            <strong>Classification Status:</strong> {growthAssessment.classificationStatus}
          </div>
          <div className="text-slate-700 mt-0.5">
            <strong>Diagnostic Indicator:</strong> {growthAssessment.diagnosticIndicator}
          </div>
        </div>
      )}

      {/* Prescribed Feeding Regimen */}
      <div className="border-2 border-blue-900 bg-blue-50/40 p-4 rounded-lg">
        <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
          WHO Protocol Target Regimen ({input.therapeutic_phase})
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 bg-white rounded border border-blue-200">
            <div className="text-[10px] text-slate-500 uppercase">Target Per Feed</div>
            <div className="text-2xl font-mono font-black text-blue-900">
              {feedingSummary.targetVolumePerFeed} mL
            </div>
            <div className="text-[10px] text-blue-800">
              q{feedingSummary.feedingIntervalHours}h ({feedingSummary.feedsPerDay} feeds/day)
            </div>
          </div>

          <div className="p-2 bg-white rounded border border-blue-200">
            <div className="text-[10px] text-slate-500 uppercase">Total 24h Volume</div>
            <div className="text-2xl font-mono font-black text-slate-900">
              {feedingSummary.dailyVolume} mL
            </div>
            <div className="text-[10px] text-slate-600">
              {feedingSummary.mlPerKgPerDay} mL/kg/day
            </div>
          </div>

          <div className="p-2 bg-white rounded border border-amber-300 bg-amber-50/50">
            <div className="text-[10px] text-amber-800 uppercase">Critical Min (80%)</div>
            <div className="text-2xl font-mono font-black text-amber-950">
              {feedingSummary.safeMinimumVolume} mL
            </div>
            <div className="text-[10px] text-amber-800">NG tube watch</div>
          </div>
        </div>
      </div>

      {/* Batch Recipe */}
      {recipe && !safety.rule2FluidOverloadHalted && (
        <div className="border border-slate-300 p-3.5 rounded-lg text-xs space-y-2">
          <div className="font-bold text-slate-900">
            Manual 24-Hour Batch Recipe ({recipe.dailyVolume} mL total)
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono">
            <div>
              1. {recipe.milkBase.name}:{' '}
              <strong>
                {recipe.milkBase.amount} {recipe.milkBase.unit}
              </strong>
            </div>
            <div>
              2. Commercial Sugar: <strong>{recipe.sugarGrams} g</strong>
            </div>
            <div>
              3. Vegetable Oil: <strong>{recipe.vegetableOilGrams} g</strong>
            </div>
            <div>
              4. Cereal Flour: <strong>{recipe.cerealFlourGrams} g</strong>
            </div>
            <div className="col-span-2">
              5. CMV Solution: <strong>{recipe.cmvLiquidMl} mL</strong> (liquid mineral mix, 20 mL/L)
            </div>
          </div>
          <div className="pt-2 text-[11px] text-slate-700 border-t border-slate-200">
            <strong>Preparation:</strong> {recipe.preparationStep}
          </div>
        </div>
      )}

      {safety.rule2FluidOverloadHalted && (
        <div className="border-2 border-rose-600 bg-rose-50 p-3 rounded-lg text-rose-950 font-bold text-xs">
          {safety.rule2ErrorText}
        </div>
      )}

      {/* Mandatory Directive */}
      <div className="border border-amber-300 bg-amber-50/50 p-3 rounded text-xs">
        <div className="font-bold text-amber-900 uppercase text-[11px] mb-0.5">
          Clinical Reference Directive:
        </div>
        <div className="text-slate-800 leading-snug">{clinicalDirective.directiveText}</div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-6 pt-3 border-t border-slate-300 text-xs">
        <div>
          <div className="text-slate-500 mb-6">Calculations Verified &amp; Approved by (Dietitian / Clinician):</div>
          <div className="border-b border-slate-400"></div>
          <div className="text-[10px] text-slate-400 mt-1">
            Signature &amp; Professional Registration #
          </div>
        </div>
        <div>
          <div className="text-slate-500 mb-6">Administering Clinical Nurse:</div>
          <div className="border-b border-slate-400"></div>
          <div className="text-[10px] text-slate-400 mt-1">
            Signature &amp; Administration Timestamp
          </div>
        </div>
      </div>
    </div>
  );
};
