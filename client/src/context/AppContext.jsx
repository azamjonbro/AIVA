import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [aiSettings, setAiSettings] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('aiva_token') || '');
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome to AIVA', message: 'Demo mode loaded. Start exploring the sales workflow!', time: 'Just now', read: false, type: 'info' }
  ]);

  // Set default axios header
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  // Toast utilities
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Live Notification utilities
  const addNotification = useCallback((title, message, type = 'info') => {
    const id = Date.now();
    setNotifications((prev) => [
      { id, title, message, time: 'Just now', read: false, type },
      ...prev
    ]);
    addToast(`${title}: ${message}`, type);
  }, [addToast]);

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Get user profile on load
  const fetchProfile = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const res = await axios.get('/api/auth/me');
      setUser(res.data.user);
      setCompany(res.data.company);
      setAiSettings(res.data.aiSettings || null);
    } catch (error) {
      console.error('Fetch profile failed:', error);
      // If unauthorized, clear session
      if (error.response?.status === 401) {
        setToken('');
        localStorage.removeItem('aiva_token');
        setUser(null);
        setCompany(null);
        setAiSettings(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Login
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const res = await axios.post('/api/auth/login', { email, password });
      const { token: userToken, user: userData, company: compData, aiSettings: aiData } = res.data;
      localStorage.setItem('aiva_token', userToken);
      setToken(userToken);
      setUser(userData);
      setCompany(compData);
      setAiSettings(aiData || null);
      addToast(`Welcome back, ${userData.name}!`, 'success');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      addToast(msg, 'error');
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  // Register Owner
  const register = async (name, email, password, companyName, category) => {
    try {
      setIsLoading(true);
      const res = await axios.post('/api/auth/register', { name, email, password, companyName, category });
      const { token: userToken, user: userData, company: compData, aiSettings: aiData } = res.data;
      localStorage.setItem('aiva_token', userToken);
      setToken(userToken);
      setUser(userData);
      setCompany(compData);
      setAiSettings(aiData || null);
      addToast('Account created successfully!', 'success');
      addNotification('SaaS Workspace Created', `Your workspace for ${companyName} has been initialized.`, 'success');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed. Try again.';
      addToast(msg, 'error');
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  // Demo Login (One-click)
  const loginDemo = async () => {
    try {
      setIsLoading(true);
      const res = await axios.post('/api/auth/demo');
      const { token: userToken, user: userData, company: compData, aiSettings: aiData } = res.data;
      localStorage.setItem('aiva_token', userToken);
      setToken(userToken);
      setUser(userData);
      setCompany(compData);
      setAiSettings(aiData || null);
      addToast('Logged in as Demo User!', 'success');
      addNotification('Demo Workspace Loaded', 'Preloaded items: 4 products, 5 leads, and conversation metrics are now online.', 'info');
      return { success: true };
    } catch (error) {
      console.error('Demo login failed:', error);
      addToast('Demo login failed. Please run client & server.', 'error');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('aiva_token');
    setToken('');
    setUser(null);
    setCompany(null);
    setAiSettings(null);
    addToast('Logged out successfully.', 'info');
  };

  // Update Workspace settings
  const updateSettings = async (settingsData) => {
    try {
      setIsLoading(true);
      const res = await axios.put('/api/auth/settings', settingsData);
      setCompany(res.data.company);
      setAiSettings(res.data.aiSettings || null);
      addToast('AI Configuration updated successfully!', 'success');
      addNotification('Agent Trained', `AI settings updated. Agent is now active under name ${settingsData.aiName || 'Aiva'}.`, 'success');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update settings.';
      addToast(msg, 'error');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        company,
        aiSettings,
        token,
        isLoading,
        toasts,
        notifications,
        addToast,
        addNotification,
        markAllNotificationsRead,
        login,
        register,
        loginDemo,
        logout,
        updateSettings,
        refreshProfile: fetchProfile
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
