// components/BottomNav.js
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BottomNav = ({ active = 'home' }) => {
  const getIconColor = (name) => (active === name ? '#6C5CE7' : '#9E9E9E');
  const isActive = (name) => (active === name ? styles.activeNavItem : null);

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={[styles.navItem, isActive('time')]}>
        <Ionicons name="time-outline" size={24} color={getIconColor('time')} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.navItem, isActive('home')]}>
        <Ionicons name="home" size={24} color={getIconColor('home')} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.navItem, isActive('star')]}>
        <Ionicons name="star-outline" size={24} color={getIconColor('star')} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.navItem, isActive('settings')]}>
        <Ionicons name="settings-outline" size={24} color={getIconColor('settings')} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navItem: {
    padding: 10,
  },
  activeNavItem: {
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    borderRadius: 20,
  },
});

export default BottomNav;
