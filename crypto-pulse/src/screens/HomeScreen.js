import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import CoinItem from '../components/CoinItem';
import CoinList from '../components/CoinList';
import { coinsService, favoritesService } from '../services/api';
import { getCoinImage } from '../constants/cryptoData';
import { useUser } from '../context/UserContext';

const HomeScreen = () => {
  const [searchText, setSearchText] = useState('');
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isLoggedIn } = useUser();

  // Helper function to get default colors if not set in database
  const getDefaultColor = (index) => {
    const colors = ['#FFEDD5', '#DBEAFE', '#F3E8FF', '#ECFDF5', '#FEF3C7'];
    return colors[index % colors.length];
  };

  const fetchCoins = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await coinsService.getAllCoins();
      
      // Get user favorites if logged in
      let userFavorites = [];
      if (isLoggedIn && user?.id) {
        try {
          const favoritesResponse = await favoritesService.getUserFavorites(user.id);
          userFavorites = favoritesResponse.map(fav => fav.id);
        } catch (favError) {
          console.warn('Error fetching user favorites:', favError);
          // Continue without favorites if there's an error
        }
      }
      
      // Transform the data to match your component's expected format
      const transformedCoins = response.map((coin, index) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        price: coin.price?.current_price ? `$${coin.price.current_price.toLocaleString()}` : 'N/A',
        change: coin.price?.change_24h ? `${coin.price.change_24h > 0 ? '+' : ''}${coin.price.change_24h.toFixed(2)}%` : '0.00%',
        isPositive: coin.price?.is_positive !== undefined ? coin.price.is_positive : true,
        color: coin.color || getDefaultColor(index),
        imageSource: getCoinImage(coin.symbol),
        isFavorite: userFavorites.includes(coin.id), // Mark as favorite if in user's favorites
      }));
      
      setCoins(transformedCoins);
    } catch (err) {
      console.error('Error fetching coins:', err);
      setError(err.message || 'Failed to load coins');
      Alert.alert('Error', 'Failed to load cryptocurrency data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Refresh coins when screen comes into focus or user changes
  useFocusEffect(
    useCallback(() => {
      fetchCoins();
    }, [isLoggedIn, user?.id])
  );

  // Handle favorite toggle
  const handleToggleFavorite = useCallback(async (coin) => {
    if (!isLoggedIn || !user?.id) {
      Alert.alert('Login Required', 'Please login to manage favorites');
      return;
    }

    try {
      // Optimistically update UI first
      setCoins(prevCoins => 
        prevCoins.map(c => 
          c.id === coin.id 
            ? { ...c, isFavorite: !c.isFavorite }
            : c
        )
      );

      // Then make API call
      if (coin.isFavorite) {
        await favoritesService.removeFavorite(user.id, coin.id);
      } else {
        await favoritesService.addFavorite(user.id, coin.id);
      }

    } catch (error) {
      console.error('Error toggling favorite:', error);
      
      // Revert optimistic update on error
      setCoins(prevCoins => 
        prevCoins.map(c => 
          c.id === coin.id 
            ? { ...c, isFavorite: coin.isFavorite } // Revert to original state
            : c
        )
      );
      
      Alert.alert('Error', `Failed to ${coin.isFavorite ? 'remove from' : 'add to'} favorites`);
      throw error; // Re-throw so CoinList can handle it
    }
  }, [isLoggedIn, user?.id]);

  // Filter coins based on search text (memoized for performance)
  const filteredCoins = useMemo(() => 
    coins.filter(coin =>
      coin.name.toLowerCase().includes(searchText.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchText.toLowerCase())
    ), [coins, searchText]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading coins...</Text>
        </View>
        <BottomNav active="home" />
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

      {/* Popular Coins Section */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCoins}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <CoinList 
          externalData={filteredCoins} 
          title={`Popular Coins (${filteredCoins.length})`}
          onToggleFavorite={handleToggleFavorite}
          isUserLoggedIn={isLoggedIn}
          onRefresh={fetchCoins}
          autoRefresh={true} // Enable auto-refresh for price updates
        />
      )}
      
      {/* Bottom Navigation */}
      <BottomNav active="home" />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;