import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Lock,
  ShieldAlert,
  KeyRound,
  Trash2,
  Delete,
  AlertTriangle,
  Hospital,
  Check,
  X,
  ShieldCheck,
  ArrowRight,
  Copy,
} from 'lucide-react';
import {
  loadSecurityVault,
  unwrapMasterKeyWithPin,
  unwrapMasterKeyWithRecoveryKey,
  updateVaultPin,
  setActiveMasterKey,
  isValidRecoveryKeyFormat,
  normalizeRecoveryKey,
} from '../utils/cryptoStorage';

interface PinLockScreenProps {
  facilityName: string;
  clinicianRole: string;
  correctPin: string;
  recoveryKey: string;
  onUnlock: () => void;
  onEmergencyWipe: () => void;
  onPinReset?: (newPin: string) => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  facilityName,
  clinicianRole,
  correctPin,
  recoveryKey,
  onUnlock,
  onEmergencyWipe,
  onPinReset,
}) => {
  const [pin, setPin] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [shake, setShake] = useState<boolean>(false);

  // Recovery modal state
  const [showRecoveryModal, setShowRecoveryModal] = useState<boolean>(false);
  const [recoveryInput, setRecoveryInput] = useState<string>('');
  const [recoveryError, setRecoveryError] = useState<string>('');
  const [recoveryStep, setRecoveryStep] = useState<'input_key' | 'set_new_pin'>('input_key');
  const [unwrappedMasterKey, setUnwrappedMasterKey] = useState<CryptoKey | null>(null);
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [newPinConfirm, setNewPinConfirm] = useState<string>('');
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  // Emergency wipe state
  const [showWipeConfirmModal, setShowWipeConfirmModal] = useState<boolean>(false);
  const [wipeInput, setWipeInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const timerRef = useRef<number | null>(null);
  const targetPinLength = correctPin?.length ? Math.max(4, Math.min(6, correctPin.length)) : 4;

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

  // Cryptographic or plaintext PIN verification
  const verifyPin = useCallback(
    async (candidatePin: string) => {
      if (isVerifying || lockoutRemaining > 0) return;
      setIsVerifying(true);
      setErrorMessage('');

      const vault = loadSecurityVault();
      if (vault) {
        try {
          const masterKey = await unwrapMasterKeyWithPin(candidatePin, vault);
          setActiveMasterKey(masterKey);
          setFailedAttempts(0);
          setIsVerifying(false);
          onUnlock();
          return;
        } catch {
          // Fall through to error handler
        }
      } else if (candidatePin === correctPin) {
        setFailedAttempts(0);
        setIsVerifying(false);
        onUnlock();
        return;
      }

      // PIN failed
      setIsVerifying(false);
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
      }, 350);
    },
    [isVerifying, lockoutRemaining, correctPin, failedAttempts, onUnlock]
  );

  // Handle PIN entry evaluation
  const handleDigit = useCallback(
    (digit: string) => {
      if (lockoutRemaining > 0 || isVerifying) return;
      if (pin.length >= 6) return;

      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMessage('');

      // Auto-submit when candidate matches target length
      if (nextPin.length === targetPinLength) {
        verifyPin(nextPin);
      }
    },
    [pin, lockoutRemaining, isVerifying, targetPinLength, verifyPin]
  );

  const handleDelete = useCallback(() => {
    if (lockoutRemaining > 0 || isVerifying) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
  }, [lockoutRemaining, isVerifying]);

  const handleClear = useCallback(() => {
    if (lockoutRemaining > 0 || isVerifying) return;
    setPin('');
    setErrorMessage('');
  }, [lockoutRemaining, isVerifying]);

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      } else if (e.key === 'Enter' && pin.length >= 4) {
        e.preventDefault();
        verifyPin(pin);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete, handleClear, pin, verifyPin, showRecoveryModal, showWipeConfirmModal]);

  // Clinician Recovery Secret Submit: Unwraps Master Key
  const handleVerifyRecovery = async () => {
    setRecoveryError('');
    const cleanInput = recoveryInput.trim();

    if (!cleanInput) {
      setRecoveryError('Please enter your 32-character Emergency Recovery Code.');
      return;
    }

    const vault = loadSecurityVault();
    if (vault) {
      try {
        const masterKey = await unwrapMasterKeyWithRecoveryKey(cleanInput, vault);
        setUnwrappedMasterKey(masterKey);
        setRecoveryStep('set_new_pin');
      } catch (err: any) {
        setRecoveryError(err.message || 'Invalid recovery code. Please check and try again.');
      }
    } else {
      // Legacy fallback
      if (recoveryKey && cleanInput.toLowerCase() === recoveryKey.trim().toLowerCase()) {
        setShowRecoveryModal(false);
        setFailedAttempts(0);
        setLockoutRemaining(0);
        onUnlock();
      } else {
        setRecoveryError('Incorrect recovery code. Please try again.');
      }
    }
  };

  // Submit New PIN after successful Recovery Key unwrap
  const handleSaveNewPinFromRecovery = async () => {
    if (!newPinInput || newPinInput.length < 4 || newPinInput.length > 6) {
      setRecoveryError('New PIN must be between 4 and 6 digits.');
      return;
    }
    if (newPinInput !== newPinConfirm) {
      setRecoveryError('PIN confirmation does not match.');
      return;
    }

    if (!unwrappedMasterKey) {
      setRecoveryError('Session expired. Please re-enter Recovery Key.');
      setRecoveryStep('input_key');
      return;
    }

    try {
      await updateVaultPin(newPinInput, unwrappedMasterKey);
      setActiveMasterKey(unwrappedMasterKey);
      onPinReset?.(newPinInput);
      setResetSuccess(true);

      setTimeout(() => {
        setShowRecoveryModal(false);
        setFailedAttempts(0);
        setLockoutRemaining(0);
        onUnlock();
      }, 800);
    } catch (err: any) {
      setRecoveryError(err.message || 'Failed to update PIN in security vault.');
    }
  };

  // Emergency Factory Wipe Submit
  const handleConfirmWipe = () => {
    if (wipeInput.trim() === 'WIPE') {
      onEmergencyWipe();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-xl flex flex-col items-center justify-center p-4 select-none safe-bottom">
      <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center space-y-6 animate-in fade-in zoom-in-95 duration-200 card-depth">
        {/* App Branding & Bedside Identity */}
        <div className="text-center space-y-1">
          <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400 shadow-sm">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-base font-black text-white lowercase tracking-tight">
            pedical lock
          </h1>
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1 max-w-xs truncate">
            <Hospital className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{facilityName || 'Pediatric SAM / CMAM Unit'}</span>
          </div>
        </div>

        {/* Dynamic PIN Indicators */}
        <div className="space-y-2 text-center w-full">
          <div
            className={`flex items-center justify-center gap-3 py-2 ${
              shake ? 'animate-shake' : ''
            }`}
          >
            {Array.from({ length: targetPinLength }).map((_, idx) => {
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
          ) : isVerifying ? (
            <div className="text-xs text-blue-400 font-medium animate-pulse">
              Unlocking...
            </div>
          ) : (
            <div className="text-xs text-slate-400 font-medium">
              Enter {targetPinLength}-digit PIN
            </div>
          )}
        </div>

        {/* Large Touch-Target Numeric Keypad */}
        <div className="w-full grid grid-cols-3 gap-2.5 sm:gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={lockoutRemaining > 0 || isVerifying}
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
            disabled={lockoutRemaining > 0 || pin.length === 0 || isVerifying}
            onClick={handleClear}
            className="h-14 sm:h-16 rounded-2xl bg-slate-800/50 hover:bg-slate-700/60 text-slate-400 hover:text-white font-semibold text-xs uppercase tracking-wider border border-slate-800 transition-all flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none active:scale-95"
            title="Clear all entered digits"
          >
            Clear
          </button>

          {/* Zero digit */}
          <button
            type="button"
            disabled={lockoutRemaining > 0 || isVerifying}
            onClick={() => handleDigit('0')}
            className="h-14 sm:h-16 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 active:bg-blue-600 text-white font-bold text-xl sm:text-2xl border border-slate-700/60 transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none active:scale-95 shadow-sm"
            aria-label="Digit 0"
          >
            0
          </button>

          {/* Delete backspace button */}
          <button
            type="button"
            disabled={lockoutRemaining > 0 || pin.length === 0 || isVerifying}
            onClick={handleDelete}
            className="h-14 sm:h-16 rounded-2xl bg-slate-800/50 hover:bg-slate-700/60 text-slate-400 hover:text-white border border-slate-800 transition-all flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none active:scale-95"
            title="Delete previous digit"
            aria-label="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* If pin is >= 4 and not yet submitted, offer direct unlock button */}
        {pin.length >= 4 && pin.length !== targetPinLength && (
          <button
            type="button"
            onClick={() => verifyPin(pin)}
            disabled={isVerifying}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
          >
            <Check className="w-4 h-4" />
            <span>Unlock ({pin.length} digits)</span>
          </button>
        )}

        {/* Security Recovery Options */}
        <div className="w-full pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              setRecoveryInput('');
              setRecoveryError('');
              setRecoveryStep('input_key');
              setNewPinInput('');
              setNewPinConfirm('');
              setResetSuccess(false);
              setShowRecoveryModal(true);
            }}
            className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 min-h-[44px] py-2"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Forgot PIN? Use Recovery Code</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setWipeInput('');
              setShowWipeConfirmModal(true);
            }}
            className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 min-h-[44px] py-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset App</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: Emergency Recovery Code Prompt & PIN Reset */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-100 card-depth">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {recoveryStep === 'input_key' ? 'Account Recovery' : 'Choose New PIN'}
                  </h3>
                  <div className="text-[10px] text-slate-400">
                    {recoveryStep === 'input_key' ? 'Step 1 of 2: Enter Recovery Code' : 'Step 2 of 2: Set 4-6 Digit PIN'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRecoveryModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {recoveryStep === 'input_key' ? (
              <div className="space-y-3.5">
                <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-800/60 text-blue-200 text-xs leading-relaxed">
                  Enter your 32-character <strong>Emergency Recovery Code</strong>. This will verify your authorization and allow you to set a new PIN.
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold text-xs mb-1.5">
                    Emergency Recovery Code:
                  </label>
                  <input
                    type="text"
                    value={recoveryInput}
                    onChange={(e) => setRecoveryInput(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm tracking-wider focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[48px] uppercase"
                    autoFocus
                  />
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>Hyphens and spaces are automatically filtered.</span>
                    <span className="font-mono">
                      {normalizeRecoveryKey(recoveryInput).length}/32 chars
                    </span>
                  </div>
                  {recoveryError && (
                    <div className="text-xs text-rose-400 mt-2 font-medium bg-rose-950/40 p-2 rounded-lg border border-rose-900/60">
                      {recoveryError}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(false)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyRecovery}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold min-h-[44px] flex items-center gap-1.5 shadow-md"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Code</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 text-xs leading-relaxed flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    Recovery code verified! Enter a new 4 to 6 digit PIN to secure your app.
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-slate-300 font-semibold text-xs mb-1">
                      New 4-6 Digit PIN:
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 5678"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-base tracking-widest min-h-[44px]"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold text-xs mb-1">
                      Confirm New PIN:
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={newPinConfirm}
                      onChange={(e) => setNewPinConfirm(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Repeat new PIN"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-base tracking-widest min-h-[44px]"
                    />
                  </div>

                  {recoveryError && (
                    <div className="text-xs text-rose-400 mt-2 font-medium bg-rose-950/40 p-2 rounded-lg border border-rose-900/60">
                      {recoveryError}
                    </div>
                  )}

                  {resetSuccess && (
                    <div className="text-xs text-emerald-400 font-bold bg-emerald-950/60 p-2 rounded-lg border border-emerald-900/60 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>PIN successfully updated! Unlocking ward...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={resetSuccess}
                    onClick={() => setRecoveryStep('input_key')}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold min-h-[44px]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={resetSuccess || newPinInput.length < 4}
                    onClick={handleSaveNewPinFromRecovery}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold min-h-[44px] flex items-center gap-1.5 shadow-md disabled:opacity-40"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save New PIN &amp; Unlock</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Emergency Security Wipe Prompt (Requires typing WIPE) */}
      {showWipeConfirmModal && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-600 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-slate-100 card-depth">
            <div className="flex items-center justify-between pb-2 border-b border-rose-900/60">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-sm text-white">Reset App &amp; Erase Data</h3>
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
                Clear Ward Records
              </div>
              <p>
                This action will erase all patient records, feeding plans, and reminders from this device. Use this if transferring this device to another ward.
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
