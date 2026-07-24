// components/CommonLoginModal.js

import React, {useState} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';


import AllColors from '../Constants/Color';
import CustomAlert from './Alert';
import { BASE_URL, setMobile, setuserId } from '../Api/Api';
import LottieView from 'lottie-react-native';
import { useNavigation } from "@react-navigation/native";
const CommonLoginModal = () => {

  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const Navigation=useNavigation()
const handleLogin = async () => {

  setLoading(true);
   
  try {

    const formData = new FormData();
    formData.append('mobile', number);

    const response = await fetch(`${BASE_URL}send-otp`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    console.log("Send OTP Response Data:", data);
    if (data.debug_otp) {
      console.log("-------------------------------");
      console.log("YOUR OTP IS:", data.debug_otp);
      console.log("-------------------------------");
    }

    if (response.ok) {
          console.log(number)
      await setuserId(data.user_id);
      await setMobile(number);
      setLoading(false)
     Navigation.navigate('VerifyOTP')
      
    } else {

     console.log("sh")

    }

  } catch (error) {

    console.log(error,'jjj');

   

  } finally {

    setLoading(false);

  }
};
 return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
  <View style={styles.line} />

  <LottieView
    source={require("../Assets/Login.json")}
    autoPlay
    loop
    style={styles.animation}
  />

  <Text style={styles.title}>Welcome Back!</Text>

  <Text style={styles.subtitle}>
    Login with your mobile number to continue your shopping experience.
  </Text>

  <View style={styles.inputContainer}>
    <View style={styles.countryCode}>
      <Text style={styles.countryText}>🇮🇳 +91</Text>
    </View>

    <TextInput
      placeholder="Enter Mobile Number"
      placeholderTextColor="#999"
      keyboardType="number-pad"
      maxLength={10}
      value={number}
      onChangeText={setNumber}
      style={styles.input}
    />
  </View>

  <TouchableOpacity
    style={styles.loginBtn}
    onPress={handleLogin}
    disabled={loading}
  >
    {loading ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <>
        <Ionicons
          name="log-in-outline"
          size={20}
          color="#fff"
        />
        <Text style={styles.loginText}> Get OTP</Text>
      </>
    )}
  </TouchableOpacity>

  <Text style={styles.footerText}>
    By continuing, you agree to our{" "}
    <Text style={{ color: AllColors.primary, fontWeight: "600" }}>
      Terms & Conditions
    </Text>
  </Text>
</View>

        <CustomAlert
          visible={showAlert}
          message="Please enter a valid 10-digit mobile number"
          onClose={() => setShowAlert(false)}
        />
      </View>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
);
};

export default CommonLoginModal;

const styles = StyleSheet.create({

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },

modalContainer: {
  backgroundColor: "#fff",
  borderTopLeftRadius: 30,
  borderTopRightRadius: 30,
  paddingHorizontal: 22,
  paddingTop: 20,
  paddingBottom: 30,
},

line: {
  width: 65,
  height: 5,
  backgroundColor: "#D8D8D8",
  borderRadius: 20,
  alignSelf: "center",
  marginBottom: 10,
},

animation: {
  width: 180,
  height: 180,
  alignSelf: "center",
  marginBottom: 10,
},

title: {
  fontSize: 26,
  fontWeight: "700",
  color: AllColors.primary,
  textAlign: "center",
},

subtitle: {
  fontSize: 15,
  color: "#666",
  textAlign: "center",
  marginTop: 8,
  marginBottom: 25,
  lineHeight: 22,
},

inputContainer: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#E5E5E5",
  borderRadius: 14,
  overflow: "hidden",
  backgroundColor: "#FAFAFA",
},

countryCode: {
  backgroundColor: "#F2F2F2",
  paddingHorizontal: 15,
  height: 55,
  justifyContent: "center",
  borderRightWidth: 1,
  borderRightColor: "#E5E5E5",
},

countryText: {
  fontSize: 15,
  fontWeight: "600",
  color: "#333",
},

input: {
  flex: 1,
  height: 55,
  paddingHorizontal: 15,
  fontSize: 16,
  color: "#000",
},

loginBtn: {
  height: 55,
  borderRadius: 14,
  backgroundColor: AllColors.primary,
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "row",
  marginTop: 25,
},

loginText: {
  color: "#fff",
  fontSize: 17,
  fontWeight: "700",
},

footerText: {
  marginTop: 20,
  textAlign: "center",
  color: "#777",
  fontSize: 13,
  lineHeight: 20,
},
});