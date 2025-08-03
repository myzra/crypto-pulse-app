import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const BottomNav = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const active = route.name.toLowerCase();

  const getIconColor = (name) => (active === name ? '#8663EC' : '#000000');
  const isActive = (name) => (active === name ? styles.activeNavItem : null);

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={[styles.navItem, isActive('notifications')]}
        onPress={() => {
          // navigation.navigate('Notifications'); // Optional
        }}
      >
        <Image
          source={require('../../assets/navbar/NavNotifications.png')}
          style={[styles.navIcon, { tintColor: getIconColor('notifications') }]}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, isActive('home')]}
        onPress={() => navigation.navigate('Home')}
      >
        <Image
          source={require('../../assets/navbar/NavHome.png')}
          style={[styles.navIcon, { tintColor: getIconColor('home') }]}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, isActive('favorites')]}
        onPress={() => navigation.navigate('Favorites')}
      >
        <Image
          source={require('../../assets/navbar/NavStar.png')}
          style={[styles.navIcon, { tintColor: getIconColor('favorites') }]}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, isActive('settings')]}
        onPress={() => navigation.navigate('Settings')}
      >
        <Image
          source={require('../../assets/navbar/NavControls.png')}
          style={[styles.navIcon, { tintColor: getIconColor('settings') }]}
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
    borderRadius: 20,
  },
  navIcon: {
    width: 32,
    height: 32,
  },
  activeNavItem: {
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
  },
});

export default BottomNav;
