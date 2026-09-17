import React, { useState } from 'react';
import {
  Menu,
  Grid,
  MoreVertical,
  Calendar,
  FileText,
  MessageSquare,
  Paperclip,
  Clock,
  Video,
  ExternalLink,
  ChevronDown,
  Layers,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

interface ClassroomViewProps {
  onExit: () => void;
  onOpenTabSwitcher?: () => void;
}

export const ClassroomView: React.FC<ClassroomViewProps> = ({ onExit, onOpenTabSwitcher }) => {
  const [activeTab, setActiveTab] = useState<'novedades' | 'trabajo' | 'personas'>('novedades');
  const [announcementText, setAnnouncementText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [comments, setComments] = useState<string[]>([
    '¿Profesor, los ejercicios impares son obligatorios para entregar hoy?',
  ]);
  const [newComment, setNewComment] = useState('');

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments((prev) => [...prev, newComment.trim()]);
    setNewComment('');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#3c4043] font-sans flex flex-col select-none pb-16">
      {/* Google Top Bar */}
      <header className="bg-white border-b border-[#dadce0] px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenTabSwitcher}
            className="p-2 text-[#5f6368] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Pestañas de Safari"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 truncate">
            {/* Google Classroom Logo */}
            <div className="w-7 h-7 rounded-sm bg-[#137333] flex items-center justify-center text-white font-bold text-xs shadow-xs">
              <span className="text-[15px]">C</span>
            </div>
            <div className="truncate flex items-baseline gap-2">
              <span className="font-semibold text-base sm:text-lg text-[#3c4043] tracking-tight">
                Google Classroom
              </span>
              <span className="text-xs text-[#5f6368] hidden md:inline truncate">
                › Matemáticas 9° - Sección B (2026)
              </span>
            </div>
          </div>
        </div>

        {/* Center Tabs (Desktop) */}
        <div className="hidden sm:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('novedades')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'novedades'
                ? 'border-[#137333] text-[#137333] font-semibold'
                : 'border-transparent text-[#5f6368] hover:text-[#202124]'
            }`}
          >
            Novedades
          </button>
          <button
            onClick={() => setActiveTab('trabajo')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'trabajo'
                ? 'border-[#137333] text-[#137333] font-semibold'
                : 'border-transparent text-[#5f6368] hover:text-[#202124]'
            }`}
          >
            Trabajo de clase
          </button>
          <button
            onClick={() => setActiveTab('personas')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'personas'
                ? 'border-[#137333] text-[#137333] font-semibold'
                : 'border-transparent text-[#5f6368] hover:text-[#202124]'
            }`}
          >
            Personas
          </button>
        </div>

        {/* Right Google Account & Apps */}
        <div className="flex items-center gap-2">
          {onOpenTabSwitcher && (
            <button
              onClick={onOpenTabSwitcher}
              className="p-2 text-[#5f6368] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title="Ver pestañas"
            >
              <Layers className="w-5 h-5" />
            </button>
          )}
          <button className="p-2 text-[#5f6368] hover:bg-slate-100 rounded-full transition-colors hidden sm:block">
            <Grid className="w-5 h-5" />
          </button>
          <div
            onClick={onExit}
            className="w-8 h-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-bold text-xs cursor-pointer shadow-xs"
            title="Cuenta de Google Estudiantil"
          >
            E
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full px-3 sm:px-6 py-4 flex-1">
        {activeTab === 'novedades' && (
          <div className="space-y-4">
            {/* Classroom Hero Banner */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#137333] to-[#0f5132] text-white p-6 sm:p-8 shadow-sm">
              <div className="relative z-10 space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Matemáticas 9° - Sección B
                </h1>
                <p className="text-emerald-100 text-sm sm:text-base font-normal">
                  Ciclo Lectivo 2026 • Prof. Carlos Mendoza
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-emerald-200">
                  <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                    <Video className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Meet: meet.google.com/mat-9b-2026</span>
                  </div>
                  <div className="bg-black/20 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                    Código de clase: <span className="font-mono font-bold text-white">x7k9p2m</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Layout: Left Sidebar + Stream Posts */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Left Column: Upcoming Work */}
              <div className="md:col-span-1 space-y-4">
                <div className="bg-white border border-[#dadce0] rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xs font-bold text-[#3c4043] uppercase tracking-wider">
                      Próximas entregas
                    </h2>
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="text-xs space-y-1">
                      <span className="text-[#d93025] font-semibold block flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Hoy, 23:59
                      </span>
                      <p className="text-[#3c4043] font-medium leading-snug hover:text-[#137333] cursor-pointer">
                        Guía evaluada #4: Sistemas de Ecuaciones Lineales
                      </p>
                    </div>
                    <div className="text-xs space-y-1 pt-2 border-t border-[#f1f3f4]">
                      <span className="text-[#5f6368] font-medium block">
                        Viernes, 14:00
                      </span>
                      <p className="text-[#3c4043] font-medium leading-snug hover:text-[#137333] cursor-pointer">
                        Reporte de práctica con GeoGebra
                      </p>
                    </div>
                  </div>
                  <button className="w-full text-right text-xs font-bold text-[#137333] hover:underline pt-3 block">
                    Ver todo
                  </button>
                </div>
              </div>

              {/* Center/Right: Stream Posts */}
              <div className="md:col-span-3 space-y-4">
                {/* Compose Announcement */}
                <div className="bg-white border border-[#dadce0] rounded-xl p-4 shadow-2xs">
                  {!isComposing ? (
                    <div
                      onClick={() => setIsComposing(true)}
                      className="flex items-center gap-3 cursor-pointer text-[#5f6368] hover:text-[#202124]"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#137333] text-white flex items-center justify-center font-bold text-xs">
                        E
                      </div>
                      <span className="text-xs sm:text-sm">Anuncia algo a tu clase...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={announcementText}
                        onChange={(e) => setAnnouncementText(e.target.value)}
                        placeholder="Escribe un anuncio para la clase de Matemáticas..."
                        rows={3}
                        className="w-full text-xs sm:text-sm border border-[#dadce0] rounded-lg p-3 focus:outline-none focus:border-[#137333]"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <button className="p-2 text-[#5f6368] hover:bg-slate-100 rounded-full">
                          <Paperclip className="w-4 h-4" />
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setIsComposing(false)}
                            className="px-3 py-1.5 text-xs text-[#5f6368] hover:bg-slate-100 rounded-md font-semibold"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => {
                              setIsComposing(false);
                              setAnnouncementText('');
                            }}
                            className="px-4 py-1.5 text-xs bg-[#137333] text-white rounded-md font-semibold shadow-xs hover:bg-[#0f5132]"
                          >
                            Publicar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Teacher Announcement Post */}
                <div className="bg-white border border-[#dadce0] rounded-xl p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-bold text-sm">
                        CM
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-[#3c4043] block">
                          Prof. Carlos Mendoza
                        </span>
                        <span className="text-[11px] text-[#5f6368]">
                          16 sep. 08:30 (Editado)
                        </span>
                      </div>
                    </div>
                    <button className="text-[#5f6368] hover:text-[#202124] p-1 rounded-full">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-[#3c4043] leading-relaxed">
                    Estimados alumnos: Adjunto la guía de ejercicios de repaso para la evaluación parcial de la próxima semana. Los ejercicios del 1 al 12 deben resolverse paso a paso indicando el método empleado (Sustitución, Reducción o Igualación).
                  </p>

                  {/* Attachment Card */}
                  <div className="border border-[#dadce0] hover:border-[#137333] rounded-xl p-3 flex items-center justify-between gap-3 bg-[#f8f9fa] cursor-pointer transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[#d93025] text-white flex items-center justify-center font-black text-xs shrink-0">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-[#3c4043] block truncate">
                          Guia_Sistemas_Ecuaciones_9B_2026.pdf
                        </span>
                        <span className="text-[11px] text-[#5f6368]">
                          Documento PDF • 1.4 MB
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[#5f6368] shrink-0" />
                  </div>

                  {/* Comments Section */}
                  <div className="pt-3 border-t border-[#f1f3f4] space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-[#5f6368] font-semibold">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{comments.length} comentarios de clase</span>
                    </div>

                    {comments.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs bg-[#f8f9fa] p-2.5 rounded-lg">
                        <span className="font-bold text-[#3c4043] shrink-0">Sofía V.:</span>
                        <span className="text-[#5f6368]">{c}</span>
                      </div>
                    ))}

                    <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Añade un comentario de clase..."
                        className="flex-1 bg-white border border-[#dadce0] rounded-full px-3.5 py-1.5 text-xs text-[#3c4043] focus:outline-none focus:border-[#137333]"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-[#137333] text-white text-xs font-semibold rounded-full hover:bg-[#0f5132]"
                      >
                        Enviar
                      </button>
                    </form>
                  </div>
                </div>

                {/* Assignment Post */}
                <div className="bg-white border border-[#dadce0] rounded-xl p-4 shadow-2xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#137333] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-[#3c4043] block">
                        Carlos Mendoza publicó una nueva tarea: Tarea #4 - Funciones Lineales
                      </span>
                      <span className="text-[11px] text-[#5f6368]">
                        Fecha de entrega: Hoy, 23:59
                      </span>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-[#137333] hover:underline shrink-0">
                    Abrir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trabajo' && (
          <div className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-xs space-y-6">
            <h2 className="text-xl font-bold text-[#3c4043]">Trabajo de clase</h2>

            {/* Unit 3 */}
            <div className="space-y-3">
              <div className="border-b-2 border-[#137333] pb-2 flex items-center justify-between">
                <h3 className="font-bold text-base text-[#137333]">
                  Unidad 3: Álgebra y Ecuaciones Lineales
                </h3>
                <span className="text-xs text-[#5f6368]">3 tareas</span>
              </div>

              <div className="space-y-2">
                <div className="border border-[#dadce0] rounded-xl p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-[#3c4043] block">
                        Guía evaluada #4: Sistemas de Ecuaciones
                      </span>
                      <span className="text-[11px] text-[#5f6368]">
                        Entrega: Hoy 23:59 • Calificación: 100 pts
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    Asignada
                  </span>
                </div>

                <div className="border border-[#dadce0] rounded-xl p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-[#3c4043] block">
                        Laboratorio virtual: Representación gráfica de funciones
                      </span>
                      <span className="text-[11px] text-[#5f6368]">
                        Entrega: Viernes 14:00 • Calificación: 50 pts
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                    Sin entregar
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'personas' && (
          <div className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#137333] border-b-2 border-[#137333] pb-2 mb-3">
                Profesores
              </h3>
              <div className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-bold text-xs">
                  CM
                </div>
                <span className="text-xs sm:text-sm font-semibold text-[#3c4043]">
                  Carlos Mendoza (Profesor Titular)
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between border-b-2 border-[#137333] pb-2 mb-3">
                <h3 className="text-base font-bold text-[#137333]">Compañeros de clase</h3>
                <span className="text-xs text-[#5f6368]">28 alumnos</span>
              </div>
              <div className="space-y-2">
                {['Alejandro Morales', 'Camila Fernández', 'Diego Ramírez', 'Esteban Silva', 'Lucía Torres', 'Mateo Gómez', 'Valentina Castro'].map((name, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-1.5 border-b border-[#f1f3f4] last:border-0">
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                      {name[0]}
                    </div>
                    <span className="text-xs text-[#3c4043] font-medium">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
