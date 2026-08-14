const API_URL = import.meta.env.VITE_API_URL || 'https://creator-hub-lwls.onrender.com/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('ach_token');
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(body?.message || 'Request failed');
  return body;
}

export const authApi = {
  login: (input) => request('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  register: (input) => request('/auth/register', { method: 'POST', body: JSON.stringify(input) })
};
export const productApi = {
  list: () => request('/products'),
  create: (input) => request('/products', { method: 'POST', body: JSON.stringify(input) }),
  update: (id, input) => request(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  remove: (id) => request(`/products/${id}`, { method: 'DELETE' })
};
export const contactApi = {
  list: () => request('/contacts'),
  create: (input) => request('/contacts', { method: 'POST', body: JSON.stringify(input) }),
  update: (id, input) => request(`/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  remove: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),
  history: (id) => request(`/contacts/${id}/history`)
};
export const appointmentApi = {
  list: () => request('/appointments'),
  create: (input) => request('/appointments', { method: 'POST', body: JSON.stringify(input) }),
  update: (id, input) => request(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  confirm: (id, joinLink) => request(`/appointments/${id}/confirm`, { method: 'POST', body: JSON.stringify({ joinLink }) })
};
export const campaignApi = { list: () => request('/campaigns'), create: (input) => request('/campaigns', { method: 'POST', body: JSON.stringify(input) }), send: (id) => request(`/campaigns/${id}/send`, { method: 'POST' }) };
export const analyticsApi = { overview: () => request('/analytics/overview') };
export const learningApi = {
  courses: () => request('/learning/courses'),
  createCourse: (input) => request('/learning/courses', { method: 'POST', body: JSON.stringify(input) }),
  updateCourse: (id, input) => request(`/learning/courses/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteCourse: (id) => request(`/learning/courses/${id}`, { method: 'DELETE' }),
  memberships: () => request('/learning/memberships'),
  createMembership: (input) => request('/learning/memberships', { method: 'POST', body: JSON.stringify(input) }),
  updateMembership: (id, input) => request(`/learning/memberships/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteMembership: (id) => request(`/learning/memberships/${id}`, { method: 'DELETE' }),
  enrollments: () => request('/learning/enrollments'),
  updateProgress: (input) => request('/learning/progress', { method: 'POST', body: JSON.stringify(input) })
};
export const bundleApi = {
  list: () => request('/bundles'),
  create: (input) => request('/bundles', { method: 'POST', body: JSON.stringify(input) }),
  update: (id, input) => request(`/bundles/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  remove: (id) => request(`/bundles/${id}`, { method: 'DELETE' })
};
export const communityApi = {
  posts: () => request('/community/posts'),
  createPost: (input) => request('/community/posts', { method: 'POST', body: JSON.stringify(input) }),
  notifications: () => request('/community/notifications'),
  read: (id) => request(`/community/notifications/${id}/read`, { method: 'PATCH' })
};
export const knowledgeApi = {
  list: () => request('/knowledge'),
  create: (input) => request('/knowledge', { method: 'POST', body: JSON.stringify(input) }),
  createFromPdf: async (title, file) => {
    const token = localStorage.getItem('ach_token');
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);
    const response = await fetch(`${API_URL}/knowledge/from-pdf`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body?.message || 'Upload failed');
    return body;
  },
  remove: (id) => request(`/knowledge/${id}`, { method: 'DELETE' })
};
export const aiStudioApi = { chat: (input) => request('/ai-studio/chat', { method: 'POST', body: JSON.stringify(input) }), support: (input) => request('/ai-studio/support', { method: 'POST', body: JSON.stringify(input) }), agent: (input) => request('/ai-studio/agents/run', { method: 'POST', body: JSON.stringify(input) }) };
export const aiApi = { generate: (input) => request('/ai/generate', { method: 'POST', body: JSON.stringify(input) }) };
export const aiGeneratorApi = {
  product: (input) => request('/ai-generators/product', { method: 'POST', body: JSON.stringify(input) }),
  website: (input) => request('/ai-generators/website', { method: 'POST', body: JSON.stringify(input) }),
  branding: (input) => request('/ai-generators/branding', { method: 'POST', body: JSON.stringify(input) }),
  content: (input) => request('/ai-generators/content', { method: 'POST', body: JSON.stringify(input) })
};
export const commerceApi = {
  orders: () => request('/commerce/orders'),
  paymentMode: () => request('/commerce/payment-mode'),
  purchases: (email) => request('/commerce/purchases', { method: 'POST', body: JSON.stringify({ email }) }),
  checkout: (input) => request('/commerce/checkout', { method: 'POST', body: JSON.stringify(input) }),
  cartCheckout: (input) => request('/commerce/cart-checkout', { method: 'POST', body: JSON.stringify(input) }),
  download: (orderId, token) => request(`/commerce/download/${orderId}/${token}`)
};
export const couponApi = {
  list: () => request('/coupons'),
  create: (input) => request('/coupons', { method: 'POST', body: JSON.stringify(input) }),
  update: (id, input) => request(`/coupons/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  remove: (id) => request(`/coupons/${id}`, { method: 'DELETE' })
};
export const affiliateApi = {
  list: () => request('/affiliates'),
  create: (input) => request('/affiliates', { method: 'POST', body: JSON.stringify(input) }),
  update: (id, input) => request(`/affiliates/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  remove: (id) => request(`/affiliates/${id}`, { method: 'DELETE' })
};
export const funnelApi = {
  list: () => request('/funnels'),
  create: (input) => request('/funnels', { method: 'POST', body: JSON.stringify(input) }),
  update: (id, input) => request(`/funnels/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  remove: (id) => request(`/funnels/${id}`, { method: 'DELETE' })
};
export const automationApi = {
  list: () => request('/automations'),
  create: (input) => request('/automations', { method: 'POST', body: JSON.stringify(input) }),
  update: (id, input) => request(`/automations/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  remove: (id) => request(`/automations/${id}`, { method: 'DELETE' })
};
export const settingsApi = {
  profile: () => request('/settings/profile'),
  update: (input) => request('/settings/profile', { method: 'PATCH', body: JSON.stringify(input) }),
  applyBranding: (input) => request('/settings/apply-branding', { method: 'POST', body: JSON.stringify(input) })
};
export const adminApi = {
  overview: () => request('/admin/overview'),
  users: () => request('/admin/users'),
  updateUser: (id, input) => request(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  products: () => request('/admin/products'),
  updateProduct: (id, input) => request(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
  orders: () => request('/admin/orders'),
  campaigns: () => request('/admin/campaigns'),
  deleteCampaign: (id) => request(`/admin/campaigns/${id}`, { method: 'DELETE' }),
  courses: () => request('/admin/courses'),
  updateCourse: (id, input) => request(`/admin/courses/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteCourse: (id) => request(`/admin/courses/${id}`, { method: 'DELETE' }),
  posts: () => request('/admin/posts'),
  deletePost: (id) => request(`/admin/posts/${id}`, { method: 'DELETE' })
};
export const storefrontApi = {
  get: (slug) => request(`/storefront/${slug}`),
  support: (input) => request('/storefront/support', { method: 'POST', body: JSON.stringify(input) }),
  validateCoupon: (input) => request('/storefront/validate-coupon', { method: 'POST', body: JSON.stringify(input) }),
  bookSession: (input) => request('/storefront/book-session', { method: 'POST', body: JSON.stringify(input) }),
  pageView: (input) => request('/storefront/page-view', { method: 'POST', body: JSON.stringify(input) }),
  getFunnel: (slug) => request(`/storefront/funnel/${slug}`),
  funnelLead: (slug, input) => request(`/storefront/funnel/${slug}/lead`, { method: 'POST', body: JSON.stringify(input) }),
  funnelConvert: (slug) => request(`/storefront/funnel/${slug}/convert`, { method: 'POST', body: JSON.stringify({}) })
};

export const uploadApi = {
  lessonPdf: async (file) => {
    const token = localStorage.getItem('ach_token');
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_URL}/uploads/lesson-pdf`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body?.message || 'Upload failed');
    return body;
  },
  productFile: async (file) => {
    const token = localStorage.getItem('ach_token');
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_URL}/uploads/product-file`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body?.message || 'Upload failed');
    return body;
  }
};

async function customerRequest(path, options = {}) {
  const token = localStorage.getItem('ach_customer_token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(body?.message || 'Request failed');
  return body;
}

export const customerApi = {
  requestLogin: (email) => request('/customer/request-login', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyLogin: (email, code) => request('/customer/verify-login', { method: 'POST', body: JSON.stringify({ email, code }) }),
  library: () => customerRequest('/customer/library'),
  me: () => customerRequest('/customer/me'),
  notifications: () => customerRequest('/customer/notifications'),
  readNotification: (id) => customerRequest(`/customer/notifications/${id}/read`, { method: 'PATCH' }),
  updateProgress: (input) => customerRequest('/customer/progress', { method: 'POST', body: JSON.stringify(input) }),
  logout: () => {
    localStorage.removeItem('ach_customer_token');
    localStorage.removeItem('ach_customer_email');
  },
  saveSession: (token, email) => {
    localStorage.setItem('ach_customer_token', token);
    localStorage.setItem('ach_customer_email', email.toLowerCase());
  },
  isLoggedIn: () => Boolean(localStorage.getItem('ach_customer_token'))
};
