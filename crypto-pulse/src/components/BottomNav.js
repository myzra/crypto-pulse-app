// components/BottomNav.js
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'react-native';

const BottomNav = ({ active = 'home' }) => {
  const getIconColor = (name) => (active === name ? '#8663EC' : '#000000');
  const isActive = (name) => (active === name ? styles.activeNavItem : null);

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={[styles.navItem, isActive('time')]}>
        <Image
          source={require('../../assets/navbar/NavNotifications.png')}
          style={[
            styles.navIcon,
            { tintColor: getIconColor('time') }
          ]}
          resizeMode="contain"
        />      
      </TouchableOpacity>
      <TouchableOpacity style={[styles.navItem, isActive('home')]}>
        <Image
            source={require('../../assets/navbar/NavHome.png')}
            style={[
              styles.navIcon,
              { tintColor: getIconColor('home') }
            ]}
            resizeMode="contain"
          />      
        </TouchableOpacity>
      <TouchableOpacity style={[styles.navItem, isActive('star')]}>
        <Image
            source={require('../../assets/navbar/NavStar.png')}
            style={[
              styles.navIcon,
              { tintColor: getIconColor('star') }
            ]}
            resizeMode="contain"
          />      
        </TouchableOpacity>
      <TouchableOpacity style={[styles.navItem, isActive('settings')]}>
        <Image
            source={require('../../assets/navbar/NavControls.png')}
            style={[
              styles.navIcon,
              { tintColor: getIconColor('settings') }
            ]}
            resizeMode="contain"
          />      
        </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 10,
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navItem: {
    padding: 5,
  },
  navIcon: {
    width: 32,
    height: 32,
  },
  activeNavItem: {
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    borderRadius: 20,
  },
});

export default BottomNav;
