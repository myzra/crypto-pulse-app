import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NotificationItem from './NotificationItem';

const NotificationsSection = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1, icon: 'logo-ethereum', iconColor: '#fff', iconBg: '#627EEA',
      title: 'Ethereum', subtitle: 'ETH', frequency: 'Every 30 min', isActive: true
    },
    {
      id: 2, icon: 'ellipse', iconColor: '#fff', iconBg: '#9945FF',
      title: 'Solana', subtitle: 'SOL', frequency: 'Every 2 hours', isActive: true
    },
    {
      id: 3, icon: 'triangle', iconColor: '#fff', iconBg: '#E84142',
      title: 'Avalanche', subtitle: 'AVAX', frequency: 'Every 60 min', isActive: true
    },
    {
      id: 4, icon: 'infinite', iconColor: '#fff', iconBg: '#8247E5',
      title: 'Polygon', subtitle: 'MATIC', frequency: 'Every 8 hours', isActive: true
    },
  ]);

  const handleToggleNotification = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isActive: !n.isActive } : n)
    );
  };

  const handleSettings = (id) => {
    console.log('Settings for notification:', id);
  };

  const handleRemove = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notifications</Text>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          {...notification}
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
});

export default NotificationsSection;
