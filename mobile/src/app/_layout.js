import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Platform } from 'react-native';

import '../styles/nativewind';

import { queryClient } from '../api/queryClient';
import { ApiProvider } from '../context/ApiContext';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { NotificationProvider } from '../context/NotificationContext';
import { DietaryProvider } from '../context/DietaryContext';

export default function RootLayout() {
  const isDev = process.env.NODE_ENV !== 'production';
  const showDevtools = isDev && Platform.OS === 'web';

  return (
    <QueryClientProvider client={queryClient}>
      <ApiProvider>
        <AuthProvider>
          <CartProvider>
            <NotificationProvider>
              <DietaryProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="app-launch" />
                  <Stack.Screen name="account-login" />
                  <Stack.Screen name="account-registration" />
                  <Stack.Screen name="account-password-reset" />
                  <Stack.Screen name="(tabs)" />
                </Stack>
              </DietaryProvider>
            </NotificationProvider>
          </CartProvider>
        </AuthProvider>
      </ApiProvider>
      {showDevtools ? <ReactQueryDevtools /> : null}
    </QueryClientProvider>
  );
}
