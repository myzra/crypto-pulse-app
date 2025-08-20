// hooks/useCoins.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { coinsService } from '../services/api';

export const useCoins = (autoRefresh = false, refreshInterval = 5 * 60 * 1000) => { // 5 minutes default
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Fetch coins data
  const fetchCoins = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      console.log('Fetching coins data...');
      const coinsData = await coinsService.getAllCoinsFormatted();
      
      if (mountedRef.current) {
        setCoins(coinsData);
        setLastUpdated(new Date());
        console.log('Coins data updated:', coinsData.length, 'coins');
      }
    } catch (err) {
      console.error('Error fetching coins:', err);
      if (mountedRef.current) {
        setError(err.message || 'Failed to fetch coins');
      }
    } finally {
      if (mountedRef.current && showLoading) {
        setLoading(false);
      }
    }
  }, []);

  // Refresh coins (for manual refresh)
  const refreshCoins = useCallback(() => {
    fetchCoins(true);
  }, [fetchCoins]);

  // Background refresh (without loading state)
  const backgroundRefresh = useCallback(() => {
    fetchCoins(false);
  }, [fetchCoins]);

  // Setup auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        console.log('Auto-refreshing coins data...');
        backgroundRefresh();
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, backgroundRefresh]);

  // Initial fetch
  useEffect(() => {
    fetchCoins(true);
  }, [fetchCoins]);

  // Get coin by ID
  const getCoinById = useCallback((coinId) => {
    return coins.find(coin => coin.id === coinId || coin.id === parseInt(coinId));
  }, [coins]);

  // Update specific coin (for favorites, etc.)
  const updateCoin = useCallback((coinId, updates) => {
    setCoins(prevCoins => 
      prevCoins.map(coin => 
        coin.id === coinId || coin.id === parseInt(coinId)
          ? { ...coin, ...updates }
          : coin
      )
    );
  }, []);

  // Filter coins by search term
  const searchCoins = useCallback((searchTerm) => {
    if (!searchTerm) return coins;
    
    const term = searchTerm.toLowerCase();
    return coins.filter(coin => 
      coin.name.toLowerCase().includes(term) ||
      coin.symbol.toLowerCase().includes(term)
    );
  }, [coins]);

  return {
    coins,
    loading,
    error,
    lastUpdated,
    refreshCoins,
    getCoinById,
    updateCoin,
    searchCoins,
    // Helper methods
    isEmpty: coins.length === 0,
    hasError: !!error,
    isStale: lastUpdated && (new Date() - lastUpdated) > refreshInterval,
  };
};