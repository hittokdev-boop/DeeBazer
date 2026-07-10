import React, { useEffect, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';

import AllColors from '../Constants/Color';
import CustomAlert from './Alert';
import {
  BASE_URL,
  getMobile,
  setToken,
} from '../Api/Api';

export default function VerifyOTP() {
  const navigation = useNavigation();

  const [otp, setOtp] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const [seconds, setSeconds] = useState(30);

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    const loadMobile = async () => {
      const number = await getMobile();
      if (number) {
        setMobile(number);
      }
    };

    loadMobile();
  }, []);

  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => {
        setSeconds(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [seconds]);

  const handleVerify = async () => {
   

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('mobile', mobile);
      formData.append('otp', otp);

      const response = await fetch(`${BASE_URL}verify-otp`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      console.log(data);

      if (response.ok && data.token) {
        await setToken(data.token);
        navigation.replace('AppTab');
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
    }
  };

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
      behavior={Platform.OS == 'ios' ? 'padding' : 'height'}>

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
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="------"
            placeholderTextColor="#bbb"
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