import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, Button } from 'react-native';
import AllColors from '../../Constants/Color';
import LottieView from 'lottie-react-native';
import CustomAlert from '../../Common/Alert';

export default function Home() {
    const [showAlert, setShowAlert] = useState(false);
  return (
    <View style={style.container}>
    
      <LottieView
        source={require('../../Assets/delivery-boy.json')}
        autoPlay
        loop
        style={style.animation}
      />
      <Text style={style.TextColor}>Comming Soon</Text>
      <Button title="Show Alert" onPress={() => setShowAlert(true)} />

      <CustomAlert
        visible={showAlert}
        message="Something went wrong!"
        onClose={() => setShowAlert(false)}
      />
    </View>
  );
}

const style=StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AllColors.screenBg,
  },
  animation: {
    width: 350,
    height: 350,
  },
  TextColor:{
    fontWeight:'bold',
    fontSize:28,
    color:AllColors.secondary
  }
})