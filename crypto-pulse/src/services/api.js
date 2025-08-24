// src/services/api.js
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

class ApiService {
  static async request(endpoint, options = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const config = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };

      console.log('Making request to:', url);
      console.log('Request config:', JSON.stringify(config, null, 2));
      
      const response = await fetch(url, config);
      
      let data;
      
      // Check if response has content to parse
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        // No content to parse for 204 No Content or empty responses
        data = null;
      } else {
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', parseError);
          throw new Error(`Server returned invalid JSON. Status: ${response.status}`);
        }
      }

      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (!response.ok) {
        // Handle different error formats from FastAPI
        const errorMessage = data?.detail || data?.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      
      // Re-throw with more specific error information
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - please check your connection and backend server');
      }
      
      throw error;
    }
  }

  static async post(endpoint, data, headers = {}) {
    return this.request(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  }

  static async get(endpoint, headers = {}) {
    return this.request(endpoint, {
      method: 'GET',
      headers,
    });
  }

  static async put(endpoint, data, headers = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
  }

  static async delete(endpoint, headers = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      headers,
    });
  }
}

// Auth service
export const authService = {
  /**
   * Sign up a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} [userData.username] - Optional username
   */
  async signUp(userData) {
    const payload = {
      email: userData.email.toLowerCase().trim(),
      password: userData.password,
    };
    
    console.log('Signup payload:', payload);
    return ApiService.post('/api/auth/signup', payload);
  },

  /**
   * Sign in user
   * @param {Object} credentials - User login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   */
  async signIn(credentials) {
    return ApiService.post('/api/auth/signin', {
      email: credentials.email.toLowerCase().trim(),
      password: credentials.password,
    });
  },

  /**
   * Get user by ID
   * @param {string} userId - User ID
   */
  async getUser(userId) {
    return ApiService.get(`/api/auth/user/${userId}`);
  },
};

// Coins service (for future use)
export const coinsService = {
  /**
   * Get all coins with fresh prices (auto-updates stale prices)
   * @returns {Promise} Promise that resolves to coins array
   */
  async getAllCoins() {
    try {
      const response = await ApiService.get('/api/coins');
      console.log('Fetched coins with updated prices:', response?.length || 0);
      return response;
    } catch (error) {
      console.error('Error fetching coins:', error);
      throw error;
    }
  },

  /**
   * Get specific coin with fresh price data
   * @param {string|number} coinId - Coin ID
   * @returns {Promise} Promise that resolves to coin object
   */
  async getCoin(coinId) {
    try {
      const response = await ApiService.get(`/api/coins/${coinId}`);
      console.log('Fetched coin with updated price:', response?.symbol);
      return response;
    } catch (error) {
      console.error(`Error fetching coin ${coinId}:`, error);
      throw error;
    }
  },

  /**
   * Get coin prices (legacy endpoint)
   * @param {string|number} coinId - Coin ID
   * @returns {Promise} Promise that resolves to prices array
   */
  async getCoinPrices(coinId) {
    try {
      const response = await ApiService.get(`/api/coins/${coinId}/prices`);
      return response;
    } catch (error) {
      console.error(`Error fetching prices for coin ${coinId}:`, error);
      throw error;
    }
  },

  /**
   * Manually trigger price updates (for testing/admin)
   * @returns {Promise} Promise that resolves to update result
   */
  async updatePricesManually() {
    try {
      const response = await ApiService.post('/api/coins/update-prices');
      console.log('Manual price update triggered:', response);
      return response;
    } catch (error) {
      console.error('Error triggering manual price update:', error);
      throw error;
    }
  },

  /**
   * Get price data status (for monitoring)
   * @returns {Promise} Promise that resolves to status object
   */
  async getPriceStatus() {
    try {
      const response = await ApiService.get('/api/coins/prices/status');
      return response;
    } catch (error) {
      console.error('Error fetching price status:', error);
      throw error;
    }
  },

  /**
   * Transform backend coin data to frontend format
   * @param {Object} coinData - Raw coin data from backend
   * @returns {Object} Transformed coin data
   */
  transformCoinData(coinData) {
    if (!coinData) return null;

    const price = coinData.price?.current_price;
    const change = coinData.price?.change_24h;
    const isPositive = coinData.price?.is_positive;

    // Import the getCoinImage function
    const { getCoinImage } = require('../constants/cryptoData');

    return {
      id: coinData.id,
      name: coinData.name,
      symbol: coinData.symbol,
      color: coinData.color,
      // Format price for display WITH dollar sign
      price: price ? `$${price.toFixed(price >= 1 ? 2 : 6)}` : 'N/A',
      // Format change for display
      change: change ? `${isPositive ? '+' : ''}${change.toFixed(2)}%` : 'N/A',
      isPositive: isPositive,
      // Keep raw values for calculations
      rawPrice: price,
      rawChange: change,
      lastUpdated: coinData.price?.updated_at,
      icon: coinData.symbol?.charAt(0) || '?',
      imageSource: getCoinImage(coinData.symbol),
      isFavorite: false,
    };
  },

  /**
   * Get all coins transformed for frontend use
   * @returns {Promise} Promise that resolves to transformed coins array
   */
  async getAllCoinsFormatted() {
    try {
      const coins = await this.getAllCoins();
      return coins.map(coin => this.transformCoinData(coin));
    } catch (error) {
      console.error('Error fetching formatted coins:', error);
      throw error;
    }
  },
};

