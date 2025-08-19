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

const NotificationModal = ({ visible, coin, onClose, onConfirm }) => {
  const { user } = useUser();
  const [selectedFrequency, setSelectedFrequency] = useState('Hourly');
  const [preferredTime, setPreferredTime] = useState('09:00');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [customHours, setCustomHours] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      preferred_time: selectedFrequency === 'Daily' || selectedFrequency === 'Weekly' ? preferredTime : null,
      preferred_day: selectedFrequency === 'Weekly' ? selectedDay : null
    };

    try {
      // Use the notifications service instead of direct fetch
      const result = await notificationsService.createNotification(notificationData);
      
      // Call the onConfirm callback with the result
      if (onConfirm) {
        await onConfirm(result);
      }
  
      // Reset form and close modal
      handleCancel();
      
    } catch (error) {
      console.error("Error creating notification:", error);
      Alert.alert('Error', error.message || 'Failed to create notification. Please try again.');
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
          <Text style={styles.sectionTitle}>Every X Hours</Text>
          <View style={styles.timeCard}>
            <TextInput
              style={styles.customInput}
              value={customHours}
              onChangeText={setCustomHours}
              placeholder="Enter hours (e.g., 4, 12, 72)"
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
        <Text style={styles.sectionTitle}>Preferred Time</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScrollContainer}>
          <View style={styles.timeGrid}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  preferredTime === time && styles.timeSlotSelected
                ]}
                onPress={() => handleTimeSelect(time)}
                disabled={isLoading}
              >
                <Text style={[
                  styles.timeSlotText,
                  preferredTime === time && styles.timeSlotTextSelected
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
        <Text style={styles.sectionTitle}>Preferred Day</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScrollContainer}>
          <View style={styles.dayGrid}>
            {days.map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.daySlot,
                  selectedDay === day && styles.daySlotSelected
                ]}
                onPress={() => handleDaySelect(day)}
                disabled={isLoading}
              >
                <Text style={[
                  styles.daySlotText,
                  selectedDay === day && styles.daySlotTextSelected
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
                { color: coin.isPositive ? '#10B981' : '#EF4444' }
              ]}>
                {coin.change}
              </Text>
            </View>
          </View>

          {/* Content Container with Fixed Height */}
          <View style={styles.contentContainer}>
            {/* Frequency */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Notification Frequency</Text>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Dark semi-transparent background
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400, // Fixed maximum width
    height: 650, // Increased height for better content spacing
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 10, // Android shadow
    shadowColor: '#000', // iOS shadow
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
  },
  coinCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  coinImage: { width: 24, height: 24 },
  coinIconText: { fontWeight: 'bold', fontSize: 16 },
  coinName: { fontSize: 16, fontWeight: '600' },
  coinSymbol: { fontSize: 14, color: '#6B7280' },
  coinRight: { alignItems: 'flex-end' },
  coinPrice: { fontSize: 16, fontWeight: '700' },
  coinChange: { fontSize: 14, fontWeight: '600' },

  contentContainer: {
    flex: 1, // Takes up remaining space
    marginBottom: 10, // Reduced margin
  },
  sectionContainer: {
    marginBottom: 20, // Increased margin between sections
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  
  // Fixed container for dynamic content to prevent size changes
  dynamicContentContainer: {
    minHeight: 160, // Increased minimum height for better spacing
    justifyContent: 'flex-start',
    marginBottom: 10, // Add bottom margin
  },

  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  frequencyButton: {
    width: '48%',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  frequencyButtonSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#fff',
  },
  frequencyLabel: {
    fontSize: 15,
    color: '#111827',
  },
  frequencyLabelSelected: {
    color: '#8B5CF6',
    fontWeight: '700',
  },
  timeCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 15, // Add bottom margin for spacing
  },
  
  // Time selection styles
  timeScrollContainer: {
    maxHeight: 60, // Increased height for better visibility
    marginBottom: 15, // Add bottom margin
  },
  timeGrid: {
    flexDirection: 'row',
    paddingHorizontal: 5,
  },
  timeSlot: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  timeSlotSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#fff',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  timeSlotTextSelected: {
    color: '#8B5CF6',
    fontWeight: '700',
  },

  // Day selection styles
  dayScrollContainer: {
    maxHeight: 60, // Increased height for better visibility
    marginBottom: 15, // Add bottom margin
  },
  dayGrid: {
    flexDirection: 'row',
    paddingHorizontal: 5,
  },
  daySlot: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  daySlotSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#fff',
  },
  daySlotText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  daySlotTextSelected: {
    color: '#8B5CF6',
    fontWeight: '700',
  },

  // Custom input style
  customInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    minWidth: 150,
    textAlign: 'center',
  },

  // Button container
  buttonContainer: {
    paddingTop: 10,
  },
  confirmButton: {
    backgroundColor: '#8B5CF6',
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
    borderColor: '#D1D5DB',
  },
  cancelButtonText: { 
    fontSize: 16, 
    color: '#6B7280', 
    fontWeight: '600' 
  }
});

export default NotificationModal;