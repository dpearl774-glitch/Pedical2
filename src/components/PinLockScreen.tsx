import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Lock,
  ShieldAlert,
  KeyRound,
  Trash2,
  Delete,
  RotateCcw,
  AlertTriangle,
  Hospital,
  UserCheck,
  Check,
  X,
} from 'lucide-react';

interface PinLockScreenProps {
  facilityName: string;
  clinicianRole: string;
  correctPin: string;
  recoveryKey: string;
  onUnlock: () => void;
  onEmergencyWipe: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  facilityName,
  clinicianRole,
  correctPin,
  recoveryKey,
  onUnlock,
  onEmergencyWipe,
}) => {
  const [pin, setPin] = useState<string>('');
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [shake, setShake] = useState<boolean>(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState<boolean>(false);
  const [recoveryInput, setRecoveryInput] = useState<string>('');
  const [recoveryError, setRecoveryError] = useState<string>('');
  const [showWipeConfirmModal, setShowWipeConfirmModal] = useState<boolean>(false);
  const [wipeInput, setWipeInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const timerRef = useRef<number | null>(null);

  // Penalty timer countdown
  useEffect(() => {
    if (lockoutRemaining > 0) {
      timerRef.current = window.setInterval(() => {
        setLockoutRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [lockoutRemaining]);

  // Handle PIN entry evaluation
  const handleDigit = useCallback(
    (digit: string) => {
      if (lockoutRemaining > 0) return;
      if (pin.length >= 4) return;

      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMessage('');

      if (nextPin.length === 4) {
        if (nextPin === correctPin) {
          // Success!
          setFailedAttempts(0);
          onUnlock();
        } else {
          // Wrong PIN!
          const newFailed = failedAttempts + 1;
          setFailedAttempts(newFailed);
          setShake(true);
          setTimeout(() => setShake(false), 500);

          if (newFailed >= 5) {
            setLockoutRemaining(30);
            setErrorMessage('Too many failed attempts. Keypad locked for 30 seconds.');
          } else {
            setErrorMessage(`Incorrect PIN. ${5 - newFailed} attempts remaining.`);
          }

          setTimeout(() => {
            setPin('');
          }, 300);
        }
      }
    },
    [pin, correctPin, failedAttempts, lockoutRemaining, onUnlock]
  );

  const handleDelete = useCallback(() => {
    if (lockoutRemaining > 0) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
  }, [lockoutRemaining]);

  const handleClear = useCallback(() => {
    if (lockoutRemaining > 0) return;
    setPin('');
    setErrorMessage('');
  }, [lockoutRemaining]);

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if modals are open
      if (showRecoveryModal || showWipeConfirmModal) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete, handleClear, showRecoveryModal, showWipeConfirmModal]);

  // Clinician Recovery Secret Submit
  const handleVerifyRecovery = () => {
    if (!recoveryKey || !recoveryKey.trim()) {
      setRecoveryError('No Clinician Recovery Secret was previously configured in Settings.');
      return;
    }
    if (recoveryInput.trim().toLowerCase() === recoveryKey.trim().toLowerCase()) {
      // Recovery success!
      setShowRecoveryModal(false);
      setFailedAttempts(0);
      setLockoutRemaining(0);
      onUnlock();
    } else {
      setRecoveryError('Incorrect Recovery Secret. Verification failed.');
    }
  };

  // Emergency Factory Wipe Submit
  const handleConfirmWipe = () => {
    if (wipeInput.trim() === 'WIPE') {
      onEmergencyWipe();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none safe-bottom">
      <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* App Branding & Bedside Identity */}
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-base font-bold text-white lowercase">
            pedical lock
          </h1>
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1 max-w-xs truncate">
            <Hospital className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{facilityName || 'Pediatric Unit'}</span>
          </div>
        </div>

        {/* 4-Digit PIN Indicators with shake animation */}
        <div className="space-y-2 text-center w-full">
          <div
            className={`flex items-center justify-center gap-4 py-2 ${
              shake ? 'animate-shake' : ''
            }`}
          >
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                    isFilled
                      ? 'bg-blue-500 border-blue-400 scale-110 shadow-xs'
                      : 'border-slate-600 bg-slate-800/60'
                  }`}
                />
              );
            })}
          </div>

          {/* Feedback message or Lockout warning */}
          {lockoutRemaining > 0 ? (
            <div className="p-2 rounded-xl bg-red-950/70 border border-red-800/60 text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5 animate-pulse">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>Locked: wait {lockoutRemaining}s</span>
            </div>
          ) : errorMessage ? (
            <div className="text-xs text-rose-400 font-medium">{errorMessage}</div>
          ) : (
            <div className="text-xs text-slate-400">Enter 4-digit pin</div>
          )}
        </div>

        {/* Large Touch-Target Numeric Keypad (>= 48px touch targets) */}
        <div className="w-full grid grid-cols-3 gap-2.5 sm:gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={lockoutRemaining > 0}
              onClick={() => handleDigit(digit)}
              className="h-14 sm:h-16 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 active:bg-blue-600 text-white font-bold text-xl sm:text-2xl border border-slate-700/60 transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none active:scale-95 shadow-sm"
              aria-label={`Digit ${digit}`}
            >
              {digit}
            </button>
          ))}

          {/* Clear button */}
          <button
            type="button"
            disabled={lockoutRemaining > 0 || pin.length === 0}
            onClick={handleClear}
            className="h-14 sm:h-16 rounded-2xl bg-slate-800/50 hover:bg-slate-700/60 text-slate-400 hover:text-white font-semibold text-xs uppercase tracking-wider border border-slate-800 transition-all flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none active:scale-95"
            title="Clear all entered digits"
          >
            Clear
          </button>

          {/* Zero digit */}
          <button
            type="button"
            disabled={lockoutRemaining > 0}
            onClick={() => handleDigit('0')}
            className="h-14 sm:h-16 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 active:bg-blue-600 text-white font-bold text-xl sm:text-2xl border border-slate-700/60 transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none active:scale-95 shadow-sm"
            aria-label="Digit 0"
          >
            0
          </button>

          {/* Delete backspace button */}
          <button
            type="button"
            disabled={lockoutRemaining > 0 || pin.length === 0}
            onClick={handleDelete}
            className="h-14 sm:h-16 rounded-2xl bg-slate-800/50 hover:bg-slate-700/60 text-slate-400 hover:text-white border border-slate-800 transition-all flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none active:scale-95"
            title="Delete previous digit"
            aria-label="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Security Recovery Options (No bypass without credentials or wipe) */}
        <div className="w-full pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          {recoveryKey ? (
            <button
              type="button"
              onClick={() => {
                setRecoveryInput('');
                setRecoveryError('');
                setShowRecoveryModal(true);
              }}
              className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 min-h-[44px] py-2"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Recovery Secret</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-600">Zero-Cloud Protected</span>
          )}

          <button
            type="button"
            onClick={() => {
              setWipeInput('');
              setShowWipeConfirmModal(true);
            }}
            className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 min-h-[44px] py-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Emergency Wipe</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: Clinician Recovery Secret Prompt */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm text-white">Unlock with Recovery Secret</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRecoveryModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Enter your designated Clinician Staff ID, Pediatric License number, or recovery passphrase to unlock this bedside session.
            </p>

            <div>
              <label className="block text-slate-300 font-semibold text-xs mb-1">
                Recovery Secret Passphrase:
              </label>
              <input
                type="password"
                value={recoveryInput}
                onChange={(e) => setRecoveryInput(e.target.value)}
                placeholder="Enter recovery secret..."
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-base focus:ring-2 focus:ring-blue-500 min-h-[48px]"
                autoFocus
              />
              {recoveryError && (
                <div className="text-xs text-rose-400 mt-1.5 font-medium">{recoveryError}</div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRecoveryModal(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyRecovery}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold min-h-[44px] flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Verify &amp; Unlock</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Emergency Security Wipe Prompt (Requires typing WIPE) */}
      {showWipeConfirmModal && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-600 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-rose-900/60">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-sm text-white">Emergency Factory Security Wipe</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWipeConfirmModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs leading-relaxed space-y-1">
              <div className="font-bold text-rose-300 uppercase tracking-wide">
                Permanent Patient Data Purge
              </div>
              <p>
                To guarantee zero unauthorized access to child health records, this action will permanently delete all local patient rosters, SAM/MAM consults, and clinical reminders from this device.
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold text-xs mb-1">
                Type <strong className="text-white font-mono bg-slate-800 px-1 py-0.5 rounded">WIPE</strong> to confirm:
              </label>
              <input
                type="text"
                value={wipeInput}
                onChange={(e) => setWipeInput(e.target.value)}
                placeholder="Type WIPE in all-caps..."
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-base font-mono uppercase tracking-widest focus:ring-2 focus:ring-rose-500 min-h-[48px]"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowWipeConfirmModal(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={wipeInput.trim() !== 'WIPE'}
                onClick={handleConfirmWipe}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold min-h-[44px] flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Security Wipe</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