// Favorites service
export const favoritesService = {
  async getUserFavorites(userId) {
    return ApiService.get(`/api/favorites/users/${userId}/favorites`);
  },

  async addFavorite(userId, coinId) {
    return ApiService.post('/api/favorites', {
      user_id: userId,
      coin_id: coinId,
    });
  },

  async removeFavorite(userId, coinId) {
    return ApiService.delete(`/api/favorites/${userId}/${coinId}`);
  },
};

// Notifications service
export const notificationsService = {
  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   * @param {string} notificationData.user_id - User ID
   * @param {number} notificationData.coin_id - Coin ID
   * @param {string} notificationData.frequency_type - Frequency type (hourly, daily, weekly, custom)
   * @param {number} [notificationData.interval_hours] - Custom interval in hours
   * @param {string} [notificationData.preferred_time] - Preferred time in HH:MM format
   * @param {string} [notificationData.preferred_day] - Preferred day name
   */
  async createNotification(notificationData) {
    return ApiService.post('/api/notifications', notificationData);
  },

  /**
   * Get all notifications for a user
   * @param {string} userId - User ID
   */
  async getUserNotifications(userId) {
    return ApiService.get(`/api/notifications/${userId}`);
  },

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   */
  async deleteNotification(notificationId) {
    return ApiService.delete(`/api/notifications/${notificationId}`);
  },

  /**
   * Update a notification
   * @param {string} notificationId - Notification ID
   * @param {Object} updateData - Data to update
   */
  async updateNotification(notificationId, updateData) {
    return ApiService.put(`/api/notifications/${notificationId}`, updateData);
  },

 /**
 * Toggle notification active status
 * @param {string} notificationId - Notification ID
 */
  async toggleNotificationStatus(notificationId) {
    return ApiService.put(`/api/notifications/${notificationId}/toggle`);
  },
  
  /**
* Check if user has an active notification for a specific coin
* @param {string} userId - User ID
* @param {number} coinId - Coin ID
*/
async checkNotification(userId, coinId) {
  return ApiService.post('/api/notifications/check', {
    user_id: userId,
    coin_id: coinId,
  });
 },
 
 /**
 * Delete notification by user and coin ID
 * @param {string} userId - User ID
 * @param {number} coinId - Coin ID
 */
 async deleteNotificationByUserCoin(userId, coinId) {
  return ApiService.delete(`/api/notifications/user/${userId}/coin/${coinId}`);
 },
 
 /**
 * Update notification by user and coin ID
 * @param {string} userId - User ID
 * @param {number} coinId - Coin ID
 * @param {Object} updateData - Notification update data
 */
 async updateNotificationByUserCoin(userId, coinId, updateData) {
  return ApiService.put(`/api/notifications/user/${userId}/coin/${coinId}`, updateData);
 },
};

// Logs service
export const logsService = {
  /**
   * Get all logs for a user
   * @param {string} userId - User ID
   */
  async getUserLogs(userId) {
    return ApiService.get(`/api/logs/users/${userId}`);
  },

  /**
   * Get all logs (admin only)
   */
  async getAllLogs() {
    return ApiService.get('/api/logs');
  },

  /**
   * Delete a specific log
   * @param {string} logId - Log ID
   */
  async deleteLog(logId) {
    return ApiService.delete(`/api/logs/${logId}`);
  },

  /**
   * Get user log statistics
   * @param {string} userId - User ID
   */
  async getUserLogStats(userId) {
    return ApiService.get(`/api/logs/stats/${userId}`);
  },
};

export default ApiService;