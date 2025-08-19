import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'react-native';
import NotificationModal from './NotificationModal'; // Import the modal

const CoinItem = ({ coin, onToggleFavorite, isUserLoggedIn }) => {
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);

  // Handle favorite button press
  const handleFavoritePress = async () => {
    if (!isUserLoggedIn) {
      Alert.alert('Login Required', 'Please login to manage favorites');
      return;
    }

    if (!onToggleFavorite) {
      console.warn('onToggleFavorite function not provided');
      return;
    }

    try {
      await onToggleFavorite(coin);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites. Please try again.');
    }
  };

  // Handle notification button press
  const handleNotificationPress = () => {
    if (!isUserLoggedIn) {
      Alert.alert('Login Required', 'Please login to set notifications');
      return;
    }
    setIsNotificationModalVisible(true);
  };

  // Handle notification confirmation
  const handleNotificationConfirm = async (notificationData) => {
    try {
      console.log('Notification data:', notificationData);
      // Here you'll later add your API call to save notification settings
      // await saveNotificationSettings(notificationData);
      
      Alert.alert('Success', 'Notification settings saved successfully');
    } catch (error) {
      console.error('Error saving notification:', error);
      Alert.alert('Error', 'Failed to save notification settings. Please try again.');
    }
  };

  return (
    <>
      <View style={styles.coinItem}>
        <View style={styles.coinLeft}>
          <View style={[styles.coinIcon, { backgroundColor: coin.color }]}>
            {coin.imageSource ? (
              <Image
                source={coin.imageSource}
                style={styles.coinImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.coinIconText}>{coin.icon || coin.symbol?.charAt(0) || '?'}</Text>
            )}
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
            <TouchableOpacity 
              style={styles.starButton}
              onPress={handleFavoritePress}
            >
              <Image
                source={require('../../assets/buttons/FavStar.png')}
                style={{
                  width: 24,
                  height: 24,
                  tintColor: coin.isFavorite ? '#8663EC' : '#CCCCCC'
                }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.notificationButton,
                coin.isPositive ? styles.addButton : styles.checkButton
              ]}
              onPress={handleNotificationPress} // Add this line
            >
              <Image
                source={coin.isPositive
                  ? require('../../assets/buttons/NotChecked.png')
                  : require('../../assets/buttons/Checkmark.png')}
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Notification Modal */}
      <NotificationModal
        visible={isNotificationModalVisible}
        coin={coin}
        onClose={() => setIsNotificationModalVisible(false)}
        onConfirm={handleNotificationConfirm}
      />
    </>
  );
};

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
  coinImage: {
    width: 28,
    height: 28,
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