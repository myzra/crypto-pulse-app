// components/CoinList.js
import React, { useMemo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import CoinItem from './CoinItem';

const CoinList = ({ data = [], title = 'Coins', onToggleFavorite, isUserLoggedIn }) => {
  // Memoize the data to prevent unnecessary re-renders
  const memoizedData = useMemo(() => data, [data]);

  // Memoized render function for better performance
  const renderCoinItem = useCallback(({ item }) => (
    <CoinItem
      coin={item}
      onToggleFavorite={onToggleFavorite}
      isUserLoggedIn={isUserLoggedIn} 
    />
  ), [onToggleFavorite, isUserLoggedIn]);

  // Key extractor for FlatList optimization
  const keyExtractor = useCallback((item) => item.id.toString(), []);

  // Get item layout to avoid measurement calculations
  const getItemLayout = useCallback((data, index) => ({
    length: 85, // Approximate height of each CoinItem (adjust based on your design)
    offset: 85 * index,
    index,
  }), []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
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