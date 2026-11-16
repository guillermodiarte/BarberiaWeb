import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Global error boundary to catch JS crashes and show useful info instead of blank screen
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#020617', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'sans-serif' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#f59e0b' }}>Error en la aplicación</h1>
          <p style={{ color: '#94a3b8', maxWidth: '500px', textAlign: 'center', marginBottom: '1rem' }}>
            Ocurrió un error inesperado. Por favor recargá la página o limpiá el caché del navegador.
          </p>
          <pre style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#ef4444', maxWidth: '700px', overflow: 'auto' }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => { localStorage.clear(); window.location.href = '/gestion-elite/login'; }}
            style={{ marginTop: '1.5rem', padding: '0.75rem 2rem', background: '#f59e0b', color: '#020617', fontWeight: 'bold', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Limpiar sesión e ir al Login
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import { Helmet } from 'react-helmet';
import { CONFIG } from './config';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import { BookingSection } from '@/components/BookingSection';
import { LoyaltyCheckSection } from '@/components/LoyaltyCheckSection';
import About from '@/components/About';
import Gallery from '@/components/Gallery';
import Team from '@/components/Team';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import { AdminLayout } from './admin/AdminLayout';
import { AdminLogin } from './admin/AdminLogin';
import NotFound from '@/components/NotFound';

function PublicLanding() {
  const { barbershopName, tagline, currentTheme, sectionsVisibility = {} } = useTheme();

  return (
    <>
      <Helmet>
        <title>{barbershopName} - {tagline}</title>
        <meta 
          name="description" 
          content={`${barbershopName}: Cortes modernos, afeitado a navaja, sistema de reservas online y programa de puntos de fidelidad en ${CONFIG.currency}.`} 
        />
        <meta property="og:title" content={`${barbershopName} - ${tagline}`} />
        <meta property="og:description" content={`Reserva tu turno online en ${barbershopName} y acumula puntos con cada corte.`} />
      </Helmet>
      
      <div className={`min-h-screen text-white selection:bg-amber-500 selection:text-black transition-colors duration-500 ${
        currentTheme.id === 'barber_pole'
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-red-950/40'
          : currentTheme.id === 'emerald_vintage'
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40'
          : currentTheme.id === 'sapphire_tech'
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40'
          : currentTheme.id === 'ruby_burgundy'
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/40'
          : 'bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40'
      }`}>
        <Header />
        <Hero />
        {sectionsVisibility.services !== false && <Services />}
        {sectionsVisibility.booking !== false && <BookingSection />}
        {sectionsVisibility.loyalty !== false && <LoyaltyCheckSection />}
        {sectionsVisibility.about !== false && <About />}
        {sectionsVisibility.gallery !== false && <Gallery />}
        {sectionsVisibility.team !== false && <Team />}
        {sectionsVisibility.contact !== false && <Contact />}
        <Footer />
        <Toaster />
      </div>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<PublicLanding />} />

              {/* Ruta privada, segura y fácil de recordar para la administración del salón */}
              <Route path="/gestion-elite/login" element={<AdminLogin />} />
              <Route path="/gestion-elite/*" element={<AdminLayout />} />
              <Route path="/gestion-elite" element={<AdminLayout />} />

              {/* Alias seguro opcional */}
              <Route path="/acceso-elite/login" element={<AdminLogin />} />
              <Route path="/acceso-elite/*" element={<AdminLayout />} />
              <Route path="/acceso-elite" element={<AdminLayout />} />

              {/* Bloqueo estricto de rutas comunes: /admin, /gestion y /panel redirigen al inicio público */}
              <Route path="/admin/*" element={<Navigate to="/" replace />} />
              <Route path="/admin" element={<Navigate to="/" replace />} />
              <Route path="/gestion/*" element={<Navigate to="/" replace />} />
              <Route path="/gestion" element={<Navigate to="/" replace />} />
              <Route path="/panel/*" element={<Navigate to="/" replace />} />
              <Route path="/panel" element={<Navigate to="/" replace />} />

              {/* Catch-all: Página 404 para rutas desconocidas */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
