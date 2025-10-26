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
export const login = async ({ email, password }) => {
  try {
    const response = await fetch(`${BASE_URL}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: email.trim().toLowerCase(), // Keep as 'username' if DRF default
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const message =
        data.detail || data.non_field_errors?.[0] || 'Incorrect email or password';
      return { success: false, message };
    }

    // Store tokens
    if (data.access && data.refresh) {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.access);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
    }

    return { success: true, data };
  } catch (error) {
    console.error('API login error:', error);
    return { success: false, message: 'Network or server error' };
  }
};

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
