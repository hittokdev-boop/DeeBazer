import React from 'react';
import { Modal, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
  let theme = { modalBg: '#FFFFFF', textPrimary: '#0F172A', textSecondary: '#64748B' };
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

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    else if (onClose) onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else if (onClose) onClose();
  };

  const getStatusDetails = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'check-circle-outline',
          iconColor: '#10B981',
          bgContainer: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)',
          defaultTitle: 'Success 🎉',
        };
      case 'warning':
        return {
          icon: 'alert-outline',
          iconColor: '#F59E0B',
          bgContainer: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.12)',
          defaultTitle: 'Warning ⚠️',
        };
      case 'info':
        return {
          icon: 'information-outline',
          iconColor: AllColors.primary,
          bgContainer: isDarkMode ? 'rgba(247, 22, 112, 0.2)' : AllColors.lightPink,
          defaultTitle: 'Notice ℹ️',
        };
      case 'error':
      default:
        return {
          icon: 'alert-circle-outline',
          iconColor: '#EF4444',
          bgContainer: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.12)',
          defaultTitle: 'Notice',
        };
    }
  };

  const status = getStatusDetails();
  const displayTitle = title || status.defaultTitle;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleCancel}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.box, { backgroundColor: theme.modalBg }]}
        >
          {/* Status Icon Badge */}
          <View style={[styles.iconCircle, { backgroundColor: status.bgContainer }]}>
            <MaterialCommunityIcons name={status.icon} size={36} color={status.iconColor} />
          </View>

          {/* Title */}
          {displayTitle ? (
            <Text style={[styles.titleText, { color: theme.textPrimary }]}>
              {displayTitle}
            </Text>
          ) : null}

          {/* Message */}
          <Text style={[styles.messageText, { color: theme.textSecondary }]}>
            {message}
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            {cancelText ? (
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { borderColor: isDarkMode ? '#475569' : '#CBD5E1' },
                ]}
                onPress={handleCancel}
                activeOpacity={0.8}
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
              ]}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBtnText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  box: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmButton: {
    height: 46,
    backgroundColor: AllColors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});