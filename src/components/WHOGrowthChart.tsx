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
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { ClinicalNumberInput } from './ClinicalNumberInput';

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

  const getBaseBounds = (type: GrowthChartType) => {
    if (type === 'WFL') {
      return { minX: 45, maxX: 105, minY: 1.5, maxY: 20 };
    } else if (type === 'WFA') {
      return { minX: 0, maxX: 60, minY: 1.5, maxY: 26 };
    } else {
      return { minX: 0, maxX: 60, minY: 40, maxY: 125 };
    }
  };

  const [viewBounds, setViewBounds] = useState<{ minX: number; maxX: number; minY: number; maxY: number }>(() =>
    getBaseBounds('WFL')
  );
  const [zoomPreset, setZoomPreset] = useState<'all' | 'infant' | 'older' | 'patient' | 'custom'>('all');

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
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startBounds: typeof viewBounds } | null>(null);
  const touchStartRef = useRef<{ clientX: number; clientY: number; startBounds: typeof viewBounds; dist?: number } | null>(null);

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

  const baseBounds = useMemo(() => getBaseBounds(chartType), [chartType]);

  const currentZoomPercent = useMemo(() => {
    const baseSpan = baseBounds.maxX - baseBounds.minX;
    const curSpan = viewBounds.maxX - viewBounds.minX;
    return Math.min(400, Math.max(100, Math.round((baseSpan / curSpan) * 100)));
  }, [baseBounds, viewBounds]);

  const isZoomed = currentZoomPercent > 105;

  const handleChartTypeChange = (newType: GrowthChartType) => {
    setChartType(newType);
    const base = getBaseBounds(newType);
    setViewBounds(base);
    setZoomPreset('all');
    setInspectedPoint(null);
  };

  const chartConfig = useMemo(() => {
    if (chartType === 'WFL') {
      return {
        title: `Weight-for-Length / Height (${activeSex}s)`,
        subtitle: 'Primary Inpatient Diagnostic Standard for Severe Acute Malnutrition (SAM)',
        xLabel: 'Length / Stature (cm)',
        yLabel: 'Weight (kg)',
        xUnit: 'cm',
        yUnit: 'kg',
        currentX: currentHeightCm,
        currentY: currentWeightKg,
      };
    } else if (chartType === 'WFA') {
      return {
        title: `Weight-for-Age (${activeSex}s, 0 to 60 Months)`,
        subtitle: 'WHO Reference for Underweight & Inpatient Catch-Up Velocity',
        xLabel: 'Age (Completed Months)',
        yLabel: 'Weight (kg)',
        xUnit: 'mo',
        yUnit: 'kg',
        currentX: currentAgeMonths,
        currentY: currentWeightKg,
      };
    } else {
      return {
        title: `Length / Height-for-Age (${activeSex}s, 0 to 60 Months)`,
        subtitle: 'WHO Reference for Linear Growth & Chronic Stunting',
        xLabel: 'Age (Completed Months)',
        yLabel: 'Length / Stature (cm)',
        xUnit: 'mo',
        yUnit: 'cm',
        currentX: currentAgeMonths,
        currentY: currentHeightCm,
      };
    }
  }, [chartType, activeSex, currentHeightCm, currentWeightKg, currentAgeMonths]);

  // Zoom control helpers
  const zoomIn = (focusX?: number, focusY?: number) => {
    const curCenterX = focusX ?? (viewBounds.minX + viewBounds.maxX) / 2;
    const curCenterY = focusY ?? (viewBounds.minY + viewBounds.maxY) / 2;
    const curSpanX = viewBounds.maxX - viewBounds.minX;
    const curSpanY = viewBounds.maxY - viewBounds.minY;

    const minSpanX = chartType === 'WFL' ? 10 : 8;
    const minSpanY = chartType === 'LFA' ? 12 : 2.5;

    const newSpanX = Math.max(minSpanX, curSpanX * 0.75);
    const newSpanY = Math.max(minSpanY, curSpanY * 0.75);

    let newMinX = curCenterX - newSpanX / 2;
    let newMaxX = curCenterX + newSpanX / 2;
    if (newMinX < baseBounds.minX) {
      newMaxX += baseBounds.minX - newMinX;
      newMinX = baseBounds.minX;
    }
    if (newMaxX > baseBounds.maxX) {
      newMinX = Math.max(baseBounds.minX, newMinX - (newMaxX - baseBounds.maxX));
      newMaxX = baseBounds.maxX;
    }

    let newMinY = curCenterY - newSpanY / 2;
    let newMaxY = curCenterY + newSpanY / 2;
    if (newMinY < baseBounds.minY) {
      newMaxY += baseBounds.minY - newMinY;
      newMinY = baseBounds.minY;
    }
    if (newMaxY > baseBounds.maxY) {
      newMinY = Math.max(baseBounds.minY, newMinY - (newMaxY - baseBounds.maxY));
      newMaxY = baseBounds.maxY;
    }

    setViewBounds({
      minX: Number(newMinX.toFixed(1)),
      maxX: Number(newMaxX.toFixed(1)),
      minY: Number(newMinY.toFixed(1)),
      maxY: Number(newMaxY.toFixed(1)),
    });
    setZoomPreset('custom');
  };

  const zoomOut = () => {
    const curCenterX = (viewBounds.minX + viewBounds.maxX) / 2;
    const curCenterY = (viewBounds.minY + viewBounds.maxY) / 2;
    const curSpanX = viewBounds.maxX - viewBounds.minX;
    const curSpanY = viewBounds.maxY - viewBounds.minY;

    const maxSpanX = baseBounds.maxX - baseBounds.minX;
    const maxSpanY = baseBounds.maxY - baseBounds.minY;

    const newSpanX = Math.min(maxSpanX, curSpanX * 1.35);
    const newSpanY = Math.min(maxSpanY, curSpanY * 1.35);

    if (newSpanX >= maxSpanX - 0.5) {
      resetZoom();
      return;
    }

    let newMinX = curCenterX - newSpanX / 2;
    let newMaxX = curCenterX + newSpanX / 2;
    if (newMinX < baseBounds.minX) {
      newMaxX += baseBounds.minX - newMinX;
      newMinX = baseBounds.minX;
    }
    if (newMaxX > baseBounds.maxX) {
      newMinX = Math.max(baseBounds.minX, newMinX - (newMaxX - baseBounds.maxX));
      newMaxX = baseBounds.maxX;
    }

    let newMinY = curCenterY - newSpanY / 2;
    let newMaxY = curCenterY + newSpanY / 2;
    if (newMinY < baseBounds.minY) {
      newMaxY += baseBounds.minY - newMinY;
      newMinY = baseBounds.minY;
    }
    if (newMaxY > baseBounds.maxY) {
      newMinY = Math.max(baseBounds.minY, newMinY - (newMaxY - baseBounds.maxY));
      newMaxY = baseBounds.maxY;
    }

    setViewBounds({
      minX: Number(newMinX.toFixed(1)),
      maxX: Number(newMaxX.toFixed(1)),
      minY: Number(newMinY.toFixed(1)),
      maxY: Number(newMaxY.toFixed(1)),
    });
    setZoomPreset('custom');
  };

  const resetZoom = () => {
    setViewBounds({ ...baseBounds });
    setZoomPreset('all');
  };

  const focusPatient = () => {
    const px = chartConfig.currentX;
    const py = chartConfig.currentY;

    const spanX = chartType === 'WFL' ? 24 : 18;
    const spanY = chartType === 'LFA' ? 28 : 7;

    let minX = px - spanX / 2;
    let maxX = px + spanX / 2;
    if (minX < baseBounds.minX) {
      maxX += baseBounds.minX - minX;
      minX = baseBounds.minX;
    }
    if (maxX > baseBounds.maxX) {
      minX = Math.max(baseBounds.minX, minX - (maxX - baseBounds.maxX));
      maxX = baseBounds.maxX;
    }

    let minY = py - spanY / 2;
    let maxY = py + spanY / 2;
    if (minY < baseBounds.minY) {
      maxY += baseBounds.minY - minY;
      minY = baseBounds.minY;
    }
    if (maxY > baseBounds.maxY) {
      minY = Math.max(baseBounds.minY, minY - (maxY - baseBounds.maxY));
      maxY = baseBounds.maxY;
    }

    setViewBounds({
      minX: Number(minX.toFixed(1)),
      maxX: Number(maxX.toFixed(1)),
      minY: Number(minY.toFixed(1)),
      maxY: Number(maxY.toFixed(1)),
    });
    setZoomPreset('patient');
  };

  const applyInfantPreset = () => {
    if (chartType === 'WFL') {
      setViewBounds({ minX: 45, maxX: 75, minY: 1.5, maxY: 13 });
    } else if (chartType === 'WFA') {
      setViewBounds({ minX: 0, maxX: 24, minY: 1.5, maxY: 16 });
    } else {
      setViewBounds({ minX: 0, maxX: 24, minY: 40, maxY: 95 });
    }
    setZoomPreset('infant');
  };

  const applyOlderPreset = () => {
    if (chartType === 'WFL') {
      setViewBounds({ minX: 70, maxX: 105, minY: 6, maxY: 20 });
    } else if (chartType === 'WFA') {
      setViewBounds({ minX: 24, maxX: 60, minY: 8, maxY: 26 });
    } else {
      setViewBounds({ minX: 24, maxX: 60, minY: 75, maxY: 125 });
    }
    setZoomPreset('older');
  };

  // Dimensions & Padding
  const width = isExpanded ? 1160 : 960;
  const height = isExpanded ? 640 : 500;
  const padLeft = 70;
  const padRight = 65;
  const padTop = 40;
  const padBottom = 60;

  const scaleX = (x: number) =>
    padLeft +
    ((x - viewBounds.minX) / (viewBounds.maxX - viewBounds.minX)) *
      (width - padLeft - padRight);

  const scaleY = (y: number) =>
    height -
    padBottom -
    ((y - viewBounds.minY) / (viewBounds.maxY - viewBounds.minY)) *
      (height - padTop - padBottom);

  const invertX = (px: number) => {
    const raw =
      viewBounds.minX +
      ((px - padLeft) / (width - padLeft - padRight)) * (viewBounds.maxX - viewBounds.minX);
    return Math.max(baseBounds.minX, Math.min(baseBounds.maxX, Number(raw.toFixed(1))));
  };

  const invertY = (py: number) => {
    const raw =
      viewBounds.minY +
      ((height - padBottom - py) / (height - padTop - padBottom)) *
        (viewBounds.maxY - viewBounds.minY);
    return Math.max(baseBounds.minY, Math.min(baseBounds.maxY, Number(raw.toFixed(1))));
  };

  // Generate clean dynamic axis ticks
  function generateTicks(min: number, max: number, targetCount: number = 7): number[] {
    const span = max - min;
    if (span <= 0) return [min];
    const roughStep = span / targetCount;

    let step = 1;
    if (roughStep <= 0.6) step = 0.5;
    else if (roughStep <= 1.2) step = 1;
    else if (roughStep <= 2.5) step = 2;
    else if (roughStep <= 6) step = 5;
    else if (roughStep <= 12) step = 10;
    else if (roughStep <= 25) step = 20;
    else step = 25;

    const firstTick = Math.ceil(min / step) * step;
    const ticks: number[] = [];
    for (let t = firstTick; t <= max + 0.001; t += step) {
      ticks.push(Number(t.toFixed(1)));
    }
    return ticks;
  }

  const xTicks = useMemo(
    () => generateTicks(viewBounds.minX, viewBounds.maxX, 8),
    [viewBounds.minX, viewBounds.maxX]
  );
  const yTicks = useMemo(
    () => generateTicks(viewBounds.minY, viewBounds.maxY, 7),
    [viewBounds.minY, viewBounds.maxY]
  );

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

  // Filter dataset points within current zoom range with margin
  const visibleDataset = useMemo(() => {
    return activeDataset.filter((d) => d.x >= viewBounds.minX - 3 && d.x <= viewBounds.maxX + 3);
  }, [activeDataset, viewBounds.minX, viewBounds.maxX]);

  // SVG Paths
  const makePath = (key: keyof WHOPoint) => {
    return visibleDataset
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.x)} ${scaleY(d[key] as number)}`)
      .join(' ');
  };

  const pathSd3neg = useMemo(() => makePath('sd3neg'), [visibleDataset, viewBounds, width, height]);
  const pathSd2neg = useMemo(() => makePath('sd2neg'), [visibleDataset, viewBounds, width, height]);
  const pathSd1neg = useMemo(() => makePath('sd1neg'), [visibleDataset, viewBounds, width, height]);
  const pathMedian = useMemo(() => makePath('median'), [visibleDataset, viewBounds, width, height]);
  const pathSd1 = useMemo(() => makePath('sd1'), [visibleDataset, viewBounds, width, height]);
  const pathSd2 = useMemo(() => makePath('sd2'), [visibleDataset, viewBounds, width, height]);
  const pathSd3 = useMemo(() => makePath('sd3'), [visibleDataset, viewBounds, width, height]);

  // Polygon Shaded Risk Bands
  const samZonePolygon = useMemo(() => {
    if (visibleDataset.length < 2) return '';
    const points = visibleDataset.map((d) => `${scaleX(d.x)},${scaleY(d.sd3neg)}`);
    const lastX = scaleX(visibleDataset[visibleDataset.length - 1].x);
    const firstX = scaleX(visibleDataset[0].x);
    const bottomY = height - padBottom;
    return `M ${firstX},${bottomY} L ${points.join(' L ')} L ${lastX},${bottomY} Z`;
  }, [visibleDataset, viewBounds, width, height]);

  const mamZonePolygon = useMemo(() => {
    if (visibleDataset.length < 2) return '';
    const topPoints = visibleDataset.map((d) => `${scaleX(d.x)},${scaleY(d.sd2neg)}`);
    const bottomPoints = [...visibleDataset]
      .reverse()
      .map((d) => `${scaleX(d.x)},${scaleY(d.sd3neg)}`);
    return `M ${topPoints[0]} L ${topPoints.join(' L ')} L ${bottomPoints.join(' L ')} Z`;
  }, [visibleDataset, viewBounds, width, height]);

  // Current Patient Coordinates
  const currentPtX = scaleX(chartConfig.currentX);
  const currentPtY = scaleY(chartConfig.currentY);
  const currentZ = computeZScore(chartConfig.currentX, chartConfig.currentY);
  const currentTh = interpolateWHOPoint(chartConfig.currentX, activeDataset);

  // Recovery target calculations
  const kgBelowSd3 = Number((currentWeightKg - currentTh.sd3neg).toFixed(2));
  const targetWeightDischarge = currentTh.sd2neg;
  const weightGainNeededKg = Number((targetWeightDischarge - currentWeightKg).toFixed(2));

  // Determine if patient coordinate is inside visible viewport
  const isPatientInView =
    chartConfig.currentX >= viewBounds.minX &&
    chartConfig.currentX <= viewBounds.maxX &&
    chartConfig.currentY >= viewBounds.minY &&
    chartConfig.currentY <= viewBounds.maxY;

  // WHO thresholds at rightmost edge for end-of-curve labels
  const thAtRight = useMemo(() => {
    return interpolateWHOPoint(viewBounds.maxX, activeDataset);
  }, [viewBounds.maxX, activeDataset]);

  // Drag and Wheel Event Handlers
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const normX = (clickX / rect.width) * width;
    const normY = (clickY / rect.height) * height;
    const cursorX = invertX(normX);
    const cursorY = invertY(normY);

    if (e.deltaY < 0) {
      zoomIn(cursorX, cursorY);
    } else {
      zoomOut();
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startBounds: { ...viewBounds },
    };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDraggingRef.current || !dragStartRef.current || !svgRef.current) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasDraggedRef.current = true;
    }

    const plotWidthPx = width - padLeft - padRight;
    const plotHeightPx = height - padTop - padBottom;
    const spanX = dragStartRef.current.startBounds.maxX - dragStartRef.current.startBounds.minX;
    const spanY = dragStartRef.current.startBounds.maxY - dragStartRef.current.startBounds.minY;

    const dataDx = (dx / plotWidthPx) * spanX;
    const dataDy = (dy / plotHeightPx) * spanY;

    let newMinX = dragStartRef.current.startBounds.minX - dataDx;
    let newMaxX = dragStartRef.current.startBounds.maxX - dataDx;
    let newMinY = dragStartRef.current.startBounds.minY + dataDy;
    let newMaxY = dragStartRef.current.startBounds.maxY + dataDy;

    if (newMinX < baseBounds.minX) {
      newMaxX += baseBounds.minX - newMinX;
      newMinX = baseBounds.minX;
    }
    if (newMaxX > baseBounds.maxX) {
      newMinX = Math.max(baseBounds.minX, newMinX - (newMaxX - baseBounds.maxX));
      newMaxX = baseBounds.maxX;
    }
    if (newMinY < baseBounds.minY) {
      newMaxY += baseBounds.minY - newMinY;
      newMinY = baseBounds.minY;
    }
    if (newMaxY > baseBounds.maxY) {
      newMinY = Math.max(baseBounds.minY, newMinY - (newMaxY - baseBounds.maxY));
      newMaxY = baseBounds.maxY;
    }

    setViewBounds({
      minX: Number(newMinX.toFixed(1)),
      maxX: Number(newMaxX.toFixed(1)),
      minY: Number(newMinY.toFixed(1)),
      maxY: Number(newMaxY.toFixed(1)),
    });
    setZoomPreset('custom');
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      isDraggingRef.current = true;
      hasDraggedRef.current = false;
      touchStartRef.current = {
        clientX: t.clientX,
        clientY: t.clientY,
        startBounds: { ...viewBounds },
      };
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStartRef.current = {
        clientX: (t1.clientX + t2.clientX) / 2,
        clientY: (t1.clientY + t2.clientY) / 2,
        startBounds: { ...viewBounds },
        dist,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!touchStartRef.current || !svgRef.current) return;

    if (e.touches.length === 1 && isDraggingRef.current) {
      const t = e.touches[0];
      const dx = t.clientX - touchStartRef.current.clientX;
      const dy = t.clientY - touchStartRef.current.clientY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasDraggedRef.current = true;
      }
      const plotWidthPx = width - padLeft - padRight;
      const plotHeightPx = height - padTop - padBottom;
      const spanX = touchStartRef.current.startBounds.maxX - touchStartRef.current.startBounds.minX;
      const spanY = touchStartRef.current.startBounds.maxY - touchStartRef.current.startBounds.minY;

      const dataDx = (dx / plotWidthPx) * spanX;
      const dataDy = (dy / plotHeightPx) * spanY;

      let newMinX = Math.max(baseBounds.minX, touchStartRef.current.startBounds.minX - dataDx);
      let newMaxX = Math.min(baseBounds.maxX, touchStartRef.current.startBounds.maxX - dataDx);
      let newMinY = Math.max(baseBounds.minY, touchStartRef.current.startBounds.minY + dataDy);
      let newMaxY = Math.min(baseBounds.maxY, touchStartRef.current.startBounds.maxY + dataDy);

      setViewBounds({
        minX: Number(newMinX.toFixed(1)),
        maxX: Number(newMaxX.toFixed(1)),
        minY: Number(newMinY.toFixed(1)),
        maxY: Number(newMaxY.toFixed(1)),
      });
      setZoomPreset('custom');
    } else if (e.touches.length === 2 && touchStartRef.current.dist) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scaleFactor = touchStartRef.current.dist / currentDist;

      const spanX = (touchStartRef.current.startBounds.maxX - touchStartRef.current.startBounds.minX) * scaleFactor;
      const spanY = (touchStartRef.current.startBounds.maxY - touchStartRef.current.startBounds.minY) * scaleFactor;

      const centerX = (touchStartRef.current.startBounds.minX + touchStartRef.current.startBounds.maxX) / 2;
      const centerY = (touchStartRef.current.startBounds.minY + touchStartRef.current.startBounds.maxY) / 2;

      const newMinX = Math.max(baseBounds.minX, centerX - spanX / 2);
      const newMaxX = Math.min(baseBounds.maxX, centerX + spanX / 2);
      const newMinY = Math.max(baseBounds.minY, centerY - spanY / 2);
      const newMaxY = Math.min(baseBounds.maxY, centerY + spanY / 2);

      if (newMaxX - newMinX >= 8 && newMaxY - newMinY >= 2) {
        setViewBounds({
          minX: Number(newMinX.toFixed(1)),
          maxX: Number(newMaxX.toFixed(1)),
          minY: Number(newMinY.toFixed(1)),
          maxY: Number(newMaxY.toFixed(1)),
        });
        setZoomPreset('custom');
      }
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    touchStartRef.current = null;
  };

  // Click handler for plotting or inspection
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
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
  }, [patientPoints, viewBounds, width, height]);

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
                className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                  currentZ < -3
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : currentZ < -2
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
                style={{ backgroundColor: '#b30772' }}
                className={`px-3 py-1.5 rounded-md transition-all text-white font-bold shadow-xs ${
                  activeSex === 'Girl'
                    ? 'ring-2 ring-pink-300'
                    : 'opacity-85 hover:opacity-100'
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

        {/* Second Line: Chart Type Switcher & Zoom Controls Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200">
          {/* Chart Type Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
            <span className="text-slate-400 font-bold mr-1 uppercase text-[10px] tracking-wider">
              Chart:
            </span>
            <button
              type="button"
              onClick={() => handleChartTypeChange('WFL')}
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
              onClick={() => handleChartTypeChange('WFA')}
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
              onClick={() => handleChartTypeChange('LFA')}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                chartType === 'LFA'
                  ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Length-for-Age (0-60 mo)
            </button>
          </div>

          {/* Complete Clinical Zoom Controls Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-bold mr-1 uppercase text-[10px] tracking-wider flex items-center gap-1">
              <ZoomIn className="w-3.5 h-3.5 text-blue-600" /> Zoom:
            </span>

            {/* In / Out / Center / Reset Button Group */}
            <div className="flex items-center bg-white border border-slate-300 rounded-lg shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={() => zoomIn()}
                className="px-2.5 py-1 text-slate-700 hover:text-blue-700 hover:bg-slate-100 transition-colors border-r border-slate-200 min-h-[32px] flex items-center justify-center font-bold"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-3.5 h-3.5 mr-0.5" />
                <span>+</span>
              </button>
              <button
                type="button"
                onClick={zoomOut}
                className="px-2.5 py-1 text-slate-700 hover:text-blue-700 hover:bg-slate-100 transition-colors border-r border-slate-200 min-h-[32px] flex items-center justify-center font-bold"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-3.5 h-3.5 mr-0.5" />
                <span>-</span>
              </button>
              <button
                type="button"
                onClick={focusPatient}
                className="px-2.5 py-1 text-slate-700 hover:text-blue-700 hover:bg-slate-100 transition-colors border-r border-slate-200 min-h-[32px] flex items-center gap-1 font-semibold text-xs"
                title="Center on Patient Coordinates"
              >
                <Crosshair className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Center Child</span>
              </button>
              <button
                type="button"
                onClick={resetZoom}
                className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors min-h-[32px] flex items-center gap-1 font-bold text-[11px]"
                title="Reset Zoom (100% Full View)"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>{currentZoomPercent}%</span>
              </button>
            </div>

            {/* Quick Stage Presets */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={resetZoom}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  zoomPreset === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Full
              </button>
              <button
                type="button"
                onClick={applyInfantPreset}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  zoomPreset === 'infant'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {chartType === 'WFL' ? 'Infants (45-75cm)' : '0-24 Mo'}
              </button>
              <button
                type="button"
                onClick={applyOlderPreset}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  zoomPreset === 'older'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {chartType === 'WFL' ? 'Older (70-110cm)' : '24-60 Mo'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. High-Visibility Clinical Banner (Direct Readout for Quick Reference) */}
      <div className="p-4 bg-white border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-slate-600 font-semibold uppercase text-[10px] tracking-wider">Active Patient Point</div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">
            {cotNumber}: {patientName}
          </div>
          <div className="text-xs font-medium text-slate-600 mt-1">
            {chartConfig.xLabel.split(' ')[0]}: <span className="font-bold text-slate-900">{chartConfig.currentX} {chartConfig.xUnit}</span> &middot;{' '}
            {chartConfig.yLabel.split(' ')[0]}: <span className="font-bold text-slate-900">{chartConfig.currentY} {chartConfig.yUnit}</span>
          </div>
        </div>

        <div
          className={`p-3.5 rounded-xl border ${
            currentZ < -3
              ? 'bg-red-50 border-red-200 text-red-950'
              : currentZ < -2
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="font-semibold uppercase text-[10px] tracking-wider opacity-80">WHO Z-Score Status</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">
            {currentZ > 0 ? `+${currentZ}` : currentZ} <span className="text-sm font-medium text-slate-600">SD</span>
          </div>
          <div className="font-semibold text-xs mt-0.5">
            {currentZ < -3
              ? 'Severe Acute Malnutrition (WHZ < -3)'
              : currentZ < -2
              ? 'Moderate Acute Malnutrition (WHZ -3 to -2)'
              : 'Normal Range (WHZ >= -2)'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950">
          <div className="text-blue-700 font-semibold uppercase text-[10px] tracking-wider">Distance to -3 SD SAM Cutoff</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">
            {kgBelowSd3 < 0 ? `${kgBelowSd3} kg` : `+${kgBelowSd3} kg`}
          </div>
          <div className="text-xs text-blue-900 font-medium mt-0.5">
            -3 SD cutoff at {currentHeightCm} cm is <strong className="text-slate-900">{currentTh.sd3neg.toFixed(1)} kg</strong>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950">
          <div className="text-emerald-700 font-semibold uppercase text-[10px] tracking-wider">Target Discharge Weight (-2 SD)</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">
            {targetWeightDischarge.toFixed(1)} <span className="text-sm font-medium text-slate-600">kg</span>
          </div>
          <div className="text-xs text-emerald-900 font-medium mt-0.5">
            {weightGainNeededKg > 0 ? `+${weightGainNeededKg} kg gain needed for recovery` : 'At or above target'}
          </div>
        </div>
      </div>

      {/* 3. Interactive Clinical Graph Canvas (Medical Paper Aesthetic with Zoom & Pan) */}
      <div className="p-3 sm:p-5 bg-slate-900 select-none relative overflow-x-auto">
        {/* Floating Patient Locator if off-screen during zoom */}
        {!isPatientInView && isZoomed && (
          <div className="absolute top-5 right-5 z-10 animate-fade-in">
            <button
              type="button"
              onClick={focusPatient}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-lg border border-blue-400 transition-all cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Child Outside View ({chartConfig.currentX} {chartConfig.xUnit}) &middot; Center View</span>
            </button>
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[720px] sm:min-w-0 select-none"
          style={{
            minHeight: isExpanded ? '520px' : '400px',
            cursor: isZoomed ? 'grab' : 'crosshair',
          }}
          onClick={handleSvgClick}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Defs for gradients, patterns & clipPath */}
          <defs>
            <linearGradient id="samGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="mamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.08" />
            </linearGradient>
            <clipPath id="chartPlotArea">
              <rect
                x={padLeft}
                y={padTop}
                width={width - padLeft - padRight}
                height={height - padTop - padBottom}
              />
            </clipPath>
          </defs>

          {/* Background medical paper */}
          <rect x={0} y={0} width={width} height={height} fill="#0f172a" rx={8} />

          {/* Grid lines: X-Axis Ticks */}
          {xTicks.map((x) => (
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
                fontFamily="system-ui, -apple-system, sans-serif"
                textAnchor="middle"
                fontWeight="600"
              >
                {x}
                {chartConfig.xUnit}
              </text>
            </g>
          ))}

          {/* Grid lines: Y-Axis Ticks */}
          {yTicks.map((y) => (
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
                fontFamily="system-ui, -apple-system, sans-serif"
                textAnchor="end"
                fontWeight="600"
              >
                {y}
                {chartConfig.yUnit}
              </text>
            </g>
          ))}

          {/* CLIPPED PLOT CONTENT (Curves, Zones, Trajectory, Markers) */}
          <g clipPath="url(#chartPlotArea)">
            {/* Shaded Risk Zones */}
            {samZonePolygon && <path d={samZonePolygon} fill="url(#samGradient)" />}
            {mamZonePolygon && <path d={mamZonePolygon} fill="url(#mamGradient)" />}

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
            {patientPoints.map((pt) => {
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
                    fontFamily="system-ui, -apple-system, sans-serif"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {pt.dayLabel}
                  </text>
                </g>
              );
            })}

            {/* CURRENT PATIENT POSITION MARKER (Clean static marker) */}
            <g>
              <circle
                cx={currentPtX}
                cy={currentPtY}
                r={8}
                fill={activeSex === 'Girl' ? '#b30772' : '#3b82f6'}
                stroke="#ffffff"
                strokeWidth={2.5}
              />
              {/* Crosshair guidelines to axes */}
              <line
                x1={padLeft}
                x2={currentPtX}
                y1={currentPtY}
                y2={currentPtY}
                stroke={activeSex === 'Girl' ? '#b30772' : '#3b82f6'}
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              <line
                x1={currentPtX}
                x2={currentPtX}
                y1={currentPtY}
                y2={height - padBottom}
                stroke={activeSex === 'Girl' ? '#b30772' : '#3b82f6'}
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              {/* Coordinate Label */}
              <rect
                x={currentPtX - 42}
                y={currentPtY - 30}
                width={84}
                height={22}
                rx={5}
                fill="#0f172a"
                stroke={activeSex === 'Girl' ? '#b30772' : '#3b82f6'}
                strokeWidth={1.8}
              />
              <text
                x={currentPtX}
                y={currentPtY - 16}
                fill="#ffffff"
                fontSize={11}
                fontFamily="system-ui, -apple-system, sans-serif"
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
          </g>

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

          {/* End-of-Curve Line Labels at Right Axis */}
          {thAtRight && (
            <>
              {thAtRight.sd3neg >= viewBounds.minY && thAtRight.sd3neg <= viewBounds.maxY && (
                <text
                  x={width - padRight + 6}
                  y={scaleY(thAtRight.sd3neg) + 4}
                  fill="#ef4444"
                  fontSize={11}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight="bold"
                >
                  -3 SD (SAM)
                </text>
              )}
              {thAtRight.sd2neg >= viewBounds.minY && thAtRight.sd2neg <= viewBounds.maxY && (
                <text
                  x={width - padRight + 6}
                  y={scaleY(thAtRight.sd2neg) + 4}
                  fill="#f59e0b"
                  fontSize={11}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight="bold"
                >
                  -2 SD (MAM)
                </text>
              )}
              {thAtRight.median >= viewBounds.minY && thAtRight.median <= viewBounds.maxY && (
                <text
                  x={width - padRight + 6}
                  y={scaleY(thAtRight.median) + 4}
                  fill="#10b981"
                  fontSize={11}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight="bold"
                >
                  Median
                </text>
              )}
              {thAtRight.sd2 >= viewBounds.minY && thAtRight.sd2 <= viewBounds.maxY && (
                <text
                  x={width - padRight + 6}
                  y={scaleY(thAtRight.sd2) + 4}
                  fill="#60a5fa"
                  fontSize={11}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight="bold"
                >
                  +2 SD
                </text>
              )}
            </>
          )}
        </svg>

        {/* Interaction hint bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 pt-2 px-1 gap-1">
          <span>Scroll mouse wheel or pinch to zoom &middot; Click &amp; drag to pan &middot; Tap to inspect coordinates</span>
          <span className="font-semibold text-slate-300">Scale: {currentZoomPercent}%</span>
        </div>
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
              <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-sky-200">
                {inspectedPoint.xVal} {chartConfig.xUnit} &middot; {inspectedPoint.yVal}{' '}
                {chartConfig.yUnit}
              </span>
              <span
                className={`font-bold px-2.5 py-1 rounded-md text-xs ${
                  inspectedPoint.zScore < -3
                    ? 'bg-red-600 text-white'
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
              <strong className="text-slate-900">{inspectedPoint.thresholds.sd3neg.toFixed(1)} kg</strong> &middot; -2 SD
              Discharge Target is{' '}
              <strong className="text-slate-900">{inspectedPoint.thresholds.sd2neg.toFixed(1)} kg</strong>.
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {chartType === 'WFL' && onSelectPoint && (
              <button
                type="button"
                onClick={handleApplyInspectedToPatient}
                className="min-h-[44px] px-3.5 py-2 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-800 transition-colors shadow-xs"
              >
                Apply to Patient Calculator
              </button>
            )}
            <button
              type="button"
              onClick={() => setInspectedPoint(null)}
              className="min-h-[44px] px-3.5 py-2 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-xl bg-white font-semibold"
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
            className="flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Inpatient Weight</span>
          </button>
        </div>

        {/* Add Serial Weight Form */}
        {showAddPointForm && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-xs">Ward Stay Label</label>
              <input
                type="text"
                value={newDayLabel}
                onChange={(e) => setNewDayLabel(e.target.value)}
                placeholder="e.g. Day 3"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-base text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-xs">Weight (kg)</label>
              <ClinicalNumberInput
                value={newYVal}
                onChange={(val) => setNewYVal(val)}
                min={1.0}
                max={30.0}
                step={0.1}
                unit="kg"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-xs">
                {chartConfig.xLabel.split(' ')[0]} ({chartConfig.xUnit})
              </label>
              <ClinicalNumberInput
                value={newXVal}
                onChange={(val) => setNewXVal(val)}
                min={0}
                max={120.0}
                step={0.5}
                unit={chartConfig.xUnit}
                className="w-full"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handleAddPatientPoint}
                className="flex-1 min-h-[48px] py-2.5 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-800 transition-colors shadow-xs"
              >
                Plot Point
              </button>
              <button
                type="button"
                onClick={() => setShowAddPointForm(false)}
                className="min-h-[48px] py-2.5 px-4 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold"
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
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl border border-slate-200 text-xs"
            >
              <span className="font-bold text-slate-900">{pt.dayLabel}:</span>
              <span className="text-slate-900 font-bold">{pt.yValue} kg</span>
              <span className="text-slate-500">({pt.xValue} cm)</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  pt.zScore < -3
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : pt.zScore < -2
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {pt.zScore} SD
              </span>
              {patientPoints.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePatientPoint(pt.id)}
                  className="text-slate-400 hover:text-red-600 p-1 rounded-md"
                  title="Remove point"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
