// hooks/useAuth.js - Authentication hook for Next.js
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user_data');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));

      // Set default Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }

    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      const { access_token, user: userData } = response.data;

      setToken(access_token);
      setUser(userData);

      // Store in localStorage
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('user_data', JSON.stringify(userData));

      // Set default Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      return { success: true };

    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        username,
        email,
        password
      });

      // Auto-login after successful registration
      const loginResult = await login(email, password);
      return loginResult;

    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    // Remove from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');

    // Remove Authorization header
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};