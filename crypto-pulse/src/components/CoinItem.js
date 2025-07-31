import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CoinItem = ({ coin }) => (
  <View style={styles.coinItem}>
    <View style={styles.coinLeft}>
      <View style={[styles.coinIcon, { backgroundColor: coin.color }]}>
        <Text style={styles.coinIconText}>{coin.icon}</Text>
      </View>
      <View style={styles.coinInfo}>
        <Text style={styles.coinName}>{coin.name}</Text>
        <Text style={styles.coinSymbol}>{coin.symbol}</Text>
      </View>
    </View>
    
    <View style={styles.coinRight}>
      <View style={styles.priceContainer}>
        <Text style={styles.coinPrice}>{coin.price}</Text>
        <Text style={[
          styles.coinChange,
          { color: coin.isPositive ? '#4CAF50' : '#F44336' }
        ]}>
          {coin.change}
        </Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.starButton}>
          <Ionicons name="star-outline" size={20} color="#9E9E9E" />
        </TouchableOpacity>
        <TouchableOpacity style={[
          styles.notificationButton,
          coin.isPositive ? styles.addButton : styles.checkButton
        ]}>
          <Ionicons 
            name={coin.isPositive ? "add" : "checkmark"} 
            size={16} 
            color="white" 
          />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  coinItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  coinLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  coinIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  coinIconText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  coinInfo: {
    flex: 1,
  },
  coinName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  coinSymbol: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  coinRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginRight: 15,
  },
  coinPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  coinChange: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    padding: 8,
    marginRight: 8,
  },
  notificationButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#6C5CE7',
  },
  checkButton: {
    backgroundColor: '#4CAF50',
  },
});

export default CoinItem;