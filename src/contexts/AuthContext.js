import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api'; // Assuming api.js is set up for axios instance

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hopeconnect_token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('hopeconnect_user');
    localStorage.removeItem('hopeconnect_token');
    setUser(null);
    setToken(null);
    delete api.defaults.headers.common['Authorization']; // Remove token from API headers
     // Optionally redirect or notify other parts of the app
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('hopeconnect_user');
    const storedToken = localStorage.getItem('hopeconnect_token');

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        // Optional: Verify token with backend on load
        // verifyTokenOnLoad(parsedUser, storedToken); 

      } catch (error) {
        console.error("Failed to parse stored user or set auth state:", error);
        logout(); // Clear invalid stored data
      }
    }
    setLoading(false);
  }, [logout]);

  // Optional: Function to verify token with backend
  // const verifyTokenOnLoad = async (currentUser, currentToken) => {
  //   try {
  //     // Example: make a call to a '/auth/me' or '/auth/verify' endpoint
  //     const response = await api.get('/auth/me'); 
  //     if (response.data.user.id !== currentUser.id) { // Or other checks
  //        logout(); // Token mismatch or invalid
  //     }
  //     // Token is valid, user is up-to-date
  //   } catch (error) {
  //     console.error("Token verification failed:", error);
  //     logout(); // Token is likely expired or invalid
  //   }
  // };


  const login = (userData, authToken) => {
    localStorage.setItem('hopeconnect_user', JSON.stringify(userData));
    localStorage.setItem('hopeconnect_token', authToken);
    setUser(userData);
    setToken(authToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  };


  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!user && !!token }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;