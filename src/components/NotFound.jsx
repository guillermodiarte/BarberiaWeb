import React from 'react';
import { motion } from 'framer-motion';
import { Scissors, Home, MessageSquare } from 'lucide-react';
import { CONFIG } from '../config';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/20 flex flex-col items-center justify-center px-6 text-white">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'repeating-linear-gradient(-45deg, #f59e0b 0px, #f59e0b 1px, transparent 1px, transparent 20px)'
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 text-center max-w-lg"
      >
        {/* Logo / Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-slate-900 border border-amber-500/30 shadow-2xl shadow-amber-500/10 mb-8">
          <Scissors className="w-12 h-12 text-amber-500" />
        </div>

        {/* 404 Number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-heading font-black text-[8rem] leading-none text-transparent bg-clip-text"
          style={{ backgroundImage: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
        >
          404
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="font-heading text-2xl sm:text-3xl font-bold text-white mb-3 mt-2"
        >
          Página no encontrada
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-slate-400 text-sm sm:text-base leading-relaxed mb-10"
        >
          Esta dirección no existe en <strong className="text-amber-400">{CONFIG.name}</strong>.<br />
          Puede que el enlace esté mal escrito o haya sido eliminado.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a
            href="/"
            className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Home className="w-5 h-5" />
            <span>Volver al Inicio</span>
          </a>

          <a
            href={`https://wa.me/${(CONFIG.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${CONFIG.name}! Quisiera información.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center space-x-2 px-7 py-4 bg-slate-900/80 hover:bg-slate-800 text-white hover:text-amber-400 font-bold text-sm rounded-2xl border border-slate-700 hover:border-amber-500/50 transition-all backdrop-blur-md"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Contactar por WhatsApp</span>
          </a>
        </motion.div>

        {/* Decorative bottom text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-12 text-xs text-slate-600"
        >
          © {new Date().getFullYear()} {CONFIG.name} · Todos los derechos reservados
        </motion.p>
      </motion.div>
    </div>
  );
};

export default NotFound;
