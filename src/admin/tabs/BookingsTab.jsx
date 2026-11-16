import React, { useState, useEffect } from 'react';
import { Calendar, ToggleLeft, ToggleRight, CheckCircle2, Clock, XCircle, Phone, DollarSign, ShieldCheck, Trash2 } from 'lucide-react';
import { api } from '../../api';
import { Modal, ConfirmDialog } from '../../components/common/Modal';

export const BookingsTab = ({ user }) => {
  const [bookings, setBookings] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Switch state
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [depositRequired, setDepositRequired] = useState(true);
  const [depositAmount, setDepositAmount] = useState('2000');
  const [updatingSwitch, setUpdatingSwitch] = useState(false);

  // Status update
  const [deleteId, setDeleteId] = useState(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status_filter = statusFilter;

      const [bookingsRes, settingsRes] = await Promise.all([
        api.getBookings(params),
        api.getSettings()
      ]);
      setBookings(bookingsRes);

      const settingsMap = {};
      settingsRes.forEach(s => {
        settingsMap[s.key] = s.value;
      });
      setSettings(settingsMap);
      setBookingEnabled(settingsMap['online_booking_enabled'] !== 'false');
      setDepositRequired(settingsMap['booking_deposit_required'] === 'true');
      setDepositAmount(settingsMap['booking_deposit_amount'] || '2000');
    } catch (err) {
      console.error('Error cargando turnos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleToggleBookingMasterSwitch = async () => {
    if (!isAdmin) return;
    const nextVal = !bookingEnabled;
    setUpdatingSwitch(true);
    try {
      await api.updateSetting('online_booking_enabled', nextVal ? 'true' : 'false');
      setBookingEnabled(nextVal);
    } catch (err) {
      alert(err.message || 'Error al actualizar interruptor');
    } finally {
      setUpdatingSwitch(false);
    }
  };

  const handleSaveDepositSettings = async () => {
    if (!isAdmin) return;
    try {
      await Promise.all([
        api.updateSetting('booking_deposit_required', depositRequired ? 'true' : 'false'),
        api.updateSetting('booking_deposit_amount', depositAmount)
      ]);
      alert('Configuración de señas actualizada correctamente.');
    } catch (err) {
      alert(err.message || 'Error al guardar configuración');
    }
  };

  const handleUpdateStatus = async (id, newStatus, paymentStatus = null) => {
    try {
      const payload = { status: newStatus };
      if (paymentStatus) payload.payment_status = paymentStatus;
      await api.updateBookingStatus(id, payload);
      loadData();
    } catch (err) {
      alert(err.message || 'Error al actualizar estado');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteBooking(deleteId);
      setDeleteId(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Error al eliminar turno');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white font-heading">
          Módulo de Reservas y Turnos Online
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Control maestro de reservas públicas, requerimiento de seña anti-ausencias y agenda de clientes.
        </p>
      </div>

      {/* MASTER SWITCH & DEPOSIT CONFIGURATION (Admin only) */}
      {isAdmin && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider">
                  Interruptor Maestro (Master Switch)
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  bookingEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {bookingEnabled ? 'SISTEMA ACTIVO' : 'SISTEMA PAUSADO'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Disponibilidad de Reservas en la Página Web Pública
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Al desactivar este interruptor, el formulario de la página web se oculta y redirige a los clientes al WhatsApp del salón.
              </p>
            </div>

            <button
              onClick={handleToggleBookingMasterSwitch}
              disabled={updatingSwitch}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center space-x-2 shadow-lg ${
                bookingEnabled
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
              }`}
            >
              {bookingEnabled ? (
                <>
                  <ToggleRight className="w-5 h-5" />
                  <span>Turnos Online: ACTIVADOS (Clic para Pausar)</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5" />
                  <span>Turnos Online: PAUSADOS (Clic para Activar)</span>
                </>
              )}
            </button>
          </div>

          {/* Deposit policy controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs items-center">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="depositCheck"
                checked={depositRequired}
                onChange={(e) => setDepositRequired(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-950 border-slate-700"
              />
              <label htmlFor="depositCheck" className="text-slate-300 font-semibold cursor-pointer">
                Exigir seña fija para confirmar el turno
              </label>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Monto de la Seña (ARS)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveDepositSettings}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg font-bold border border-slate-700"
              >
                Guardar Configuración de Señas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3 text-xs">
        <span className="text-slate-400 font-semibold">Filtrar por Estado:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
        >
          <option value="">Todos los turnos</option>
          <option value="pending">Pendientes de confirmación</option>
          <option value="confirmed">Confirmados</option>
          <option value="completed">Completados</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>

      {/* Bookings Table - Responsive */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Desktop Header */}
        <div className="hidden md:grid bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold px-4 py-3"
          style={{ gridTemplateColumns: '120px 1.2fr 1fr 100px 110px 1fr' }}>
          <div>Fecha / Hora</div>
          <div>Cliente / WhatsApp</div>
          <div>Servicio / Barbero</div>
          <div>Seña</div>
          <div>Estado</div>
          <div className="text-right">Acciones</div>
        </div>

        <div className="divide-y divide-slate-800/50">
          {bookings.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No hay turnos registrados en este estado.
            </div>
          ) : (
            bookings.map((b) => (
              <div key={b.id} className="hover:bg-slate-800/30 transition-colors px-4 py-3">
                {/* Mobile layout */}
                <div className="flex flex-col gap-2 md:hidden text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <strong className="text-white text-sm block">{b.customer_name}</strong>
                      <span className="text-amber-400 font-semibold">📅 {b.booking_date} · ⏰ {b.start_time} hs</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      b.status === 'confirmed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : b.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : b.status === 'completed'
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {b.status === 'confirmed' ? 'Confirmado' : b.status === 'pending' ? 'Pendiente' : b.status === 'completed' ? 'Completado' : 'Cancelado'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="text-slate-300">{b.service_name} (${b.service_price?.toLocaleString('es-AR')})</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-amber-300">Barbero: {b.barber_name}</span>
                    <span className="text-slate-500">·</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      b.payment_status === 'deposit_paid' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {b.payment_status === 'deposit_paid' ? 'Seña Paga' : b.deposit_amount > 0 ? `Seña: $${b.deposit_amount}` : 'Sin seña'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                    <a
                      href={`https://wa.me/${b.customer_phone?.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline flex items-center space-x-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{b.customer_phone}</span>
                    </a>

                    <div className="flex items-center space-x-1">
                      {b.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(b.id, 'confirmed', 'deposit_paid')}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px]"
                        >
                          Confirmar + Seña
                        </button>
                      )}
                      {b.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(b.id, 'completed')}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg font-bold text-[10px]"
                        >
                          Atendido
                        </button>
                      )}
                      {b.status !== 'cancelled' && (
                        <button
                          onClick={() => handleUpdateStatus(b.id, 'cancelled')}
                          className="px-1.5 py-1 text-slate-400 hover:text-rose-400 text-[10px]"
                        >
                          Cancelar
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => setDeleteId(b.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden md:grid items-center gap-3 text-xs"
                  style={{ gridTemplateColumns: '120px 1.2fr 1fr 100px 110px 1fr' }}>
                  <div>
                    <strong className="text-white text-xs block">{b.booking_date}</strong>
                    <span className="text-amber-400 font-semibold text-[11px]">⏰ {b.start_time} hs</span>
                  </div>

                  <div className="min-w-0">
                    <strong className="text-white block truncate">{b.customer_name}</strong>
                    <a
                      href={`https://wa.me/${b.customer_phone?.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline inline-flex items-center space-x-1 text-[11px] truncate"
                    >
                      <Phone className="w-3 h-3 shrink-0" />
                      <span className="truncate">{b.customer_phone}</span>
                    </a>
                  </div>

                  <div className="min-w-0">
                    <span className="font-semibold text-slate-200 block truncate">{b.service_name}</span>
                    <span className="text-[10px] text-amber-300 block truncate">Barbero: {b.barber_name}</span>
                  </div>

                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      b.payment_status === 'deposit_paid'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : b.deposit_amount > 0
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {b.payment_status === 'deposit_paid' ? 'Seña Abonada' : b.deposit_amount > 0 ? `$${b.deposit_amount}` : 'Sin Seña'}
                    </span>
                  </div>

                  <div>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      b.status === 'confirmed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : b.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : b.status === 'completed'
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {b.status === 'confirmed' ? 'Confirmado' : b.status === 'pending' ? 'Pendiente' : b.status === 'completed' ? 'Completado' : 'Cancelado'}
                    </span>
                  </div>

                  <div className="flex justify-end items-center space-x-1">
                    {b.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'confirmed', 'deposit_paid')}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] transition-colors"
                      >
                        Confirmar + Seña
                      </button>
                    )}
                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'completed')}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg font-bold text-[11px] transition-colors"
                      >
                        Atendido
                      </button>
                    )}
                    {b.status !== 'cancelled' && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'cancelled')}
                        className="px-2 py-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg text-[11px] transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => setDeleteId(b.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Eliminar turno"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Registro de Turno"
        message="¿Estás seguro de que deseas eliminar este turno de la base de datos?"
        isDanger={true}
        confirmText="Sí, Eliminar"
      />
    </div>
  );
};

