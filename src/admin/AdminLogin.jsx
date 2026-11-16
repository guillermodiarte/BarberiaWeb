import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CONFIG } from '../config';

export const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const getRedirectPath = () => {
    const path = window.location.pathname;
    if (path.startsWith('/acceso-elite')) return '/acceso-elite';
    return '/gestion-elite';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(getRedirectPath());
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, demoPass);
      navigate(getRedirectPath());
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none -top-32 -left-32" />
      <div className="absolute w-[400px] h-[400px] bg-amber-600/10 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-xl shadow-amber-500/20 mb-4">
            <Scissors className="w-8 h-8 text-slate-950" />
          </div>
          <h1 className="text-3xl font-extrabold text-white font-heading tracking-tight">
            {CONFIG.name}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Panel de Gestión & Administración Integral
          </p>
        </div>

        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder={CONFIG.adminEmail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 text-sm mt-2"
            >
              <span>{loading ? 'Iniciando sesión...' : 'Ingresar al Sistema'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick login helpers */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-400 text-center font-semibold mb-3 uppercase tracking-wider">
              Acceso Rápido de Prueba (Demo)
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('guillermo.diarte@gmail.com', 'Gad33224122')}
                className="w-full py-2 px-3 bg-red-950/30 hover:bg-red-950/50 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center justify-between transition-colors font-bold"
              >
                <span className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-red-400" />
                  <span>⚡ SuperAdmin (Guillermo Diarte)</span>
                </span>
                <span className="text-[10px] text-red-400/70 font-mono">guillermo.diarte@gmail.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin(CONFIG.adminEmail, CONFIG.adminPassword)}
                className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-amber-400 flex items-center justify-between transition-colors font-medium"
              >
                <span className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Admin Local (Dueño)</span>
                </span>
                <span className="text-[10px] text-slate-500">{CONFIG.adminEmail}</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin(CONFIG.barber1Email, CONFIG.barber1Password)}
                className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-slate-300 flex items-center justify-between transition-colors font-medium"
              >
                <span className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Barbero 1 (Comisión 50%)</span>
                </span>
                <span className="text-[10px] text-slate-500">{CONFIG.barber1Email}</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin(CONFIG.barber3Email, CONFIG.barber3Password)}
                className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-slate-300 flex items-center justify-between transition-colors font-medium"
              >
                <span className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <span>Barbero 3 (Alquiler Fijo)</span>
                </span>
                <span className="text-[10px] text-slate-500">{CONFIG.barber3Email}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <a
            href="/"
            className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
          >
            ← Volver a la página web pública
          </a>
        </div>
      </div>
    </div>
  );
};

