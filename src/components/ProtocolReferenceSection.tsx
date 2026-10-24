import React from 'react';
import {
  BookOpen,
  ShieldCheck,
  HeartPulse,
  FileText,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Droplets,
  Stethoscope,
  Activity,
  Layers,
} from 'lucide-react';
import {
  WHO_GUIDELINE_FULL_TITLE,
  GHANA_IMAM_GUIDELINE_TITLE,
} from '../utils/clinicalCalculations';

export const ProtocolReferenceSection: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6">
      {/* Header with Dual Badges: GHS/UNICEF IMAM & WHO 2023 */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-700" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Ghana Health Service (GHS) &amp; WHO Inpatient Malnutrition Protocols
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-100 border border-teal-200 text-teal-900 font-sans text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5 text-teal-700" />
              <span>GHS / UNICEF IMAM Aligned</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-100 border border-blue-200 text-blue-900 font-sans text-[11px] font-bold">
              <span>WHO 2023 Guideline Aligned</span>
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          Operationalized for Ghanaian Registered Dietitians (RDs), Pediatric Nutrition Officers, and Medical Officers.
          Grounded in the <strong>Ghana Health Service (GHS) / UNICEF National Guidelines for Integrated Management of Acute Malnutrition (IMAM) &amp; CMAM Protocols</strong>, harmonized with the <em>{WHO_GUIDELINE_FULL_TITLE}</em>.
        </p>
      </div>

      {/* 1. GHANA HEALTH SERVICE (GHS) / UNICEF CMAM & IMAM FRAMEWORK */}
      <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center font-black text-xs">
            GHS
          </div>
          <div>
            <h3 className="text-sm font-bold text-teal-950">
              Ghana Health Service (GHS) CMAM &amp; IMAM 4-Pillar Continuum
            </h3>
            <p className="text-[11px] text-teal-800">
              National strategy for preventing and managing severe wasting and nutritional oedema
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3 rounded-lg border border-teal-200 shadow-2xs space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" />
              <span>1. Community Mobilization</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Active case-finding in communities via Community Health Officers (CHOs) and volunteers using color-coded MUAC tapes (&lt;11.5 cm Red) and bilateral oedema screening.
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-teal-200 shadow-2xs space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
              <span>2. Outpatient Care (OTP)</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              For SAM children (6–59m) <strong>without medical complications</strong> who pass the appetite test. Treated at home with Ready-to-Use Therapeutic Food (RUTF) and routine medicines.
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-teal-200 shadow-2xs space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
              <span>3. Inpatient Care (SC / TFC)</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              For SAM with <strong>medical complications</strong>, failed appetite test, or severe edema (+++). Managed in Stabilization Centres / TFCs following the 10 Essential Steps and F-75 feeding.
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-teal-200 shadow-2xs space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" />
              <span>4. Supplementary Feeding (SFP)</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              For Moderate Acute Malnutrition (MAM, MUAC 11.5–12.4 cm). Managed with supplementary fortified blended foods (CSB+ or locally enriched Tom Brown porridge).
            </p>
          </div>
        </div>
      </div>

      {/* 2. THE 10 ESSENTIAL INPATIENT MANAGEMENT STEPS (GHANA GHS / WHO ALIGNED) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-teal-700" />
          <h3 className="text-sm font-bold text-slate-900">
            The 10 Essential Inpatient Stabilization Steps (Ghana GHS / IMAM)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">Step 1</span>
              <span>Hypoglycemia (Blood Glucose &lt; 3.0 mmol/L)</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Give 5 mL/kg of 10% Dextrose orally or IV immediately. If child cannot swallow, give 10% dextrose via NG tube or IV. Follow immediately with first F-75 feed. Feed 2-hourly to prevent recurrence.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">Step 2</span>
              <span>Hypothermia (Axillary Temp &lt; 35.0&deg;C / Rectal &lt; 35.5&deg;C)</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Warm the child immediately using Kangaroo Mother Care (skin-to-skin contact), blankets, or indirect heater. Keep ward temperature &ge; 25&deg;C. Hypothermia strongly signals systemic sepsis or hypoglycemia.
            </p>
          </div>

          <div className="p-3.5 bg-teal-50/60 rounded-xl border border-teal-200 space-y-1">
            <div className="font-bold text-teal-950 flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-teal-200 text-teal-900 text-[10px] font-bold">Step 3</span>
              <span>Dehydration &amp; ReSoMal Administration</span>
            </div>
            <p className="text-teal-900 text-[11px] leading-relaxed">
              Administer <strong>ReSoMal 5 mL/kg every 30 min for 2 hours</strong>, then 5–10 mL/kg/h alternating hourly with F-75. <strong>STRICT CONTRAINDICATION:</strong> Never give ReSoMal or IV fluids for children with nutritional oedema unless confirmed cholera/watery diarrhea. Standard ORS is contraindicated due to fatal sodium overload.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">Step 4</span>
              <span>Electrolyte Imbalance (Na+, K+, Mg2+)</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Intracellular potassium and magnesium are critically depleted while intracellular sodium is high. Reconstitute therapeutic feeds with CMV (Combined Mineral Vitamin) solution. <strong>Do NOT add extra salt/sodium.</strong>
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">Step 5</span>
              <span>Infections &amp; Malaria Screening (Ghana Endemic Protocol)</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              In Ghana, <strong>all admitted SAM children must receive a malaria Rapid Diagnostic Test (RDT)</strong> and treat with ACT if positive. First-line inpatient antibiotics: <strong>Ampicillin IV/IM (50 mg/kg q6h x 2 days)</strong> + <strong>Gentamicin IV/IM (7.5 mg/kg once daily x 7 days)</strong>, followed by oral Amoxicillin.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">Step 6</span>
              <span>Micronutrient Deficiencies (Vit A, Folic Acid, Zinc)</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Vitamin A stat on Day 1 (50,000 IU &lt;6m; 100,000 IU 6–11m; 200,000 IU &ge;12m). Folic Acid 5 mg on Day 1, then 1 mg/day. Zinc for diarrhea. <strong>Strictly NO IRON in Phase 1 (Stabilization)</strong>; iron promotes bacterial proliferation.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">Step 7</span>
              <span>Initial Feeding (F-75 Stabilization)</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Provide F-75 formula at 130 mL/kg/day (100 kcal/kg/day). If severe oedema (+++), reduce to 100 mL/kg/day. Feed 2-hourly or 3-hourly around the clock to maintain glycemia.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">Step 8</span>
              <span>Transition Phase &amp; Appetite Test</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Initiate transition when oedema is resolving and medical complications have cleared. Conduct RUTF appetite test. If passed, transition directly to RUTF or F-100 at same volume (130 mL/kg/day) for 48 hours.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">Step 9</span>
              <span>Catch-Up Growth (Rehabilitation)</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Increase intake to 150–220 kcal/kg/day using RUTF or F-100. Target rapid weight gain: &gt;10 g/kg/day is good; 5–10 g/kg/day is moderate; &lt;5 g/kg/day warrants investigation.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">Step 10</span>
              <span>Sensory Stimulation &amp; Discharge to OTP</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Provide loving emotional care, play stimulation, and maternal feeding counseling. Discharge to Outpatient Care (OTP) once appetite is vigorous, edema is absent, and child is clinically alert.
            </p>
          </div>
        </div>
      </div>

      {/* 3. RESOMAL PROTOCOL & RECONSTITUTION SPECIFICATION */}
      <div className="p-4 rounded-xl border border-teal-300 bg-teal-50/60 space-y-3">
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-teal-700" />
          <h3 className="text-sm font-bold text-teal-950">
            ReSoMal (Rehydration Solution for Malnutrition): Formulation &amp; Clinical Rules
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-white p-3.5 rounded-lg border border-teal-200 space-y-2">
            <div className="font-bold text-slate-900">Ghana Health Service ReSoMal Reconstitution Recipe</div>
            <ul className="space-y-1.5 text-slate-700 text-[11px]">
              <li className="flex items-center justify-between border-b border-slate-100 pb-1">
                <span>WHO Low-Osmolarity ORS:</span>
                <strong className="text-slate-900 font-mono">1 Standard Packet (for 1L)</strong>
              </li>
              <li className="flex items-center justify-between border-b border-slate-100 pb-1">
                <span>Safe Cooled Boiled Water:</span>
                <strong className="text-teal-700 font-mono">2.0 Litres (Double Water)</strong>
              </li>
              <li className="flex items-center justify-between border-b border-slate-100 pb-1">
                <span>Commercial White Sugar:</span>
                <strong className="text-slate-900 font-mono">50 grams (~10 level tsp)</strong>
              </li>
              <li className="flex items-center justify-between">
                <span>Combined Mineral Vitamin (CMV):</span>
                <strong className="text-slate-900 font-mono">40 mL liquid solution</strong>
              </li>
            </ul>
            <div className="text-[10px] text-teal-800 font-medium">
              Produces 45 mmol/L Na+ (vs 75 in ORS) and 40 mmol/L K+ (vs 20 in ORS).
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-teal-200 space-y-2">
            <div className="font-bold text-slate-900">Administration &amp; Fluid Overload Stop Rules</div>
            <ul className="space-y-1 text-slate-600 text-[11px] leading-relaxed">
              <li>&bull; <strong>First 2 Hours:</strong> 5 mL/kg every 30 minutes orally or via NG tube (4 doses = 20 mL/kg total).</li>
              <li>&bull; <strong>Hours 3 to 10:</strong> 5–10 mL/kg/hour alternating hourly with F-75 until rehydrated.</li>
              <li>&bull; <strong>Ongoing Stool Loss:</strong> 50–100 mL (&lt;2 yrs) or 100–200 mL (&ge;2 yrs) per loose watery stool.</li>
              <li>&bull; <strong className="text-rose-700">EMERGENCY STOP:</strong> Cease ReSoMal immediately if respiratory rate increases &ge; 5 bpm, pulse increases &ge; 15 bpm, or facial swelling/neck vein engorgement appears.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4. Comparison of F-75 vs F-100 */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-blue-700" />
          <span>Nutritional Composition: F-75 Stabilization vs F-100 Rehabilitation</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 text-[11px] text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Parameter / Component</th>
                <th className="py-2.5 px-3 bg-blue-50/50 text-blue-900 font-bold">F-75 Stabilization</th>
                <th className="py-2.5 px-3 bg-slate-100 text-slate-900 font-bold">F-100 Rehabilitation</th>
                <th className="py-2.5 px-3">Clinical Objective / Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-800">Energy Density</td>
                <td className="py-2 px-3 font-bold text-blue-900 bg-blue-50/20">75 kcal / 100 mL</td>
                <td className="py-2 px-3 font-bold text-slate-900 bg-slate-50/50">100 kcal / 100 mL</td>
                <td className="py-2 px-3 text-slate-600">F-75 maintains homeostasis without refeeding shock; F-100 enables rapid catch-up gain.</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-800">Protein Content</td>
                <td className="py-2 px-3 text-blue-900 bg-blue-50/20">0.9 g / 100 mL</td>
                <td className="py-2 px-3 text-slate-900 bg-slate-50/50">2.9 g / 100 mL</td>
                <td className="py-2 px-3 text-slate-600">Low protein in F-75 prevents overloading compromised liver and renal urea clearance.</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-800">Target Osmolality</td>
                <td className="py-2 px-3 text-blue-900 bg-blue-50/20">~330 mOsm/kg</td>
                <td className="py-2 px-3 text-slate-900 bg-slate-50/50">~415 mOsm/kg</td>
                <td className="py-2 px-3 text-slate-600">Prevents fatal osmotic diarrhea across severely atrophic intestinal villi.</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-800">Electrolyte Balance</td>
                <td className="py-2 px-3 text-slate-700 bg-blue-50/20">High K+ &amp; Mg2+, Low Na+</td>
                <td className="py-2 px-3 text-slate-700 bg-slate-50/50">High K+ &amp; Mg2+, Mod Na+</td>
                <td className="py-2 px-3 text-slate-600">Redistributes intracellular potassium; extra sodium precipitates acute congestive heart failure.</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-800">Liquid CMV Mix</td>
                <td className="py-2 px-3 text-blue-900 bg-blue-50/20">20 mL / 1000 mL</td>
                <td className="py-2 px-3 text-slate-900 bg-slate-50/50">20 mL / 1000 mL</td>
                <td className="py-2 px-3 text-slate-600">Liquid Combined Mineral Vitamin solution supplies potassium, magnesium, zinc, and copper in exact mL.</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-800">Iron Status</td>
                <td className="py-2 px-3 font-bold text-rose-700 bg-blue-50/20">Strictly 0 mg (No Iron)</td>
                <td className="py-2 px-3 text-slate-700 bg-slate-50/50">Add only in Phase 2</td>
                <td className="py-2 px-3 text-slate-600">Iron in stabilization fuels bacterial sepsis and free radical oxidative cell death.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Clinical Safety Guardrails */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-700" />
          <span>Core Safety Guardrails &amp; Physiological Rationale</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Rule 1: Osmolality Threshold (&le;10% Sugar w/v)</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              When preparing F-75 with local ingredients, sugar must not exceed 100 g per 1,000 mL (10% w/v). Higher sugar concentrations dramatically elevate luminal osmotic pressure. The damaged intestinal mucosa cannot reabsorb water, resulting in acute, life-threatening osmotic diarrhea.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
            <div className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Rule 2: Absolute Contraindication of F-100 in Severe Edema</span>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed">
              Children with Kwashiorkor (+++ edema) have reduced myocardial mass, impaired left ventricular ejection, and intracellular sodium retention. F-100 contains 3x more protein and high caloric density. Administering F-100 while severe edema persists causes rapid fluid expansion and acute heart failure.
            </p>
          </div>
        </div>
      </div>

      {/* 6. Regulatory Scope & Client-Side Privacy */}
      <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-2.5 text-xs">
        <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Clinical Decision Support Scope &amp; Privacy Architecture</span>
        </div>
        <div className="space-y-1.5 text-slate-600 leading-relaxed">
          <div>
            &bull; <strong>Clinical Decision Support (CDS) Scope:</strong> pedical is an open, deterministic calculation reference tool developed strictly according to the {GHANA_IMAM_GUIDELINE_TITLE} and the {WHO_GUIDELINE_FULL_TITLE}. It provides transparent arithmetic and does not make automated autonomous medical diagnoses, prescriptions, or treatment decisions.
          </div>
          <div>
            &bull; <strong>Professional Verification:</strong> All calculations, fluid volumes, and raw ingredient recipes must be reviewed and verified by a licensed Registered Dietitian (RD) or Pediatric Medical Officer against local hospital protocols prior to clinical administration.
          </div>
          <div>
            &bull; <strong>Zero Cloud Storage / Client-Side Privacy:</strong> All calculations and bed roster entries are executed and retained exclusively within the clinician&apos;s local browser session. No patient health information (PHI) or personal data is collected, transmitted, or hosted on external servers.
          </div>
        </div>
      </div>
    </div>
  );
};
