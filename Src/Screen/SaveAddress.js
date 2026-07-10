import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  TouchableOpacity,
  ScrollView,PermissionsAndroid, Platform,
  Alert
} from "react-native";

import Ionicons from 'react-native-vector-icons/Ionicons';
import { BASE_URL, getToken, getuserId } from "../Api/Api";
import CustomAlert from "../Common/Alert";
import SuccessModal from "../Common/SuccessScreen";
import AllColors from "../Constants/Color";


export default function SaveAddress() {
  const [stateName, setStateName] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setpinCode] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
const [name, setName] = useState('');
const [mobile, setMobile] = useState('');
const [houseNo, setHouseNo] = useState('');
const [roadName, setRoadName] = useState('');
const [typeType, setTypeType] = useState('Home');
  const [showAlert, setShowAlert] = useState(false);
  const [errorText,setErrorText]=useState('')
 const [isSuccess,setIsSuccess]=useState(false)
const saveAddress = async () => {
  const token = await getToken();
  const ID = await getuserId();

  if (!name || !mobile || !zipCode || !stateName || !city || !houseNo) {
    Alert.alert("Validation", "Please fill all required fields.");
    return;
  }

  try {
    const formData = new FormData();

    formData.append("user_id", String(ID));
    formData.append("name", name);
    formData.append("mobile", mobile);
    formData.append("pin", zipCode);
    formData.append("state", stateName);
    formData.append("city", city);
    formData.append("house_no", houseNo);
    formData.append("road_name", roadName);
    formData.append("landmark", landmark);
    formData.append("address", address);
    formData.append("type", typeType);
    formData.append("status", "1");

    console.log("Token :", token);

    const response = await fetch(`${BASE_URL}save-address`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const text = await response.text();

    console.log("HTTP Status :", response.status);
    console.log("Response :", text);

    let data = {};

    try {
      data = JSON.parse(text);
    } catch (e) {}

    if (response.status) {
      setIsSuccess(true);
    } else {
      Alert.alert(
        "Error",
        data.message || "Unable to save address."
      );
    }
  } catch (error) {
    console.log("Save Address Error :", error);
    Alert.alert("Error", "Something went wrong.");
  }
};
const getCurrentLocation = async () => {
 
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
        <View style={styles.inputBox}>
  <Text style={styles.label}>Name</Text>
  <View style={styles.inputWrapper}>
    <TextInput
      value={name}
      onChangeText={setName}
      placeholder="Enter Name"
      style={styles.input}
    />
  </View>
</View>
<View style={styles.inputBox}>
  <Text style={styles.label}>House No</Text>
  <View style={styles.inputWrapper}>
    <TextInput
      value={houseNo}
      onChangeText={setHouseNo}
      placeholder="Enter House No"
      style={styles.input}
    />
  </View>
</View>
<View style={styles.inputBox}>
  <Text style={styles.label}>Mobile</Text>
  <View style={styles.inputWrapper}>
    <TextInput
      value={mobile}
      onChangeText={setMobile}
      placeholder="Enter Mobile Number"
      keyboardType="phone-pad"
      style={styles.input}
    />
  </View>
</View>
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
        <View style={styles.inputBox}>
  <Text style={styles.label}>Road Name</Text>

  <View style={styles.inputWrapper}>
    <Ionicons
      name="navigate-outline"
      size={20}
      color="#777"
    />

    <TextInput
      value={roadName}
      onChangeText={setRoadName}
      placeholder="Enter Road Name"
      placeholderTextColor="#999"
      style={styles.input}
    />
  </View>
</View>
          {/* ADDRESS */}
        {/* <View style={styles.inputBox}>
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
        </View> */}
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
<View style={styles.inputBox}>
  <Text style={styles.label}>Address Type</Text>

  <View style={{flexDirection: 'row', gap: 10}}>
    <TouchableOpacity
      onPress={() => setTypeType('Home')}
      style={{
        backgroundColor:
          typeType === 'Home' ? '#FF4D6D' : '#E5E5E5',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
      }}>
      <Text
        style={{
          color: typeType === 'Home' ? '#fff' : '#000',
        }}>
        Home
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      onPress={() => setTypeType('Office')}
      style={{
        backgroundColor:
          typeType === 'Office' ? '#FF4D6D' : '#E5E5E5',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
      }}>
      <Text
        style={{
          color: typeType === 'Office' ? '#fff' : '#000',
        }}>
        Office
      </Text>
    </TouchableOpacity>
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

        {/* Pin CODE */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>pin Code</Text>

          <View style={styles.inputWrapper}>
            <Ionicons
              name="location-outline"
              size={20}
              color="#777"
            />

            <TextInput
              value={zipCode}
              onChangeText={setpinCode}
              placeholder="Enter pin Code"
              placeholderTextColor="#999"
              style={styles.input}
              keyboardType="number-pad"
            />
          </View>
        </View>

      

        {/* LANDMARK */}
       
            {/*   curremtLocation */}
           <TouchableOpacity style={styles.locationBtn} onPress={getCurrentLocation}>
          <Ionicons name="location-outline" size={20} color="#fff" />
          <Text style={styles.locationText}>Use Current Location</Text>
        </TouchableOpacity>       

        {/* SAVE BUTTON */}
        <TouchableOpacity
          style={styles.saveBtn}
          activeOpacity={0.8}
          onPress={saveAddress}
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
           <SuccessModal
      visible={isSuccess}
       title=" Save Address "
       message="Your Address have been save successfully."
       onClose={() =>
       setIsSuccess(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    padding:10
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
  backgroundColor:AllColors.primary,
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