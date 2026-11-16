import React from 'react';
import { motion } from 'framer-motion';
import { Scissors, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { CONFIG } from '../config';
import { useTheme } from '../context/ThemeContext';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { barbershopName, barbershopAddress, barbershopPhone, onlineBookingEnabled, sectionsVisibility = {} } = useTheme();

  const handleNavClick = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const id = href.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        const headerHeight = 70;
        const targetPos = el.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        window.scrollTo({
          top: targetPos,
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center space-x-2 mb-4">
              <Scissors className="h-8 w-8 text-amber-500" />
              <span className="font-heading text-2xl font-bold gradient-text">
                {CONFIG.name}
              </span>
            </div>
            <p className="text-slate-400 text-xs mb-4 leading-relaxed">
              {CONFIG.tagline}. Donde la tradición se encuentra con el estilo moderno para crear la experiencia de cuidado definitiva.
            </p>
            <div className="flex space-x-3">
              <a 
                href={`https://instagram.com/${CONFIG.instagram}`} 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl flex items-center justify-center text-xs font-bold text-amber-400 transition-colors"
              >
                IG
              </a>
              <a 
                href={`https://wa.me/${CONFIG.phone.replace(/[^0-9]/g, '')}`} 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl flex items-center justify-center text-xs font-bold text-emerald-400 transition-colors"
              >
                WA
              </a>
            </div>
          </motion.div>

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h3 className="font-heading text-base font-bold text-white mb-4">
              Navegación Rápida
            </h3>
            <ul className="space-y-2 text-xs">
              {sectionsVisibility.services !== false && (
                <li><a href="#servicios" onClick={(e) => handleNavClick(e, '#servicios')} className="text-slate-400 hover:text-amber-400 transition-colors">Servicios & Tarifas</a></li>
              )}
              {sectionsVisibility.booking !== false && onlineBookingEnabled && (
                <li><a href="#reservas" onClick={(e) => handleNavClick(e, '#reservas')} className="text-slate-400 hover:text-amber-400 transition-colors">Reservar Turno Online</a></li>
              )}
              {sectionsVisibility.loyalty !== false && (
                <li><a href="#puntos" onClick={(e) => handleNavClick(e, '#puntos')} className="text-slate-400 hover:text-amber-400 transition-colors">Consultar Puntos Elite</a></li>
              )}
              {sectionsVisibility.about !== false && (
                <li><a href="#nosotros" onClick={(e) => handleNavClick(e, '#nosotros')} className="text-slate-400 hover:text-amber-400 transition-colors">Nuestra Historia</a></li>
              )}
              {sectionsVisibility.gallery !== false && (
                <li><a href="#galeria" onClick={(e) => handleNavClick(e, '#galeria')} className="text-slate-400 hover:text-amber-400 transition-colors">Galería de Cortes</a></li>
              )}
              {sectionsVisibility.team !== false && (
                <li><a href="#equipo" onClick={(e) => handleNavClick(e, '#equipo')} className="text-slate-400 hover:text-amber-400 transition-colors">Nuestro Equipo</a></li>
              )}
            </ul>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="font-heading text-base font-bold text-white mb-4">
              Horarios de Salón
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><strong className="text-white">Lunes a Viernes:</strong> 10:00 - 20:30 hs</li>
              <li><strong className="text-white">Sábados:</strong> 09:30 - 20:00 hs</li>
              <li><strong className="text-white">Domingos:</strong> Cerrado</li>
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="font-heading text-base font-bold text-white mb-4">
              Contacto Directo
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center space-x-2.5">
                <MapPin className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(CONFIG.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-amber-400 transition-colors"
                  title="Ver en Google Maps"
                >
                  {CONFIG.address}
                </a>
              </div>
              <div className="flex items-center space-x-2.5">
                <Phone className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span className="text-slate-400">{CONFIG.phone}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Mail className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span className="text-slate-400">{CONFIG.email}</span>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="border-t border-slate-800 mt-8 pt-8 text-center text-xs text-slate-500"
        >
          <p>© {currentYear} {CONFIG.name}. Todos los derechos reservados.</p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
