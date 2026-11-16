import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CONFIG } from '../config';
import { useTheme } from '../context/ThemeContext';

const Header = () => {
  const { barbershopName, logoUrl, currentTheme, onlineBookingEnabled, sectionsVisibility = {} } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const allMenuItems = [
    { name: 'Inicio', href: '#inicio', key: 'hero' },
    { name: 'Servicios', href: '#servicios', key: 'services' },
    { name: 'Reservar Turno', href: '#reservas', key: 'booking' },
    { name: 'Puntos Elite', href: '#puntos', key: 'loyalty' },
    { name: 'Historia', href: '#nosotros', key: 'about' },
    { name: 'Galería', href: '#galeria', key: 'gallery' },
    { name: 'Equipo', href: '#equipo', key: 'team' },
    { name: 'Contacto', href: '#contacto', key: 'contact' }
  ];

  const menuItems = allMenuItems.filter(item => {
    if (item.key === 'hero') return true;
    return sectionsVisibility[item.key] !== false;
  });

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
      setIsOpen(false);
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'glass-effect shadow-2xl bg-slate-950/80 backdrop-blur-md border-b border-white/10' 
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      {currentTheme.id === 'barber_pole' && (
        <div className="h-1.5 w-full barber-pole-stripes" />
      )}
      <nav className="container mx-auto px-4 py-3.5">
        <div className="flex items-center justify-between">
          <a 
            href="#inicio" 
            onClick={(e) => handleNavClick(e, '#inicio')}
            className="flex items-center space-x-2.5"
          >
            {logoUrl ? (
              <img src={logoUrl} alt={barbershopName} className="h-9 w-auto object-contain rounded" />
            ) : currentTheme.id === 'barber_pole' ? (
              <span className="text-2xl animate-pulse">💈</span>
            ) : (
              <Scissors className="h-8 w-8 text-amber-500" style={{ color: currentTheme.primary }} />
            )}
            <span className="font-heading text-2xl font-bold gradient-text">
              {barbershopName}
            </span>
          </a>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-6">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="text-white/90 hover:text-amber-400 transition-colors font-medium text-sm drop-shadow-sm"
              >
                {item.name}
              </a>
            ))}

            {sectionsVisibility.booking !== false && onlineBookingEnabled && (
              <a
                href="#reservas"
                onClick={(e) => handleNavClick(e, '#reservas')}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-amber-500/20"
              >
                Reservar Cita
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white p-2 hover:bg-slate-800/60 rounded-xl transition-colors"
              aria-label="Abrir menú"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden mt-3 glass-effect bg-slate-950/95 rounded-2xl p-4 border border-slate-800 space-y-2 text-sm shadow-xl"
          >
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="block py-2 text-white hover:text-amber-400 transition-colors"
                onClick={(e) => handleNavClick(e, item.href)}
              >
                {item.name}
              </a>
            ))}
            {sectionsVisibility.booking !== false && onlineBookingEnabled && (
              <a
                href="#reservas"
                className="block w-full text-center py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl mt-2"
                onClick={(e) => handleNavClick(e, '#reservas')}
              >
                Reservar Cita
              </a>
            )}
          </motion.div>
        )}
      </nav>
    </motion.header>
  );
};

export default Header;
