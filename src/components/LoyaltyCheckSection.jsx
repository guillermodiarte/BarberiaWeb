import React, { useState, useEffect } from 'react';
import { Award, Search, Gift, Sparkles, Check, AlertCircle } from 'lucide-react';
import { api } from '../api';
import { CONFIG } from '../config';

export const LoyaltyCheckSection = () => {
  const [query, setQuery] = useState('');
  const [customer, setCustomer] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    // Fetch available rewards catalog
    api.getRewards()
      .then(res => setRewards(res))
      .catch(() => {});
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const data = await api.getCustomerLookup(query.trim());
      setCustomer(data);
    } catch (err) {
      setCustomer(null);
      setError('No encontramos un cliente registrado con ese número de teléfono o DNI. Recuerda solicitar a tu barbero que registre tu corte en tu próxima visita para empezar a sumar puntos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="puntos" className="py-20 px-4 bg-slate-900 border-t border-slate-800 text-white relative">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold uppercase tracking-widest mb-3">
            <Award className="w-4 h-4" />
            <span>Club {CONFIG.name}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold font-heading text-white">
            Programa de <span className="gradient-text">Fidelización y Puntos</span>
          </h2>
          <p className="mt-2 text-slate-400 max-w-xl mx-auto text-sm md:text-base">
            Cada vez que te cortas el cabello o compras productos sumas puntos automáticos. Exige tu ticket o registro a tu barbero y canjea por cortes gratis o descuentos.
          </p>
        </div>

        {/* Search card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl max-w-2xl mx-auto mb-10">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ingresa tu Teléfono o DNI..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20"
            >
              <span>{loading ? 'Consultando...' : 'Consultar Puntos'}</span>
            </button>
          </form>

          {/* Results display */}
          {customer && (
            <div className="mt-6 p-6 bg-gradient-to-br from-amber-950/30 to-slate-900 border border-amber-500/40 rounded-2xl animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span className="text-xs uppercase tracking-wider text-amber-300 font-bold">Cliente Elite</span>
                  </div>
                  <h4 className="text-xl font-bold text-white mt-1">{customer.full_name}</h4>
                  <p className="text-xs text-slate-400">Tel: {customer.phone} {customer.dni ? `| DNI: ${customer.dni}` : ''}</p>
                </div>
                <div className="text-center sm:text-right bg-slate-950/60 px-5 py-3 rounded-xl border border-slate-800">
                  <span className="text-3xl font-extrabold text-amber-400 font-heading">
                    {customer.loyalty_points}
                  </span>
                  <span className="block text-xs uppercase tracking-wider text-slate-400 font-semibold">Puntos Acumulados</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
                💡 <em>Muestra tu nombre o teléfono en la caja para canjear cualquiera de los premios disponibles.</em>
              </div>
            </div>
          )}

          {error && searched && (
            <div className="mt-4 p-4 bg-slate-900/90 border border-amber-500/20 rounded-xl text-xs text-slate-300 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Catalog of rewards */}
        <div>
          <h3 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center space-x-2">
            <Gift className="w-5 h-5 text-amber-400" />
            <span>Premios y Canjes Disponibles en el Salón</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rewards.map((r) => (
              <div
                key={r.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold">
                      {r.points_required} PUNTOS
                    </span>
                    <Gift className="w-5 h-5 text-amber-400/80" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">{r.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{r.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-amber-400/90 flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Canjeable al instante en caja</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

