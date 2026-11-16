import React, { useState, useEffect } from 'react';
import { 
  Wallet, DollarSign, ArrowDownRight, ArrowUpRight, CheckCircle2, 
  Calendar, History, Eye, AlertCircle, FileText, TrendingUp
} from 'lucide-react';
import { api } from '../../api';
import { Modal, ConfirmDialog } from '../../components/common/Modal';

export const CashClosingTab = ({ user }) => {
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Period filter for preview
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [periodType, setPeriodType] = useState('daily');

  // Confirmation modal
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [closingNotes, setClosingNotes] = useState('');
  const [executing, setExecuting] = useState(false);

  // Detail view modal
  const [selectedClosing, setSelectedClosing] = useState(null);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const data = await api.getCashClosingPreview(startDate, endDate);
      setPreview(data);
    } catch (err) {
      console.error('Error cargando preview de arqueo:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const hist = await api.getCashClosingHistory();
      setHistory(hist);
    } catch (err) {
      console.error('Error cargando historial de cierres:', err);
    }
  };

  useEffect(() => {
    loadPreview();
    loadHistory();
  }, [startDate, endDate]);

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

  const handleExecuteClose = async () => {
    if (!preview) return;
    setExecuting(true);
    try {
      const payload = {
        period_type: periodType,
        start_date: preview.start_date,
        end_date: preview.end_date,
        notes: closingNotes || null
      };
      await api.closeCashRegister(payload);
      setIsConfirmOpen(false);
      setClosingNotes('');
      // Reload
      await Promise.all([loadPreview(), loadHistory()]);
    } catch (err) {
      alert(err.message || 'Error al ejecutar cierre de caja');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Quick Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">
            Caja, Arqueo y Liquidaciones
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cierre de caja en tiempo real, desglose de efectivo vs transferencias y conciliación de deudas por barbero.
          </p>
        </div>

        {/* Quick Period Buttons */}
        <div className="flex flex-wrap gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-xl text-xs">
          {[
            { id: 'daily', label: 'Día (Hoy)' },
            { id: 'weekly', label: 'Semana' },
            { id: 'biweekly', label: 'Quincena' },
            { id: 'monthly', label: 'Mes' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => handlePeriodQuickSelect(p.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                periodType === p.id 
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Calculando balance de caja...</div>
      ) : preview && (
        <div className="space-y-6">
          {/* Main Key Cash Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Physical Cash Drawer */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Efectivo en Caja Físico</span>
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
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Transferencias a Barbería</span>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-extrabold text-cyan-400 font-heading">
                ${preview.total_digital_shop.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">ARS</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Cobros electrónicos en cuenta bancaria/MP del local.
              </p>
            </div>

            {/* Barber Payouts */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Comisiones de Barberos</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold text-amber-400 font-heading">
                ${preview.total_barber_payouts.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">ARS</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Ganancias netas acumuladas por los barberos.
              </p>
            </div>

            {/* Net Admin Profit */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Ganancia Neta Dueño</span>
                <DollarSign className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-300 font-heading">
                ${preview.net_admin_profit.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">ARS</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Ingresos brutos menos comisiones y gastos operativos.
              </p>
            </div>
          </div>

          {/* Liquidación por Barbero: QUIÉN LE DEBE A QUIÉN */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-bold text-white font-heading">
                  Conciliación de Liquidaciones: ¿Quién le debe a quién?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculado cruzando las comisiones ganadas contra el dinero que cada barbero retuvo físicamente.
                </p>
              </div>

              {preview.unsettled_service_ids.length > 0 || preview.unsettled_sale_ids.length > 0 ? (
                <button
                  onClick={() => setIsConfirmOpen(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  Confirmar y Cerrar Caja ({periodType.toUpperCase()})
                </button>
              ) : (
                <span className="text-xs text-slate-500 font-semibold px-3 py-1 bg-slate-950 rounded-lg">
                  Caja al día (Sin transacciones pendientes)
                </span>
              )}
            </div>

            {/* Barber Summaries - Card/Grid layout for perfect responsiveness */}
            <div className="divide-y divide-slate-800/60">
              {preview.barber_summaries.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No hay actividad registrada para este período.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {preview.barber_summaries.map((b) => (
                    <div 
                      key={b.barber_id} 
                      className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 transition-colors space-y-3"
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
        </div>
      )}

      {/* Historial de Cierres de Caja */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white font-heading mb-4 flex items-center space-x-2">
          <History className="w-5 h-5 text-amber-400" />
          <span>Historial de Cierres de Caja Anteriores</span>
        </h3>

        <div className="divide-y divide-slate-800/60">
          {history.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              Aún no se han ejecutado cierres de caja en el sistema.
            </div>
          ) : (
            history.map((c) => {
              const dateStr = new Date(c.created_at).toLocaleString('es-AR', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
              });

              return (
                <div key={c.id} className="py-3 hover:bg-slate-800/30 px-3 rounded-xl transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-xs">{dateStr}</span>
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[10px] font-bold uppercase">
                          {c.period_type}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block">Responsable: {c.closed_by_name}</span>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-6 flex-wrap text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Efectivo en Caja</span>
                        <span className="font-semibold text-emerald-400">${c.total_cash_drawer.toLocaleString('es-AR')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Transf. Barbería</span>
                        <span className="font-semibold text-cyan-400">${c.total_digital_shop.toLocaleString('es-AR')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Comisiones</span>
                        <span className="font-semibold text-amber-300">${c.total_barber_payouts.toLocaleString('es-AR')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Ganancia Dueño</span>
                        <span className="font-extrabold text-emerald-300">${c.net_admin_profit.toLocaleString('es-AR')}</span>
                      </div>

                      <button
                        onClick={() => setSelectedClosing(c)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 ml-auto"
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

      {/* Confirmation Modal to Execute Closing */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleExecuteClose}
        loading={executing}
        title={`Confirmar Cierre de Caja (${periodType.toUpperCase()})`}
        message={`Al confirmar el cierre de caja, se marcarán todos los cortes (${preview?.services_count}) y ventas (${preview?.sales_count}) como liquidados. Ganancia Neta estimada para Administración: $${preview?.net_admin_profit?.toLocaleString('es-AR')} ARS.`}
        confirmText="Confirmar y Asentar Cierre"
      />

      {/* Detail Modal for Past Closing */}
      {selectedClosing && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedClosing(null)}
          title={`Detalle de Cierre de Caja #${selectedClosing.id}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Efectivo en Caja</span>
                <strong className="text-emerald-400 text-sm font-heading">
                  ${selectedClosing.total_cash_drawer.toLocaleString('es-AR')}
                </strong>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Transf. Barbería</span>
                <strong className="text-cyan-400 text-sm font-heading">
                  ${selectedClosing.total_digital_shop.toLocaleString('es-AR')}
                </strong>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Comisiones Barberos</span>
                <strong className="text-amber-400 text-sm font-heading">
                  ${selectedClosing.total_barber_payouts.toLocaleString('es-AR')}
                </strong>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Ganancia Neta</span>
                <strong className="text-emerald-300 text-sm font-heading">
                  ${selectedClosing.net_admin_profit.toLocaleString('es-AR')}
                </strong>
              </div>
            </div>

            {selectedClosing.notes && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block font-semibold mb-1">Notas de cierre:</span>
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

