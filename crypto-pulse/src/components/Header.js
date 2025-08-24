// components/Header.js
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../constants/theme';

const Header = () => {
  const { theme } = useTheme();  

  const themedStyles = StyleSheet.create({
    header: {
      paddingTop: 20,
      paddingBottom: 30,
      paddingHorizontal: 20,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 40,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: 2,
      marginTop: 20,
    },
    subtitle: {
      fontSize: 14,
      color: theme.subtitleColor,
    },
    logoImage: {
      width: 70,
      height: 70,
      marginRight: 16,
      tintColor: 'white',
      alignSelf: 'flex-start',
      marginTop: 20,
      marginLeft: 2,
    },
  });

  return (
    <LinearGradient
      colors={theme.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={themedStyles.header}
    >
      <View style={themedStyles.headerContent}>
        <View style={themedStyles.logoContainer}>
          <View style={themedStyles.logo}>
            <Image 
              source={require('../../assets/cplogo.png')}
              style={themedStyles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View style={themedStyles.titleContainer}>
            <Text style={themedStyles.title}>Crypto Pulse</Text>
            <Text style={themedStyles.subtitle}>
              Track & get notified about your favorite coins
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

export default Header;
