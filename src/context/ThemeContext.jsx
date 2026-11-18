import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';
import { CONFIG } from '../config';

export const THEMES = [
  {
    id: 'barber_pole',
    name: 'Poste de Barbero Tradicional',
    tag: 'Clásico Vintage',
    icon: '💈',
    description: 'El icónico estilo tricolor de las barberías históricas: Rojo Carmesí, Azul Cobalto y Blanco Puro.',
    previewColors: ['#dc2626', '#ffffff', '#2563eb'],
    primary: '#dc2626',
    primaryHover: '#b91c1c',
    secondary: '#2563eb',
    accent: '#ffffff',
    bg: '#080c18',
    cardBg: '#0e1628',
    border: 'rgba(220, 38, 38, 0.4)',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #ffffff 50%, #2563eb 100%)',
    badgeClass: 'bg-red-600/20 text-red-300 border-red-500/40',
    buttonClass: 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30',
    accentText: 'text-red-400',
    btnText: '#ffffff',
    glow: 'rgba(220, 38, 38, 0.3)',
    rgb: {
      50: '255 255 255',
      100: '254 226 226',
      200: '254 202 202',
      300: '252 165 165',
      400: '248 113 113', // rojo brillante para texto
      500: '220 38 38',   // rojo carmesí barbero #dc2626
      600: '185 28 28',   // rojo oscuro hover #b91c1c
      700: '153 27 27',
      800: '30 58 138',   // azul cobalto
      900: '15 23 42',
      950: '69 10 10',    // #450a0a
    },
    pageBgClass: 'from-slate-950 via-[#0a0f1d] to-[#1f0a0e]',
    isBarberPole: true
  },
  {
    id: 'gold_elite',
    name: 'Gold & Black Elite',
    tag: 'Lujo & Distinción',
    icon: '👑',
    description: 'Elegancia moderna con tonos dorados ámbar sobre negros profundos y grafito de alta gama.',
    previewColors: ['#f59e0b', '#d97706', '#0f172a'],
    primary: '#f59e0b',
    primaryHover: '#d97706',
    secondary: '#b45309',
    accent: '#fef3c7',
    bg: '#020617',
    cardBg: '#0f172a',
    border: 'rgba(245, 158, 11, 0.35)',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #92400e 100%)',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    buttonClass: 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/30',
    accentText: 'text-amber-400',
    btnText: '#020617',
    glow: 'rgba(245, 158, 11, 0.25)',
    rgb: {
      50: '255 251 235',
      100: '254 243 199',
      200: '253 230 138',
      300: '252 211 77',
      400: '251 191 36', // #fbbf24
      500: '245 158 11', // #f59e0b
      600: '217 119 6',  // #d97706
      700: '180 83 9',   // #b45309
      800: '146 64 14',  // #92400e
      900: '120 53 15',  // #78350f
      950: '69 26 3',    // #451a03
    },
    pageBgClass: 'from-slate-950 via-slate-900 to-amber-950/40'
  },
  {
    id: 'emerald_vintage',
    name: 'Emerald & British Leather',
    tag: 'Gentleman Club',
    icon: '🌿',
    description: 'Inspirado en los clubes tradicionales británicos: verde esmeralda, maderas nobles y cuero vintage.',
    previewColors: ['#10b981', '#059669', '#061a14'],
    primary: '#10b981',
    primaryHover: '#059669',
    secondary: '#047857',
    accent: '#d1fae5',
    bg: '#02140f',
    cardBg: '#05241b',
    border: 'rgba(16, 185, 129, 0.35)',
    gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #047857 100%)',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    buttonClass: 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/30',
    accentText: 'text-emerald-400',
    btnText: '#020617',
    glow: 'rgba(16, 185, 129, 0.25)',
    rgb: {
      50: '236 253 245',
      100: '209 250 229',
      200: '167 243 208',
      300: '110 231 183',
      400: '52 211 153', // #34d399
      500: '16 185 129', // #10b981
      600: '5 150 105',  // #059669
      700: '4 120 87',   // #047857
      800: '6 95 70',    // #065f46
      900: '6 78 59',    // #064e3b
      950: '2 44 34',    // #022c22
    },
    pageBgClass: 'from-slate-950 via-[#021c15] to-[#04281f]'
  },
  {
    id: 'sapphire_tech',
    name: 'Sapphire & Cyber Steel',
    tag: 'Urbano Futurista',
    icon: '⚡',
    description: 'Estética moderna, tecnológica y limpia con azul zafiro eléctrico y acentos de titanio frío.',
    previewColors: ['#3b82f6', '#0ea5e9', '#0a0f1d'],
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    secondary: '#0ea5e9',
    accent: '#e0f2fe',
    bg: '#040d1f',
    cardBg: '#09162e',
    border: 'rgba(59, 130, 246, 0.35)',
    gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #0284c7 100%)',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    buttonClass: 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/30',
    accentText: 'text-blue-400',
    btnText: '#ffffff',
    glow: 'rgba(59, 130, 246, 0.25)',
    rgb: {
      50: '239 246 255',
      100: '219 234 254',
      200: '191 219 254',
      300: '147 197 253',
      400: '96 165 250', // #60a5fa
      500: '59 130 246', // #3b82f6
      600: '37 99 235',  // #2563eb
      700: '29 78 216',  // #1d4ed8
      800: '30 64 175',  // #1e40af
      900: '30 58 138',  // #1e3a8a
      950: '8 28 66',    // #081c42
    },
    pageBgClass: 'from-slate-950 via-[#061329] to-[#031b3b]'
  },
  {
    id: 'ruby_burgundy',
    name: 'Ruby Burgundy & Rose Gold',
    tag: 'Boutique & Aristócrata',
    icon: '🍷',
    description: 'Profundo tono borgoña rubí con destellos oro rosa para salones exclusivos y estilizados.',
    previewColors: ['#e11d48', '#fda4af', '#18080e'],
    primary: '#e11d48',
    primaryHover: '#be123c',
    secondary: '#fb7185',
    accent: '#ffe4e6',
    bg: '#140309',
    cardBg: '#240711',
    border: 'rgba(225, 29, 72, 0.35)',
    gradient: 'linear-gradient(135deg, #fb7185 0%, #e11d48 50%, #9f1239 100%)',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    buttonClass: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30',
    accentText: 'text-rose-400',
    btnText: '#ffffff',
    glow: 'rgba(225, 29, 72, 0.25)',
    rgb: {
      50: '255 241 242',
      100: '255 228 230',
      200: '254 205 211',
      300: '253 164 175',
      400: '251 113 133', // #fb7185
      500: '225 29 72',   // #e11d48
      600: '190 18 60',   // #be123c
      700: '159 18 57',   // #9f1239
      800: '136 19 55',   // #881337
      900: '76 5 25',     // #4c0519
      950: '40 2 12',     // #28020c
    },
    pageBgClass: 'from-slate-950 via-[#1c040d] to-[#280512]'
  }
];

