import Constants from 'expo-constants';

/**
 * 🌐 API Configuration
 * Make sure your backend runs using:
 *    python manage.py runserver 0.0.0.0:8000
 * and your phone + PC are on the same Wi-Fi network.
 */

const LOCAL_IP = '192.168.1.6'; // your computer's Wi-Fi IPv4 address
const DEV_API_PREFIX = '/api/v1'; // Django REST prefix

// Default for physical devices
let origin = `http://${LOCAL_IP}:8000`;

// Adjust automatically for emulators
if (__DEV__) {
  if (Constants.platform?.android) {
    origin = 'http://10.0.2.2:8000'; // Android Emulator -> connects to host machine
  } else if (Constants.platform?.ios) {
    origin = 'http://127.0.0.1:8000'; // iOS Simulator
  }
}

// Allow overrides from app.json (optional)
const apiUrl = Constants.expoConfig?.extra?.apiUrl || origin;
const apiPrefix = Constants.expoConfig?.extra?.apiPrefix || DEV_API_PREFIX;
const timeout = Number(Constants.expoConfig?.extra?.apiTimeout || 15000);

// ✅ Normalized config
export const API_CONFIG = {
  origin: apiUrl.replace(/\/+$/, ''), // remove trailing slashes
  restPrefix: apiPrefix.startsWith('/') ? apiPrefix : `/${apiPrefix}`,
  timeout: Number.isNaN(timeout) ? 15000 : timeout,
};

// ✅ Full base URL used by axios
export const BASE_URL = `${API_CONFIG.origin}${API_CONFIG.restPrefix}`;

console.log('🔗 Using API base URL:', BASE_URL);

/**
 * ⚙️ Google OAuth Config (optional)
 */
export const GOOGLE_AUTH_CONFIG = {
  expoClientId: Constants.expoConfig?.extra?.googleExpoClientId || '',
  androidClientId: Constants.expoConfig?.extra?.googleAndroidClientId || '',
  iosClientId: Constants.expoConfig?.extra?.googleIosClientId || '',
  webClientId: Constants.expoConfig?.extra?.googleWebClientId || '',
  responseType: 'id_token',
  scopes: ['profile', 'email'],
  selectAccount: true,
};
