import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'react-native';


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
          { color: coin.isPositive ? '#10B981' : '#EF4444' }
        ]}>
          {coin.change}
        </Text>
      </View>
      
      <View style={styles.actionButtons}>
      <TouchableOpacity style={styles.starButton}>
        <Image
          source={require('../../assets/buttons/FavStar.png')} // ToDo: add purple filled out star png
          style={{ width: 24, height: 24, tintColor: '#8663EC' }}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <TouchableOpacity style={[
        styles.notificationButton,
        coin.isPositive ? styles.addButton : styles.checkButton
      ]}>
        <Image
          source={coin.isPositive
            ? require('../../assets/buttons/NotChecked.png') // ToDo: add different button png
            : require('../../assets/buttons/Checkmark.png')}
          style={{ width: 20, height: 20, }}
          resizeMode="contain"
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
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    color: '#1F2937',
    marginBottom: 2,
  },
  coinSymbol: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#1F2937',
    marginBottom: 2,
  },
  coinChange: {
    fontSize: 13,
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
    backgroundColor: 'rgba(99, 102, 241, 0.1)', // #6366F1 with 10% opacity
  },
  checkButton: {
    backgroundColor: '#8663EC',
  },
});

export default CoinItem;