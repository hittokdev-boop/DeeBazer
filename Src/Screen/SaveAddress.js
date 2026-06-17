import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  TouchableOpacity,
  ScrollView,PermissionsAndroid, Platform
} from "react-native";

import Ionicons from 'react-native-vector-icons/Ionicons';
import { BASE_URL, getToken } from "../Api/Api";


export default function SaveAddress() {
  const [stateName, setStateName] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');


const handleSave = async () => {
  const token = await getToken();
//  console.log(token)
  try {
    const response = await fetch(`${BASE_URL}me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

   
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};
const getCurrentLocation  = async () => {
  const token = await getToken();
  
  try {
    const response = await fetch(`${BASE_URL}user/profile`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        mobile: '6289833491',
        state: 'Karnataka',
        city: 'Bangalore',
        zipCode: '560001',
        address: '123 Main Street',
        landmark: 'Near Park',
        alternativePhone: '9876543211',
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Profile Updated:', data);
    } else {
      console.log('API Error:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
 

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.formContainer}>

        {/* HEADER */}
        <View style={styles.topSection}>
          <Text style={styles.title}>Save Address</Text>
          <Text style={styles.subtitle}>
            Add your delivery address details
          </Text>
        </View>
   
        {/* STATE */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>State</Text>

          <View style={styles.inputWrapper}>
            <Ionicons
              name="map-outline"
              size={20}
              color="#777"
            />

            <TextInput
              value={stateName}
              onChangeText={setStateName}
              placeholder="Enter State"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>
        </View>

        {/* CITY */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>City</Text>

          <View style={styles.inputWrapper}>
            <Ionicons
              name="business-outline"
              size={20}
              color="#777"
            />

            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="Enter City"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>
        </View>

        {/* ZIP CODE */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Zip Code</Text>

          <View style={styles.inputWrapper}>
            <Ionicons
              name="location-outline"
              size={20}
              color="#777"
            />

            <TextInput
              value={zipCode}
              onChangeText={setZipCode}
              placeholder="Enter Zip Code"
              placeholderTextColor="#999"
              style={styles.input}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* ADDRESS */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Address</Text>

          <View style={[styles.inputWrapper, { height: 90 }]}>
            <Ionicons
              name="home-outline"
              size={20}
              color="#777"
              style={{ alignSelf: 'flex-start', marginTop: 15 }}
            />

            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Enter Full Address"
              placeholderTextColor="#999"
              style={[styles.input, { textAlignVertical: 'top', marginTop: 14 }]}
              multiline
            />
          </View>
        </View>

        {/* LANDMARK */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Landmark</Text>

          <View style={styles.inputWrapper}>
            <Ionicons
              name="pin-outline"
              size={20}
              color="#777"
            />

            <TextInput
              value={landmark}
              onChangeText={setLandmark}
              placeholder="Enter Landmark"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>
        </View>
            {/*   curremtLocation */}
           <TouchableOpacity style={styles.locationBtn} onPress={getCurrentLocation}>
          <Ionicons name="location-outline" size={20} color="#fff" />
          <Text style={styles.locationText}>Use Current Location</Text>
        </TouchableOpacity>       

        {/* SAVE BUTTON */}
        <TouchableOpacity
          style={styles.saveBtn}
          activeOpacity={0.8}
          onPress={handleSave}
        >
          <Ionicons
            name="save-outline"
            size={20}
            color="#fff"
          />

          <Text style={styles.saveText}>
            Save Address
          </Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 40,
  },

  topSection: {
    marginBottom: 25,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
  },

  subtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
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
locationBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FF4D88',
  paddingVertical: 14,
  borderRadius: 12,
  marginTop: 15,
},

locationText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
  marginLeft: 8,
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
    flexDirection: 'row',
  },

  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});