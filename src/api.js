// API client for BarberShop Elite

const API_BASE = '/api';

export function getStoredToken() {
  return localStorage.getItem('barbershop_token');
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem('barbershop_token', token);
  } else {
    localStorage.removeItem('barbershop_token');
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('barbershop_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('barbershop_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('barbershop_user');
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // If unauthorized, clear session
    setStoredToken(null);
    setStoredUser(null);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.detail || data?.message || `Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setStoredToken(data.access_token);
    setStoredUser(data.user);
    return data;
  },
  getMe: () => apiRequest('/auth/me'),
  logout: () => {
    setStoredToken(null);
    setStoredUser(null);
  },

  // Services
  getServices: (includeInactive = false) => apiRequest(`/services?include_inactive=${includeInactive}`),
  createService: (data) => apiRequest('/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id, data) => apiRequest(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteService: (id) => apiRequest(`/services/${id}`, { method: 'DELETE' }),
  massUpdatePrices: (percentage, roundTo = 100, serviceIds = null) =>
    apiRequest('/services/mass-update-price', {
      method: 'POST',
      body: JSON.stringify({ percentage, round_to: roundTo, service_ids: serviceIds })
    }),

  // Barbers
  getBarbers: (includeInactive = false) => apiRequest(`/barbers?include_inactive=${includeInactive}`),
  getPublicBarbers: () => apiRequest('/barbers/public'),
  createBarber: (data) => apiRequest('/barbers', { method: 'POST', body: JSON.stringify(data) }),
  updateBarber: (id, data) => apiRequest(`/barbers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleBarber: (id) => apiRequest(`/barbers/${id}`, { method: 'DELETE' }),

  // Service Records (Cortes - CRM)
  getServiceRecords: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/service-records?${query}`);
  },
  createServiceRecord: (data) => apiRequest('/service-records', { method: 'POST', body: JSON.stringify(data) }),
  deleteServiceRecord: (id) => apiRequest(`/service-records/${id}`, { method: 'DELETE' }),

  // Inventory & Stock
  getInventory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/inventory?${query}`);
  },
  createProduct: (data) => apiRequest('/inventory', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => apiRequest(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adjustStock: (id, quantityChange, reason = 'Ajuste manual') =>
    apiRequest(`/inventory/${id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({ quantity_change: quantityChange, reason })
    }),
  deleteProduct: (id) => apiRequest(`/inventory/${id}`, { method: 'DELETE' }),

  // Product Sales
  getProductSales: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/product-sales?${query}`);
  },
  createProductSale: (data) => apiRequest('/product-sales', { method: 'POST', body: JSON.stringify(data) }),
  deleteProductSale: (id) => apiRequest(`/product-sales/${id}`, { method: 'DELETE' }),

  // Expenses
  getExpenses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/expenses?${query}`);
  },
  createExpense: (data) => apiRequest('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  deleteExpense: (id) => apiRequest(`/expenses/${id}`, { method: 'DELETE' }),

  // Cash Closing & Settlements (Arqueo)
  getCashClosingPreview: (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return apiRequest(`/cash-closing/preview?${params.toString()}`);
  },
  closeCashRegister: (data) => apiRequest('/cash-closing/close', { method: 'POST', body: JSON.stringify(data) }),
  getCashClosingHistory: () => apiRequest('/cash-closing/history'),
  getCashClosingDetail: (id) => apiRequest(`/cash-closing/${id}`),

  // Customers & Loyalty
  getCustomers: (search = '') => apiRequest(`/customers?search=${encodeURIComponent(search)}`),
  getCustomerLookup: (query) => apiRequest(`/customers/lookup?query=${encodeURIComponent(query)}`),
  getCustomerHistory: (id) => apiRequest(`/customers/${id}/history`),
  createCustomer: (data) => apiRequest('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => apiRequest(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id) => apiRequest(`/customers/${id}`, { method: 'DELETE' }),

  // Rewards
  getRewards: () => apiRequest('/rewards'),
  createReward: (data) => apiRequest('/rewards', { method: 'POST', body: JSON.stringify(data) }),
  deleteReward: (id) => apiRequest(`/rewards/${id}`, { method: 'DELETE' }),
  redeemReward: (customerId, rewardId) =>
    apiRequest('/rewards/redeem', {
      method: 'POST',
      body: JSON.stringify({ customer_id: customerId, reward_id: rewardId })
    }),

  // Bookings
  getPublicSettings: () => apiRequest('/settings/public'),
  createPublicBooking: (data) => apiRequest('/bookings/public', { method: 'POST', body: JSON.stringify(data) }),
  getBookings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/bookings?${query}`);
  },
  updateBookingStatus: (id, data) => apiRequest(`/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBooking: (id) => apiRequest(`/bookings/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => apiRequest('/settings'),
  updateSetting: (key, value) => apiRequest(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),

  // Media & Uploads
  uploadMedia: (formData) => apiRequest('/media/upload', {
    method: 'POST',
    body: formData
  }),
  getMedia: (folder = '') => apiRequest(`/media${folder ? `?folder=${encodeURIComponent(folder)}` : ''}`),
  deleteMedia: (folder, filename) => apiRequest(`/media/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`, {
    method: 'DELETE'
  }),

  // Stats
  getDashboardStats: () => apiRequest('/stats/dashboard'),
};

