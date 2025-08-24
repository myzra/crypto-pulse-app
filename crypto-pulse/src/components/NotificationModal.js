import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  TextInput,
  ScrollView,
  Alert
} from 'react-native';
import { useUser } from '../context/UserContext';
import { notificationsService } from '@/services/api';
import { useTheme } from '../constants/theme';


const NotificationModal = ({ visible, coin, onClose, onConfirm }) => {
  const { user } = useUser();
  const [selectedFrequency, setSelectedFrequency] = useState('Hourly');
  const [preferredTime, setPreferredTime] = useState('09:00');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [customHours, setCustomHours] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  
  const frequencies = [
    { id: 'hourly', label: 'Hourly', icon: '🕐' },
    { id: 'daily', label: 'Daily', icon: '📅' },
    { id: 'weekly', label: 'Weekly', icon: '📅' },
    { id: 'custom', label: 'Custom', icon: '⚙️' }
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', 
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00'
  ];

  const formatTime = (timeString) => {
    if (timeString && timeString.includes(':')) {
      const parts = timeString.split(':');
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  };

  const handleFrequencySelect = (frequency) => {
    setSelectedFrequency(frequency);
    // Reset values when switching frequency
    if (frequency === 'Custom') {
      setCustomHours('');
    }
  };

  const handleTimeSelect = (time) => {
    setPreferredTime(time);
  };

  const handleDaySelect = (day) => {
    setSelectedDay(day);
  };

  
const handleConfirm = async () => {
  // Prevent multiple submissions
  if (isLoading) {
    return;
  }

  // Validation
  if (!user) {
    Alert.alert('Error', 'User not found. Please login again.');
    return;
  }

  if (selectedFrequency === 'Custom' && (!customHours || parseInt(customHours) <= 0)) {
    Alert.alert('Invalid Input', 'Please enter valid hours for custom frequency');
    return;
  }

  if (selectedFrequency === 'Custom' && parseInt(customHours) > 168) { // 168 hours = 1 week
    Alert.alert('Invalid Input', 'Custom hours cannot exceed 168 (1 week)');
    return;
  }

  setIsLoading(true);

  const notificationData = {
    user_id: user.id,
    coin_id: coin.id,
    frequency_type: selectedFrequency.toLowerCase(),
    interval_hours: selectedFrequency === 'Custom' ? parseInt(customHours) : null,
    preferred_time: selectedFrequency === 'Daily' || selectedFrequency === 'Weekly' ? formatTime(preferredTime) : null,
    preferred_day: selectedFrequency === 'Weekly' ? selectedDay : null
  };

  try {
    // Check if notification already exists first
    const existingNotification = await notificationsService.checkNotification(user.id, coin.id);
    
    if (existingNotification.hasNotification) {
      Alert.alert(
        'Notification Exists', 
        'You already have an active notification for this coin. Would you like to update it instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Update', 
            onPress: async () => {
              try {
                const result = await notificationsService.updateNotificationByUserCoin(
                  user.id, 
                  coin.id, 
                  {
                    frequency_type: notificationData.frequency_type,
                    interval_hours: notificationData.interval_hours,
                    preferred_time: notificationData.preferred_time,
                    preferred_day: notificationData.preferred_day
                  }
                );
                
                if (onConfirm) {
                  await onConfirm(result);
                }
                
                handleCancel();
              } catch (updateError) {
                console.error("Error updating notification:", updateError);
                Alert.alert('Error', 'Failed to update notification. Please try again.');
              }
            }
          }
        ]
      );
      return;
    }

    // Create new notification
    const result = await notificationsService.createNotification(notificationData);
    
    // Call the onConfirm callback with the result
    if (onConfirm) {
      await onConfirm(result);
    }

    // Show success message
    Alert.alert('Success', 'Notification created successfully!');
    
    // Reset form and close modal
    handleCancel();
    
  } catch (error) {
    console.error("Error creating notification:", error);
    
    // More specific error handling
    if (error.message.includes('already exists')) {
      Alert.alert(
        'Notification Exists', 
        'You already have an active notification for this coin.',
        [
          { text: 'OK', onPress: handleCancel }
        ]
      );
    } else {
      Alert.alert('Error', error.message || 'Failed to create notification. Please try again.');
    }
  } finally {
    setIsLoading(false);
  }
};

  const handleCancel = () => {
    setSelectedFrequency('Hourly');
    setPreferredTime('09:00');
    setSelectedDay('Monday');
    setCustomHours('');
    onClose();
  };

  const renderTimeSection = () => {
    if (selectedFrequency === 'Hourly') {
      return null;
    }

    if (selectedFrequency === 'Custom') {
      return (
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Every X Hours</Text>
          <View style={[styles.timeCard, { backgroundColor: theme.inputBackground }]}>
            <TextInput
              style={[styles.customInput, { color: theme.text }]}
              value={customHours}
              onChangeText={setCustomHours}
              placeholder="Enter hours (e.g., 4, 12, 72)"
              placeholderTextColor={theme.inputPlaceholder}
              keyboardType="numeric"
              textAlign="center"
              editable={!isLoading}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferred Time</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScrollContainer}>
          <View style={styles.timeGrid}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBackground },
                  preferredTime === time && { borderColor: theme.accent, backgroundColor: theme.background }
                ]}
                onPress={() => handleTimeSelect(time)}
                disabled={isLoading}
              >
                <Text style={[
                  styles.timeSlotText,
                  { color: theme.text },
                  preferredTime === time && { color: theme.accent, fontWeight: '700' }
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderDaySection = () => {
    if (selectedFrequency !== 'Weekly') {
      return null;
    }

    return (
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferred Day</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScrollContainer}>
          <View style={styles.dayGrid}>
            {days.map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.daySlot,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBackground },
                  selectedDay === day && { borderColor: theme.accent, backgroundColor: theme.background }
                ]}
                onPress={() => handleDaySelect(day)}
                disabled={isLoading}
              >
                <Text style={[
                  styles.daySlotText,
                  { color: theme.text },
                  selectedDay === day && { color: theme.accent, fontWeight: '700' }
                ]}>
                  {day.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  if (!coin) return null;

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      paddingHorizontal: 20,
    },
    modalContainer: {
      width: '100%',
      maxWidth: 400,
      height: 650,
      backgroundColor: theme.background,
      borderRadius: 16,
      padding: 20,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    headerTitle: {
      fontSize: 26,
      fontWeight: '700',
      marginBottom: 20,
      textAlign: 'center',
      color: theme.text,
    },
    coinCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: theme.surfaceElevated,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    coinLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    coinIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    coinImage: { width: 24, height: 24 },
    coinIconText: { 
      fontWeight: 'bold', 
      fontSize: 16,
      color: theme.text,
    },
    coinName: { 
      fontSize: 16, 
      fontWeight: '600',
      color: theme.text,
    },
    coinSymbol: { 
      fontSize: 14, 
      color: theme.textSecondary,
    },
    coinRight: { alignItems: 'flex-end' },
    coinPrice: { 
      fontSize: 16, 
      fontWeight: '700',
      color: theme.text,
    },
    coinChange: { fontSize: 14, fontWeight: '600' },

    contentContainer: {
      flex: 1,
      marginBottom: 10,
    },
    sectionContainer: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    
    dynamicContentContainer: {
      minHeight: 160,
      justifyContent: 'flex-start',
      marginBottom: 10,
    },

    frequencyGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    frequencyButton: {
      width: '48%',
      backgroundColor: theme.inputBackground,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.inputBackground,
    },
    frequencyButtonSelected: {
      borderColor: theme.accent,
      backgroundColor: theme.background,
    },
    frequencyLabel: {
      fontSize: 15,
      color: theme.text,
    },
    frequencyLabelSelected: {
      color: theme.accent,
      fontWeight: '700',
    },
    timeCard: {
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginBottom: 15,
    },
    
    timeScrollContainer: {
      maxHeight: 60,
      marginBottom: 15,
    },
    timeGrid: {
      flexDirection: 'row',
      paddingHorizontal: 5,
    },
    timeSlot: {
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginRight: 8,
      borderWidth: 1,
    },
    timeSlotText: {
      fontSize: 14,
      fontWeight: '600',
    },

    dayScrollContainer: {
      maxHeight: 60,
      marginBottom: 15,
    },
    dayGrid: {
      flexDirection: 'row',
      paddingHorizontal: 5,
    },
    daySlot: {
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginRight: 8,
      borderWidth: 1,
    },
    daySlotText: {
      fontSize: 14,
      fontWeight: '600',
    },

    customInput: {
      fontSize: 18,
      fontWeight: '600',
      minWidth: 150,
      textAlign: 'center',
    },

    buttonContainer: {
      paddingTop: 10,
    },
    confirmButton: {
      backgroundColor: theme.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 8,
    },
    confirmButtonText: { 
      color: '#fff', 
      fontSize: 16, 
      fontWeight: '700' 
    },
    cancelButton: {
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.borderLight,
      backgroundColor: theme.background,
    },
    cancelButtonText: { 
      fontSize: 16, 
      color: theme.textSecondary, 
      fontWeight: '600' 
    },
    disabledButton: {
      opacity: 0.6,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <Text style={styles.headerTitle}>Set Notification</Text>

          {/* Coin Card */}
          <View style={styles.coinCard}>
            <View style={styles.coinLeft}>
              <View style={styles.coinIcon}>
                {coin.imageSource ? (
                  <Image
                    source={coin.imageSource}
                    style={styles.coinImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.coinIconText}>
                    {coin.icon || coin.symbol?.charAt(0) || '?'}
                  </Text>
                )}
              </View>
              <View>
                <Text style={styles.coinName}>{coin.name}</Text>
                <Text style={styles.coinSymbol}>{coin.symbol}</Text>
              </View>
            </View>
            <View style={styles.coinRight}>
              <Text style={styles.coinPrice}>{coin.price}</Text>
              <Text style={[
                styles.coinChange,
                { color: coin.isPositive ? theme.success : theme.error }
              ]}>
                {coin.change}
              </Text>
            </View>
          </View>

          {/* Content Container with Fixed Height */}
          <View style={styles.contentContainer}>
            {/* Frequency */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Notification Frequency</Text>
              <View style={styles.frequencyGrid}>
                {frequencies.map((freq) => {
                  const isSelected = selectedFrequency.toLowerCase() === freq.id;
                  return (
                    <TouchableOpacity
                      key={freq.id}
                      style={[
                        styles.frequencyButton,
                        isSelected && styles.frequencyButtonSelected
                      ]}
                      onPress={() => handleFrequencySelect(freq.label)}
                      disabled={isLoading}
                    >
                      <Text style={[
                        styles.frequencyLabel,
                        isSelected && styles.frequencyLabelSelected
                      ]}>
                        {freq.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Dynamic Content with Fixed Height Container */}
            <View style={styles.dynamicContentContainer}>
              {renderTimeSection()}
              {renderDaySection()}
            </View>
          </View>
          
          {/* Fixed Buttons at Bottom */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.confirmButton, isLoading && styles.disabledButton]} 
              onPress={handleConfirm}
              disabled={isLoading}
            >
              <Text style={styles.confirmButtonText}>
                {isLoading ? 'Creating...' : 'Confirm'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.cancelButton, isLoading && styles.disabledButton]} 
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default NotificationModal;