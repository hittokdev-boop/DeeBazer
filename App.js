import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import Navigation from "./Src/Navigation";
import { ThemeProvider, useTheme } from "./Src/Context/ThemeContext";
import GlobalNotificationBanner from "./Src/Common/GlobalNotificationBanner";
import { GlobalAlertModal } from "./Src/Common/Alert";
import {
  requestUserPermission,
  getFcmToken,
  notificationListener,
} from "./Src/Services/NotificationService";
import { SafeAreaProvider } from "react-native-safe-area-context";

function AppContent() {
  const { theme, isDarkMode } = useTheme();

  return (
    <>
      <StatusBar
        backgroundColor="transparent"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        translucent={true}
      />
      <Navigation />
      <GlobalNotificationBanner />
      <GlobalAlertModal />
    </>
  );
}

export default function App() {
  useEffect(() => {
    // Request permission, fetch FCM token & setup FCM listeners
    const setupNotifications = async () => {
      await requestUserPermission();
      await getFcmToken();
    };
    setupNotifications();

    const unsubscribe = notificationListener(remoteMessage => {
      // Notification opened callback
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
