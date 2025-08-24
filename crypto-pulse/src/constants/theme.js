// theme.js
export const lightTheme = {
    // Background Colors
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceElevated: '#F9FAFB',
    
    // Text Colors
    text: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    
    // Primary Colors
    primary: '#3B82F6',
    primaryLight: '#DBEAFE',
    accent: '#8663EC',
    
    // Status Colors
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    
    // Border & Separator Colors
    border: '#F3F4F6',
    borderLight: '#E5E7EB',
    separator: '#E5E7EB',
    
    // Card & Component Colors
    card: '#FFFFFF',
    cardShadow: 'rgba(0, 0, 0, 0.05)',
    
    // Input Colors
    inputBackground: '#F9FAFB',
    inputBorder: '#D1D5DB',
    inputPlaceholder: '#9CA3AF',
    
    // Coin Colors (for fallback)
    coinColors: ['#FFEDD5', '#DBEAFE', '#F3E8FF', '#ECFDF5', '#FEF3C7'],
    
    // Status Bar
    statusBarStyle: 'light-content',
    
    // Loading & Activity Indicator
    activityIndicator: '#3B82F6',

    // Header
    subtitleColor: 'rgba(255, 255, 255, 0.8)',
    headerGradient: ['#470AFF', '#C0A8FA'],

    // Coin Item
    btnBackgroundColor: 'rgba(99, 102, 241, 0.1)',
    btnFavDisabled: '#CCCCCC',

    // Navbar
    iconColor: '#000000',
    navBackground: '#FFFFFF',
    borderTopColor: '#E5E7EB',
    navActiveGlow: 'rgba(108, 92, 231, 0.1)',

    // Searchbar
    searchIconColor: '#9CA3AF',
    inputText: '#000000',
  };
  
  export const darkTheme = {
    // Background Colors
    background: '#171A23',
    surface: '#1F2937',
    surfaceElevated: '#212330',
    
    // Text Colors
    text: '#FFFFFF',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    
    // Primary Colors
    primary: '#60A5FA',
    primaryLight: '#1E3A8A',
    accent: '#8663EC',
    
    // Status Colors
    success: '#34D399',
    error: '#EF4444',
    warning: '#FBBF24',
    
    // Border & Separator Colors
    border: '#212330',
    borderLight: '#4B5563',
    separator: '#374151',
    
    // Card & Component Colors
    card: '#212330',
    cardShadow: 'rgba(0, 0, 0, 0.3)',
    
    // Input Colors
    inputBackground: '#212330',
    inputBorder: '#4B5563',
    inputPlaceholder: '#9CA3AF',
    
    // Coin Colors (darker versions for dark mode)
    coinColors: ['#92400E', '#1E40AF', '#6B21A8', '#047857', '#D97706'],
    
    // Status Bar
    statusBarStyle: 'light-content',
    
    // Loading & Activity Indicator
    activityIndicator: '#60A5FA',

    // Header
    subtitleColor: 'rgba(255, 255, 255, 0.8)',
    headerGradient: ['#470AFF', '#1C1925'],

    // Coin Item
    btnBackgroundColor: 'rgba(99, 102, 241, 0.1)',
    btnFavDisabled: 'rgba(134, 99, 236, 0.3)',

    // Navbar
    iconColor: '#FFFFFF',
    navBackground: '#171A23',
    borderTopColor: '#3E3F51',
    navActiveGlow: 'rgba(108, 92, 231, 0.1)',

    // Searchbar
    searchIconColor: '#9CA3AF',
    inputText: '#FFFFFF',
  };
  
  // Theme context and hook
  import React, { createContext, useContext, useState, useEffect } from 'react';
  import AsyncStorage from '@react-native-async-storage/async-storage';
  
  const ThemeContext = createContext();
  
  export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
      throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
  };
  
  export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [theme, setTheme] = useState(lightTheme);
  
    // Load theme preference from storage
    useEffect(() => {
      loadThemePreference();
    }, []);
  
    // Update theme when dark mode changes
    useEffect(() => {
      setTheme(isDarkMode ? darkTheme : lightTheme);
    }, [isDarkMode]);
  
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('isDarkMode');
        if (savedTheme !== null) {
          setIsDarkMode(JSON.parse(savedTheme));
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };
  
    const toggleTheme = async () => {
      try {
        const newIsDarkMode = !isDarkMode;
        setIsDarkMode(newIsDarkMode);
        await AsyncStorage.setItem('isDarkMode', JSON.stringify(newIsDarkMode));
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    };
  
    const value = {
      theme,
      isDarkMode,
      toggleTheme,
    };
  
    return (
      <ThemeContext.Provider value={value}>
        {children}
      </ThemeContext.Provider>
    );
  };