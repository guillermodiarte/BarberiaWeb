import React, { useState, useEffect } from 'react';
import { 
  Wallet, DollarSign, ArrowDownRight, ArrowUpRight, CheckCircle2, 
  Calendar, History, Eye, AlertCircle, FileText, TrendingUp, Users,
  Clock, Scissors, ShoppingBag, ShieldCheck, RefreshCw
} from 'lucide-react';
import { api } from '../../api';
import { Modal, ConfirmDialog } from '../../components/common/Modal';

const FREQUENCY_LABELS = {
  daily: 'Por Día / Turno',
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual'
};

export const CashClosingTab = ({ user }) => {
  // Main view navigation: 'shifts' | 'global' | 'history'
  const [activeView, setActiveView] = useState('shifts');

  // Barber shifts state
  const [barbersStatus, setBarbersStatus] = useState([]);
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [selectedBarberForShift, setSelectedBarberForShift] = useState(null);
  const [shiftNotes, setShiftNotes] = useState('');
  const [closingShift, setClosingShift] = useState(false);

  // Global closing preview state
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [periodType, setPeriodType] = useState('daily');
  const [isConfirmGlobalOpen, setIsConfirmGlobalOpen] = useState(false);
  const [globalClosingNotes, setGlobalClosingNotes] = useState('');
  const [executingGlobal, setExecutingGlobal] = useState(false);

  // History state
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'global' | 'barber_shift'
  const [selectedClosing, setSelectedClosing] = useState(null);

  // --- Loaders ---
  const loadBarbersStatus = async () => {
    setLoadingShifts(true);
    try {
      const data = await api.getBarbersStatus();
      setBarbersStatus(data || []);
    } catch (err) {
      console.error('Error cargando estado de barberos:', err);
    } finally {
      setLoadingShifts(false);
    }
  };

  const loadGlobalPreview = async () => {
    setLoadingPreview(true);
    try {
      const data = await api.getCashClosingPreview(startDate, endDate);
      setPreview(data);
    } catch (err) {
      console.error('Error cargando preview global de control de caja:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const filterType = historyFilter === 'all' ? null : historyFilter;
      const hist = await api.getCashClosingHistory(filterType);
      setHistory(hist || []);
    } catch (err) {
      console.error('Error cargando historial de cierres:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadBarbersStatus();
  }, []);

  useEffect(() => {
    if (activeView === 'global') {
      loadGlobalPreview();
    } else if (activeView === 'history') {
      loadHistory();
    }
  }, [activeView, startDate, endDate, historyFilter]);

  const handlePeriodQuickSelect = (type) => {
    setPeriodType(type);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (type === 'daily') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      setStartDate(weekAgo.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (type === 'biweekly') {
      const biweekAgo = new Date();
      biweekAgo.setDate(now.getDate() - 15);
      setStartDate(biweekAgo.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (type === 'monthly') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(monthStart.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  };

  // --- Execute Shift Closing (per Barber) ---
  const handleOpenShiftModal = (barber) => {
    setSelectedBarberForShift(barber);
    setShiftNotes(`Cierre de turno ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`);
  };

  const handleConfirmShiftClose = async () => {
    if (!selectedBarberForShift) return;
    setClosingShift(true);
    try {
      const now = new Date();
      const payload = {
        closing_type: 'barber_shift',
        barber_id: selectedBarberForShift.barber_id,
        period_type: selectedBarberForShift.payout_frequency || 'daily',
        start_date: new Date(2020, 0, 1).toISOString(),
        end_date: now.toISOString(),
        notes: shiftNotes || null
      };

      await api.closeCashRegister(payload);
      setSelectedBarberForShift(null);
      setShiftNotes('');
      // Reload shifts & history
      await loadBarbersStatus();
      if (activeView === 'history') loadHistory();
    } catch (err) {
      alert(err.message || 'Error al ejecutar cierre de turno del barbero');
    } finally {
      setClosingShift(false);
    }
  };

  // --- Execute Global Closing (End of day) ---
  const handleExecuteGlobalClose = async () => {
    if (!preview) return;
    setExecutingGlobal(true);
    try {
      const payload = {
        closing_type: 'global',
        barber_id: null,
        period_type: periodType,
        start_date: preview.start_date,
        end_date: preview.end_date,
        notes: globalClosingNotes || null
      };

      await api.closeCashRegister(payload);
      setIsConfirmGlobalOpen(false);
      setGlobalClosingNotes('');
      // Reload both views
      await Promise.all([loadGlobalPreview(), loadBarbersStatus(), loadHistory()]);
    } catch (err) {
      alert(err.message || 'Error al ejecutar cierre global de caja');
    } finally {
      setExecutingGlobal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-nav Navigation */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading flex items-center space-x-2">
            <Wallet className="w-6 h-6 text-amber-400" />
            <span>Control de Caja & Liquidaciones</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Liquidación por turnos de cada barbero y Cierre Global consolidado del negocio.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setActiveView('shifts')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeView === 'shifts'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Liquidación por Barbero (Turnos)</span>
          </button>

          <button
            onClick={() => setActiveView('global')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeView === 'global'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Cierre Global de Caja (Fin del Día)</span>
          </button>

          <button
            onClick={() => setActiveView('history')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeView === 'history'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VISTA 1: LIQUIDACIONES POR BARBERO (TURNOS) */}
      {/* ========================================================= */}
      {activeView === 'shifts' && (
        <div className="space-y-6">
          {/* Subheader info card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 border border-slate-800 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Turnos y Cierres Individuales de Barberos</span>
              </h3>
              <p className="text-xs text-slate-400">
                Podés liquidar a un barbero cuando termina su turno (ej. a las 4 horas). Si luego vuelve y realiza más cortes, podés hacer un segundo o tercer cierre de turno en el mismo día sin afectar los anteriores.
              </p>
            </div>
            <button
              onClick={loadBarbersStatus}
              disabled={loadingShifts}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shrink-0 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingShifts ? 'animate-spin text-amber-400' : ''}`} />
              <span>Actualizar Estado</span>
            </button>
          </div>

          {loadingShifts ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
              Calculando conciliaciones y turnos de cada barbero...
            </div>
          ) : barbersStatus.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
              No hay barberos ni administradores activos registrados.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {barbersStatus.map((b) => {
                const hasPending = b.unsettled_cuts_count > 0 || b.unsettled_sales_count > 0;
                const isDebtBarber = b.debtor === 'barber_owes_shop';
                const isDebtShop = b.debtor === 'shop_owes_barber';

                return (
                  <div
                    key={b.barber_id}
                    className={`bg-slate-900 border rounded-3xl p-5 sm:p-6 transition-all space-y-4 shadow-xl ${
                      hasPending ? 'border-slate-800 hover:border-amber-500/40' : 'border-slate-800/60 opacity-90'
                    }`}
                  >
                    {/* Header Barbero */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-white text-lg font-heading">
                            {b.barber_name}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            b.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {b.role === 'admin' ? 'Administrador' : 'Barbero'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs mt-1 text-slate-400 flex-wrap">
                          <span className="text-amber-400 font-semibold">
                            {b.payment_scheme === 'commission' ? `${b.commission_percentage}% Comisión` : 'Alquiler Fijo'}
                          </span>
                          <span>·</span>
                          <span className="bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800 text-[10px] text-slate-300">
                            Cierre: {FREQUENCY_LABELS[b.payout_frequency] || 'Por Día / Turno'}
                          </span>
                        </div>
                      </div>

                      {/* Badge Turnos Hoy */}
                      {b.shifts_closed_today_count > 0 && (
                        <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-bold shrink-0">
                          {b.shifts_closed_today_count} {b.shifts_closed_today_count === 1 ? 'turno cerrado hoy' : 'turnos cerrados hoy'}
                        </span>
                      )}
                    </div>

                    {/* Resumen de actividad del turno pendiente */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-slate-950/70 border border-slate-800/70 p-2.5 rounded-2xl">
                        <span className="text-[10px] text-slate-400 block font-semibold">Cortes Turno</span>
                        <span className="font-extrabold text-white text-sm">
                          {b.unsettled_cuts_count} {b.unsettled_cuts_count === 1 ? 'corte' : 'cortes'}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          ${b.unsettled_cuts_gross.toLocaleString('es-AR')} bruto
                        </span>
                      </div>

                      <div className="bg-slate-950/70 border border-slate-800/70 p-2.5 rounded-2xl">
                        <span className="text-[10px] text-slate-400 block font-semibold">Comisión Ganada</span>
                        <span className="font-extrabold text-amber-400 text-sm">
                          ${b.unsettled_barber_earnings.toLocaleString('es-AR')}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          a liquidar
                        </span>
                      </div>

                      <div className="bg-slate-950/70 border border-slate-800/70 p-2.5 rounded-2xl">
                        <span className="text-[10px] text-slate-400 block font-semibold">Cobró Barbero</span>
                        <span className="font-bold text-slate-200 text-sm">
                          ${b.money_held_by_barber.toLocaleString('es-AR')}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          en su poder
                        </span>
                      </div>

                      <div className="bg-slate-950/70 border border-slate-800/70 p-2.5 rounded-2xl">
                        <span className="text-[10px] text-slate-400 block font-semibold">Cobró Barbería</span>
                        <span className="font-bold text-slate-200 text-sm">
                          ${b.money_held_by_shop.toLocaleString('es-AR')}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          en caja local
                        </span>
                      </div>
                    </div>

                    {/* Conciliación Destacada: ¿Quién le debe a quién? */}
                    <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                      isDebtShop
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : isDebtBarber
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}>
                      <div className="flex items-center space-x-2">
                        {isDebtShop ? (
                          <ArrowUpRight className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : isDebtBarber ? (
                          <ArrowDownRight className="w-5 h-5 text-rose-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-slate-500 shrink-0" />
                        )}
                        <div>
                          <strong className="block text-sm font-heading font-extrabold">
                            {isDebtShop
                              ? `Debes pagarle: $${b.net_debt_amount.toLocaleString('es-AR')} ARS`
                              : isDebtBarber
                                ? `Barbero debe entregarte: $${b.net_debt_amount.toLocaleString('es-AR')} ARS`
                                : 'Turno al día ($0 saldo)'}
                          </strong>
                          <span className="text-[11px] opacity-80 block">
                            {b.summary_text}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Turnos ya cerrados hoy (Historial del día) */}
                    {b.shifts_closed_today && b.shifts_closed_today.length > 0 && (
                      <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60 text-[11px] space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Turnos cerrados hoy ({b.shifts_closed_today.length}):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {b.shifts_closed_today.map((s) => (
                            <span key={s.id} className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
                              🕒 {s.time_str} hs · Bruto: ${s.total_gross.toLocaleString('es-AR')} · Com.: ${s.barber_payout.toLocaleString('es-AR')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Botón de Acción para Liquidar Turno */}
                    <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between">
                      {hasPending ? (
                        <button
                          onClick={() => handleOpenShiftModal(b)}
                          className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 active:scale-[0.98] flex items-center justify-center space-x-2"
                        >
                          <Clock className="w-4 h-4 text-slate-950" />
                          <span>Liquidar y Cerrar Turno de {b.barber_name}</span>
                        </button>
                      ) : (
                        <div className="w-full text-center py-2 text-slate-500 font-semibold text-xs flex items-center justify-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500/60" />
                          <span>Sin cortes pendientes · Turno al día</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 2: CIERRE GLOBAL DE CAJA (FIN DEL DÍA) */}
      {/* ========================================================= */}
      {activeView === 'global' && (
        <div className="space-y-6">
          {/* Quick Period Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl">
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Consolidación General de la Barbería
              </h3>
              <p className="text-xs text-slate-400">
                Al final del día podés realizar el Cierre Global. Si aún hay cortes sin liquidar de cualquier barbero, se cerrarán todos juntos.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 bg-slate-950 border border-slate-800 p-1.5 rounded-2xl text-xs">
              {[
                { id: 'daily', label: 'Hoy' },
                { id: 'weekly', label: 'Semana' },
                { id: 'biweekly', label: 'Quincena' },
                { id: 'monthly', label: 'Mes' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePeriodQuickSelect(p.id)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                    periodType === p.id 
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {loadingPreview ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
              Calculando balance global del negocio...
            </div>
          ) : preview && (
            <div className="space-y-6">
              {/* Main Key Cash Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Physical Cash Drawer */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <span>Efectivo en Cajón</span>
                    <Wallet className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-400 font-heading">
                    ${preview.total_cash_drawer.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">ARS</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Dinero físico cobrado por Administración en mostrador.
                  </p>
                </div>

                {/* Digital Shop Transfers */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <span>Transf. Barbería</span>
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-cyan-400 font-heading">
                    ${preview.total_digital_shop.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">ARS</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Cobros en cuenta bancaria o MercadoPago del local.
                  </p>
                </div>

                {/* Barber Payouts */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <span>Total Comisiones</span>
                    <DollarSign className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-amber-400 font-heading">
                    ${preview.total_barber_payouts.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">ARS</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Ganancias ganadas por el equipo de barberos.
                  </p>
                </div>

                {/* Net Admin Profit */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <span>Ganancia Neta Dueño</span>
                    <DollarSign className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-300 font-heading">
                    ${preview.net_admin_profit.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">ARS</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Bruto menos comisiones y gastos del salón.
                  </p>
                </div>
              </div>

              {/* Liquidación por Barbero en el Cierre Global */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white font-heading">
                      Conciliación de Cuentas por Barbero en este Cierre
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Cruza el dinero que cada barbero retuvo físicamente contra su comisión ganada.
                    </p>
                  </div>

                  {preview.unsettled_service_ids.length > 0 || preview.unsettled_sale_ids.length > 0 ? (
                    <button
                      onClick={() => setIsConfirmGlobalOpen(true)}
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                    >
                      Ejecutar Cierre Global ({periodType.toUpperCase()})
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-semibold px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
                      Caja al día (Sin transacciones pendientes)
                    </span>
                  )}
                </div>

                {preview.barber_summaries.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    No hay transacciones pendientes para liquidar en este período.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {preview.barber_summaries.map((b) => (
                      <div 
                        key={b.barber_id} 
                        className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 transition-colors space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-extrabold text-white text-base block">{b.barber_name}</span>
                            <span className="text-[11px] text-amber-400 font-semibold">
                              {b.payment_scheme === 'commission' ? `${b.commission_percentage}% comisión` : 'Alquiler Fijo'}
                            </span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold leading-tight ${
                            b.debtor === 'barber_owes_shop'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : b.debtor === 'shop_owes_barber'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {b.summary_text}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/70 text-xs">
                          <div className="bg-slate-900/60 p-2 rounded-xl">
                            <span className="text-[10px] text-slate-500 block">Actividad</span>
                            <span className="font-semibold text-slate-300 text-xs">{b.cuts_count} cortes · {b.sales_count} ventas</span>
                          </div>
                          <div className="bg-slate-900/60 p-2 rounded-xl">
                            <span className="text-[10px] text-slate-500 block">Bruto Generado</span>
                            <span className="font-bold text-white text-xs">${(b.cuts_gross + b.sales_gross).toLocaleString('es-AR')}</span>
                          </div>
                          <div className="bg-slate-900/60 p-2 rounded-xl">
                            <span className="text-[10px] text-slate-500 block">Comisión Ganada</span>
                            <span className="font-bold text-amber-400 text-xs">${b.total_barber_earnings.toLocaleString('es-AR')}</span>
                          </div>
                          <div className="bg-slate-900/60 p-2 rounded-xl">
                            <span className="text-[10px] text-slate-500 block">Retuvo Barbero</span>
                            <span className="font-bold text-slate-200 text-xs">${b.money_held_by_barber.toLocaleString('es-AR')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 3: HISTORIAL DE CIERRES */}
      {/* ========================================================= */}
      {activeView === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-white font-heading flex items-center space-x-2">
              <History className="w-5 h-5 text-amber-400" />
              <span>Historial de Cierres Ejecutados</span>
            </h3>

            {/* Filter: all / global / barber_shift */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs">
              <button
                onClick={() => setHistoryFilter('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  historyFilter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setHistoryFilter('barber_shift')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  historyFilter === 'barber_shift' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Turnos de Barberos
              </button>
              <button
                onClick={() => setHistoryFilter('global')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  historyFilter === 'global' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cierres Globales
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-800/60">
            {loadingHistory ? (
              <div className="text-center py-10 text-slate-400 text-xs">Cargando historial...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                Aún no se han ejecutado cierres de caja en el sistema.
              </div>
            ) : (
              history.map((c) => {
                const dateStr = new Date(c.created_at).toLocaleString('es-AR', {
                  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                const isShift = c.closing_type === 'barber_shift';

                return (
                  <div key={c.id} className="py-3.5 hover:bg-slate-800/30 px-3 rounded-2xl transition-colors">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-xs">{dateStr}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isShift
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          }`}>
                            {isShift ? `Turno: ${c.barber_name || 'Barbero'}` : `Cierre Global (${c.period_type})`}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block">
                          Responsable: {c.closed_by_name} {c.notes && `· "${c.notes}"`}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 sm:gap-6 flex-wrap text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Bruto</span>
                          <span className="font-semibold text-white">${c.total_gross_revenue.toLocaleString('es-AR')}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Efectivo Caja</span>
                          <span className="font-semibold text-emerald-400">${c.total_cash_drawer.toLocaleString('es-AR')}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Comisión Barbero</span>
                          <span className="font-semibold text-amber-300">${c.total_barber_payouts.toLocaleString('es-AR')}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Ganancia Barbería</span>
                          <span className="font-extrabold text-emerald-300">${c.net_admin_profit.toLocaleString('es-AR')}</span>
                        </div>

                        <button
                          onClick={() => setSelectedClosing(c)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-semibold inline-flex items-center space-x-1 ml-auto transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: LIQUIDAR TURNO DE UN BARBERO ESPECÍFICO */}
      {/* ========================================================= */}
      {selectedBarberForShift && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedBarberForShift(null)}
          title={`Liquidar Turno: ${selectedBarberForShift.barber_name}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Barbero:</span>
                <span className="font-bold text-white text-sm">{selectedBarberForShift.barber_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Esquema:</span>
                <span className="font-semibold text-amber-400">
                  {selectedBarberForShift.payment_scheme === 'commission'
                    ? `${selectedBarberForShift.commission_percentage}% Comisión`
                    : 'Alquiler Fijo'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Cortes sin liquidar en este turno:</span>
                <span className="font-bold text-white">
                  {selectedBarberForShift.unsettled_cuts_count} cortes (${selectedBarberForShift.unsettled_cuts_gross.toLocaleString('es-AR')} ARS)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Comisión ganada por el barbero:</span>
                <span className="font-bold text-amber-300">
                  ${selectedBarberForShift.unsettled_barber_earnings.toLocaleString('es-AR')} ARS
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Dinero que retuvo el barbero:</span>
                <span className="font-bold text-slate-200">
                  ${selectedBarberForShift.money_held_by_barber.toLocaleString('es-AR')} ARS
                </span>
              </div>
            </div>

            {/* Resultado de la liquidación del turno */}
            <div className={`p-4 rounded-2xl border ${
              selectedBarberForShift.debtor === 'shop_owes_barber'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : selectedBarberForShift.debtor === 'barber_owes_shop'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                Saldo a Saldar en este Cierre de Turno:
              </span>
              <strong className="text-base font-heading font-extrabold block mt-0.5">
                {selectedBarberForShift.debtor === 'shop_owes_barber'
                  ? `Pagar al barbero: $${selectedBarberForShift.net_debt_amount.toLocaleString('es-AR')} ARS`
                  : selectedBarberForShift.debtor === 'barber_owes_shop'
                    ? `Cobrar al barbero: $${selectedBarberForShift.net_debt_amount.toLocaleString('es-AR')} ARS`
                    : 'Sin diferencias monetarias ($0)'}
              </strong>
              <span className="text-[11px] block mt-1 opacity-80">
                {selectedBarberForShift.summary_text}
              </span>
            </div>

            {/* Notas opcionales */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Nota o referencia del turno (opcional):
              </label>
              <input
                type="text"
                placeholder="Ej. Turno Mañana 10:00 a 14:00"
                value={shiftNotes}
                onChange={(e) => setShiftNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <p className="text-[11px] text-slate-400">
              💡 <em>Al confirmar, se liquidarán los cortes de este turno para {selectedBarberForShift.barber_name}. Si más tarde realiza cortes adicionales, se acumularán para un próximo cierre de turno.</em>
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBarberForShift(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmShiftClose}
                disabled={closingShift}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                {closingShift ? 'Cerrando Turno...' : 'Confirmar y Cerrar Turno'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL: CONFIRMACIÓN CIERRE GLOBAL */}
      {/* ========================================================= */}
      <ConfirmDialog
        isOpen={isConfirmGlobalOpen}
        onClose={() => setIsConfirmGlobalOpen(false)}
        onConfirm={handleExecuteGlobalClose}
        loading={executingGlobal}
        title={`Confirmar Cierre Global de Caja (${periodType.toUpperCase()})`}
        message={`Al confirmar el cierre global, se marcarán todos los cortes pendientes (${preview?.services_count}) y ventas (${preview?.sales_count}) de todos los barberos como liquidados. Ganancia Neta estimada para Administración: $${preview?.net_admin_profit?.toLocaleString('es-AR')} ARS.`}
        confirmText="Confirmar Cierre Global"
      />

      {/* ========================================================= */}
      {/* MODAL: DETALLE DE CIERRE HISTÓRICO */}
      {/* ========================================================= */}
      {selectedClosing && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedClosing(null)}
          title={`Detalle de Cierre #${selectedClosing.id} (${selectedClosing.closing_type === 'barber_shift' ? `Turno ${selectedClosing.barber_name}` : 'Cierre Global'})`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-400 block">Efectivo en Caja</span>
                <strong className="text-emerald-400 text-sm font-heading">
                  ${selectedClosing.total_cash_drawer.toLocaleString('es-AR')}
                </strong>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-400 block">Transf. Barbería</span>
                <strong className="text-cyan-400 text-sm font-heading">
                  ${selectedClosing.total_digital_shop.toLocaleString('es-AR')}
                </strong>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-400 block">Comisión Barbero</span>
                <strong className="text-amber-400 text-sm font-heading">
                  ${selectedClosing.total_barber_payouts.toLocaleString('es-AR')}
                </strong>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-400 block">Ganancia Neta</span>
                <strong className="text-emerald-300 text-sm font-heading">
                  ${selectedClosing.net_admin_profit.toLocaleString('es-AR')}
                </strong>
              </div>
            </div>

            {selectedClosing.notes && (
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-slate-400 block font-semibold mb-1">Notas del Cierre:</span>
                <p className="text-slate-300">{selectedClosing.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedClosing(null)}
                className="px-5 py-2 bg-slate-800 text-slate-200 hover:text-white rounded-xl font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
