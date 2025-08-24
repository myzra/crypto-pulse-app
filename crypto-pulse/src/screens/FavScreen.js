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
import { favoritesService } from '../services/api';
import { getCoinImage } from '../constants/cryptoData';
import { useUser } from '../context/UserContext';
import { useTheme } from '../constants/theme';

const FavScreen = () => {
  const [searchText, setSearchText] = useState('');
  const [favoriteCoins, setFavoriteCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isLoggedIn} = useUser();
  const { theme, isDarkMode } = useTheme();

  // Helper function to get default colors
  const getDefaultColor = (index) => {
    return theme.coinColors[index % theme.coinColors.lenght];
  };

  // Fetch user's favorite coins
  const fetchFavorites = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
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
      // Optimistically remove from UI first
      setFavoriteCoins(prevCoins => 
        prevCoins.filter(c => c.id !== coin.id)
      );

      // Always remove since this is the favorites screen
      await favoritesService.removeFavorite(user.id, coin.id);
        
      // Show success message
      Alert.alert('Success', `${coin.name} removed from favorites`);
    } catch (error) {
      console.error('Error removing favorite:', error);
      
      // Revert optimistic update on error
      setFavoriteCoins(prevCoins => {
        // Check if coin is already back in the list
        if (!prevCoins.find(c => c.id === coin.id)) {
          return [...prevCoins, coin].sort((a, b) => a.name.localeCompare(b.name));
        }
        return prevCoins;
      });
      
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
  
  // Create themed styles
  const themedStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      backgroundColor: theme.background,
    },
    loginPromptTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 10,
    },
    loginPromptText: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: theme.textSecondary,
    },
    errorText: {
      fontSize: 16,
      color: theme.error,
      textAlign: 'center',
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryButtonText: {
      color: theme.background,
      fontSize: 16,
      fontWeight: '600',
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 10,
    },
    emptyText: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
  });

  // Show login prompt if user is not logged in
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={themedStyles.container}>
        <StatusBar barStyle={theme.statusBarStyle} />
        <Header />
        <View style={themedStyles.centerContainer}>
          <Text style={themedStyles.loginPromptTitle}>Login Required</Text>
          <Text style={themedStyles.loginPromptText}>
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
      <SafeAreaView style={themedStyles.container}>
        <StatusBar barStyle={theme.statusBarStyle} />
        <Header />
        <View style={themedStyles.centerContainer}>
          <ActivityIndicator size="large" color={theme.ActivityIndicator} />
          <Text style={themedStyles.loadingText}>Loading favorites...</Text>
        </View>
        <BottomNav active="star" />
      </SafeAreaView>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <SafeAreaView style={themedStyles.container}>
        <StatusBar barStyle={theme.statusBarStyle} />
        <Header />
        <View style={themedStyles.centerContainer}>
          <Text style={themedStyles.errorText}>{error}</Text>
          <TouchableOpacity style={themedStyles.retryButton} onPress={fetchFavorites}>
            <Text style={themedStyles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
        <BottomNav active="star" />
      </SafeAreaView>
    );
  }
  
  // Show empty favorites state
  if (favoriteCoins.length === 0) {
    return (
      <SafeAreaView style={themedStyles.container}>
        <StatusBar barStyle={theme.statusBarStyle} />
        <Header />
        <SearchBar
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search favorite cryptocurrencies..."
        />
        <View style={themedStyles.centerContainer}>
          <Text style={themedStyles.emptyTitle}>No Favorites Yet</Text>
          <Text style={themedStyles.emptyText}>
            Start adding cryptocurrencies to your favorites by tapping the star icon on the home screen
          </Text>
        </View>
        <BottomNav active="star" />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={themedStyles.container}>
      <StatusBar barStyle={theme.statusBarStyle} />
      
      {/* Header with gradient background */}
      <Header />

      {/* Search Bar */}
      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search favorite cryptocurrencies..."
        />

      {/* Favorite Coins List */}
      <CoinList 
        externalData={filteredFavorites} 
        title={`Favorite Coins (${filteredFavorites.length})`}
        onToggleFavorite={handleToggleFavorite}
        isUserLoggedIn={isLoggedIn}
        onRefresh={fetchFavorites}
        autoRefresh={true} // Enable auto-refresh for price updates
      />
      
      {/* Bottom Navigation */}
      <BottomNav active="star" />
    </SafeAreaView>
  );
};

export default FavScreen;