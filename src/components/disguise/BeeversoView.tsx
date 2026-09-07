import React, { useState } from 'react';
import {
  ArrowLeft,
  RotateCw,
  MoreHorizontal,
  Layers,
  Search,
  BookOpen,
  X,
  Sparkles,
} from 'lucide-react';

interface BeeversoViewProps {
  onExit: () => void;
  onOpenTabSwitcher?: () => void;
}

export const BeeversoView: React.FC<BeeversoViewProps> = ({ onExit, onOpenTabSwitcher }) => {
  const [activeTab, setActiveTab] = useState<'inicio' | 'biblioteca' | 'desafios' | 'tienda'>('inicio');
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [readingModalOpen, setReadingModalOpen] = useState(false);
  const [readingPage, setReadingPage] = useState(8);

  return (
    <div
      className="min-h-screen bg-[#f6f4fa] text-[#222222] flex flex-col font-sans select-none pb-28"
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

      {/* Main Beeverso Header (Exact replica of IMG_5833) */}
      <header className="bg-white px-5 py-2.5 flex items-center justify-between sticky top-0 z-30 border-b border-[#ece7f6]">
        {/* Logo: orange 'bee' + deep purple 'verso' */}
        <div
          onClick={() => setActiveTab('inicio')}
          className="flex items-center cursor-pointer"
        >
          <span className="text-2xl font-black text-[#f57c00] tracking-tight">bee</span>
          <span className="text-2xl font-black text-[#3c1464] tracking-tight">verso</span>
        </div>

        {/* Right controls: Coins pill + Avatar */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('tienda')}
            className="flex items-center gap-1 bg-[#fff8e1] border border-[#ffe082] px-2.5 py-1 rounded-full text-xs font-bold text-[#8d6e1f] shadow-2xs"
          >
            <span className="text-sm">🪙</span>
            <span>15</span>
          </button>

          {/* Avatar: Purple circle with cute ghost + red notification dot */}
          <div
            onClick={onOpenTabSwitcher}
            className="relative cursor-pointer"
            title="Toca para opciones de sesión / Safari"
          >
            <div className="w-8 h-8 rounded-full bg-linear-to-tr from-[#6b21a8] to-[#9333ea] flex items-center justify-center text-white text-base shadow-xs">
              👻
            </div>
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
          </div>
        </div>
      </header>

      {/* TAB 1: INICIO (Exact replica of IMG_5833 & IMG_5834) */}
      {activeTab === 'inicio' && (
        <main className="p-4 space-y-5 max-w-lg mx-auto w-full">
          {/* Section: Continúa con tu lectura */}
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-[#260b45]">Continúa con tu lectura</h1>
            <p className="text-xs text-[#6c687e]">Libros asignados y por gusto propio</p>
          </div>

          {/* Highlighted Book Card (Purple Container with Lazarillo de Tormes) */}
          <div className="bg-linear-to-br from-[#5c32a8] to-[#451e85] text-white rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex gap-3.5">
              {/* Book Cover with Yellow 'beeverso' Ribbon */}
              <div className="relative w-24 shrink-0 aspect-3/4 rounded-md overflow-hidden bg-amber-900 shadow-md border border-white/20">
                <div className="w-full h-full bg-[#8c502b] flex flex-col justify-between p-1 text-center">
                  <span className="text-[7px] text-amber-200 uppercase font-semibold">Anónimo</span>
                  <div className="text-[9px] font-bold text-white leading-tight px-0.5">
                    La vida de Lazarillo de Tormes
                  </div>
                  <div className="w-full h-12 bg-[#5c341b] rounded-xs flex items-center justify-center text-xs">
                    📜
                  </div>
                  <span className="text-[6px] text-amber-200">Clásicos</span>
                </div>

                {/* Yellow Corner Ribbon: beeverso */}
                <div className="absolute -top-1 -right-1 bg-amber-400 text-[#3c1464] font-black text-[6px] px-2 py-0.5 transform rotate-12 shadow-xs">
                  beeverso
                </div>
              </div>

              {/* Book Details */}
              <div className="flex-1 space-y-1.5 flex flex-col justify-between">
                <div>
                  <span className="inline-block bg-white text-[#5c32a8] text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">
                    ASIGNACIÓN
                  </span>
                  <h2 className="font-bold text-xs leading-tight text-white line-clamp-2">
                    La vida de Lazarillo de Tormes y de sus fortunas y adversidades
                  </h2>
                </div>

                <div className="space-y-1 text-[10px]">
                  <div className="flex items-center justify-between text-purple-200">
                    <span>Fecha de término</span>
                    <span className="font-semibold text-white flex items-center gap-1">
                      <span>🎁</span> 25 de sep.
                    </span>
                  </div>

                  <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-400 h-full w-[25%] rounded-full"></div>
                  </div>

                  <div className="flex justify-between text-purple-200 text-[10px] pt-0.5">
                    <span>Tu avance</span>
                    <span className="font-bold text-white">8 de 56 Páginas</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedBook('Lazarillo de Tormes');
                    setReadingModalOpen(true);
                  }}
                  className="w-full py-1.5 bg-amber-400 hover:bg-amber-300 text-[#3c1464] font-black text-xs rounded-xl shadow-xs transition-colors text-center"
                >
                  Continuar leyendo
                </button>
              </div>
            </div>

            {/* Carousel dots: 4 dots (● ○ ○ ○) */}
            <div className="flex justify-center gap-1.5 pt-1">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              <span className="w-2 h-2 rounded-full bg-white/40"></span>
              <span className="w-2 h-2 rounded-full bg-white/40"></span>
              <span className="w-2 h-2 rounded-full bg-white/40"></span>
            </div>
          </div>

          {/* Section: Completa los retos (Exact replica of IMG_5834) */}
          <div className="space-y-2">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-[#260b45]">Completa los retos</h2>
              <p className="text-xs text-[#6c687e]">Consigue BeeCoins y XP</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#e8e4f2] shadow-2xs space-y-4">
              {/* Reto 1: Lectófilo */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl shrink-0">
                  📚⚡
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-[#2e104d] text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                      LECTURA
                    </span>
                    <span className="bg-[#ede9fe] text-[#5c32a8] text-[9px] font-bold px-2 py-0.5 rounded-full">
                      ⏱ 9 DÍAS
                    </span>
                  </div>

                  <h3 className="font-bold text-xs text-[#260b45]">Lectófilo</h3>
                  <p className="text-[11px] text-[#6c687e] leading-snug">
                    Realiza 10 desafíos y responde correctamente en el primer intento todas las preguntas.
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#5c32a8] h-full w-0"></div>
                    </div>
                    <span className="text-[10px] font-bold text-[#6c687e]">0 de 10</span>
                    <span className="text-base">🎁</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#f0ecf8]"></div>

              {/* Reto 2: Acertívoro */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl shrink-0">
                  📱❓
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-[#2e104d] text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                      LECTURA
                    </span>
                    <span className="bg-[#ede9fe] text-[#5c32a8] text-[9px] font-bold px-2 py-0.5 rounded-full">
                      ⏱ 9 DÍAS
                    </span>
                  </div>

                  <h3 className="font-bold text-xs text-[#260b45]">Acertívoro</h3>
                  <p className="text-[11px] text-[#6c687e] leading-snug">
                    Responde correctamente en el primer intento 30 preguntas en tus libros de gusto propio.
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#5c32a8] h-full w-0"></div>
                    </div>
                    <span className="text-[10px] font-bold text-[#6c687e]">0 de 30</span>
                    <span className="text-base">🎁</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* TAB 2: BIBLIOTECA (Exact replica of IMG_5835) */}
      {activeTab === 'biblioteca' && (
        <main className="p-4 space-y-5 max-w-lg mx-auto w-full">
          {/* Search bar with deep purple border and square search button */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="¿Qué te gustaría leer hoy?"
                className="w-full bg-white border-2 border-[#5c32a8] rounded-xl px-4 py-2.5 text-xs text-[#222222] placeholder:text-[#888888] focus:outline-none"
              />
            </div>
            <button className="w-10 h-10 rounded-xl bg-[#5c32a8] flex items-center justify-center text-white shadow-xs">
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Category Chips: Misterio y terror / Aventuras / Ciencia */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold text-[#5c32a8]">
            <button className="px-4 py-1.5 bg-white border border-[#d8cde8] rounded-full whitespace-nowrap shadow-2xs">
              🏰 Misterio y terror
            </button>
            <button className="px-4 py-1.5 bg-white border border-[#d8cde8] rounded-full whitespace-nowrap shadow-2xs">
              🗺️ Aventuras
            </button>
            <button className="px-4 py-1.5 bg-white border border-[#d8cde8] rounded-full whitespace-nowrap shadow-2xs">
              🔬 Ciencia
            </button>
          </div>

          {/* Section: Novedades (Exact 3 books from IMG_5835) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-[#260b45]">Novedades</h2>
              <button className="text-xs text-[#5c32a8] font-bold">Ver todos</button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Book 1: Orillas del Duero */}
              <div
                onClick={() => {
                  setSelectedBook('Orillas del Duero');
                  setReadingModalOpen(true);
                }}
                className="space-y-1.5 cursor-pointer"
              >
                <div className="relative aspect-3/4 rounded-lg overflow-hidden bg-amber-700 shadow-sm border border-slate-200">
                  <div className="w-full h-full bg-linear-to-b from-amber-600 to-amber-900 p-2 flex flex-col justify-between text-white">
                    <span className="text-[7px] text-amber-200 uppercase font-semibold">Machado</span>
                    <span className="text-[9px] font-bold leading-tight">Orillas del Duero</span>
                    <span className="text-[7px] text-amber-200">Poesía</span>
                  </div>
                  <div className="absolute -top-1 -right-1 bg-amber-400 text-[#3c1464] font-black text-[6px] px-1.5 py-0.5 transform rotate-12">
                    beeverso
                  </div>
                </div>
                <h3 className="font-bold text-[11px] text-[#260b45] line-clamp-1">Orillas del Duero</h3>
                <p className="text-[10px] text-slate-500 line-clamp-1">Antonio Machado</p>
              </div>

              {/* Book 2: Poesía Siglo de Oro */}
              <div
                onClick={() => {
                  setSelectedBook('Poesía del Siglo de Oro');
                  setReadingModalOpen(true);
                }}
                className="space-y-1.5 cursor-pointer"
              >
                <div className="relative aspect-3/4 rounded-lg overflow-hidden bg-emerald-800 shadow-sm border border-slate-200">
                  <div className="w-full h-full bg-linear-to-b from-emerald-700 to-emerald-950 p-2 flex flex-col justify-between text-white">
                    <span className="text-[7px] text-emerald-200 uppercase font-semibold">Selección</span>
                    <span className="text-[9px] font-bold leading-tight">Poesía del Siglo de Oro</span>
                    <span className="text-[7px] text-emerald-200">Clásicos</span>
                  </div>
                  <div className="absolute -top-1 -right-1 bg-amber-400 text-[#3c1464] font-black text-[6px] px-1.5 py-0.5 transform rotate-12">
                    beeverso
                  </div>
                </div>
                <h3 className="font-bold text-[11px] text-[#260b45] line-clamp-1">Poesía del Siglo de Oro</h3>
                <p className="text-[10px] text-slate-500 line-clamp-1">Garcilaso / Góngora</p>
              </div>

              {/* Book 3: El método científico */}
              <div
                onClick={() => {
                  setSelectedBook('El método científico');
                  setReadingModalOpen(true);
                }}
                className="space-y-1.5 cursor-pointer"
              >
                <div className="relative aspect-3/4 rounded-lg overflow-hidden bg-sky-800 shadow-sm border border-slate-200">
                  <div className="w-full h-full bg-linear-to-b from-sky-600 to-sky-950 p-2 flex flex-col justify-between text-white">
                    <span className="text-[7px] text-sky-200 uppercase font-semibold">Ciencia</span>
                    <span className="text-[9px] font-bold leading-tight">El método científico</span>
                    <span className="text-[7px] text-sky-200">Evidencias</span>
                  </div>
                  <div className="absolute -top-1 -right-1 bg-amber-400 text-[#3c1464] font-black text-[6px] px-1.5 py-0.5 transform rotate-12">
                    beeverso
                  </div>
                </div>
                <h3 className="font-bold text-[11px] text-[#260b45] line-clamp-1">El método científico</h3>
                <p className="text-[10px] text-slate-500 line-clamp-1">Ciencia y Descubrimiento</p>
              </div>
            </div>
          </div>

          {/* Section: Los 10 más populares (Exact replica of IMG_5835 with large translucent numbers 1, 2, 3) */}
          <div className="space-y-3">
            <h2 className="font-bold text-base text-[#260b45]">Los 10 más populares</h2>

            <div className="grid grid-cols-3 gap-3">
              {/* #1 El caballero Carmelo */}
              <div
                onClick={() => {
                  setSelectedBook('El caballero Carmelo');
                  setReadingModalOpen(true);
                }}
                className="relative space-y-1.5 cursor-pointer"
              >
                <span className="absolute -left-2 -top-4 text-5xl font-black text-[#5c32a8]/15 z-0 select-none">
                  1
                </span>
                <div className="relative z-10 aspect-3/4 rounded-lg overflow-hidden bg-amber-900 shadow-sm border border-slate-200">
                  <div className="w-full h-full bg-[#7c2d12] p-2 flex flex-col justify-between text-white">
                    <span className="text-[7px] text-amber-200 font-semibold">Valdelomar</span>
                    <span className="text-[9px] font-bold leading-tight">El caballero Carmelo</span>
                    <span className="text-[7px] text-amber-200">🐓 Cuento</span>
                  </div>
                </div>
                <h3 className="font-bold text-[11px] text-[#260b45] line-clamp-1">El caballero Carmelo</h3>
                <p className="text-[10px] text-slate-500 line-clamp-1">Abraham Valdelomar</p>
              </div>

              {/* #2 La mosca del traje azul */}
              <div
                onClick={() => {
                  setSelectedBook('La mosca del traje azul');
                  setReadingModalOpen(true);
                }}
                className="relative space-y-1.5 cursor-pointer"
              >
                <span className="absolute -left-2 -top-4 text-5xl font-black text-[#5c32a8]/15 z-0 select-none">
                  2
                </span>
                <div className="relative z-10 aspect-3/4 rounded-lg overflow-hidden bg-indigo-900 shadow-sm border border-slate-200">
                  <div className="w-full h-full bg-[#1e1b4b] p-2 flex flex-col justify-between text-white">
                    <span className="text-[7px] text-indigo-200 font-semibold">Thollot</span>
                    <span className="text-[9px] font-bold leading-tight">La mosca del traje azul</span>
                    <span className="text-[7px] text-indigo-200">Fantasía</span>
                  </div>
                </div>
                <h3 className="font-bold text-[11px] text-[#260b45] line-clamp-1">La mosca del traje azul</h3>
                <p className="text-[10px] text-slate-500 line-clamp-1">Laetitia Thollot</p>
              </div>

              {/* #3 Callejón del muerto */}
              <div
                onClick={() => {
                  setSelectedBook('El Callejón del muerto');
                  setReadingModalOpen(true);
                }}
                className="relative space-y-1.5 cursor-pointer"
              >
                <span className="absolute -left-2 -top-4 text-5xl font-black text-[#5c32a8]/15 z-0 select-none">
                  3
                </span>
                <div className="relative z-10 aspect-3/4 rounded-lg overflow-hidden bg-rose-950 shadow-sm border border-slate-200">
                  <div className="w-full h-full bg-[#4c0519] p-2 flex flex-col justify-between text-white">
                    <span className="text-[7px] text-rose-200 font-semibold">Leyenda</span>
                    <span className="text-[9px] font-bold leading-tight">El Callejón del muerto</span>
                    <span className="text-[7px] text-rose-200">Misterio</span>
                  </div>
                </div>
                <h3 className="font-bold text-[11px] text-[#260b45] line-clamp-1">El Callejón del muerto</h3>
                <p className="text-[10px] text-slate-500 line-clamp-1">Tradición mexicana</p>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* TAB 3: DESAFÍOS (Exact replica of IMG_5836) */}
      {activeTab === 'desafios' && (
        <main className="p-4 space-y-5 max-w-lg mx-auto w-full">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-[#260b45]">Desafíos</h1>
            <p className="text-xs text-[#6c687e]">¡Haz un desafío y gana recompensas!</p>
          </div>

          {/* Purple Card with 3D Books & Coin */}
          <div className="bg-linear-to-br from-[#5c32a8] to-[#451e85] text-white rounded-2xl p-5 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="bg-white/20 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                LECTURA
              </span>
              <span className="text-xs font-bold text-amber-300">🪙 +5 BeeCoins</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-4xl">📚⚡</div>
              <div>
                <h2 className="font-bold text-sm text-white">Desafío del día</h2>
                <p className="text-[11px] text-purple-200">
                  Responde 5 preguntas de comprensión del capítulo actual.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setSelectedBook('Desafío diario');
                  setReadingModalOpen(true);
                }}
                className="w-full py-2 bg-transparent border-2 border-white hover:bg-white/10 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>▶</span>
                <span>Comenzar desafío</span>
              </button>
            </div>
          </div>

          {/* Retos List */}
          <div className="bg-white rounded-2xl p-4 border border-[#e8e4f2] shadow-2xs space-y-3">
            <h3 className="font-bold text-xs text-[#260b45]">Retos activos</h3>
            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
              <span className="font-bold text-[#5c32a8]">Lectófilo</span>
              <span className="text-slate-500">0 / 10 desafíos</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="font-bold text-[#5c32a8]">Acertívoro</span>
              <span className="text-slate-500">0 / 30 preguntas</span>
            </div>
          </div>
        </main>
      )}

      {/* TAB 4: TIENDA */}
      {activeTab === 'tienda' && (
        <main className="p-4 space-y-5 max-w-lg mx-auto w-full">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-[#260b45]">Tienda Beeverso</h1>
            <p className="text-xs text-[#6c687e]">Canjea tus BeeCoins por avatares y marcos</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Avatar Zorro Sabio', price: 20, icon: '🦊' },
              { name: 'Marco Dorado', price: 35, icon: '👑' },
              { name: 'Fondo Galaxia', price: 50, icon: '🌌' },
              { name: 'Avatar Búho Erudito', price: 15, icon: '🦉' },
            ].map((item, i) => (
              <div key={i} className="bg-white p-3.5 rounded-2xl border border-[#e8e4f2] text-center space-y-2">
                <div className="text-4xl py-2">{item.icon}</div>
                <h3 className="font-bold text-xs text-[#260b45]">{item.name}</h3>
                <button className="w-full py-1 bg-[#fff8e1] border border-[#ffe082] text-[#8d6e1f] font-bold text-xs rounded-xl">
                  🪙 {item.price} BeeCoins
                </button>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* Reading / Interactive Challenge Modal */}
      {readingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-purple-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">📖</span>
                <span className="font-bold text-sm text-[#260b45]">{selectedBook}</span>
              </div>
              <button
                onClick={() => setReadingModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed font-serif">
              <p className="font-bold text-center text-[#5c32a8] text-sm">
                Tratado Primero: Cuenta Lázaro su vida y cuyo hijo fue
              </p>
              <p>
                «Pues sepa Vuestra Merced, ante todas cosas, que a mí llaman Lázaro de Tormes, hijo de Tomé González y de Antona Pérez, naturales de Tejares, aldea de Salamanca. Mi nacimiento fue dentro del río Tormes, por la cual causa tomé el sobrenombre...»
              </p>
              <p>
                «Mi viuda madre, como sin marido y sin abrigo se viese, determinó arrimarse a los buenos, por ser uno dellos, y vínose a vivir a la ciudad, y alquiló una casilla, y metióse a guisar de comer a ciertos estudiantes, y lavaba la ropa a ciertos mozos de caballos del Comendador de la Magdalena...»
              </p>
            </div>

            <div className="bg-[#f6f4fa] p-3 rounded-xl border border-purple-100 space-y-2">
              <span className="font-bold text-xs text-[#260b45] block">
                Pregunta de comprensión:
              </span>
              <p className="text-xs text-slate-700">
                ¿Por qué motivo recibió Lázaro el sobrenombre "de Tormes"?
              </p>
              <div className="space-y-1.5 pt-1">
                <button
                  onClick={() => {
                    alert('¡Correcto! +2 BeeCoins 🪙');
                    setReadingPage(readingPage + 1);
                  }}
                  className="w-full p-2 text-left rounded-lg bg-white border border-purple-200 text-xs font-semibold hover:bg-purple-50 text-slate-800"
                >
                  A) Porque nació literalmente dentro del molino junto al río Tormes.
                </button>
                <button className="w-full p-2 text-left rounded-lg bg-white border border-purple-200 text-xs font-semibold hover:bg-purple-50 text-slate-800">
                  B) Porque su padre era capitán de navío en Salamanca.
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-500">Página {readingPage} de 56</span>
              <button
                onClick={() => setReadingModalOpen(false)}
                className="px-4 py-1.5 bg-[#5c32a8] text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Cerrar lectura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real Beeverso 4-Tab Bottom Navigation Bar (Exact replica of IMG_5833, 5834, 5835, 5836) */}
      <nav className="fixed bottom-10 left-0 right-0 z-30 bg-white border-t border-[#ece7f6] px-6 py-2 flex items-center justify-around">
        {/* Tab 1: Casa (Inicio) */}
        <button
          onClick={() => setActiveTab('inicio')}
          className={`flex flex-col items-center justify-center transition-all ${
            activeTab === 'inicio'
              ? 'bg-[#5c32a8] text-white p-2.5 rounded-2xl shadow-sm'
              : 'text-slate-400 hover:text-[#5c32a8] p-2'
          }`}
        >
          <span className="text-xl">🏠</span>
        </button>

        {/* Tab 2: Biblioteca */}
        <button
          onClick={() => setActiveTab('biblioteca')}
          className={`flex flex-col items-center justify-center transition-all ${
            activeTab === 'biblioteca'
              ? 'bg-[#5c32a8] text-white p-2.5 rounded-2xl shadow-sm'
              : 'text-slate-400 hover:text-[#5c32a8] p-2'
          }`}
        >
          <span className="text-xl">🏛️</span>
        </button>

        {/* Tab 3: Desafíos (Brain with lightning) */}
        <button
          onClick={() => setActiveTab('desafios')}
          className={`flex flex-col items-center justify-center transition-all ${
            activeTab === 'desafios'
              ? 'bg-[#5c32a8] text-white p-2.5 rounded-2xl shadow-sm'
              : 'text-slate-400 hover:text-[#5c32a8] p-2'
          }`}
        >
          <span className="text-xl">🧠⚡</span>
        </button>

        {/* Tab 4: Tienda */}
        <button
          onClick={() => setActiveTab('tienda')}
          className={`flex flex-col items-center justify-center transition-all ${
            activeTab === 'tienda'
              ? 'bg-[#5c32a8] text-white p-2.5 rounded-2xl shadow-sm'
              : 'text-slate-400 hover:text-[#5c32a8] p-2'
          }`}
        >
          <span className="text-xl">🏪</span>
        </button>
      </nav>

      {/* Authentic Mobile Safari Bottom URL Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#f8f9fa] border-t border-[#d2d6dc] px-4 py-1.5 flex items-center justify-between text-[#333333]">
        <button onClick={() => {}} className="p-1 text-[#555555]">
          <ArrowLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenTabSwitcher}
          className="bg-white border border-[#c2c8d0] rounded-full px-4 py-1 flex items-center gap-2 text-xs font-mono text-[#333333] shadow-xs hover:border-[#999999]"
          title="Toca para cambiar de pestaña en Safari"
        >
          <Layers className="w-3.5 h-3.5 text-[#5c32a8]" />
          <span className="text-[11px]">student.beeverso.org</span>
          <RotateCw className="w-3.5 h-3.5 text-[#888888]" />
        </button>

        <button onClick={onOpenTabSwitcher} className="p-1 text-[#555555]">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
};
