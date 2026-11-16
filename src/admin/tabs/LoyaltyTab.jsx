import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Gift, History, Plus, CheckCircle, Sparkles, 
  AlertCircle, Pencil, Trash2, Save, X, Scissors, Calendar, UserPlus, Phone, Mail
} from 'lucide-react';
import { api } from '../../api';
import { Modal, ConfirmDialog, NotificationModal } from '../../components/common/Modal';

export const LoyaltyTab = ({ user }) => {
  const [customers, setCustomers] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [systemSettings, setSystemSettings] = useState({
    points_for_free_cut: '50'
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Points history modal
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Redeem modal
  const [redeemCustomer, setRedeemCustomer] = useState(null);
  const [selectedRewardId, setSelectedRewardId] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccessMsg, setRedeemSuccessMsg] = useState('');

  // Create Reward modal (admin only)
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardDesc, setRewardDesc] = useState('');
  const [rewardPoints, setRewardPoints] = useState(50);
  const [rewardType, setRewardType] = useState('free_service');
  const [rewardValue, setRewardValue] = useState(100);

  // Create Customer modal (admin only)
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDni, setNewDni] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [createCustomerError, setCreateCustomerError] = useState('');
  const [createCustomerSubmitting, setCreateCustomerSubmitting] = useState(false);

  // Edit Customer modal (admin only)
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDni, setEditDni] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLoyaltyPoints, setEditLoyaltyPoints] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete Customer state (admin only)
  const [deleteCustomerTarget, setDeleteCustomerTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const loadData = async () => {
    setLoading(true);
    try {
      const [custRes, rewRes, settingsRes] = await Promise.all([
        api.getCustomers(search),
        api.getRewards(),
        api.getPublicSettings().catch(() => ({}))
      ]);
      setCustomers(custRes || []);
      setRewards(rewRes || []);
      if (settingsRes) {
        setSystemSettings(settingsRes);
      }
      if (rewRes && rewRes.length > 0 && !selectedRewardId) {
        setSelectedRewardId(String(rewRes[0].id));
      }
    } catch (err) {
      console.error('Error cargando clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 150);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenHistory = async (cust) => {
    setHistoryCustomer(cust);
    setHistoryLoading(true);
    try {
      const hist = await api.getCustomerHistory(cust.id);
      setHistoryItems(hist || []);
    } catch (err) {
      console.error('Error cargando historial de puntos:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenRedeem = (cust) => {
    setRedeemCustomer(cust);
    if (rewards.length > 0) {
      setSelectedRewardId(String(rewards[0].id));
    }
  };

  const handleConfirmRedeem = async (e) => {
    e.preventDefault();
    if (!redeemCustomer || !selectedRewardId) return;

    setRedeeming(true);
    try {
      const res = await api.redeemReward(redeemCustomer.id, parseInt(selectedRewardId));
      setRedeemCustomer(null);
      setRedeemSuccessMsg(res.message);
      loadData();
    } catch (err) {
      alert(err.message || 'Error al canjear premio');
    } finally {
      setRedeeming(false);
    }
  };

  const handleCreateReward = async (e) => {
    e.preventDefault();
    if (!rewardTitle || !rewardPoints) return;

    try {
      await api.createReward({
        title: rewardTitle,
        description: rewardDesc || null,
        points_required: parseInt(rewardPoints),
        reward_type: rewardType,
        discount_value: parseFloat(rewardValue) || 0
      });
      setIsRewardModalOpen(false);
      setRewardTitle('');
      setRewardDesc('');
      loadData();
    } catch (err) {
      alert(err.message || 'Error al crear premio');
    }
  };

  const handleOpenCreateCustomer = () => {
    setNewFullName('');
    setNewPhone('');
    setNewDni('');
    setNewEmail('');
    setNewNotes('');
    setCreateCustomerError('');
    setIsCreateCustomerOpen(true);
  };

  const handleSaveNewCustomer = async (e) => {
    e.preventDefault();
    if (!newFullName.trim() || !newPhone.trim()) {
      setCreateCustomerError('El nombre y el teléfono son obligatorios');
      return;
    }
    setCreateCustomerSubmitting(true);
    setCreateCustomerError('');
    try {
      await api.createCustomer({
        full_name: newFullName.trim(),
        phone: newPhone.trim(),
        dni: newDni.trim() || null,
        email: newEmail.trim() || null,
        notes: newNotes.trim() || null
      });
      setIsCreateCustomerOpen(false);
      loadData();
    } catch (err) {
      setCreateCustomerError(err.message || 'Error al registrar cliente');
    } finally {
      setCreateCustomerSubmitting(false);
    }
  };

  const handleOpenEdit = (c) => {
    setEditingCustomer(c);
    setEditFullName(c.full_name || '');
    setEditPhone(c.phone || '');
    setEditDni(c.dni || '');
    setEditEmail(c.email || '');
    setEditLoyaltyPoints(c.loyalty_points || 0);
    setEditNotes(c.notes || '');
    setEditError('');
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!editFullName.trim() || !editPhone.trim()) {
      setEditError('El nombre y el teléfono son obligatorios');
      return;
    }
    setEditSubmitting(true);
    setEditError('');
    try {
      await api.updateCustomer(editingCustomer.id, {
        full_name: editFullName.trim(),
        phone: editPhone.trim(),
        dni: editDni.trim() || null,
        email: editEmail.trim() || null,
        loyalty_points: parseInt(editLoyaltyPoints) || 0,
        notes: editNotes.trim() || null
      });
      setEditingCustomer(null);
      loadData();
    } catch (err) {
      setEditError(err.message || 'Error al actualizar datos del cliente');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteCustomerTarget) return;
    setDeleteSubmitting(true);
    try {
      await api.deleteCustomer(deleteCustomerTarget.id);
      setDeleteCustomerTarget(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Error al eliminar cliente');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const pointsForFreeCut = parseInt(systemSettings.points_for_free_cut || '50', 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading flex items-center space-x-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>Gestión de Clientes</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAdmin 
              ? 'Administra la cartera de clientes, cortes acumulados, puntos y datos de contacto.'
              : 'Consulta los clientes registrados, historial de servicios y saldo de puntos para canjes.'}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {isAdmin && (
            <button
              onClick={handleOpenCreateCustomer}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <UserPlus className="w-4 h-4 text-slate-950" />
              <span>+ Nuevo Cliente</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setIsRewardModalOpen(true)}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
            >
              <Gift className="w-4 h-4 text-amber-400" />
              <span>Configurar Premios</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por Nombre (con o sin acentos) o Teléfono en cualquier formato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Customers Table - card/grid layout, no horizontal scroll */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Desktop header */}
        <div className="hidden md:grid bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold px-4 py-3"
          style={{ gridTemplateColumns: isAdmin ? '1fr 130px 100px 100px 1fr' : '1fr 130px 100px 100px 1fr' }}>
          <div>Cliente</div>
          <div>Teléfono</div>
          <div className="text-center">Cortes</div>
          <div>Última Visita</div>
          <div className="text-right">Puntos / Acciones</div>
        </div>

        <div className="divide-y divide-slate-800/50">
          {customers.length === 0 ? (
            <div className="text-center py-14 text-slate-500 text-sm">
              No se encontraron clientes registrados con esa búsqueda.
            </div>
          ) : (
            customers.map((c) => {
              const hasFreeCut = c.loyalty_points >= pointsForFreeCut;
              const lastVisitStr = c.last_visit 
                ? new Date(c.last_visit).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                : '—';

              return (
                <div key={c.id} className="hover:bg-slate-800/30 transition-colors px-4 py-3">
                  {/* Mobile layout */}
                  <div className="flex flex-col gap-2 md:hidden">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-white text-sm">{c.full_name}</span>
                        {c.email && <span className="text-[11px] text-slate-500 block">{c.email}</span>}
                        <span className="text-[11px] text-slate-400 font-mono">{c.phone}</span>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full font-extrabold text-xs ${
                          hasFreeCut 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-950 text-slate-300 border border-slate-800'
                        }`}>
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>{c.loyalty_points} pts</span>
                        </span>
                        {hasFreeCut && (
                          <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">¡Corte Gratis!</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                      <span className="text-slate-500"><Scissors className="w-3 h-3 text-amber-400 inline mr-0.5" />{c.cuts_count || 0} cortes</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-500">Visita: {lastVisitStr}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isAdmin && (
                        <button onClick={() => handleOpenEdit(c)} className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition-colors">
                          <Pencil className="w-3 h-3" /><span>Editar</span>
                        </button>
                      )}
                      <button onClick={() => handleOpenRedeem(c)} disabled={c.loyalty_points < 40} className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-xs transition-colors">Canjear</button>
                      <button onClick={() => handleOpenHistory(c)} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors">Historial</button>
                      {isAdmin && (
                        <button onClick={() => setDeleteCustomerTarget(c)} className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:grid items-center gap-3"
                    style={{ gridTemplateColumns: isAdmin ? '1fr 130px 100px 100px 1fr' : '1fr 130px 100px 100px 1fr' }}>
                    {/* Cliente */}
                    <div className="min-w-0">
                      <span className="font-bold text-white text-sm block truncate">{c.full_name}</span>
                      {c.email && <span className="text-[11px] text-slate-500 block truncate">{c.email}</span>}
                    </div>

                    {/* Teléfono */}
                    <div className="text-slate-300 font-mono text-xs truncate">{c.phone || '—'}</div>

                    {/* Cortes */}
                    <div className="text-center">
                      <span className="inline-flex items-center space-x-1 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-bold font-mono text-xs">
                        <Scissors className="w-3 h-3 text-amber-400" />
                        <span>{c.cuts_count || 0}</span>
                      </span>
                    </div>

                    {/* Última Visita */}
                    <div className="text-slate-400 font-mono text-xs">{lastVisitStr}</div>

                    {/* Puntos + Acciones */}
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full font-extrabold text-xs shrink-0 ${
                        hasFreeCut 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                          : 'bg-slate-950 text-slate-300 border border-slate-800'
                      }`}>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{c.loyalty_points} pts</span>
                      </span>
                      {hasFreeCut && (
                        <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-extrabold uppercase shrink-0">¡Gratis!</span>
                      )}
                      {isAdmin && (
                        <button onClick={() => handleOpenEdit(c)} className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition-colors shrink-0" title="Editar">
                          <Pencil className="w-3 h-3" /><span>Editar</span>
                        </button>
                      )}
                      <button onClick={() => handleOpenRedeem(c)} disabled={c.loyalty_points < 40} className="px-2 py-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-xs transition-colors shrink-0" title="Canjear">Canjear</button>
                      <button onClick={() => handleOpenHistory(c)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors shrink-0" title="Historial">Historial</button>
                      {isAdmin && (
                        <button onClick={() => setDeleteCustomerTarget(c)} className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0" title="Eliminar">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Registrar Nuevo Cliente (Solo Admin) */}
      {isCreateCustomerOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateCustomerOpen(false)}
          title="Registrar Nuevo Cliente"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveNewCustomer} className="space-y-4 text-xs">
            {createCustomerError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createCustomerError}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-300 mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                placeholder="Ej. Lucas Gómez"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Teléfono / WhatsApp *</label>
              <input
                type="tel"
                required
                placeholder="Ej. 351 314-6924 o +549..."
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Email (Opcional)</label>
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">DNI (Opcional)</label>
                <input
                  type="text"
                  placeholder="Sin DNI"
                  value={newDni}
                  onChange={(e) => setNewDni(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Notas / Observaciones</label>
              <textarea
                rows={2}
                placeholder="Preferencias de corte, estilo habitual..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreateCustomerOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createCustomerSubmitting}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-extrabold flex items-center space-x-1.5 shadow-lg shadow-amber-500/20"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{createCustomerSubmitting ? 'Guardando...' : 'Guardar Cliente'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Editar Cliente (Solo Admin) */}
      {editingCustomer && (
        <Modal
          isOpen={true}
          onClose={() => setEditingCustomer(null)}
          title={`Editar Datos del Cliente: ${editingCustomer.full_name}`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
            {editError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-300 mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Teléfono / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">DNI (Opcional)</label>
                <input
                  type="text"
                  value={editDni}
                  onChange={(e) => setEditDni(e.target.value)}
                  placeholder="Sin DNI"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Email (Opcional)</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-amber-400 mb-1">⭐ Puntos Acumulados</label>
                <input
                  type="number"
                  min="0"
                  value={editLoyaltyPoints}
                  onChange={(e) => setEditLoyaltyPoints(e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-xl p-2.5 text-amber-400 font-bold font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Notas / Observaciones del Cliente</label>
              <textarea
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Preferencias de corte, observaciones especiales..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={editSubmitting}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-extrabold flex items-center space-x-1.5 shadow-lg shadow-amber-500/20"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{editSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deleteCustomerTarget}
        onClose={() => setDeleteCustomerTarget(null)}
        onConfirm={handleDeleteCustomer}
        title="Eliminar Cliente"
        message={`¿Estás seguro de que deseas eliminar permanentemente a ${deleteCustomerTarget?.full_name}? Esta acción no se puede deshacer.`}
        isDanger={true}
        confirmText={deleteSubmitting ? 'Eliminando...' : 'Sí, Eliminar Cliente'}
      />

      {/* Modal: Canjear Puntos */}
      {redeemCustomer && (
        <Modal
          isOpen={true}
          onClose={() => setRedeemCustomer(null)}
          title={`Canjear Puntos para ${redeemCustomer.full_name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmRedeem} className="space-y-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-400 block text-xs">Saldo actual disponible:</span>
              <strong className="text-3xl font-extrabold text-amber-400 font-heading">
                {redeemCustomer.loyalty_points} PUNTOS
              </strong>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Seleccionar Recompensa o Beneficio *
              </label>
              <select
                value={selectedRewardId}
                onChange={(e) => setSelectedRewardId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
              >
                {rewards.map(r => (
                  <option 
                    key={r.id} 
                    value={r.id}
                    disabled={redeemCustomer.loyalty_points < r.points_required}
                  >
                    {r.title} ({r.points_required} pts) {redeemCustomer.loyalty_points < r.points_required ? '- Puntos insuficientes' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRedeemCustomer(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={redeeming}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl"
              >
                {redeeming ? 'Canjeando...' : 'Confirmar Canje'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Historial de Puntos */}
      {historyCustomer && (
        <Modal
          isOpen={true}
          onClose={() => setHistoryCustomer(null)}
          title={`Historial de Puntos: ${historyCustomer.full_name}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-slate-400 block text-[11px]">Cliente</span>
                <strong className="text-white text-sm">{historyCustomer.full_name}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[11px]">Saldo actual</span>
                <span className="text-amber-400 font-bold text-base font-mono">{historyCustomer.loyalty_points} pts</span>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/80 border border-slate-800 rounded-xl bg-slate-950/50">
              {historyLoading ? (
                <div className="p-6 text-center text-slate-400">Cargando movimientos...</div>
              ) : historyItems.length === 0 ? (
                <div className="p-6 text-center text-slate-500">No hay movimientos registrados para este cliente.</div>
              ) : (
                historyItems.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="text-white font-medium block">{item.reason}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.created_at).toLocaleString('es-AR')}
                      </span>
                    </div>
                    <span className={`font-mono font-bold text-sm ${item.points_change > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.points_change > 0 ? `+${item.points_change}` : item.points_change} pts
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setHistoryCustomer(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Crear Premio */}
      {isAdmin && (
        <Modal
          isOpen={isRewardModalOpen}
          onClose={() => setIsRewardModalOpen(false)}
          title="Crear Nueva Recompensa / Premio"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateReward} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Título de la Recompensa *</label>
              <input
                type="text"
                required
                placeholder="Ej. Descuento en Cera o Aceite"
                value={rewardTitle}
                onChange={(e) => setRewardTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Puntos Requeridos *</label>
              <input
                type="number"
                min="10"
                required
                value={rewardPoints}
                onChange={(e) => setRewardPoints(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-amber-400 font-bold text-base"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Descripción para el Cliente</label>
              <textarea
                rows={2}
                placeholder="Condiciones del canje..."
                value={rewardDesc}
                onChange={(e) => setRewardDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRewardModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl"
              >
                Guardar Recompensa
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Success notification modal */}
      <NotificationModal
        isOpen={!!redeemSuccessMsg}
        onClose={() => setRedeemSuccessMsg('')}
        title="¡Canje Exitoso!"
        message={redeemSuccessMsg}
        type="success"
      />
    </div>
  );
};
