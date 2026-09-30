import { PermissionsAndroid, Platform, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging, {
  getMessaging,
  getToken,
  requestPermission,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  onTokenRefresh,
} from '@react-native-firebase/messaging';
import { navigate } from '../Navigation';
import { markNotificationAsRead, fetchUnreadNotificationCount } from './NotificationApiService';

export const FCM_TOKEN_KEY = 'FCM_TOKEN';

/**
 * Get Messaging Service instance safely
 */
const getMessagingInstance = () => {
  try {
    if (typeof getMessaging === 'function') {
      return getMessaging();
    }
    if (typeof messaging === 'function') {
      return messaging();
    }
    if (messaging && typeof messaging.getToken === 'function') {
      return messaging;
    }
  } catch (e) {
    // Silently handle error
  }
  return null;
};

/**
 * Request notification permissions from user
 */
export const requestUserPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
      }
    }

    const msg = getMessagingInstance();
    if (msg) {
      try {
        if (typeof requestPermission === 'function') {
          await requestPermission(msg);
        } else if (typeof msg.requestPermission === 'function') {
          await msg.requestPermission();
        }
      } catch (permErr) {
        // Silently handle warning
      }
    }

    await getFcmToken();
  } catch (error) {
    // Silently handle error
  }
};

/**
 * Get FCM Token and save to AsyncStorage
 */
export const getFcmToken = async () => {
  try {
    let fcmToken = null;
    const msg = getMessagingInstance();

    // 1. Try modular API
    if (msg) {
      try {
        if (typeof getToken === 'function') {
          fcmToken = await getToken(msg);
        } else if (typeof msg.getToken === 'function') {
          fcmToken = await msg.getToken();
        }
      } catch (fcmErr) {
        // Silently handle error
      }
    }

    // 2. Try default export API fallback
    if (!fcmToken) {
      try {
        const firebaseMessagingModule = require('@react-native-firebase/messaging');
        const defaultMessaging = firebaseMessagingModule.default || firebaseMessagingModule;
        if (typeof defaultMessaging === 'function') {
          fcmToken = await defaultMessaging().getToken();
        } else if (defaultMessaging && typeof defaultMessaging.getToken === 'function') {
          fcmToken = await defaultMessaging.getToken();
        }
      } catch (fallbackErr) {
        // Silently handle error
      }
    }

    // 3. Fallback to AsyncStorage if currently offline or failed
    if (!fcmToken) {
      fcmToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    }

    if (fcmToken) {
      await AsyncStorage.setItem(FCM_TOKEN_KEY, fcmToken);
    }
    return fcmToken;
  } catch (error) {
    return null;
  }
};

/**
 * Smart notification router - navigates to appropriate screen based on payload data
 */
export const handleNotificationRouting = (remoteMessage) => {
  if (!remoteMessage) return;

  const data = remoteMessage?.data || {};
  const notificationId = data.id || data.notification_id || remoteMessage?.id;

  // Auto-mark notification as read on the server when clicked
  if (notificationId) {
    markNotificationAsRead(notificationId).catch(() => { });
  }

  try {
    const eventType = data.event_type || data.type;
    const rawMessage = remoteMessage?.notification?.body || data.message || '';
    const extractedOrderMatch = rawMessage.match(/#(\d+)/);
    const orderId = data.order_id || (extractedOrderMatch ? extractedOrderMatch[1] : null);

    if (eventType === 'seller_new_order' || eventType === 'new_order') {
      if (orderId) {
        navigate('OrderDetails', { order_id: orderId });
      } else {
        navigate('Orders');
      }
    } else if (data.screen) {
      navigate(data.screen, data.params ? JSON.parse(data.params) : data);
    } else if (orderId) {
      navigate('OrderDetails', { order_id: orderId });
    } else if (data.product_id) {
      navigate('ProductDetails', { item: { id: data.product_id } });
    } else if (data.type === 'order') {
      navigate('Orders');
    } else if (data.type === 'cart') {
      navigate('CartPage');
    } else {
      // Navigate to main tab and signal opening notification drawer
      navigate('Profile');
      DeviceEventEmitter.emit('OPEN_NOTIFICATION_DRAWER', remoteMessage);
    }

    // Refresh notifications list in UI
    DeviceEventEmitter.emit('REFRESH_NOTIFICATIONS', remoteMessage);
  } catch (e) {
    // Silently handle error
  }
};

/**
 * Set up Notification Listeners for Foreground, Background click, and Quit state click
 */
export const notificationListener = (customOnOpened) => {
  const msg = getMessagingInstance();

  let unsubscribeOnNotificationOpened = () => { };
  let unsubscribeOnMessage = () => { };
  let unsubscribeTokenRefresh = () => { };

  try {
    // 1. BACKGROUND CLICK: Notification clicked when app is running in background
    const logBackgroundClick = (remoteMessage) => {
      handleNotificationRouting(remoteMessage);
      if (customOnOpened && typeof customOnOpened === 'function') {
        customOnOpened(remoteMessage);
      }
    };

    if (msg && typeof onNotificationOpenedApp === 'function') {
      unsubscribeOnNotificationOpened = onNotificationOpenedApp(msg, logBackgroundClick);
    } else if (msg && typeof msg.onNotificationOpenedApp === 'function') {
      unsubscribeOnNotificationOpened = msg.onNotificationOpenedApp(logBackgroundClick);
    }

    // 2. QUIT STATE CLICK: Notification clicked when app was completely closed
    const logQuitClick = (remoteMessage) => {
      if (remoteMessage) {
        handleNotificationRouting(remoteMessage);
        if (customOnOpened && typeof customOnOpened === 'function') {
          customOnOpened(remoteMessage);
        }
      }
    };

    if (msg && typeof getInitialNotification === 'function') {
      getInitialNotification(msg).then(logQuitClick).catch(() => { });
    } else if (msg && typeof msg.getInitialNotification === 'function') {
      msg.getInitialNotification().then(logQuitClick).catch(() => { });
    }

    // 3. FOREGROUND RECEIVE: Notification received while app is actively open
    const handleForegroundMessage = async (remoteMessage) => {
      // Refresh unread count from API in background
      fetchUnreadNotificationCount().catch(() => { });

      // Emit event for in-app banner animation
      DeviceEventEmitter.emit('SHOW_FOREGROUND_NOTIFICATION', remoteMessage);
      // Emit event to refresh active screens / drawer
      DeviceEventEmitter.emit('REFRESH_NOTIFICATIONS', remoteMessage);
    };

    if (msg && typeof onMessage === 'function') {
      unsubscribeOnMessage = onMessage(msg, handleForegroundMessage);
    } else if (msg && typeof msg.onMessage === 'function') {
      unsubscribeOnMessage = msg.onMessage(handleForegroundMessage);
    }

    // 4. Token Refresh Listener
    if (msg && typeof onTokenRefresh === 'function') {
      unsubscribeTokenRefresh = onTokenRefresh(msg, async newToken => {
        await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);
      });
    } else if (msg && typeof msg.onTokenRefresh === 'function') {
      unsubscribeTokenRefresh = msg.onTokenRefresh(async newToken => {
        await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);
      });
    }
  } catch (e) {
    // Silently handle error
  }

  // Return cleanup function
  return () => {
    try {
      if (typeof unsubscribeOnNotificationOpened === 'function') unsubscribeOnNotificationOpened();
      if (typeof unsubscribeOnMessage === 'function') unsubscribeOnMessage();
      if (typeof unsubscribeTokenRefresh === 'function') unsubscribeTokenRefresh();
    } catch (e) { }
  };
};
