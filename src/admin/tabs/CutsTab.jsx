import React, { useState, useEffect } from 'react';
import { 
  Scissors, Plus, Trash2, Filter, Search, CheckCircle2, 
  AlertCircle, User, CreditCard, X, UserPlus, Calendar, Sparkles, Gift
} from 'lucide-react';
import { api } from '../../api';
import { Modal, ConfirmDialog } from '../../components/common/Modal';

// Helper to get local date string YYYY-MM-DD
const getTodayStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const CutsTab = ({ user }) => {
  const [records, setRecords] = useState([]);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [systemSettings, setSystemSettings] = useState({
    points_per_cut: '10',
    points_for_free_cut: '50',
    allow_barber_collection: 'false'
  });
  const [loading, setLoading] = useState(true);

  // Filters - By default show TODAY's cuts as requested
  const [selectedBarberFilter, setSelectedBarberFilter] = useState('');
  const [isSettledFilter, setIsSettledFilter] = useState('');
  const [dateFrom, setDateFrom] = useState(getTodayStr());
  const [dateTo, setDateTo] = useState(getTodayStr());

  // Modal create
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceId, setServiceId] = useState('');
  const [barberId, setBarberId] = useState('');

  // Customer search & selection
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isNewCustomerMode, setIsNewCustomerMode] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerDni, setCustomerDni] = useState('');

  // Free Cut Redemption by Points
  const [redeemFreeCut, setRedeemFreeCut] = useState(false);

  // Payment Option: 'shop_transfer' | 'cash' | 'barber_transfer'
  const [paymentOption, setPaymentOption] = useState('shop_transfer');
  const [priceOverride, setPriceOverride] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [modalError, setModalError] = useState('');

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedBarberFilter) params.barber_id = selectedBarberFilter;
      if (isSettledFilter !== '') params.is_settled = isSettledFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const [recordsRes, servicesRes, barbersRes, settingsRes] = await Promise.all([
        api.getServiceRecords(params),
        api.getServices(false),
        api.getBarbers(false, true),
        api.getPublicSettings().catch(() => ({}))
      ]);
      setRecords(recordsRes || []);
      setServices(servicesRes || []);
      setBarbers(barbersRes || []);
      if (settingsRes) {
        setSystemSettings(settingsRes);
      }

      if (servicesRes && servicesRes.length > 0 && !serviceId) {
        setServiceId(String(servicesRes[0].id));
      }
      if (!barberId) {
        if (!isAdmin) {
          setBarberId(String(user.id));
        } else {
          // Admin: por defecto se selecciona a sí mismo si está en la lista
          const selfInList = barbersRes && barbersRes.find(b => b.id === user.id);
          if (selfInList) {
            setBarberId(String(user.id));
          } else if (barbersRes && barbersRes.length > 0) {
            setBarberId(String(barbersRes[0].id));
          }
        }
      }
    } catch (err) {
      console.error('Error cargando cortes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBarberFilter, isSettledFilter, dateFrom, dateTo]);

  // Debounced progressive customer search
  // Rules: search from 1 char for names; for pure digits, require at least 3 to avoid noise;
  // for phone prefixes with + or spaces (e.g. "+54", "011"), allow from 2 chars.
  useEffect(() => {
    const q = (customerSearchQuery || '').trim();
    if (!q || selectedCustomer) {
      setCustomerSearchResults([]);
      return;
    }

    // Decide minimum length based on query type
    const digits = q.replace(/\D/g, '');
    const hasPhonePrefix = /^[+0]/.test(q) || q.includes(' ') || q.includes('-');
    const isPureDigits = digits === q;
    const minLen = isPureDigits ? 3 : (hasPhonePrefix ? 2 : 1);

    if (q.length < minLen) {
      setCustomerSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingCustomer(true);
      try {
        const results = await api.getCustomers(q);
        setCustomerSearchResults(results || []);
      } catch (err) {
        console.error('Error buscando clientes:', err);
      } finally {
        setSearchingCustomer(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [customerSearchQuery, selectedCustomer]);

  const handleOpenCreateModal = () => {
    setModalError('');
    if (!isAdmin) {
      setBarberId(String(user.id));
    } else if (barbers.length > 0 && !barberId) {
      setBarberId(String(barbers[0].id));
    }
    setPaymentOption('shop_transfer');
    setPriceOverride('');
    setNotes('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerDni('');
    setSelectedCustomer(null);
    setRedeemFreeCut(false);
    setCustomerSearchQuery('');
    setCustomerSearchResults([]);
    setIsNewCustomerMode(false);
    setIsModalOpen(true);
  };

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    if (!serviceId || !barberId) {
      setModalError('Selecciona el servicio y el barbero');
      return;
    }

    setSubmitting(true);
    setModalError('');
    try {
      let finalCollectedBy = 'admin';
      let finalPaymentMethod = 'transfer_shop';

      if (redeemFreeCut) {
        finalCollectedBy = 'admin';
        finalPaymentMethod = 'bonified';
      } else if (paymentOption === 'barber_transfer') {
        finalCollectedBy = 'barber';
        finalPaymentMethod = 'transfer_barber';
      } else if (paymentOption === 'cash') {
        finalCollectedBy = 'admin';
        finalPaymentMethod = 'cash';
      } else {
        finalCollectedBy = 'admin';
        finalPaymentMethod = 'transfer_shop';
      }

      const payload = {
        service_id: parseInt(serviceId),
        barber_id: parseInt(barberId),
        customer_id: selectedCustomer ? selectedCustomer.id : null,
        customer_name: customerName ? customerName.trim() : null,
        customer_phone: customerPhone ? customerPhone.trim() : null,
        customer_dni: customerDni ? customerDni.trim() : null,
        price_override: (isAdmin && priceOverride && !redeemFreeCut) ? parseFloat(priceOverride) : null,
        collected_by: finalCollectedBy,
        payment_method: finalPaymentMethod,
        redeem_free_cut: redeemFreeCut,
        notes: notes || null
      };

      await api.createServiceRecord(payload);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setModalError(err.message || 'Error al registrar corte');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteServiceRecord(deleteId);
      setDeleteId(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Error al eliminar registro');
    }
  };

  // Preview calculations in modal
  const selectedServiceObj = services.find(s => String(s.id) === String(serviceId));
  const selectedBarberObj = barbers.find(b => String(b.id) === String(barberId)) || user;
  const pointsForFreeCut = parseInt(systemSettings.points_for_free_cut || '50', 10);
  const pointsPerCut = parseInt(systemSettings.points_per_cut || '10', 10);
  const allowBarberCollection = systemSettings.allow_barber_collection === 'true';

  let currentPrice = 0;
  let previewBarberEarnings = 0;
  let previewShopEarnings = 0;
  let previewDebtText = '';

  if (redeemFreeCut) {
    currentPrice = 0;
    previewBarberEarnings = 0;
    previewShopEarnings = 0;
    previewDebtText = 'Corte 100% Bonificado (Canje de Puntos) - Sin deuda';
  } else {
    currentPrice = (isAdmin && priceOverride) ? parseFloat(priceOverride) || 0 : (selectedServiceObj?.price || 0);
    const selectedBarberIsAdmin = selectedBarberObj?.role === 'admin' || selectedBarberObj?.role === 'superadmin';
    if (selectedBarberIsAdmin) {
      // El admin/dueño realiza el corte: toda la ganancia va a la barbería
      previewBarberEarnings = 0;
      previewShopEarnings = currentPrice;
    } else if (selectedBarberObj?.payment_scheme === 'fixed_rent') {
      previewBarberEarnings = currentPrice;
      previewShopEarnings = 0;
    } else {
      const rate = selectedBarberObj?.commission_percentage || 50;
      previewBarberEarnings = currentPrice * (rate / 100);
      previewShopEarnings = currentPrice - previewBarberEarnings;
    }

    if (selectedBarberIsAdmin) {
      previewDebtText = 'Cobrado íntegramente por la barbería (Administrador)';
    } else if (paymentOption === 'barber_transfer') {
      previewDebtText = previewShopEarnings > 0 
        ? `Barbero debe entregar $${previewShopEarnings.toLocaleString('es-AR')} ARS a la barbería`
        : 'Alquiler fijo - Barbero retiene el 100%';
    } else {
      previewDebtText = previewBarberEarnings > 0 
        ? `La barbería debe liquidar $${previewBarberEarnings.toLocaleString('es-AR')} ARS al barbero`
        : 'Cobrado por la barbería';
    }
  }

  const isTodayActive = dateFrom === getTodayStr() && dateTo === getTodayStr();

  return (
    <div className="space-y-6">
      {/* Header & Action Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading flex items-center space-x-2">
            <Scissors className="w-6 h-6 text-amber-400" />
            <span>Registro de Cortes y Servicios (CRM)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Muestra por defecto los cortes del día. Puedes consultar cualquier otra fecha mediante los filtros.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2 active:scale-95"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>Registrar Nuevo Corte</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800/60">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white">
              {isTodayActive ? 'Mostrando Cortes de HOY' : 'Filtrando por Rango de Fechas'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              ({records.length} {records.length === 1 ? 'servicio' : 'servicios'})
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setDateFrom(getTodayStr());
                setDateTo(getTodayStr());
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isTodayActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              📅 Solo Hoy
            </button>
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !dateFrom && !dateTo
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Ver Histórico Completo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {isAdmin && (
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Filtrar por Barbero</label>
              <select
                value={selectedBarberFilter}
                onChange={(e) => setSelectedBarberFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Todos los barberos</option>
                {barbers.map(b => (
                  <option key={b.id} value={b.id}>{b.full_name}</option>
                ))}
              </select>
            </div>
          )}

          {isAdmin && (
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Liquidación en Cierre de Caja</label>
              <select
                value={isSettledFilter}
                onChange={(e) => setIsSettledFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Todos</option>
                <option value="false">Pendientes de liquidar</option>
                <option value="true">Ya liquidados</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Fecha Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Fecha Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Table of records - card-based layout to avoid horizontal scroll */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Table header - hidden on mobile, shown md+ */}
        <div className="hidden md:grid bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold px-4 py-3"
          style={{ gridTemplateColumns: isAdmin ? '110px 1.5fr 1fr 1fr 1fr 36px' : '110px 2fr 1fr 1fr' }}>
          <div>Fecha</div>
          <div>Servicio / Cliente</div>
          <div>Barbero</div>
          <div>Cobro</div>
          {isAdmin && <div>Deuda / Estado</div>}
          {isAdmin && <div></div>}
        </div>

        <div className="divide-y divide-slate-800/50">
          {records.length === 0 ? (
            <div className="text-center py-14 text-slate-500 text-sm">
              {isTodayActive 
                ? 'No hay cortes registrados hoy todavía. Hacé clic en "Registrar Nuevo Corte" para comenzar.'
                : 'No hay registros de cortes en el período seleccionado.'}
            </div>
          ) : (
            records.map((r) => {
              const dateObj = new Date(r.created_at);
              const dateStr = dateObj.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
              const timeStr = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

              const paymentLabel = r.price === 0
                ? '🎁 Canje Puntos'
                : r.payment_method === 'cash'
                  ? '💵 Efectivo'
                  : r.payment_method === 'transfer_shop'
                    ? '🏦 Transf. Barbería'
                    : '📱 Transf. Barbero';

              const collectorLabel = r.price === 0
                ? 'Bonificado'
                : r.collected_by === 'barber' ? 'Cobró Barbero' : 'Cobró La Casa';

              const isDebtBarber = r.who_owes_whom?.includes('Barbero debe');
              const isDebtShop = r.who_owes_whom?.includes('debe a') && !isDebtBarber;

              return (
                <div
                  key={r.id}
                  className="hover:bg-slate-800/30 transition-colors px-4 py-3"
                >
                  {/* Mobile layout: stacked cards */}
                  <div className="flex flex-col gap-1.5 md:hidden">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white text-sm truncate">{r.service_name}</span>
                          {r.price === 0 && (
                            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-extrabold uppercase shrink-0">GRATIS</span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">{r.customer_name || 'Sin registrar'}{r.customer_phone ? ` · ${r.customer_phone}` : ''}</span>
                        {r.loyalty_points_awarded > 0 && <span className="text-[10px] text-amber-400 font-bold"> +{r.loyalty_points_awarded} pts</span>}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono text-slate-400 block">{dateStr} {timeStr}</span>
                        <span className="font-bold text-white text-sm">{r.price === 0 ? '$0' : `$${r.price.toLocaleString('es-AR')}`}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="text-amber-400 font-semibold">{r.barber_name}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400">{paymentLabel}</span>
                      {isAdmin && (
                        <>
                          <span className="text-slate-500">·</span>
                          <span className={`px-1.5 py-0.5 rounded-full font-semibold ${
                            r.is_settled ? 'bg-slate-800 text-slate-400' : 'bg-amber-500/20 text-amber-300'
                          }`}>{r.is_settled ? 'Liquidado' : 'Pendiente'}</span>
                        </>
                      )}
                      {isAdmin && !r.is_settled && (
                        <button onClick={() => setDeleteId(r.id)} className="ml-auto p-1 text-slate-500 hover:text-rose-400 rounded-lg transition-colors" title="Eliminar">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Desktop layout: grid columns */}
                  <div className="hidden md:grid items-center gap-3"
                    style={{ gridTemplateColumns: isAdmin ? '110px 1.5fr 1fr 1fr 1fr 36px' : '110px 2fr 1fr 1fr' }}>
                    {/* Fecha */}
                    <div className="text-xs font-mono text-slate-400">
                      <span className="text-white font-semibold">{dateStr}</span>
                      <span className="block text-slate-500">{timeStr}</span>
                    </div>

                    {/* Servicio + Cliente */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-white text-xs truncate">{r.service_name}</span>
                        {r.price === 0 && (
                          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-extrabold uppercase shrink-0">GRATIS</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block truncate">{r.customer_name || 'Sin registrar'}</span>
                      {r.customer_phone && <span className="text-[10px] text-slate-500 font-mono block">{r.customer_phone}</span>}
                      {r.loyalty_points_awarded > 0 && <span className="text-[10px] text-amber-400 font-bold">+{r.loyalty_points_awarded} pts</span>}
                    </div>

                    {/* Barbero */}
                    <div>
                      <span className="text-amber-400 font-semibold text-xs block">{r.barber_name}</span>
                      <span className="text-[10px] text-slate-500">
                        {r.barber_payout_scheme === 'commission' ? `${r.barber_rate}% com.` : 'Alq. Fijo'}
                      </span>
                    </div>

                    {/* Cobro: precio + método */}
                    <div>
                      <span className={`font-bold text-sm block ${r.price === 0 ? 'text-emerald-400' : 'text-white'}`}>
                        {r.price === 0 ? '$0' : `$${r.price.toLocaleString('es-AR')}`}
                      </span>
                      <span className="text-[11px] text-slate-300 block">{paymentLabel}</span>
                      <span className="text-[10px] text-slate-500">{collectorLabel}</span>
                    </div>

                    {/* Deuda + Estado (solo visible para admin/superadmin) */}
                    {isAdmin && (
                      <div className="space-y-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold leading-tight ${
                          r.price === 0
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : isDebtBarber
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : isDebtShop
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                : 'bg-slate-800 text-slate-400'
                        }`}>
                          {r.price === 0 ? 'Sin deuda' : r.who_owes_whom}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold block w-fit ${
                          r.is_settled 
                            ? 'bg-slate-800 text-slate-400 border border-slate-700' 
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {r.is_settled ? 'Liquidado en Caja' : 'Pendiente de liquidar'}
                        </span>
                      </div>
                    )}

                    {/* Acción */}
                    {isAdmin && (
                      <div className="flex justify-end">
                        {!r.is_settled && (
                          <button
                            onClick={() => setDeleteId(r.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Eliminar corte"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Registrar Corte */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nuevo Corte / Servicio"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateRecord} className="space-y-4 text-sm">
          {modalError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Service picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Servicio o Combo *
            </label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
            >
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} - ${s.price.toLocaleString('es-AR')} ARS
                </option>
              ))}
            </select>
          </div>

          {/* Barber picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Barbero que realizó el servicio *
            </label>
            <select
              value={barberId}
              onChange={(e) => setBarberId(e.target.value)}
              disabled={!isAdmin}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 disabled:opacity-70"
            >
              {barbers.map(b => (
                <option key={b.id} value={b.id}>
                  {b.full_name}
                  {b.role === 'admin' || b.role === 'superadmin'
                    ? ' (Administrador)'
                    : b.payment_scheme === 'commission'
                      ? ` (${b.commission_percentage}% comisión)`
                      : ' (Alquiler Fijo)'}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Lookup & Loyalty */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Fidelización de Cliente (+{pointsPerCut} pts automáticos)
              </span>
              {selectedCustomer ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setRedeemFreeCut(false);
                    setCustomerName('');
                    setCustomerPhone('');
                    setCustomerDni('');
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Cambiar
                </button>
              ) : !isNewCustomerMode ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsNewCustomerMode(true);
                    if (customerSearchQuery) {
                      const clean = customerSearchQuery.trim();
                      if (/^[+0-9\s-]+$/.test(clean)) {
                        setCustomerPhone(clean);
                      } else {
                        setCustomerName(clean);
                      }
                    }
                  }}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-lg text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95"
                >
                  <UserPlus className="w-4 h-4 text-slate-950" />
                  <span>+ Nuevo Cliente</span>
                </button>
              ) : null}
            </div>

            {selectedCustomer ? (
              <div className="space-y-3">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-xs">{selectedCustomer.full_name}</span>
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-bold">
                        {selectedCustomer.loyalty_points || 0} pts
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Tel: {selectedCustomer.phone || 'Sin teléfono'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-emerald-400 font-bold block">
                      {redeemFreeCut ? '🎁 Corte Gratis Canjeado' : `✓ Sumará +${pointsPerCut} pts`}
                    </span>
                  </div>
                </div>

                {/* Free cut redemption card (Both Barber and Admin see this if customer has enough points) */}
                {selectedCustomer.loyalty_points >= pointsForFreeCut && (
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    redeemFreeCut 
                      ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/10' 
                      : 'bg-slate-900 border-amber-500/40 text-slate-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <Gift className="w-5 h-5 text-amber-400 shrink-0" />
                        <div>
                          <span className="font-extrabold text-amber-400 text-xs block uppercase tracking-wider">
                            ¡Beneficio Disponible! Corte 100% Gratis
                          </span>
                          <span className="text-[11px] text-slate-300 block">
                            Tiene <strong>{selectedCustomer.loyalty_points} pts</strong>. Puede canjear este corte por <strong>{pointsForFreeCut} pts</strong> o seguir acumulando.
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRedeemFreeCut(!redeemFreeCut)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all shrink-0 ml-3 ${
                          redeemFreeCut
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-slate-800 text-amber-400 border border-amber-500/40 hover:bg-slate-700'
                        }`}
                      >
                        {redeemFreeCut ? '✓ Canje Aplicado' : 'Canjear Corte Gratis'}
                      </button>
                    </div>

                    {redeemFreeCut && (
                      <div className="mt-2.5 pt-2 border-t border-amber-500/30 flex items-center justify-between text-[11px] text-amber-300 font-semibold">
                        <span>💵 Total a cobrar al cliente: $0 ARS</span>
                        <span>⭐ Puntos a descontar: -{pointsForFreeCut} pts</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : !isNewCustomerMode ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Nombre (desde 1 letra) · Tel. (desde 3 dígitos: 351, 011, +549...)"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  {searchingCustomer ? (
                    <div className="absolute right-3 top-3">
                      <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : customerSearchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerSearchQuery('');
                        setCustomerSearchResults([]);
                      }}
                      className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-white rounded-md"
                      title="Limpiar búsqueda"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>

                {/* Dropdown search results */}
                {customerSearchResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl divide-y divide-slate-800 shadow-xl">
                    {customerSearchResults.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerName(c.full_name);
                          setCustomerPhone(c.phone);
                          setCustomerDni(c.dni || '');
                          setCustomerSearchResults([]);
                          setCustomerSearchQuery('');
                        }}
                        className="w-full p-2.5 text-left hover:bg-slate-800/80 flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <span className="font-bold text-white block">{c.full_name}</span>
                          <span className="text-[10px] text-slate-400">Tel: {c.phone}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded block">
                            {c.loyalty_points || 0} pts
                          </span>
                          {c.loyalty_points >= pointsForFreeCut && (
                            <span className="text-[9px] text-emerald-400 font-bold">¡Corte Gratis!</span>
                          )}
                        </div>
                      </button>
                    ))}
                    {/* Option to create new even if results exist */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewCustomerMode(true);
                        if (customerSearchQuery) {
                          const clean = customerSearchQuery.trim();
                          if (/^[+0-9\s-]+$/.test(clean)) {
                            setCustomerPhone(clean);
                          } else {
                            setCustomerName(clean);
                          }
                        }
                      }}
                      className="w-full p-2.5 text-left bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold text-xs flex items-center space-x-2 transition-colors border-t border-slate-800"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                      <span>+ ¿No es ninguno de ellos? Registrar nuevo cliente</span>
                    </button>
                  </div>
                )}

                {/* If searched and nothing found: prominent card with Register button */}
                {(() => {
                  const q = customerSearchQuery.trim();
                  const digits = q.replace(/\D/g, '');
                  const hasPhonePrefix = /^[+0]/.test(q) || q.includes(' ') || q.includes('-');
                  const isPureDigits = digits === q;
                  const minLen = isPureDigits ? 3 : (hasPhonePrefix ? 2 : 1);
                  const isSearching = q.length >= minLen;
                  return isSearching && customerSearchResults.length === 0 && !searchingCustomer;
                })() && (
                  <div className="p-3 bg-slate-900/90 border border-slate-700/80 rounded-xl space-y-2.5">
                    <p className="text-xs text-slate-400">
                      No se encontró ningún cliente existente para <strong className="text-white font-semibold">"{customerSearchQuery}"</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewCustomerMode(true);
                        const clean = customerSearchQuery.trim();
                        if (/^[+0-9\s-]+$/.test(clean)) {
                          setCustomerPhone(clean);
                        } else {
                          setCustomerName(clean);
                        }
                      }}
                      className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 active:scale-98"
                    >
                      <UserPlus className="w-4 h-4 text-slate-950" />
                      <span>Registrar "{customerSearchQuery}" como Nuevo Cliente</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    Búsqueda inteligente con o sin acentos y teléfonos en cualquier formato (0351, +549, 15...).
                  </span>
                </div>
              </div>
            ) : (
              /* New customer manual entry */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Registrar nuevo cliente</span>
                  <button
                    type="button"
                    onClick={() => setIsNewCustomerMode(false)}
                    className="text-xs text-slate-400 hover:text-white underline font-medium"
                  >
                    ← Volver al buscador
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      placeholder="Ej. Lucas Gómez"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Teléfono / WhatsApp *</label>
                    <input
                      type="tel"
                      placeholder="Ej. 351 314-6924"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Unified Payment Selector (Only if not free cut) */}
          {!redeemFreeCut ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                ¿Quién cobra y medio de pago? *
              </label>
              <div className={`grid grid-cols-1 ${(allowBarberCollection || isAdmin) ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-2.5`}>
                {/* Option 1: Shop Transfer */}
                <button
                  type="button"
                  onClick={() => setPaymentOption('shop_transfer')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    paymentOption === 'shop_transfer'
                      ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-base">🏦</span>
                    <span className="font-bold text-xs text-white">Transf. Barbería</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">Cobra la casa (cuenta oficial)</span>
                </button>

                {/* Option 2: Cash */}
                <button
                  type="button"
                  onClick={() => setPaymentOption('cash')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    paymentOption === 'cash'
                      ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-base">💵</span>
                    <span className="font-bold text-xs text-white">Efectivo en Caja</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">Dinero físico en el local</span>
                </button>

                {/* Option 3: Barber Transfer (Only if enabled or Admin) */}
                {(allowBarberCollection || isAdmin) && (
                  <button
                    type="button"
                    onClick={() => setPaymentOption('barber_transfer')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      paymentOption === 'barber_transfer'
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-base">📱</span>
                      <span className="font-bold text-xs text-white">Transf. Barbero</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">Cobra el barbero a su cuenta</span>
                  </button>
                )}
              </div>
              {!allowBarberCollection && (
                <p className="text-[10px] text-slate-500 mt-1.5 italic">
                  ℹ️ Cobro directo por transferencia al barbero deshabilitado por administración.
                </p>
              )}
            </div>
          ) : (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-xs text-emerald-400">
              <Gift className="w-4 h-4 shrink-0" />
              <span>Corte 100% bonificado por canje de puntos. No requiere registrar cobro monetario.</span>
            </div>
          )}

          {/* Price override: ONLY for Admin and not free cut */}
          {isAdmin && !redeemFreeCut && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Precio Especial / Descuento (Solo Administrador)
              </label>
              <input
                type="number"
                placeholder={`Precio de lista: $${selectedServiceObj?.price || 0}`}
                value={priceOverride}
                onChange={(e) => setPriceOverride(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 text-xs font-mono"
              />
            </div>
          )}

          {/* Real-time Calculation Preview Card */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Total a Cobrar:</span>
              <strong className={redeemFreeCut ? 'text-emerald-400 font-extrabold text-sm' : 'text-white'}>
                {redeemFreeCut ? '$0 ARS (¡CORTE GRATIS!)' : `$${currentPrice.toLocaleString('es-AR')} ARS`}
              </strong>
            </div>
            {!redeemFreeCut && (
              <>
                <div className="flex justify-between text-slate-300">
                  <span>Ganancia Barbero:</span>
                  <strong className="text-amber-400">${previewBarberEarnings.toLocaleString('es-AR')} ARS</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Ganancia Barbería:</span>
                  <strong className="text-amber-400">${previewShopEarnings.toLocaleString('es-AR')} ARS</strong>
                </div>
              </>
            )}
            <div className="pt-2 border-t border-amber-500/20 text-amber-300 font-bold flex justify-between">
              <span>Quién le debe a quién:</span>
              <span>{previewDebtText}</span>
            </div>
            <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between">
              <span>⭐ Movimiento de Puntos de Fidelización:</span>
              <strong className={redeemFreeCut ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
                {redeemFreeCut ? `-${pointsForFreeCut} pts (Canjeados)` : `+${pointsPerCut} pts`}
              </strong>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold shadow-lg shadow-amber-500/20 active:scale-95"
            >
              {submitting ? 'Guardando...' : redeemFreeCut ? 'Confirmar Corte Bonificado' : 'Confirmar y Registrar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Registro de Corte"
        message="¿Estás seguro de que deseas eliminar este registro de corte? Si se otorgaron puntos o se descontó stock, no se revertirá automáticamente."
        isDanger={true}
        confirmText="Sí, Eliminar"
      />
    </div>
  );
};
