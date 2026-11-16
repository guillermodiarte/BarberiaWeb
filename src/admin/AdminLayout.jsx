import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { 
  Scissors, LayoutDashboard, Wallet, Calendar, Users, 
  Package, ShoppingBag, Receipt, Award, ExternalLink, LogOut, Menu, X, ShieldCheck, Settings,
  Image as ImageIcon
} from 'lucide-react';
import { CONFIG } from '../config';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { DashboardTab } from './tabs/DashboardTab';
import { CutsTab } from './tabs/CutsTab';
import { CashClosingTab } from './tabs/CashClosingTab';
import { ServicesTab } from './tabs/ServicesTab';
import { BarbersTab } from './tabs/BarbersTab';
import { InventoryTab } from './tabs/InventoryTab';
import { SalesTab } from './tabs/SalesTab';
import { ExpensesTab } from './tabs/ExpensesTab';
import { LoyaltyTab } from './tabs/LoyaltyTab';
import { BookingsTab } from './tabs/BookingsTab';
import { SettingsTab } from './tabs/SettingsTab';
import { GalleryTab } from './tabs/GalleryTab';

export const AdminLayout = () => {
  const { user, isAuthenticated, loading, logout, isAdmin, isSuperAdmin } = useAuth();
  const { barbershopName, logoUrl, currentTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mr-3" />
        <span>Cargando sesión persistente...</span>
      </div>
    );
  }

  const currentPath = window.location.pathname;
  const loginPath = currentPath.startsWith('/acceso-elite') ? '/acceso-elite/login' : '/gestion-elite/login';

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace />;
  }

  const handleLogout = () => {
    logout();
    navigate(loginPath);
  };

  const navItems = [
    { id: 'dashboard', label: 'Resumen General', icon: LayoutDashboard, adminOnly: false },
    { id: 'cortes', label: 'Registrar Cortes (CRM)', icon: Scissors, adminOnly: false },
    { id: 'caja', label: 'Caja & Arqueo', icon: Wallet, adminOnly: true },
    { id: 'servicios', label: 'Servicios & Combos', icon: Scissors, adminOnly: true },
    { id: 'barberos', label: 'Barberos & Esquemas', icon: Users, adminOnly: true },
    { id: 'inventario', label: 'Inventario & Stock', icon: Package, adminOnly: false },
    { id: 'ventas', label: 'Ventas de Productos', icon: ShoppingBag, adminOnly: false },
    { id: 'gastos', label: 'Gastos del Salón', icon: Receipt, adminOnly: true },
    { id: 'fidelizacion', label: 'Clientes', icon: Award, adminOnly: false },
    { id: 'turnos', label: 'Reservas & Turnos', icon: Calendar, adminOnly: false },
    { id: 'galeria', label: 'Galería & Medios', icon: ImageIcon, adminOnly: true },
    { id: 'configuracion', label: 'Configuración', icon: Settings, adminOnly: true },
  ];

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100 font-sans">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 h-screen w-72 bg-slate-900 border-r border-slate-800 flex flex-col z-50 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {currentTheme.id === 'barber_pole' && (
          <div className="h-1.5 w-full barber-pole-stripes flex-shrink-0" />
        )}
        {/* Brand header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            {logoUrl ? (
              <img src={logoUrl} alt={barbershopName} className="h-10 w-10 object-contain rounded-xl bg-slate-950 p-1 border border-slate-800" />
            ) : currentTheme.id === 'barber_pole' ? (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-white to-blue-600 flex items-center justify-center shadow-lg shadow-red-500/20 text-xl font-bold">
                💈
              </div>
            ) : (
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{ background: currentTheme.gradient }}
              >
                <Scissors className="w-5 h-5 text-slate-950" />
              </div>
            )}
            <div className="min-w-0">
              <span className="font-heading text-lg font-extrabold text-white tracking-tight block leading-tight truncate">
                {barbershopName}
              </span>
              <span className={`text-[10px] uppercase font-bold tracking-widest ${currentTheme.accentText || 'text-amber-400'}`}>
                {isSuperAdmin ? 'SUPERADMIN' : 'ADMIN PANEL'}
              </span>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 mx-4 mt-4 bg-slate-950/80 rounded-2xl border border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold font-heading text-sm"
              style={{ 
                background: isSuperAdmin ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)', 
                color: isSuperAdmin ? '#ef4444' : currentTheme.primary,
                border: `1px solid ${isSuperAdmin ? 'rgba(239, 68, 68, 0.4)' : currentTheme.border}`
              }}
            >
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <span className="font-bold text-white text-xs block truncate">
                {user?.full_name}
              </span>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                isSuperAdmin
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : isAdmin 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}>
                {isSuperAdmin ? '⚡ Super Administrador' : isAdmin ? 'Dueño / Administrador' : 'Barbero Asociado'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'sidebar-active-tab font-bold translate-x-1'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? '' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 font-medium transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>Ver Web Pública</span>
          </a>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-bold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 z-30 px-6 py-4 flex items-center justify-between relative">
          {currentTheme.id === 'barber_pole' && (
            <div className="absolute top-0 left-0 right-0 h-1 barber-pole-stripes" />
          )}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-slate-300 p-1 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg md:text-xl font-extrabold text-white capitalize font-heading">
              {filteredNavItems.find(i => i.id === activeTab)?.label || 'Panel de Control'}
            </h1>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <span className="hidden sm:inline-block text-slate-400">
              📅 {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <span className="text-amber-400 font-semibold font-mono">Moneda: ARS ($)</span>
          </div>
        </header>

        {/* Tab View Container */}
        <main className="flex-1 p-4 md:p-6 w-full min-w-0 overflow-x-hidden">
          {activeTab === 'dashboard' && <DashboardTab setActiveTab={setActiveTab} user={user} />}
          {activeTab === 'cortes' && <CutsTab user={user} />}
          {activeTab === 'caja' && isAdmin && <CashClosingTab user={user} />}
          {activeTab === 'servicios' && isAdmin && <ServicesTab />}
          {activeTab === 'barberos' && isAdmin && <BarbersTab />}
          {activeTab === 'inventario' && <InventoryTab user={user} />}
          {activeTab === 'ventas' && <SalesTab user={user} />}
          {activeTab === 'gastos' && isAdmin && <ExpensesTab />}
          {activeTab === 'fidelizacion' && <LoyaltyTab user={user} />}
          {activeTab === 'turnos' && <BookingsTab user={user} />}
          {activeTab === 'galeria' && isAdmin && <GalleryTab user={user} />}
          {activeTab === 'configuracion' && isAdmin && <SettingsTab />}
        </main>
      </div>
    </div>
  );
};

