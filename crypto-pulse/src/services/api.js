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
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error(`Server returned invalid JSON. Status: ${response.status}`);
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
  async getAllCoins() {
    return ApiService.get('/api/coins');
  },

  async getCoin(coinId) {
    return ApiService.get(`/api/coins/${coinId}`);
  },

  async getCoinPrices(coinId) {
    return ApiService.get(`/api/coins/${coinId}/prices`);
  },
};

// Favorites service (for future use)
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

export default ApiService;