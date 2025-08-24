import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'react-native';
import NotificationModal from './NotificationModal';
import { useUser } from '../context/UserContext';
import { notificationsService } from '../services/api';
import { useTheme } from '../constants/theme';

const CoinItem = ({ coin, onToggleFavorite }) => {
  const { user, isLoggedIn } = useUser(); // Get user from context
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  // Check for existing notification when component mounts or user changes
  useEffect(() => {
    if (isLoggedIn && coin?.id) {
      checkExistingNotification();
    } else {
      setHasNotification(false);
    }
  }, [isLoggedIn, coin?.id, user?.id]);

  // Function to check if user has existing notification for this coin
  const checkExistingNotification = async () => {
    if (!user?.id || !coin?.id) return;

    try {
      setLoading(true);
      const data = await notificationsService.checkNotification(user.id, coin.id);
      setHasNotification(data.hasNotification);
    } catch (error) {
      console.error('Error checking notification:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle favorite button press
  const handleFavoritePress = async () => {
    if (!isLoggedIn) {
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
    if (!isLoggedIn) {
      Alert.alert('Login Required', 'Please login to set notifications');
      return;
    }

    if (hasNotification) {
      // Show options to modify or delete existing notification
      Alert.alert(
        'Notification Settings',
        'You already have notifications set for this coin.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Modify', onPress: () => setIsNotificationModalVisible(true) },
          { text: 'Remove', onPress: handleRemoveNotification, style: 'destructive' },
        ]
      );
    } else {
      setIsNotificationModalVisible(true);
    }
  };

  // Handle removing notification
  const handleRemoveNotification = async () => {
    try {
      setLoading(true);
      await notificationsService.deleteNotificationByUserCoin(user.id, coin.id);
      setHasNotification(false);
      Alert.alert('Success', 'Notification removed successfully');
    } catch (error) {
      console.error('Error removing notification:', error);
      Alert.alert('Error', 'Failed to remove notification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle notification confirmation
  const handleNotificationConfirm = async (result, action) => {
    try {
      setLoading(true);
      console.log('Notification confirmed:', result, action);
      
      // The API call has already been made in the modal!
      // We just need to update the UI state here
      
      if (action === 'created') {
        console.log('New notification created with ID:', result.id);
        setHasNotification(true);
        // Optional: You can store the notification data for display
        // setNotificationData(result);
        
        // No need to show alert here since the modal already shows success
        // Alert.alert('Success', 'Notification settings saved successfully');
        
      } else if (action === 'updated') {
        console.log('Notification updated with ID:', result.id);
        setHasNotification(true);
        // Optional: Update stored notification data
        // setNotificationData(result);
        
        // No need to show alert here since the modal already shows success
        // Alert.alert('Success', 'Notification settings updated successfully');
        
      } else {
        // Fallback for old behavior - this shouldn't happen with the new modal
        console.warn('Unknown action type:', action);
        setHasNotification(true);
      }
      
      // Optional: Refresh any notification lists or UI elements
      // await refreshNotificationsList();
      
    } catch (error) {
      // This should rarely happen now since API calls are in the modal
      console.error('Error in handleNotificationConfirm:', error);
      Alert.alert('Error', 'Failed to update notification status. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const themedStyles = StyleSheet.create({
    coinItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.card,
      padding: 15,
      borderRadius: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
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
      color: theme.text,
      marginBottom: 2,
    },
    coinSymbol: {
      fontSize: 14,
      color: theme.textSecondary,
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
      color: theme.text,
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
      backgroundColor: theme.btnBackgroundColor, // #6366F1 with 10% opacity
    },
    checkButton: {
      backgroundColor: theme.accent,
    },
  });
  
  return (
    <>
      <View style={themedStyles.coinItem}>
        <View style={themedStyles.coinLeft}>
          <View style={[themedStyles.coinIcon, { backgroundColor: coin.color }]}>
            {coin.imageSource ? (
              <Image
                source={coin.imageSource}
                style={themedStyles.coinImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={themedStyles.coinIconText}>{coin.icon || coin.symbol?.charAt(0) || '?'}</Text>
            )}
          </View>
          <View style={themedStyles.coinInfo}>
            <Text style={themedStyles.coinName}>{coin.name}</Text>
            <Text style={themedStyles.coinSymbol}>{coin.symbol}</Text>
          </View>
        </View>
                
        <View style={themedStyles.coinRight}>
          <View style={themedStyles.priceContainer}>
            <Text style={themedStyles.coinPrice}>{coin.price}</Text>
            <Text style={[
              themedStyles.coinChange,
              { color: coin.isPositive ? theme.success : theme.error }
            ]}>
              {coin.change}
            </Text>
          </View>
                    
          <View style={themedStyles.actionButtons}>
            <TouchableOpacity 
              style={themedStyles.starButton}
              onPress={handleFavoritePress}
            >
              <Image
                source={require('../../assets/buttons/FavStar.png')}
                style={{
                  width: 24,
                  height: 24,
                  tintColor: coin.isFavorite ? theme.accent : theme.btnFavDisabled
                }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                themedStyles.notificationButton,
                hasNotification ? themedStyles.checkButton : themedStyles.addButton
              ]}
              onPress={handleNotificationPress}
              disabled={loading}
            >
              <Image
                source={hasNotification
                  ? require('../../assets/buttons/Checkmark.png')
                  : require('../../assets/buttons/NotChecked.png')}
                style={{ 
                  width: 20, 
                  height: 20,
                  opacity: loading ? 0.5 : 1
                }}
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
        existingNotification={hasNotification}
      />
    </>
  );
};

export default CoinItem;