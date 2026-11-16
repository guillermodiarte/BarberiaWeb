import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Scissors, UserCheck, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api';
import { CONFIG } from '../config';
import { Modal } from './common/Modal';

export const BookingSection = () => {
  const [settings, setSettings] = useState(null);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('16:00');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successBooking, setSuccessBooking] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [publicSettings, activeServices, activeBarbers] = await Promise.all([
          api.getPublicSettings().catch(() => ({})),
          api.getServices(false).catch(() => []),
          api.getPublicBarbers().catch(() => [])
        ]);
        setSettings(publicSettings);
        setServices(activeServices);
        setBarbers(activeBarbers);
        if (activeServices.length > 0) {
          setSelectedServiceId(String(activeServices[0].id));
        }
      } catch (err) {
        console.error('Error cargando datos de reserva:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const isBookingEnabled = settings?.online_booking_enabled !== 'false';
  const depositRequired = settings?.booking_deposit_required === 'true';
  const depositAmount = settings?.booking_deposit_amount || '2000';
  const aliasCbu = settings?.barbershop_cbu_alias || CONFIG.alias;

  // Tomorrow as default min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !bookingDate || !selectedServiceId) {
      setErrorMessage('Por favor completa todos los campos requeridos (*).');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      const payload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        service_id: parseInt(selectedServiceId),
        barber_id: selectedBarberId ? parseInt(selectedBarberId) : null,
        booking_date: bookingDate,
        start_time: bookingTime,
        notes: notes || null
      };

      const result = await api.createPublicBooking(payload);
      setSuccessBooking(result);
      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setNotes('');
    } catch (err) {
      setErrorMessage(err.message || 'Error al procesar la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedService = services.find(s => String(s.id) === String(selectedServiceId));

  return (
    <section id="reservas" className="py-20 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold uppercase tracking-widest mb-3">
            <Calendar className="w-4 h-4" />
            <span>Turnos Online</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold font-heading text-white tracking-tight">
            Reserva tu Turno en <span className="gradient-text">{CONFIG.name}</span>
          </h2>
          <p className="mt-3 text-slate-400 max-w-xl mx-auto">
            Elige tu servicio de preferencia, selecciona tu barbero y asegura tu horario en minutos.
          </p>
        </div>

        {!isBookingEnabled ? (
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-8 text-center shadow-xl">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Reservas Online Pausadas Momentáneamente</h3>
            <p className="text-slate-300 max-w-lg mx-auto mb-6">
              Por alta demanda estamos gestionando los turnos directamente por WhatsApp para coordinar el mejor horario disponible.
            </p>
            <a
              href={`https://wa.me/5491155551234?text=${encodeURIComponent('Hola BarberShop Elite! Quisiera consultar disponibilidad para un turno.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/40"
            >
              <span>Consultar por WhatsApp</span>
            </a>
          </div>
        ) : (
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl">
            {errorMessage && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-sm flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service & Barber Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Servicio o Combo *
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} - ${s.price.toLocaleString('es-AR')} ARS ({s.duration_minutes} min)
                      </option>
                    ))}
                  </select>
                  {selectedService && (
                    <p className="mt-2 text-xs text-amber-400">
                      ⏱ {selectedService.duration_minutes} minutos | 💈 ${selectedService.price.toLocaleString('es-AR')} ARS
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Barbero de Preferencia
                  </label>
                  <select
                    value={selectedBarberId}
                    onChange={(e) => setSelectedBarberId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="">Cualquier barbero disponible</option>
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Fecha del Turno *
                  </label>
                  <input
                    type="date"
                    required
                    min={minDateStr}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Horario de Inicio *
                  </label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    {['10:00', '10:45', '11:30', '12:15', '14:00', '14:45', '15:30', '16:15', '17:00', '17:45', '18:30', '19:15', '20:00'].map(t => (
                      <option key={t} value={t}>{t} hs</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 11 2345 6789"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="juan@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Deposit notice */}
              {depositRequired && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start space-x-3 text-sm">
                  <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300">Garantía anti-ausencias (Seña requerida):</span>
                    <p className="text-slate-300 text-xs mt-1">
                      Para confirmar tu turno solicitamos una seña mínima de <strong>${parseInt(depositAmount).toLocaleString('es-AR')} ARS</strong> (que se descontará de tu corte). Podrás transferir al alias <strong>{aliasCbu}</strong> tras enviar tu solicitud.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-lg rounded-2xl shadow-xl shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2"
              >
                <Scissors className="w-5 h-5 text-slate-950" />
                <span>{submitting ? 'Confirmando Reserva...' : 'Confirmar Reserva de Turno'}</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {successBooking && (
        <Modal
          isOpen={true}
          onClose={() => setSuccessBooking(null)}
          title="¡Reserva Registrada con Éxito!"
          maxWidth="max-w-lg"
        >
          <div className="text-center space-y-4 py-2">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <h4 className="text-2xl font-bold text-white">¡Te esperamos, {successBooking.customer_name}!</h4>
            
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left space-y-2 text-sm">
              <p><strong className="text-amber-400">Servicio:</strong> {successBooking.service_name}</p>
              <p><strong className="text-amber-400">Barbero:</strong> {successBooking.barber_name}</p>
              <p><strong className="text-amber-400">Fecha y Hora:</strong> {successBooking.booking_date} a las {successBooking.start_time} hs</p>
              {successBooking.deposit_amount > 0 && (
                <div className="pt-2 border-t border-slate-800 text-xs text-slate-300">
                  <p className="font-semibold text-amber-300">Instrucciones para transferir la seña:</p>
                  <p>Monto: ${successBooking.deposit_amount.toLocaleString('es-AR')} ARS</p>
                  <p>Alias: <strong>{aliasCbu}</strong></p>
                  <p className="text-slate-400 mt-1">Envía el comprobante por WhatsApp indicando tu nombre para confirmar inmediatamente.</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={`https://wa.me/5491155551234?text=${encodeURIComponent(`Hola! Acabo de reservar un turno en BarberShop Elite para el ${successBooking.booking_date} a las ${successBooking.start_time} hs a nombre de ${successBooking.customer_name}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-colors text-center"
              >
                Enviar Comprobante por WhatsApp
              </a>
              <button
                onClick={() => setSuccessBooking(null)}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
};

