// Centralized frontend configuration from .env variables
export const CONFIG = {
  name: import.meta.env.VITE_BARBERSHOP_NAME || 'BarberShop Elite',
  tagline: import.meta.env.VITE_BARBERSHOP_TAGLINE || 'Peluquería Masculina de Lujo & Cuidado Personal',
  phone: import.meta.env.VITE_BARBERSHOP_PHONE || '+54 9 11 5555-1234',
  address: import.meta.env.VITE_BARBERSHOP_ADDRESS || 'Av. Santa Fe 2450, CABA, Argentina',
  email: import.meta.env.VITE_BARBERSHOP_EMAIL || 'contacto@barbershopelite.com',
  instagram: import.meta.env.VITE_BARBERSHOP_INSTAGRAM || 'barbershop.elite',
  alias: import.meta.env.VITE_BARBERSHOP_ALIAS || 'barbershop.elite.mp',
  currency: import.meta.env.VITE_CURRENCY || 'ARS',

  // Demo credentials for quick 1-click login
  adminEmail: import.meta.env.VITE_ADMIN_EMAIL || 'admin@barbershop.com',
  adminPassword: import.meta.env.VITE_ADMIN_PASSWORD || 'admin123',
  barber1Email: import.meta.env.VITE_BARBER1_EMAIL || 'marcos@barbershop.com',
  barber1Password: import.meta.env.VITE_BARBER1_PASSWORD || 'barbero123',
  barber3Email: import.meta.env.VITE_BARBER3_EMAIL || 'diego@barbershop.com',
  barber3Password: import.meta.env.VITE_BARBER3_PASSWORD || 'barbero123',
};

