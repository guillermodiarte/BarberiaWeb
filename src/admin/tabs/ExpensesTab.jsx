import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Trash2, Calendar, FileText, TrendingDown } from 'lucide-react';
import { api } from '../../api';
import { Modal, ConfirmDialog } from '../../components/common/Modal';

export const ExpensesTab = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('fixed');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState(null);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      const data = await api.getExpenses(params);
      setExpenses(data);
    } catch (err) {
      console.error('Error cargando gastos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [categoryFilter]);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!title || !amount || !expenseDate) {
      setModalError('Título, monto y fecha son obligatorios');
      return;
    }

    setSubmitting(true);
    setModalError('');
    try {
      await api.createExpense({
        title,
        category,
        amount: parseFloat(amount),
        description: description || null,
        expense_date: expenseDate
      });
      setIsModalOpen(false);
      setTitle('');
      setAmount('');
      setDescription('');
      loadExpenses();
    } catch (err) {
      setModalError(err.message || 'Error al registrar gasto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteExpense(deleteId);
      setDeleteId(null);
      loadExpenses();
    } catch (err) {
      alert(err.message || 'Error al eliminar gasto');
    }
  };

  const totalFixed = expenses.filter(e => e.category === 'fixed').reduce((acc, e) => acc + e.amount, 0);
  const totalVariable = expenses.filter(e => e.category === 'variable').reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">
            Registro de Gastos y Egresos del Salón
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gastos fijos (alquiler, servicios) y variables (compras de insumos) para determinar el beneficio neto real.
          </p>
        </div>

        <button
          onClick={() => {
            setModalError('');
            setIsModalOpen(true);
          }}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>Registrar Nuevo Gasto</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
            Gastos Fijos Acumulados
          </span>
          <div className="text-xl font-extrabold text-white font-heading mt-1">
            ${totalFixed.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">ARS</span>
          </div>
          <span className="text-[10px] text-slate-500">Alquiler del local, luz, internet, etc.</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
            Gastos Variables Acumulados
          </span>
          <div className="text-xl font-extrabold text-amber-400 font-heading mt-1">
            ${totalVariable.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">ARS</span>
          </div>
          <span className="text-[10px] text-slate-500">Insumos descartables, compras mayoristas</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
            Total Egresos Registrados
          </span>
          <div className="text-xl font-extrabold text-rose-400 font-heading mt-1">
            ${(totalFixed + totalVariable).toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">ARS</span>
          </div>
          <span className="text-[10px] text-slate-500">Deducible del control de caja</span>
        </div>
      </div>

      {/* Expenses Table - Responsive card/grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Header - Desktop */}
        <div className="hidden md:grid bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold px-4 py-3"
          style={{ gridTemplateColumns: '100px 1.5fr 110px 120px 1fr 36px' }}>
          <div>Fecha</div>
          <div>Concepto</div>
          <div>Categoría</div>
          <div>Monto (ARS)</div>
          <div>Descripción</div>
          <div></div>
        </div>

        <div className="divide-y divide-slate-800/50">
          {expenses.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No hay gastos registrados en esta categoría.
            </div>
          ) : (
            expenses.map((e) => (
              <div key={e.id} className="hover:bg-slate-800/30 transition-colors px-4 py-3">
                {/* Mobile layout */}
                <div className="flex flex-col gap-1.5 md:hidden text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-white text-sm block">{e.title}</span>
                      <span className="text-[11px] text-slate-400">{e.expense_date}</span>
                    </div>
                    <span className="font-extrabold text-rose-400 text-sm whitespace-nowrap">
                      -${e.amount.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      e.category === 'fixed'
                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                    }`}>
                      {e.category === 'fixed' ? 'Gasto Fijo' : 'Gasto Variable'}
                    </span>
                    {e.description && <span className="text-[11px] text-slate-400 truncate max-w-[180px]">{e.description}</span>}
                    <button
                      onClick={() => setDeleteId(e.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded-lg ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden md:grid items-center gap-3 text-xs"
                  style={{ gridTemplateColumns: '100px 1.5fr 110px 120px 1fr 36px' }}>
                  <div className="font-mono text-slate-300">{e.expense_date}</div>
                  <div className="font-bold text-white text-sm truncate">{e.title}</div>
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      e.category === 'fixed'
                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                    }`}>
                      {e.category === 'fixed' ? 'Gasto Fijo' : 'Gasto Variable'}
                    </span>
                  </div>
                  <div className="font-extrabold text-rose-400 text-sm whitespace-nowrap">
                    -${e.amount.toLocaleString('es-AR')}
                  </div>
                  <div className="text-slate-400 truncate text-[11px]">
                    {e.description || '—'}
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setDeleteId(e.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Eliminar gasto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal: Registrar Gasto */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nuevo Gasto Operativo"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
          {modalError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl">
              {modalError}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-300 mb-1">Concepto del Gasto *</label>
            <input
              type="text"
              required
              placeholder="Ej. Alquiler del salón, Edenor, Compra de geles"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Categoría *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              >
                <option value="fixed">Gasto Fijo (Alquiler, Luz, Internet)</option>
                <option value="variable">Gasto Variable (Insumos, Mantenimiento)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Monto (ARS) *</label>
              <input
                type="number"
                required
                placeholder="45000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-rose-400 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">Fecha del Gasto *</label>
            <input
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">Descripción / Observación</label>
            <textarea
              rows={2}
              placeholder="Número de factura o detalles..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
            />
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
              {submitting ? 'Guardando...' : 'Registrar Gasto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Gasto"
        message="¿Estás seguro de que deseas eliminar este gasto registrado?"
        isDanger={true}
        confirmText="Sí, Eliminar"
      />
    </div>
  );
};

