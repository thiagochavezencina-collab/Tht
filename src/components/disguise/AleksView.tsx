import React, { useState } from 'react';
import {
  Menu,
  Bell,
  ChevronDown,
  X,
  Printer,
  Mail,
  Type,
  Calculator,
  Search,
  Download,
  Filter,
  Folder,
  ArrowLeft,
  RotateCw,
  MoreHorizontal,
  Layers,
} from 'lucide-react';

interface AleksViewProps {
  onExit: () => void;
  onOpenTabSwitcher?: () => void;
}

export const AleksView: React.FC<AleksViewProps> = ({ onExit, onOpenTabSwitcher }) => {
  const [activeScreen, setActiveScreen] = useState<
    'inicio' | 'aprendizaje' | 'actividades' | 'informes' | 'hoja_trabajo' | 'diccionario'
  >('inicio');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Table inputs for function g(x) = 5x - 5
  const [inputs, setInputs] = useState<{ [key: string]: string }>({
    '-5': '',
    '-4': '',
    '0': '',
    '2': '',
    '4': '',
  });
  const [checked, setChecked] = useState(false);

  return (
    <div
      className="min-h-screen bg-[#edf0f5] text-[#222222] flex flex-col font-sans select-none pb-16"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
    >
      {/* iOS Top Status Bar (Authentic 7:30 / 4G / 95%) */}
      <div className="bg-white px-5 pt-2 pb-1 flex items-center justify-between text-xs text-black border-b border-[#e1e4e8]">
        <span className="font-semibold text-sm">7:30</span>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className="text-[11px]">4G</span>
          <div className="flex items-end gap-0.5 h-3">
            <span className="w-0.5 h-1 bg-black"></span>
            <span className="w-0.5 h-1.5 bg-black"></span>
            <span className="w-0.5 h-2 bg-black"></span>
            <span className="w-0.5 h-2.5 bg-black"></span>
          </div>
          <div className="flex items-center gap-0.5 ml-1">
            <span className="text-[11px]">95%</span>
            <div className="w-5 h-2.5 border border-black rounded-xs p-0.5 flex items-center">
              <div className="w-full h-full bg-black"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Top ALEKS Header (Exact replica from screenshots) */}
      <header className="bg-white px-3 py-2 flex items-center justify-between border-b border-[#d0d5dd] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 text-[#333333] hover:bg-slate-100"
            title="Menú"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-baseline gap-2">
            <span
              onClick={() => setActiveScreen('inicio')}
              className="font-bold text-xl text-[#005a66] tracking-tight cursor-pointer"
            >
              ALEKS<sup className="text-xs font-normal">®</sup>
            </span>
            <span className="text-xs sm:text-sm font-semibold text-[#4a5568]">
              9no Grado 2026 - B
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="text-[#555555] hover:text-black">
            <Bell className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-1 text-xs font-bold text-[#333333] bg-white hover:bg-slate-50 px-2 py-1 border border-[#d0d5dd] rounded-xs"
            >
              <span>¡Hola, Thiago...</span>
              <span className="text-[10px]">▼</span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-[#c2c8d0] shadow-md py-1 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-100 font-bold text-slate-800">
                  Thiago Chavez Encina
                  <span className="block font-normal text-slate-500 text-[11px]">ID de estudiante: 928371</span>
                </div>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenTabSwitcher?.();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 text-[#005a66] font-semibold"
                >
                  Cambiar plataforma (Safari)
                </button>
                <button
                  onClick={onExit}
                  className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-700 font-bold border-t border-slate-100"
                >
                  Cerrar sesión (CineStream)
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar Drawer (Exact 1:1 replica of IMG_5830) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="w-72 bg-white h-full shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header Item: Inicio with X close button */}
            <div className="border-b border-[#e5e7eb]">
              <div
                onClick={() => {
                  setActiveScreen('inicio');
                  setSidebarOpen(false);
                }}
                className="px-5 py-3.5 flex items-center justify-between text-[#005a66] font-bold text-sm cursor-pointer hover:bg-slate-50"
              >
                <span>Inicio</span>
                <span className="text-[#005a66] text-base font-bold">✕</span>
              </div>
            </div>

            {/* Pure text items from IMG_5830 */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#f0f2f5] text-sm text-[#333333]">
              <button
                onClick={() => {
                  setActiveScreen('aprendizaje');
                  setSidebarOpen(false);
                }}
                className={`w-full text-left px-5 py-3 hover:bg-slate-50 ${
                  activeScreen === 'aprendizaje' ? 'text-[#005a66] font-bold' : ''
                }`}
              >
                Aprendizaje
              </button>

              <button
                onClick={() => {
                  setActiveScreen('inicio');
                  setSidebarOpen(false);
                }}
                className="w-full text-left px-5 py-3 hover:bg-slate-50"
              >
                Repaso
              </button>

              <button
                onClick={() => {
                  setActiveScreen('actividades');
                  setSidebarOpen(false);
                }}
                className={`w-full text-left px-5 py-3 hover:bg-slate-50 ${
                  activeScreen === 'actividades' ? 'text-[#005a66] font-bold' : ''
                }`}
              >
                Actividades
              </button>

              <button
                onClick={() => {
                  setActiveScreen('hoja_trabajo');
                  setSidebarOpen(false);
                }}
                className={`w-full text-left px-5 py-3 hover:bg-slate-50 ${
                  activeScreen === 'hoja_trabajo' ? 'text-[#005a66] font-bold' : ''
                }`}
              >
                Hoja de trabajo
              </button>

              <button
                onClick={() => {
                  setActiveScreen('informes');
                  setSidebarOpen(false);
                }}
                className={`w-full text-left px-5 py-3 hover:bg-slate-50 ${
                  activeScreen === 'informes' ? 'text-[#005a66] font-bold' : ''
                }`}
              >
                Informes
              </button>

              <button
                onClick={() => setSidebarOpen(false)}
                className="w-full text-left px-5 py-3 hover:bg-slate-50 text-slate-500"
              >
                Centro de mensajes
              </button>

              <button
                onClick={() => {
                  setActiveScreen('diccionario');
                  setSidebarOpen(false);
                }}
                className={`w-full text-left px-5 py-3 hover:bg-slate-50 ${
                  activeScreen === 'diccionario' ? 'text-[#005a66] font-bold' : ''
                }`}
              >
                Diccionario
              </button>

              <button
                onClick={() => setSidebarOpen(false)}
                className="w-full text-left px-5 py-3 hover:bg-slate-50 text-slate-500"
              >
                Administración de mis clases
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 1: INICIO (Exact replica of IMG_5825) */}
      {activeScreen === 'inicio' && (
        <main className="p-3 sm:p-5 max-w-5xl mx-auto w-full space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Left box: Dark teal #005a66 */}
            <div className="md:col-span-5 bg-[#005a66] text-white p-5 rounded-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-xs text-[#a2d8d2] font-semibold block">En seguida</span>
                <h2 className="text-2xl font-bold leading-tight">Bimestre - 3</h2>
                <p className="text-xs text-[#d2ede9]">14 de 52 temas completados</p>
                <p className="text-xs text-[#d2ede9]">Fecha límite 8 de oct. 11:59 PM</p>

                {/* Big White CONTINUAR button */}
                <div className="pt-2">
                  <button
                    onClick={() => setActiveScreen('aprendizaje')}
                    className="w-full py-2.5 bg-white text-[#005a66] font-bold text-sm uppercase rounded-full shadow-sm hover:bg-slate-50 transition-colors text-center cursor-pointer"
                  >
                    CONTINUAR
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1a6e7a] space-y-1">
                <span className="text-xs font-bold text-white block">
                  Verificación de conocimientos del módulo
                </span>
                <span className="text-xs text-[#a2d8d2] flex items-center gap-1">
                  <span>🔒</span>
                  <span>Tras haber completado Bimestre - 3</span>
                </span>
              </div>
            </div>

            {/* Right box: Cronograma */}
            <div className="md:col-span-7 bg-white border border-[#d2d6dc] rounded-xs p-4 flex flex-col justify-between space-y-4">
              {/* Tab row */}
              <div className="flex items-center justify-between border-b border-[#e2e5e9] pb-2">
                <div className="flex items-center gap-6 text-xs font-bold">
                  <button className="flex items-center gap-1 text-[#005a66] border-b-2 border-[#005a66] pb-2">
                    <span className="text-emerald-600">💬✓</span>
                    <span>Cronograma</span>
                  </button>
                  <button
                    onClick={() => setActiveScreen('informes')}
                    className="flex items-center gap-1 text-[#666666] hover:text-black pb-2"
                  >
                    <span>🌐</span>
                    <span>Gráfico circular</span>
                  </button>
                </div>

                <button className="text-xs border border-[#ccd1d8] px-2 py-0.5 rounded-xs text-[#444444]">
                  English
                </button>
              </div>

              {/* Weekly Cronograma Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-[#e1e4e8]">
                  <thead>
                    <tr className="bg-[#f2f4f7] text-[#444444] border-b border-[#e1e4e8]">
                      <th className="p-2 border-r border-[#e1e4e8] font-bold">lu. 07/09/2026</th>
                      <th className="p-2 border-r border-[#e1e4e8] font-bold">ma. 08/09/2026</th>
                      <th className="p-2 border-r border-[#e1e4e8] font-bold">mi. 09/09/2026</th>
                      <th className="p-2 border-r border-[#e1e4e8] font-bold">ju. 10/09/2026</th>
                      <th className="p-2 font-bold">vi. 11/09/2026</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#555555]">
                    <tr>
                      <td className="p-2 border-r border-[#e1e4e8] align-top bg-[#e6f4f3]">
                        <span className="font-bold text-[#005a66] block">0 temas aprendidos</span>
                        <span className="text-[11px] text-[#666666]">(Inició sesión)</span>
                      </td>
                      <td className="p-2 border-r border-[#e1e4e8] align-top text-[#999999]">Sin datos</td>
                      <td className="p-2 border-r border-[#e1e4e8] align-top text-[#999999]">Sin datos</td>
                      <td className="p-2 border-r border-[#e1e4e8] align-top text-[#999999]">Sin datos</td>
                      <td className="p-2 align-top text-[#999999]">Sin datos</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom right: Cronograma detallado » */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveScreen('informes')}
                  className="bg-[#005a66] text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-[#004a55] transition-colors"
                >
                  Cronograma detallado »
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* SCREEN 2: APRENDIZAJE (Exact replica of IMG_5826) */}
      {activeScreen === 'aprendizaje' && (
        <main className="p-3 sm:p-5 max-w-4xl mx-auto w-full space-y-4">
          {/* Top header teal banner */}
          <div className="bg-[#005a66] text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="text-[#a2d8d2]">Funciones y sucesiones</span>
              <span>/</span>
              <span>Tabla para una función lineal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="w-3.5 h-1.5 bg-[#00444d]"></span>
                ))}
              </div>
              <span>0/5</span>
              <span className="ml-2 font-normal text-slate-200">Thiago ▼</span>
            </div>
          </div>

          {/* Subheader bar */}
          <div className="bg-white border border-[#d2d6dc] px-4 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="bg-[#2e7d32] text-white text-[10px] font-bold px-2 py-0.5 rounded-xs">
                Página de aprendizaje
              </span>
              <button className="text-[#555555] font-semibold">English</button>
            </div>

            <div className="flex items-center gap-3 text-[#666666]">
              <Calculator className="w-4 h-4 cursor-pointer" />
              <Type className="w-4 h-4 cursor-pointer" />
              <Mail className="w-4 h-4 cursor-pointer" />
              <Printer className="w-4 h-4 cursor-pointer" />
            </div>
          </div>

          {/* Section: ? PREGUNTA */}
          <div className="bg-white border border-[#d2d6dc] p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-[#e2e5e9] pb-2">
              <span className="w-5 h-5 bg-[#005a66] text-white rounded-full flex items-center justify-center text-xs font-bold">
                ?
              </span>
              <h3 className="font-bold text-xs uppercase tracking-wide text-[#333333]">PREGUNTA</h3>
            </div>

            <p className="text-xs sm:text-sm text-[#333333]">
              La función <span className="italic font-serif font-bold">g</span> está definida por la siguiente regla.
            </p>

            <div className="p-2 bg-[#f8f9fa] border border-[#e5e7eb] font-serif italic font-bold text-center text-base text-[#111111]">
              g(x) = 5x - 5
            </div>

            <p className="text-xs sm:text-sm text-[#333333]">Completar la tabla de la función.</p>

            {/* Table */}
            <div className="py-2">
              <table className="border-collapse border border-[#333333] text-xs text-center w-64 mx-auto font-mono">
                <thead>
                  <tr className="bg-[#f0f2f5]">
                    <th className="border border-[#333333] p-1.5 italic font-serif">x</th>
                    <th className="border border-[#333333] p-1.5 italic font-serif">g(x)</th>
                  </tr>
                </thead>
                <tbody>
                  {['-5', '-4', '0', '2', '4'].map((val) => (
                    <tr key={val}>
                      <td className="border border-[#333333] p-1.5 font-bold bg-[#fafafa]">{val}</td>
                      <td className="border border-[#333333] p-1">
                        <input
                          type="text"
                          value={inputs[val]}
                          onChange={(e) => setInputs({ ...inputs, [val]: e.target.value })}
                          className={`w-20 text-center py-0.5 border text-xs font-mono ${
                            checked ? 'bg-[#e8f5e9] border-[#2e7d32] font-bold' : 'border-[#999999]'
                          }`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setChecked(true)}
                className="px-4 py-1.5 bg-[#005a66] text-white font-bold text-xs rounded-xs hover:bg-[#004a55]"
              >
                Comprobar
              </button>
              <button
                onClick={() =>
                  setInputs({
                    '-5': '-30',
                    '-4': '-25',
                    '0': '-5',
                    '2': '5',
                    '4': '15',
                  })
                }
                className="px-4 py-1.5 border border-[#ccd1d8] text-[#444444] text-xs rounded-xs hover:bg-slate-50"
              >
                Llenar
              </button>
            </div>
          </div>

          {/* Section: 👓 EXPLICACIÓN */}
          <div className="bg-white border border-[#d2d6dc] p-5 space-y-3 text-xs sm:text-sm text-[#333333]">
            <div className="flex items-center gap-2 border-b border-[#e2e5e9] pb-2">
              <span>👓</span>
              <h3 className="font-bold text-xs uppercase tracking-wide">EXPLICACIÓN</h3>
            </div>

            <p>
              La tabla ofrece los valores de entrada <span className="italic font-serif font-bold">x</span> y sus valores de salida correspondientes <span className="italic font-serif font-bold">g(x)</span>.
              Introducimos un valor de <span className="italic font-serif font-bold">x</span>, evaluamos <span className="italic font-serif font-bold">g(x)</span> utilizando la regla, y luego escribimos el valor de salida en la tabla.
            </p>

            <table className="border-collapse border border-[#333333] text-xs text-left w-full font-mono">
              <thead>
                <tr className="bg-[#f0f2f5] font-sans">
                  <th className="border border-[#333333] p-1.5 font-bold">entra x</th>
                  <th className="border border-[#333333] p-1.5 font-bold">Evaluar g(x) = 5x - 5</th>
                  <th className="border border-[#333333] p-1.5 font-bold">sale g(x)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-[#333333] p-1.5 font-bold">-5</td>
                  <td className="border border-[#333333] p-1.5">g(-5) = 5(-5) - 5 = -25 - 5 = -30</td>
                  <td className="border border-[#333333] p-1.5 font-bold">-30</td>
                </tr>
                <tr>
                  <td className="border border-[#333333] p-1.5 font-bold">-4</td>
                  <td className="border border-[#333333] p-1.5">g(-4) = 5(-4) - 5 = -20 - 5 = -25</td>
                  <td className="border border-[#333333] p-1.5 font-bold">-25</td>
                </tr>
                <tr>
                  <td className="border border-[#333333] p-1.5 font-bold">0</td>
                  <td className="border border-[#333333] p-1.5">g(0) = 5(0) - 5 = 0 - 5 = -5</td>
                  <td className="border border-[#333333] p-1.5 font-bold">-5</td>
                </tr>
                <tr>
                  <td className="border border-[#333333] p-1.5 font-bold">2</td>
                  <td className="border border-[#333333] p-1.5">g(2) = 5(2) - 5 = 10 - 5 = 5</td>
                  <td className="border border-[#333333] p-1.5 font-bold">5</td>
                </tr>
                <tr>
                  <td className="border border-[#333333] p-1.5 font-bold">4</td>
                  <td className="border border-[#333333] p-1.5">g(4) = 5(4) - 5 = 20 - 5 = 15</td>
                  <td className="border border-[#333333] p-1.5 font-bold">15</td>
                </tr>
              </tbody>
            </table>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setChecked(true)}
                className="px-6 py-2 bg-[#005a66] text-white font-bold text-xs rounded-xs hover:bg-[#004a55]"
              >
                Empezar
              </button>
            </div>
          </div>
        </main>
      )}

      {/* SCREEN 3: ACTIVIDADES (Exact replica of IMG_5827) */}
      {activeScreen === 'actividades' && (
        <main className="p-3 sm:p-5 max-w-5xl mx-auto w-full space-y-4">
          <div className="bg-white border border-[#d2d6dc] p-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#005a66]">Actividades</h2>
              <span className="text-xs text-[#666666]">15 actividades</span>
            </div>

            <div className="flex items-center gap-3 text-[#555555]">
              <Search className="w-4 h-4 cursor-pointer" />
              <Download className="w-4 h-4 cursor-pointer" />
              <Filter className="w-4 h-4 cursor-pointer" />
              <Folder className="w-4 h-4 cursor-pointer" />
              <button className="text-xs border border-[#ccd1d8] px-2 py-0.5 rounded-xs text-[#444444]">
                English
              </button>
            </div>
          </div>

          {/* 15 Activities Exact Table from IMG_5827 */}
          <div className="bg-white border border-[#d2d6dc] overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-[#f0f2f5] text-[#333333] border-b border-[#d2d6dc]">
                  <th className="p-2.5 font-bold">Título</th>
                  <th className="p-2.5 font-bold">Estado</th>
                  <th className="p-2.5 font-bold">Tipo</th>
                  <th className="p-2.5 font-bold">Inicio</th>
                  <th className="p-2.5 font-bold">Vence</th>
                  <th className="p-2.5 font-bold">Progreso</th>
                  <th className="p-2.5 font-bold">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb] text-[#333333]">
                <tr>
                  <td className="p-2.5 font-bold">Verificación inicial de conocimientos</td>
                  <td className="p-2.5"><span className="bg-[#e5e7eb] text-[#333333] px-2 py-0.5 rounded-xs text-[10px]">Cerrada</span></td>
                  <td className="p-2.5 text-[#666666]">Verificación</td>
                  <td className="p-2.5 text-[#666666]">-</td>
                  <td className="p-2.5 text-[#666666]">-</td>
                  <td className="p-2.5">Completada</td>
                  <td className="p-2.5 text-[#005a66] font-bold cursor-pointer">Ver</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Preparación para Unidad 1</td>
                  <td className="p-2.5"><span className="bg-[#e5e7eb] text-[#333333] px-2 py-0.5 rounded-xs text-[10px]">Cerrada</span></td>
                  <td className="p-2.5 text-[#666666]">Módulo</td>
                  <td className="p-2.5 text-[#666666]">10 de mar.</td>
                  <td className="p-2.5 text-[#666666]">24 de mar.</td>
                  <td className="p-2.5 font-semibold text-emerald-700">10,0 • 20 de 20 temas</td>
                  <td className="p-2.5 text-[#005a66] font-bold cursor-pointer">Ver</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Bimestre - 1</td>
                  <td className="p-2.5"><span className="bg-[#e5e7eb] text-[#333333] px-2 py-0.5 rounded-xs text-[10px]">Cerrada</span></td>
                  <td className="p-2.5 text-[#666666]">Módulo</td>
                  <td className="p-2.5 text-[#666666]">24 de mar.</td>
                  <td className="p-2.5 text-[#666666]">8 de may.</td>
                  <td className="p-2.5">5,2 • 66 de 128 temas</td>
                  <td className="p-2.5 text-[#005a66] font-bold cursor-pointer">Ver</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Bimestre - 2</td>
                  <td className="p-2.5"><span className="bg-[#e5e7eb] text-[#333333] px-2 py-0.5 rounded-xs text-[10px]">Cerrada</span></td>
                  <td className="p-2.5 text-[#666666]">Módulo</td>
                  <td className="p-2.5 text-[#666666]">26 de may.</td>
                  <td className="p-2.5 text-[#666666]">17 de jul.</td>
                  <td className="p-2.5">3,0 • 40 de 132 temas</td>
                  <td className="p-2.5 text-[#005a66] font-bold cursor-pointer">Ver</td>
                </tr>
                {/* ACTIVE OPEN: Bimestre - 3 */}
                <tr className="bg-[#e6f4f3]">
                  <td className="p-2.5 font-bold text-[#005a66]">Bimestre - 3</td>
                  <td className="p-2.5">
                    <span className="bg-[#228b22] text-white px-2 py-0.5 rounded-xs text-[10px] font-bold">
                      Abierta
                    </span>
                  </td>
                  <td className="p-2.5 font-bold text-[#005a66]">Módulo</td>
                  <td className="p-2.5 font-bold text-[#005a66]">11 de ago.</td>
                  <td className="p-2.5 font-bold text-[#005a66]">8 de oct. 11:59 PM</td>
                  <td className="p-2.5 font-bold text-[#005a66]">2,7 • 14 de 52 temas</td>
                  <td className="p-2.5">
                    <button
                      onClick={() => setActiveScreen('aprendizaje')}
                      className="bg-[#005a66] text-white px-3 py-0.5 rounded-xs font-bold text-xs hover:bg-[#004a55]"
                    >
                      Continuar
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Verificación tras completar el módulo</td>
                  <td className="p-2.5"><span className="bg-[#ffeb3b] text-[#554400] px-2 py-0.5 rounded-xs text-[10px] font-bold">Bloqueada</span></td>
                  <td className="p-2.5 text-[#666666]">Verificación</td>
                  <td className="p-2.5 text-[#666666]">-</td>
                  <td className="p-2.5 text-[#666666]">Tras Bimestre - 3</td>
                  <td className="p-2.5 text-[#999999]">0 de 1</td>
                  <td className="p-2.5 text-[#999999]">-</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-500">Bimestre - 4</td>
                  <td className="p-2.5"><span className="bg-[#e5e7eb] text-[#666666] px-2 py-0.5 rounded-xs text-[10px]">Próxima</span></td>
                  <td className="p-2.5 text-[#999999]">Módulo</td>
                  <td className="p-2.5 text-[#999999]">19 de oct.</td>
                  <td className="p-2.5 text-[#999999]">18 de dic.</td>
                  <td className="p-2.5 text-[#999999]">0 de 72 temas</td>
                  <td className="p-2.5 text-[#999999]">-</td>
                </tr>
                {/* Folder UNIVERSITARIOS */}
                <tr className="bg-[#f8f9fa]">
                  <td colSpan={7} className="p-2 font-bold text-[#333333] flex items-center gap-2">
                    <Folder className="w-4 h-4 text-[#d97706]" />
                    <span>UNIVERSITARIOS</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold pl-8">Preparación para Bimestre - 2</td>
                  <td className="p-2.5"><span className="bg-[#e5e7eb] text-[#333333] px-2 py-0.5 rounded-xs text-[10px]">Cerrada</span></td>
                  <td className="p-2.5 text-[#666666]">Tarea</td>
                  <td className="p-2.5 text-[#666666]">7 de jul.</td>
                  <td className="p-2.5 text-[#666666]">14 de jul.</td>
                  <td className="p-2.5 font-semibold text-emerald-700">10,0 • 9 de 9 temas</td>
                  <td className="p-2.5 text-[#005a66] font-bold cursor-pointer">Ver</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold pl-8">Tarea 1</td>
                  <td className="p-2.5"><span className="bg-[#e5e7eb] text-[#333333] px-2 py-0.5 rounded-xs text-[10px]">Cerrada</span></td>
                  <td className="p-2.5 text-[#666666]">Tarea</td>
                  <td className="p-2.5 text-[#666666]">14 de jul.</td>
                  <td className="p-2.5 text-[#666666]">16 de jul.</td>
                  <td className="p-2.5">7,3 • queda 1 de 2</td>
                  <td className="p-2.5 text-[#005a66] font-bold cursor-pointer">Ver</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold pl-8">Prueba 1</td>
                  <td className="p-2.5"><span className="bg-[#e5e7eb] text-[#333333] px-2 py-0.5 rounded-xs text-[10px]">Cerrada</span></td>
                  <td className="p-2.5 text-[#666666]">Prueba</td>
                  <td className="p-2.5 text-[#666666]">16 de jul.</td>
                  <td className="p-2.5 text-[#666666]">17 de jul.</td>
                  <td className="p-2.5">7,3 • quedan 0 de 1</td>
                  <td className="p-2.5 text-[#005a66] font-bold cursor-pointer">Ver</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold pl-8">Prueba 2</td>
                  <td className="p-2.5"><span className="bg-[#e5e7eb] text-[#333333] px-2 py-0.5 rounded-xs text-[10px]">Cerrada</span></td>
                  <td className="p-2.5 text-[#666666]">Prueba</td>
                  <td className="p-2.5 text-[#666666]">17 de jul.</td>
                  <td className="p-2.5 text-[#666666]">18 de jul.</td>
                  <td className="p-2.5 text-[#999999]">0,0 • No trabajó en la actividad</td>
                  <td className="p-2.5 text-[#999999]">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>
      )}

      {/* SCREEN 4: INFORMES (Exact replica of IMG_5829) */}
      {activeScreen === 'informes' && (
        <main className="p-3 sm:p-5 max-w-5xl mx-auto w-full space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#005a66]">Informes</h2>
            <button className="text-xs border border-[#ccd1d8] px-2 py-0.5 rounded-xs text-[#444444]">
              English
            </button>
          </div>

          {/* 6 Metric Cards with #1f5963 Teal Header from IMG_5829 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1 */}
            <div className="bg-white border border-[#d2d6dc] flex flex-col justify-between">
              <div className="bg-[#1f5963] text-white p-2.5 font-bold text-xs">
                Progreso en el gráfico circular
              </div>
              <div className="p-4 flex flex-col items-center justify-center space-y-2">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#005a66]"
                      strokeDasharray="36.2, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-[#222222]">36.2%</span>
                    <span className="text-[10px] text-[#666666]">161 / 445</span>
                  </div>
                </div>
              </div>
              <div className="p-2 border-t border-[#f0f2f5] text-right">
                <span className="text-xs text-[#005a66] font-bold cursor-pointer">Ver el informe completo »</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-[#d2d6dc] flex flex-col justify-between">
              <div className="bg-[#1f5963] text-white p-2.5 font-bold text-xs">
                Actividades
              </div>
              <div className="p-4 space-y-2 text-xs">
                <span className="font-bold text-[#222222] block">Bimestre - 3</span>
                <span className="text-[#666666] block">Fecha límite 8 de oct. 11:59 PM</span>
                <div className="pt-2 border-t border-[#f0f2f5]">
                  <span className="font-bold text-[#222222] block">Verificación tras completar el módulo</span>
                  <span className="text-amber-700 block">🔒 Bloqueada</span>
                </div>
              </div>
              <div className="p-2 border-t border-[#f0f2f5] text-right">
                <span className="text-xs text-[#005a66] font-bold cursor-pointer">Ver detalle »</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-[#d2d6dc] flex flex-col justify-between">
              <div className="bg-[#1f5963] text-white p-2.5 font-bold text-xs">
                Módulo actual
              </div>
              <div className="p-4 flex flex-col items-center justify-center space-y-2">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-teal-600"
                      strokeDasharray="27, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-[#222222]">27%</span>
                    <span className="text-[10px] text-[#666666]">14 de 52 Temas</span>
                  </div>
                </div>
              </div>
              <div className="p-2 border-t border-[#f0f2f5] text-right">
                <span className="text-xs text-[#005a66] font-bold cursor-pointer">Continuar ruta »</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white border border-[#d2d6dc] flex flex-col justify-between">
              <div className="bg-[#1f5963] text-white p-2.5 font-bold text-xs">
                Actividad de esta semana en el gráfico circular
              </div>
              <div className="p-4 space-y-1.5 text-xs">
                <span className="text-[#666666] font-semibold block">7 de sept. - 13 de sept.</span>
                <div className="flex justify-between py-1 border-b border-[#f0f2f5]">
                  <span>Tiempo dedicado:</span>
                  <span className="font-bold">1m 6s</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#f0f2f5]">
                  <span>Temas aprendidos:</span>
                  <span className="font-bold">0</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Temas intentados:</span>
                  <span className="font-bold">0</span>
                </div>
              </div>
              <div className="p-2 border-t border-[#f0f2f5] text-right">
                <span className="text-xs text-[#005a66] font-bold cursor-pointer">Ver registro »</span>
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-white border border-[#d2d6dc] flex flex-col justify-between">
              <div className="bg-[#1f5963] text-white p-2.5 font-bold text-xs">
                Historial de progreso en el gráfico circular
              </div>
              <div className="p-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#f0f2f5]">
                  <span>Verificación periódica:</span>
                  <span className="font-bold text-[#005a66]">36 (+0%)</span>
                </div>
                <div className="text-[11px] text-[#666666]">4 de sept.</div>
              </div>
              <div className="p-2 border-t border-[#f0f2f5] text-right">
                <span className="text-xs text-[#005a66] font-bold cursor-pointer">Historial »</span>
              </div>
            </div>

            {/* Card 6 */}
            <div className="bg-white border border-[#d2d6dc] flex flex-col justify-between">
              <div className="bg-[#1f5963] text-white p-2.5 font-bold text-xs">
                Intentado, no aprendido
              </div>
              <div className="p-6 text-center text-xs space-y-1">
                <span className="font-bold text-[#333333] block">Aún no hay nada.</span>
                <span className="text-[#666666] block text-[11px]">No hay temas pendientes de refuerzo.</span>
              </div>
              <div className="p-2 border-t border-[#f0f2f5] text-right">
                <span className="text-xs text-[#005a66] font-bold cursor-pointer">Ver detalle »</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* SCREEN 5: HOJA DE TRABAJO (Exact replica of IMG_5828) */}
      {activeScreen === 'hoja_trabajo' && (
        <main className="p-3 sm:p-5 max-w-4xl mx-auto w-full space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#005a66]">Hoja de trabajo</h2>
            <button className="px-3 py-1.5 bg-[#005a66] text-white font-bold text-xs rounded-xs hover:bg-[#004a55] flex items-center gap-1">
              <span>📰</span>
              <span>Nueva hoja de trabajo en ALEKS</span>
            </button>
          </div>

          <div className="bg-[#005a66] text-white px-4 py-2 text-xs font-bold">
            Septiembre
          </div>

          <div className="bg-white border border-[#d2d6dc] p-8 text-center text-xs text-[#555555]">
            En este momento no hay ninguna hoja de trabajo disponible.
          </div>
        </main>
      )}

      {/* SCREEN 6: DICCIONARIO (Exact replica of IMG_5830) */}
      {activeScreen === 'diccionario' && (
        <main className="p-3 sm:p-5 max-w-4xl mx-auto w-full space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#005a66]">Diccionario</h2>
            <button className="text-xs border border-[#ccd1d8] px-2 py-0.5 rounded-xs text-[#444444]">
              English
            </button>
          </div>

          <div className="bg-white border border-[#d2d6dc] divide-y divide-[#e5e7eb] text-xs text-[#333333]">
            {[
              'Números reales',
              'Potenciación, radicación y polinomios',
              'Resolver ecuaciones e inecuaciones lineales',
              'Ecuaciones lineales, cuadráticas y racionales',
              'Radicales y notación científica',
              'Funciones y sucesiones',
              'Geometría',
              'Análisis de datos y probabilidad',
            ].map((topic, i) => (
              <div key={i} className="p-3 hover:bg-slate-50 flex items-center justify-between cursor-pointer">
                <span>{topic}</span>
                <span className="text-[#005a66] font-bold">»</span>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* Real ALEKS Footer */}
      <footer className="mt-auto py-3 px-4 text-center text-[11px] text-[#666666] border-t border-[#d2d6dc] bg-white">
        © 2026 McGraw Hill LLC. Todos los derechos reservados. Términos de uso | Centro de privacidad
      </footer>

      {/* Authentic Mobile Safari Bottom URL Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#f8f9fa] border-t border-[#d2d6dc] px-4 py-1.5 flex items-center justify-between text-[#333333]">
        <button
          onClick={() => {
            if (activeScreen !== 'inicio') setActiveScreen('inicio');
          }}
          className="p-1 text-[#555555]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenTabSwitcher}
          className="bg-white border border-[#c2c8d0] rounded-full px-4 py-1 flex items-center gap-2 text-xs font-mono text-[#333333] shadow-xs hover:border-[#999999]"
          title="Toca para cambiar de pestaña en Safari"
        >
          <Layers className="w-3.5 h-3.5 text-[#005a66]" />
          <span className="text-[11px]">am-awy.aleks.com</span>
          <RotateCw className="w-3.5 h-3.5 text-[#888888]" />
        </button>

        <button onClick={onOpenTabSwitcher} className="p-1 text-[#555555]">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
};
