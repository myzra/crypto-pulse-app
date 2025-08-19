import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import SearchBar from '../components/SearchBar';
import CoinList from '../components/CoinList';
import { favoritesService } from '@/services/api';
import { getCoinImage } from '../constants/cryptoData';
import { useUser } from '../context/UserContext';

const FavScreen = () => {
  const [searchText, setSearchText] = useState('');
  const [favoriteCoins, setFavoriteCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isLoggedIn} = useUser();

  // Helper function to get default colors
  const getDefaultColor = (index) => {
    const colors = ['#FFEDD5', '#DBEAFE', '#F3E8FF', '#ECFDF5', '#FEF3C7'];
    return colors[index % colors.length];
  };

  // Fetch user's favorite coins
  const fetchFavorites = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await favoritesService.getUserFavorites(user.id);
            
      // Transform the data to match component format
      const transformedCoins = response.map((coin, index) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        price: coin.price?.current_price ? `$${coin.price.current_price.toLocaleString()}` : 'N/A',
        change: coin.price?.change_24h ? `${coin.price.change_24h > 0 ? '+' : ''}${coin.price.change_24h.toFixed(2)}%` : '0.00%',
        isPositive: coin.price?.is_positive !== undefined ? coin.price.is_positive : true,
        color: coin.color || getDefaultColor(index),
        imageSource: getCoinImage(coin.symbol),
        isFavorite: true, // All coins in this list are favorites
      }));
            
      setFavoriteCoins(transformedCoins);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError(err.message || 'Failed to load favorite coins');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Refresh favorites when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn && user?.id) {
        fetchFavorites();
      } else {
        setFavoriteCoins([]);
        setLoading(false);
      }
    }, [isLoggedIn, user?.id, fetchFavorites])
  );
    
  // Handle favorite toggle (remove from favorites)
  const handleToggleFavorite = useCallback(async (coin) => {
    if (!user?.id) return;

    try {
      // Always remove since this is the favorites screen
      await favoritesService.removeFavorite(user.id, coin.id);
            
      // Remove from local state
      setFavoriteCoins(prevCoins => 
        prevCoins.filter(c => c.id !== coin.id)
      );
        
      Alert.alert('Success', `${coin.name} removed from favorites`);
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert('Error', 'Failed to remove from favorites');
      throw error;
    }
  }, [user?.id]);
    
  // Filter favorites based on search text
  const filteredFavorites = useMemo(() => 
    favoriteCoins.filter(coin =>
      coin.name.toLowerCase().includes(searchText.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchText.toLowerCase())
    ), [favoriteCoins, searchText]
  );
  
  // Show login prompt if user is not logged in
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Header />
        <View style={styles.centerContainer}>
          <Text style={styles.loginPromptTitle}>Login Required</Text>
          <Text style={styles.loginPromptText}>
            Please login to view your favorite cryptocurrencies
          </Text>
        </View>
        <BottomNav active="star" />
      </SafeAreaView>
    );
  }
  
  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Header />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#8663EC" />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
        <BottomNav active="star" />
      </SafeAreaView>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Header />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchFavorites}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
        <BottomNav active="star" />
      </SafeAreaView>
    );
  }
  
  // Show empty favorites state
  if (favoriteCoins.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Header />
        <SearchBar
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search favorite cryptocurrencies..."
        />
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptyText}>
            Start adding cryptocurrencies to your favorites by tapping the star icon
          </Text>
        </View>
        <BottomNav active="star" />
      </SafeAreaView>
    );
  }
  
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

      {/* Favorite Coins List */}
      <CoinList 
        data={filteredFavorites} 
        title={`Favorite Coins (${filteredFavorites.length})`}
        onToggleFavorite={handleToggleFavorite}
        isUserLoggedIn={isLoggedIn}
      />
      
      {/* Bottom Navigation */}
      <BottomNav active="star" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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

export default FavScreen;