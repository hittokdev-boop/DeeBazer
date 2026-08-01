import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AllColors from '../Constants/Color';

const SuccessModal = ({
  visible,
  title ,
  message ,
  onClose,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>✓</Text>
          </View>

          <Text style={styles.title}>{title}</Text>

          <Text style={styles.message}>
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