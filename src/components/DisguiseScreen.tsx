import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calculator,
  CheckCircle,
  FileText,
  HelpCircle,
  LogOut,
  RotateCcw,
  Search,
  Sliders,
  Unlock,
} from 'lucide-react';
import { PanicConfig, PANIC_DESTINATIONS } from './PanicModal';

interface DisguiseScreenProps {
  config: PanicConfig;
  onExitDisguise: () => void;
}

export const DisguiseScreen: React.FC<DisguiseScreenProps> = ({ config, onExitDisguise }) => {
  const [selectedTopic, setSelectedTopic] = useState<'algebra' | 'reading' | 'physics'>('algebra');
  const [answerInput, setAnswerInput] = useState('');
  const [showExitHint, setShowExitHint] = useState(false);

  // Match visual style of destination
  const targetInfo =
    PANIC_DESTINATIONS.find((d) => d.id === config.destination) || PANIC_DESTINATIONS[0];

  // Set camouflage title and restore upon unmount
  useEffect(() => {
    const originalTitle = document.title;
    const titlesMap: Record<string, string> = {
      aleks: 'ALEKS - Módulo de Evaluación de Álgebra y Geometría',
      pearson: 'Pearson MyLab - Interactive Mathematics & Science',
      beeverso: 'Beereaders - Biblioteca y Comprensión Lectora',
      classroom: 'Google Classroom - Tareas y Evaluaciones Pendientes',
      custom: 'Portal Educativo Institucional - Aula Virtual',
    };

    document.title = titlesMap[config.destination] || 'Portal Educativo - Aula Virtual';

    return () => {
      document.title = originalTitle;
    };
  }, [config.destination]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f8fafc] text-[#0f172a] font-sans flex flex-col select-none animate-fade-in overflow-y-auto">
      {/* Educational Header */}
      <header className="w-full bg-white border-b border-slate-200 shadow-sm px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${targetInfo.color} flex items-center justify-center text-white font-black text-sm shadow`}
          >
            {targetInfo.iconText}
          </div>
          <div>
            <span className="font-bold text-slate-800 text-sm sm:text-base block">
              {targetInfo.name}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Sesión Estudiantil Activa • Unidad de Aprendizaje 4
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Progreso guardado</span>
          </div>

          {/* Discreet Exit Button */}
          <button
            onClick={onExitDisguise}
            onMouseEnter={() => setShowExitHint(true)}
            onMouseLeave={() => setShowExitHint(false)}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-transparent hover:border-slate-300 hover:bg-slate-100 text-slate-400 hover:text-slate-700 text-xs transition-colors flex items-center gap-1.5"
            title="Volver a CineStream"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restaurar</span>
          </button>
        </div>
      </header>

      {/* Main Educational Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar: Topics */}
        <div className="w-full lg:w-64 shrink-0 bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Módulos del Curso
          </h3>
          <nav className="space-y-1 text-sm">
            <button
              onClick={() => setSelectedTopic('algebra')}
              className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                selectedTopic === 'algebra'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calculator className="w-4 h-4 text-blue-600" />
              <span>Sistemas de Ecuaciones</span>
            </button>
            <button
              onClick={() => setSelectedTopic('reading')}
              className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                selectedTopic === 'reading'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Análisis Textual y Lectura</span>
            </button>
            <button
              onClick={() => setSelectedTopic('physics')}
              className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                selectedTopic === 'physics'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Cinemática y Dinámica</span>
            </button>
          </nav>
        </div>

        {/* Center: Educational Problem Workspace */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-6 flex items-center justify-between">
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-100 text-blue-800">
              Pregunta 3 de 10
            </span>
            <span className="text-xs text-slate-400">Tiempo restante: 45 min</span>
          </div>

          {selectedTopic === 'algebra' && (
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-3">
                Resolución de Ecuaciones Lineales con Dos Incógnitas
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Dado el siguiente sistema de ecuaciones lineales simultáneas, determina el valor de las variables <span className="font-mono font-semibold text-slate-900">x</span> e <span className="font-mono font-semibold text-slate-900">y</span> aplicando el método de sustitución o igualación:
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 font-mono text-slate-800 text-center text-sm sm:text-base space-y-1">
                <div>2x + 3y = 16</div>
                <div>5x - y = 6</div>
              </div>

              <div className="space-y-4 max-w-md">
                <label className="block text-xs font-semibold text-slate-700">
                  Ingresa tu respuesta para (x, y):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="Ej. x = 2, y = 4"
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => alert('Respuesta registrada en la plataforma de evaluación.')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors"
                  >
                    Verificar
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedTopic === 'reading' && (
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-3">
                Comprensión Lectora: Estructura Argumentativa
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                "La transición hacia energías renovables no representa únicamente un desafío tecnológico, sino un cambio paradigmático en los modelos de distribución socioeconómica de los países en desarrollo."
              </p>
              <p className="text-xs text-slate-500 italic">
                Identifica la tesis central del autor y selecciona el tipo de argumento utilizado en el párrafo anterior.
              </p>
            </div>
          )}

          {selectedTopic === 'physics' && (
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-3">
                Movimiento Rectilíneo Uniformemente Variado (MRUV)
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Un móvil parte del reposo y acelera a razón constante de 2.5 m/s² durante 8 segundos. Calcula la distancia total recorrida y la velocidad final alcanzada en km/h.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Subtle bottom bar */}
      <footer className="w-full bg-white border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-400">
        Plataforma Escolar en Línea • Conexión Segura SSL
      </footer>
    </div>
  );
};
