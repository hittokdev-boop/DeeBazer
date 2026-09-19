import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

import AsyncStorage from '@react-native-async-storage/async-storage';

const handleBackgroundReceive = async (remoteMessage) => {
  console.log('\n================================================');
  console.log('🔔 [BACKGROUND RECEIVE] FCM MESSAGE RECEIVED IN BACKGROUND!');
  console.log('📌 Title:', remoteMessage?.notification?.title);
  console.log('📌 Body:', remoteMessage?.notification?.body);
  console.log('📌 Event Type:', remoteMessage?.data?.event_type || remoteMessage?.data?.type);
  console.log('📌 Data:', JSON.stringify(remoteMessage?.data || {}));
  console.log('================================================\n');

  try {
    // Increment unread count in storage
    const currentCountStr = await AsyncStorage.getItem('NOTIFICATION_UNREAD_COUNT');
    const newCount = (parseInt(currentCountStr, 10) || 0) + 1;
    await AsyncStorage.setItem('NOTIFICATION_UNREAD_COUNT', String(newCount));

    // Save recent background notification into cache
    const cachedStr = await AsyncStorage.getItem('SELLER_NOTIFICATION_CACHE');
    const cachedList = cachedStr ? JSON.parse(cachedStr) : [];
    const newEntry = {
      id: remoteMessage?.data?.id || Date.now(),
      title: remoteMessage?.notification?.title || 'Notification',
      message: remoteMessage?.notification?.body || '',
      type: remoteMessage?.data?.type || 'info',
      event_type: remoteMessage?.data?.event_type || 'seller_new_order',
      is_read: false,
      created_at: new Date().toISOString(),
      sent_at: new Date().toISOString(),
      data: remoteMessage?.data || {},
    };
    const updated = [newEntry, ...cachedList.filter(n => n.id !== newEntry.id)].slice(0, 50);
    await AsyncStorage.setItem('SELLER_NOTIFICATION_CACHE', JSON.stringify(updated));
  } catch (err) {
    console.log('⚠️ Error updating background notification cache:', err);
  }
};

// Register background message handler
try {
  const msg = getMessaging();
  setBackgroundMessageHandler(msg, handleBackgroundReceive);
} catch (e) {
  try {
    const firebaseMessagingModule = require('@react-native-firebase/messaging');
    const messaging = firebaseMessagingModule.default || firebaseMessagingModule;
    if (typeof messaging === 'function') {
      messaging().setBackgroundMessageHandler(handleBackgroundReceive);
    }
  } catch (err) {
    console.log('⚠️ FCM background handler setup skipped:', err?.message || err);
  }
}

AppRegistry.registerComponent(appName, () => App);
