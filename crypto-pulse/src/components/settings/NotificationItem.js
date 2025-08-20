import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

const NotificationItem = ({
  id,
  coinId,
  title,
  subtitle,
  color,
  imageSource,
  frequency,
  isActive,
  onToggle,
  onSettings,
  onRemove
}) => {
  return (
    <View style={styles.notificationItem}>
      <TouchableOpacity onPress={onToggle} style={styles.notificationLeft}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          {imageSource ? (
            <Image
              source={imageSource}
              style={styles.coinImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.coinIconText}>
              {subtitle?.charAt(0) || '?'}
            </Text>
          )}
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.cryptoName}>{title}</Text>
          <Text style={styles.cryptoSymbol}>{subtitle}</Text>
        </View>
      </TouchableOpacity>
           
      <View style={styles.notificationRight}>
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: isActive ? '#8663EC' : '#8E8E93' }]}>
            {isActive ? 'Active' : 'Inactive'}
          </Text>
          <Text style={styles.frequencyText}>{frequency}</Text>
        </View>
                
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={onSettings}>
            <Image
              source={require('../../../assets/buttons/Settings.png')}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onRemove}>
            <Image
              source={require('../../../assets/buttons/Delete.png')}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  notificationItem: {
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  notificationLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
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
  notificationContent: {
    flex: 1,
  },
  cryptoName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  cryptoSymbol: {
    fontSize: 14,
    color: '#8E8E93',
  },
  notificationRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusContainer: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  frequencyText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
});

export default NotificationItem;