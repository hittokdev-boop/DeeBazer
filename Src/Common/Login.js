// components/CommonLoginModal.js

import React, { useState } from 'react';

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
import { BASE_URL, setMobile, setuserId, getDeviceId, setToken, setPassword as saveApiPassword } from '../Api/Api';
import LottieView from 'lottie-react-native';
import { useNavigation } from "@react-navigation/native";
const CommonLoginModal = () => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const Navigation = useNavigation()

  const handleLogin = async () => {
    if (!email || !password) {
      setAlertMessage("Please enter email and password");
      setShowAlert(true);
      return;
    }
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const response = await fetch(`${BASE_URL}login`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        },
        body: formData,
      });

      const responseText = await response.text();
      let data = {};

      try {
        data = JSON.parse(responseText);
        // console.log(data)
      } catch (e) {
        console.log("Failed to parse JSON response", responseText);
      }

      if (response.ok && data.token) {
        // Save user token and ID
        await setToken(data.token);
        if (data.user && data.user.id) {
          await setuserId(data.user.id);
        }
        await saveApiPassword(password);
        setLoading(false);
        // Navigate to AppTab
        Navigation.reset({
          index: 0,
          routes: [{ name: 'AppTab' }],
        });
      } else {
        const errorMsg = data.message || `Login failed. Error Code: ${response.status}`;
        setAlertMessage(errorMsg);
        setShowAlert(true);
      }
    } catch (error) {
      console.log(error, 'Login error');
      setAlertMessage(`Network Error: ${error.message}`);
      setShowAlert(true);
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
              Login with your email and password to continue your shopping experience.
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={{ marginLeft: 15, marginRight: 5 }} />
              <TextInput
                placeholder="Enter Email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
              />
            </View>

            <View style={[styles.inputContainer, { marginTop: 15 }]}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={{ marginLeft: 15, marginRight: 5 }} />
              <TextInput
                placeholder="Enter Password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                style={styles.input}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 10, marginRight: 5 }}>
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#666" />
              </TouchableOpacity>
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
                  <Text style={styles.loginText}> Login</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.footerText}>
              By continuing, you agree to our{" "}
              <Text
                onPress={() => Navigation.navigate('TermsCondition')}
                style={{ color: AllColors.primary, fontWeight: "600" }}
              >
                Terms & Conditions
              </Text>
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 15 }}>
              <Text style={{ color: '#777', fontSize: 14 }}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => Navigation.navigate('Register')}>
                <Text style={{ color: AllColors.primary, fontSize: 14, fontWeight: '700' }}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>

          <CustomAlert
            visible={showAlert}
            message={alertMessage}
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