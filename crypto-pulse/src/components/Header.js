// components/Header.js
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Header = () => {
  return (
    <LinearGradient
      colors={['#6C5CE7', '#A29BFE']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Image 
              source={require('../../assets/cplogo.png')}   // <--- dein Bild im assets/ Ordner
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Crypto Pulse</Text>
            <Text style={styles.subtitle}>
              Track & get notified about your favorite coins
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
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
    color: 'rgba(255, 255, 255, 0.8)',
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

export default Header;
