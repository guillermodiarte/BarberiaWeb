import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '../../api';
import { Modal, ConfirmDialog } from '../../components/common/Modal';

export const SalesTab = ({ user }) => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Sale Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [barberId, setBarberId] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [collectedBy, setCollectedBy] = useState('barber');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const loadData = async () => {
    setLoading(true);
    try {
      const [salesRes, prodRes, barbRes] = await Promise.all([
        api.getProductSales(),
        api.getInventory({ category: 'resale' }),
        api.getBarbers(false)
      ]);
      setSales(salesRes);
      setProducts(prodRes);
      setBarbers(barbRes);

      if (prodRes.length > 0 && !productId) {
        setProductId(String(prodRes[0].id));
      }
      if (!barberId) {
        if (!isAdmin) {
          setBarberId(String(user.id));
        } else if (barbRes.length > 0) {
          setBarberId(String(barbRes[0].id));
        }
      }
    } catch (err) {
      console.error('Error cargando ventas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setModalError('');
    if (!isAdmin) {
      setBarberId(String(user.id));
      setCollectedBy('barber');
    } else {
      setCollectedBy('admin');
    }
    setQuantity(1);
    setCustomerPhone('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleCreateSale = async (e) => {
    e.preventDefault();
    if (!productId) {
      setModalError('Selecciona el producto a vender');
      return;
    }

    setSubmitting(true);
    setModalError('');
    try {
      const payload = {
        product_id: parseInt(productId),
        quantity: parseInt(quantity) || 1,
        barber_id: barberId ? parseInt(barberId) : null,
        customer_phone: customerPhone || null,
        collected_by: collectedBy,
        payment_method: paymentMethod,
        notes: notes || null
      };

      await api.createProductSale(payload);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setModalError(err.message || 'Error al registrar venta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteProductSale(deleteId);
      setDeleteId(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Error al anular venta');
    }
  };

  const selectedProd = products.find(p => String(p.id) === String(productId));
  const totalAmount = selectedProd ? selectedProd.sale_price * quantity : 0;
  const commPercent = selectedProd?.barber_commission_percentage || 0;
  const barberCommAmount = barberId ? totalAmount * (commPercent / 100) : 0;
  const shopEarnings = totalAmount - barberCommAmount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">
            Ventas de Productos de Reventa
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro de venta al público con cálculo automático de comisión para el barbero y deducción de stock.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>Registrar Venta de Producto</span>
        </button>
      </div>

      {/* Sales Table - Card/Grid responsive layout */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Header - Desktop */}
        <div className="hidden md:grid bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold px-4 py-3"
          style={{ gridTemplateColumns: isAdmin ? '100px 1.5fr 1fr 1fr 1fr 36px' : '100px 1.5fr 1fr 1fr 1fr' }}>
          <div>Fecha</div>
          <div>Producto</div>
          <div>Vendedor / Cliente</div>
          <div>Cobro / Canal</div>
          <div>Comisión / Barbería</div>
          {isAdmin && <div></div>}
        </div>

        <div className="divide-y divide-slate-800/50">
          {sales.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No hay ventas registradas aún.
            </div>
          ) : (
            sales.map((s) => {
              const dateObj = new Date(s.created_at);
              const dateStr = dateObj.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
              const timeStr = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={s.id} className="hover:bg-slate-800/30 transition-colors px-4 py-3">
                  {/* Mobile layout */}
                  <div className="flex flex-col gap-1.5 md:hidden text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white text-sm">{s.product_name}</span>
                          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold text-[10px]">x{s.quantity}</span>
                        </div>
                        <span className="text-slate-400 text-[11px]">Vendido por: <strong className="text-slate-300">{s.barber_name}</strong></span>
                        {s.customer_name && <span className="text-slate-500 text-[10px] block">Cli: {s.customer_name}</span>}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-mono block">{dateStr} {timeStr}</span>
                        <span className="font-extrabold text-white text-sm">${s.total_amount.toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[11px] pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400">
                        {s.collected_by === 'barber' ? '💈 Cobró Barbero' : '🏢 Cobró La Casa'} ({s.payment_method === 'cash' ? 'Efectivo' : 'Transf.'})
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="text-emerald-400 font-semibold">Comisión: ${s.barber_commission_amount.toLocaleString('es-AR')}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-amber-300 font-semibold">Barbería: ${s.shop_earnings.toLocaleString('es-AR')}</span>
                      {isAdmin && !s.is_settled && (
                        <button onClick={() => setDeleteId(s.id)} className="ml-auto p-1 text-slate-400 hover:text-rose-400 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:grid items-center gap-3 text-xs"
                    style={{ gridTemplateColumns: isAdmin ? '100px 1.5fr 1fr 1fr 1fr 36px' : '100px 1.5fr 1fr 1fr 1fr' }}>
                    <div className="font-mono text-slate-400">
                      <span className="text-white font-semibold">{dateStr}</span>
                      <span className="block text-[11px] text-slate-500">{timeStr}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-white truncate">{s.product_name}</span>
                        <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold text-[10px] shrink-0">x{s.quantity}</span>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <span className="font-semibold text-slate-200 block truncate">{s.barber_name}</span>
                      {s.customer_name && <span className="text-[11px] text-slate-500 block truncate">Cli: {s.customer_name}</span>}
                    </div>

                    <div>
                      <span className="font-extrabold text-white text-sm block">${s.total_amount.toLocaleString('es-AR')}</span>
                      <span className="text-[11px] text-slate-400 block">
                        {s.collected_by === 'barber' ? '💈 Barbero' : '🏢 La Casa'} · {s.payment_method === 'cash' ? 'Efectivo' : 'Transf.'}
                      </span>
                    </div>

                    <div>
                      <span className="font-bold text-emerald-400 block">
                        {s.barber_commission_amount > 0 ? `Comisión: $${s.barber_commission_amount.toLocaleString('es-AR')}` : 'Sin comisión'}
                      </span>
                      <span className="text-[11px] text-amber-300 block">
                        Barbería: ${s.shop_earnings.toLocaleString('es-AR')}
                      </span>
                    </div>

                    {isAdmin && (
                      <div className="flex justify-end">
                        {!s.is_settled && (
                          <button
                            onClick={() => setDeleteId(s.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Anular venta y reponer stock"
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

      {/* Modal: Registrar Venta */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Venta de Producto de Reventa"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateSale} className="space-y-4 text-xs">
          {modalError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl">
              {modalError}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-300 mb-1">Producto a Vender *</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} - ${p.sale_price.toLocaleString('es-AR')} ARS (Stock: {p.stock_quantity})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Cantidad *</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-base font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Vendido por *</label>
              <select
                value={barberId}
                onChange={(e) => setBarberId(e.target.value)}
                disabled={!isAdmin}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white disabled:opacity-70"
              >
                <option value="">Venta Directa de Administración</option>
                {barbers.map(b => (
                  <option key={b.id} value={b.id}>{b.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">¿Quién cobró el dinero? *</label>
              <select
                value={collectedBy}
                onChange={(e) => setCollectedBy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
              >
                <option value="barber">💈 El Barbero</option>
                <option value="admin">🏢 Administración / Caja</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Medio de Pago *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
              >
                <option value="cash">💵 Efectivo</option>
                <option value="transfer_shop">🏦 Transferencia a Barbería</option>
                <option value="transfer_barber">📱 Transferencia al Barbero</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Teléfono de Cliente (para sumar puntos de fidelidad)
            </label>
            <input
              type="tel"
              placeholder="Ej. 11 2345 6789"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
            />
          </div>

          {/* Live calculation breakdown */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-300">Total a Cobrar:</span>
              <strong className="text-white">${totalAmount.toLocaleString('es-AR')} ARS</strong>
            </div>
            {barberId && (
              <div className="flex justify-between">
                <span className="text-slate-300">Comisión Barbero ({commPercent}%):</span>
                <strong className="text-emerald-400">+${barberCommAmount.toLocaleString('es-AR')} ARS</strong>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-300">Ingreso Barbería:</span>
              <strong className="text-amber-400">${shopEarnings.toLocaleString('es-AR')} ARS</strong>
            </div>
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
              {submitting ? 'Registrando...' : 'Confirmar Venta'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Anular Venta"
        message="¿Estás seguro de anular esta venta? El stock del producto se restablecerá automáticamente."
        isDanger={true}
        confirmText="Sí, Anular Venta"
      />
    </div>
  );
};

