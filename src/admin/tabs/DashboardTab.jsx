import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Scissors, Users, Calendar, AlertTriangle, 
  TrendingUp, Wallet, ArrowDownRight, ArrowUpRight, CheckCircle2, ShoppingBag
} from 'lucide-react';
import { api } from '../../api';

export const DashboardTab = ({ setActiveTab, user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then(res => setStats(res))
      .catch(err => console.error('Error cargando stats:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mr-3" />
        <span>Cargando métricas del sistema...</span>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">
            {isSuperAdmin ? '⚡ Panel de SuperAdministrador' : isAdmin ? 'Panel de Control Principal' : 'Panel Personal de Barbero'}
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            ¡Hola, {user?.full_name}! 👋
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isSuperAdmin
              ? 'Acceso maestro: monitoreo global de métricas, configuración de marca, logos y paleta de colores.'
              : isAdmin 
              ? 'Monitoreo en tiempo real de finanzas, cortes, caja física, stock y reservas.'
              : `Esquema actual: ${user?.payment_scheme === 'commission' ? `Comisión del ${user?.commission_percentage}% por corte` : 'Alquiler Fijo de Espacio'}.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveTab('cortes')}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2"
          >
            <Scissors className="w-4 h-4 text-slate-950" />
            <span>Registrar Corte</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('caja')}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition-all flex items-center space-x-2 border border-slate-700"
            >
              <Wallet className="w-4 h-4 text-amber-400" />
              <span>Cierre de Caja</span>
            </button>
          )}
        </div>
      </div>

      {/* ADMIN STATS */}
      {isAdmin && stats && (
        <div className="space-y-6">
          {/* Main Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Cash Drawer */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Efectivo en Caja (Físico)</span>
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-400 font-heading">
                ${stats.current_cash_drawer?.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">ARS</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Recaudado físicamente por administración pendiente de arqueo.
              </p>
            </div>

            {/* Transfers */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Transferencias a Barbería</span>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-extrabold text-cyan-400 font-heading">
                ${stats.current_transfers_shop?.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">ARS</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Acreditado en cuenta bancaria/MP de la barbería.
              </p>
            </div>

            {/* Net Profit Month */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Ganancia Neta (Mes)</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold text-amber-400 font-heading">
                ${stats.net_profit_month?.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">ARS</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Ingresos brutos menos comisiones de barberos y gastos.
              </p>
            </div>

            {/* Cuts Today */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Cortes Hoy</span>
                <Scissors className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold text-white font-heading">
                {stats.cuts_today_count} <span className="text-xs font-normal text-slate-400">servicios (${stats.gross_today?.toLocaleString('es-AR')} ARS)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {stats.cuts_month_count} cortes realizados en el mes.
              </p>
            </div>
          </div>

          {/* Operational Alerts & Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Low stock card */}
            <div 
              onClick={() => setActiveTab('inventario')}
              className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 p-5 rounded-2xl cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Alertas de Stock</span>
                <AlertTriangle className={`w-4 h-4 ${stats.low_stock_count > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-3xl font-bold ${stats.low_stock_count > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {stats.low_stock_count}
                </span>
                <span className="text-xs text-slate-400">
                  {stats.low_stock_count > 0 ? 'Ítems por debajo del stock mínimo' : 'Stock en niveles óptimos'}
                </span>
              </div>
            </div>

            {/* Pending bookings */}
            <div 
              onClick={() => setActiveTab('turnos')}
              className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 p-5 rounded-2xl cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Turnos Pendientes</span>
                <Calendar className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold text-amber-400">
                  {stats.pending_bookings_count}
                </span>
                <span className="text-xs text-slate-400">
                  {stats.pending_bookings_count > 0 ? 'Reservas esperando confirmación' : 'Sin turnos pendientes'}
                </span>
              </div>
            </div>

            {/* Unsettled transactions */}
            <div 
              onClick={() => setActiveTab('caja')}
              className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 p-5 rounded-2xl cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Operaciones sin Liquidar</span>
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold text-emerald-400">
                  {stats.unsettled_records_count}
                </span>
                <span className="text-xs text-slate-400">
                  Cortes y ventas listas para el próximo cierre de caja
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BARBER PERSONAL STATS */}
      {!isAdmin && stats && (
        <div className="space-y-6">
          {/* Liquidation & Settlement Status Banner */}
          <div className={`p-6 rounded-3xl border ${
            stats?.settlement_status?.includes('Debes entregar')
              ? 'bg-rose-950/20 border-rose-500/40'
              : stats?.settlement_status?.includes('debe pagarte')
              ? 'bg-emerald-950/20 border-emerald-500/40'
              : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Estado de Liquidación Personal (Quién le debe a quién)
                </span>
                <h3 className="text-xl md:text-2xl font-bold text-white mt-1">
                  {stats?.settlement_status || 'Al día'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Calculado automáticamente según quién cobró físicamente el dinero de tus cortes y ventas de productos.
                </p>
              </div>

              <div className="text-right">
                <span className="text-3xl md:text-4xl font-extrabold text-amber-400 font-heading">
                  ${stats.balance_amount?.toLocaleString('es-AR')} <span className="text-sm font-normal text-slate-400">ARS</span>
                </span>
                <span className="block text-[11px] text-slate-400">Dinero retenido por ti: ${stats.money_held?.toLocaleString('es-AR')} ARS</span>
              </div>
            </div>
          </div>

          {/* Barber Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tus Cortes Hoy</span>
              <div className="text-2xl font-bold text-white font-heading mt-2">
                {stats.cuts_today_count} servicios
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {stats.cuts_month_count} cortes acumulados en el mes
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ganancias del Mes</span>
              <div className="text-2xl font-bold text-amber-400 font-heading mt-2">
                ${stats.month_barber_earnings?.toLocaleString('es-AR')} ARS
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Comisión acumulada por servicios y venta de productos
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Turnos Asignados</span>
              <div className="text-2xl font-bold text-cyan-400 font-heading mt-2">
                {stats.upcoming_bookings_count} turnos
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Reservas confirmadas o pendientes para próximos días
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

