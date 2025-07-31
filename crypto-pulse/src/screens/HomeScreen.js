import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import SearchBar from '../components/SearchBar';
import CoinItem from '../components/CoinItem';
import CoinList from '../components/CoinList';
import { cryptoData } from '../constants/cryptoData';

const HomeScreen = () => {
  const [searchText, setSearchText] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with gradient background */}
      <Header />

      {/* Search Bar */}
      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search cryptocurrencies..."
        />

      {/* Popular Coins Section */}
      <CoinList data={cryptoData} title="Popular Coins" />

      {/* Bottom Navigation */}
      <BottomNav active="home" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  coinList: {
    flex: 1,
    },
});

export default HomeScreen;