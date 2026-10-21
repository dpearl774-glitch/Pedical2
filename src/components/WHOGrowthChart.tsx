import React, { useState, useRef, useMemo } from 'react';
import {
  WHO_BOYS_WFL,
  WHO_GIRLS_WFL,
  WHO_BOYS_WFA,
  WHO_GIRLS_WFA,
  WHO_BOYS_LFA,
  WHO_GIRLS_LFA,
  WHOPoint,
  interpolateWHOPoint,
} from '../data/whoGrowthStandards';
import {
  TrendingUp,
  Plus,
  Trash2,
  Maximize2,
  Minimize2,
  Crosshair,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
} from 'lucide-react';

export type GrowthChartType = 'WFL' | 'WFA' | 'LFA';

export interface LongitudinalPoint {
  id: string;
  dayLabel: string;
  xValue: number;
  yValue: number;
  zScore: number;
  timestamp: string;
}

interface WHOGrowthChartProps {
  currentWeightKg: number;
  currentHeightCm: number;
  currentAgeMonths?: number;
  sex: 'Boy' | 'Girl';
  patientName?: string;
  cotNumber?: string;
  onSelectPoint?: (lengthCm: number, weightKg: number) => void;
  onUpdateSex?: (sex: 'Boy' | 'Girl') => void;
  onUpdateAgeMonths?: (age: number) => void;
}

