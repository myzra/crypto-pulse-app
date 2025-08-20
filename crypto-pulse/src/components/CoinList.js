// components/CoinList.js
import React, { useMemo, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import CoinItem from './CoinItem';
import { useCoins } from '../hooks/useCoins';

const CoinList = ({ 
  title = 'Coins', 
  onToggleFavorite, 
  isUserLoggedIn,
  // Optional: pass external data if you want to override the hook
  externalData,
  // Auto-refresh settings
  autoRefresh = true,
  refreshInterval = 5 * 60 * 1000, // 5 minutes
}) => {
  // Use the coins hook for automatic price updates
  const {
    coins: hookCoins,
    loading,
    error,
    lastUpdated,
    refreshCoins,
    updateCoin,
  } = useCoins(autoRefresh, refreshInterval);

  // Use external data if provided, otherwise use hook data
  const data = useMemo(() => {
    return externalData || hookCoins;
  }, [externalData, hookCoins]);

  // Memoize the data to prevent unnecessary re-renders
  const memoizedData = useMemo(() => data, [data]);

  // Handle favorite toggle with local state update
  const handleToggleFavorite = useCallback(async (coin) => {
    try {
      // Optimistically update UI
      updateCoin(coin.id, { isFavorite: !coin.isFavorite });
      
      // Call the provided handler
      if (onToggleFavorite) {
        await onToggleFavorite(coin);
      }
    } catch (error) {
      // Revert optimistic update on error
      updateCoin(coin.id, { isFavorite: coin.isFavorite });
      console.error('Error toggling favorite:', error);
    }
  }, [onToggleFavorite, updateCoin]);

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
    length: 85, // Approximate height of each CoinItem
    offset: 85 * index,
    index,
  }), []);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    refreshCoins();
  }, [refreshCoins]);

  // Log updates for debugging
  useEffect(() => {
    if (lastUpdated) {
      console.log(`CoinList: Prices updated at ${lastUpdated.toLocaleTimeString()}`);
    }
  }, [lastUpdated]);

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading coins</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{title}</Text>
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
        style={styles.flatList}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            colors={['#8663EC']} // Android
            tintColor="#8663EC" // iOS
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'Loading coins...' : 'No coins available'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  flatList: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
});

export default CoinList;