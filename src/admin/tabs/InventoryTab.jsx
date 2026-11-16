import React, { useState, useEffect } from 'react';
import { Package, Plus, AlertTriangle, ArrowUpDown, Edit, Trash2 } from 'lucide-react';
import { api } from '../../api';
import { Modal, ConfirmDialog } from '../../components/common/Modal';

export const InventoryTab = ({ user }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState(''); // '' | 'resale' | 'internal_supply'
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Create/Edit product modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('resale');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState(10);
  const [minStockAlert, setMinStockAlert] = useState(5);
  const [unit, setUnit] = useState('unidades');
  const [barberCommission, setBarberCommission] = useState(15);
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Stock quick adjustment modal
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjChange, setAdjChange] = useState('');
  const [adjReason, setAdjReason] = useState('Reposición de stock');
  const [adjusting, setAdjusting] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const loadInventory = async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (lowStockOnly) params.low_stock_only = true;
      const data = await api.getInventory(params);
      setItems(data);
    } catch (err) {
      console.error('Error cargando inventario:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [categoryFilter, lowStockOnly]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setCategory('resale');
    setCostPrice('');
    setSalePrice('');
    setStockQuantity(10);
    setMinStockAlert(5);
    setUnit('unidades');
    setBarberCommission(15);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (it) => {
    setEditingItem(it);
    setName(it.name);
    setDescription(it.description || '');
    setCategory(it.category);
    setCostPrice(String(it.cost_price));
    setSalePrice(String(it.sale_price));
    setStockQuantity(it.stock_quantity);
    setMinStockAlert(it.min_stock_alert);
    setUnit(it.unit || 'unidades');
    setBarberCommission(it.barber_commission_percentage || 15);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!name) {
      setModalError('El nombre es obligatorio');
      return;
    }

    setSubmitting(true);
    setModalError('');
    try {
      const payload = {
        name,
        description: description || null,
        category,
        cost_price: parseFloat(costPrice) || 0,
        sale_price: category === 'resale' ? (parseFloat(salePrice) || 0) : 0,
        stock_quantity: parseInt(stockQuantity) || 0,
        min_stock_alert: parseInt(minStockAlert) || 5,
        unit,
        barber_commission_percentage: category === 'resale' ? (parseFloat(barberCommission) || 0) : 0
      };

      if (editingItem) {
        await api.updateProduct(editingItem.id, payload);
      } else {
        await api.createProduct(payload);
      }

      setIsModalOpen(false);
      loadInventory();
    } catch (err) {
      setModalError(err.message || 'Error al guardar ítem de inventario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!adjustItem || !adjChange) return;

    setAdjusting(true);
    try {
      await api.adjustStock(adjustItem.id, parseInt(adjChange), adjReason);
      setAdjustItem(null);
      setAdjChange('');
      loadInventory();
    } catch (err) {
      alert(err.message || 'Error al ajustar stock');
    } finally {
      setAdjusting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteProduct(deleteId);
      setDeleteId(null);
      loadInventory();
    } catch (err) {
      alert(err.message || 'Error al desactivar producto');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">
            Inventario, Insumos Internos y Productos de Reventa
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Control de stock de materiales de trabajo del salón y productos cosméticos al público con comisión.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Nuevo Producto o Insumo</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Low Stock Toggle */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex space-x-2">
          {[
            { id: '', label: 'Todo el Inventario' },
            { id: 'resale', label: 'Productos de Reventa' },
            { id: 'internal_supply', label: 'Insumos Internos del Salón' }
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                categoryFilter === c.id ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
            className="rounded text-amber-500 focus:ring-0 bg-slate-950 border-slate-700"
          />
          <span className="flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Ver solo stock crítico</span>
          </span>
        </label>
      </div>

      {/* Table - Responsive */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Desktop Header */}
        <div className="hidden md:grid bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold px-4 py-3"
          style={{ gridTemplateColumns: '1.5fr 110px 120px 1.2fr 160px' }}>
          <div>Artículo / Insumo</div>
          <div>Categoría</div>
          <div>Stock</div>
          <div>Precios (Costo / Venta / Com.)</div>
          <div className="text-right">Acciones</div>
        </div>

        <div className="divide-y divide-slate-800/50">
          {items.map((it) => {
            const isCritical = it.stock_quantity <= it.min_stock_alert;

            return (
              <div key={it.id} className="hover:bg-slate-800/30 transition-colors px-4 py-3">
                {/* Mobile layout */}
                <div className="flex flex-col gap-2 md:hidden text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-white text-sm block">{it.name}</span>
                      {it.description && <span className="text-[11px] text-slate-400 block">{it.description}</span>}
                    </div>
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                      isCritical
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      <span>{it.stock_quantity} {it.unit}</span>
                      {isCritical && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      it.category === 'resale'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {it.category === 'resale' ? 'Reventa' : 'Insumo'}
                    </span>
                    {it.category === 'resale' ? (
                      <span className="font-extrabold text-amber-400">
                        Venta: ${it.sale_price?.toLocaleString('es-AR')}
                      </span>
                    ) : (
                      <span className="text-slate-400">Costo: ${it.cost_price?.toLocaleString('es-AR')}</span>
                    )}
                    {it.category === 'resale' && (
                      <span className="text-emerald-400">Com: {it.barber_commission_percentage}%</span>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-1.5 pt-1 border-t border-slate-800/60">
                    <button
                      onClick={() => {
                        setAdjustItem(it);
                        setAdjChange('');
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs font-semibold inline-flex items-center space-x-1"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                      <span>Ajustar Stock</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleOpenEdit(it)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                      >
                        Editar
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => setDeleteId(it.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden md:grid items-center gap-3 text-xs"
                  style={{ gridTemplateColumns: '1.5fr 110px 120px 1.2fr 160px' }}>
                  <div className="min-w-0">
                    <span className="font-bold text-white text-sm block truncate">{it.name}</span>
                    {it.description && <span className="text-[11px] text-slate-400 block truncate">{it.description}</span>}
                  </div>

                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      it.category === 'resale'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {it.category === 'resale' ? 'Reventa' : 'Insumo'}
                    </span>
                  </div>

                  <div>
                    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                      isCritical
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      <span>{it.stock_quantity} {it.unit}</span>
                      {isCritical && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">Mín: {it.min_stock_alert}</span>
                  </div>

                  <div>
                    {it.category === 'resale' ? (
                      <>
                        <span className="font-extrabold text-amber-400 text-sm block">
                          ${it.sale_price?.toLocaleString('es-AR')} ARS
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Costo: ${it.cost_price?.toLocaleString('es-AR')} · Com: <strong className="text-emerald-400">{it.barber_commission_percentage}%</strong>
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-white text-xs block">
                          Costo: ${it.cost_price?.toLocaleString('es-AR')} ARS
                        </span>
                        <span className="text-[10px] text-slate-500 block">Uso interno en salón</span>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end items-center space-x-1.5">
                    <button
                      onClick={() => {
                        setAdjustItem(it);
                        setAdjChange('');
                      }}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition-colors"
                      title="Ajustar stock"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                      <span>Stock</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleOpenEdit(it)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Editar
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => setDeleteId(it.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Crear / Editar Producto */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Ítem de Inventario' : 'Registrar Nuevo Ítem'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
          {modalError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl">
              {modalError}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-300 mb-1">Nombre del Producto / Insumo *</label>
            <input
              type="text"
              required
              placeholder="Ej. Cera Mate Fijación Fuerte (100g)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">Categoría *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
            >
              <option value="resale">📦 Producto de Reventa al Público (Cosméticos, Pomadas, Shampoos)</option>
              <option value="internal_supply">✂️ Insumo Interno del Salón (Hojas de navaja, geles, cuelleros)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Costo Unitario (ARS)</label>
              <input
                type="number"
                placeholder="4000"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
              />
            </div>

            {category === 'resale' ? (
              <div>
                <label className="block font-bold text-slate-300 mb-1">Precio de Venta al Público (ARS) *</label>
                <input
                  type="number"
                  placeholder="9500"
                  required
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-amber-400 font-bold"
                />
              </div>
            ) : (
              <div>
                <label className="block font-bold text-slate-300 mb-1">Unidad de Medida</label>
                <input
                  type="text"
                  placeholder="Ej. cajas, botellas, packs"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Stock Inicial</label>
              <input
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Alerta de Stock Mínimo</label>
              <input
                type="number"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
              />
            </div>
          </div>

          {category === 'resale' && (
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Comisión para el Barbero por Venta (%)
              </label>
              <input
                type="number"
                value={barberCommission}
                onChange={(e) => setBarberCommission(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-emerald-400 font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Porcentaje del precio de venta que se suma a la liquidación del barbero cuando él registra la venta.
              </span>
            </div>
          )}

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
              {submitting ? 'Guardando...' : 'Guardar Ítem'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Ajustar Stock */}
      {adjustItem && (
        <Modal
          isOpen={true}
          onClose={() => setAdjustItem(null)}
          title={`Ajustar Stock: ${adjustItem.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
            <p className="text-slate-300">
              Stock actual: <strong className="text-white">{adjustItem.stock_quantity} {adjustItem.unit}</strong>
            </p>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Cantidad a Sumar o Restar (ej. +10 o -2)
              </label>
              <input
                type="number"
                required
                placeholder="+5 o -1"
                value={adjChange}
                onChange={(e) => setAdjChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-amber-400 font-bold text-base"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Motivo del Ajuste</label>
              <input
                type="text"
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustItem(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={adjusting}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl"
              >
                {adjusting ? 'Aplicando...' : 'Confirmar Ajuste'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Desactivar Producto"
        message="¿Estás seguro de que deseas desactivar este producto del catálogo?"
        isDanger={true}
        confirmText="Sí, Desactivar"
      />
    </div>
  );
};

