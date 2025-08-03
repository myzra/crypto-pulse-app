import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AppearanceSection = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleDarkModeToggle = () => {
    setIsDarkMode(prev => !prev);
    console.log('Dark mode toggled:', !isDarkMode);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Appearance</Text>
      <View style={styles.appearanceItem}>
        <View style={styles.appearanceLeft}>
          <View style={styles.moonIconContainer}>
            <Ionicons name="moon" size={24} color="#000" />
          </View>
          <View style={styles.appearanceContent}>
            <Text style={styles.appearanceTitle}>Color Theme</Text>
            <Text style={styles.appearanceSubtitle}>Enable Dark Mode</Text>
          </View>
        </View>
        <Switch
          value={isDarkMode}
          onValueChange={handleDarkModeToggle}
          trackColor={{ false: '#E5E5EA', true: '#34C759' }}
          thumbColor="#FFF"
          style={styles.switch}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 30,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  appearanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
    backgroundColor: '#F2F2F7',
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
    color: '#000',
    marginBottom: 2,
  },
  appearanceSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
});

export default AppearanceSection;
