import React, { useState } from 'react';
import { WardPatient, calculateWardMilkKitchen } from '../data/wardPatients';
import { evaluatePatient } from '../utils/clinicalCalculations';
import {
  Users,
  Plus,
  Printer,
  ChevronRight,
  AlertTriangle,
  Beaker,
  Trash2,
  Bed,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { ClinicalNumberInput } from './ClinicalNumberInput';

interface WardOverviewProps {
  patients: WardPatient[];
  activePatientId: string;
  onSelectPatient: (patientId: string) => void;
  onAddPatient: (newPatient: WardPatient) => void;
  onDeletePatient: (patientId: string) => void;
  onPrintPatient: (patient: WardPatient) => void;
  onBatchPrint: () => void;
}

export const WardOverview: React.FC<WardOverviewProps> = ({
  patients,
  activePatientId,
  onSelectPatient,
  onAddPatient,
  onDeletePatient,
  onPrintPatient,
  onBatchPrint,
}) => {
  const [filterPhase, setFilterPhase] = useState<'All' | 'F-75' | 'F-100' | 'HighRisk'>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // New patient modal state (Auto-generated anonymous IDs)
  const defaultNextCot = `Cot ${String(patients.length + 1).padStart(2, '0')}`;
  const defaultNextRef = `Ref-${100 + patients.length + 1}`;
  const [newCot, setNewCot] = useState(defaultNextCot);
  const [newAlias, setNewAlias] = useState('');
  const [newMrn, setNewMrn] = useState(defaultNextRef);
  const [newAge, setNewAge] = useState<number>(12);
  const [newSex, setNewSex] = useState<'Boy' | 'Girl'>('Boy');
  const [newWeight, setNewWeight] = useState<number>(5.0);
  const [newHeight, setNewHeight] = useState<number>(65.0);
  const [newEdema, setNewEdema] = useState<'None' | 'Mild/Moderate (+ / ++)' | 'Severe (+++)'>('None');
  const [newPhase, setNewPhase] = useState<'F-75 Stabilization' | 'F-100 Rehabilitation'>('F-75 Stabilization');
  const [newInterval, setNewInterval] = useState<2 | 3 | 4>(3);

  const wardSummary = calculateWardMilkKitchen(patients);

  const filteredPatients = patients.filter((p) => {
    if (filterPhase === 'F-75') return p.input.therapeutic_phase === 'F-75 Stabilization';
    if (filterPhase === 'F-100') return p.input.therapeutic_phase === 'F-100 Rehabilitation';
    if (filterPhase === 'HighRisk') {
      return (
        p.input.edema_severity === 'Severe (+++)' ||
        p.input.weight_kg < 4.5 ||
        (p.input.therapeutic_phase === 'F-100 Rehabilitation' && p.input.edema_severity !== 'None')
      );
    }
    return true;
  });

  const handleCreatePatient = () => {
    const cotLabel = newCot.trim() || defaultNextCot;
    const displayName = newAlias.trim() ? `${cotLabel} (${newAlias.trim()})` : cotLabel;

    const newPatient: WardPatient = {
      id: `patient-${Date.now()}`,
      cotNumber: cotLabel,
      name: displayName,
      mrn: newMrn.trim() || defaultNextRef,
      admissionDate: new Date().toISOString().split('T')[0],
      notes: 'Inpatient nutritional stabilization',
      input: {
        patient_id: `patient-${Date.now()}`,
        cot_number: cotLabel,
        patient_name: displayName,
        mrn: newMrn.trim() || defaultNextRef,
        age_months: newAge,
        calculation_mode: 'Full WHO Assessment + Calculator',
        weight_kg: newWeight,
        height_cm: newHeight,
        sex: newSex,
        therapeutic_phase: newPhase,
        edema_severity: newEdema,
        feeding_interval_hours: newInterval,
        local_milk_source: 'Dried Skimmed Milk Powder',
      },
    };

    onAddPatient(newPatient);
    setShowAddModal(false);
    setNewAlias('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Batch Formula Preparation Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="font-serif text-xl sm:text-2xl text-slate-900 tracking-tight font-normal">
                Inpatient roster
              </h2>
            </div>
            <div className="text-xs text-slate-500 mt-1 pl-10.5">
              {patients.length} active beds &middot; WHO 2023 stabilization protocol
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              disabled={patients.length === 0}
              onClick={onBatchPrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 active:scale-95 transition-all shadow-xs min-h-[40px] disabled:opacity-40 disabled:pointer-events-none"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Batch print</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setNewCot(`Cot ${String(patients.length + 1).padStart(2, '0')}`);
                setNewMrn(`Ref-${100 + patients.length + 1}`);
                setShowAddModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl shadow-xs transition-all min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add bed</span>
            </button>
          </div>
        </div>

        {/* Aggregated Formula Batch Preparation Requirements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Beaker className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-serif text-base text-slate-900 font-normal">
                24h batch kitchen targets
              </h3>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Total for {patients.length} children
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60">
              <span className="text-xs font-semibold text-blue-900 block">F-75 total</span>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">
                {wardSummary.totalF75Ml}
                <span className="text-xs font-normal text-blue-700 ml-1">mL/day</span>
              </div>
              <div className="text-xs text-blue-800 mt-1 font-medium">
                {wardSummary.f75PatientsCount} on F-75
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-xs font-semibold text-slate-700 block">F-100 total</span>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">
                {wardSummary.totalF100Ml}
                <span className="text-xs font-normal text-slate-500 ml-1">mL/day</span>
              </div>
              <div className="text-xs text-slate-600 mt-1 font-medium">
                {wardSummary.f100PatientsCount} on F-100
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-xs font-semibold text-slate-700 block">Liquid CMV total</span>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">
                {wardSummary.totalCmvSolutionMl}
                <span className="text-xs font-normal text-slate-500 ml-1">mL</span>
              </div>
              <div className="text-xs text-slate-600 mt-1 font-medium">
                20 mL per 1,000 mL batch
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-xs font-semibold text-slate-700 block">Sugar &amp; oil</span>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {wardSummary.totalSugarGrams}g <span className="text-xs font-normal text-slate-500">sugar</span> &middot; {wardSummary.totalOilGrams}g <span className="text-xs font-normal text-slate-500">oil</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">
                {wardSummary.totalCerealFlourGrams}g flour
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 shrink-0">
          {(['All', 'F-75', 'F-100', 'HighRisk'] as const).map((tab) => {
            const count =
              tab === 'All'
                ? patients.length
                : tab === 'F-75'
                ? wardSummary.f75PatientsCount
                : tab === 'F-100'
                ? wardSummary.f100PatientsCount
                : patients.filter(
                    (p) =>
                      p.input.edema_severity === 'Severe (+++)' ||
                      p.input.weight_kg < 4.5 ||
                      (p.input.therapeutic_phase === 'F-100 Rehabilitation' &&
                        p.input.edema_severity !== 'None')
                  ).length;

            return (
              <button
                key={tab}
                onClick={() => setFilterPhase(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterPhase === tab
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'All' && 'All'}
                {tab === 'F-75' && 'F-75'}
                {tab === 'F-100' && 'F-100'}
                {tab === 'HighRisk' && 'High risk'} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Patients Roster List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map((patient) => {
          const evalRes = evaluatePatient(patient.input);
          const isSelected = activePatientId === patient.id;
          const isHighEdema = patient.input.edema_severity === 'Severe (+++)';
          const isF100EdemaError = evalRes.safety.rule2FluidOverloadHalted;

          return (
            <div
              key={patient.id}
              className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-md'
                  : 'border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-xs font-bold">
                      {patient.cotNumber}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">
                        {patient.name}
                      </h3>
                      <div className="text-xs text-slate-500 font-medium">
                        Ref: {patient.mrn} &middot; {patient.input.age_months ?? '--'} mo &middot; {patient.input.sex}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Active
                    </span>
                  )}
                </div>

                {/* Error Banner if F-100 with severe edema */}
                {isF100EdemaError && (
                  <div className="mb-2 p-2 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>Rule 2 Error: F-100 Contraindicated in Severe Edema</span>
                  </div>
                )}

                {/* Anthropometrics & Z-Score */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 mb-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">Weight</span>
                    <strong className="text-slate-900 text-sm">{patient.input.weight_kg} kg</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">Length</span>
                    <strong className="text-slate-900 text-sm">{patient.input.height_cm ?? '--'} cm</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">WHZ</span>
                    <strong
                      className={`text-sm ${
                        evalRes.growthAssessment?.isSam ? 'text-red-600 font-bold' : 'text-amber-600 font-bold'
                      }`}
                    >
                      {evalRes.growthAssessment?.wflZScore !== undefined
                        ? `${evalRes.growthAssessment.wflZScore > 0 ? '+' : ''}${evalRes.growthAssessment.wflZScore}`
                        : '--'}
                    </strong>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs">
                  <span
                    className={`px-2 py-0.5 rounded-lg font-semibold ${
                      patient.input.therapeutic_phase === 'F-75 Stabilization'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {patient.input.therapeutic_phase.split(' ')[0]}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-lg font-semibold ${
                      isHighEdema
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : patient.input.edema_severity === 'None'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    Edema: {patient.input.edema_severity}
                  </span>

                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
                    q{patient.input.feeding_interval_hours}h
                  </span>
                </div>

                {/* Feeding Target Strip */}
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs mb-3 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-[10px] font-semibold block">Feed target</span>
                    <strong className="text-slate-900 text-base font-bold">
                      {evalRes.feedingSummary.targetVolumePerFeed} mL
                    </strong>
                    <span className="text-slate-500 text-xs ml-1">
                      q{evalRes.feedingSummary.feedingIntervalHours}h
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] font-semibold block">24h total</span>
                    <strong className="text-slate-900 text-sm font-bold">
                      {evalRes.feedingSummary.dailyVolume} mL
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelectPatient(patient.id)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors min-h-[36px] ${
                    isSelected
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  <span>{isSelected ? 'Viewing' : 'Select'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onPrintPatient(patient)}
                  className="hidden sm:flex p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 min-h-[36px] min-w-[36px] items-center justify-center"
                  title="Print Bedside Sheet"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onDeletePatient(patient.id)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="Discharge / Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State when no patients in ward */}
      {patients.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
            <Bed className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Ward roster is empty</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No inpatients are currently admitted. Add a bed to start monitoring feeds and nutritional recovery.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setNewCot('Cot 01');
              setNewMrn('Ref-101');
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add first bed</span>
          </button>
        </div>
      )}

      {/* Filtered empty state when patients exist but filter hides them */}
      {patients.length > 0 && filteredPatients.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          No patients match the selected filter ({filterPhase}).
        </div>
      )}

      {/* Admit Child Modal (De-Identified) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-300 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Bed className="w-5 h-5 text-blue-700" />
                <span className="font-bold text-slate-900 text-base">Add bed</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>

            {/* De-identification notice banner */}
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 leading-snug">
              Use bed identifiers and initials only. No identifiable names.
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cot / bed</label>
                  <input
                    type="text"
                    value={newCot}
                    onChange={(e) => setNewCot(e.target.value)}
                    placeholder="e.g. Cot 06"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Case Reference ID</label>
                  <input
                    type="text"
                    value={newMrn}
                    onChange={(e) => setNewMrn(e.target.value)}
                    placeholder="e.g. Ref-106"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Clinician Tag / Initials <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  placeholder="e.g. H.M. or Twin A (No full legal names)"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Age (Months)</label>
                  <ClinicalNumberInput
                    value={newAge}
                    onChange={(val) => setNewAge(val)}
                    min={0}
                    max={60}
                    isInteger={true}
                    unit="mo"
                    className="w-full h-12 min-h-[48px] border border-slate-300 rounded-xl px-2.5 text-base font-bold text-slate-900 bg-white shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Sex</label>
                  <select
                    value={newSex}
                    onChange={(e) => setNewSex(e.target.value as 'Boy' | 'Girl')}
                    className="w-full h-12 min-h-[48px] border border-slate-300 rounded-xl px-3 bg-white text-base font-semibold text-slate-900 shadow-xs"
                  >
                    <option value="Boy">Boy</option>
                    <option value="Girl">Girl</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Weight (kg)</label>
                  <ClinicalNumberInput
                    value={newWeight}
                    onChange={(val) => setNewWeight(val)}
                    min={1.5}
                    max={25.0}
                    step={0.1}
                    unit="kg"
                    className="w-full h-12 min-h-[48px] border border-slate-300 rounded-xl px-2.5 text-base font-bold text-slate-900 bg-white shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Length / Stature (cm)</label>
                  <ClinicalNumberInput
                    value={newHeight}
                    onChange={(val) => setNewHeight(val)}
                    min={45.0}
                    max={110.0}
                    step={0.5}
                    unit="cm"
                    className="w-full h-12 min-h-[48px] border border-slate-300 rounded-xl px-2.5 text-base font-bold text-slate-900 bg-white shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Feeding Interval</label>
                  <select
                    value={newInterval}
                    onChange={(e) => setNewInterval(parseInt(e.target.value) as 2 | 3 | 4)}
                    className="w-full h-12 min-h-[48px] border border-slate-300 rounded-xl px-3 bg-white text-base font-semibold text-slate-900 shadow-xs"
                  >
                    <option value={2}>2 Hours (12 feeds/d)</option>
                    <option value={3}>3 Hours (8 feeds/d)</option>
                    <option value={4}>4 Hours (6 feeds/d)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bilateral Pitting Edema</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['None', 'Mild/Moderate (+ / ++)', 'Severe (+++)'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setNewEdema(sev)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all min-h-[48px] flex items-center justify-center ${
                        newEdema === sev
                          ? sev === 'Severe (+++)'
                            ? 'bg-red-50 border-red-300 text-red-700 font-bold'
                            : 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Therapeutic Milk Phase</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['F-75 Stabilization', 'F-100 Rehabilitation'] as const).map((ph) => (
                    <button
                      key={ph}
                      type="button"
                      onClick={() => setNewPhase(ph)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all min-h-[48px] flex items-center justify-center ${
                        newPhase === ph
                          ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {ph}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 min-h-[48px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePatient}
                disabled={!newCot.trim()}
                className="px-5 py-2.5 rounded-xl bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 disabled:opacity-50 min-h-[48px] shadow-xs"
              >
                Add to Ward Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
