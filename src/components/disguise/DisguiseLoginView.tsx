import React, { useState } from 'react';
import { Lock, ShieldCheck, HelpCircle, ArrowRight, BookOpen } from 'lucide-react';
import { APP_PIN_STORAGE_KEY, DEFAULT_APP_PIN } from '../PinLockScreen';

interface DisguiseLoginViewProps {
  platform: 'aleks' | 'pearson' | 'beeverso';
  onExitDisguise: () => void;
  onSwitchToStudyView: () => void;
  onOpenTabSwitcher?: () => void;
}

export const DisguiseLoginView: React.FC<DisguiseLoginViewProps> = ({
  platform,
  onExitDisguise,
  onSwitchToStudyView,
}) => {
  const [username, setUsername] = useState('estudiante.general@colegio.edu.pe');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const getStoredPin = (): string => {
    try {
      const stored = localStorage.getItem(APP_PIN_STORAGE_KEY);
      if (stored && /^\d{4}$/.test(stored)) return stored;
    } catch {}
    return DEFAULT_APP_PIN;
  };

  const handleFakeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = getStoredPin();

    // Secret: If the user inputs the 4-digit CineStream PIN in the password or username field, unlock CineStream!
    if (
      password.trim() === correctPin ||
      username.trim() === correctPin ||
      password.trim() === '6767' ||
      username.trim() === '6767'
    ) {
      onExitDisguise();
      return;
    }

    // Otherwise, simulate authentic school login authentication and switch to the educational view
    setStatusMessage('Autenticando con el servidor institucional...');
    setTimeout(() => {
      setStatusMessage(null);
      onSwitchToStudyView();
    }, 900);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col justify-between font-sans select-none text-slate-800 antialiased">
      {/* Institutional Top Header */}
      <header className="bg-white border-b border-[#e5e7eb] px-4 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {platform === 'pearson' ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-[#002f5e]">))Pearson</span>
                <span className="text-xs font-semibold text-slate-500 pl-2 border-l border-slate-300">
                  MyLab & Mastering
                </span>
              </div>
            ) : platform === 'beeverso' ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-amber-500">
                  bee<span className="text-[#5b21b6]">verso</span>
                </span>
                <span className="text-xs font-semibold text-slate-500 pl-2 border-l border-slate-300">
                  Plataforma de Comprensión
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#005a66] rounded-xs flex items-center justify-center text-white font-bold text-sm">
                  A
                </div>
                <span className="text-xl font-bold tracking-tight text-[#005a66]">ALEKS®</span>
                <span className="text-xs font-medium text-slate-500 hidden sm:inline">
                  McGraw-Hill Education
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="hidden sm:inline">Red Escolar Protegida</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <button
              onClick={onSwitchToStudyView}
              className="text-xs font-semibold text-[#005a66] hover:underline cursor-pointer flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Ver Actividades</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white border border-[#d1d5db] rounded-lg shadow-sm p-6 sm:p-8 space-y-5">
          {/* Institution Banner */}
          <div className="text-center space-y-1 pb-3 border-b border-slate-100">
            <div className="inline-flex p-2.5 bg-slate-50 rounded-full border border-slate-200 text-slate-600 mb-1">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Inicio de Sesión del Estudiante
            </h2>
            <p className="text-xs text-slate-500">
              {platform === 'pearson'
                ? 'Accede con tu cuenta Pearson o correo institucional'
                : platform === 'beeverso'
                ? 'Ingresa tus credenciales Beereaders para continuar la lectura'
                : 'Accede a tu cuenta institucional de ALEKS®'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleFakeLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre de usuario o Correo del colegio
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-[#f9fafb] border border-[#d1d5db] rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#005a66] focus:bg-white"
                placeholder="usuario@colegio.edu.pe"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Contraseña / Clave Institucional
                </label>
                <span className="text-[11px] text-[#005a66] hover:underline cursor-pointer">
                  ¿Olvidó su contraseña?
                </span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#f9fafb] border border-[#d1d5db] rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#005a66] focus:bg-white"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded-xs border-slate-300 text-[#005a66] focus:ring-[#005a66]"
                />
                <span>Recordar usuario en este equipo</span>
              </label>
              <span className="text-[11px] text-slate-400">SSL 256-bit</span>
            </div>

            {statusMessage && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-md text-center font-medium">
                {statusMessage}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#005a66] hover:bg-[#004852] text-white text-sm font-bold rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Iniciar Sesión</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick SSO Divider */}
          <div className="pt-2 border-t border-slate-100">
            <span className="block text-center text-[11px] text-slate-400 mb-2">
              O ingresar mediante Single Sign-On
            </span>
            <button
              type="button"
              onClick={onSwitchToStudyView}
              className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Acceso Rápido con Google Workspace Institucional</span>
            </button>
          </div>
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="bg-white border-t border-[#e5e7eb] px-4 py-3 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} McGraw-Hill Education / Pearson Education. Todos los derechos reservados.
          </span>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="hover:underline cursor-pointer">Términos de Servicio</span>
            <span className="hover:underline cursor-pointer">Privacidad de Estudiantes</span>
            {/* Secret clickable trigger disguised as help link */}
            <button
              onClick={onExitDisguise}
              className="hover:underline cursor-pointer text-slate-400 hover:text-slate-600 flex items-center gap-1"
              title="Volver a CineStream"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Soporte</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
