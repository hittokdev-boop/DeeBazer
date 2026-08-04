import { PermissionsAndroid, Platform, Alert, DeviceEventEmitter } from 'react-native';
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
    const msg = getMessagingInstance();
    let fcmToken = null;

    if (msg) {
      try {
        if (typeof getToken === 'function') {
          fcmToken = await getToken(msg);
        } else if (typeof msg.getToken === 'function') {
          fcmToken = await msg.getToken();
        }

        if (fcmToken) {
          await AsyncStorage.setItem(FCM_TOKEN_KEY, fcmToken);
        }
      } catch (fcmErr) {
        console.log('⚠️ Could not fetch FCM token directly from Firebase:', fcmErr?.message || fcmErr);
      }
    }

    // Fallback to AsyncStorage if Firebase fails or app is offline
    if (!fcmToken) {
      fcmToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    }

    if (fcmToken) {
      console.log('\n================================================');
      console.log('🔥 YOUR FCM DEVICE TOKEN:');
      console.log(fcmToken);
      console.log('================================================\n');
    } else {
      console.log('⚠️ Could not fetch FCM token (returned empty).');
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

  try {
    if (data.screen) {
      navigate(data.screen, data.params ? JSON.parse(data.params) : data);
    } else if (data.order_id) {
      navigate('OrderDetails', { order_id: data.order_id });
    } else if (data.product_id) {
      navigate('ProductDetails', { item: { id: data.product_id } });
    } else if (data.type === 'order') {
      navigate('Orders');
    } else if (data.type === 'cart') {
      navigate('CartPage');
    } else {
      console.log('🔔 Opened general notification:', remoteMessage.notification?.title);
    }
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

      // Emit event for in-app banner animation & unread badge count
      DeviceEventEmitter.emit('SHOW_FOREGROUND_NOTIFICATION', remoteMessage);
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
