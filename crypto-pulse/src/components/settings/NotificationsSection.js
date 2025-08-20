import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import NotificationItem from './NotificationItem';
import { notificationsService, coinsService } from '../../services/api';
import { getCoinImage } from '../../constants/cryptoData';
import { useUser } from '../../context/UserContext';

const NotificationsSection = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isLoggedIn } = useUser();

  // Helper function to get default colors if not set in database
  const getDefaultColor = (index) => {
    const colors = ['#627EEA', '#9945FF', '#E84142', '#8247E5', '#F7931A'];
    return colors[index % colors.length];
  };

  // Helper function to format frequency display
  const formatFrequency = (frequencyType, intervalHours, preferredTime, preferredDay) => {
    switch (frequencyType) {
      case 'hourly':
        return `Every ${intervalHours} hour${intervalHours !== 1 ? 's' : ''}`;
      case 'daily':
        if (preferredTime) {
          const time = new Date(`2000-01-01T${preferredTime}`);
          const timeString = time.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
          return `Daily at ${timeString}`;
        }
        return 'Daily';
      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[preferredDay] || 'Unknown';
        if (preferredTime) {
          const time = new Date(`2000-01-01T${preferredTime}`);
          const timeString = time.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
          return `${dayName} at ${timeString}`;
        }
        return `Weekly on ${dayName}`;
      case 'custom':
        return `Every ${intervalHours} hour${intervalHours !== 1 ? 's' : ''}`;
      default:
        return 'Unknown frequency';
    }
  };

  // Fetch user's notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const [notificationsResponse, coinsResponse] = await Promise.all([
        notificationsService.getUserNotifications(user.id),
        coinsService.getAllCoins()
      ]);
      
      // Create a map of coin data for quick lookup
      const coinsMap = coinsResponse.reduce((map, coin) => {
        map[coin.id] = coin;
        return map;
      }, {});
      
      // Transform the data to match component format
      const transformedNotifications = notificationsResponse
        .filter(notification => coinsMap[notification.coin_id]) // Filter out notifications without coin data
        .map((notification, index) => {
          const coin = coinsMap[notification.coin_id];
          return {
            id: notification.id,
            coinId: coin.id,
            coinName: coin.name,
            coinSymbol: coin.symbol,
            coinColor: coin.color || getDefaultColor(index),
            imageSource: getCoinImage(coin.symbol),
            frequency: formatFrequency(
              notification.frequency_type,
              notification.interval_hours,
              notification.preferred_time,
              notification.preferred_day
            ),
            isActive: notification.is_active,
            frequencyType: notification.frequency_type,
            intervalHours: notification.interval_hours,
            preferredTime: notification.preferred_time,
            preferredDay: notification.preferred_day,
            lastSentAt: notification.last_sent_at,
            nextScheduledAt: notification.next_scheduled_at,
            createdAt: notification.created_at,
            updatedAt: notification.updated_at,
          };
        });
      
      setNotifications(transformedNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Refresh notifications when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn && user?.id) {
        fetchNotifications();
      } else {
        setNotifications([]);
        setLoading(false);
      }
    }, [isLoggedIn, user?.id, fetchNotifications])
  );

  // Handle toggle notification active status
  const handleToggleNotification = useCallback(async (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    try {
      // Optimistically update UI
      setNotifications(prev =>
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, isActive: !n.isActive }
            : n
        )
      );

      // Make API call
      await notificationsService.updateNotification(notificationId, {
        is_active: !notification.isActive
      });

    } catch (error) {
      console.error('Error toggling notification:', error);
      
      // Revert optimistic update on error
      setNotifications(prev =>
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, isActive: notification.isActive } // Revert to original state
            : n
        )
      );
      
      Alert.alert('Error', 'Failed to update notification status');
    }
  }, [notifications]);

  // Handle settings button press (placeholder for now)
  const handleSettings = useCallback((notificationId) => {
    console.log('Settings for notification:', notificationId);
    // TODO: Implement settings functionality
    Alert.alert('Settings', 'Settings functionality will be implemented soon');
  }, []);

  // Handle remove notification (placeholder for now)
  const handleRemove = useCallback((notificationId) => {
    console.log('Remove notification:', notificationId);
    // TODO: Implement remove functionality
    Alert.alert('Remove', 'Remove functionality will be implemented soon');
  }, []);

  // Show loading state
  if (loading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#8663EC" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  // Show login prompt if user is not logged in
  if (!isLoggedIn) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Please login to view your notification settings
          </Text>
        </View>
      </View>
    );
  }

  // Show empty state
  if (notifications.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No notifications set up yet. Set up notifications for your favorite coins from the home screen.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notifications ({notifications.length})</Text>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          id={notification.id}
          coinId={notification.coinId}
          title={notification.coinName}
          subtitle={notification.coinSymbol}
          color={notification.coinColor}
          imageSource={notification.imageSource}
          frequency={notification.frequency}
          isActive={notification.isActive}
          onToggle={() => handleToggleNotification(notification.id)}
          onSettings={() => handleSettings(notification.id)}
          onRemove={() => handleRemove(notification.id)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationsSection;