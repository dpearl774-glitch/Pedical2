import React from 'react';
import { BookOpen, ShieldCheck, HeartPulse, FileText, CheckCircle2 } from 'lucide-react';

export const ProtocolReferenceSection: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-700" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            WHO Clinical Protocols &amp; Reference Standards
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Consolidated clinical guidance based on the WHO Guidelines for the Inpatient Management of Severe Acute Malnutrition (2013 Updates).
        </p>
      </div>

      {/* 1. Comparison of F-75 vs F-100 */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-blue-700" />
          <span>1. Nutritional Composition: F-75 Stabilization vs F-100 Rehabilitation</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 font-mono text-[11px] text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Parameter / Component</th>
                <th className="py-2.5 px-3 bg-blue-50/50 text-blue-900 font-bold">F-75 Stabilization</th>
                <th className="py-2.5 px-3 bg-slate-100 text-slate-900 font-bold">F-100 Rehabilitation</th>
                <th className="py-2.5 px-3">Clinical Objective / Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-800">Energy Density</td>
                <td className="py-2 px-3 font-mono font-bold text-blue-900 bg-blue-50/20">75 kcal / 100 mL</td>
                <td className="py-2 px-3 font-mono font-bold text-slate-900 bg-slate-50/50">100 kcal / 100 mL</td>
                <td className="py-2 px-3 text-slate-600">F-75 maintains homeostasis; F-100 enables rapid weight gain (&gt;10 g/kg/d).</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-800">Protein Content</td>
                <td className="py-2 px-3 font-mono text-blue-900 bg-blue-50/20">0.9 g / 100 mL</td>
                <td className="py-2 px-3 font-mono text-slate-900 bg-slate-50/50">2.9 g / 100 mL</td>
                <td className="py-2 px-3 text-slate-600">Low protein in F-75 avoids overloading compromised liver and renal urea clearance.</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-800">Target Osmolality</td>
                <td className="py-2 px-3 font-mono text-blue-900 bg-blue-50/20">~330 mOsm/kg</td>
                <td className="py-2 px-3 font-mono text-slate-900 bg-slate-50/50">~415 mOsm/kg</td>
                <td className="py-2 px-3 text-slate-600">Prevents osmotic diarrhea across atrophic intestinal villi.</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-800">Cereal Starch</td>
                <td className="py-2 px-3 font-mono text-blue-900 bg-blue-50/20">35 g / 1000 mL</td>
                <td className="py-2 px-3 font-mono text-slate-900 bg-slate-50/50">0 g (None)</td>
                <td className="py-2 px-3 text-slate-600">Starch provides energy with low osmolar contribution (boiled 4 min to cook).</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-800">Electrolyte Balance</td>
                <td className="py-2 px-3 text-slate-700 bg-blue-50/20">High K+ &amp; Mg2+, Low Na+</td>
                <td className="py-2 px-3 text-slate-700 bg-slate-50/50">High K+ &amp; Mg2+, Mod Na+</td>
                <td className="py-2 px-3 text-slate-600">Redistributes intracellular potassium; extra sodium causes heart failure.</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-800">CMV Mineral Mix</td>
                <td className="py-2 px-3 font-mono text-blue-900 bg-blue-50/20">20 mL / 1000 mL</td>
                <td className="py-2 px-3 font-mono text-slate-900 bg-slate-50/50">20 mL / 1000 mL</td>
                <td className="py-2 px-3 text-slate-600">Liquid mineral solution provides vital K+, Mg2+, Zn, and Cu without sodium overload.</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-800">Iron Status</td>
                <td className="py-2 px-3 font-bold text-rose-700 bg-blue-50/20">Strictly 0 mg (No Iron)</td>
                <td className="py-2 px-3 text-slate-700 bg-slate-50/50">Add only in Phase 2</td>
                <td className="py-2 px-3 text-slate-600">Iron in stabilization fuels bacterial sepsis and free radical tissue injury.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Core Safety Guardrails Rationale */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-700" />
          <span>2. Clinical Safety Guardrails</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Rule 1: Osmolality Threshold (&le;10% Sugar w/v)
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              When preparing F-75 with local ingredients, sugar must not exceed 100 g per 1000 mL (10% w/v). Higher sugar concentrations dramatically elevate luminal osmotic pressure. The damaged intestinal mucosa cannot reabsorb water, resulting in acute, fatal osmotic diarrhea.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
            <div className="text-xs font-bold text-rose-900 uppercase tracking-wider">
              Rule 2: Absolute Contraindication of F-100 in Severe Edema
            </div>
            <p className="text-xs text-rose-800 leading-relaxed">
              Children with Kwashiorkor (+++ edema) have reduced myocardial mass, impaired left ventricular function, and sodium retention. F-100 contains 3x more protein and higher osmolar solute. Administering F-100 while edema persists causes rapid intravascular fluid expansion and acute heart failure.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Diagnostic & Admission Criteria */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-700" />
          <span>3. WHO Diagnostic Thresholds for Inpatient SAM</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
            <div className="font-bold text-slate-900 mb-1">Bilateral Pitting Edema</div>
            <div className="text-slate-600">
              Grade + (feet/ankles), ++ (feet, lower legs, hands), +++ (generalized, sacral, facial). Automatically diagnostic of SAM.
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
            <div className="font-bold text-slate-900 mb-1">Weight-for-Height/Length (WHZ)</div>
            <div className="text-slate-600">
              &lt; -3 Standard Deviations on the WHO Child Growth Standards (Severe Wasting).
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
            <div className="font-bold text-slate-900 mb-1">Mid-Upper Arm Circumference (MUAC)</div>
            <div className="text-slate-600">
              &lt; 115 mm in children aged 6 to 59 months indicates high mortality risk requiring immediate inpatient admission.
            </div>
          </div>
        </div>
      </div>

      {/* 4. Inpatient Phase Transition Protocol */}
      <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2 text-xs">
        <div className="font-bold text-blue-950 uppercase tracking-wider text-[11px]">
          4. 48-Hour Transition Protocol (F-75 to F-100)
        </div>
        <p className="text-slate-700 leading-relaxed">
          Transition to Phase 2 (F-100) begins only when: (1) appetite has returned, and (2) bilateral edema has reduced to mild/moderate or resolved. During the first 48 hours of transition, F-100 is given at the <strong>exact same volume</strong> as F-75 (e.g. 130 mL/kg/day). Once the child completes 48 hours without tachycardia or respiratory distress, volume is increased to full catch-up amounts (150–200 mL/kg/day).
        </p>
      </div>

      {/* 5. Clinical Scope, Regulatory Status & Data Privacy */}
      <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-2.5 text-xs">
        <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>5. Clinical Scope, Regulatory Status &amp; Privacy Architecture</span>
        </div>
        <div className="space-y-1.5 text-slate-600 leading-relaxed">
          <div>
            &bull; <strong>Clinical Decision Support (CDS) Scope:</strong> pedical is an open, deterministic calculation reference tool developed strictly according to published WHO guidelines. It provides transparent arithmetic and does not make automated autonomous medical decisions, diagnoses, or prescriptions.
          </div>
          <div>
            &bull; <strong>Professional Verification:</strong> All calculations, fluid volumes, and raw ingredient recipes must be reviewed and verified by a licensed clinician or dietitian against local institutional protocols prior to clinical administration.
          </div>
          <div>
            &bull; <strong>Zero Cloud Storage / Client-Side Privacy:</strong> All calculations and bed roster entries are executed and retained exclusively within the clinician&apos;s local browser session. No patient health information (PHI) or personal data is collected, transmitted, or hosted on external servers.
          </div>
          <div>
            &bull; <strong>De-Identification Policy:</strong> To maintain strict medical confidentiality, do not enter identifiable patient names or government/hospital identification numbers. Utilize anonymous cot identifiers (e.g. Cot 01) or de-identified initials only.
          </div>
        </div>
      </div>
    </div>
  );
};
