import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

// Register background message handler
try {
  const msg = getMessaging();
  setBackgroundMessageHandler(msg, async remoteMessage => {
    console.log('\n================================================');
    console.log('🔔 [BACKGROUND RECEIVE] FCM MESSAGE RECEIVED IN BACKGROUND!');
    console.log('📌 Title:', remoteMessage?.notification?.title);
    console.log('📌 Body:', remoteMessage?.notification?.body);
    console.log('📌 Data:', JSON.stringify(remoteMessage?.data || {}));
    console.log('================================================\n');
  });
} catch (e) {
  try {
    const firebaseMessagingModule = require('@react-native-firebase/messaging');
    const messaging = firebaseMessagingModule.default || firebaseMessagingModule;
    if (typeof messaging === 'function') {
      messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('\n================================================');
        console.log('🔔 [BACKGROUND RECEIVE] FCM MESSAGE RECEIVED IN BACKGROUND!');
        console.log('📌 Title:', remoteMessage?.notification?.title);
        console.log('📌 Body:', remoteMessage?.notification?.body);
        console.log('📌 Data:', JSON.stringify(remoteMessage?.data || {}));
        console.log('================================================\n');
      });
    }
  } catch (err) {
    console.log('⚠️ FCM background handler setup skipped:', err?.message || err);
  }
}

AppRegistry.registerComponent(appName, () => App);
