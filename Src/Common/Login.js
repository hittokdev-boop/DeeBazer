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

          <Text style={styles.title}>Login</Text>

          <Text style={styles.subtitle}>
            Please login to continue.
          </Text>

          <TextInput
            placeholder="Enter Mobile Number"
            placeholderTextColor="#999"
            style={styles.input}
            keyboardType="number-pad"
            maxLength={10}
            value={number}
            onChangeText={setNumber}
          />

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>Get OTP</Text>
            )}
          </TouchableOpacity>

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
  backgroundColor: '#fff',
  borderTopLeftRadius: 25,
  borderTopRightRadius: 25,
  padding: 20,
  maxHeight: '70%',
},

  line: {
    width: 60,
    height: 5,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    borderRadius: 10,
    marginBottom: 20,
  },

  closeBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 35,
    height: 35,
    borderRadius: 50,
    backgroundColor: '#f3f3f3',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: AllColors.primary,
    marginTop: 15,
  },

  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    marginTop: 5,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    color: '#000',
  },

  loginBtn: {
    height: 52,
    backgroundColor: AllColors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },

  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});