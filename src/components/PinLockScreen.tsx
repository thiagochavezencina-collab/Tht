import React, { useState, useEffect } from 'react';
import { Lock, Delete, Shield, Eye, EyeOff } from 'lucide-react';

interface PinLockScreenProps {
  onUnlock: () => void;
}

export const APP_PIN = '6767';
export const DEFAULT_APP_PIN = '6767';
export const APP_PIN_STORAGE_KEY = 'cinestream_app_security_pin';

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);

  const handleDigitPress = (digit: string) => {
    if (pin.length >= 4) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorMsg(null);

    if (nextPin.length === 4) {
      validatePin(nextPin);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg(null);
  };

  const validatePin = (code: string) => {
    if (code === APP_PIN) {
      // Correct PIN entered!
      onUnlock();
    } else {
      // Wrong PIN
      setIsShaking(true);
      setErrorMsg('PIN incorrecto. Inténtalo de nuevo.');
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 600);
    }
  };

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div
      id="pin-lock-screen"
      className="fixed inset-0 z-[99999] bg-zinc-950 flex flex-col items-center justify-center p-4 select-none overflow-y-auto"
      style={{
        paddingTop: 'max(1.5rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Background glow ambiance */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-rose-950/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm flex flex-col items-center z-10 text-center">
        {/* Brand Icon & Shield */}
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-600 to-rose-700 p-0.5 shadow-xl shadow-rose-950/60 flex items-center justify-center">
            <div className="w-full h-full bg-zinc-900 rounded-[22px] flex items-center justify-center text-rose-500">
              <Lock className="w-7 h-7" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-zinc-800 border-2 border-zinc-950 flex items-center justify-center text-emerald-400">
            <Shield className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title & Description */}
        <h1 className="text-2xl font-black text-white font-['Outfit'] tracking-tight mb-1.5">
          Acceso a CineStream
        </h1>
        <p className="text-xs text-zinc-400 max-w-xs mb-8">
          Ingresa el PIN de 4 dígitos para entrar a la aplicación
        </p>

        {/* 4 Digit Dots */}
        <div
          className={`flex items-center justify-center gap-4 mb-8 ${
            isShaking ? 'animate-bounce text-rose-500' : ''
          }`}
        >
          {[0, 1, 2, 3].map((index) => {
            const hasValue = pin.length > index;
            const digitChar = hasValue ? (showNumbers ? pin[index] : '•') : '';
            return (
              <div
                key={index}
                className={`w-12 h-14 rounded-2xl flex items-center justify-center text-lg font-mono font-bold transition-all duration-200 ${
                  hasValue
                    ? 'bg-rose-600/20 border-2 border-rose-500 text-rose-400 scale-105 shadow-md shadow-rose-950/40'
                    : 'bg-zinc-900/80 border border-zinc-800 text-zinc-600'
                }`}
              >
                {hasValue ? (
                  showNumbers ? (
                    digitChar
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/80 animate-in zoom-in duration-150" />
                  )
                ) : (
                  <div className="w-2 h-2 rounded-full bg-zinc-700" />
                )}
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="text-xs font-semibold text-rose-400 bg-rose-950/60 border border-rose-800/60 px-3 py-1.5 rounded-xl mb-6 animate-shake">
            {errorMsg}
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              id={`pin-btn-${digit}`}
              type="button"
              onClick={() => handleDigitPress(digit)}
              className="h-14 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 active:bg-rose-600/30 active:scale-95 border border-zinc-800/90 hover:border-zinc-700 text-white font-mono text-xl font-bold transition-all flex items-center justify-center cursor-pointer shadow-sm"
            >
              {digit}
            </button>
          ))}

          {/* Bottom Row: Clear / 0 / Delete */}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 text-xs font-semibold transition-all flex items-center justify-center cursor-pointer active:scale-95"
            title="Borrar todo"
          >
            Limpiar
          </button>

          <button
            id="pin-btn-0"
            type="button"
            onClick={() => handleDigitPress('0')}
            className="h-14 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 active:bg-rose-600/30 active:scale-95 border border-zinc-800/90 hover:border-zinc-700 text-white font-mono text-xl font-bold transition-all flex items-center justify-center cursor-pointer shadow-sm"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900 active:scale-95 text-zinc-400 hover:text-rose-400 transition-all flex items-center justify-center cursor-pointer"
            title="Borrar último dígito"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Options Bar: Only Peek Numbers */}
        <div className="flex items-center justify-center w-full max-w-[280px] text-xs text-zinc-500 pt-2 border-t border-zinc-900">
          <button
            type="button"
            onClick={() => setShowNumbers(!showNumbers)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-zinc-900 hover:text-zinc-300 transition-colors cursor-pointer"
            title={showNumbers ? 'Ocultar dígitos' : 'Mostrar dígitos'}
          >
            {showNumbers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-medium">{showNumbers ? 'Ocultar PIN' : 'Ver dígitos'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
