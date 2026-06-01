import React from 'react';
import { Modal, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import AllColors from '../Constants/Color';

export default function CustomAlert({ visible, message, onClose }) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          
          <LottieView
            source={require('../Assets/Alert.json')}
            autoPlay
            loop={false}
            style={styles.animation}
          />

          <Text style={styles.text}>{message}</Text>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.btnText}>OK</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: AllColors.transparentBlack,
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  animation: {
    width: 120,
    height: 120,
  },
  text: {
    fontSize: 16,
    marginVertical: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#fc0394',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});