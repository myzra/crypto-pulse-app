// contexts/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../App';
import { registerForPushNotificationsAsync } from '../services/pushNotifications';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pushToken, setPushToken] = useState(null);

  // Load user data from storage on app start
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  // Setup push notifications when user logs in
  useEffect(() => {
    if (user && !pushToken) {
      setupPushNotifications();
    }
  }, [user]);

  const loadUserFromStorage = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupPushNotifications = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setPushToken(token);
        await savePushTokenToDatabase(token);
        // Also save to AsyncStorage for quick access
        await AsyncStorage.setItem('pushToken', token);
      }
    } catch (error) {
      console.error('Error setting up push notifications:', error);
    }
  };

  const savePushTokenToDatabase = async (token) => {
    if (!user || !user.id) {
      console.log('No user ID available, cannot save push token');
      return;
    }

    try {
      // First, check if user already has a push token record
      const { data: existingToken, error: fetchError } = await supabase
        .from('user_push_tokens')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error fetching existing push token:', fetchError);
        return;
      }

      if (existingToken) {
        // Update existing token
        const { error } = await supabase
          .from('user_push_tokens')
          .update({ 
            push_token: token,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating push token:', error);
        } else {
          console.log('Push token updated successfully');
        }
      } else {
        // Insert new token
        const { error } = await supabase
          .from('user_push_tokens')
          .insert([{
            user_id: user.id,
            push_token: token,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (error) {
          console.error('Error saving push token:', error);
        } else {
          console.log('Push token saved successfully');
        }
      }
    } catch (error) {
      console.error('Error in savePushTokenToDatabase:', error);
    }
  };

  const login = async (userData) => {
    try {
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Error removing user from storage:', error);
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isLoggedIn: !!user,
    pushToken,
    setupPushNotifications,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};