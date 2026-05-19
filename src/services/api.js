import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api', 
});

// Automatically add the token to every request if it exists
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// --- AUTHENTICATION ---
export const loginUser = (formData) => API.post('/auth/login', formData);
export const registerUser = (formData) => API.post('/auth/register', formData);

// --- VENDOR INTELLIGENCE & REPUTATION ---
export const getVendorProfile = () => API.get('/vendors/profile'); 
export const getVendorReputation = () => API.get('/vendors/profile'); 
export const getVendorStats = () => API.get('/vendors/stats');
export const getVendorAnalytics = () => API.get('/vendors/analytics');

// --- VENDOR OPERATIONS (MATCHED TO YOUR BACKEND) ---

// Fixed to match: router.get("/vendor/all", ...)
export const getVendorOrders = () => API.get('/orders/vendor/all');

// Fixed to match: router.put("/:id/status", ...)
export const updateOrderStatus = (id, status) => API.put(`/orders/${id}/status`, { status });

export const getVendorInventory = (page = 1) => API.get(`/vendors/products?page=${page}`);
export const getVendorWallet = () => API.get('/vendors/wallet');
export const addProduct = (productData) => API.post('/vendors/products', productData);

// --- ADMIN MODULE ---
export const getAdminStats = () => API.get('/admin/dashboard');
export const getAdminUsers = (page = 1) => API.get(`/admin/users?page=${page}`);
export const getAdminOrders = (page = 1) => API.get(`/admin/orders?page=${page}`);
export const getAdminProducts = () => API.get('/products?all=true');
export const getVendors = () => API.get('/admin/vendors');
export const updateVendorStatus = (id, status) => API.put(`/admin/vendors/${id}/status`, { status });
export const deleteVendor = (id) => API.delete(`/admin/vendors/${id}`);
export const getAuditLogs = () => API.get('/admin/audit-logs');
export const getAdminSettings = () => API.get('/settings/admin');
export const updateAdminSettings = (data) => API.put('/settings/admin', data);

// --- SHARED PROFILE & PERSONAL SETTINGS ---
export const getUserProfile = () => API.get('/profile'); 
export const updateProfile = (data) => API.put('/profile/update', data);
export const changePassword = (data) => API.put('/profile/change-password', data);
export const updateNotifications = (data) => API.put('/profile/notifications', data);

// --- SHARED RESOURCES ---
export const getUsers = () => API.get('/users'); 
export const deleteUser = (id) => API.delete(`/users/${id}`);
export const updateUser = (id, data) => API.put(`/users/${id}`, data);
export const deleteProduct = (id) => API.delete(`/products/${id}`);
export const updateProduct = (id, data) => API.put(`/products/${id}`, data);
export const getCategories = () => API.get('/categories');

// --- MESSAGING ---
export const getConversations = () => API.get('/messages/conversations');
export const getChatHistory = (userId) => API.get(`/messages/history/${userId}`);
export const markAsRead = (messageId) => API.put(`/messages/${messageId}/read`);

// --- REVIEWS (MATCHED TO BACKEND) ---

// Hits router.get('/', getReviews) - fetches all reviews
export const getAllReviews = (params = {}) => API.get('/reviews', { params });

// Hits router.get('/product/:productId', getReviews)
export const getProductReviews = (productId) => API.get(`/reviews/product/${productId}`);

// Hits router.put('/:id/report', reportReview)
export const reportReview = (id, reason) => API.put(`/reviews/${id}/report`, { reason });

// Hits router.delete('/:id', deleteReview)
export const deleteReview = (id) => API.delete(`/reviews/${id}`);
export default API;