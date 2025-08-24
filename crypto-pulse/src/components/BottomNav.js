import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../constants/theme';


const BottomNav = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();

  const active = route.name.toLowerCase();

  const getIconColor = (name) => (active === name ? theme.accent : theme.iconColor);
  const isActive = (name) => (active === name ? themedStyles.activeNavItem : null);

  const themedStyles = StyleSheet.create({
    bottomNav: {
      flexDirection: 'row',
      backgroundColor: theme.navBackground,
      paddingVertical: 15,
      paddingHorizontal: 10,
      justifyContent: 'space-around',
      borderTopWidth: 1,
      borderTopColor: theme.borderTopColor,
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
      backgroundColor: theme.navActiveGlow,
    },
  });

  return (
    <View style={themedStyles.bottomNav}>
      <TouchableOpacity
        style={[themedStyles.navItem, isActive('logs')]}
        onPress={() => navigation.navigate('Logs')}
      >
        <Image
          source={require('../../assets/navbar/NavNotifications.png')}
          style={[themedStyles.navIcon, { tintColor: getIconColor('logs') }]}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[themedStyles.navItem, isActive('home')]}
        onPress={() => navigation.navigate('Home')}
      >
        <Image
          source={require('../../assets/navbar/NavHome.png')}
          style={[themedStyles.navIcon, { tintColor: getIconColor('home') }]}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[themedStyles.navItem, isActive('favorites')]}
        onPress={() => navigation.navigate('Favorites')}
      >
        <Image
          source={require('../../assets/navbar/NavStar.png')}
          style={[themedStyles.navIcon, { tintColor: getIconColor('favorites') }]}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[themedStyles.navItem, isActive('settings')]}
        onPress={() => navigation.navigate('Settings')}
      >
        <Image
          source={require('../../assets/navbar/NavControls.png')}
          style={[themedStyles.navIcon, { tintColor: getIconColor('settings') }]}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
};

export default BottomNav;
