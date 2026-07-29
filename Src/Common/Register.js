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
  ScrollView
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AllColors from '../Constants/Color';
import CustomAlert from './Alert';
import { launchImageLibrary } from 'react-native-image-picker';
import { BASE_URL, setToken, getDeviceId, setuserId, setMobile as saveMobile, setPassword as saveApiPassword } from '../Api/Api';
import { useNavigation } from "@react-navigation/native";
import LottieView from 'lottie-react-native';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const navigation = useNavigation();

  const handleRegister = async () => {
    if (!name || !email || !mobile || !password) {
      setAlertMessage("Please fill all required fields");
      setShowAlert(true);
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('mobile', mobile);
      formData.append('password', password);
      formData.append('role', 'user');

      const response = await fetch(`${BASE_URL}register`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
      });

      const responseText = await response.text();
      // console.log('Register Raw Response:', responseText);

      let data = {};
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.log("Failed to parse JSON response");
      }

      if (response.ok) {
        if(data.token) {
          await setToken(data.token);
        }
        await saveApiPassword(password);

        // Send OTP
        try {
          const deviceId = await getDeviceId();
          const otpFormData = new FormData();
          otpFormData.append('mobile', mobile);
          otpFormData.append('device_id', deviceId);

          const otpResponse = await fetch(`${BASE_URL}send-otp`, {
            method: 'POST',
            body: otpFormData,
          });

          const otpData = await otpResponse.json();

          if (otpResponse.ok) {
            if (otpData.user_id) await setuserId(otpData.user_id);
            await saveMobile(mobile);
            
            navigation.navigate('VerifyOTP', {
              mobile: mobile,
              device_id: deviceId,
            });
          } else {
            setAlertMessage(otpData.message || 'Failed to send OTP.');
            setShowAlert(true);
          }
        } catch (e) {
          console.log('OTP Send Error', e);
          setAlertMessage('Could not send OTP.');
          setShowAlert(true);
        }
      } else {
        // Handle Laravel style validation errors
        let errorMsg = data.message || 'Registration failed';
        if (data.errors) {
          const firstErrorKey = Object.keys(data.errors)[0];
          if (firstErrorKey) {
            errorMsg = data.errors[firstErrorKey][0] || errorMsg;
          }
        }
        setAlertMessage(errorMsg);
        setShowAlert(true);
      }
    } catch (error) {
      console.log(error, 'Register error');
      setAlertMessage('Something went wrong. Please try again.');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container}>
          <TouchableOpacity 
             style={styles.backBtn}
             onPress={() => navigation.goBack()}
          >
             <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <LottieView
            source={require("../Assets/register.json")}
            autoPlay
            loop
            style={{ width: '100%', height: 200, alignSelf: 'center', marginBottom: 10 }}
          />

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Register to start your shopping experience.
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.icon} />
            <TextInput
              placeholder="Full Name *"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
            <TextInput
              placeholder="Email *"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#666" style={styles.icon} />
            <TextInput
              placeholder="Mobile Number *"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              maxLength={10}
              value={mobile}
              onChangeText={setMobile}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
            <TextInput
              placeholder="Password *"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{padding: 5}}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerText}>Register</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginRow}>
             <Text style={styles.footerText}>Already have an account? </Text>
             <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                 <Text style={styles.loginLink}>Login</Text>
             </TouchableOpacity>
          </View>

        </ScrollView>
      </TouchableWithoutFeedback>
      
      <CustomAlert
        visible={showAlert}
        message={alertMessage}
        onClose={() => setShowAlert(false)}
      />
    </KeyboardAvoidingView>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: '#fff'
  },
  backBtn: {
    marginBottom: 20
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: AllColors.primary,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 30,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 10,
    marginBottom: 15
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 14,
    backgroundColor: "#FAFAFA",
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
  },
  icon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  logoBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 14,
    backgroundColor: "#FAFAFA",
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
    borderStyle: 'dashed',
  },
  registerBtn: {
    height: 55,
    borderRadius: 14,
    backgroundColor: AllColors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    elevation: 3,
  },
  registerText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  footerText: {
    color: "#777",
    fontSize: 15,
  },
  loginLink: {
    color: AllColors.primary,
    fontSize: 15,
    fontWeight: '700'
  }
});
