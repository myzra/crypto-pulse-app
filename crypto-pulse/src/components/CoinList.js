// components/CoinList.js
import React, { useMemo, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import CoinItem from './CoinItem';
import { useCoins } from '../hooks/useCoins';
import { useTheme } from '../constants/theme';

const CoinList = ({ 
  title = 'Coins', 
  onToggleFavorite, 
  isUserLoggedIn,
  externalData,
  autoRefresh = true,
  refreshInterval = 5 * 60 * 1000, // 5 minutes
  onRefresh: externalRefresh,
}) => {
  const { theme } = useTheme();

  // Use the coins hook for automatic price updates
  const {
    coins: hookCoins,
    loading,
    error,
    lastUpdated,
    refreshCoins,
    updateCoin,
  } = useCoins(autoRefresh, refreshInterval);

  // If external data is provided, merge it with hook data for updated prices
  const data = useMemo(() => {
    if (externalData && hookCoins.length > 0) {
      // Merge external data with hook data to get updated prices
      return externalData.map(externalCoin => {
        const hookCoin = hookCoins.find(h => h.id === externalCoin.id);
        if (hookCoin) {
          // Use external data for favorites status, hook data for prices
          return {
            ...externalCoin,
            price: hookCoin.price,
            change: hookCoin.change,
            isPositive: hookCoin.isPositive,
            rawPrice: hookCoin.rawPrice,
            rawChange: hookCoin.rawChange,
            lastUpdated: hookCoin.lastUpdated,
          };
        }
        return externalCoin;
      });
    }
    return externalData || hookCoins;
  }, [externalData, hookCoins]);

  // Determine loading state - show loading only when no data is available
  const isLoading = useMemo(() => {
    if (data.length > 0) {
      return false;
    }
    return loading;
  }, [data.length, loading]);

  // Memoize the data to prevent unnecessary re-renders
  const memoizedData = useMemo(() => data, [data]);

  // Handle favorite toggle with local state update
  const handleToggleFavorite = useCallback(async (coin) => {
    try {
      // Call the provided handler first
      if (onToggleFavorite) {
        await onToggleFavorite(coin);
      }
      
      // Only update local state if using hook data (not external data)
      if (!externalData) {
        updateCoin(coin.id, { isFavorite: !coin.isFavorite });
      }
    } catch (error) {
      // Revert optimistic update on error (only for hook data)
      if (!externalData) {
        updateCoin(coin.id, { isFavorite: coin.isFavorite });
      }
      console.error('Error toggling favorite:', error);
      throw error; // Re-throw so parent can handle the error
    }
  }, [onToggleFavorite, updateCoin, externalData]);

  // Memoized render function for better performance
  const renderCoinItem = useCallback(({ item }) => (
    <CoinItem
      coin={item}
      onToggleFavorite={handleToggleFavorite}
      isUserLoggedIn={isUserLoggedIn}
    />
  ), [handleToggleFavorite, isUserLoggedIn]);

  // Key extractor for FlatList optimization
  const keyExtractor = useCallback((item) => item.id.toString(), []);

  // Get item layout to avoid measurement calculations
  const getItemLayout = useCallback((data, index) => ({
    length: 85,
    offset: 85 * index,
    index,
  }), []);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    // Always refresh hook data for price updates
    refreshCoins();
    
    // Also call external refresh if provided
    if (externalRefresh) {
      externalRefresh();
    }
  }, [refreshCoins, externalRefresh]);

  // Log updates for debugging
  useEffect(() => {
    if (lastUpdated) {
      console.log(`CoinList: Prices updated at ${lastUpdated.toLocaleTimeString()}`);
    }
  }, [lastUpdated]);

  const themedStyles = StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingTop: 20,
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 15,
    },
    flatList: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: 20,
    },
  });

  // Show error state
  if (error && !externalData) {
    return (
      <View style={themedStyles.container}>
        <Text style={themedStyles.title}>{title}</Text>
        <View style={themedStyles.errorContainer}>
          <Text style={themedStyles.errorText}>Error loading coins</Text>
          <Text style={themedStyles.errorSubtext}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={themedStyles.container}>
      <View style={themedStyles.headerContainer}>
        <Text style={themedStyles.title}>{title}</Text>
      </View>
      
      <FlatList
        data={memoizedData}
        renderItem={renderCoinItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={15}
        windowSize={10}
        legacyImplementation={false}
        style={themedStyles.flatList}
        contentContainerStyle={themedStyles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            colors={[theme.accent]} // Android
            tintColor={theme.accent} // iOS
          />
        }
        ListEmptyComponent={
          <View style={themedStyles.emptyContainer}>
            <Text style={themedStyles.emptyText}>
              {isLoading ? 'Loading coins...' : 'No coins available'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default CoinList;