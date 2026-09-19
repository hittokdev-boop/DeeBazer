import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { BASE_URL, getToken } from '../Api/Api';

export const NOTIFICATION_UNREAD_KEY = 'NOTIFICATION_UNREAD_COUNT';
export const NOTIFICATION_CACHE_KEY = 'SELLER_NOTIFICATION_CACHE';

/**
 * Fetch paginated seller notifications list
 * Endpoint: GET /api/notifications?page={page}
 */
export const fetchSellerNotifications = async (page = 1) => {
  try {
    const token = await getToken();
    if (!token) {
      console.log('⚠️ [NotificationApiService] No token found when fetching notifications');
      return { success: false, data: [], message: 'Unauthenticated' };
    }

    const response = await fetch(`${BASE_URL}notifications?page=${page}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await response.json();
    console.log('📬 [NotificationApiService] LIVE SERVER NOTIFICATIONS RECEIVED:', JSON.stringify(json, null, 2));

    if (response.ok && (json.status === 200 || json.status === '200' || json.data)) {
      const items = json?.data?.data || (Array.isArray(json?.data) ? json.data : []);

      // Cache the first page for offline / instant render
      if (page === 1 && items.length > 0) {
        AsyncStorage.setItem(NOTIFICATION_CACHE_KEY, JSON.stringify(items)).catch(() => { });
      }

      return {
        success: true,
        data: items,
        pagination: {
          current_page: json?.data?.current_page || 1,
          last_page: json?.data?.last_page || 1,
          total: json?.data?.total || items.length,
          per_page: json?.data?.per_page || 20,
        },
        raw: json,
      };
    } else {
      console.log('⚠️ [NotificationApiService] Notifications fetch error:', json);
      return { success: false, data: [], message: json?.message || 'Failed to fetch' };
    }
  } catch (error) {
    console.log('❌ [NotificationApiService] Error fetching notifications:', error);
    // Fallback to cache if network fails
    try {
      const cached = await AsyncStorage.getItem(NOTIFICATION_CACHE_KEY);
      if (cached) {
        return { success: true, data: JSON.parse(cached), isFromCache: true };
      }
    } catch (e) { }
    return { success: false, data: [], error: error?.message || error };
  }
};

/**
 * Fetch unread notification count
 * Endpoint: GET /api/notifications/unread-count
 */
export const fetchUnreadNotificationCount = async () => {
  try {
    const token = await getToken();
    if (!token) return 0;

    const response = await fetch(`${BASE_URL}notifications/unread-count`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await response.json();

    if (response.ok && (json.status === 200 || json.status === '200')) {
      const count = Number(json.unread_count ?? json.count ?? 0);
      await AsyncStorage.setItem(NOTIFICATION_UNREAD_KEY, String(count));
      DeviceEventEmitter.emit('NOTIFICATION_COUNT_UPDATED', count);
      return count;
    }
    return 0;
  } catch (error) {
    console.log('❌ [NotificationApiService] Error fetching unread count:', error);
    return 0;
  }
};

/**
 * Mark a single notification as read
 * Endpoint: POST /api/notifications/read
 * Body: { id: notificationId }
 */
export const markNotificationAsRead = async (id) => {
  if (!id) return { success: false, message: 'Invalid ID' };

  try {
    const token = await getToken();
    if (!token) return { success: false, message: 'Unauthenticated' };

    const formData = new FormData();
    formData.append('id', String(id));

    const response = await fetch(`${BASE_URL}notifications/read`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const json = await response.json();

    if (response.ok && (json.status === 200 || json.status === '200')) {
      // Re-fetch count in background
      fetchUnreadNotificationCount().catch(() => { });
      return { success: true, message: json?.message || 'Marked as read' };
    } else {
      // Try JSON payload fallback
      const jsonRes = await fetch(`${BASE_URL}notifications/read`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      const parsed = await jsonRes.json();
      fetchUnreadNotificationCount().catch(() => { });
      return { success: jsonRes.ok, message: parsed?.message };
    }
  } catch (error) {
    console.log('❌ [NotificationApiService] Error marking notification read:', error);
    return { success: false, error: error?.message || error };
  }
};

/**
 * Mark all notifications as read
 * Endpoint: POST /api/notifications/read-all
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const token = await getToken();
    if (!token) return { success: false, message: 'Unauthenticated' };

    const response = await fetch(`${BASE_URL}notifications/read-all`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    let json = {};
    try {
      json = await response.json();
    } catch (e) { }

    console.log('📬 [NotificationApiService] markAllNotificationsAsRead response:', json);

    if (response.ok && (json.status === 200 || json.status === '200' || response.status === 200)) {
      await AsyncStorage.setItem(NOTIFICATION_UNREAD_KEY, '0');
      DeviceEventEmitter.emit('NOTIFICATION_COUNT_UPDATED', 0);
      return { success: true, message: json?.message || 'All notifications marked as read' };
    }

    return { success: false, message: json?.message || 'Failed' };
  } catch (error) {
    console.log('❌ [NotificationApiService] Error marking all notifications read:', error);
    return { success: false, error: error?.message || error };
  }
};
