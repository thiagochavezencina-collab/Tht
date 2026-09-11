import React, { useRef, useState } from 'react';
import { Subtitles, Upload, Trash2, Plus, Check, FileText } from 'lucide-react';
import { SubtitleTrack } from '../types';
import { readSubtitleFile } from '../utils/subtitleHelper';

interface SubtitleFormSectionProps {
  subtitles: SubtitleTrack[];
  onChange: (updated: SubtitleTrack[]) => void;
}

export const SubtitleFormSection: React.FC<SubtitleFormSectionProps> = ({
  subtitles,
  onChange,
}) => {
  const [newLabel, setNewLabel] = useState('Español');
  const [newLang, setNewLang] = useState('es');
  const [newUrl, setNewUrl] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      const { fileName, cues } = await readSubtitleFile(file);
      const isSpanish = /es|esp|spa|lat/i.test(fileName);
      const detectedLang = isSpanish ? 'es' : 'en';

      const newTrack: SubtitleTrack = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        lang: detectedLang,
        label: fileName.replace(/\.[^/.]+$/, ''),
        fileName,
        cues,
      };

      onChange([...subtitles, newTrack]);
    } catch (err: any) {
      alert(err?.message || 'Error al leer el archivo de subtítulos');
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUrlTrack = () => {
    if (!newUrl.trim()) return;

    const newTrack: SubtitleTrack = {
      id: `sub-url-${Date.now()}`,
      lang: newLang,
      label: newLabel.trim() || (newLang === 'es' ? 'Español' : 'English'),
      url: newUrl.trim(),
    };

    onChange([...subtitles, newTrack]);
    setNewUrl('');
  };

  const handleRemoveTrack = (index: number) => {
    onChange(subtitles.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-3 bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Subtitles className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Subtítulos ({subtitles.length})
          </span>
        </div>
        <span className="text-[11px] text-zinc-500">Opcional</span>
      </div>

      {/* Existing subtitles list */}
      {subtitles.length > 0 && (
        <div className="space-y-2">
          {subtitles.map((sub, idx) => (
            <div
              key={sub.id || idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <div className="truncate">
                  <span className="font-semibold text-zinc-200 block truncate">
                    {sub.label || `Pista ${idx + 1}`}
                  </span>
                  <span className="text-[10px] text-zinc-400 block truncate">
                    {sub.fileName
                      ? `Archivo: ${sub.fileName} (${sub.cues?.length || 0} líneas)`
                      : sub.url
                      ? `URL: ${sub.url}`
                      : 'Subtítulos cargados'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded">
                  {sub.lang}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveTrack(idx)}
                  className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Eliminar pista"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload .srt / .vtt file */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".srt,.vtt,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          type="button"
          disabled={isProcessingFile}
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-dashed border-zinc-700 hover:border-rose-500 text-xs font-semibold text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-rose-400" />
          <span>{isProcessingFile ? 'Leyendo subtítulos...' : '+ Cargar archivo de subtítulos (.srt o .vtt)'}</span>
        </button>
      </div>

      {/* Or Add via URL */}
      <div className="pt-2 border-t border-zinc-800/80">
        <span className="text-[11px] text-zinc-400 block mb-1.5 font-medium">
          O añadir subtítulos por enlace directo (.vtt o .srt):
        </span>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={newLang}
            onChange={(e) => {
              setNewLang(e.target.value);
              if (e.target.value === 'es') setNewLabel('Español');
              if (e.target.value === 'en') setNewLabel('English');
            }}
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
          >
            <option value="es">Español (ES)</option>
            <option value="en">English (EN)</option>
            <option value="pt">Português (PT)</option>
            <option value="fr">Français (FR)</option>
            <option value="other">Otro</option>
          </select>

          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Etiqueta (ej. Español Latino)"
            className="w-full sm:w-36 bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
          />

          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://.../subtitulos.vtt"
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
          />

          <button
            type="button"
            disabled={!newUrl.trim()}
            onClick={handleAddUrlTrack}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs font-semibold text-rose-400 border border-zinc-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
