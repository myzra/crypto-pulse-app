import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import SearchBar from '../components/SearchBar';
import { logsService } from '../services/api';
import { getCoinImage } from '../constants/cryptoData';
import { useUser } from '../context/UserContext';

const LogItem = ({ log }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const { date, time } = formatDate(log.notified_at);
  const changePercent = parseFloat(log.change_percent);
  const isPositive = changePercent >= 0;

  return (
    <View style={styles.logItem}>
      <View style={styles.logLeft}>
        <View style={[styles.coinIcon, { backgroundColor: log.coin?.color || '#DBEAFE' }]}>
          {log.coin?.symbol ? (
            <Image
              source={getCoinImage(log.coin.symbol)}
              style={styles.coinImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.coinIconText}>?</Text>
          )}
        </View>
        <View style={styles.logInfo}>
          <Text style={styles.coinName}>{log.coin?.name || 'Unknown Coin'}</Text>
          <Text style={styles.coinSymbol}>{log.coin?.symbol || 'N/A'}</Text>
          <Text style={styles.logMessage}>{log.message}</Text>
        </View>
      </View>
      
      <View style={styles.logRight}>
        <View style={styles.priceContainer}>
          <Text style={styles.logPrice}>${parseFloat(log.price).toLocaleString()}</Text>
          <Text style={[
            styles.logChange,
            { color: isPositive ? '#10B981' : '#EF4444' }
          ]}>
            {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
          </Text>
        </View>
        <View style={styles.dateContainer}>
          <Text style={styles.logDate}>{date}</Text>
          <Text style={styles.logTime}>{time}</Text>
        </View>
      </View>
    </View>
  );
};

const LogScreen = () => {
  const [searchText, setSearchText] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { user, isLoggedIn } = useUser();

  const fetchLogs = async (isRefresh = false) => {
    if (!isLoggedIn || !user?.id) {
      setLogs([]);
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await logsService.getUserLogs(user.id);
      
      // Sort logs by notified_at in descending order (newest first)
      const sortedLogs = response.sort((a, b) => 
        new Date(b.notified_at) - new Date(a.notified_at)
      );
      
      setLogs(sortedLogs);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err.message || 'Failed to load notification logs');
      if (!isRefresh) {
        Alert.alert('Error', 'Failed to load notification logs. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh logs when screen comes into focus or user changes
  useFocusEffect(
    useCallback(() => {
      fetchLogs();
    }, [isLoggedIn, user?.id])
  );

  // Filter logs based on search text (memoized for performance)
  const filteredLogs = useMemo(() => 
    logs.filter(log =>
      log.coin?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      log.coin?.symbol?.toLowerCase().includes(searchText.toLowerCase()) ||
      log.message?.toLowerCase().includes(searchText.toLowerCase())
    ), [logs, searchText]
  );

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    fetchLogs(true);
  }, []);

  // Show login required message if not logged in
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Header />
        <View style={styles.loginRequiredContainer}>
          <Text style={styles.loginRequiredText}>Please login to view your notification logs</Text>
        </View>
        <BottomNav active="logs" />
      </SafeAreaView>
    );
  }

  // Loading state
  if (loading && logs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading notification logs...</Text>
        </View>
        <BottomNav active="logs" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with gradient background */}
      <Header />

      {/* Search Bar */}
      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search notification logs..."
      />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          Last Price Notifications ({filteredLogs.length})
        </Text>

        {/* Error State */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchLogs()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Logs List */
          <ScrollView
            style={styles.logsList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#8663EC']} // Android
                tintColor="#8663EC" // iOS
              />
            }
            contentContainerStyle={filteredLogs.length === 0 ? styles.emptyContentContainer : null}
          >
            {filteredLogs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchText ? 'No matching logs found' : 'No notification logs yet'}
                </Text>
                <Text style={styles.emptySubtext}>
                  {searchText 
                    ? `Try searching for different coin names or symbols`
                    : 'Your push notification history will appear here'
                  }
                </Text>
              </View>
            ) : (
              filteredLogs.map((log, index) => (
                <LogItem key={`${log.id}-${index}`} log={log} />
              ))
            )}
          </ScrollView>
        )}
      </View>
      
      {/* Bottom Navigation */}
      <BottomNav active="logs" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  logsList: {
    flex: 1,
  },
  logItem: {
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
  logLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  logInfo: {
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
    marginBottom: 4,
  },
  logMessage: {
    fontSize: 12,
    color: '#8B5CF6',
    fontStyle: 'italic',
    flexWrap: 'wrap',
  },
  logRight: {
    alignItems: 'flex-end',
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  logPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  logChange: {
    fontSize: 13,
    fontWeight: '500',
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  logDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  logTime: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  loginRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loginRequiredText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default LogScreen;