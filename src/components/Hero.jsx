import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Scissors, MessageSquare, ArrowRight } from 'lucide-react';
import { useTheme, DEFAULT_BANNER_SLIDES } from '../context/ThemeContext';

const Hero = () => {
  const { 
    barbershopName, 
    barbershopPhone, 
    currentTheme, 
    bannerSlides, 
    bannerInterval, 
    onlineBookingEnabled 
  } = useTheme();

  const slides = (bannerSlides && bannerSlides.length > 0) ? bannerSlides : DEFAULT_BANNER_SLIDES;
  const intervalSeconds = bannerInterval || 5;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-play interval
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, intervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [slides.length, intervalSeconds, isPaused, currentIndex]);

  const prevSlide = () => {
    setCurrentIndex(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex(prev => (prev + 1) % slides.length);
  };

  const currentSlide = slides[currentIndex] || slides[0];

  return (
    <section 
      id="inicio" 
      className="relative min-h-[85vh] md:min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 pt-20"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Slides with AnimatePresence */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id || currentIndex}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <img  
              className="w-full h-full object-cover object-center" 
              alt={currentSlide.title || "Barbería Banner"}
              src={currentSlide.image_url || currentSlide.image} 
            />
            {/* Dark & Theme Dynamic Gradient Overlays for High Contrast Text */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide Text Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-8 py-16 text-center md:text-left flex flex-col items-center md:items-start justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id || currentIndex}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="space-y-6 max-w-3xl"
          >
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-lg">
              <Scissors className="w-3.5 h-3.5 text-amber-400" />
              <span>{barbershopName}</span>
            </div>

            <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md">
              {currentSlide.title}
            </h1>

            <p className="text-base sm:text-xl text-slate-300 leading-relaxed font-light drop-shadow">
              {currentSlide.subtitle}
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              {onlineBookingEnabled ? (
                <a
                  href="#reservas"
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-base rounded-2xl shadow-xl shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2"
                >
                  <Scissors className="w-5 h-5 text-slate-950" />
                  <span>Reservar Turno Online</span>
                </a>
              ) : (
                <a
                  href={`https://wa.me/${(barbershopPhone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${barbershopName}! Quisiera consultar por un turno.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-emerald-950/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-5 h-5 text-white" />
                  <span>Consultar por WhatsApp</span>
                </a>
              )}

              <a
                href="#servicios"
                className="w-full sm:w-auto px-7 py-4 bg-slate-900/80 hover:bg-slate-800 text-white hover:text-amber-400 font-bold text-base rounded-2xl border border-slate-700/80 hover:border-amber-500/50 transition-all backdrop-blur-md flex items-center justify-center space-x-2"
              >
                <span>Ver Servicios</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Prev / Next Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Foto anterior"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-950/60 hover:bg-slate-900 text-white/80 hover:text-white border border-slate-800/80 hover:border-amber-500/50 backdrop-blur-md flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Siguiente foto"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-950/60 hover:bg-slate-900 text-white/80 hover:text-white border border-slate-800/80 hover:border-amber-500/50 backdrop-blur-md flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Slide Pagination Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2.5 px-3.5 py-2 rounded-full bg-slate-950/70 border border-slate-800/80 backdrop-blur-md shadow-lg">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Ir a slide ${idx + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-8 bg-amber-500 shadow-sm shadow-amber-500/50'
                  : 'w-2.5 bg-slate-600 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Hero;
