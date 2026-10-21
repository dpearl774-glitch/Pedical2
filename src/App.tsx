/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  CalculationInput,
  evaluatePatient,
  TherapeuticPhase,
} from './utils/clinicalCalculations';
import { INITIAL_WARD_PATIENTS, WardPatient } from './data/wardPatients';
import { ClinicalHeader } from './components/ClinicalHeader';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ParameterControls } from './components/ParameterControls';
import { FormattedClinicalReport } from './components/FormattedClinicalReport';
import { WHOGrowthChart } from './components/WHOGrowthChart';
import { BedsideFeedingSchedule } from './components/BedsideFeedingSchedule';
import { ProtocolReferenceSection } from './components/ProtocolReferenceSection';
import { PrintableBedsideCard } from './components/PrintableBedsideCard';
import { WardOverview } from './components/WardOverview';
import { ClinicalDisclaimerModal } from './components/ClinicalDisclaimerModal';
import { Printer, ChevronRight, User, ShieldCheck, Lock } from 'lucide-react';

const STORAGE_KEY = 'pedical_ward_inpatients_v3';
const DISCLAIMER_STORAGE_KEY = 'pedical_disclaimer_accepted_v1';

export default function App() {
  // Disclaimer state
  const [showDisclaimerModal, setShowDisclaimerModal] = useState<boolean>(() => {
    try {
      return !localStorage.getItem(DISCLAIMER_STORAGE_KEY);
    } catch {
      return false;
    }
  });
  const [isVoluntaryDisclaimerReview, setIsVoluntaryDisclaimerReview] = useState<boolean>(false);

  // Ward Patients Roster State
  const [patients, setPatients] = useState<WardPatient[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_WARD_PATIENTS;
  });

  const [activePatientId, setActivePatientId] = useState<string>(() => {
    return INITIAL_WARD_PATIENTS[0]?.id || 'cot-1';
  });

  const [activeTab, setActiveTab] = useState<string>('ward');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printBatchMode, setPrintBatchMode] = useState<boolean>(false);

  // Active patient object
  const activePatient = useMemo(() => {
    return patients.find((p) => p.id === activePatientId) || patients[0];
  }, [patients, activePatientId]);

  // Current calculation input is synced with active patient
  const input = activePatient.input;

  // Save patients whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    } catch {
      // Ignore quota errors
    }
  }, [patients]);

  const handleAcceptDisclaimer = () => {
    try {
      localStorage.setItem(DISCLAIMER_STORAGE_KEY, 'true');
    } catch {
      // Ignore
    }
    setShowDisclaimerModal(false);
    setIsVoluntaryDisclaimerReview(false);
  };

  const handleOpenDisclaimer = () => {
    setIsVoluntaryDisclaimerReview(true);
    setShowDisclaimerModal(true);
  };

  // Instant deterministic calculation for active patient
  const evaluation = useMemo(() => {
    return evaluatePatient(input);
  }, [input]);

  // Update input for active patient
  const handleUpdateInput = (newInput: CalculationInput) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === activePatientId) {
          return {
            ...p,
            name: newInput.patient_name || p.name,
            cotNumber: newInput.cot_number || p.cotNumber,
            mrn: newInput.mrn || p.mrn,
            input: newInput,
          };
        }
        return p;
      })
    );
  };

  const handleResetActivePatient = () => {
    const defaultForPatient: CalculationInput = {
      patient_id: activePatient.id,
      cot_number: activePatient.cotNumber,
      patient_name: activePatient.name,
      mrn: activePatient.mrn,
      age_months: activePatient.input.age_months || 12,
      calculation_mode: 'Full WHO Assessment + Calculator',
      weight_kg: 5.0,
      height_cm: 65.0,
      sex: activePatient.input.sex || 'Boy',
      therapeutic_phase: 'F-75 Stabilization',
      edema_severity: 'None',
      feeding_interval_hours: 3,
      local_milk_source: 'Dried Skimmed Milk Powder',
    };
    handleUpdateInput(defaultForPatient);
  };

  const handleSwitchTherapeuticPhase = (phase: TherapeuticPhase) => {
    handleUpdateInput({
      ...input,
      therapeutic_phase: phase,
    });
  };

  const handleChartSelectPoint = (lengthCm: number, weightKg: number) => {
    handleUpdateInput({
      ...input,
      weight_kg: weightKg,
      height_cm: lengthCm,
    });
  };

  const handleChartUpdateSex = (sex: 'Boy' | 'Girl') => {
    handleUpdateInput({
      ...input,
      sex,
    });
  };

  // Add new inpatient to ward
  const handleAddPatient = (newPatient: WardPatient) => {
    setPatients((prev) => [newPatient, ...prev]);
    setActivePatientId(newPatient.id);
    setActiveTab('calculator');
  };

  // Delete patient from ward
  const handleDeletePatient = (patientId: string) => {
    setPatients((prev) => {
      const filtered = prev.filter((p) => p.id !== patientId);
      if (patientId === activePatientId && filtered.length > 0) {
        setActivePatientId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Print individual patient from ward
  const handlePrintIndividualPatient = (patient: WardPatient) => {
    setActivePatientId(patient.id);
    setPrintBatchMode(false);
    setShowPrintModal(true);
  };

  // Batch print all ward patients
  const handleBatchPrint = () => {
    setPrintBatchMode(true);
    setShowPrintModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased pb-20 lg:pb-8">
      {/* Top Header with Interactive Patient Switcher & Notice */}
      <ClinicalHeader
        onPrint={() => {
          setPrintBatchMode(false);
          setShowPrintModal(true);
        }}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenReference={() => setActiveTab('reference')}
        onOpenDisclaimer={handleOpenDisclaimer}
        patients={patients}
        activePatientId={activePatientId}
        onSelectPatient={(id) => setActivePatientId(id)}
        onAdmitNewChild={() => setActiveTab('ward')}
      />

      {/* Mobile Sticky Inpatient Quick-Readout Bar */}
      <div className="no-print lg:hidden sticky top-[53px] z-30 bg-slate-900 text-white px-3 py-2 border-b border-slate-800 shadow-xs flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-bold text-slate-300">{activePatient.cotNumber}:</span>
          <span className="font-bold text-white truncate max-w-[90px]">{activePatient.name}</span>
          <span className="text-slate-500">&middot;</span>
          <span className="font-bold text-blue-400">{input.weight_kg}kg</span>
          <span className="text-slate-500">&middot;</span>
          <span className="text-emerald-400 font-bold">
            {evaluation.feedingSummary.targetVolumePerFeed}mL q{input.feeding_interval_hours}h
          </span>
        </div>
        <div className="text-[11px] text-slate-400 shrink-0 font-sans ml-2">
          {evaluation.feedingSummary.dailyVolume} mL/d
        </div>
      </div>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
        {/* Desktop View Navigation Pill Tabs */}
        <div className="hidden lg:flex items-center justify-between bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1 text-xs">
            {[
              { id: 'ward', label: `Bedside Roster (${patients.length} Beds)` },
              { id: 'calculator', label: `Bed Assessment (${activePatient.cotNumber})` },
              { id: 'chart', label: 'Interactive WHO Growth Chart' },
              { id: 'feeding', label: 'Feeding Targets' },
              { id: 'recipe', label: 'Batch Recipe' },
              { id: 'schedule', label: 'Bedside Log' },
              { id: 'reference', label: 'Protocols & Guidelines' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3.5 rounded-lg font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPrintBatchMode(false);
                setShowPrintModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print {activePatient.cotNumber} Worksheet</span>
            </button>
          </div>
        </div>

        {/* TAB 0: WARD ROSTER (Multi-Child Inpatient Management) */}
        {activeTab === 'ward' && (
          <WardOverview
            patients={patients}
            activePatientId={activePatientId}
            onSelectPatient={(id) => {
              setActivePatientId(id);
              setActiveTab('calculator');
            }}
            onAddPatient={handleAddPatient}
            onDeletePatient={handleDeletePatient}
            onPrintPatient={handlePrintIndividualPatient}
            onBatchPrint={handleBatchPrint}
          />
        )}

        {/* TAB 1: CALCULATOR (Inputs + Formatted Clinical Output) */}
        {activeTab === 'calculator' && (
          <div className="space-y-6">
            {/* Active Bed Notification Banner (De-Identified) */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-700" />
                <span className="font-bold text-blue-950">
                  Active Bed: {activePatient.cotNumber} &middot; {activePatient.name} (Case Ref: {activePatient.mrn})
                </span>
                <span className="text-slate-500 hidden sm:inline font-mono">
                  &middot; Admitted {activePatient.admissionDate}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('ward')}
                className="text-blue-700 hover:text-blue-900 font-bold text-xs"
              >
                Switch Bed in Roster
              </button>
            </div>

            <ParameterControls
              input={input}
              onChange={handleUpdateInput}
              onReset={handleResetActivePatient}
            />

            <FormattedClinicalReport
              evaluation={evaluation}
              onSwitchTherapeuticPhase={handleSwitchTherapeuticPhase}
              onNavigateToChart={() => setActiveTab('chart')}
            />
          </div>
        )}

        {/* TAB 2: INTERACTIVE WHO GROWTH CHART (Plottable Graphs) */}
        {activeTab === 'chart' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  WHO Growth Chart &middot; {activePatient.cotNumber}: {activePatient.name}
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  Official WHO Child Growth Standards &middot; Weight-for-Length, Weight-for-Age, Length-for-Age
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('calculator')}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Edit Anthropometric Parameters</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <WHOGrowthChart
              currentWeightKg={input.weight_kg}
              currentHeightCm={input.height_cm ?? 65.0}
              currentAgeMonths={input.age_months ?? 12}
              sex={input.sex ?? 'Boy'}
              patientName={activePatient.name}
              cotNumber={activePatient.cotNumber}
              onSelectPoint={handleChartSelectPoint}
              onUpdateSex={handleChartUpdateSex}
            />
          </div>
        )}

        {/* TAB 3: FEEDING TARGETS */}
        {activeTab === 'feeding' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900">
                  Feeding Targets &middot; {activePatient.cotNumber}: {activePatient.name} ({input.therapeutic_phase})
                </h3>
                <span className="text-xs font-mono text-slate-500 font-semibold">
                  {input.weight_kg} kg &middot; {input.edema_severity} Edema
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                  <div className="text-xs font-bold text-blue-900 uppercase">Target Per Feed</div>
                  <div className="text-3xl font-mono font-bold text-blue-950 mt-1">
                    {evaluation.feedingSummary.targetVolumePerFeed}
                    <span className="text-sm font-sans font-normal text-blue-700 ml-1">mL</span>
                  </div>
                  <div className="text-xs text-blue-800 mt-1">
                    q{evaluation.feedingSummary.feedingIntervalHours}h ({evaluation.feedingSummary.feedsPerDay} feeds/day)
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-700 uppercase">Total 24h Fluid</div>
                  <div className="text-3xl font-mono font-bold text-slate-900 mt-1">
                    {evaluation.feedingSummary.dailyVolume}
                    <span className="text-sm font-sans font-normal text-slate-500 ml-1">mL/day</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {evaluation.feedingSummary.mlPerKgPerDay} mL/kg/day
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                  <div className="text-xs font-bold text-amber-900 uppercase">Safe Minimum (80%)</div>
                  <div className="text-3xl font-mono font-bold text-amber-950 mt-1">
                    {evaluation.feedingSummary.safeMinimumVolume}
                    <span className="text-sm font-sans font-normal text-amber-700 ml-1">mL/day</span>
                  </div>
                  <div className="text-xs text-amber-800 mt-1">
                    {evaluation.feedingSummary.safeMinMlPerKg} mL/kg/day (NG tube watch threshold)
                  </div>
                </div>
              </div>
            </div>

            <BedsideFeedingSchedule
              feedingSummary={evaluation.feedingSummary}
              patientWeight={input.weight_kg}
            />
          </div>
        )}

        {/* TAB 4: MANUAL BATCH RECIPE */}
        {activeTab === 'recipe' && (
          <div className="space-y-6">
            {evaluation.safety.rule2FluidOverloadHalted ? (
              <div className="bg-rose-50 border-2 border-rose-600 rounded-xl p-6 text-rose-950 space-y-3">
                <div className="text-base font-bold">
                  {evaluation.safety.rule2ErrorText}
                </div>
                <p className="text-xs text-rose-800">
                  F-100 contains high protein and sodium relative to the cardiac reserve of an infant with severe edema. Return patient to F-75 stabilization immediately.
                </p>
                <button
                  type="button"
                  onClick={() => handleSwitchTherapeuticPhase('F-75 Stabilization')}
                  className="px-4 py-2 bg-rose-700 text-white font-bold text-xs rounded-lg hover:bg-rose-800 min-h-[44px]"
                >
                  Switch Patient to F-75 Stabilization
                </button>
              </div>
            ) : evaluation.recipe ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Manual 24-Hour Batch Recipe for {activePatient.cotNumber} ({evaluation.recipe.dailyVolume} mL total)
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Base Milk: {evaluation.recipe.milkBase.name} &middot; Scale Factor: {evaluation.recipe.scaleFactor}
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-blue-50 text-blue-800 font-bold">
                    {input.therapeutic_phase}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="text-slate-500 font-bold">1. Milk Base</div>
                      <div className="font-semibold text-slate-900">{evaluation.recipe.milkBase.name}</div>
                    </div>
                    <div className="font-mono text-xl font-bold text-blue-900">
                      {evaluation.recipe.milkBase.amount} {evaluation.recipe.milkBase.unit}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="text-slate-500 font-bold">2. Sugar</div>
                      <div className="font-semibold text-slate-900">Commercial White Sugar</div>
                    </div>
                    <div className="font-mono text-xl font-bold text-blue-900">
                      {evaluation.recipe.sugarGrams} g
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="text-slate-500 font-bold">3. Vegetable Oil</div>
                      <div className="font-semibold text-slate-900">Refined cooking oil</div>
                    </div>
                    <div className="font-mono text-xl font-bold text-blue-900">
                      {evaluation.recipe.vegetableOilGrams} g
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="text-slate-500 font-bold">4. Cereal Flour</div>
                      <div className="font-semibold text-slate-900">
                        {evaluation.recipe.cerealFlourGrams > 0 ? 'Milled rice / cereal' : 'None (0g for F-100)'}
                      </div>
                    </div>
                    <div className="font-mono text-xl font-bold text-blue-900">
                      {evaluation.recipe.cerealFlourGrams} g
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center sm:col-span-2">
                    <div>
                      <div className="text-slate-500 font-bold">5. CMV Solution (Combined Mineral Vitamin)</div>
                      <div className="font-semibold text-slate-900">Liquid mineral mix (20 mL per 1,000 mL milk formula)</div>
                    </div>
                    <div className="font-mono text-xl font-bold text-blue-900">
                      {evaluation.recipe.cmvLiquidMl} mL
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200 text-xs text-slate-800">
                  <div className="font-bold text-blue-950 uppercase tracking-wider mb-1">
                    Preparation Step:
                  </div>
                  <div>{evaluation.recipe.preparationStep}</div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 5: BEDSIDE LOG */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <BedsideFeedingSchedule
              feedingSummary={evaluation.feedingSummary}
              patientWeight={input.weight_kg}
            />
          </div>
        )}

        {/* TAB 6: PROTOCOLS & REFERENCES (Consolidated at one single place) */}
        {activeTab === 'reference' && (
          <div className="space-y-6">
            <ProtocolReferenceSection />
          </div>
        )}

        {/* Client-Side Privacy & Legal Notice Footer */}
        <footer className="pt-6 border-t border-slate-200 text-slate-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              <strong>Zero Cloud Storage:</strong> All calculations run 100% locally in your browser. No patient data is transmitted or stored externally.
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenDisclaimer}
            className="text-blue-700 hover:text-blue-900 font-semibold underline flex items-center gap-1 shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Clinical Reference &amp; Privacy Notice</span>
          </button>
        </footer>
      </main>

      {/* Mobile Ergonomic Bottom Tab Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        patientCount={patients.length}
      />

      {/* Bedside Order Print Modal (Supports Single Patient & Batch Ward) */}
      {showPrintModal && (
        <PrintableBedsideCard
          evaluation={evaluation}
          allPatients={patients}
          isBatchMode={printBatchMode}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* Clinical Disclaimer & Terms Modal */}
      <ClinicalDisclaimerModal
        isOpen={showDisclaimerModal}
        onAccept={handleAcceptDisclaimer}
        onClose={() => setShowDisclaimerModal(false)}
        isVoluntaryReview={isVoluntaryDisclaimerReview}
      />
    </div>
  );
}
