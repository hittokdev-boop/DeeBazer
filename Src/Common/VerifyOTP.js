import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import OtpVerify from '@pushpendersingh/react-native-otp-verify';

import AllColors from '../Constants/Color';
import CustomAlert from './Alert';
import {
  BASE_URL,
  getMobile,
  setToken,
  getDeviceId,
} from '../Api/Api';

export default function VerifyOTP() {
  const navigation = useNavigation();
  const route = useRoute();

  const [otp, setOtp] = useState('');
  const [mobile, setMobile] = useState(route.params?.mobile || '');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(30);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Refs to avoid stale closures
  const autoSubmittedRef = useRef(false);
  const otpRef = useRef('');
  const mobileRef = useRef(route.params?.mobile || '');
  const loadingRef = useRef(false);
  const deviceIdRef = useRef(route.params?.device_id || '');

  // Keep refs in sync
  useEffect(() => {
    mobileRef.current = mobile;
  }, [mobile]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    const loadMobile = async () => {
      const number = await getMobile();
      if (number) {
        setMobile(number);
        mobileRef.current = number;
      }
    };
    if (!route.params?.mobile) {
      loadMobile();
    }
  }, [route.params?.mobile]);


  // Listen for incoming SMS OTP on Android
  useEffect(() => {
    if (Platform.OS === 'android' && OtpVerify?.getOtp) {
      OtpVerify.getHash().then(hash => {
        console.log('📱 APP SIGNATURE HASH (Add this to backend SMS template):', hash);
      });
      OtpVerify.getOtp()
        .then(() => OtpVerify.addListener(otpHandler))
        .catch((err) => console.log('OtpVerify error:', err));

      return () => {
        try { OtpVerify.removeListener(); } catch (e) {}
      };
    }
  }, []);

  const otpHandler = (message) => {
    try {
      if (message) {
        const match = /(\d{4,6})/.exec(message);
        if (match && match[1]) {
          console.log('✅ Auto-read OTP from SMS:', match[1]);
          autoSubmittedRef.current = false;
          otpRef.current = match[1];
          setOtp(match[1]);
        }
      }
    } catch (e) {
      console.log('OTP Parse Error:', e);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => setSeconds(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [seconds]);

  // ✅ Core verify — reads from refs, no stale closure
  const handleVerifyWithOtp = async (otpToVerify) => {
    const code = String(otpToVerify ?? '').trim();
    if (!code || code.length < 4) {
      setAlertMessage('Please enter valid OTP');
      setShowAlert(true);
      return;
    }

    try {
      setLoading(true);
      loadingRef.current = true;

      // Load device_id — from route params or AsyncStorage fallback
      if (!deviceIdRef.current) {
        deviceIdRef.current = await getDeviceId();
      }

      const formData = new FormData();
      formData.append('mobile', mobileRef.current);
      formData.append('otp', code);
      formData.append('device_id', deviceIdRef.current);

      console.log('🔐 Verifying OTP:', code, '| Mobile:', mobileRef.current, '| Device:', deviceIdRef.current);

      const response = await fetch(`${BASE_URL}verify-otp`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('Verify OTP Response:', data);

      if (response.ok && data.token) {
        await setToken(data.token);
        navigation.reset({
          index: 0,
          routes: [{ name: 'AppTab' }],
        });
      } else {
        setAlertMessage(data.message || 'Invalid OTP');
        setShowAlert(true);
      }
    } catch (e) {
      console.log(e);
      setAlertMessage('Something went wrong');
      setShowAlert(true);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const handleVerify = () => {
    handleVerifyWithOtp(otpRef.current || otp);
  };

  // ✅ Auto-submit when OTP hits 4 or 6 digits — no circular dependency
  useEffect(() => {
    const trimmed = otp.trim();
    otpRef.current = trimmed;

    if (
      trimmed &&
      (trimmed.length === 4 || trimmed.length === 6) &&
      !loadingRef.current &&
      !autoSubmittedRef.current
    ) {
      autoSubmittedRef.current = true;
      const timer = setTimeout(() => {
        handleVerifyWithOtp(trimmed);
      }, 350);
      return () => clearTimeout(timer);
    }

    if (!trimmed || (trimmed.length !== 4 && trimmed.length !== 6)) {
      autoSubmittedRef.current = false;
    }
  }, [otp]);

  const handleResendOTP = async () => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('mobile', mobile);

      const response = await fetch(`${BASE_URL}send-otp`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      console.log(data);

      if (response.ok) {
        setAlertMessage('OTP Sent Successfully');
        setShowAlert(true);
        setSeconds(30);
      } else {
        setAlertMessage(data.message || 'Unable to resend OTP');
        setShowAlert(true);
      }
    } catch (e) {
      console.log(e);
      setAlertMessage('Network Error');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>

          {/* <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>

            <Ionicons
              name="arrow-back"
              size={24}
              color="#000"
            />

          </TouchableOpacity> */}

          <View style={styles.iconContainer}>
            <Ionicons
              name="shield-checkmark"
              color={AllColors.primary}
              size={55}
            />
          </View>

          <Text style={styles.title}>
            Verify OTP
          </Text>

          <Text style={styles.subtitle}>
            We've sent a verification code to
          </Text>

          <Text style={styles.mobile}>
            +91 {mobile}
          </Text>

          <TextInput
            value={otp}
            onChangeText={(text) => {
              autoSubmittedRef.current = false;
              setOtp(text);
            }}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="------"
            placeholderTextColor="#bbb"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            style={styles.input}
          />

          <TouchableOpacity
            style={styles.verifyBtn}
            onPress={handleVerify}
            disabled={loading}>

            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyText}>
                Verify OTP
              </Text>
            )}

          </TouchableOpacity>

          {seconds > 0 ? (
            <Text style={styles.timer}>
              Resend OTP in {seconds}s
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResendOTP}>
              <Text style={styles.resend}>
                Resend OTP
              </Text>
            </TouchableOpacity>
          )}

          <CustomAlert
            visible={showAlert}
            message={alertMessage}
            onClose={() => setShowAlert(false)}
          />

        </View>
      </TouchableWithoutFeedback>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },

  backButton: {
    position: 'absolute',
    top: 55,
    left: 20,
  },

  iconContainer: {
    width: 95,
    height: 95,
    borderRadius: 50,
    backgroundColor: '#EEF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 25,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 15,
    color: '#777',
    textAlign: 'center',
    marginTop: 12,
  },

  mobile: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 35,
    color: '#000',
  },

  input: {
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FAFAFA',
    textAlign: 'center',
    fontSize: 28,
    letterSpacing: 15,
    fontWeight: '700',
    color: '#000',
  },

  verifyBtn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: AllColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    elevation: 4,
  },

  verifyText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
  },

  timer: {
    textAlign: 'center',
    marginTop: 22,
    color: '#888',
    fontSize: 15,
  },

  resend: {
    textAlign: 'center',
    marginTop: 22,
    color: AllColors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
});