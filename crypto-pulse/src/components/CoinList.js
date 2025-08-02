// components/CoinList.js
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import CoinItem from './CoinItem';

const CoinList = ({ data = [], title = 'Coins' }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {data.map((coin) => (
          <CoinItem key={coin.id} coin={coin} />
        ))}
      </ScrollView>
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
  scroll: {
    flex: 1,
  },
});

export default CoinList;
