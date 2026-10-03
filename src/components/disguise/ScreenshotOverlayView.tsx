import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  RotateCw,
  Share,
  Layers,
  ArrowLeft,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Check,
  X,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { APP_PIN_STORAGE_KEY, DEFAULT_APP_PIN } from '../PinLockScreen';

export const CUSTOM_DISGUISE_IMAGE_KEY = 'cinestream_custom_disguise_img';

interface ScreenshotOverlayViewProps {
  platform: 'aleks' | 'pearson' | 'beeverso' | 'classroom' | 'custom';
  onExit: () => void;
  onSwitchToInteractive: () => void;
  onOpenTabSwitcher?: () => void;
}

export const ScreenshotOverlayView: React.FC<ScreenshotOverlayViewProps> = ({
  platform,
  onExit,
  onSwitchToInteractive,
  onOpenTabSwitcher,
}) => {
  const [activePreset, setActivePreset] = useState<'aleks' | 'pearson' | 'classroom' | 'custom'>(() => {
    if (platform === 'pearson') return 'pearson';
    if (platform === 'classroom') return 'classroom';
    return 'aleks';
  });

  const [customImage, setCustomImage] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CUSTOM_DISGUISE_IMAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const [showControls, setShowControls] = useState(false);
  const [liveTime, setLiveTime] = useState('07:30');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const keySequenceRef = useRef<string>('');

  // Synchronize live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      setLiveTime(`${hours}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Secret unlock with 6767 typed anywhere
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
        return;
      }
      if (e.key.length === 1 && /\d/.test(e.key)) {
        keySequenceRef.current = (keySequenceRef.current + e.key).slice(-4);
        let validPin = DEFAULT_APP_PIN;
        try {
          validPin = localStorage.getItem(APP_PIN_STORAGE_KEY) || DEFAULT_APP_PIN;
        } catch {}
        if (keySequenceRef.current === validPin || keySequenceRef.current === '6767') {
          onExit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  // Handle uploading custom real screenshot
  const handleUploadScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setCustomImage(base64);
        try {
          localStorage.setItem(CUSTOM_DISGUISE_IMAGE_KEY, base64);
        } catch {}
        // When photo is added, do not show panic button, show interactive ALEKS screen!
        onSwitchToInteractive();
      }
    };
    reader.readAsDataURL(file);
  };

  const getUrlForPreset = () => {
    if (activePreset === 'pearson') return 'https://english-dashboard.pearson.com/mylab/unit4/reading';
    if (activePreset === 'classroom') return 'https://classroom.google.com/u/0/c/NTkyODc0OTE5Mzg3';
    return 'https://am-awy.aleks.com/alekscgi/x/Isl.exe/1o_u-U6nwXDUQW-wIkx';
  };

  return (
    <div className="min-h-screen bg-[#1c1c1e] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden relative">
      {/* Hidden file input for custom photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUploadScreenshot}
        className="hidden"
      />

      {/* Realistic iOS/iPadOS Status Bar */}
      <div className="bg-[#f6f6f8] text-black px-4 sm:px-6 pt-2 pb-1.5 flex items-center justify-between text-xs font-semibold border-b border-[#e5e5ea] sticky top-0 z-40">
        <span className="font-bold text-sm tracking-tight">{liveTime}</span>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className="text-[11px] text-zinc-700">5G</span>
          <div className="flex items-end gap-0.5 h-3">
            <span className="w-0.5 h-1 bg-black rounded-xs"></span>
            <span className="w-0.5 h-1.5 bg-black rounded-xs"></span>
            <span className="w-0.5 h-2 bg-black rounded-xs"></span>
            <span className="w-0.5 h-2.5 bg-black rounded-xs"></span>
          </div>
          <div className="flex items-center gap-0.5 ml-1.5">
            <span className="text-[11px] text-zinc-700">98%</span>
            <div className="w-5 h-2.5 border border-black rounded-xs p-0.5 flex items-center">
              <div className="w-full h-full bg-black rounded-2xs"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Realistic Safari/Chrome Navigation Bar */}
      <div className="bg-[#f6f6f8] px-3 py-2 border-b border-[#d1d1d6] flex items-center justify-between gap-2 text-[#007aff] sticky top-[29px] z-40 shadow-xs">
        <div className="flex items-center gap-2">
          <button className="p-1 rounded-md text-zinc-400 cursor-not-allowed">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button className="p-1 rounded-md text-zinc-400 cursor-not-allowed">
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Address Bar */}
        <div className="flex-1 max-w-xl mx-auto bg-[#e3e3e8] hover:bg-[#dcdce2] rounded-xl px-3 py-1.5 flex items-center justify-center gap-2 text-zinc-700 transition-colors">
          <Lock className="w-3 h-3 text-zinc-500 shrink-0" />
          <span className="text-xs font-medium truncate font-mono text-zinc-800">
            {getUrlForPreset()}
          </span>
          <RotateCw className="w-3.5 h-3.5 text-zinc-500 ml-auto shrink-0" />
        </div>

        <div className="flex items-center gap-2">
          <button className="p-1 text-[#007aff] hover:bg-slate-200 rounded-lg">
            <Share className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenTabSwitcher}
            className="p-1 text-[#007aff] hover:bg-slate-200 rounded-lg"
            title="Pestañas"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Overlay Content */}
      <div className="flex-1 bg-[#ffffff] flex flex-col items-center justify-start overflow-y-auto">
        {/* Custom Uploaded Screenshot View */}
        {activePreset === 'custom' && customImage ? (
          <div className="w-full max-w-5xl mx-auto p-0 sm:p-2">
            <img
              src={customImage}
              alt="Captura de pantalla escolar"
              className="w-full h-auto object-contain select-none shadow-sm"
              draggable={false}
            />
          </div>
        ) : activePreset === 'classroom' ? (
          /* Realistic Google Classroom Captured Layout */
          <div className="w-full max-w-5xl mx-auto bg-white text-[#3c4043] p-4 sm:p-6 space-y-4">
            <div className="rounded-2xl bg-[#137333] text-white p-6 shadow-sm">
              <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider block">
                Google Classroom • Ciclo 2026
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold mt-1">
                Matemáticas 9° - Sección B
              </h1>
              <p className="text-sm text-emerald-100 mt-1">
                Prof. Carlos Mendoza • Código: x7k9p2m
              </p>
            </div>

            <div className="border border-[#dadce0] rounded-xl p-5 space-y-3 bg-[#f8f9fa]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                  ⚠️ Tarea Asignada • Entrega Hoy 23:59
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  100 Puntos
                </span>
              </div>
              <h2 className="text-lg font-bold text-[#202124]">
                Guía Evaluada #4: Sistemas de Ecuaciones Lineales y Matrices
              </h2>
              <p className="text-xs text-[#5f6368] leading-relaxed">
                Resolver los ejercicios de la página 84 a la 89. Adjuntar resolución manuscrita en formato PDF escaneado con CamScanner o similar. Indicar el método utilizado en cada caso.
              </p>
              <div className="flex items-center gap-3 p-3 bg-white border border-[#dadce0] rounded-lg">
                <div className="w-8 h-8 rounded-sm bg-rose-600 text-white font-bold text-xs flex items-center justify-center">
                  PDF
                </div>
                <div>
                  <span className="text-xs font-bold text-[#202124] block">
                    Guia_Ejercicios_Sistemas_9B.pdf
                  </span>
                  <span className="text-[10px] text-[#5f6368]">
                    1.4 MB • Documento de estudio
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : activePreset === 'pearson' ? (
          /* Realistic Pearson MyLab Interactive Workbook Overlay */
          <div className="w-full max-w-5xl mx-auto bg-[#fafafa] text-[#222222] p-4 sm:p-6 space-y-4">
            <div className="bg-[#002f5e] text-white p-4 rounded-xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#007fa3] flex items-center justify-center font-bold text-sm">
                  PE
                </div>
                <div>
                  <span className="text-xs text-cyan-200 font-semibold block">Pearson MyEnglishLab</span>
                  <span className="text-sm font-bold">Unit 4: Technology & The Future • Reading 2</span>
                </div>
              </div>
              <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-mono font-bold">
                Score: 85%
              </span>
            </div>

            <div className="bg-white border border-[#d0d5dd] rounded-xl p-5 space-y-4 shadow-2xs">
              <span className="text-xs font-bold text-[#007fa3] uppercase">Exercise 3: Multiple Choice</span>
              <p className="text-xs sm:text-sm font-semibold text-[#333333] leading-relaxed">
                Read the excerpt and select the main conclusion proposed by the author regarding artificial intelligence in modern classrooms:
              </p>
              <div className="space-y-2 pt-2">
                {[
                  'A) It completely substitutes the role of human educators in every subject.',
                  'B) It serves as a complementary adaptive tool that tailors exercises to student pace.',
                  'C) It is exclusively beneficial for high school mathematics and physics.',
                  'D) It reduces the need for continuous evaluation rubrics.',
                ].map((opt, i) => (
                  <label
                    key={i}
                    className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                      i === 1
                        ? 'bg-cyan-50/70 border-cyan-500 font-semibold text-cyan-950'
                        : 'bg-white border-[#e5e7eb] text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="pearson_q"
                      checked={i === 1}
                      readOnly
                      className="accent-cyan-600 mt-0.5"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              <div className="pt-3 flex justify-between items-center border-t border-[#f0f2f5]">
                <span className="text-xs text-slate-500 font-mono">Attempt 1 of 2</span>
                <button className="px-4 py-2 bg-[#002f5e] hover:bg-[#001f3e] text-white text-xs font-bold rounded-lg shadow-xs">
                  Check Answers
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Realistic ALEKS Algebra Problem Live Screenshot */
          <div className="w-full max-w-5xl mx-auto bg-[#edf0f5] text-[#222222] p-3 sm:p-5 space-y-3">
            {/* Top ALEKS Header Bar */}
            <div className="bg-white border border-[#d0d5dd] rounded-xl p-3 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-lg text-[#005a66] tracking-tight">
                  ALEKS<sup className="text-xs font-normal">®</sup>
                </span>
                <span className="text-xs font-semibold text-slate-600 border-l border-slate-300 pl-3">
                  9no Grado 2026 - B • Álgebra II
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                  Pregunta 7 de 30
                </span>
                <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
                  En progreso
                </span>
              </div>
            </div>

            {/* Problem Card */}
            <div className="bg-white border border-[#d0d5dd] rounded-xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3">
                <h2 className="text-xs sm:text-sm font-bold text-[#005a66]">
                  Tema: Graficar una función lineal dada la ecuación general
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Verificación de conocimientos</span>
                </div>
              </div>

              <div className="text-xs sm:text-sm text-slate-800 space-y-2">
                <p>Grafica la recta cuya ecuación viene dada por:</p>
                <div className="p-3 bg-[#f8fafc] border border-slate-200 rounded-lg inline-block font-mono text-base font-bold text-slate-900">
                  y = 2x - 3
                </div>
                <p className="text-slate-600 text-xs pt-1">
                  Haz clic en el plano cartesiano para marcar dos puntos que pertenezcan a la recta y luego trazar la línea.
                </p>
              </div>

              {/* Realistic Math Coordinate Grid Rendering */}
              <div className="w-full h-64 sm:h-80 bg-white border border-slate-300 rounded-lg relative overflow-hidden flex items-center justify-center">
                {/* SVG Coordinate Grid */}
                <svg className="w-full h-full" viewBox="0 0 400 300">
                  <defs>
                    <pattern id="grid-sub" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid-sub)" />

                  {/* Axes */}
                  <line x1="200" y1="0" x2="200" y2="300" stroke="#475569" strokeWidth="2" />
                  <line x1="0" y1="150" x2="400" y2="150" stroke="#475569" strokeWidth="2" />

                  {/* Arrows */}
                  <polygon points="200,0 196,8 204,8" fill="#475569" />
                  <polygon points="400,150 392,146 392,154" fill="#475569" />

                  {/* Labels */}
                  <text x="390" y="140" fontSize="12" fontWeight="bold" fill="#334155">x</text>
                  <text x="210" y="15" fontSize="12" fontWeight="bold" fill="#334155">y</text>

                  {/* Plotted Line for y = 2x - 3 */}
                  <line x1="125" y1="300" x2="275" y2="0" stroke="#0284c7" strokeWidth="3" strokeDasharray="6 3" />
                  <circle cx="200" cy="210" r="5" fill="#e11d48" />
                  <text x="210" y="215" fontSize="10" fontWeight="bold" fill="#e11d48">(0, -3)</text>

                  <circle cx="250" cy="110" r="5" fill="#e11d48" />
                  <text x="260" y="115" fontSize="10" fontWeight="bold" fill="#e11d48">(2, 1)</text>
                </svg>
              </div>

              {/* Math Tools Toolbar */}
              <div className="bg-[#f8fafc] border border-slate-200 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Herramientas:</span>
                  <button className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-semibold hover:bg-slate-50">
                    Lápiz
                  </button>
                  <button className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-semibold hover:bg-slate-50">
                    Borrador
                  </button>
                  <button className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-semibold hover:bg-slate-50">
                    Regla
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg">
                    Explicación
                  </button>
                  <button className="px-4 py-1.5 bg-[#005a66] hover:bg-[#004752] text-white text-xs font-bold rounded-lg shadow-xs">
                    Verificar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* No floating panic button is displayed over the disguise */}

      {/* Floating Control Panel (Appears when tapping gear) */}
      {showControls && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowControls(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 text-white rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Modo Imagen Sobrepuesta / Captura</h3>
              </div>
              <button
                onClick={() => setShowControls(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase">
                Selecciona la Captura a mostrar:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActivePreset('aleks')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                    activePreset === 'aleks'
                      ? 'bg-teal-950/60 border-teal-500 text-teal-200'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                  }`}
                >
                  📐 ALEKS Álgebra
                </button>
                <button
                  onClick={() => setActivePreset('classroom')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                    activePreset === 'classroom'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                  }`}
                >
                  📗 Google Classroom
                </button>
                <button
                  onClick={() => setActivePreset('pearson')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                    activePreset === 'pearson'
                      ? 'bg-sky-950/60 border-sky-500 text-sky-200'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                  }`}
                >
                  📘 Pearson MyLab
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                    activePreset === 'custom' && customImage
                      ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                  }`}
                >
                  <span className="truncate">📷 Mi foto / captura</span>
                  <Upload className="w-3.5 h-3.5 shrink-0 ml-1 text-amber-400" />
                </button>
              </div>
            </div>

            {/* Switch to full interactive */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setShowControls(false);
                  onSwitchToInteractive();
                }}
                className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl"
              >
                Cambiar a Simulación Interactiva
              </button>
              <button
                onClick={onExit}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl"
              >
                Volver a CineStream
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 text-center">
              💡 Tip: Escribe <strong className="text-white">6767</strong> o presiona <strong className="text-white">Esc</strong> en cualquier momento para regresar de inmediato.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
