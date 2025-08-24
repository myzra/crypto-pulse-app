import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, StatusBar } from 'react-native';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import NotificationsSection from '../components/settings/NotificationsSection';
import AppearanceSection from '../components/settings/AppearanceSection';
import BottomNav from '../components/BottomNav';
import { useTheme } from '../constants/theme';

const SettingsScreen = () => {
  const [searchText, setSearchText] = useState('');
  const { theme } = useTheme();

  const themedStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      flex: 1
    },
  });

  return (
    <SafeAreaView style={themedStyles.container}>
      <StatusBar barStyle={theme.statusBarStyle} />
      
      <Header />
      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search cryptocurrencies..."
      />
      
      <ScrollView 
        style={themedStyles.scrollContent}
        contentContainerStyle={{ paddingBottom: 25 }}
        showsVerticalScrollIndicator={false}
      >
        <NotificationsSection />
        <AppearanceSection />
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
};

export default SettingsScreen;
