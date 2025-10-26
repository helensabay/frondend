// App.js
import React from 'react';
import { ApiProvider } from './context/ApiContext';
import { AuthProvider } from './context/AuthContext';
import MainNavigation from './navigation/MainNavigation'; // adjust to your navigation

export default function App() {
  return (
    <AuthProvider>
      <ApiProvider>
        <MainNavigation />
      </ApiProvider>
    </AuthProvider>
  );
}
