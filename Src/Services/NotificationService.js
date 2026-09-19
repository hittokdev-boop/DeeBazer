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
    console.log('⚠️ Firebase Messaging Instance Error:', e?.message || e);
  }
  return null;
};

/**
 * Request notification permissions from user
 */
export const requestUserPermission = async () => {
  try {
    console.log('📱 Requesting notification permissions...');
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        console.log('📱 Android POST_NOTIFICATIONS granted:', granted);
      }
    }

    const msg = getMessagingInstance();
    if (msg) {
      try {
        let authStatus;
        if (typeof requestPermission === 'function') {
          authStatus = await requestPermission(msg);
        } else if (typeof msg.requestPermission === 'function') {
          authStatus = await msg.requestPermission();
        }
        console.log('✅ FCM Permission Auth Status:', authStatus);
      } catch (permErr) {
        console.log('⚠️ FCM requestPermission warning:', permErr?.message || permErr);
      }
    }

    await getFcmToken();
  } catch (error) {
    console.log('❌ Error requesting notification permission:', error);
  }
};

/**
 * Get FCM Token and save to AsyncStorage
 */
export const getFcmToken = async () => {
  try {
    console.log('🔄 Attempting to fetch FCM Token...');
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
        console.log('⚠️ Primary getToken attempt:', fcmErr?.message || fcmErr);
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
        console.log('⚠️ Secondary getToken attempt:', fallbackErr?.message || fallbackErr);
      }
    }

    // 3. Fallback to AsyncStorage if currently offline or failed
    if (!fcmToken) {
      fcmToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    }

    if (fcmToken) {
      await AsyncStorage.setItem(FCM_TOKEN_KEY, fcmToken);
      console.log('\n╔════════════════════════════════════════════════════════════════╗');
      console.log('║                   🔥 FCM DEVICE TOKEN 🔥                      ║');
      console.log('╠════════════════════════════════════════════════════════════════╣');
      console.log(fcmToken);
      console.log('╚════════════════════════════════════════════════════════════════╝\n');
    } else {
      console.log('⚠️ Could not fetch FCM token (returned empty). Please check internet and Google Play Services.');
    }
    return fcmToken;
  } catch (error) {
    console.log('❌ Error getting FCM token:', error);
    return null;
  }
};

/**
 * Smart notification router - navigates to appropriate screen based on payload data
 */
export const handleNotificationRouting = (remoteMessage) => {
  if (!remoteMessage) return;

  console.log('📲 Routing notification data:', remoteMessage.data);
  const data = remoteMessage?.data || {};
  const notificationId = data.id || data.notification_id || remoteMessage?.id;

  // Auto-mark notification as read on the server when clicked
  if (notificationId) {
    markNotificationAsRead(notificationId).catch(err =>
      console.log('Error auto-marking notification as read:', err)
    );
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
      console.log('🔔 Opened general notification:', remoteMessage.notification?.title);
      // Navigate to main tab and signal opening notification drawer
      navigate('Profile');
      DeviceEventEmitter.emit('OPEN_NOTIFICATION_DRAWER', remoteMessage);
    }

    // Refresh notifications list in UI
    DeviceEventEmitter.emit('REFRESH_NOTIFICATIONS', remoteMessage);
  } catch (e) {
    console.log('Error routing notification:', e);
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
      console.log('\n================================================');
      console.log('🔔 [BACKGROUND CLICK] NOTIFICATION OPENED APP!');
      console.log('📌 Title:', remoteMessage?.notification?.title);
      console.log('📌 Body:', remoteMessage?.notification?.body);
      console.log('📌 Data:', JSON.stringify(remoteMessage?.data || {}));
      console.log('================================================\n');
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
        console.log('\n================================================');
        console.log('🔔 [QUIT STATE CLICK] APP LAUNCHED VIA NOTIFICATION!');
        console.log('📌 Title:', remoteMessage?.notification?.title);
        console.log('📌 Body:', remoteMessage?.notification?.body);
        console.log('📌 Data:', JSON.stringify(remoteMessage?.data || {}));
        console.log('================================================\n');
        handleNotificationRouting(remoteMessage);
        if (customOnOpened && typeof customOnOpened === 'function') {
          customOnOpened(remoteMessage);
        }
      }
    };

    if (msg && typeof getInitialNotification === 'function') {
      getInitialNotification(msg).then(logQuitClick).catch(err => console.log('Error initial notification:', err));
    } else if (msg && typeof msg.getInitialNotification === 'function') {
      msg.getInitialNotification().then(logQuitClick).catch(err => console.log('Error initial notification:', err));
    }

    // 3. FOREGROUND RECEIVE: Notification received while app is actively open
    const handleForegroundMessage = async (remoteMessage) => {
      console.log('\n================================================');
      console.log('🔔 [FOREGROUND RECEIVE] FCM MESSAGE RECEIVED!');
      console.log('📌 Title:', remoteMessage?.notification?.title);
      console.log('📌 Body:', remoteMessage?.notification?.body);
      console.log('📌 Payload Data:', JSON.stringify(remoteMessage?.data || {}));
      console.log('================================================\n');

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
        console.log('🔄 FCM Token Refreshed:', newToken);
        await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);
      });
    } else if (msg && typeof msg.onTokenRefresh === 'function') {
      unsubscribeTokenRefresh = msg.onTokenRefresh(async newToken => {
        console.log('🔄 FCM Token Refreshed:', newToken);
        await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);
      });
    }
  } catch (e) {
    console.log('Error setting notification listeners:', e);
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
