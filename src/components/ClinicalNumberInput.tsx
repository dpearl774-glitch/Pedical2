import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';

interface ClinicalNumberInputProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  isInteger?: boolean;
  className?: string;
  unit?: string;
  placeholder?: string;
  id?: string;
  autoSelectOnFocus?: boolean;
  showClearButton?: boolean;
  ariaLabel?: string;
}

/**
 * ClinicalNumberInput
 * Ergonomic, mobile-friendly numeric input designed for healthcare workers:
 * - Automatically selects all text on focus so typing immediately replaces the old value
 * - Allows full deletion/backspace to empty string without snapping back prematurely
 * - Allows typing '0' or clearing completely without aggressive fallback loops
 * - Displays a quick-clear (X) button when focused
 * - Smart unit detection: automatically catches MUAC entered in cm (e.g. 11.5 cm) and offers instant conversion to 115 mm
 * - Only validates and clamps on blur, while propagating live valid numbers as you type
 */
export const ClinicalNumberInput: React.FC<ClinicalNumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  step,
  isInteger = false,
  className = '',
  unit,
  placeholder,
  id,
  autoSelectOnFocus = true,
  showClearButton = true,
  ariaLabel,
}) => {
  const [text, setText] = useState<string>(
    value !== undefined && value !== null && !isNaN(value) ? String(value) : ''
  );
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external changes (e.g. from presets, steppers, or resets) when not actively editing
  useEffect(() => {
    if (!isFocused) {
      const formatted = value !== undefined && value !== null && !isNaN(value) ? String(value) : '';
      setText(formatted);
    }
  }, [value, isFocused]);

  // Detect if user typed MUAC in cm (e.g. 11.5 in a field with mm unit)
  const isMmUnit = unit === 'mm';
  const numericVal = parseFloat(text);
  const isLikelyCmInMmField =
    isMmUnit &&
    !isNaN(numericVal) &&
    numericVal >= 5.0 &&
    numericVal <= 26.0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow user to completely clear the field to empty string
    if (raw === '') {
      setText('');
      return;
    }

    // Allow partial typing like "0", "0.", "." or leading minus
    if (raw === '.' || raw === '0.' || raw === '-' || raw.endsWith('.')) {
      setText(raw);
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
      return;
    }

    const parsed = isInteger ? parseInt(raw, 10) : parseFloat(raw);
    if (!isNaN(parsed)) {
      setText(raw);
      onChange(parsed);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (autoSelectOnFocus) {
      setTimeout(() => {
        e.target.select();
      }, 20);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);

    // If left completely blank on blur, assign safe fallback
    if (text === '' || isNaN(parseFloat(text))) {
      const fallback = min !== undefined ? min : 0;
      setText(String(fallback));
      onChange(fallback);
      return;
    }

    let parsed = isInteger ? parseInt(text, 10) : parseFloat(text);

    // Smart Auto-Correction: If in mm field and entered 5.0 to 26.0 (e.g. 11.5 cm)
    if (isMmUnit && parsed >= 5.0 && parsed <= 26.0) {
      parsed = Math.round(parsed * 10);
    }

    let clamped = parsed;
    if (min !== undefined && clamped < min) {
      clamped = min;
    }
    if (max !== undefined && clamped > max) {
      clamped = max;
    }

    // Format cleanly
    const finalStr = isInteger ? String(clamped) : String(Number(clamped.toFixed(2)));
    setText(finalStr);
    onChange(clamped);
  };

  const handleConvertCmToMm = () => {
    if (!isNaN(numericVal)) {
      const converted = Math.round(numericVal * 10);
      setText(String(converted));
      onChange(converted);
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    setText('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center w-full">
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode={isInteger ? 'numeric' : 'decimal'}
          value={text}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className={`${className} ${unit ? 'pr-9' : ''}`}
        />

        {/* Clear (X) button when focused and not empty */}
        {showClearButton && isFocused && text !== '' && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleClear();
            }}
            className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Clear field to type new value"
            aria-label="Clear value"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Unit label (e.g. kg, cm, mm, mo) */}
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none select-none">
            {unit}
          </span>
        )}
      </div>

      {/* Smart MUAC Helper Chip for Centimeters vs Millimeters */}
      {isLikelyCmInMmField && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleConvertCmToMm();
          }}
          className="mt-1 w-full text-left flex items-center justify-between gap-1 px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
          title={`Click to convert ${numericVal} cm to ${Math.round(numericVal * 10)} mm`}
        >
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
            <span>Entered in cm? Tap to set <strong>{Math.round(numericVal * 10)} mm</strong></span>
          </span>
          <span className="font-bold underline text-amber-800">Convert</span>
        </button>
      )}
    </div>
  );
};
