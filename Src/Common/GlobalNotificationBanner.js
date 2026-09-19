import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  DeviceEventEmitter,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import AllColors from '../Constants/Color';
import { handleNotificationRouting } from '../Services/NotificationService';
import { useTheme } from '../Context/ThemeContext';

export default function GlobalNotificationBanner() {
  const { isDarkMode } = useTheme();
  const [notification, setNotification] = useState(null);
  const [visible, setVisible] = useState(false);

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setNotification(null);
    });
  }, [translateY, opacity]);

  const show = useCallback((remoteMessage) => {
    if (!remoteMessage) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const title =
      remoteMessage?.notification?.title ||
      remoteMessage?.title ||
      remoteMessage?.data?.title ||
      'New Notification';

    const message =
      remoteMessage?.notification?.body ||
      remoteMessage?.body ||
      remoteMessage?.data?.message ||
      '';

    const eventType =
      remoteMessage?.data?.event_type ||
      remoteMessage?.data?.type ||
      '';

    setNotification({
      title,
      message,
      eventType,
      raw: remoteMessage,
    });
    setVisible(true);

    translateY.setValue(-120);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 5 seconds
    timerRef.current = setTimeout(() => {
      dismiss();
    }, 5000);
  }, [translateY, opacity, dismiss]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      'SHOW_FOREGROUND_NOTIFICATION',
      (remoteMessage) => {
        show(remoteMessage);
      }
    );

    return () => {
      sub.remove();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [show]);

  if (!visible || !notification) return null;

  const isOrder =
    notification.eventType === 'seller_new_order' ||
    notification.eventType === 'order_placed' ||
    notification.eventType === 'order';

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;

  const handlePress = () => {
    const raw = notification.raw;
    dismiss();
    if (raw) {
      handleNotificationRouting(raw);
    }
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top: statusBarHeight + 6,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handlePress}
        style={[
          styles.container,
          {
            backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
            borderColor: isOrder ? AllColors.primary : (isDarkMode ? '#334155' : '#E2E8F0'),
            shadowColor: isOrder ? AllColors.primary : '#000',
          },
        ]}
      >
        {/* Icon Circle */}
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isOrder ? AllColors.primary : (isDarkMode ? '#0F172A' : '#EFF6FF'),
            },
          ]}
        >
          {isOrder ? (
            <FontAwesome6 name="box-open" size={16} color="#FFFFFF" />
          ) : (
            <Ionicons name="notifications" size={18} color={isDarkMode ? '#93C5FD' : AllColors.primary} />
          )}
        </View>

        {/* Content Column */}
        <View style={styles.textColumn}>
          <View style={styles.titleRow}>
            <Text
              numberOfLines={1}
              style={[
                styles.title,
                { color: isDarkMode ? '#F8FAFC' : '#0F172A' },
              ]}
            >
              {notification.title}
            </Text>
            {isOrder && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>Order</Text>
              </View>
            )}
          </View>
          {!!notification.message && (
            <Text
              numberOfLines={2}
              style={[
                styles.message,
                { color: isDarkMode ? '#94A3B8' : '#475569' },
              ]}
            >
              {notification.message}
            </Text>
          )}
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={dismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={18} color={isDarkMode ? '#94A3B8' : '#64748B'} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 99999,
    elevation: 999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 14,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textColumn: {
    flex: 1,
    paddingRight: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  newBadge: {
    backgroundColor: AllColors.primary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 4,
  },
});
