import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, CheckCircle2, AlertCircle, Coins, 
  CreditCard, Calendar, Store, Phone, MapPin, Hash, Sparkles,
  ExternalLink, Navigation, HelpCircle, ShieldCheck, Palette,
  Image as ImageIcon, Check, RefreshCw, Sliders, Plus, Trash2, ArrowUp, ArrowDown, UploadCloud, Eye, Globe
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const SettingsTab = () => {
  const { user, isSuperAdmin } = useAuth();
  const { 
    themes, 
    currentTheme, 
    activeThemeId, 
    changeTheme, 
    updateBranding,
    bannerSlides,
    bannerInterval,
    updateBannerSettings,
    sectionsVisibility = {},
    updateSectionVisibility
  } = useTheme();

  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState(isSuperAdmin ? 'themes' : 'sections');
  const [savingKey, setSavingKey] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Branding states for SuperAdmin
  const [selectedThemeId, setSelectedThemeId] = useState(activeThemeId || 'gold_elite');
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [brandTagline, setBrandTagline] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandCustomColor, setBrandCustomColor] = useState('');
  const [brandPageTabTitle, setBrandPageTabTitle] = useState('');
  const [brandFaviconUrl, setBrandFaviconUrl] = useState('');
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  // Banner Carousel states
  const [editingSlides, setEditingSlides] = useState([]);
  const [editingInterval, setEditingInterval] = useState(5);
  const [uploadingSlideIdx, setUploadingSlideIdx] = useState(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await api.getSettings();
      const map = {};
      data.forEach(item => {
        map[item.key] = item.value;
      });
      setSettings(map);

      setSelectedThemeId(map.active_theme || 'gold_elite');
      setBrandLogoUrl(map.barbershop_logo_url || '');
      setBrandTagline(map.barbershop_tagline || '');
      setBrandName(map.barbershop_name || '');
      setBrandCustomColor(map.custom_primary_color || '');
      setBrandPageTabTitle(map.page_tab_title || '');
      setBrandFaviconUrl(map.barbershop_favicon_url || '');
    } catch (err) {
      console.error('Error cargando configuraciones:', err);
      setErrorMsg('No se pudieron cargar las configuraciones del sistema.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (bannerSlides && bannerSlides.length > 0) {
      setEditingSlides(bannerSlides);
    }
  }, [bannerSlides]);

  useEffect(() => {
    if (bannerInterval) {
      setEditingInterval(bannerInterval);
    }
  }, [bannerInterval]);

  const handleUpdate = async (key, val) => {
    setSavingKey(key);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.updateSetting(key, String(val));
      setSettings(prev => ({ ...prev, [key]: String(val) }));
      setSuccessMsg('Configuración actualizada correctamente');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar configuración');
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveBarbershopInfo = async () => {
    setSavingKey('barbershop_info');
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await Promise.all([
        api.updateSetting('barbershop_name', settings.barbershop_name || ''),
        api.updateSetting('barbershop_phone', settings.barbershop_phone || ''),
        api.updateSetting('barbershop_address', settings.barbershop_address || ''),
        api.updateSetting('barbershop_google_maps_url', settings.barbershop_google_maps_url || ''),
        api.updateSetting('barbershop_google_maps_embed_url', settings.barbershop_google_maps_embed_url || ''),
        api.updateSetting('barbershop_cbu_alias', settings.barbershop_cbu_alias || '')
      ]);
      setSuccessMsg('Datos comerciales y ubicación de la barbería guardados con éxito');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar datos comerciales');
    } finally {
      setSavingKey(null);
    }
  };

  // Banner Carousel Handlers
  const handleSaveBanner = async () => {
    setSavingKey('banner_settings');
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await updateBannerSettings({
        newSlides: editingSlides,
        newInterval: Number(editingInterval)
      });
      setSuccessMsg('Configuración del banner principal guardada correctamente');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar configuración del banner');
    } finally {
      setSavingKey(null);
    }
  };

  const handleSlideChange = (index, field, value) => {
    setEditingSlides(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddSlide = () => {
    setEditingSlides(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        title: 'Nuevo Título de Banner',
        subtitle: 'Personaliza este texto con tus promociones o descripción de corte.',
        image_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1920&q=80'
      }
    ]);
  };

  const handleDeleteSlide = (index) => {
    if (editingSlides.length <= 1) {
      setErrorMsg('Debe haber al menos una foto en el banner');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    setEditingSlides(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveSlide = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= editingSlides.length) return;
    setEditingSlides(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  const handleUploadSlideImage = async (index, file) => {
    if (!file) return;
    setUploadingSlideIdx(index);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'banner');
      const res = await api.uploadMedia(formData);
      if (res?.success && res.url) {
        handleSlideChange(index, 'image_url', res.url);
        setSuccessMsg(`Foto optimizada y subida como WebP (${res.filename})`);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al subir y optimizar imagen del banner');
    } finally {
      setUploadingSlideIdx(null);
    }
  };

  const handleToggleSection = async (sectionKey, isEnabled) => {
    setSavingKey(`section_${sectionKey}`);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await updateSectionVisibility(sectionKey, isEnabled);
      setSettings(prev => {
        const keyMap = {
          services: 'section_services_enabled',
          booking: 'online_booking_enabled',
          loyalty: 'section_loyalty_enabled',
          about: 'section_about_enabled',
          gallery: 'section_gallery_enabled',
          team: 'section_team_enabled',
          contact: 'section_contact_enabled',
        };
        const dbKey = keyMap[sectionKey];
        return dbKey ? { ...prev, [dbKey]: String(isEnabled) } : prev;
      });
      setSuccessMsg(`Sección ${isEnabled ? 'habilitada' : 'deshabilitada'} correctamente en la web y el menú.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Error al actualizar visibilidad de la sección');
    } finally {
      setSavingKey(null);
    }
  };

  const handleApplyTheme = async (themeId) => {
    setSelectedThemeId(themeId);
    setSavingKey(`theme_${themeId}`);
    try {
      await changeTheme(themeId);
      setSettings(prev => ({ ...prev, active_theme: themeId }));
      setSuccessMsg(`Paleta de colores cambiada a: ${themes.find(t => t.id === themeId)?.name}`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setErrorMsg('Error al aplicar el tema');
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveBranding = async () => {
    setSavingKey('branding_superadmin');
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await updateBranding({
        newLogoUrl: brandLogoUrl,
        newTagline: brandTagline,
        newCustomColor: brandCustomColor,
        newName: brandName,
        newPageTabTitle: brandPageTabTitle,
        newFaviconUrl: brandFaviconUrl
      });
      setSuccessMsg('Personalización estética, logo, favicon y título guardados exitosamente');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar personalización de marca');
    } finally {
      setSavingKey(null);
    }
  };

  const handleUploadFavicon = async (file) => {
    if (!file) return;
    setUploadingFavicon(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'sistema');
      formData.append('is_favicon', 'true');
      const res = await api.uploadMedia(formData);
      if (res?.success && res.url) {
        setBrandFaviconUrl(res.url);
        // Persistir inmediatamente el nuevo favicon para comodidad del usuario
        await updateBranding({ newFaviconUrl: res.url });
        setSuccessMsg(`Favicon optimizado, redimensionado a formato .ICO estándar (${res.filename})`);
        setTimeout(() => setSuccessMsg(''), 3500);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al subir y procesar el favicon');
    } finally {
      setUploadingFavicon(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-400">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mr-3" />
        <span className="text-sm font-medium">Cargando configuraciones del sistema...</span>
      </div>
    );
  }

  const allowBarberColl = settings.allow_barber_collection === 'true';
  const onlineBookingEnabled = settings.online_booking_enabled === 'true';
  const bookingDepositRequired = settings.booking_deposit_required === 'true';

  const subTabs = [
    ...(isSuperAdmin ? [{ id: 'themes', label: '🎨 Estilos & Temas (SuperAdmin)', icon: Palette, highlight: true }] : []),
    { id: 'sections', label: '👁️ Secciones de la Web', icon: Eye },
    { id: 'barbershop', label: 'Barbería y Ubicación', icon: Store },
    { id: 'banner', label: '🖼️ Banner & Slider', icon: ImageIcon },
    { id: 'loyalty', label: 'Fidelización y Puntos', icon: Sparkles },
    { id: 'payments', label: 'Cobros y Finanzas', icon: CreditCard },
    { id: 'booking', label: 'Reservas y Turnos', icon: Calendar },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading flex items-center space-x-2">
            <Settings className="w-6 h-6 text-amber-400" />
            <span>Configuración del Sistema</span>
            {isSuperAdmin && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30">
                MODO SUPERADMIN
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Personaliza los datos institucionales, mapa de Google, políticas de fidelización y personalización visual multicliente.
          </p>
        </div>

        {isSuperAdmin && (
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Autenticado como:</span>
            <span className="text-xs font-mono font-bold text-amber-300">guillermo.diarte@gmail.com</span>
          </div>
        )}
      </div>

      {/* Alert Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center space-x-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center space-x-2 shadow-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Responsive Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl scrollbar-thin">
        {subTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-1 sm:flex-initial justify-center sm:justify-start ${
                isActive
                  ? tab.highlight 
                    ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-lg shadow-red-600/20 font-extrabold'
                    : 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : tab.highlight
                  ? 'text-red-400 hover:text-white hover:bg-red-950/30 border border-red-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.highlight ? 'text-red-400' : 'text-amber-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB SUPERADMIN: PALETA DE COLORES, LOGOS Y ESTÉTICA */}
      {activeSubTab === 'themes' && isSuperAdmin && (
        <div className="space-y-6">
          {/* Theme Selector Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
            <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-red-600/15 text-red-400 rounded-xl border border-red-500/30">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-heading">
                    Selector de Paleta de Colores & Temas Visuales
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cambia instantáneamente la estética para diferenciar las páginas de cada cliente/barbería.
                  </p>
                </div>
              </div>

              <div className="px-3 py-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                Tema Activo: <strong className="text-amber-400">{themes.find(t => t.id === selectedThemeId)?.name}</strong>
              </div>
            </div>

            {/* 5 Themes Grid - Fully responsive (1 col mobile, 2 sm, 3 lg, 5 on widescreen) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {themes.map(t => {
                const isSelected = selectedThemeId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleApplyTheme(t.id)}
                    className={`cursor-pointer rounded-2xl p-4 border transition-all duration-300 flex flex-col justify-between space-y-3 relative overflow-hidden group ${
                      isSelected
                        ? 'bg-slate-950 border-2 shadow-xl ring-2 ring-amber-500/30'
                        : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                    style={{
                      borderColor: isSelected ? t.primary : undefined
                    }}
                  >
                    {/* Barber Pole special visual bar */}
                    {t.isBarberPole && (
                      <div className="h-1.5 w-full absolute top-0 left-0"
                        style={{
                          backgroundImage: 'repeating-linear-gradient(-45deg, #dc2626 0px, #dc2626 12px, #ffffff 12px, #ffffff 24px, #2563eb 24px, #2563eb 36px, #ffffff 36px, #ffffff 48px)'
                        }}
                      />
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{t.icon}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.badgeClass}`}>
                          {t.tag}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                        <span>{t.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                        {t.description}
                      </p>
                    </div>

                    <div>
                      {/* Color Palette Samples */}
                      <div className="flex items-center space-x-2 pt-2 border-t border-slate-800/80">
                        <span className="text-[10px] text-slate-500 font-medium">Muestra:</span>
                        <div className="flex items-center space-x-1.5">
                          {t.previewColors.map((color, idx) => (
                            <div 
                              key={idx} 
                              className="w-5 h-5 rounded-full border border-slate-700 shadow-sm"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>

                        <button
                          type="button"
                          className={`ml-auto px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 font-extrabold'
                              : 'bg-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          {isSelected ? '✓ Activo' : 'Elegir'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Branding & Logo Customization Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-heading">
                  Adecuación de Logo & Identidad de Marca
                </h3>
                <p className="text-xs text-slate-400">
                  Configura el logotipo oficial, el slogan y ajusta la marca para el cliente que adquirió la web.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {/* Logo URL */}
              <div className="col-span-full space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  URL del Logotipo de la Barbería (PNG o SVG transparente recomendado)
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="url"
                    placeholder="Ej. https://mi-dominio.com/logo-barberia.png"
                    value={brandLogoUrl}
                    onChange={(e) => setBrandLogoUrl(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs font-mono focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  {brandLogoUrl && (
                    <div className="flex items-center space-x-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl shrink-0">
                      <span className="text-[11px] text-slate-400">Preview:</span>
                      <img src={brandLogoUrl} alt="Logo Preview" className="h-7 w-auto object-contain rounded" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Si no se especifica una URL de logo, el sistema mostrará automáticamente el icono y tipografía oficial del tema seleccionado.
                </p>
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Nombre de la Barbería / Marca
                </label>
                <input
                  type="text"
                  placeholder="Ej. Old Skull Barber Club"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Slogan o Bajada de Marca
                </label>
                <input
                  type="text"
                  placeholder="Ej. Tradición, precisión y estilo masculino"
                  value={brandTagline}
                  onChange={(e) => setBrandTagline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Custom Primary Color (Hex) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Color Primario HEX (Opcional)
                </label>
                <div className="flex items-center space-x-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-3 text-slate-500 font-mono text-xs">#</span>
                    <input
                      type="text"
                      placeholder="Ej. d97706 o dejar vacío"
                      value={brandCustomColor.replace('#', '')}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setBrandCustomColor(val ? (val.startsWith('#') ? val : `#${val}`) : '');
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-3 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  {brandCustomColor && (
                    <div 
                      className="w-10 h-10 rounded-xl border border-slate-700 shadow-md shrink-0"
                      style={{ backgroundColor: brandCustomColor }}
                      title="Muestra del color"
                    />
                  )}
                  {brandCustomColor && (
                    <button
                      type="button"
                      onClick={() => setBrandCustomColor('')}
                      className="px-3 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleSaveBranding}
                disabled={savingKey === 'branding_superadmin'}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{savingKey === 'branding_superadmin' ? 'Guardando...' : 'Guardar Identidad & Marca'}</span>
              </button>
            </div>
          </div>

          {/* Pestaña del Navegador & Favicon (SEO / Branding) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-heading">
                    Pestaña del Navegador & Favicon (SEO & Identidad)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Modifica el texto visible en la pestaña del navegador (HTML &lt;title&gt;) y el icono oficial (Favicon) que verán los clientes al ingresar a la web.
                  </p>
                </div>
              </div>

              {/* Vista previa simulada de pestaña del navegador */}
              <div className="w-full sm:w-auto min-w-[280px] bg-slate-950 p-3 rounded-2xl border border-slate-800 shadow-inner">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                  Vista Previa en el Navegador:
                </span>
                <div className="flex items-center space-x-2.5 bg-slate-900 px-3 py-2 rounded-xl border border-slate-700/60 max-w-sm shadow-md">
                  {brandFaviconUrl ? (
                    <img 
                      src={brandFaviconUrl} 
                      alt="Favicon preview" 
                      className="w-4 h-4 object-contain rounded shrink-0" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-xs shrink-0">💈</span>
                  )}
                  <span className="text-xs font-medium text-slate-200 truncate flex-1 font-mono">
                    {brandPageTabTitle || `${brandName || 'BarberShop Elite'} - ${brandTagline || 'Peluquería Masculina'}`}
                  </span>
                  <span className="text-slate-500 hover:text-slate-300 text-xs shrink-0 cursor-default">×</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Texto de la pestaña */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Texto de la Pestaña (&lt;title&gt;)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`Ej. ${brandName || 'BarberShop Elite'} - Peluquería & Reservas`}
                    value={brandPageTabTitle}
                    onChange={(e) => setBrandPageTabTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  {brandPageTabTitle && (
                    <button
                      type="button"
                      onClick={() => setBrandPageTabTitle('')}
                      className="absolute right-3 top-3 text-[10px] text-slate-400 hover:text-amber-400 font-bold"
                      title="Usar nombre de barbería + slogan por defecto"
                    >
                      Restablecer
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Texto que verán los usuarios en la parte superior de Google Chrome, Safari, pestañas de celular y cuando compartan el enlace de la web.
                </p>
              </div>

              {/* Favicon URL y subida */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Favicon de la Pestaña (Conversión automática a .ICO)
                </label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="text"
                    placeholder="URL del icono o subí un archivo..."
                    value={brandFaviconUrl}
                    onChange={(e) => setBrandFaviconUrl(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs font-mono focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  
                  {/* Botón de subida de archivo */}
                  <label className={`px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all border border-slate-700 hover:border-amber-500/50 flex items-center space-x-1.5 shrink-0 ${
                    uploadingFavicon ? 'opacity-50 cursor-not-allowed' : ''
                  }`}>
                    <UploadCloud className="w-4 h-4 text-amber-400" />
                    <span>{uploadingFavicon ? 'Procesando...' : 'Subir'}</span>
                    <input
                      type="file"
                      accept="image/png,image/x-icon,image/svg+xml,image/webp,image/jpeg"
                      onChange={(e) => e.target.files?.[0] && handleUploadFavicon(e.target.files[0])}
                      className="hidden"
                      disabled={uploadingFavicon}
                    />
                  </label>

                  {/* Vista previa icono */}
                  {brandFaviconUrl && (
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                      <img 
                        src={brandFaviconUrl} 
                        alt="Favicon preview" 
                        className="w-6 h-6 object-contain" 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {brandFaviconUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setBrandFaviconUrl('');
                        updateBranding({ newFaviconUrl: '' });
                      }}
                      className="p-2.5 text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                      title="Quitar Favicon personalizado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Cualquier imagen que subas (PNG, JPG, SVG, WebP) se recortará automáticamente a formato cuadrado y se transformará en un archivo <strong className="text-amber-400">.ICO</strong> ultraliviano (&lt; 5 KB) con resoluciones estándar para todos los navegadores.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleSaveBranding}
                disabled={savingKey === 'branding_superadmin'}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{savingKey === 'branding_superadmin' ? 'Guardando...' : 'Guardar Pestaña & Favicon'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB SECCIONES: GESTIÓN DE VISIBILIDAD EN LA WEB */}
      {activeSubTab === 'sections' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-heading">
                  Control de Secciones Visibles en la Página Web
                </h3>
                <p className="text-xs text-slate-400">
                  Activa o desactiva qué secciones aparecen en la landing page. Al deshabilitar una sección, desaparecerá de la página y de los menús automáticamente.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: 'services',
                title: 'Catálogo de Servicios & Tarifas',
                subtitle: 'Muestra el listado de servicios, combos, duraciones y precios en pesos.',
                anchor: '#servicios',
                menuLabel: 'Servicios',
                icon: '✂️'
              },
              {
                id: 'booking',
                title: 'Módulo de Reservas & Turnos Online',
                subtitle: 'Permite a los clientes elegir servicio, barbero y reservar su cita.',
                anchor: '#reservas',
                menuLabel: 'Reservar Turno',
                icon: '📅'
              },
              {
                id: 'loyalty',
                title: 'Programa de Fidelización & Puntos',
                subtitle: 'Consulta de puntos acumulados para clientes por teléfono y canje de cortes gratis.',
                anchor: '#puntos',
                menuLabel: 'Puntos Elite',
                icon: '✨'
              },
              {
                id: 'about',
                title: 'Nuestra Historia / Sobre Nosotros',
                subtitle: 'Reseña histórica, filosofía, fotografías del salón y tradición barbera.',
                anchor: '#nosotros',
                menuLabel: 'Historia',
                icon: '📖'
              },
              {
                id: 'gallery',
                title: 'Galería de Trabajos & Cortes',
                subtitle: 'Galería de fotos de cortes, degradados (fade), barbas y ambiente del local.',
                anchor: '#galeria',
                menuLabel: 'Galería',
                icon: '📸'
              },
              {
                id: 'team',
                title: 'Nuestro Equipo de Barberos',
                subtitle: 'Presentación de los maestros barberos con sus especialidades y fotos.',
                anchor: '#equipo',
                menuLabel: 'Equipo',
                icon: '👥'
              },
              {
                id: 'contact',
                title: 'Contacto, Horarios & Google Maps',
                subtitle: 'Tarjetas de WhatsApp, horarios de atención, dirección y mapa interactivo incrustado.',
                anchor: '#contacto',
                menuLabel: 'Contacto',
                icon: '📍'
              }
            ].map((section) => {
              const isEnabled = sectionsVisibility[section.id] !== false;
              const isSaving = savingKey === `section_${section.id}`;

              return (
                <div
                  key={section.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                    isEnabled
                      ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-950/40 border-slate-800/50 opacity-70'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-2.5">
                        <span className="text-xl">{section.icon}</span>
                        <h4 className="text-sm font-bold text-white font-heading">
                          {section.title}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                        {section.anchor}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {section.subtitle}
                    </p>

                    <div className="text-[11px] text-slate-500">
                      Nombre en el menú:{' '}
                      <strong className="text-slate-300">"{section.menuLabel}"</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                      isEnabled ? 'text-emerald-400' : 'text-slate-500'
                    }`}>
                      {isEnabled ? '● Visible en la Web' : '○ Oculta en la Web'}
                    </span>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleToggleSection(section.id, !isEnabled)}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all border active:scale-95 flex items-center space-x-1.5 ${
                        isEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
                      }`}
                    >
                      <span>{isSaving ? 'Guardando...' : isEnabled ? '✓ HABILITADA' : '✕ DESHABILITADA'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 1: DATOS DE LA BARBERÍA Y UBICACIÓN GOOGLE MAPS */}
      {activeSubTab === 'barbershop' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Datos de la Barbería y Ubicación en Google Maps
              </h3>
              <p className="text-xs text-slate-400">
                Información institucional que se muestra a los clientes en la landing page y en la sección de contacto.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Nombre Comercial de la Barbería
              </label>
              <input
                type="text"
                placeholder="Ej. BarberShop Elite"
                value={settings.barbershop_name || ''}
                onChange={(e) => setSettings({ ...settings, barbershop_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Teléfono / WhatsApp de Contacto
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Ej. +54 9 351 314-6924"
                  value={settings.barbershop_phone || ''}
                  onChange={(e) => setSettings({ ...settings, barbershop_phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-3 text-white text-xs font-mono focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Alias / CBU Oficial de Cobro
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Ej. barbershop.elite.mp o 00000031..."
                  value={settings.barbershop_cbu_alias || ''}
                  onChange={(e) => setSettings({ ...settings, barbershop_cbu_alias: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-3 text-amber-400 font-mono text-xs font-bold focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div className="col-span-full">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Dirección Física del Local
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Ej. Av. Santa Fe 2450, Nueva Córdoba, Córdoba"
                  value={settings.barbershop_address || ''}
                  onChange={(e) => setSettings({ ...settings, barbershop_address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-3 text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* GOOGLE MAPS URL & EMBED CONFIGURATION */}
            <div className="col-span-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <Navigation className="w-4 h-4 text-amber-400" />
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Enlace de Ubicación en Google Maps (URL / Compartir)
                  </label>
                </div>
                {settings.barbershop_google_maps_url && (
                  <a
                    href={settings.barbershop_google_maps_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-bold transition-colors"
                  >
                    <span>Probar Enlace en Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <input
                type="url"
                placeholder="Ej. https://maps.app.goo.gl/... o https://maps.google.com/?q=..."
                value={settings.barbershop_google_maps_url || ''}
                onChange={(e) => setSettings({ ...settings, barbershop_google_maps_url: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs font-mono focus:outline-none focus:border-amber-500 transition-colors"
              />

              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  URL del Mapa Interactivo Incrustado (Iframe Embed - Opcional)
                </label>
                <input
                  type="url"
                  placeholder="Ej. https://maps.google.com/maps?q=... o dejar vacío para autogenerar con la dirección"
                  value={settings.barbershop_google_maps_embed_url || ''}
                  onChange={(e) => setSettings({ ...settings, barbershop_google_maps_embed_url: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs font-mono focus:outline-none focus:border-amber-500 transition-colors"
                />
                <p className="text-[11px] text-slate-500">
                  Si dejas este campo vacío, la página pública generará automáticamente el mapa interactivo centrado en la dirección física de la barbería.
                </p>
              </div>

              {/* Live interactive map preview */}
              <div className="pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Vista Previa del Mapa Incrustado:
                </span>
                <div className="w-full h-56 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 relative">
                  <iframe
                    title="Google Maps Preview"
                    src={
                      settings.barbershop_google_maps_embed_url ||
                      `https://maps.google.com/maps?q=${encodeURIComponent(settings.barbershop_address || 'Av. Santa Fe 2450, CABA, Argentina')}&t=&z=16&ie=UTF8&iwloc=&output=embed`
                    }
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleSaveBarbershopInfo}
              disabled={savingKey === 'barbershop_info'}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{savingKey === 'barbershop_info' ? 'Guardando...' : 'Guardar Información de la Barbería'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB BANNER: GESTIÓN DE FOTOS Y SLIDER PRINCIPAL */}
      {activeSubTab === 'banner' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-heading">
                    Banner Principal & Carrusel de Fotos
                  </h3>
                  <p className="text-xs text-slate-400">
                    Modifica las fotos de fondo rotativas, sus textos principales y la velocidad de transición.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleAddSlide}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-white border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Foto</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveBanner}
                  disabled={savingKey === 'banner_settings'}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingKey === 'banner_settings' ? 'Guardando...' : 'Guardar Banner'}</span>
                </button>
              </div>
            </div>

            {/* Transition Timing Settings */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Tiempo de Transición entre Fotos</span>
                </span>
                <p className="text-xs text-slate-400">
                  Define cada cuántos segundos cambiará automáticamente la foto y el texto en la página principal.
                </p>
              </div>

              <div className="flex items-center space-x-2 flex-wrap gap-2">
                {[3, 5, 7, 10].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setEditingInterval(sec)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      editingInterval === sec
                        ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/20'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {sec} Segundos
                  </button>
                ))}

                <div className="flex items-center space-x-1 pl-2">
                  <input
                    type="number"
                    min="2"
                    max="60"
                    value={editingInterval}
                    onChange={(e) => setEditingInterval(Math.max(2, parseInt(e.target.value) || 2))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-xs text-slate-400 font-medium">seg</span>
                </div>
              </div>
            </div>

            {/* Slides list */}
            <div className="space-y-5">
              {editingSlides.map((slide, idx) => {
                const imgSource = slide.image_url || slide.image || '';
                return (
                  <div 
                    key={slide.id || idx}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs font-bold font-mono">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Slide #{idx + 1}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveSlide(idx, -1)}
                          title="Subir posición"
                          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === editingSlides.length - 1}
                          onClick={() => handleMoveSlide(idx, 1)}
                          title="Bajar posición"
                          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={editingSlides.length <= 1}
                          onClick={() => handleDeleteSlide(idx)}
                          title="Eliminar este slide"
                          className="p-1.5 text-rose-400 hover:text-rose-300 disabled:opacity-30 disabled:hover:text-rose-400 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      {/* Left: Inputs */}
                      <div className="lg:col-span-8 space-y-3.5">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                            Título Principal
                          </label>
                          <input
                            type="text"
                            value={slide.title || ''}
                            onChange={(e) => handleSlideChange(idx, 'title', e.target.value)}
                            placeholder="Ej. El Arte del Corte Perfecto"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                            Subtítulo / Bajada Descriptiva
                          </label>
                          <textarea
                            rows={2}
                            value={slide.subtitle || ''}
                            onChange={(e) => handleSlideChange(idx, 'subtitle', e.target.value)}
                            placeholder="Ej. Peluquería Masculina de Lujo. Experimenta el cuidado con atención personalizada."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-500 resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                            URL de la Imagen o Subir desde tu Equipo
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={imgSource}
                              onChange={(e) => handleSlideChange(idx, 'image_url', e.target.value)}
                              placeholder="https://... o /uploads/banner/..."
                              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                            />

                            <label className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0">
                              <UploadCloud className="w-4 h-4" />
                              <span>{uploadingSlideIdx === idx ? 'Subiendo...' : 'Subir Foto'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingSlideIdx === idx}
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleUploadSlideImage(idx, e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Las imágenes subidas se convierten automáticamente a formato WebP optimizado y se guardan en <code className="text-amber-400">uploads/banner/</code>.
                          </p>
                        </div>
                      </div>

                      {/* Right: Preview Card */}
                      <div className="lg:col-span-4">
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Vista Previa Slide #{idx + 1}
                        </span>
                        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 aspect-video group">
                          {imgSource ? (
                            <img
                              src={imgSource}
                              alt={slide.title || 'Preview'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 space-y-1">
                              <ImageIcon className="w-8 h-8 opacity-40" />
                              <span className="text-[11px]">Sin imagen asignada</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-3 flex flex-col justify-end">
                            <span className="text-white text-xs font-bold line-clamp-1 drop-shadow">
                              {slide.title || 'Sin Título'}
                            </span>
                            <span className="text-slate-300 text-[10px] line-clamp-2 drop-shadow font-light">
                              {slide.subtitle || 'Sin Subtítulo'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleAddSlide}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Otra Foto al Banner</span>
              </button>

              <button
                type="button"
                onClick={handleSaveBanner}
                disabled={savingKey === 'banner_settings'}
                className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{savingKey === 'banner_settings' ? 'Guardando...' : 'Guardar Todo el Banner'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FIDELIZACIÓN Y PUNTOS */}
      {activeSubTab === 'loyalty' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Programa de Fidelización y Puntos
              </h3>
              <p className="text-xs text-slate-400">
                Configura cuántos puntos ganan los clientes por servicio y cuántos necesitan para un corte gratis.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  Puntos por cada Corte
                </span>
                <h4 className="text-sm font-bold text-white mb-2">
                  Acumulación automática por servicio
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cada vez que un barbero o admin registra un corte para un cliente identificado, se le sumará automáticamente esta cantidad fija de puntos.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    step="5"
                    value={settings.points_per_cut || '10'}
                    onChange={(e) => setSettings({ ...settings, points_per_cut: e.target.value })}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-center text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-xs text-slate-400 font-semibold">pts / corte</span>
                </div>

                <button
                  onClick={() => handleUpdate('points_per_cut', settings.points_per_cut)}
                  disabled={savingKey === 'points_per_cut'}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow-md active:scale-95 flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingKey === 'points_per_cut' ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-lg shadow-amber-500/5">
              <div>
                <div className="flex items-center space-x-1.5 text-amber-400 mb-1">
                  <Coins className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Beneficio de Corte 100% Gratis
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-2">
                  Meta para canjear un corte sin cargo
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Al alcanzar este puntaje acumulado, en la pantalla de Registrar Corte aparecerá automáticamente el botón para bonificar el servicio a $0 ARS.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={settings.points_for_free_cut || '50'}
                    onChange={(e) => setSettings({ ...settings, points_for_free_cut: e.target.value })}
                    className="w-24 bg-slate-900 border border-amber-500/40 rounded-xl p-2.5 text-center text-amber-400 font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-xs text-amber-300 font-semibold">pts necesarios</span>
                </div>

                <button
                  onClick={() => handleUpdate('points_for_free_cut', settings.points_for_free_cut)}
                  disabled={savingKey === 'points_for_free_cut'}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow-md active:scale-95 flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingKey === 'points_for_free_cut' ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COBROS Y POLÍTICAS FINANCIERAS */}
      {activeSubTab === 'payments' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Políticas de Cobro y Permisos de Barberos
              </h3>
              <p className="text-xs text-slate-400">
                Define quién está habilitado para recibir transferencias bancarias de los clientes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Cobro Directo por Transferencia al Barbero
                </span>
                <h4 className="text-sm font-bold text-white mb-2">
                  Permiso de cobro a cuentas bancarias personales
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Permite o bloquea que los barberos reciban transferencias a sus cuentas o billeteras virtuales personales (Mercado Pago, cuenta bancaria personal).
                </p>
              </div>

              <div className="pt-3 border-t border-slate-900 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Estado del permiso:</span>
                <button
                  onClick={() => handleUpdate('allow_barber_collection', !allowBarberColl)}
                  disabled={savingKey === 'allow_barber_collection'}
                  className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 shadow-md ${
                    allowBarberColl
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                  }`}
                >
                  {allowBarberColl ? '✓ HABILITADO' : '✗ DESHABILITADO'}
                </button>
              </div>

              <div className="pt-2 text-[11px] border-t border-slate-900">
                {allowBarberColl ? (
                  <span className="text-amber-400 font-semibold">
                    ⚠️ Los barberos pueden seleccionar "Transf. Barbero". El sistema liquidará automáticamente la comisión de la barbería en el cierre de caja.
                  </span>
                ) : (
                  <span className="text-emerald-400/90 font-medium">
                    🔒 Modo Recomendado: Todo el dinero ingresa a la cuenta oficial de la barbería o en efectivo físico en caja.
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  Control de Caja y Auditoría
                </span>
                <h4 className="text-sm font-bold text-white mb-2">
                  ¿Cómo funciona la liquidación automática?
                </h4>
                <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold">1.</span>
                    <span><strong>Efectivo en Local:</strong> El dinero físico entra a la caja y se concilia al final de la jornada.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-cyan-400 font-bold">2.</span>
                    <span><strong>Transferencias Oficiales:</strong> Van directo al alias de la casa y el sistema calcula la comisión a pagar a cada barbero.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-400 font-bold">3.</span>
                    <span><strong>Control de Caja:</strong> Un solo clic en "Control de Caja" liquida y resetea las cuentas dejando comprobantes para cada barbero.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-900 flex justify-end">
                <span className="text-[11px] text-slate-500">
                  Totalmente automatizado con esquema por comisión y alquiler fijo.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RESERVAS Y TURNOS ONLINE */}
      {activeSubTab === 'booking' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Módulo de Reservas Online y Política de Señas
              </h3>
              <p className="text-xs text-slate-400">
                Control de disponibilidad de la agenda pública y cobro anticipado de señas para evitar ausencias.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Disponibilidad de Reservas Web
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Al apagar este interruptor, el formulario web se pausará y redirigirá a los clientes directamente a tu WhatsApp.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-900 flex justify-end">
                <button
                  onClick={() => handleUpdate('online_booking_enabled', !onlineBookingEnabled)}
                  disabled={savingKey === 'online_booking_enabled'}
                  className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md ${
                    onlineBookingEnabled
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                  }`}
                >
                  {onlineBookingEnabled ? '✓ MÓDULO ACTIVO' : '✗ SISTEMA PAUSADO'}
                </button>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Exigir Seña Previa Obligatoria
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Muestra al cliente el alias para transferir la seña y registrar su comprobante antes de confirmar el turno.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-900 flex justify-end">
                <button
                  onClick={() => handleUpdate('booking_deposit_required', !bookingDepositRequired)}
                  disabled={savingKey === 'booking_deposit_required'}
                  className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md ${
                    bookingDepositRequired
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                  }`}
                >
                  {bookingDepositRequired ? '✓ SEÑA REQUERIDA' : '✗ SIN SEÑA'}
                </button>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 md:col-span-2 lg:col-span-1">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Monto Fijo de la Seña (ARS)
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Importe en pesos que debe transferir el cliente a la cuenta de la barbería para asegurar el turno.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-900 flex items-center space-x-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={settings.booking_deposit_amount || '2000'}
                    onChange={(e) => setSettings({ ...settings, booking_deposit_amount: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 p-2.5 text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  onClick={() => handleUpdate('booking_deposit_amount', settings.booking_deposit_amount)}
                  disabled={savingKey === 'booking_deposit_amount'}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow-md active:scale-95 flex items-center space-x-1 shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
