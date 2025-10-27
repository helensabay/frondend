// api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from './config';

// --------------------
// Constants
// --------------------
export const ACCESS_TOKEN_KEY = '@sanaol/auth/accessToken';
export const REFRESH_TOKEN_KEY = '@sanaol/auth/refreshToken';
export const USER_CACHE_KEY = '@sanaol/auth/user';

// Separate base URLs
export const BASE_URL = `http://192.168.1.6:8000/api/v1`; // main API
export const BASE_URL_MENU = `http://192.168.1.6:8000/menu`; // menu endpoints

// --------------------
// Axios instances
// --------------------
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
export const login = async ({ email, password }) => {
  try {
    const response = await fetch(`${BASE_URL}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: email.trim().toLowerCase(),
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data.detail || data.non_field_errors?.[0] || 'Incorrect email or password';
      return { success: false, message };
    }

    // Store tokens
    if (data.access && data.refresh) {
      await storeTokens({ accessToken: data.access, refreshToken: data.refresh });
    }

    return { success: true, data };
  } catch (error) {
    console.error('API login error:', error);
    return { success: false, message: 'Network or server error' };
  }
};

// --------------------
// Menu endpoints
// --------------------
export const fetchMenuItems = async (category = '') => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const response = await axios.get(`${BASE_URL_MENU}/menu-items/`, {
      params: { category },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    console.log('Menu items response:', response.data);
    return response.data || [];
  } catch (error) {
    console.error('fetchMenuItems error:', error.response?.data || error.message);
    return [];
  }
};

export async function fetchMenuItemsByCategory(category) {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const url = `${BASE_URL_MENU}/menu-items/?category=${category}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('fetchMenuItemsByCategory error:', err);
    return [];
  }
}

// --------------------
// Register
// --------------------
export const registerAccount = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/accounts/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (response.status === 201) return { success: true, message: result.message };
    if (response.status === 400) return { success: false, errors: result.errors || {} };
    return { success: false, message: result.message || 'Registration failed' };
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

// --------------------
// Global interceptor for logging
// --------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('🌐 API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
