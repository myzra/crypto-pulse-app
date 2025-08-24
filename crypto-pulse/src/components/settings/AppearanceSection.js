import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';

const AppearanceSection = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [animation] = useState(new Animated.Value(0));

  // Update animation when theme changes
  useEffect(() => {
    Animated.timing(animation, {
      toValue: isDarkMode ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isDarkMode]);

  const handleDarkModeToggle = () => {
    toggleTheme();
  };

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 30],
  });

  const trackColor = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.borderLight, theme.accent],
  });

  const styles = StyleSheet.create({
    section: {
      marginTop: 30,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 15,
    },
    appearanceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      padding: 15,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    appearanceLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    moonIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surfaceElevated,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    appearanceContent: {
      flex: 1,
    },
    appearanceTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 2,
    },
    appearanceSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    switchContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    switchTrack: {
      width: 60,
      height: 30,
      borderRadius: 17,
      justifyContent: 'center',
      position: 'relative',
    },
    switchThumb: {
      width: 20,
      height: 20,
      borderRadius: 14,
      backgroundColor: '#FFFFFF',
      position: 'absolute',
      left: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
  });

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Appearance</Text>
      <View style={styles.appearanceItem}>
        <View style={styles.appearanceLeft}>
          <View style={styles.moonIconContainer}>
            <Ionicons 
              name="moon" 
              size={24} 
              color={isDarkMode ? theme.text : '#000'} 
            />
          </View>
          <View style={styles.appearanceContent}>
            <Text style={styles.appearanceTitle}>Color Theme</Text>
            <Text style={styles.appearanceSubtitle}>Enable Dark Mode</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.switchContainer} onPress={handleDarkModeToggle}>
          <Animated.View style={[styles.switchTrack, { backgroundColor: trackColor }]}>
            <Animated.View 
              style={[
                styles.switchThumb,
                { transform: [{ translateX }] }
              ]} 
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AppearanceSection;