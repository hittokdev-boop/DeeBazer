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
  Linking,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';

import AllColors from '../../Constants/Color';
import CustomAlert from '../../Common/Alert';
import { BASE_URL, setMobile as saveMobile, setuserId, getDeviceId } from '../../Api/Api';
import { getFcmToken } from '../../Services/NotificationService';
import LottieView from 'lottie-react-native';
import { useNavigation } from "@react-navigation/native";
import { useTheme } from '../../Context/ThemeContext';

const CommonLoginModal = () => {
  const { theme, isDarkMode } = useTheme();

  const [mobile, setMobileState] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const Navigation = useNavigation();

  const handleSendOtp = async () => {
    const cleanMobile = mobile.trim();
    if (!cleanMobile || cleanMobile.length !== 10) {
      setAlertMessage("Please enter a valid 10-digit mobile number");
      setShowAlert(true);
      return;
    }
    setLoading(true);

    try {
      const deviceId = await getDeviceId();
      const fcmToken = await getFcmToken();
      const deviceType = Platform.OS;

      console.log('📲 [Login] Sending OTP with payload:', {
        mobile: cleanMobile,
        device_id: deviceId,
        fcm_token: fcmToken,
        device_type: deviceType,
      });

      const formData = new FormData();
      formData.append('mobile', cleanMobile);
      formData.append('device_id', deviceId);
      if (fcmToken) {
        formData.append('fcm_token', fcmToken);
      }
      formData.append('device_type', deviceType);

      const response = await fetch(`${BASE_URL}send-otp`, {
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
      } catch (e) {
        console.log("Failed to parse JSON response", responseText);
      }

      if (response.ok) {
        if (data.user_id) await setuserId(data.user_id);
        await saveMobile(cleanMobile);
        setLoading(false);
        Navigation.navigate('VerifyOTP', {
          mobile: cleanMobile,
          device_id: deviceId,
        });
      } else {
        const errorMsg = data.message || 'Failed to send OTP. Please check your mobile number.';
        setAlertMessage(errorMsg);
        setShowAlert(true);
      }
    } catch (error) {
      console.log(error, 'Send OTP error');
      setAlertMessage('Network Error: Unable to send OTP.');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.cardBg }]}>
            <View style={[styles.line, { backgroundColor: theme.borderColor }]} />

            <LottieView
              source={require("../../Assets/Login.json")}
              autoPlay
              loop
              style={styles.animation}
            />

            <Text style={styles.title}>Login / Sign Up</Text>

            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Enter your mobile number to receive a 4-digit OTP code.
            </Text>

            <View style={[styles.inputContainer, { backgroundColor: isDarkMode ? '#0F172A' : AllColors.inputBg, borderColor: theme.borderColor }]}>
              <View style={[styles.countryCode, { backgroundColor: isDarkMode ? '#1E293B' : AllColors.lightGrey, borderRightColor: theme.borderColor }]}>
                <Text style={[styles.countryText, { color: theme.textPrimary }]}>+91</Text>
              </View>
              <Ionicons name="call-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                placeholder="Mobile Number"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                maxLength={10}
                value={mobile}
                onChangeText={setMobileState}
                style={[styles.input, { color: theme.textPrimary }]}
              />
            </View>

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={AllColors.white} />
              ) : (
                <>
                  <Text style={styles.loginText}>Get OTP </Text>
                  <Ionicons
                    name="arrow-forward-circle-outline"
                    size={22}
                    color={AllColors.white}
                  />
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              By continuing, you agree to our{" "}
              <Text
                onPress={() => Navigation.navigate('TermsCondition')}
                style={styles.linkText}
              >
                Terms & Conditions
              </Text>
            </Text>
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
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: AllColors.modalOverlay,
    justifyContent: 'flex-end',
  },

  modalContainer: {
    backgroundColor: AllColors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 30,
  },

  line: {
    width: 65,
    height: 5,
    backgroundColor: AllColors.lightGrey,
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
    color: AllColors.slateSub,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 25,
    lineHeight: 22,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: AllColors.borderLight,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: AllColors.inputBg,
  },

  inputIcon: {
    marginLeft: 12,
    marginRight: 5,
  },

  linkText: {
    color: AllColors.primary,
    fontWeight: "600",
  },

  countryCode: {
    backgroundColor: AllColors.lightGrey,
    paddingHorizontal: 15,
    height: 55,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: AllColors.borderLight,
  },

  countryText: {
    fontSize: 15,
    fontWeight: "600",
    color: AllColors.slateText,
  },

  input: {
    flex: 1,
    height: 55,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    color: AllColors.black,
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
    color: AllColors.white,
    fontSize: 17,
    fontWeight: "700",
  },

  footerText: {
    marginTop: 20,
    textAlign: "center",
    color: AllColors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
});