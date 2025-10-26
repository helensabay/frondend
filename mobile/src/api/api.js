// api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, BASE_URL } from './config';

export const ACCESS_TOKEN_KEY = '@sanaol/auth/accessToken';
export const REFRESH_TOKEN_KEY = '@sanaol/auth/refreshToken';
export const USER_CACHE_KEY = '@sanaol/auth/user';

// Axios instances
const api = axios.create({
  baseURL: BASE_URL,
  timeout: API_CONFIG.timeout,
  headers: { 'Content-Type': 'application/json' },
});

const authlessApi = axios.create({
  baseURL: BASE_URL,
  timeout: API_CONFIG.timeout,
  headers: { 'Content-Type': 'application/json' },
});

// --------------------
// Tokens
// --------------------
export async function storeTokens({ accessToken, refreshToken }) {
  const entries = [];
  if (accessToken) entries.push([ACCESS_TOKEN_KEY, accessToken]);
  if (refreshToken) entries.push([REFRESH_TOKEN_KEY, refreshToken]);
  if (entries.length) await AsyncStorage.multiSet(entries);
}

export async function clearStoredTokens() {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_CACHE_KEY]);
}

// --------------------
// Auth
// --------------------
export async function login({ email, password }) {
  try {
    console.log('📤 Logging in to:', `${BASE_URL}/auth/login/`);
    const response = await authlessApi.post('/auth/login/', { email, password });
    const data = response.data;

    if (data.token) {
      await storeTokens({ accessToken: data.token, refreshToken: data.refreshToken });
    }

    if (data.user) {
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user));
    }

    return { success: data.success, message: data.message, user: data.user };
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      'Network or server error';
    return { success: false, message };
  }
}

// --------------------
// Register
// --------------------
export const registerAccount = async (data) => {
  try {
    const response = await fetch('http://192.168.1.6:8000/api/accounts/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.status === 201) {
      return { success: true, message: result.message };
    } else if (response.status === 400) {
      return { success: false, errors: result.errors || {} };
    } else {
      return { success: false, message: result.message || 'Registration failed' };
    }
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Network error' };
  }
};

// --------------------
// Current user info
// --------------------
export async function getCurrentUser() {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) throw new Error('No token stored');

    const response = await api.get('/users/me/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.warn('⚠️ Failed to fetch user:', error.response?.data || error.message);
    return null;
  }
}

// Global interceptor for logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('🌐 API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
