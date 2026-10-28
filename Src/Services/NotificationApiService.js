import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import {
  getNotificationsApi,
  getUnreadNotificationCountApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  getToken,
} from '../Api/Api';

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
      return { success: false, data: [], message: 'Unauthenticated' };
    }

    const res = await getNotificationsApi(page);
    const json = res.data;

    if (res.ok && (json?.status === 200 || json?.status === '200' || json?.data)) {
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
      return { success: false, data: [], message: json?.message || 'Failed to fetch' };
    }
  } catch (error) {
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

    const res = await getUnreadNotificationCountApi();
    const json = res.data;

    if (res.ok && (json?.status === 200 || json?.status === '200')) {
      const count = Number(json.unread_count ?? json.count ?? 0);
      await AsyncStorage.setItem(NOTIFICATION_UNREAD_KEY, String(count));
      DeviceEventEmitter.emit('NOTIFICATION_COUNT_UPDATED', count);
      return count;
    }
    return 0;
  } catch (error) {
    return 0;
  }
};

/**
 * Mark a single notification as read
 * Endpoint: POST /api/notifications/read
 */
export const markNotificationAsRead = async (id) => {
  if (!id) return { success: false, message: 'Invalid ID' };

  try {
    const token = await getToken();
    if (!token) return { success: false, message: 'Unauthenticated' };

    const res = await markNotificationReadApi(id);
    const json = res.data;

    if (res.ok && (json?.status === 200 || json?.status === '200')) {
      fetchUnreadNotificationCount().catch(() => { });
      return { success: true, message: json?.message || 'Marked as read' };
    } else {
      fetchUnreadNotificationCount().catch(() => { });
      return { success: res.ok, message: json?.message };
    }
  } catch (error) {
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

    const res = await markAllNotificationsReadApi();
    const json = res.data;

    if (res.ok && (json?.status === 200 || json?.status === '200' || res.status === 200)) {
      await AsyncStorage.setItem(NOTIFICATION_UNREAD_KEY, '0');
      DeviceEventEmitter.emit('NOTIFICATION_COUNT_UPDATED', 0);
      return { success: true, message: json?.message || 'All notifications marked as read' };
    }

    return { success: false, message: json?.message || 'Failed' };
  } catch (error) {
    return { success: false, error: error?.message || error };
  }
};