function hexToRgb(hex) {
  if (!hex) return null;
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `${r} ${g} ${b}`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `${r} ${g} ${b}`;
  }
  return null;
}

export const DEFAULT_BANNER_SLIDES = [
  {
    id: "1",
    image_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1920&q=80",
    title: "El Arte del Corte Perfecto",
    subtitle: "Tradición, estilo y precisión en cada detalle para el hombre actual."
  },
  {
    id: "2",
    image_url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1920&q=80",
    title: "Afeitado Clásico & Toallas Calientes",
    subtitle: "Navaja libre, espuma tibia artesanal y cuidado facial premium."
  },
  {
    id: "3",
    image_url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1920&q=80",
    title: "Experiencia BarberShop Elite",
    subtitle: "Profesionales dedicados a realzar tu personalidad e imagen."
  }
];

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [activeThemeId, setActiveThemeId] = useState('gold_elite');
  const [logoUrl, setLogoUrl] = useState('');
  const [tagline, setTagline] = useState(CONFIG.tagline);
  const [barbershopName, setBarbershopName] = useState(CONFIG.name);
  const [barbershopAddress, setBarbershopAddress] = useState(CONFIG.address);
  const [barbershopPhone, setBarbershopPhone] = useState(CONFIG.phone);
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [googleMapsEmbedUrl, setGoogleMapsEmbedUrl] = useState('');
  const [onlineBookingEnabled, setOnlineBookingEnabled] = useState(true);
  const [bannerSlides, setBannerSlides] = useState(DEFAULT_BANNER_SLIDES);
  const [bannerInterval, setBannerInterval] = useState(5);
  const [customPrimaryColor, setCustomPrimaryColor] = useState('');
  const [pageTabTitle, setPageTabTitle] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [loadingTheme, setLoadingTheme] = useState(true);
  const [sectionsVisibility, setSectionsVisibility] = useState({
    services: true,
    booking: true,
    loyalty: true,
    about: true,
    gallery: true,
    team: true,
    contact: true
  });

  // Load public settings to apply theme immediately
  const refreshThemeSettings = async () => {
    try {
      const publicSettings = await api.getPublicSettings();
      if (publicSettings) {
        if (publicSettings.active_theme) {
          setActiveThemeId(publicSettings.active_theme);
        }
        if (publicSettings.barbershop_logo_url !== undefined) {
          setLogoUrl(publicSettings.barbershop_logo_url);
        }
        if (publicSettings.barbershop_tagline) {
          setTagline(publicSettings.barbershop_tagline);
        }
        if (publicSettings.barbershop_name) {
          setBarbershopName(publicSettings.barbershop_name);
        }
        if (publicSettings.barbershop_address) {
          setBarbershopAddress(publicSettings.barbershop_address);
        }
        if (publicSettings.barbershop_phone) {
          setBarbershopPhone(publicSettings.barbershop_phone);
        }
        if (publicSettings.barbershop_google_maps_url) {
          setGoogleMapsUrl(publicSettings.barbershop_google_maps_url);
        }
        if (publicSettings.barbershop_google_maps_embed_url) {
          setGoogleMapsEmbedUrl(publicSettings.barbershop_google_maps_embed_url);
        }
        if (publicSettings.online_booking_enabled !== undefined) {
          setOnlineBookingEnabled(publicSettings.online_booking_enabled !== 'false' && publicSettings.online_booking_enabled !== false);
        }
        // Sync full sections visibility
        setSectionsVisibility({
          services: publicSettings.section_services_enabled !== 'false' && publicSettings.section_services_enabled !== false,
          booking: publicSettings.online_booking_enabled !== 'false' && publicSettings.online_booking_enabled !== false,
          loyalty: publicSettings.section_loyalty_enabled !== 'false' && publicSettings.section_loyalty_enabled !== false,
          about: publicSettings.section_about_enabled !== 'false' && publicSettings.section_about_enabled !== false,
          gallery: publicSettings.section_gallery_enabled !== 'false' && publicSettings.section_gallery_enabled !== false,
          team: publicSettings.section_team_enabled !== 'false' && publicSettings.section_team_enabled !== false,
          contact: publicSettings.section_contact_enabled !== 'false' && publicSettings.section_contact_enabled !== false,
        });
        if (publicSettings.hero_banner_slides) {
          try {
            const parsed = JSON.parse(publicSettings.hero_banner_slides);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setBannerSlides(parsed);
            }
          } catch (e) {
            console.warn('Error parsing banner slides JSON:', e);
          }
        }
        if (publicSettings.hero_banner_interval) {
          const sec = parseInt(publicSettings.hero_banner_interval, 10);
          if (sec && sec > 0) setBannerInterval(sec);
        }
        if (publicSettings.custom_primary_color !== undefined) {
          setCustomPrimaryColor(publicSettings.custom_primary_color);
        }
        if (publicSettings.page_tab_title !== undefined) {
          setPageTabTitle(publicSettings.page_tab_title);
        }
        if (publicSettings.barbershop_favicon_url !== undefined) {
          setFaviconUrl(publicSettings.barbershop_favicon_url);
        }
      }
    } catch (err) {
      console.warn('Usando configuración por defecto:', err.message);
    } finally {
      setLoadingTheme(false);
    }
  };

  useEffect(() => {
    refreshThemeSettings();
  }, []);

  const currentTheme = THEMES.find(t => t.id === activeThemeId) || THEMES[1];

  // Inject CSS variables to documentElement
  useEffect(() => {
    const root = document.documentElement;
    const themeRgb = currentTheme.rgb;
    
    // Set RGB values for Tailwind amber-* dynamic mapping
    if (themeRgb) {
      Object.entries(themeRgb).forEach(([shade, rgbVal]) => {
        root.style.setProperty(`--theme-${shade}-rgb`, rgbVal);
      });
    }

    const primary = customPrimaryColor || currentTheme.primary;
    if (customPrimaryColor) {
      const rgb = hexToRgb(customPrimaryColor);
      if (rgb) {
        root.style.setProperty('--theme-500-rgb', rgb);
        root.style.setProperty('--theme-600-rgb', rgb);
      }
    }

    root.style.setProperty('--theme-primary', primary);
    root.style.setProperty('--theme-primary-hover', currentTheme.primaryHover);
    root.style.setProperty('--theme-secondary', currentTheme.secondary);
    root.style.setProperty('--theme-accent', currentTheme.accent);
    root.style.setProperty('--theme-gradient', currentTheme.gradient);
    root.style.setProperty('--theme-border', currentTheme.border);
    root.style.setProperty('--theme-btn-text', currentTheme.btnText || '#020617');
    root.style.setProperty('--theme-glow', currentTheme.glow || 'rgba(245, 158, 11, 0.25)');
    root.style.setProperty('--theme-bg', currentTheme.bg);
    root.style.setProperty('--theme-card-bg', currentTheme.cardBg);

    root.setAttribute('data-theme', currentTheme.id);
  }, [currentTheme, customPrimaryColor]);

  // Update browser tab title and favicon dynamically
  useEffect(() => {
    const finalTitle = pageTabTitle || (barbershopName ? `${barbershopName} - ${tagline}` : 'BarberShop Elite');
    document.title = finalTitle;

    if (faviconUrl) {
      let link = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        document.head.appendChild(link);
      }
      link.rel = 'icon';
      if (faviconUrl.endsWith('.ico')) {
        link.type = 'image/x-icon';
      } else if (faviconUrl.endsWith('.svg')) {
        link.type = 'image/svg+xml';
      } else if (faviconUrl.endsWith('.png')) {
        link.type = 'image/png';
      } else {
        link.type = 'image/webp';
      }
      link.href = faviconUrl;
    }
  }, [pageTabTitle, barbershopName, tagline, faviconUrl]);

  const changeTheme = async (themeId) => {
    setActiveThemeId(themeId);
    try {
      await api.updateSetting('active_theme', themeId);
    } catch (err) {
      console.error('Error persistiendo tema:', err);
    }
  };

  const updateBranding = async ({ newLogoUrl, newTagline, newCustomColor, newName, newPageTabTitle, newFaviconUrl }) => {
    if (newLogoUrl !== undefined) setLogoUrl(newLogoUrl);
    if (newTagline !== undefined) setTagline(newTagline);
    if (newCustomColor !== undefined) setCustomPrimaryColor(newCustomColor);
    if (newName !== undefined) setBarbershopName(newName);
    if (newPageTabTitle !== undefined) setPageTabTitle(newPageTabTitle);
    if (newFaviconUrl !== undefined) setFaviconUrl(newFaviconUrl);

    const promises = [];
    if (newLogoUrl !== undefined) promises.push(api.updateSetting('barbershop_logo_url', newLogoUrl));
    if (newTagline !== undefined) promises.push(api.updateSetting('barbershop_tagline', newTagline));
    if (newCustomColor !== undefined) promises.push(api.updateSetting('custom_primary_color', newCustomColor));
    if (newName !== undefined) promises.push(api.updateSetting('barbershop_name', newName));
    if (newPageTabTitle !== undefined) promises.push(api.updateSetting('page_tab_title', newPageTabTitle));
    if (newFaviconUrl !== undefined) promises.push(api.updateSetting('barbershop_favicon_url', newFaviconUrl));

    await Promise.all(promises);
  };

  const updateBannerSettings = async ({ newSlides, newInterval }) => {
    const promises = [];
    if (newSlides !== undefined) {
      setBannerSlides(newSlides);
      promises.push(api.updateSetting('hero_banner_slides', JSON.stringify(newSlides)));
    }
    if (newInterval !== undefined) {
      setBannerInterval(Number(newInterval));
      promises.push(api.updateSetting('hero_banner_interval', String(newInterval)));
    }
    await Promise.all(promises);
  };

  const updateSectionVisibility = async (sectionKey, isEnabled) => {
    setSectionsVisibility(prev => ({ ...prev, [sectionKey]: isEnabled }));
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
    if (dbKey) {
      await api.updateSetting(dbKey, String(isEnabled));
      if (sectionKey === 'booking') {
        setOnlineBookingEnabled(isEnabled);
      }
    }
  };

  const value = {
    themes: THEMES,
    currentTheme,
    activeThemeId,
    logoUrl,
    tagline,
    barbershopName,
    barbershopAddress,
    barbershopPhone,
    googleMapsUrl,
    googleMapsEmbedUrl,
    onlineBookingEnabled,
    sectionsVisibility,
    updateSectionVisibility,
    bannerSlides,
    bannerInterval,
    customPrimaryColor,
    pageTabTitle,
    faviconUrl,
    loadingTheme,
    changeTheme,
    updateBranding,
    updateBannerSettings,
    refreshThemeSettings
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme debe ser utilizado dentro de un ThemeProvider');
  }
  return ctx;
};