export const WHOGrowthChart: React.FC<WHOGrowthChartProps> = ({
  currentWeightKg,
  currentHeightCm,
  currentAgeMonths = 12,
  sex: propSex,
  patientName = 'Active Patient',
  cotNumber = 'Cot 1',
  onSelectPoint,
  onUpdateSex,
}) => {
  const [chartType, setChartType] = useState<GrowthChartType>('WFL');
  const [internalSex, setInternalSex] = useState<'Boy' | 'Girl'>(propSex);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [zoomRange, setZoomRange] = useState<'all' | 'infant' | 'older'>('all');
  const [inspectedPoint, setInspectedPoint] = useState<{
    xVal: number;
    yVal: number;
    zScore: number;
    thresholds: WHOPoint;
  } | null>(null);

  // Sync prop sex if updated externally
  const activeSex = propSex || internalSex;

  const handleSexChange = (newSex: 'Boy' | 'Girl') => {
    setInternalSex(newSex);
    if (onUpdateSex) {
      onUpdateSex(newSex);
    }
  };

  // Serial longitudinal patient points for inpatient tracking
  const [patientPoints, setPatientPoints] = useState<LongitudinalPoint[]>([
    {
      id: 'pt-admission',
      dayLabel: 'Admission',
      xValue: currentHeightCm,
      yValue: currentWeightKg,
      zScore: -3.4,
      timestamp: 'Day 1',
    },
  ]);

  const [newDayLabel, setNewDayLabel] = useState<string>('Day 3');
  const [newYVal, setNewYVal] = useState<number>(Number((currentWeightKg * 0.98).toFixed(1)));
  const [newXVal, setNewXVal] = useState<number>(currentHeightCm);
  const [showAddPointForm, setShowAddPointForm] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Select active WHO dataset based on chartType and activeSex
  const activeDataset: WHOPoint[] = useMemo(() => {
    if (chartType === 'WFL') {
      return activeSex === 'Boy' ? WHO_BOYS_WFL : WHO_GIRLS_WFL;
    } else if (chartType === 'WFA') {
      return activeSex === 'Boy' ? WHO_BOYS_WFA : WHO_GIRLS_WFA;
    } else {
      return activeSex === 'Boy' ? WHO_BOYS_LFA : WHO_GIRLS_LFA;
    }
  }, [chartType, activeSex]);

  // Chart configuration & axes parameters with Zoom Presets
  const chartConfig = useMemo(() => {
    if (chartType === 'WFL') {
      let minX = 45;
      let maxX = 105;
      let minY = 1.5;
      let maxY = 20;
      let xTicks = [45, 55, 65, 75, 85, 95, 105];
      let yTicks = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];

      if (zoomRange === 'infant') {
        minX = 45;
        maxX = 75;
        minY = 1.5;
        maxY = 12;
        xTicks = [45, 50, 55, 60, 65, 70, 75];
        yTicks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      } else if (zoomRange === 'older') {
        minX = 70;
        maxX = 110;
        minY = 6;
        maxY = 22;
        xTicks = [70, 75, 80, 85, 90, 95, 100, 105, 110];
        yTicks = [6, 8, 10, 12, 14, 16, 18, 20, 22];
      }

      return {
        title: `Weight-for-Length / Height (${activeSex}s)`,
        subtitle: 'Primary Inpatient Diagnostic Standard for Severe Acute Malnutrition (SAM)',
        xLabel: 'Length / Stature (cm)',
        yLabel: 'Weight (kg)',
        xUnit: 'cm',
        yUnit: 'kg',
        minX,
        maxX,
        minY,
        maxY,
        xTicks,
        yTicks,
        currentX: currentHeightCm,
        currentY: currentWeightKg,
      };
    } else if (chartType === 'WFA') {
      let minX = 0;
      let maxX = 60;
      let minY = 1.5;
      let maxY = 26;
      let xTicks = [0, 6, 12, 18, 24, 36, 48, 60];
      let yTicks = [2, 6, 10, 14, 18, 22, 26];

      if (zoomRange === 'infant') {
        minX = 0;
        maxX = 24;
        minY = 1.5;
        maxY = 16;
        xTicks = [0, 2, 4, 6, 8, 10, 12, 15, 18, 21, 24];
        yTicks = [2, 4, 6, 8, 10, 12, 14, 16];
      } else if (zoomRange === 'older') {
        minX = 24;
        maxX = 60;
        minY = 8;
        maxY = 26;
        xTicks = [24, 30, 36, 42, 48, 54, 60];
        yTicks = [8, 11, 14, 17, 20, 23, 26];
      }

      return {
        title: `Weight-for-Age (${activeSex}s, 0 to 60 Months)`,
        subtitle: 'WHO Reference for Underweight & Inpatient Catch-Up Velocity',
        xLabel: 'Age (Completed Months)',
        yLabel: 'Weight (kg)',
        xUnit: 'mo',
        yUnit: 'kg',
        minX,
        maxX,
        minY,
        maxY,
        xTicks,
        yTicks,
        currentX: currentAgeMonths,
        currentY: currentWeightKg,
      };
    } else {
      let minX = 0;
      let maxX = 60;
      let minY = 40;
      let maxY = 125;
      let xTicks = [0, 6, 12, 18, 24, 36, 48, 60];
      let yTicks = [45, 60, 75, 90, 105, 120];

      if (zoomRange === 'infant') {
        minX = 0;
        maxX = 24;
        minY = 42;
        maxY = 96;
        xTicks = [0, 3, 6, 9, 12, 15, 18, 21, 24];
        yTicks = [45, 55, 65, 75, 85, 95];
      } else if (zoomRange === 'older') {
        minX = 24;
        maxX = 60;
        minY = 75;
        maxY = 125;
        xTicks = [24, 30, 36, 42, 48, 54, 60];
        yTicks = [75, 85, 95, 105, 115, 125];
      }

      return {
        title: `Length / Height-for-Age (${activeSex}s, 0 to 60 Months)`,
        subtitle: 'WHO Reference for Linear Growth & Chronic Stunting',
        xLabel: 'Age (Completed Months)',
        yLabel: 'Length / Stature (cm)',
        xUnit: 'mo',
        yUnit: 'cm',
        minX,
        maxX,
        minY,
        maxY,
        xTicks,
        yTicks,
        currentX: currentAgeMonths,
        currentY: currentHeightCm,
      };
    }
  }, [chartType, activeSex, zoomRange, currentHeightCm, currentWeightKg, currentAgeMonths]);

  // Dimensions & Padding
  const width = isExpanded ? 1160 : 960;
  const height = isExpanded ? 640 : 500;
  const padLeft = 70;
  const padRight = 65;
  const padTop = 40;
  const padBottom = 60;

  const scaleX = (x: number) =>
    padLeft +
    ((Math.max(chartConfig.minX, Math.min(chartConfig.maxX, x)) - chartConfig.minX) /
      (chartConfig.maxX - chartConfig.minX)) *
      (width - padLeft - padRight);

  const scaleY = (y: number) =>
    height -
    padBottom -
    ((Math.max(chartConfig.minY, Math.min(chartConfig.maxY, y)) - chartConfig.minY) /
      (chartConfig.maxY - chartConfig.minY)) *
      (height - padTop - padBottom);

  const invertX = (px: number) => {
    const raw =
      chartConfig.minX +
      ((px - padLeft) / (width - padLeft - padRight)) * (chartConfig.maxX - chartConfig.minX);
    return Math.max(chartConfig.minX, Math.min(chartConfig.maxX, Number(raw.toFixed(1))));
  };

  const invertY = (py: number) => {
    const raw =
      chartConfig.minY +
      ((height - padBottom - py) / (height - padTop - padBottom)) *
        (chartConfig.maxY - chartConfig.minY);
    return Math.max(chartConfig.minY, Math.min(chartConfig.maxY, Number(raw.toFixed(1))));
  };

  function computeZScore(xVal: number, yVal: number): number {
    const th = interpolateWHOPoint(xVal, activeDataset);
    if (yVal === th.median) return 0;
    if (yVal < th.median) {
      const sd = (th.median - th.sd3neg) / 3;
      return Number(((yVal - th.median) / sd).toFixed(2));
    } else {
      const sd = (th.sd3 - th.median) / 3;
      return Number(((yVal - th.median) / sd).toFixed(2));
    }
  }

  // Filter dataset points within current zoom range
  const visibleDataset = useMemo(() => {
    return activeDataset.filter((d) => d.x >= chartConfig.minX - 2 && d.x <= chartConfig.maxX + 2);
  }, [activeDataset, chartConfig.minX, chartConfig.maxX]);

  // SVG Paths
  const makePath = (key: keyof WHOPoint) => {
    return visibleDataset
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.x)} ${scaleY(d[key] as number)}`)
      .join(' ');
  };

  const pathSd3neg = useMemo(() => makePath('sd3neg'), [visibleDataset, width, height, chartConfig]);
  const pathSd2neg = useMemo(() => makePath('sd2neg'), [visibleDataset, width, height, chartConfig]);
  const pathSd1neg = useMemo(() => makePath('sd1neg'), [visibleDataset, width, height, chartConfig]);
  const pathMedian = useMemo(() => makePath('median'), [visibleDataset, width, height, chartConfig]);
  const pathSd1 = useMemo(() => makePath('sd1'), [visibleDataset, width, height, chartConfig]);
  const pathSd2 = useMemo(() => makePath('sd2'), [visibleDataset, width, height, chartConfig]);
  const pathSd3 = useMemo(() => makePath('sd3'), [visibleDataset, width, height, chartConfig]);

  // Polygon Shaded Risk Bands
  // Area below -3 SD (SAM Risk Band)
  const samZonePolygon = useMemo(() => {
    if (visibleDataset.length < 2) return '';
    const points = visibleDataset.map((d) => `${scaleX(d.x)},${scaleY(d.sd3neg)}`);
    const lastX = scaleX(visibleDataset[visibleDataset.length - 1].x);
    const firstX = scaleX(visibleDataset[0].x);
    const bottomY = height - padBottom;
    return `M ${firstX},${bottomY} L ${points.join(' L ')} L ${lastX},${bottomY} Z`;
  }, [visibleDataset, width, height, chartConfig]);

  // Area between -3 SD and -2 SD (MAM Risk Band)
  const mamZonePolygon = useMemo(() => {
    if (visibleDataset.length < 2) return '';
    const topPoints = visibleDataset.map((d) => `${scaleX(d.x)},${scaleY(d.sd2neg)}`);
    const bottomPoints = [...visibleDataset]
      .reverse()
      .map((d) => `${scaleX(d.x)},${scaleY(d.sd3neg)}`);
    return `M ${topPoints[0]} L ${topPoints.join(' L ')} L ${bottomPoints.join(' L ')} Z`;
  }, [visibleDataset, width, height, chartConfig]);

  // Current Patient Coordinates
  const currentPtX = scaleX(chartConfig.currentX);
  const currentPtY = scaleY(chartConfig.currentY);
  const currentZ = computeZScore(chartConfig.currentX, chartConfig.currentY);
  const currentTh = interpolateWHOPoint(chartConfig.currentX, activeDataset);

  // Recovery target calculations
  const kgBelowSd3 = Number((currentWeightKg - currentTh.sd3neg).toFixed(2));
  const targetWeightDischarge = currentTh.sd2neg;
  const weightGainNeededKg = Number((targetWeightDischarge - currentWeightKg).toFixed(2));

  // Click handler for plotting or inspection
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const normX = (clickX / rect.width) * width;
    const normY = (clickY / rect.height) * height;

    const clickedX = invertX(normX);
    const clickedY = invertY(normY);
    const th = interpolateWHOPoint(clickedX, activeDataset);
    const z = computeZScore(clickedX, clickedY);

    setInspectedPoint({
      xVal: clickedX,
      yVal: clickedY,
      zScore: z,
      thresholds: th,
    });
  };

  const handleApplyInspectedToPatient = () => {
    if (!inspectedPoint) return;
    if (chartType === 'WFL' && onSelectPoint) {
      onSelectPoint(inspectedPoint.xVal, inspectedPoint.yVal);
    }
  };

  const handleAddPatientPoint = () => {
    const z = computeZScore(newXVal, newYVal);
    const newPt: LongitudinalPoint = {
      id: `pt-${Date.now()}`,
      dayLabel: newDayLabel || `Day ${patientPoints.length + 1}`,
      xValue: newXVal,
      yValue: newYVal,
      zScore: z,
      timestamp: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    };
    setPatientPoints([...patientPoints, newPt]);
    setShowAddPointForm(false);
  };

  const removePatientPoint = (id: string) => {
    setPatientPoints(patientPoints.filter((p) => p.id !== id));
  };

  const trajectoryPath = useMemo(() => {
    if (patientPoints.length < 2) return '';
    return patientPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.xValue)} ${scaleY(p.yValue)}`)
      .join(' ');
  }, [patientPoints, chartConfig]);

  const lastPoint = visibleDataset[visibleDataset.length - 1];

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs transition-all ${
        isExpanded ? 'fixed inset-2 z-50 overflow-y-auto bg-white shadow-2xl p-4' : ''
      }`}
    >
      {/* 1. Header & Controls Bar */}
      <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 space-y-4">
        {/* Top Line: Chart Identity & Sex Selection */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-700" />
              <h2 className="text-base font-bold text-slate-900">{chartConfig.title}</h2>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                  currentZ < -3
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : currentZ < -2
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                WHZ: {currentZ > 0 ? `+${currentZ}` : currentZ} SD
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{chartConfig.subtitle}</div>
          </div>

          {/* Gender & Expand Controls */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {/* Gender Toggle */}
            <div className="flex items-center bg-slate-200/90 p-1 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleSexChange('Boy')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeSex === 'Boy'
                    ? 'bg-blue-700 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Boy (WHO Blue)
              </button>
              <button
                type="button"
                onClick={() => handleSexChange('Girl')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeSex === 'Girl'
                    ? 'bg-rose-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Girl (WHO Rose)
              </button>
            </div>

            {/* Expand / Minimize Fullscreen */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 min-h-[38px] min-w-[38px] flex items-center justify-center shadow-xs"
              title={isExpanded ? 'Exit Fullscreen' : 'Expand High-Visibility Chart'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Second Line: Chart Type Switcher & Zoom Presets */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200">
          {/* Chart Type Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
            <span className="text-slate-400 font-bold mr-1 uppercase text-[10px] tracking-wider">
              Chart:
            </span>
            <button
              type="button"
              onClick={() => {
                setChartType('WFL');
                setZoomRange('all');
              }}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                chartType === 'WFL'
                  ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Weight-for-Length (45-110 cm)
            </button>
            <button
              type="button"
              onClick={() => {
                setChartType('WFA');
                setZoomRange('all');
              }}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                chartType === 'WFA'
                  ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Weight-for-Age (0-60 mo)
            </button>
            <button
              type="button"
              onClick={() => {
                setChartType('LFA');
                setZoomRange('all');
              }}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                chartType === 'LFA'
                  ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Length-for-Age (0-60 mo)
            </button>
          </div>

          {/* Quick Zoom Presets for Mobile */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-bold mr-1 uppercase text-[10px] tracking-wider flex items-center gap-1">
              <ZoomIn className="w-3 h-3" /> Zoom:
            </span>
            <button
              type="button"
              onClick={() => setZoomRange('all')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                zoomRange === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Full Range
            </button>
            <button
              type="button"
              onClick={() => setZoomRange('infant')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                zoomRange === 'infant'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {chartType === 'WFL' ? 'Infants (45-75cm)' : '0-24 Months'}
            </button>
            <button
              type="button"
              onClick={() => setZoomRange('older')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                zoomRange === 'older'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {chartType === 'WFL' ? 'Older (70-110cm)' : '24-60 Months'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. High-Visibility Clinical Banner (Direct Readout for Quick Reference) */}
      <div className="p-4 bg-white border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div className="text-slate-500 font-semibold uppercase text-[10px]">Active Patient Point</div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">
            {cotNumber}: {patientName}
          </div>
          <div className="text-xs font-mono text-slate-600 mt-0.5">
            {chartConfig.xLabel.split(' ')[0]}: {chartConfig.currentX} {chartConfig.xUnit} &middot;{' '}
            {chartConfig.yLabel.split(' ')[0]}: {chartConfig.currentY} {chartConfig.yUnit}
          </div>
        </div>

        <div
          className={`p-3 rounded-lg border ${
            currentZ < -3
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : currentZ < -2
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-emerald-50 border-emerald-300 text-emerald-950'
          }`}
        >
          <div className="font-semibold uppercase text-[10px] opacity-75">WHO Z-Score Status</div>
          <div className="text-lg font-black font-mono mt-0.5">
            {currentZ > 0 ? `+${currentZ}` : currentZ} SD
          </div>
          <div className="font-bold text-[11px] mt-0.5">
            {currentZ < -3
              ? 'Severe Acute Malnutrition (WHZ < -3)'
              : currentZ < -2
              ? 'Moderate Acute Malnutrition (WHZ -3 to -2)'
              : 'Normal Range (WHZ >= -2)'}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 text-blue-950">
          <div className="text-blue-700 font-semibold uppercase text-[10px]">Distance to -3 SD SAM Cutoff</div>
          <div className="text-lg font-black font-mono mt-0.5">
            {kgBelowSd3 < 0 ? `${kgBelowSd3} kg` : `+${kgBelowSd3} kg`}
          </div>
          <div className="text-[11px] text-blue-800 mt-0.5">
            -3 SD cutoff at {currentHeightCm} cm is {currentTh.sd3neg.toFixed(1)} kg
          </div>
        </div>

        <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-emerald-950">
          <div className="text-emerald-700 font-semibold uppercase text-[10px]">Target Discharge Weight (-2 SD)</div>
          <div className="text-lg font-black font-mono mt-0.5">
            {targetWeightDischarge.toFixed(1)} kg
          </div>
          <div className="text-[11px] text-emerald-800 mt-0.5">
            {weightGainNeededKg > 0 ? `+${weightGainNeededKg} kg gain needed for recovery` : 'At or above target'}
          </div>
        </div>
      </div>

      {/* 3. Interactive Clinical Graph Canvas (Medical Paper Aesthetic) */}
      <div className="p-3 sm:p-5 bg-slate-900 select-none relative overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair min-w-[720px] sm:min-w-0"
          onClick={handleSvgClick}
          style={{ minHeight: isExpanded ? '520px' : '400px' }}
        >
          {/* Defs for gradients & patterns */}
          <defs>
            <linearGradient id="samGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="mamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.08" />
            </linearGradient>
          </defs>

          {/* Background medical paper */}
          <rect x={0} y={0} width={width} height={height} fill="#0f172a" rx={8} />

          {/* Shaded Risk Zones */}
          {samZonePolygon && <path d={samZonePolygon} fill="url(#samGradient)" />}
          {mamZonePolygon && <path d={mamZonePolygon} fill="url(#mamGradient)" />}

          {/* Grid lines: X-Axis Ticks */}
          {chartConfig.xTicks.map((x) => (
            <g key={`x-${x}`}>
              <line
                x1={scaleX(x)}
                x2={scaleX(x)}
                y1={padTop}
                y2={height - padBottom}
                stroke="#1e293b"
                strokeWidth={1.2}
              />
              <text
                x={scaleX(x)}
                y={height - padBottom + 22}
                fill="#cbd5e1"
                fontSize={12}
                fontFamily="JetBrains Mono, monospace"
                textAnchor="middle"
                fontWeight="600"
              >
                {x}
                {chartConfig.xUnit}
              </text>
            </g>
          ))}

          {/* Grid lines: Y-Axis Ticks */}
          {chartConfig.yTicks.map((y) => (
            <g key={`y-${y}`}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={scaleY(y)}
                y2={scaleY(y)}
                stroke="#1e293b"
                strokeWidth={1.2}
              />
              <text
                x={padLeft - 12}
                y={scaleY(y) + 4}
                fill="#cbd5e1"
                fontSize={12}
                fontFamily="JetBrains Mono, monospace"
                textAnchor="end"
                fontWeight="600"
              >
                {y}
                {chartConfig.yUnit}
              </text>
            </g>
          ))}

          {/* Axis Borders */}
          <line
            x1={padLeft}
            x2={width - padRight}
            y1={height - padBottom}
            y2={height - padBottom}
            stroke="#94a3b8"
            strokeWidth={2}
          />
          <line
            x1={padLeft}
            x2={padLeft}
            y1={padTop}
            y2={height - padBottom}
            stroke="#94a3b8"
            strokeWidth={2}
          />

          {/* Axis Labels */}
          <text
            x={width / 2}
            y={height - 12}
            fill="#e2e8f0"
            fontSize={12}
            fontWeight="bold"
            textAnchor="middle"
          >
            {chartConfig.xLabel}
          </text>
          <text
            x={18}
            y={height / 2}
            fill="#e2e8f0"
            fontSize={12}
            fontWeight="bold"
            textAnchor="middle"
            transform={`rotate(-90 18 ${height / 2})`}
          >
            {chartConfig.yLabel}
          </text>

          {/* WHO Standard Deviation Curves */}
          {/* +3 SD */}
          <path d={pathSd3} fill="none" stroke="#a78bfa" strokeWidth={1.8} strokeDasharray="5 3" />
          {/* +2 SD */}
          <path d={pathSd2} fill="none" stroke="#60a5fa" strokeWidth={2.0} strokeDasharray="5 3" />
          {/* +1 SD */}
          <path d={pathSd1} fill="none" stroke="#38bdf8" strokeWidth={1.6} strokeDasharray="3 3" />
          {/* Median (0 SD) */}
          <path d={pathMedian} fill="none" stroke="#10b981" strokeWidth={3.2} strokeLinecap="round" />
          {/* -1 SD */}
          <path d={pathSd1neg} fill="none" stroke="#eab308" strokeWidth={1.6} strokeDasharray="3 3" />
          {/* -2 SD (MAM Cut-off / Discharge Target) */}
          <path
            d={pathSd2neg}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={2.8}
            strokeDasharray="6 3"
            strokeLinecap="round"
          />
          {/* -3 SD (SAM Severe Malnutrition Cut-off) - Prominent Red Line */}
          <path d={pathSd3neg} fill="none" stroke="#ef4444" strokeWidth={3.8} strokeLinecap="round" />

          {/* End-of-Curve Line Labels */}
          {lastPoint && (
            <>
              <text
                x={width - padRight + 6}
                y={scaleY(lastPoint.sd3neg) + 4}
                fill="#ef4444"
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
                fontWeight="bold"
              >
                -3 SD (SAM)
              </text>
              <text
                x={width - padRight + 6}
                y={scaleY(lastPoint.sd2neg) + 4}
                fill="#f59e0b"
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
                fontWeight="bold"
              >
                -2 SD (MAM)
              </text>
              <text
                x={width - padRight + 6}
                y={scaleY(lastPoint.median) + 4}
                fill="#10b981"
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
                fontWeight="bold"
              >
                Median
              </text>
              <text
                x={width - padRight + 6}
                y={scaleY(lastPoint.sd2) + 4}
                fill="#60a5fa"
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
                fontWeight="bold"
              >
                +2 SD
              </text>
            </>
          )}

          {/* Longitudinal Inpatient Patient Trajectory Line */}
          {trajectoryPath && (
            <path
              d={trajectoryPath}
              fill="none"
              stroke="#ffffff"
              strokeWidth={3}
              strokeDasharray="5 3"
            />
          )}

          {/* Longitudinal Points Markers */}
          {patientPoints.map((pt, idx) => {
            const px = scaleX(pt.xValue);
            const py = scaleY(pt.yValue);
            return (
              <g key={pt.id}>
                <circle cx={px} cy={py} r={6} fill="#ffffff" stroke="#1e293b" strokeWidth={2} />
                <text
                  x={px}
                  y={py - 10}
                  fill="#ffffff"
                  fontSize={10}
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {pt.dayLabel}
                </text>
              </g>
            );
          })}

          {/* CURRENT PATIENT POSITION MARKER (Pulsing high-visibility dot) */}
          <g>
            <circle
              cx={currentPtX}
              cy={currentPtY}
              r={14}
              fill="#ef4444"
              opacity={0.3}
              className="animate-ping"
            />
            <circle
              cx={currentPtX}
              cy={currentPtY}
              r={8}
              fill="#ef4444"
              stroke="#ffffff"
              strokeWidth={3}
            />
            {/* Crosshair guidelines to axes */}
            <line
              x1={padLeft}
              x2={currentPtX}
              y1={currentPtY}
              y2={currentPtY}
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
            <line
              x1={currentPtX}
              x2={currentPtX}
              y1={currentPtY}
              y2={height - padBottom}
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
            {/* Coordinate Label */}
            <rect
              x={currentPtX - 40}
              y={currentPtY - 32}
              width={80}
              height={22}
              rx={4}
              fill="#0f172a"
              stroke="#ef4444"
              strokeWidth={1.5}
            />
            <text
              x={currentPtX}
              y={currentPtY - 18}
              fill="#ffffff"
              fontSize={11}
              fontFamily="JetBrains Mono, monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              {currentWeightKg}kg / {currentHeightCm}cm
            </text>
          </g>

          {/* Inspected Click Marker (if user tapped graph) */}
          {inspectedPoint && (
            <g>
              <circle
                cx={scaleX(inspectedPoint.xVal)}
                cy={scaleY(inspectedPoint.yVal)}
                r={7}
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth={2}
              />
              <line
                x1={scaleX(inspectedPoint.xVal) - 12}
                x2={scaleX(inspectedPoint.xVal) + 12}
                y1={scaleY(inspectedPoint.yVal)}
                y2={scaleY(inspectedPoint.yVal)}
                stroke="#38bdf8"
                strokeWidth={2}
              />
              <line
                x1={scaleX(inspectedPoint.xVal)}
                x2={scaleX(inspectedPoint.xVal)}
                y1={scaleY(inspectedPoint.yVal) - 12}
                y2={scaleY(inspectedPoint.yVal) + 12}
                stroke="#38bdf8"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>
      </div>

      {/* 4. Tap-to-Inspect Readout Panel */}
      {inspectedPoint && (
        <div className="p-4 bg-sky-50 border-b border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-sky-700" />
              <span className="font-bold text-sky-950 uppercase tracking-wider text-[11px]">
                Inspected Coordinate on Graph:
              </span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-sky-200">
                {inspectedPoint.xVal} {chartConfig.xUnit} &middot; {inspectedPoint.yVal}{' '}
                {chartConfig.yUnit}
              </span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded ${
                  inspectedPoint.zScore < -3
                    ? 'bg-rose-600 text-white'
                    : inspectedPoint.zScore < -2
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                WHZ: {inspectedPoint.zScore} SD
              </span>
            </div>
            <div className="text-sky-900 mt-1">
              At {inspectedPoint.xVal} {chartConfig.xUnit}: -3 SD SAM Cutoff is{' '}
              <strong>{inspectedPoint.thresholds.sd3neg.toFixed(1)} kg</strong> &middot; -2 SD
              Discharge Target is{' '}
              <strong>{inspectedPoint.thresholds.sd2neg.toFixed(1)} kg</strong>.
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {chartType === 'WFL' && onSelectPoint && (
              <button
                type="button"
                onClick={handleApplyInspectedToPatient}
                className="px-3 py-1.5 bg-blue-700 text-white font-bold rounded-lg hover:bg-blue-800 transition-colors shadow-xs"
              >
                Apply to Patient Calculator
              </button>
            )}
            <button
              type="button"
              onClick={() => setInspectedPoint(null)}
              className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg bg-white"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* 5. Inpatient Longitudinal Serial Weight Tracker */}
      <div className="p-4 sm:p-5 bg-white space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Inpatient Serial Growth &amp; Recovery Trajectory
            </h3>
            <div className="text-xs text-slate-500">
              Track serial weights during stabilization and catch-up growth phases (Target: &gt; 10
              g/kg/day during rehabilitation)
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddPointForm(!showAddPointForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Inpatient Weight</span>
          </button>
        </div>

        {/* Add Serial Weight Form */}
        {showAddPointForm && (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Ward Stay Label</label>
              <input
                type="text"
                value={newDayLabel}
                onChange={(e) => setNewDayLabel(e.target.value)}
                placeholder="e.g. Day 3"
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={newYVal}
                onChange={(e) => setNewYVal(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">
                {chartConfig.xLabel.split(' ')[0]} ({chartConfig.xUnit})
              </label>
              <input
                type="number"
                step="0.5"
                value={newXVal}
                onChange={(e) => setNewXVal(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handleAddPatientPoint}
                className="flex-1 py-1.5 bg-blue-700 text-white font-bold rounded hover:bg-blue-800 transition-colors"
              >
                Plot Point
              </button>
              <button
                type="button"
                onClick={() => setShowAddPointForm(false)}
                className="py-1.5 px-3 border border-slate-300 rounded text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Plotted Serial Points List */}
        <div className="flex flex-wrap gap-2 pt-1">
          {patientPoints.map((pt) => (
            <div
              key={pt.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-mono"
            >
              <span className="font-bold text-slate-900">{pt.dayLabel}:</span>
              <span className="text-blue-900 font-bold">{pt.yValue} kg</span>
              <span className="text-slate-500">({pt.xValue} cm)</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  pt.zScore < -3
                    ? 'bg-rose-100 text-rose-800'
                    : pt.zScore < -2
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {pt.zScore} SD
              </span>
              {patientPoints.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePatientPoint(pt.id)}
                  className="text-slate-400 hover:text-rose-600 ml-1"
                  title="Remove point"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
