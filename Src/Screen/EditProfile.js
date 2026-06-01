// screens/EditProfileScreen.js

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,

} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const EditProfileScreen = ({navigation}) => {
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john@example.com');
  const [mobile, setMobile] = useState('9876543210');
  const [stateName, setStateName] = useState('Karnataka');
  const [city, setCity] = useState('Bangalore');
  const [zipCode, setZipCode] = useState('560001');
  const [address, setAddress] = useState('123 Main Street');
  const [landmark, setLandmark] = useState('Near Park');
  const [alternativePhone, setAlternativePhone] =
    useState('9876543211');

  const onSave = () => {
    const body = {
      name,
      email,
      mobile,
      state: stateName,
      city,
      zipCode,
      address,
      landmark,
      alternativePhone,
    };

    console.log('PROFILE BODY => ', body);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F7F8FA" barStyle="dark-content" />

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
              uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            }}
            style={styles.profileImage}
          />

          <TouchableOpacity style={styles.cameraBtn}>
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