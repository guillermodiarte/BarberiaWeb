import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, Mail, MessageSquare, ExternalLink, Navigation } from 'lucide-react';
import { CONFIG } from '../config';
import { api } from '../api';

const Contact = () => {
  const [publicSettings, setPublicSettings] = useState(null);

  useEffect(() => {
    api.getPublicSettings()
      .then(data => setPublicSettings(data))
      .catch(err => console.log('Usando configuración por defecto en contacto:', err));
  }, []);

  const barbershopName = publicSettings?.barbershop_name || CONFIG.name;
  const address = publicSettings?.barbershop_address || CONFIG.address;
  const phone = publicSettings?.barbershop_phone || CONFIG.phone;
  const mapsUrl = publicSettings?.barbershop_google_maps_url || `https://maps.google.com/?q=${encodeURIComponent(address)}`;
  
  // Free interactive embed URL based on address or custom embed URL
  const customEmbed = publicSettings?.barbershop_google_maps_embed_url?.trim();
  const embedUrl = customEmbed && customEmbed.startsWith('http')
    ? customEmbed
    : `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  const contactInfo = [
    {
      icon: MapPin,
      title: "Ubicación",
      details: [address],
      action: {
        label: "Ver en Google Maps",
        url: mapsUrl
      }
    },
    {
      icon: Phone,
      title: "Teléfono / WhatsApp",
      details: [phone, "Atención directa para turnos y consultas"],
      action: {
        label: "Enviar WhatsApp",
        url: `https://wa.me/${phone.replace(/[^0-9]/g, '')}`
      }
    },
    {
      icon: Clock,
      title: "Horarios de Salón",
      details: ["Lun-Vie: 10:00 - 20:30", "Sáb: 09:30 - 20:00", "Dom: Cerrado"]
    },
    {
      icon: Mail,
      title: "Email",
      details: [CONFIG.email]
    }
  ];

  return (
    <section id="contacto" className="py-20 px-4 bg-slate-950">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-amber-400 font-semibold text-xs uppercase tracking-widest px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
            Estamos para atenderte
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4 mt-3">
            <span className="text-white">Contáctanos en</span>{' '}
            <span className="gradient-text">{barbershopName}</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Visítanos en nuestro salón o escríbenos directamente por WhatsApp para coordinar tu cita o evento especial.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactInfo.map((info, index) => {
            const Icon = info.icon;
            return (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center text-center justify-between shadow-lg hover:border-amber-500/30 transition-all duration-300"
              >
                <div>
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400 mb-4 mx-auto">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">{info.title}</h4>
                  {info.details.map((detail, idx) => (
                    <p key={idx} className="text-slate-400 text-xs leading-relaxed">{detail}</p>
                  ))}
                </div>

                {info.action && (
                  <a
                    href={info.action.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-colors"
                  >
                    <span>{info.action.label}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Google Maps Interactive Embed */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-12 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl relative"
        >
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3 bg-slate-950/80">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-heading">
                  Nuestra Ubicación en el Mapa
                </h4>
                <p className="text-xs text-slate-400">
                  {address}
                </p>
              </div>
            </div>

            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow-md active:scale-95"
              >
                <Navigation className="w-4 h-4" />
                <span>Abrir en GPS</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div className="w-full h-80 sm:h-96 relative bg-slate-950">
            <iframe
              title={`Mapa de ubicación de ${barbershopName}`}
              src={embedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          </div>
        </motion.div>

        {/* Action Buttons: WhatsApp & Google Maps Navigation */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${barbershopName}! Quisiera hacer una consulta.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-base shadow-xl shadow-emerald-950/40 transition-transform hover:-translate-y-0.5"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Chatear por WhatsApp Ahora</span>
          </a>

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-4 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-2xl text-base border border-amber-500/40 shadow-xl transition-transform hover:-translate-y-0.5"
            >
              <Navigation className="w-5 h-5 text-amber-400" />
              <span>Cómo Llegar (Google Maps)</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

export default Contact;
