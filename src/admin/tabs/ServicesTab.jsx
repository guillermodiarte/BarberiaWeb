import React, { useState, useEffect } from 'react';
import { Scissors, Plus, TrendingUp, Edit, Trash2, CheckCircle2, Sparkles } from 'lucide-react';
import { api } from '../../api';
import { Modal, ConfirmDialog } from '../../components/common/Modal';

export const ServicesTab = () => {
  const [services, setServices] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit / Create modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [price, setPrice] = useState('');
  const [isCombo, setIsCombo] = useState(false);
  const [comboItemsStr, setComboItemsStr] = useState('');
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Mass price update modal
  const [isMassModalOpen, setIsMassModalOpen] = useState(false);
  const [percentage, setPercentage] = useState(15);
  const [roundTo, setRoundTo] = useState(100);
  const [massSubmitting, setMassSubmitting] = useState(false);

  // Delete modal
  const [deleteId, setDeleteId] = useState(null);

  const loadServices = async () => {
    setLoading(true);
    try {
      const [srvRes, supRes] = await Promise.all([
        api.getServices(true),
        api.getInventory({ category: 'internal_supply' }).catch(() => [])
      ]);
      setServices(srvRes);
      setSupplies(supRes);
    } catch (err) {
      console.error('Error cargando servicios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleOpenCreate = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setDurationMinutes(30);
    setPrice('');
    setIsCombo(false);
    setComboItemsStr('');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (srv) => {
    setEditingService(srv);
    setName(srv.name);
    setDescription(srv.description || '');
    setDurationMinutes(srv.duration_minutes);
    setPrice(String(srv.price));
    setIsCombo(srv.is_combo);
    try {
      const parsed = JSON.parse(srv.combo_items_json || '[]');
      setComboItemsStr(Array.isArray(parsed) ? parsed.join(', ') : '');
    } catch {
      setComboItemsStr('');
    }
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!name || !price) {
      setModalError('El nombre y el precio son obligatorios');
      return;
    }

    setSubmitting(true);
    setModalError('');

    let comboArray = [];
    if (isCombo && comboItemsStr) {
      comboArray = comboItemsStr.split(',').map(s => s.trim()).filter(Boolean);
    }

    try {
      const payload = {
        name,
        description: description || null,
        duration_minutes: parseInt(durationMinutes) || 30,
        price: parseFloat(price),
        is_combo: isCombo,
        combo_items_json: JSON.stringify(comboArray)
      };

      if (editingService) {
        await api.updateService(editingService.id, payload);
      } else {
        await api.createService(payload);
      }

      setIsModalOpen(false);
      loadServices();
    } catch (err) {
      setModalError(err.message || 'Error al guardar servicio');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMassUpdate = async (e) => {
    e.preventDefault();
    setMassSubmitting(true);
    try {
      await api.massUpdatePrices(parseFloat(percentage), parseInt(roundTo));
      setIsMassModalOpen(false);
      loadServices();
    } catch (err) {
      alert(err.message || 'Error al aplicar aumento masivo');
    } finally {
      setMassSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteService(deleteId);
      setDeleteId(null);
      loadServices();
    } catch (err) {
      alert(err.message || 'Error al eliminar servicio');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">
            Gestión de Servicios, Combos y Tarifas (ARS)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configuración de catálogo para el salón y reservas públicas con ajuste inflacionario masivo.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setIsMassModalOpen(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl text-xs transition-colors border border-amber-500/30 flex items-center space-x-2"
          >
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Ajuste Masivo x Inflación</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Nuevo Servicio o Combo</span>
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((srv) => (
          <div
            key={srv.id}
            className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
              srv.is_combo
                ? 'bg-gradient-to-br from-amber-950/20 to-slate-900 border-amber-500/40 shadow-lg shadow-amber-950/20'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  srv.is_combo ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                }`}>
                  {srv.is_combo ? 'Combo Promocional' : 'Servicio Individual'}
                </span>
                <span className="text-xs text-slate-400">⏱ {srv.duration_minutes} min</span>
              </div>

              <h4 className="text-lg font-bold text-white mb-1">{srv.name}</h4>
              <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                {srv.description || 'Sin descripción'}
              </p>

              {srv.is_combo && srv.combo_items_json && (
                <div className="mt-3 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">Incluye:</span>
                  <div className="text-slate-300">
                    {(() => {
                      try {
                        const items = JSON.parse(srv.combo_items_json);
                        return items.join(' + ');
                      } catch {
                        return srv.combo_items_json;
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Tarifa</span>
                <span className="text-xl font-extrabold text-amber-400 font-heading">
                  ${srv.price.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">ARS</span>
                </span>
              </div>

              <div className="flex space-x-1.5">
                <button
                  onClick={() => handleOpenEdit(srv)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors"
                  title="Editar servicio"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(srv.id)}
                  className="p-2 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                  title="Desactivar servicio"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Crear / Editar Servicio */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'Editar Servicio o Combo' : 'Crear Nuevo Servicio o Combo'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveService} className="space-y-4 text-xs">
          {modalError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl">
              {modalError}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-300 mb-1">Nombre del Servicio *</label>
            <input
              type="text"
              required
              placeholder="Ej. Corte Clásico / Degradé"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">Descripción</label>
            <textarea
              rows={2}
              placeholder="Detalle de lo que incluye el servicio..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Precio (ARS) *</label>
              <input
                type="number"
                required
                placeholder="8000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Duración Estimada (min)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs"
              />
            </div>
          </div>

          {/* Combo Checkbox */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isCombo}
                onChange={(e) => setIsCombo(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <span className="font-bold text-slate-200">¿Es un Combo Promocional?</span>
            </label>

            {isCombo && (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Servicios que integran el combo (separados por coma):
                </label>
                <input
                  type="text"
                  placeholder="Corte Fade, Ritual de Barba, Cejas"
                  value={comboItemsStr}
                  onChange={(e) => setComboItemsStr(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                />
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
              {submitting ? 'Guardando...' : 'Guardar Servicio'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Actualización Masiva de Precios (Inflación) */}
      <Modal
        isOpen={isMassModalOpen}
        onClose={() => setIsMassModalOpen(false)}
        title="Actualización Masiva de Tarifas (Inflación ARS)"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleMassUpdate} className="space-y-4 text-xs">
          <p className="text-slate-300">
            Aumenta o ajusta los precios de todos los servicios activos en base a un porcentaje. Los precios se redondearán automáticamente para facilitar el cambio en caja.
          </p>

          <div>
            <label className="block font-bold text-slate-300 mb-1">Porcentaje de Ajuste (%)</label>
            <input
              type="number"
              step="0.5"
              required
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-amber-400 text-lg font-bold"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Ejemplo: 15 aplica un +15% de aumento a las tarifas vigentes.
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">Redondear a Múltiplos de (ARS)</label>
            <select
              value={roundTo}
              onChange={(e) => setRoundTo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
            >
              <option value="50">Redondear a $50 ARS</option>
              <option value="100">Redondear a $100 ARS (Recomendado)</option>
              <option value="500">Redondear a $500 ARS</option>
              <option value="1000">Redondear a $1.000 ARS</option>
            </select>
          </div>

          {/* Quick Preview table */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-bold text-amber-400 block uppercase">Ejemplo de Simulación:</span>
            {services.slice(0, 3).map(s => {
              const previewNew = Math.round((s.price * (1 + percentage / 100)) / roundTo) * roundTo;
              return (
                <div key={s.id} className="flex justify-between text-[11px] text-slate-300">
                  <span>{s.name}:</span>
                  <span>${s.price} ➔ <strong className="text-emerald-400">${previewNew} ARS</strong></span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsMassModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={massSubmitting}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl"
            >
              {massSubmitting ? 'Aplicando...' : 'Aplicar Aumento a Todos'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Desactivar Servicio"
        message="¿Estás seguro de que deseas desactivar este servicio del catálogo público y de administración?"
        isDanger={true}
        confirmText="Sí, Desactivar"
      />
    </div>
  );
};

