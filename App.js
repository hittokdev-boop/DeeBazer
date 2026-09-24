import React, { useEffect } from "react";
import Navigation from "./Src/Navigation";
import { ThemeProvider } from "./Src/Context/ThemeContext";
import GlobalNotificationBanner from "./Src/Common/GlobalNotificationBanner";
import {
  requestUserPermission,
  getFcmToken,
  notificationListener,
} from "./Src/Services/NotificationService";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  useEffect(() => {
    // Request permission, fetch FCM token & setup FCM listeners
    const setupNotifications = async () => {
      await requestUserPermission();
      const token = await getFcmToken();
      if (token) {
        console.log('📌 [App.js] Initial FCM Token ready:', token);
      }
    };
    setupNotifications();

    const unsubscribe = notificationListener(remoteMessage => {
      console.log("App received notification click:", remoteMessage);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Navigation />
        <GlobalNotificationBanner />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

