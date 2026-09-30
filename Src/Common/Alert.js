import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  DeviceEventEmitter,
  Alert as RNAlert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AllColors from '../Constants/Color';
import { useTheme } from '../Context/ThemeContext';

export default function CustomAlert({
  visible = false,
  title,
  message = '',
  type = 'error',
  confirmText = 'Got It',
  onConfirm,
  onClose,
  cancelText,
  onCancel,
}) {
  let theme = {
    modalBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    modalSubText: '#64748B',
    iconPrimary: AllColors.primary,
  };
  let isDarkMode = false;
  try {
    const themeContext = useTheme();
    if (themeContext) {
      theme = themeContext.theme || theme;
      isDarkMode = themeContext.isDarkMode || false;
    }
  } catch (e) {
    // fallback if outside context
  }

  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.88);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 75,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleClose = (callback) => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 130,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (typeof callback === 'function') {
        callback();
      } else if (onClose) {
        onClose();
      }
    });
  };

  const getStatusDetails = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          iconColor: '#10B981',
          outerRing: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : '#DCFCE7',
          innerRing: isDarkMode ? 'rgba(16, 185, 129, 0.28)' : '#BBF7D0',
          defaultTitle: 'Success',
        };
      case 'warning':
        return {
          icon: 'warning',
          iconColor: '#F59E0B',
          outerRing: isDarkMode ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7',
          innerRing: isDarkMode ? 'rgba(245, 158, 11, 0.28)' : '#FDE68A',
          defaultTitle: 'Attention',
        };
      case 'info':
        return {
          icon: 'information-circle',
          iconColor: AllColors.primary,
          outerRing: isDarkMode ? 'rgba(247, 22, 112, 0.16)' : '#FFF1F7',
          innerRing: isDarkMode ? 'rgba(247, 22, 112, 0.28)' : '#FCE7F3',
          defaultTitle: 'Notice',
        };
      case 'error':
      default:
        return {
          icon: 'alert-circle',
          iconColor: '#EF4444',
          outerRing: isDarkMode ? 'rgba(239, 68, 68, 0.16)' : '#FEE2E2',
          innerRing: isDarkMode ? 'rgba(239, 68, 68, 0.28)' : '#FECACA',
          defaultTitle: 'Oops! Error',
        };
    }
  };

  if (!visible) return null;

  const status = getStatusDetails();
  const displayTitle = title !== undefined && title !== null && title !== '' ? title : status.defaultTitle;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={() => handleClose(onCancel || onClose)}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={() => handleClose(onCancel || onClose)}
      >
        <Animated.View
          style={[
            styles.box,
            {
              backgroundColor: theme.modalBg,
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.8)',
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.innerContent}
          >
            {/* Top Close Button */}
            <TouchableOpacity
              style={[
                styles.closeIconBtn,
                { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' }
              ]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={() => handleClose(onCancel || onClose)}
            >
              <Ionicons name="close" size={17} color={theme.textSecondary} />
            </TouchableOpacity>

            {/* Glowing Hero Icon Badge */}
            <View style={[styles.outerIconCircle, { backgroundColor: status.outerRing }]}>
              <View style={[styles.innerIconCircle, { backgroundColor: status.innerRing }]}>
                <Ionicons name={status.icon} size={32} color={status.iconColor} />
              </View>
            </View>

            {/* Title */}
            {displayTitle ? (
              <Text style={[styles.titleText, { color: theme.textPrimary }]}>
                {displayTitle}
              </Text>
            ) : null}

            {/* Message */}
            {message ? (
              <Text style={[styles.messageText, { color: theme.modalSubText || theme.textSecondary }]}>
                {message}
              </Text>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              {cancelText ? (
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    { borderColor: isDarkMode ? '#475569' : '#CBD5E1' },
                  ]}
                  onPress={() => handleClose(onCancel || onClose)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>
                    {cancelText}
                  </Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  cancelText ? { flex: 1 } : { width: '100%' },
                  { backgroundColor: AllColors.primary },
                ]}
                onPress={() => handleClose(onConfirm || onClose)}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmBtnText}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

/**
 * Global App Alert Modal
 * Listens to DeviceEventEmitter events so any part of the app
 * can trigger a styled alert without managing local state.
 */
export function GlobalAlertModal() {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'error',
    confirmText: 'OK',
    onConfirm: null,
    cancelText: null,
    onCancel: null,
  });

  useEffect(() => {
    const showSub = DeviceEventEmitter.addListener('SHOW_CUSTOM_ALERT', (config) => {
      setAlertConfig({
        visible: true,
        title: config.title || '',
        message: config.message || '',
        type: config.type || 'error',
        confirmText: config.confirmText || 'OK',
        onConfirm: config.onConfirm || null,
        cancelText: config.cancelText || null,
        onCancel: config.onCancel || null,
      });
    });

    const closeSub = DeviceEventEmitter.addListener('CLOSE_CUSTOM_ALERT', () => {
      setAlertConfig((prev) => ({ ...prev, visible: false }));
    });

    return () => {
      showSub.remove();
      closeSub.remove();
    };
  }, []);

  const handleClose = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  return (
    <CustomAlert
      visible={alertConfig.visible}
      title={alertConfig.title}
      message={alertConfig.message}
      type={alertConfig.type}
      confirmText={alertConfig.confirmText}
      onConfirm={() => {
        const fn = alertConfig.onConfirm;
        handleClose();
        if (fn) fn();
      }}
      cancelText={alertConfig.cancelText}
      onCancel={() => {
        const fn = alertConfig.onCancel;
        handleClose();
        if (fn) fn();
      }}
      onClose={handleClose}
    />
  );
}

/**
 * Trigger global styled alert imperatively from anywhere
 */
export const showAppAlert = ({
  title,
  message,
  type = 'error',
  confirmText = 'OK',
  onConfirm,
  cancelText,
  onCancel,
}) => {
  DeviceEventEmitter.emit('SHOW_CUSTOM_ALERT', {
    title,
    message,
    type,
    confirmText,
    onConfirm,
    cancelText,
    onCancel,
  });
};

export const closeAppAlert = () => {
  DeviceEventEmitter.emit('CLOSE_CUSTOM_ALERT');
};

/**
 * Automatically patches React Native Alert.alert to render our styled modal
 */
let isPatched = false;
export const patchAlert = () => {
  if (isPatched) return;
  isPatched = true;

  RNAlert.alert = (title, message, buttons) => {
    let type = 'info';
    const lowerTitle = (title || '').toLowerCase();
    const lowerMsg = (message || '').toLowerCase();

    if (
      lowerTitle.includes('error') ||
      lowerTitle.includes('fail') ||
      lowerTitle.includes('invalid') ||
      lowerMsg.includes('error') ||
      lowerMsg.includes('fail') ||
      lowerMsg.includes('required')
    ) {
      type = 'error';
    } else if (lowerTitle.includes('success') || lowerMsg.includes('success')) {
      type = 'success';
    } else if (
      lowerTitle.includes('warning') ||
      lowerTitle.includes('limit') ||
      lowerTitle.includes('required') ||
      lowerTitle.includes('out of stock') ||
      lowerMsg.includes('stock')
    ) {
      type = 'warning';
    }

    let confirmText = 'OK';
    let onConfirm = null;
    let cancelText = null;
    let onCancel = null;

    if (Array.isArray(buttons) && buttons.length > 0) {
      if (buttons.length === 1) {
        confirmText = buttons[0].text || 'OK';
        onConfirm = buttons[0].onPress;
      } else if (buttons.length >= 2) {
        const cancelBtn =
          buttons.find((b) => b.style === 'cancel' || /cancel|no|dismiss/i.test(b.text || '')) ||
          buttons[0];
        const confirmBtn = buttons.find((b) => b !== cancelBtn) || buttons[1];

        cancelText = cancelBtn.text || 'Cancel';
        onCancel = cancelBtn.onPress;
        confirmText = confirmBtn.text || 'OK';
        onConfirm = confirmBtn.onPress;
      }
    }

    showAppAlert({
      title: title || 'Notice',
      message: message || '',
      type,
      confirmText,
      onConfirm,
      cancelText,
      onCancel,
    });
  };
};

// Automatically activate patch on import
patchAlert();

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  box: {
    width: '100%',
    maxWidth: 345,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    overflow: 'hidden',
  },
  innerContent: {
    width: '100%',
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
  },
  closeIconBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  outerIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  innerIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  messageText: {
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  confirmButton: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: AllColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});