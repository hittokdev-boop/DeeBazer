import React, { useEffect } from "react";
import { Text, View } from "react-native";
import Navigation from "./Src/Navigation";
import { ThemeProvider } from "./Src/Context/ThemeContext";
import {
  requestUserPermission,
  notificationListener,
} from "./Src/Services/NotificationService";

export default function App() {
  useEffect(() => {
    // Request permission & setup FCM listeners
    requestUserPermission();
    const unsubscribe = notificationListener(remoteMessage => {
      console.log("App received notification click:", remoteMessage);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <ThemeProvider>
      <Navigation />
    </ThemeProvider>
  );
}
