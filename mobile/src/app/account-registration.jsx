import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Picker } from '@react-native-picker/picker';
import {
  useFonts,
  Roboto_400Regular,
  Roboto_700Bold,
  Roboto_900Black,
} from '@expo-google-fonts/roboto';
import { registerAccount } from '../api/api';

export default function AccountRegistrationScreen() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    role: '',
    email: '',
    password: '',
    confirm: '',
  });

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Handle form field changes
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Client-side validation
  const validateForm = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!form.role) errs.role = 'Please select a role';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      errs.email = 'Valid email is required';
    if (form.password.length < 6)
      errs.password = 'Password must be at least 6 characters';
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match';
    return errs;
  };

  // Handle registration API call
  const handleRegister = async () => {
    const errs = validateForm();
    setErrors(errs);

    if (Object.keys(errs).length === 0) {
      setLoading(true);

      try {
        const result = await registerAccount({
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          password: form.password,
          confirm: form.confirm,
          role: form.role, // sent to backend
        });

        if (result.success) {
          Alert.alert('Success', 'Account created successfully!', [
            { text: 'OK', onPress: () => router.push('/AccountCreatedScreen') },
          ]);

          setForm({
            firstName: '',
            lastName: '',
            role: '',
            email: '',
            password: '',
            confirm: '',
          });
        } else if (result.errors) {
          setErrors(result.errors);
        } else {
          Alert.alert('Error', result.message);
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  let [fontsLoaded] = useFonts({
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
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Fill in the details to register</Text>

          <View style={styles.card}>
            {/* First Name */}
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#888" />
              <TextInput
                placeholder="First Name"
                value={form.firstName}
                onChangeText={(text) => handleChange('firstName', text)}
                style={styles.input}
              />
            </View>
            {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

            {/* Last Name */}
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#888" />
              <TextInput
                placeholder="Last Name"
                value={form.lastName}
                onChangeText={(text) => handleChange('lastName', text)}
                style={styles.input}
              />
            </View>
            {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

            {/* Role Picker */}
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="account-badge-outline" size={20} color="#888" />
              <Picker
                selectedValue={form.role}
                onValueChange={(value) => handleChange('role', value)}
                style={[styles.input, { color: form.role ? '#333' : '#888' }]}
              >
                <Picker.Item label="Select Role" value="" />
                <Picker.Item label="Student" value="student" />
                <Picker.Item label="Staff" value="staff" />
                <Picker.Item label="Admin" value="admin" />
              </Picker>
            </View>
            {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}

            {/* Email */}
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#888" />
              <TextInput
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(text) => handleChange('email', text)}
                style={styles.input}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            {/* Password */}
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#888" />
              <TextInput
                placeholder="Password"
                secureTextEntry={!passwordVisible}
                value={form.password}
                onChangeText={(text) => handleChange('password', text)}
                style={[styles.input, { flex: 1 }]}
              />
              <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                <Ionicons name={passwordVisible ? 'eye' : 'eye-off'} size={20} color="#888" />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            {/* Confirm Password */}
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="lock-check-outline" size={20} color="#888" />
              <TextInput
                placeholder="Confirm Password"
                secureTextEntry={!confirmVisible}
                value={form.confirm}
                onChangeText={(text) => handleChange('confirm', text)}
                style={[styles.input, { flex: 1 }]}
              />
              <TouchableOpacity onPress={() => setConfirmVisible(!confirmVisible)}>
                <Ionicons name={confirmVisible ? 'eye' : 'eye-off'} size={20} color="#888" />
              </TouchableOpacity>
            </View>
            {errors.confirm && <Text style={styles.errorText}>{errors.confirm}</Text>}

            {/* Register Button */}
            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Registering...' : 'Register'}</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>Or</Text>
              <View style={styles.line} />
            </View>

            {/* Google Sign-Up */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => alert('Google sign up not implemented')}
            >
              <Image source={require('../../assets/google.png')} style={styles.googleIcon} />
              <Text style={styles.googleText}>Sign up with Google</Text>
            </TouchableOpacity>

            {/* Back to Login */}
            <View style={styles.loginRow}>
              <Text style={{ color: '#666' }}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/account-login')}>
                <Text style={styles.loginText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 25, paddingVertical: 40 },
  container: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  title: { fontSize: 28, fontFamily: 'Roboto_900Black', color: '#333', marginBottom: 6 },
  subtitle: { fontSize: 16, fontFamily: 'Roboto_400Regular', color: '#555', marginBottom: 20, textAlign: 'center' },
  card: { width: '100%', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 5 }, shadowRadius: 10, elevation: 3 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 10, marginBottom: 10, backgroundColor: '#F5F5F5' },
  input: { flex: 1, paddingVertical: 12, paddingHorizontal: 5, fontSize: 16, color: '#333', fontFamily: 'Roboto_400Regular' },
  errorText: { color: 'red', marginBottom: 5, marginLeft: 5 },
  button: { backgroundColor: '#FF8C00', paddingVertical: 14, borderRadius: 12, marginTop: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontFamily: 'Roboto_700Bold', fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  line: { flex: 1, height: 1, backgroundColor: '#ccc' },
  orText: { marginHorizontal: 10, color: '#888' },
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', paddingVertical: 12, borderRadius: 12 },
  googleIcon: { width: 22, height: 22, marginRight: 10 },
  googleText: { fontSize: 16, fontFamily: 'Roboto_700Bold', color: '#333' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginText: { color: '#FF8C00', fontFamily: 'Roboto_700Bold' },
});
