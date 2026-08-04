import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AllColors from '../Constants/Color';

import { useTheme } from '../Context/ThemeContext';

const SuccessModal = ({
  visible,
  title ,
  message ,
  onClose,
}) => {
  const { theme, isDarkMode } = useTheme();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.cardBg, borderColor: theme.borderColor, borderWidth: isDarkMode ? 1 : 0 }]}>
          
          <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.2)' : AllColors.greenSoftBg }]}>
            <Text style={[styles.icon, { color: isDarkMode ? '#4ADE80' : AllColors.greenSoftText }]}>✓</Text>
          </View>

          <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>

          <Text style={[styles.message, { color: theme.textSecondary }]}>
            {message}
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

export default SuccessModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: AllColors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    width: '85%',
    backgroundColor: AllColors.white,
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    elevation: 10,
  },

  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: AllColors.greenSoftBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  icon: {
    fontSize: 50,
    color: AllColors.greenSoftText,
    fontWeight: 'bold',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AllColors.slateDark,
    marginBottom: 10,
  },

  message: {
    fontSize: 15,
    color: AllColors.slateSub,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },

  button: {
    backgroundColor: AllColors.greenSoftText,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonText: {
    color: AllColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});