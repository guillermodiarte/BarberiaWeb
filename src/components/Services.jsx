import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scissors, Sparkles, Crown, Clock, Star, Check } from 'lucide-react';
import { api } from '../api';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getServices(false)
      .then(res => {
        if (res && res.length > 0) {
          setServices(res);
        }
      })
      .catch(err => console.error('Error cargando servicios:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="servicios" className="py-20 px-4 bg-slate-900/60">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-amber-400 font-semibold text-xs uppercase tracking-widest px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
            Tarifas Oficiales Actualizadas
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4 mt-3">
            <span className="text-white">Nuestros</span>{' '}
            <span className="gradient-text">Servicios & Combos</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Cortes modernos, afeitado clásico a navaja y combos promocionales adaptados al caballero exigente.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -6 }}
              className={`p-8 rounded-3xl border transition-all flex flex-col justify-between ${
                service.is_combo
                  ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/50 shadow-xl shadow-amber-950/30'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/30">
                    {service.is_combo ? (
                      <Crown className="h-6 w-6 text-amber-400" />
                    ) : (
                      <Scissors className="h-6 w-6 text-amber-400" />
                    )}
                  </div>
                  {service.is_combo && (
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-extrabold uppercase tracking-wider rounded-full">
                      Combo Ahorro
                    </span>
                  )}
                </div>

                <h3 className="font-heading text-xl font-bold text-white mb-2">
                  {service.name}
                </h3>
                <p className="text-slate-400 text-xs mb-4 leading-relaxed">
                  {service.description || 'Atención personalizada y productos de primera línea.'}
                </p>

                {service.is_combo && service.combo_items_json && (
                  <div className="mb-4 p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-300">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">Incluye:</span>
                    {(() => {
                      try {
                        const items = JSON.parse(service.combo_items_json);
                        return items.join(' + ');
                      } catch {
                        return service.combo_items_json;
                      }
                    })()}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-2xl font-extrabold text-amber-400 font-heading">
                    ${service.price?.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">ARS</span>
                  </span>
                  <div className="flex items-center text-slate-400 text-xs">
                    <Clock className="h-3.5 w-3.5 mr-1 text-amber-400" />
                    <span>{service.duration_minutes} min</span>
                  </div>
                </div>

                <a
                  href="#reservas"
                  className="w-full block text-center py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20"
                >
                  Reservar este Servicio
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
