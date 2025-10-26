import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(false);

  const API_URL = "http://127.0.0.1:8000/api"; // Change to your Django backend URL

  const signIn = async ({ email, password }) => {
    try {
      const response = await fetch(`${API_URL}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (data.success) {
        setUser(data.user); // Save logged-in user
      }

      return data;
    } catch (error) {
      console.error(error);
      return { success: false, message: "Network error" };
    }
  };

  return (
    <AuthContext.Provider value={{ user, initializing, signIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
