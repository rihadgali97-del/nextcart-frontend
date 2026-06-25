import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const API = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically add the token to every request if it exists
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  
  // Let axios handle FormData automatically
  // Don't set Content-Type if it's FormData - axios will set it to multipart/form-data
  if (req.data instanceof FormData) {
    delete req.headers['Content-Type'];
  }
  
  return req;
});

// --- AUTHENTICATION ---
export const loginUser = (formData) => API.post('/auth/login', formData);
export const registerUser = (formData) => API.post('/auth/register', formData);
export const googleAuth = (formData) => API.post('/auth/google-login', formData);
export const forgotPassword = (formData) => API.post('/auth/forgot-password', formData);
export const resetPassword = (token, formData) => API.patch(`/auth/reset-password/${token}`, formData);

// --- VENDOR INTELLIGENCE & REPUTATION ---
export const getVendorProfile = () => API.get('/vendors/profile'); 
// FIX: Set to target the exact backend reputation sub-route
export const getVendorReputation = () => API.get('/vendors/reputation'); 
export const getVendorStats = () => API.get('/vendors/stats');
export const getVendorAnalytics = () => API.get('/vendors/analytics');

// --- VENDOR OPERATIONS ---
export const getVendorOrders = () => API.get('/orders/vendor/all');
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

// --- REVIEWS ---
export const getAllReviews = (params = {}) => API.get('/reviews', { params });
export const getProductReviews = (productId) => API.get(`/reviews/product/${productId}`);
export const reportReview = (id, reason) => API.put(`/reviews/${id}/report`, { reason });
export const deleteReview = (id) => API.delete(`/reviews/${id}`);

// --- GEOSPATIAL TRUST SEARCH ---
export const executeTrustWeightedSearch = (params) => API.get('/search', { params });

// FIX: Added category parameter handling to enable clean dynamic item filtering on Home and Search views
export const searchProducts = ({ q, category, lat, lng, page = 1, limit = 12, sort } = {}) => API.get('/products/search', {
  params: { q, category, lat, lng, page, limit, sort }
});

export default API;