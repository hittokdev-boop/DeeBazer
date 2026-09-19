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
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import OtpVerify from '@pushpendersingh/react-native-otp-verify';

import AllColors from '../../Constants/Color';
import CustomAlert from '../../Common/Alert';
import { useTheme } from '../../Context/ThemeContext';
import {
  BASE_URL,
  getMobile,
  setToken,
  setuserId,
  getDeviceId,
} from '../../Api/Api';
import { getFcmToken } from '../../Services/NotificationService';

export default function VerifyOTP() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDarkMode } = useTheme();

  const [otp, setOtp] = useState('');
  const [mobile, setMobile] = useState(route.params?.mobile || '');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(30);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Refs to avoid stale closures
  const autoSubmittedRef = useRef(false);
  const otpRef = useRef('');
  const mobileRef = useRef(route.params?.mobile || '');
  const loadingRef = useRef(false);
  const deviceIdRef = useRef(route.params?.device_id || '');
  const textInputRef = useRef(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerProgressAnim = useRef(new Animated.Value(1)).current;

  // Pulse ring animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Timer countdown progress animation
  useEffect(() => {
    if (seconds > 0) {
      Animated.timing(timerProgressAnim, {
        toValue: seconds / 30,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    } else {
      timerProgressAnim.setValue(0);
    }
  }, [seconds]);

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
    if (Platform.OS === 'android') {
      try {
        if (OtpVerify && typeof OtpVerify.getOtp === 'function') {
          OtpVerify.getHash()?.then(hash => { })?.catch(() => { });
          OtpVerify.getOtp()
            ?.then(() => OtpVerify.addListener?.(otpHandler))
            ?.catch((err) => console.log('OtpVerify error:', err));
        }
      } catch (err) {
        console.log('OtpVerify native module error:', err);
      }

      return () => {
        try { OtpVerify?.removeListener?.(); } catch (e) { }
      };
    }
  }, []);

  const otpHandler = (message) => {
    try {
      if (message) {
        const match = /(\d{4,6})/.exec(message);
        if (match && match[1]) {
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

  const handleVerifyWithOtp = async (otpToVerify) => {
    const code = String(otpToVerify ?? '').trim();
    if (!code || code.length < 4) {
      setAlertMessage('Please enter a valid 4-digit OTP code');
      setShowAlert(true);
      return;
    }

    try {
      setLoading(true);
      loadingRef.current = true;

      if (!deviceIdRef.current) {
        deviceIdRef.current = await getDeviceId();
      }
      const fcmToken = await getFcmToken();

      const formData = new FormData();
      formData.append('mobile', mobileRef.current);
      formData.append('otp', code);
      formData.append('device_id', deviceIdRef.current);
      if (fcmToken) {
        formData.append('fcm_token', fcmToken);
      }
      formData.append('device_type', Platform.OS);

      const response = await fetch(`${BASE_URL}verify-otp`, {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();
      let data = {};
      try {
        data = JSON.parse(responseText);
      } catch (err) {
        console.log('Verify OTP response parse error:', responseText);
      }

      const tokenVal = data.token || data.access_token || data.data?.token || data.user?.token;
      const userIdVal = data.user?.id || data.user_id || data.data?.id;

      if ((response.ok || data.status === 200 || data.status === '200') && tokenVal) {
        await setToken(tokenVal);
        if (userIdVal) {
          await setuserId(userIdVal);
        }
        if (mobileRef.current) {
          await setMobile(mobileRef.current);
        }
        navigation.reset({
          index: 0,
          routes: [{ name: 'AppTab' }],
        });
      } else {
        setAlertMessage(data.message || 'Invalid OTP. Please check and try again.');
        setShowAlert(true);
      }
    } catch (e) {
      setAlertMessage('Something went wrong. Please check your network connection.');
      setShowAlert(true);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const handleVerify = () => {
    handleVerifyWithOtp(otpRef.current || otp);
  };

  // Auto-submit when OTP hits 4 digits
  useEffect(() => {
    const trimmed = otp.trim();
    otpRef.current = trimmed;

    if (
      trimmed &&
      trimmed.length === 4 &&
      !loadingRef.current &&
      !autoSubmittedRef.current
    ) {
      autoSubmittedRef.current = true;
      const timer = setTimeout(() => {
        handleVerifyWithOtp(trimmed);
      }, 350);
      return () => clearTimeout(timer);
    }

    if (!trimmed || trimmed.length !== 4) {
      autoSubmittedRef.current = false;
    }
  }, [otp]);

  const handleResendOTP = async () => {
    try {
      setLoading(true);

      const deviceId = deviceIdRef.current || (await getDeviceId());
      const fcmToken = await getFcmToken();

      const formData = new FormData();
      formData.append('mobile', mobile);
      formData.append('device_id', deviceId);
      if (fcmToken) {
        formData.append('fcm_token', fcmToken);
      }
      formData.append('device_type', Platform.OS);

      const response = await fetch(`${BASE_URL}send-otp`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setAlertMessage('OTP Sent Successfully! Please check your mobile inbox.');
        setShowAlert(true);
        setSeconds(30);
      } else {
        setAlertMessage(data.message || 'Unable to resend OTP at this moment.');
        setShowAlert(true);
      }
    } catch (e) {
      setAlertMessage('Network Error. Please try again.');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const renderOtpBoxes = () => {
    const boxes = [0, 1, 2, 3];
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => textInputRef.current?.focus()}
        style={styles.otpBoxesContainer}
      >
        {boxes.map((index) => {
          const char = otp[index] || '';
          const isFocused = isInputFocused && (otp.length === index || (index === 3 && otp.length === 4));
          const isFilled = Boolean(char);

          return (
            <View
              key={index}
              style={[
                styles.otpBox,
                {
                  backgroundColor: isDarkMode
                    ? (isFilled ? '#1E1B2E' : '#0F172A')
                    : (isFilled ? AllColors.softPinkBg : '#FAF5F8'),
                  borderColor: isFocused
                    ? AllColors.primary
                    : isFilled
                      ? AllColors.primary
                      : (isDarkMode ? '#334155' : AllColors.borderLight),
                },
                isFocused && styles.otpBoxFocused,
              ]}
            >
              <Text
                style={[
                  styles.otpBoxText,
                  { color: isFilled ? AllColors.primary : theme.textPrimary },
                ]}
              >
                {char}
              </Text>
            </View>
          );
        })}
      </TouchableOpacity>
    );
  };

  const completionPercent = Math.min(100, Math.round((otp.length / 4) * 100));

  return (
    <KeyboardAvoidingView
      style={[styles.keyboardContainer, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={[styles.scrollContainer, { backgroundColor: theme.bg }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar Navigation */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={[
                styles.backButton,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderColor: isDarkMode ? '#334155' : AllColors.borderLight,
                },
              ]}
              onPress={() => navigation.goBack()}>
              <Ionicons
                name="arrow-back"
                size={20}
                color={theme.textPrimary}
              />
            </TouchableOpacity>

            {/* <View
              style={[
                styles.secureBadge,
                {
                  backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                  borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.4)' : '#A7F3D0',
                },
              ]}>
              <Ionicons name="shield-checkmark" size={14} color="#10B981" />
              <Text style={styles.secureBadgeText}>256-bit Encrypted</Text>
            </View> */}
          </View>

          {/* Main Professional Card */}
          <View
            style={[
              styles.mainCard,
              {
                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderColor: isDarkMode ? '#334155' : '#F1F5F9',
              },
            ]}>

            {/* Animated Shield Header Icon */}
            <View style={styles.headerIconSection}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    backgroundColor: isDarkMode ? 'rgba(247, 22, 112, 0.18)' : 'rgba(247, 22, 112, 0.12)',
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: isDarkMode ? '#2D1B36' : AllColors.softPinkBg,
                  },
                ]}>
                <Ionicons
                  name="shield-checkmark"
                  color={AllColors.primary}
                  size={44}
                />
              </View>
            </View>

            {/* Title & Subtitle */}
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              Verification Code
            </Text>

            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Please enter the 4-digit verification code sent to your mobile number
            </Text>

            {/* Mobile Number Chip with Edit Option */}
            <View
              style={[
                styles.mobileContainer,
                {
                  backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                  borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                },
              ]}>
              <Ionicons name="call" size={15} color={AllColors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.mobileText, { color: theme.textPrimary }]}>
                +91 {mobile || 'XXXXXXXXXX'}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[styles.editBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}>
                <Ionicons name="pencil" size={13} color={AllColors.primary} />
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* OTP Boxes Grid */}
            {renderOtpBoxes()}

            {/* Progress Bar under OTP Boxes */}
            <View style={[styles.progressTrack, { backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9' }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${completionPercent}%`, backgroundColor: AllColors.primary },
                ]}
              />
            </View>

            {/* Auto-verifying Banner */}
            {otp.length === 4 && loading && (
              <View style={[styles.verifyingBanner, { backgroundColor: isDarkMode ? '#2D1B36' : AllColors.softPinkBg }]}>
                <ActivityIndicator size="small" color={AllColors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.verifyingBannerText, { color: AllColors.primary }]}>
                  Auto-verifying code...
                </Text>
              </View>
            )}

            {/* Hidden TextInput for Native Soft Keyboard */}
            <TextInput
              ref={textInputRef}
              value={otp}
              onChangeText={(text) => {
                autoSubmittedRef.current = false;
                setOtp(text);
              }}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              keyboardType="number-pad"
              maxLength={4}
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              style={styles.hiddenInput}
            />

            {/* Verify Action Button */}
            <TouchableOpacity
              style={[
                styles.verifyBtn,
                { opacity: otp.length < 4 || loading ? 0.75 : 1 },
              ]}
              onPress={handleVerify}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.verifyText}>Verify & Proceed</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>

            {/* Countdown Bar & Resend Timer */}
            {seconds > 0 ? (
              <View style={[styles.timerCard, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }]}>
                <View style={styles.timerRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="time-outline" size={16} color={theme.textSecondary} style={{ marginRight: 6 }} />
                    <Text style={[styles.timerText, { color: theme.textSecondary }]}>
                      Resend OTP in
                    </Text>
                  </View>
                  <Text style={[styles.timerSeconds, { color: AllColors.primary }]}>
                    00:{seconds < 10 ? `0${seconds}` : seconds}
                  </Text>
                </View>

                {/* Animated Countdown Bar */}
                <View style={[styles.timerTrack, { backgroundColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
                  <Animated.View
                    style={[
                      styles.timerFill,
                      {
                        width: timerProgressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                        backgroundColor: AllColors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleResendOTP}
                style={[
                  styles.resendBtn,
                  {
                    backgroundColor: isDarkMode ? '#2D1B36' : AllColors.softPinkBg,
                    borderColor: isDarkMode ? 'rgba(247, 22, 112, 0.4)' : '#FCE7F3',
                  },
                ]}
                activeOpacity={0.8}>
                <Ionicons name="refresh-circle" size={22} color={AllColors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.resendText}>Resend OTP Code</Text>
              </TouchableOpacity>
            )}

          </View>

          <CustomAlert
            visible={showAlert}
            message={alertMessage}
            onClose={() => setShowAlert(false)}
          />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 45 : 14,
    paddingBottom: 30,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  secureBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 5,
  },
  mainCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    elevation: 6,
    shadowColor: AllColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  headerIconSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  iconCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: AllColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  mobileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 14,
    marginBottom: 20,
  },
  mobileText: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 8,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  editText: {
    fontSize: 12,
    fontWeight: '700',
    color: AllColors.primary,
    marginLeft: 3,
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginVertical: 12,
  },
  otpBox: {
    width: 58,
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFocused: {
    borderWidth: 2,
    borderColor: AllColors.primary,
    transform: [{ scale: 1.05 }],
    elevation: 3,
    shadowColor: AllColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  otpBoxText: {
    fontSize: 22,
    fontWeight: '800',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  verifyingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  verifyingBannerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  verifyBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: AllColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 4,
    shadowColor: AllColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifyText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  timerCard: {
    borderRadius: 16,
    padding: 12,
    marginTop: 18,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  timerSeconds: {
    fontSize: 14,
    fontWeight: '700',
  },
  timerTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: 2,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 18,
  },
  resendText: {
    color: AllColors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});