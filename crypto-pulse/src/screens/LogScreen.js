import React, { useState, useCallback, useMemo } from 'react';
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
import { useTheme } from '../constants/theme';

const LogItem = ({ log, theme }) => {
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

  const logItemStyles = StyleSheet.create({
    logItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.card,
      padding: 15,
      borderRadius: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.cardShadow,
      shadowOffset: { width: 0, height: 1},
      shadowOpacity: 0.1,
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
      color: theme.text,
      fontSize: 18,
      fontWeight: 'bold',
    },
    logInfo: {
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
      marginBottom: 4,
    },
    logMessage: {
      fontSize: 12,
      color: theme.accent,
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
      color: theme.text,
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
      color: theme.textSecondary,
      marginBottom: 2,
    },
    logTime: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '500',
    },
  });

  return (
    <View style={logItemStyles.logItem}>
      <View style={logItemStyles.logLeft}>
        <View style={[logItemStyles.coinIcon, { backgroundColor: log.coin?.color || theme.primaryLight }]}>
          {log.coin?.symbol ? (
            <Image
              source={getCoinImage(log.coin.symbol)}
              style={logItemStyles.coinImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={logItemStyles.coinIconText}>?</Text>
          )}
        </View>
        <View style={logItemStyles.logInfo}>
          <Text style={logItemStyles.coinName}>{log.coin?.name || 'Unknown Coin'}</Text>
          <Text style={logItemStyles.coinSymbol}>{log.coin?.symbol || 'N/A'}</Text>
          <Text style={logItemStyles.logMessage}>{log.message}</Text>
        </View>
      </View>
      
      <View style={logItemStyles.logRight}>
        <View style={logItemStyles.priceContainer}>
          <Text style={logItemStyles.logPrice}>${parseFloat(log.price).toLocaleString()}</Text>
          <Text style={[
            logItemStyles.logChange,
            { color: isPositive ? theme.success : theme.error }
          ]}>
            {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
          </Text>
        </View>
        <View style={logItemStyles.dateContainer}>
          <Text style={logItemStyles.logDate}>{date}</Text>
          <Text style={logItemStyles.logTime}>{time}</Text>
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
  const { theme, isDarkMode } = useTheme();

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

  const themedStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 15,
    },
    logsList: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      backgroundColor: theme.background,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: theme.textSecondary,
    },
    loginRequiredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      backgroundColor: theme.background,
    },
    loginRequiredText: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      backgroundColor: theme.background,
    },
    errorText: {
      fontSize: 16,
      color: theme.error,
      textAlign: 'center',
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryButtonText: {
      color: theme.background,
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
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
      fontWeight: '600',
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.textTertiary,
      textAlign: 'center',
    },
  });

  // Show login required message if not logged in
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={themedStyles.container}>
        <StatusBar barStyle={theme.statusBarStyle} />
        <Header />
        <View style={themedStyles.loginRequiredContainer}>
          <Text style={themedStyles.loginRequiredText}>Please login to view your notification logs</Text>
        </View>
        <BottomNav active="logs" />
      </SafeAreaView>
    );
  }

  // Loading state
  if (loading && logs.length === 0) {
    return (
      <SafeAreaView style={themedStyles.container}>
        <StatusBar barStyle={theme.statusBarStyle} />
        <Header />
        <View style={themedStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.activityIndicator} />
          <Text style={themedStyles.loadingText}>Loading notification logs...</Text>
        </View>
        <BottomNav active="logs" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={themedStyles.container}>
      <StatusBar barStyle={theme.statusBarStyle} />
      
      {/* Header with gradient background */}
      <Header />

      {/* Search Bar */}
      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search notification logs..."
      />

      {/* Content */}
      <View style={themedStyles.content}>
        <Text style={themedStyles.sectionTitle}>
          Last Price Notifications ({filteredLogs.length})
        </Text>

        {/* Error State */}
        {error ? (
          <View style={themedStyles.errorContainer}>
            <Text style={themedStyles.errorText}>{error}</Text>
            <TouchableOpacity style={themedStyles.retryButton} onPress={() => fetchLogs()}>
              <Text style={themedStyles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Logs List */
          <ScrollView
            style={themedStyles.logsList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.accent]} // Android
                tintColor={theme.accent} // iOS
              />
            }
            contentContainerStyle={filteredLogs.length === 0 ? themedStyles.emptyContentContainer : null}
          >
            {filteredLogs.length === 0 ? (
              <View style={themedStyles.emptyContainer}>
                <Text style={themedStyles.emptyText}>
                  {searchText ? 'No matching logs found' : 'No notification logs yet'}
                </Text>
                <Text style={themedStyles.emptySubtext}>
                  {searchText 
                    ? `Try searching for different coin names or symbols`
                    : 'Your push notification history will appear here'
                  }
                </Text>
              </View>
            ) : (
              filteredLogs.map((log, index) => (
                <LogItem key={`${log.id}-${index}`} log={log} theme={theme} />
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

export default LogScreen;