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
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-700" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Inpatient Bedside Feeding Roster (De-Identified)
              </h2>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {patients.length} active inpatients &middot; WHO Inpatient Malnutrition Protocols
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={onBatchPrint}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-95 transition-all shadow-xs min-h-[40px]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Batch Print Bedside Sheets</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setNewCot(`Cot ${String(patients.length + 1).padStart(2, '0')}`);
                setNewMrn(`Ref-${100 + patients.length + 1}`);
                setShowAddModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-lg shadow-xs transition-all min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Inpatient Bed</span>
            </button>
          </div>
        </div>

        {/* Aggregated Formula Batch Preparation Requirements */}
        <div>
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Beaker className="w-3.5 h-3.5 text-blue-700" />
              <span>24-Hour Formula Batch Preparation Requirements</span>
            </div>
            <span className="text-[11px] font-normal text-slate-500 font-mono">
              Combined totals for all {patients.length} children
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60">
              <span className="text-[11px] font-semibold text-blue-900 block">Total F-75 Stabilization</span>
              <div className="text-2xl font-mono font-bold text-blue-950 mt-0.5">
                {wardSummary.totalF75Ml}
                <span className="text-xs font-sans text-blue-700 ml-1">mL/day</span>
              </div>
              <div className="text-[11px] text-blue-800 mt-1 font-mono">
                {wardSummary.f75PatientsCount} patients on F-75
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-[11px] font-semibold text-slate-700 block">Total F-100 Catch-Up</span>
              <div className="text-2xl font-mono font-bold text-slate-900 mt-0.5">
                {wardSummary.totalF100Ml}
                <span className="text-xs font-sans text-slate-500 ml-1">mL/day</span>
              </div>
              <div className="text-[11px] text-slate-600 mt-1 font-mono">
                {wardSummary.f100PatientsCount} patients on F-100
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-[11px] font-semibold text-slate-700 block">Total Liquid CMV Solution</span>
              <div className="text-2xl font-mono font-bold text-slate-900 mt-0.5">
                {wardSummary.totalCmvSolutionMl}
                <span className="text-xs font-sans text-slate-500 ml-1">mL</span>
              </div>
              <div className="text-[11px] text-slate-600 mt-1 font-mono">
                20 mL per 1,000 mL batch
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-[11px] font-semibold text-slate-700 block">Ward Sugar &amp; Oil</span>
              <div className="text-lg font-mono font-bold text-slate-900 mt-1">
                {wardSummary.totalSugarGrams}g <span className="text-xs font-normal text-slate-500">sugar</span> &middot; {wardSummary.totalOilGrams}g <span className="text-xs font-normal text-slate-500">oil</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                {wardSummary.totalCerealFlourGrams}g cereal flour
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-semibold mr-1">Filter Ward:</span>
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
              className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
                filterPhase === tab
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'All' && 'All Inpatients'}
              {tab === 'F-75' && 'F-75 Stabilization'}
              {tab === 'F-100' && 'F-100 Rehabilitation'}
              {tab === 'HighRisk' && 'High Risk / Severe'} ({count})
            </button>
          );
        })}
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
              className={`bg-white rounded-xl border p-4 transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-md'
                  : 'border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-xs font-bold">
                      {patient.cotNumber}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">
                        {patient.name}
                      </h3>
                      <div className="text-[11px] font-mono text-slate-500">
                        MRN: {patient.mrn} &middot; {patient.input.age_months ?? '--'} mo &middot; {patient.input.sex}
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
                  <div className="mb-2 p-2 rounded bg-rose-50 border border-rose-300 text-rose-900 text-[11px] font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Rule 2 Error: F-100 Contraindicated in Severe Edema</span>
                  </div>
                )}

                {/* Anthropometrics & Z-Score */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 mb-3 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">WEIGHT</span>
                    <strong className="text-slate-900 text-sm">{patient.input.weight_kg} kg</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">LENGTH</span>
                    <strong className="text-slate-900 text-sm">{patient.input.height_cm ?? '--'} cm</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">WHZ</span>
                    <strong
                      className={`text-sm ${
                        evalRes.growthAssessment?.isSam ? 'text-rose-700' : 'text-amber-700'
                      }`}
                    >
                      {evalRes.growthAssessment?.wflZScore !== undefined
                        ? `${evalRes.growthAssessment.wflZScore > 0 ? '+' : ''}${evalRes.growthAssessment.wflZScore}`
                        : '--'}
                    </strong>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px]">
                  <span
                    className={`px-2 py-0.5 rounded font-semibold ${
                      patient.input.therapeutic_phase === 'F-75 Stabilization'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {patient.input.therapeutic_phase.split(' ')[0]}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded font-semibold ${
                      isHighEdema
                        ? 'bg-rose-100 text-rose-900 border border-rose-300'
                        : patient.input.edema_severity === 'None'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    Edema: {patient.input.edema_severity}
                  </span>

                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                    q{patient.input.feeding_interval_hours}h
                  </span>
                </div>

                {/* Feeding Target Strip */}
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs mb-3 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">Feed Target</span>
                    <strong className="font-mono text-blue-900 text-sm">
                      {evalRes.feedingSummary.targetVolumePerFeed} mL
                    </strong>
                    <span className="text-slate-500 text-[11px] ml-1">
                      every {evalRes.feedingSummary.feedingIntervalHours}h
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">24h Total</span>
                    <strong className="font-mono text-slate-900 text-sm">
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
                  <span>{isSelected ? 'Currently Viewing' : 'Select Child'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onPrintPatient(patient)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="Print Bedside Sheet"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>

                {patients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onDeletePatient(patient.id)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Discharge / Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Admit Child Modal (De-Identified) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-300 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Bed className="w-5 h-5 text-blue-700" />
                <span className="font-bold text-slate-900 text-base">Add Inpatient Bed (De-Identified)</span>
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
              <strong>De-Identification Policy:</strong> Do not enter identifiable patient names or hospital records. Use bed identifiers and optional initials only.
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cot / Bed Identifier</label>
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Age (Months)</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={newAge}
                    onChange={(e) => setNewAge(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Sex</label>
                  <select
                    value={newSex}
                    onChange={(e) => setNewSex(e.target.value as 'Boy' | 'Girl')}
                    className="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white"
                  >
                    <option value="Boy">Boy</option>
                    <option value="Girl">Girl</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.5"
                    max="25"
                    value={newWeight}
                    onChange={(e) => setNewWeight(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Length / Stature (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="45"
                    max="110"
                    value={newHeight}
                    onChange={(e) => setNewHeight(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Feeding Interval</label>
                  <select
                    value={newInterval}
                    onChange={(e) => setNewInterval(parseInt(e.target.value) as 2 | 3 | 4)}
                    className="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white font-mono"
                  >
                    <option value={2}>2 Hours (12 feeds/d)</option>
                    <option value={3}>3 Hours (8 feeds/d)</option>
                    <option value={4}>4 Hours (6 feeds/d)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Bilateral Pitting Edema</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['None', 'Mild/Moderate (+ / ++)', 'Severe (+++)'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setNewEdema(sev)}
                      className={`p-2 rounded-lg border text-xs font-semibold text-center transition-all ${
                        newEdema === sev
                          ? sev === 'Severe (+++)'
                            ? 'bg-rose-100 border-rose-600 text-rose-900'
                            : 'bg-blue-50 border-blue-600 text-blue-900'
                          : 'bg-slate-50 border-slate-300 text-slate-700'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Therapeutic Milk Phase</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['F-75 Stabilization', 'F-100 Rehabilitation'] as const).map((ph) => (
                    <button
                      key={ph}
                      type="button"
                      onClick={() => setNewPhase(ph)}
                      className={`p-2 rounded-lg border text-xs font-semibold text-center transition-all ${
                        newPhase === ph
                          ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                          : 'bg-slate-50 border-slate-300 text-slate-700'
                      }`}
                    >
                      {ph}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePatient}
                disabled={!newCot.trim()}
                className="px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold text-xs hover:bg-blue-800 disabled:opacity-50"
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
