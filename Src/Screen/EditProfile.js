// screens/EditProfileScreen.js

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
PermissionsAndroid,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
 import {
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import { BASE_URL, getToken } from '../Api/Api';
const EditProfileScreen = ({navigation}) => {
  const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [mobile, setMobile] = useState('');
const [alternativePhone, setAlternativePhone] = useState('');
const [image, setImage] = useState('');

const [loading, setLoading] = useState(false);
 const onSave = async () => {
  const token = await getToken();

  try {
    const response = await fetch(`${BASE_URL}user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        
        email,
        mobile,
        name,
        alternativePhone,
      }),
     
    });
console.log(email,mobile,name,alternativePhone,'jkj')
    const data = await response.json();
         console.log(data)
    if (response.ok) {
      Alert.alert('Success', data.message);
      getProfileDetails();
    } else {
      Alert.alert('Error', data.message);
    }
  } catch (error) {
    console.log(error);
    Alert.alert('Error', 'Something went wrong');
  }
};

const [profileImage, setProfileImage] = useState('');
const requestCameraPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

const openCamera = async () => {
  const granted = await requestCameraPermission();

  if (!granted) {
    Alert.alert('Camera permission denied');
    return;
  }

  launchCamera(
    {
      mediaType: 'photo',
      quality: 0.8,
      saveToPhotos: true,
    },
    response => {
      if (response.didCancel) return;

      if (response.errorCode) {
        Alert.alert(response.errorMessage);
        return;
      }

      if (response.assets && response.assets.length > 0) {
        setProfileImage(response.assets[0].uri);
      }
    },
  );
};

const openGallery = () => {
  launchImageLibrary(
    {
      mediaType: 'photo',
      quality: 0.8,
    },
    response => {
      if (response.didCancel) return;

      if (response.errorCode) {
        Alert.alert(response.errorMessage);
        return;
      }

      if (response.assets && response.assets.length > 0) {
        setProfileImage(response.assets[0].uri);
      }
    },
  );
};

const selectImage = () => {
  Alert.alert(
    'Select Profile Picture',
    'Choose Image Source',
    [
      {
        text: 'Camera',
        onPress: openCamera,
      },
      {
        text: 'Gallery',
        onPress: openGallery,
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ],
  );
};
const getProfileDetails = async () => {
  const token = await getToken();

  try {
    setLoading(true);

    const response = await fetch(`${BASE_URL}me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
  
    if (data.status === 200 && data.user) {
      const user = data.user;
 console.log(user.alternativePhone)
      setName(user.name ?? '');
      setEmail(user.email ?? '');
      setMobile(user.mobile ?? '');
       setAlternativePhone(user.alternativePhone ?? '');
      setImage(user.avatar ?? '');
    }

    setLoading(false);
  } catch (error) {
    setLoading(false);
    console.log(error);
  }
};
useEffect(()=>{
           getProfileDetails()
},[])

 
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F7F8FA" barStyle="dark-content" />
{loading && (
  <View
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,.15)',
      zIndex: 100,
    }}>
    <ActivityIndicator size="large" color="#FF4D6D" />
  </View>
)}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 40}}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Edit Profile</Text>

          <View style={{width: 40}} />
        </View>

        {/* PROFILE IMAGE */}
        <View style={styles.profileSection}>
        <Image
  source={{
    uri:
      profileImage ||
      image ||
      'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
  }}
  style={styles.profileImage}
/>

          <TouchableOpacity style={styles.cameraBtn} onPress={selectImage}>
            <Ionicons name="camera" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* FORM */}
        <View style={styles.formContainer}>
          {/* FULL NAME */}
          <View style={styles.inputBox}>
            <Text style={styles.label}>Full Name</Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#777"
              />

              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter Full Name"
                placeholderTextColor="#999"
                style={styles.input}
              />
            </View>
          </View>

          {/* EMAIL */}
          <View style={styles.inputBox}>
            <Text style={styles.label}>Email</Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#777"
              />

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter Email"
                placeholderTextColor="#999"
                style={styles.input}
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* MOBILE */}
          <View style={styles.inputBox}>
            <Text style={styles.label}>Mobile</Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="call-outline"
                size={20}
                color="#777"
              />

              <TextInput
                value={mobile}
                onChangeText={setMobile}
                placeholder="Enter Mobile"
                placeholderTextColor="#999"
                style={styles.input}
                keyboardType="phone-pad"
              />
            </View>
          </View>

 {/* ALTERNATIVE PHONE */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>
            Alternative Phone
          </Text>

          <View style={styles.inputWrapper}>
            <Ionicons
              name="call-outline"
              size={20}
              color="#777"
            />

            <TextInput
              value={alternativePhone}
              onChangeText={setAlternativePhone}
              placeholder="Alternative Phone"
              placeholderTextColor="#999"
              style={styles.input}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        </View>

          {/* SAVE BUTTON */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={onSave}>
            <Text style={styles.saveText}>
              Save Changes
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },

  profileSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },

  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },

  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 120,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF4D6D',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },

  formContainer: {
    paddingHorizontal: 20,
  },

  inputBox: {
    marginBottom: 18,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 58,
    elevation: 2,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#111',
  },

  saveBtn: {
    height: 58,
    backgroundColor: '#FF4D6D',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },

  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});