import React, { useState } from 'react';
import { View, SafeAreaView, ScrollView, StyleSheet, StatusBar  } from 'react-native';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import NotificationsSection from '../components/settings/NotificationsSection';
import AppearanceSection from '../components/settings/AppearanceSection';
import BottomNav from '../components/BottomNav';

const SettingsScreen = () => {
  const [searchText, setSearchText] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Header />
      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search cryptocurrencies..."
      />
      
      <ScrollView 
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <NotificationsSection />
        <AppearanceSection />
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flex: 1,
  },
});

export default SettingsScreen;
