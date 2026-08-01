import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  PermissionsAndroid,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from "@react-navigation/native";
import { BASE_URL, getToken, getuserId } from "../../Api/Api";
import SuccessModal from "../../Common/SuccessScreen";
import AllColors from "../../Constants/Color";
import { useTheme } from '../../Context/ThemeContext';

export default function SaveAddress() {
  const navigation = useNavigation();
  const { theme } = useTheme();

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
  const [isSuccess, setIsSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const saveAddress = async () => {
    if (!name.trim() || !mobile.trim() || !houseNo.trim() || !city.trim() || !stateName.trim() || !zipCode.trim()) {
      Alert.alert("Validation", "Please fill all required fields.");
      return;
    }

    if (mobile.trim().length !== 10) {
      Alert.alert("Validation", "Please enter a valid 10-digit mobile number.");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const ID = await getuserId();

      const formData = new FormData();
      formData.append("user_id", String(ID || ''));
      formData.append("name", name.trim());
      formData.append("mobile", mobile.trim());
      formData.append("pin", zipCode.trim());
      formData.append("state", stateName.trim());
      formData.append("city", city.trim());
      formData.append("house_no", houseNo.trim());
      formData.append("road_name", roadName.trim());
      formData.append("landmark", landmark.trim());
      formData.append("address", address.trim());
      formData.append("type", typeType);
      formData.append("status", "1");

      const response = await fetch(`${BASE_URL}save-address`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const text = await response.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch (e) {}

      if (response.ok || response.status === 200 || data.status === 200) {
        setIsSuccess(true);
      } else {
        Alert.alert("Error", data.message || "Unable to save address.");
      }
    } catch (error) {
      console.log("Save Address Error:", error);
      Alert.alert("Error", "Something went wrong saving address.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      <View style={styles.formContainer}>
        {/* HEADER */}
        <View style={styles.topSection}>
          <Text style={styles.title}>Save Address</Text>
          <Text style={styles.subtitle}>Add your delivery address details</Text>
        </View>

        {/* Name */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Full Name *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#777" />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter Full Name"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>
        </View>

        {/* House No */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>House / Flat No *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="home-outline" size={20} color="#777" />
            <TextInput
              value={houseNo}
              onChangeText={setHouseNo}
              placeholder="Enter House / Flat No"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>
        </View>

        {/* Mobile */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Mobile Number (10 digits) *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={20} color="#777" />
            <TextInput
              value={mobile}
              onChangeText={(text) => setMobile(text.replace(/[^0-9]/g, '').slice(0, 10))}
              placeholder="Enter 10-digit Mobile Number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.input}
            />
          </View>
        </View>

        {/* Road Name */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Road Name / Area</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="navigate-outline" size={20} color="#777" />
            <TextInput
              value={roadName}
              onChangeText={setRoadName}
              placeholder="Enter Road Name or Area"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>
        </View>

        {/* Landmark */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Landmark</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="pin-outline" size={20} color="#777" />
            <TextInput
              value={landmark}
              onChangeText={setLandmark}
              placeholder="Enter Landmark (Optional)"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>
        </View>

        {/* City */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>City *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="business-outline" size={20} color="#777" />
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="Enter City"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>
        </View>

        {/* State */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>State *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="map-outline" size={20} color="#777" />
            <TextInput
              value={stateName}
              onChangeText={setStateName}
              placeholder="Enter State"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>
        </View>

        {/* Pin Code */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>PIN Code *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="location-outline" size={20} color="#777" />
            <TextInput
              value={zipCode}
              onChangeText={setpinCode}
              placeholder="Enter 6-digit PIN Code"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              maxLength={6}
              style={styles.input}
            />
          </View>
        </View>

        {/* Address Type */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Address Type</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              onPress={() => setTypeType('Home')}
              style={[styles.typeBadge, typeType === 'Home' && styles.typeBadgeActive]}
            >
              <Text style={[styles.typeBadgeText, typeType === 'Home' && styles.typeBadgeTextActive]}>
                🏠 Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTypeType('Office')}
              style={[styles.typeBadge, typeType === 'Office' && styles.typeBadgeActive]}
            >
              <Text style={[styles.typeBadgeText, typeType === 'Office' && styles.typeBadgeTextActive]}>
                🏢 Office
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          activeOpacity={0.8}
          onPress={saveAddress}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#FFF" />
              <Text style={styles.saveText}>Save Address</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <SuccessModal
        visible={isSuccess}
        title="Address Saved"
        message="Your address has been saved successfully."
        onClose={() => {
          setIsSuccess(false);
          navigation.goBack();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AllColors.screenBg,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  topSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: AllColors.textDark,
  },
  subtitle: {
    fontSize: 14,
    color: AllColors.textSecondary,
    marginTop: 4,
  },
  inputBox: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: AllColors.slateDark,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AllColors.white,
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 52,
    elevation: 1,
    borderWidth: 1,
    borderColor: AllColors.lightGrey,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: AllColors.textDark,
  },
  saveBtn: {
    height: 52,
    backgroundColor: AllColors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    flexDirection: 'row',
  },
  saveText: {
    color: AllColors.white,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBadge: {
    backgroundColor: AllColors.borderLight,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  typeBadgeActive: {
    backgroundColor: AllColors.primary,
  },
  typeBadgeText: {
    color: AllColors.black,
    fontWeight: '600',
  },
  typeBadgeTextActive: {
    color: AllColors.white,
  },
});
