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

  let data = remoteMessage?.data || {};
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      data = {};
    }
  }

  const notificationId = data.id || data.notification_id || remoteMessage?.id;

  // Auto-mark notification as read on the server when clicked
  if (notificationId) {
    markNotificationAsRead(notificationId).catch(() => { });
  }

  try {
    // Check for nested data in data.data
    let nestedData = {};
    if (typeof data.data === 'string') {
      try {
        nestedData = JSON.parse(data.data);
      } catch (e) {
        nestedData = {};
      }
    } else if (typeof data.data === 'object' && data.data !== null) {
      nestedData = data.data;
    }

    // Check for item in data.item or remoteMessage.item
    let itemObj = {};
    if (typeof data.item === 'string') {
      try {
        itemObj = JSON.parse(data.item);
      } catch (e) {
        itemObj = {};
      }
    } else if (typeof data.item === 'object' && data.item !== null) {
      itemObj = data.item;
    } else if (typeof remoteMessage.item === 'object' && remoteMessage.item !== null) {
      itemObj = remoteMessage.item;
    }

    const eventType = (
      data.event_type ||
      data.type ||
      nestedData.event_type ||
      nestedData.type ||
      itemObj.event_type ||
      itemObj.type ||
      ''
    ).toLowerCase();

    const rawMessage = remoteMessage?.notification?.body || data.message || data.body || remoteMessage?.body || '';

    // Extract product IDs and SKU IDs from all possible keys
    let productId =
      data.product_id ||
      data.productId ||
      nestedData.product_id ||
      nestedData.productId ||
      data.item_id ||
      nestedData.item_id ||
      itemObj.product_id ||
      itemObj.productId ||
      itemObj.item_id;

    let skuId =
      data.sku_id ||
      data.skuId ||
      data.product_sku_id ||
      data.productSkuId ||
      nestedData.sku_id ||
      nestedData.skuId ||
      nestedData.product_sku_id ||
      nestedData.productSkuId ||
      itemObj.sku_id ||
      itemObj.skuId ||
      itemObj.product_sku_id ||
      itemObj.productSkuId;

    let sellerSkuId =
      data.seller_sku_id ||
      data.sellerSkuId ||
      nestedData.seller_sku_id ||
      nestedData.sellerSkuId ||
      itemObj.seller_sku_id ||
      itemObj.sellerSkuId;

    let sellerId =
      data.seller_id ||
      data.sellerId ||
      nestedData.seller_id ||
      nestedData.sellerId ||
      itemObj.seller_id ||
      itemObj.sellerId;

    // Check URL or deeplink in data.url, data.link, or rawMessage
    const urlString = data.url || data.link || nestedData.url || nestedData.link || rawMessage;
    if (typeof urlString === 'string') {
      const matchProduct = urlString.match(/(?:product\/|product_id=)(\d+)/i);
      if (matchProduct && !productId) {
        productId = matchProduct[1];
      }
      const matchSku = urlString.match(/(?:sku\/|sku_id=)(\d+)/i);
      if (matchSku && !skuId) {
        skuId = matchSku[1];
      }
    }

    // If type is product / sku, but IDs weren't specifically keyed
    if (!productId && !skuId && (eventType.includes('product') || eventType.includes('sku') || data.screen === 'ProductDetails')) {
      const genericId = data.id || nestedData.id || itemObj.id;
      if (genericId && !String(genericId).startsWith('notif_')) {
        productId = genericId;
      }
    }

    // Extract order info
    const extractedOrderMatch = rawMessage.match(/#(\d+)/);
    const orderId =
      data.order_id ||
      data.orderId ||
      nestedData.order_id ||
      nestedData.orderId ||
      (eventType.includes('order') && extractedOrderMatch ? extractedOrderMatch[1] : null);

    // --- 1. PRODUCT DETAILS ROUTING ---
    // If notification contains product_id or sku_id or screen is ProductDetails or event is product-related
    if (productId || skuId || data.screen === 'ProductDetails' || eventType.includes('product') || eventType.includes('sku')) {
      console.log('Routing notification to ProductDetails with:', {
        productId,
        skuId,
        sellerSkuId,
        sellerId,
      });

      const navParams = {
        id: productId || skuId,
        product_id: productId || skuId,
        sku_id: skuId || null,
        product_sku_id: skuId || null,
        seller_sku_id: sellerSkuId || null,
        seller_id: sellerId || null,
        sellerId: sellerId || null,
        vendor_id: sellerId || null,
        item: {
          id: productId || skuId,
          product_id: productId || skuId,
          sku_id: skuId || null,
          product_sku_id: skuId || null,
          seller_sku_id: sellerSkuId || null,
          seller_id: sellerId || null,
          sellerId: sellerId || null,
          vendor_id: sellerId || null,
          ...(typeof itemObj === 'object' && itemObj !== null ? itemObj : {}),
        },
      };

      navigate('ProductDetails', navParams);
      DeviceEventEmitter.emit('REFRESH_NOTIFICATIONS', remoteMessage);
      return;
    }

    // --- 2. EXPLICIT SCREEN ROUTING ---
    if (data.screen) {
      const params = data.params ? (typeof data.params === 'string' ? JSON.parse(data.params) : data.params) : data;
      navigate(data.screen, params);
      DeviceEventEmitter.emit('REFRESH_NOTIFICATIONS', remoteMessage);
      return;
    }

    // --- 3. ORDER ROUTING ---
    if (eventType === 'seller_new_order' || eventType === 'new_order' || eventType.includes('order') || orderId) {
      if (orderId) {
        navigate('OrderDetails', { order_id: orderId });
      } else {
        navigate('Orders');
      }
      DeviceEventEmitter.emit('REFRESH_NOTIFICATIONS', remoteMessage);
      return;
    }

    // --- 4. CART ROUTING ---
    if (eventType.includes('cart') || data.type === 'cart') {
      navigate('CartPage');
      DeviceEventEmitter.emit('REFRESH_NOTIFICATIONS', remoteMessage);
      return;
    }

    // --- 5. WISHLIST ROUTING ---
    if (eventType.includes('wishlist') || data.type === 'wishlist') {
      navigate('Wishlist');
      DeviceEventEmitter.emit('REFRESH_NOTIFICATIONS', remoteMessage);
      return;
    }

    // --- 6. DEFAULT / FALLBACK: Open Notifications Drawer ---
    DeviceEventEmitter.emit('OPEN_NOTIFICATION_DRAWER', remoteMessage);
    DeviceEventEmitter.emit('REFRESH_NOTIFICATIONS', remoteMessage);
  } catch (e) {
    console.log('Error handling notification routing:', e);
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
