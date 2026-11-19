import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, ShieldCheck, ShieldAlert, Phone, Mail, CheckCircle, Ban, Trash2 } from 'lucide-react';
import { api } from '../../api';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';

const FREQUENCY_LABELS = {
  daily: 'Diario / Turno',
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual'
};

export const BarbersTab = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('barber'); // 'barber' | 'admin'
  const [paymentScheme, setPaymentScheme] = useState('commission'); // 'commission' | 'fixed_rent'
  const [commissionPercentage, setCommissionPercentage] = useState(50);
  const [fixedRentAmount, setFixedRentAmount] = useState(120000);
  const [fixedRentPeriod, setFixedRentPeriod] = useState('monthly');
  const [payoutFrequency, setPayoutFrequency] = useState('daily'); // 'daily' | 'weekly' | 'biweekly' | 'monthly'
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Toggle active confirmation
  const [toggleBarberObj, setToggleBarberObj] = useState(null);

  // Delete confirmation
  const [deleteBarberObj, setDeleteBarberObj] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const loadBarbers = async () => {
    setLoading(true);
    try {
      const data = await api.getBarbers(true, true); // include inactive and admins
      setBarbers(data);
    } catch (err) {
      console.error('Error cargando barberos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBarbers();
  }, []);

  const handleOpenCreate = () => {
    setEditingBarber(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRole('barber');
    setPaymentScheme('commission');
    setCommissionPercentage(50);
    setFixedRentAmount(120000);
    setFixedRentPeriod('monthly');
    setPayoutFrequency('daily');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditingBarber(b);
    setFullName(b.full_name);
    setEmail(b.email);
    setPhone(b.phone || '');
    setPassword(''); // optional on edit
    setRole(b.role || 'barber');
    setPaymentScheme(b.payment_scheme || 'commission');
    setCommissionPercentage(b.commission_percentage || 50);
    setFixedRentAmount(b.fixed_rent_amount || 0);
    setFixedRentPeriod(b.fixed_rent_period || 'monthly');
    setPayoutFrequency(b.payout_frequency || 'daily');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSaveBarber = async (e) => {
    e.preventDefault();
    if (!fullName || !email) {
      setModalError('Nombre y correo son obligatorios');
      return;
    }
    if (!editingBarber && !password) {
      setModalError('La contraseña inicial es obligatoria para nuevos usuarios');
      return;
    }

    setSubmitting(true);
    setModalError('');

    try {
      const payload = {
        full_name: fullName,
        email,
        phone: phone || null,
        role: role,
        payment_scheme: paymentScheme,
        commission_percentage: parseFloat(commissionPercentage),
        fixed_rent_amount: parseFloat(fixedRentAmount) || 0,
        fixed_rent_period: fixedRentPeriod,
        payout_frequency: payoutFrequency
      };
      if (password) {
        payload.password = password;
      }

      if (editingBarber) {
        await api.updateBarber(editingBarber.id, payload);
      } else {
        await api.createBarber(payload);
      }

      setIsModalOpen(false);
      loadBarbers();
    } catch (err) {
      setModalError(err.message || 'Error al guardar usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!toggleBarberObj) return;
    try {
      await api.toggleBarber(toggleBarberObj.id);
      setToggleBarberObj(null);
      loadBarbers();
    } catch (err) {
      alert(err.message || 'Error al modificar estado');
    }
  };

  const handleDeleteBarber = async () => {
    if (!deleteBarberObj) return;
    setDeleteError('');
    try {
      await api.deleteBarber(deleteBarberObj.id);
      setDeleteBarberObj(null);
      loadBarbers();
    } catch (err) {
      const msg = err.message || 'Error al eliminar usuario';
      setDeleteBarberObj(null);
      setDeleteError(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error de eliminación */}
      {deleteError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-sm flex justify-between items-start gap-2">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError('')} className="text-rose-300 hover:text-rose-100 font-bold shrink-0">✕</button>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">
            Gestión de Barberos y Esquemas de Cobro
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configuración individual de esquemas (comisión por porcentaje o alquiler fijo de sillón).
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>Registrar Nuevo Barbero</span>
        </button>
      </div>

      {/* Barbers Table - Responsive */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Desktop Header */}
        <div className="hidden md:grid bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold px-4 py-3"
          style={{ gridTemplateColumns: '1.2fr 1fr 1.2fr 90px 220px' }}>
          <div>Usuario / Rol</div>
          <div>Contacto</div>
          <div>Liquidación & Esquema</div>
          <div>Estado</div>
          <div className="text-right">Acciones</div>
        </div>

        <div className="divide-y divide-slate-800/50">
          {barbers.map((b) => (
            <div key={b.id} className="hover:bg-slate-800/30 transition-colors px-4 py-3">
              {/* Mobile layout */}
              <div className="flex flex-col gap-2 md:hidden text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-white text-sm block">{b.full_name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        b.role === 'admin' || b.role === 'superadmin' ? 'bg-purple-500/20 text-purple-300' : 'bg-amber-500/10 text-amber-300'
                      }`}>
                        {b.role === 'admin' ? 'Admin' : b.role === 'superadmin' ? 'SuperAdmin' : 'Barbero'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{b.email}</span>
                    {b.phone && <span className="text-[10px] text-slate-500 font-mono block">Tel: {b.phone}</span>}
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    b.is_active
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    {b.is_active ? 'Activo' : 'Suspendido'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        b.payment_scheme === 'commission'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                      }`}>
                        {b.payment_scheme === 'commission' ? 'Comisión' : 'Alquiler'}
                      </span>
                      <strong className={b.payment_scheme === 'commission' ? 'text-amber-400 text-xs' : 'text-cyan-400 text-xs'}>
                        {b.payment_scheme === 'commission' ? `${b.commission_percentage}%` : `$${b.fixed_rent_amount?.toLocaleString('es-AR')}`}
                      </strong>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Pago: <span className="text-white font-medium">{FREQUENCY_LABELS[b.payout_frequency] || 'Diario / Turno'}</span>
                    </span>
                  </div>
                  <div className="flex space-x-1.5">
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                    >
                      Editar
                    </button>
                    {b.role === 'superadmin' ? (
                      <span className="px-2 py-1 text-[10px] text-slate-500 italic self-center">Protegida</span>
                    ) : (
                      <>
                        <button
                          onClick={() => setToggleBarberObj(b)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            b.is_active ? 'bg-rose-950/40 text-rose-300' : 'bg-emerald-950/40 text-emerald-300'
                          }`}
                        >
                          {b.is_active ? 'Suspender' : 'Reactivar'}
                        </button>
                        {!b.is_active && (
                          <button
                            onClick={() => setDeleteBarberObj(b)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-950/60 text-rose-300 hover:bg-rose-900/80 transition-colors flex items-center gap-1"
                            title="Eliminar permanentemente"
                          >
                            <Trash2 className="w-3 h-3" />
                            Eliminar
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden md:grid items-center gap-3 text-xs"
                style={{ gridTemplateColumns: '1.2fr 1fr 1.2fr 90px 220px' }}>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-white text-sm block truncate">{b.full_name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      b.role === 'admin' || b.role === 'superadmin' ? 'bg-purple-500/20 text-purple-300' : 'bg-amber-500/10 text-amber-300'
                    }`}>
                      {b.role === 'admin' ? 'Admin' : b.role === 'superadmin' ? 'SuperAdmin' : 'Barbero'}
                    </span>
                  </div>
                </div>
                <div className="truncate">
                  <span className="text-slate-300 block truncate">{b.email}</span>
                  <span className="text-[10px] text-slate-500 font-mono block">{b.phone || 'Sin teléfono'}</span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      b.payment_scheme === 'commission'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {b.payment_scheme === 'commission' ? 'Comisión' : 'Alquiler'}
                    </span>
                    <strong className={b.payment_scheme === 'commission' ? 'text-amber-400 text-xs' : 'text-cyan-400 text-xs'}>
                      {b.payment_scheme === 'commission' ? `${b.commission_percentage}%` : `$${b.fixed_rent_amount?.toLocaleString('es-AR')} (${b.fixed_rent_period})`}
                    </strong>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Cierre: <span className="text-slate-200 font-semibold">{FREQUENCY_LABELS[b.payout_frequency] || 'Diario / Turno'}</span>
                  </span>
                </div>
                <div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    b.is_active
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    {b.is_active ? 'Activo' : 'Suspendido'}
                  </span>
                </div>
                <div className="flex justify-end space-x-1.5">
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Editar
                  </button>
                  {b.role === 'superadmin' ? (
                    <span className="px-2 py-1 text-[10px] text-slate-500 italic self-center">Protegida</span>
                  ) : (
                    <>
                      <button
                        onClick={() => setToggleBarberObj(b)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          b.is_active
                            ? 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60'
                            : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60'
                        }`}
                      >
                        {b.is_active ? 'Suspender' : 'Activar'}
                      </button>
                      {!b.is_active && (
                        <button
                          onClick={() => setDeleteBarberObj(b)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-950/60 text-rose-300 hover:bg-rose-900/80 transition-colors flex items-center gap-1"
                          title="Eliminar permanentemente"
                        >
                          <Trash2 className="w-3 h-3" />
                          Eliminar
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Crear / Editar Barbero */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBarber ? `Editar Barbero: ${editingBarber.full_name}` : 'Registrar Nuevo Barbero'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveBarber} className="space-y-4 text-xs">
          {modalError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl">
              {modalError}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-300 mb-1">Nombre Completo *</label>
            <input
              type="text"
              required
              placeholder="Ej. Marcos Toledo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Correo Electrónico *</label>
              <input
                type="email"
                required
                placeholder="barbero@barbershop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">Teléfono / WhatsApp</label>
              <input
                type="tel"
                placeholder="+54 9 11 ..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Contraseña {editingBarber ? '(dejar en blanco para no cambiar)' : '*'}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
            />
          </div>

          {/* Rol y Frecuencia de Liquidación */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Rol de Usuario *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
              >
                <option value="barber">Barbero</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">Liquidación (Cierre de Caja) *</label>
              <select
                value={payoutFrequency}
                onChange={(e) => setPayoutFrequency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
              >
                <option value="daily">Por Día / Turno (Recomendado)</option>
                <option value="weekly">Semanal</option>
                <option value="biweekly">Quincenal</option>
                <option value="monthly">Mensual</option>
              </select>
            </div>
          </div>

          {/* Scheme selector */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <span className="block font-bold text-amber-400 uppercase tracking-wider text-[11px]">
              Esquema de Liquidación y Cobro
            </span>

            <div className="grid grid-cols-2 gap-3">
              <label className={`p-3 rounded-xl border cursor-pointer text-center ${
                paymentScheme === 'commission'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="scheme"
                  value="commission"
                  checked={paymentScheme === 'commission'}
                  onChange={() => setPaymentScheme('commission')}
                  className="sr-only"
                />
                <span>Comisión por Porcentaje</span>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer text-center ${
                paymentScheme === 'fixed_rent'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="scheme"
                  value="fixed_rent"
                  checked={paymentScheme === 'fixed_rent'}
                  onChange={() => setPaymentScheme('fixed_rent')}
                  className="sr-only"
                />
                <span>Alquiler Fijo de Espacio</span>
              </label>
            </div>

            {paymentScheme === 'commission' ? (
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Porcentaje de Comisión para el Barbero (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={commissionPercentage}
                  onChange={(e) => setCommissionPercentage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-base font-bold text-amber-400"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Ejemplo: 50% significa que por un corte de $8.000, el barbero gana $4.000 y el salón $4.000.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Monto Alquiler (ARS)</label>
                  <input
                    type="number"
                    value={fixedRentAmount}
                    onChange={(e) => setFixedRentAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Frecuencia</label>
                  <select
                    value={fixedRentPeriod}
                    onChange={(e) => setFixedRentPeriod(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl"
            >
              {submitting ? 'Guardando...' : 'Guardar Barbero'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Toggle active confirmation */}
      {toggleBarberObj && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setToggleBarberObj(null)}
          onConfirm={handleToggleActive}
          title={toggleBarberObj.is_active ? 'Suspender Cuenta de Barbero' : 'Reactivar Cuenta'}
          message={
            toggleBarberObj.is_active
              ? `¿Deseas suspender a ${toggleBarberObj.full_name}? Su sesión persistente se revocará inmediatamente y no podrá acceder al sistema ni registrar cortes.`
              : `¿Deseas reactivar la cuenta de ${toggleBarberObj.full_name}? Podrá volver a iniciar sesión en la web y app.`
          }
          isDanger={toggleBarberObj.is_active}
          confirmText={toggleBarberObj.is_active ? 'Sí, Suspender Cuenta' : 'Sí, Reactivar Cuenta'}
        />
      )}

      {/* Delete confirmation */}
      {deleteBarberObj && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeleteBarberObj(null)}
          onConfirm={handleDeleteBarber}
          title="Eliminar Cuenta Permanentemente"
          message={`¿Estás seguro de que deseas eliminar permanentemente la cuenta de ${deleteBarberObj?.full_name}? Esta acción no se puede deshacer. Si el usuario tiene registros de cortes asociados, la eliminación no será posible.`}
          isDanger={true}
          confirmText="Sí, Eliminar Permanentemente"
        />
      )}
    </div>
  );
};

