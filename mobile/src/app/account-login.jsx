import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Roboto_400Regular,
  Roboto_700Bold,
  Roboto_900Black,
} from '@expo-google-fonts/roboto';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

// Backend API
const LOCAL_IP = '192.168.1.6'; // Change to your backend IP
const API_BASE = `http://${LOCAL_IP}:8000/api`;

export default function AccountLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [user, setUser] = useState(null);

  // ---------- HELPER ----------
  const formatMessage = (msg) => {
    if (Array.isArray(msg)) return msg.join('\n'); // array -> string
    if (typeof msg === 'object' && msg !== null) return JSON.stringify(msg); // object -> string
    return String(msg); // anything else -> string
  };

  // ---------- GOOGLE CONFIG ----------
  const googleConfig = {
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    responseType: 'id_token',
    scopes: ['profile', 'email'],
    selectAccount: true,
  };

  const [request, , promptAsync] = Google.useAuthRequest(googleConfig);
  const validateEmail = useCallback((value) => /\S+@\S+\.\S+/.test(value), []);

  // ---------- AUTO REDIRECT IF LOGGED IN ----------
  useEffect(() => {
    const checkUser = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        router.replace('/(tabs)');
      }
    };
    checkUser();
  }, []);

  // ---------- LOGIN FUNCTION ----------
  const login = async ({ email, password }) => {
    try {
      const response = await fetch(`${API_BASE}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, message: data.detail || data.message || 'Invalid credentials' };
      }
      return { success: true, data };
    } catch (error) {
      console.error('Login API error:', error);
      return { success: false, message: 'Network error' };
    }
  };

  // ---------- EMAIL/PASSWORD LOGIN ----------
  const handleLogin = async () => {
    if (loading) return;

    const errs = {};
    if (!validateEmail(email)) errs.email = 'Invalid email address';
    if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const { success, data, message } = await login({ email, password });
      if (!success) {
        return Alert.alert('Login Failed', formatMessage(message || 'Incorrect email or password'));
      }

      // Fetch profile
      const profileRes = await fetch(`${API_BASE}/profile/`, {
        headers: { Authorization: `Bearer ${data.access}` },
      });
      const profile = await profileRes.json();
      await AsyncStorage.setItem('user', JSON.stringify(profile));
      await AsyncStorage.setItem('accessToken', data.access);
      await AsyncStorage.setItem('refreshToken', data.refresh);
      setUser(profile);

      Alert.alert('Success', 'Login successful!', [
        { text: 'Continue', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', 'Network or server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- GOOGLE LOGIN ----------
  const handleGoogleSignIn = useCallback(async () => {
    if (!request) {
      Alert.alert('Unavailable', 'Google Sign-In not configured for this build.');
      return;
    }

    setGoogleLoading(true);
    try {
      const res = await promptAsync();
      if (!res || res.type !== 'success') return;

      const idToken = res.authentication?.idToken || res.params?.id_token;
      if (!idToken) throw new Error('Missing Google ID token');

      const loginResponse = await fetch(`${API_BASE}/google-login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: idToken }),
      });
      const loginData = await loginResponse.json();

      if (loginResponse.ok && loginData.access) {
        await AsyncStorage.setItem('accessToken', loginData.access);
        await AsyncStorage.setItem('refreshToken', loginData.refresh);

        const profileRes = await fetch(`${API_BASE}/profile/`, {
          headers: { Authorization: `Bearer ${loginData.access}` },
        });
        const profile = await profileRes.json();
        await AsyncStorage.setItem('user', JSON.stringify(profile));
        setUser(profile);

        Alert.alert('Success', 'Login successful!', [
          { text: 'Continue', onPress: () => router.replace('/(tabs)') },
        ]);
      } else {
        Alert.alert('Google Login Failed', formatMessage(loginData.detail || 'Unable to authenticate with Google.'));
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Google Login Failed', formatMessage(error.message || 'Please try again.'));
    } finally {
      setGoogleLoading(false);
    }
  }, [promptAsync, request, router]);

  // ---------- GUEST LOGIN ----------
  const handleGuestEntry = useCallback(async () => {
    if (guestLoading) return;
    setGuestLoading(true);
    try {
      const response = await fetch(`${API_BASE}/guest-login/`);
      const data = await response.json();
      if (response.ok && data.success) {
        Alert.alert('Guest Access', 'You are browsing as a guest user.', [
          { text: 'Continue', onPress: () => router.replace('/(tabs)') },
        ]);
      } else {
        Alert.alert('Unavailable', formatMessage(data.message || 'Unable to continue without an account.'));
      }
    } catch (error) {
      console.error('Guest entry error:', error);
      Alert.alert('Unavailable', formatMessage(error?.message || 'Please try again.'));
    } finally {
      setGuestLoading(false);
    }
  }, [router, guestLoading]);

  // ---------- LOAD FONTS ----------
  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_700Bold,
    Roboto_900Black,
  });
  if (!fontsLoaded) return null;

  return (
    <ImageBackground
      source={require('../../assets/drop_3.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.3)']}
        style={StyleSheet.absoluteFillObject}
      />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <View style={styles.card}>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to enjoy delicious canteen meals</Text>

            {/* Email */}
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#888" />
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Email Address"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            {/* Password */}
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#888" />
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Password"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                <Ionicons name={passwordVisible ? 'eye' : 'eye-off'} size={20} color="#888" />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            {/* Login Button */}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.loginText}>Login</Text>}
            </TouchableOpacity>

            {/* Google Button */}
            <TouchableOpacity style={styles.googleButton} disabled={!request || googleLoading} onPress={handleGoogleSignIn}>
              {googleLoading ? <ActivityIndicator size="small" color="#4285F4" /> : <Image source={require('../../assets/google.png')} style={styles.googleIcon} />}
              <Text style={styles.googleText}>{googleLoading ? 'Connecting...' : 'Continue with Google'}</Text>
            </TouchableOpacity>

            {/* Guest Button */}
            <TouchableOpacity style={styles.guestButton} onPress={handleGuestEntry} disabled={guestLoading}>
              {guestLoading ? <ActivityIndicator size="small" color="#FF8C00" /> : <Text style={styles.guestText}>Continue without an account</Text>}
            </TouchableOpacity>

            {/* Links */}
            <TouchableOpacity onPress={() => router.push('/account-password')}>
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/account-registration')}>
              <Text style={styles.linkText}>Don’t have an account? <Text style={{ fontFamily: 'Roboto_700Bold' }}>Sign Up</Text></Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 25, paddingVertical: 40 },
  container: { alignItems: 'center', justifyContent: 'flex-start', flex: 1 },
  logo: { width: 180, height: 180, marginTop: 35 },
  title: { fontSize: 28, fontFamily: 'Roboto_900Black', color: '#333', marginBottom: 2 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 30, textAlign: 'left', fontFamily: 'Roboto_400Regular' },
  card: { width: '100%', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 25, elevation: 3, marginTop: 25 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, backgroundColor: '#F5F5F5' },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#333', fontFamily: 'Roboto_400Regular' },
  inputError: { borderColor: 'red' },
  loginButton: { backgroundColor: '#FF8C00', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginVertical: 10 },
  loginText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', paddingVertical: 12, borderRadius: 12, marginBottom: 15 },
  googleIcon: { width: 22, height: 22, marginRight: 10 },
  googleText: { fontSize: 16, fontFamily: 'Roboto_700Bold', color: '#333' },
  guestButton: { borderWidth: 1, borderColor: '#FF8C00', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  guestText: { fontSize: 16, fontFamily: 'Roboto_700Bold', color: '#FF8C00' },
  linkText: { color: '#FF8C00', marginTop: 5, fontSize: 15, textAlign: 'center' },
  errorText: { color: 'red', alignSelf: 'flex-start', marginBottom: 10, marginLeft: 5, fontSize: 13 },
});
