import React from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
} from 'react-native';

import LottieView from 'lottie-react-native';
import AllColors from '../Constants/Color';

export default function CustomLoader({ visible }) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
    >
      <View style={styles.overlay}>

        {/* <View style={styles.container}> */}

          <LottieView
            source={require('../Assets/loading.json')}
            autoPlay
            loop
            style={styles.animation}
          />

          {/* <Text style={styles.text}>
            Loading...
          </Text> */}

        {/* </View> */}
        <Text></Text>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    width: 180,
    height: 180,
    backgroundColor: '#fff',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },

  animation: {
    width: 200,
    height: 200,
  },

  text: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: AllColors.secondary,
  },

});