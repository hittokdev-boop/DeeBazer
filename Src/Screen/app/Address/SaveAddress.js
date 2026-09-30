import React, { useEffect, useState } from "react";
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
  StatusBar,
} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from "@react-navigation/native";
import { BASE_URL, getToken, getuserId, getMobile } from "../../../Api/Api";
import SuccessModal from "../../../Common/SuccessScreen";
import AllColors from "../../../Constants/Color";
import { STATUSBAR_HEIGHT } from '../../../Constants/ScreenUtils';
import { useTheme } from '../../../Context/ThemeContext';

export default function SaveAddress() {
  const navigation = useNavigation();
  const route = useRoute();
  const editData = route?.params?.addressData || route?.params?.item || null;
  const isEdit = Boolean(route?.params?.isEdit || editData);
  const { theme, isDarkMode } = useTheme();

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
  const [customType, setCustomType] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editData) {
      if (editData.name) setName(String(editData.name));
      const m = editData.mobile || editData.phone || editData.mobile_no;
      if (m) setMobile(String(m).replace(/[^0-9]/g, '').slice(0, 10));
      if (editData.house_no || editData.house || editData.building) {
        setHouseNo(String(editData.house_no || editData.house || editData.building));
      }
      if (editData.road_name || editData.road || editData.area || editData.street) {
        setRoadName(String(editData.road_name || editData.road || editData.area || editData.street));
      }
      if (editData.landmark) setLandmark(String(editData.landmark));
      if (editData.city) setCity(String(editData.city));
      if (editData.state) setStateName(String(editData.state));
      if (editData.pin || editData.pincode || editData.zip_code || editData.zip) {
        setpinCode(String(editData.pin || editData.pincode || editData.zip_code || editData.zip));
      }
      if (editData.address || editData.full_address) {
        setAddress(String(editData.address || editData.full_address));
      }
      const t = editData.type || editData.address_type || 'Home';
      if (t === 'Home' || t === 'home') {
        setTypeType('Home');
      } else if (t === 'Work' || t === 'Office' || t === 'work' || t === 'office') {
        setTypeType('Work');
      } else {
        setTypeType('Other');
        setCustomType(t);
      }
    } else {
      loadUserData();
    }
  }, [editData]);

  const loadUserData = async () => {
    try {
      const storedMobile = await getMobile();
      if (storedMobile) {
        const cleaned = String(storedMobile).replace(/[^0-9]/g, '').slice(0, 10);
        if (cleaned) setMobile(cleaned);
      }

      const token = await getToken();
      if (token) {
        const response = await fetch(`${BASE_URL}me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
        const data = await response.json().catch(() => ({}));
        if (data && data.user) {
          if (data.user.name) setName(data.user.name);
          const uMobile = data.user.mobile || data.user.phone;
          if (uMobile) {
            const cleaned = String(uMobile).replace(/[^0-9]/g, '').slice(0, 10);
            if (cleaned) setMobile(cleaned);
          }
        }
      }
    } catch (e) {
      console.log('Error loading user data in SaveAddress:', e);
    }
  };

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

      const fullAddress = [houseNo.trim(), roadName.trim(), landmark.trim(), city.trim(), stateName.trim(), zipCode.trim()]
        .filter(Boolean)
        .join(', ');

      const finalType = typeType === 'Other' ? (customType.trim() || 'Other') : typeType;
      const addressId = editData?.id || editData?.address_id;

      let success = false;
      let errorMsg = isEdit ? "Unable to update address." : "Unable to save address.";

      if (isEdit && addressId) {
        // 1. Try update-address endpoint (JSON)
        try {
          const updateResponse = await fetch(`${BASE_URL}update-address`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              "Authorization": token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify({
              address_id: addressId,
              id: addressId,
              user_id: ID,
              name: name.trim(),
              mobile: mobile.trim(),
              pin: zipCode.trim(),
              state: stateName.trim(),
              city: city.trim(),
              house_no: houseNo.trim(),
              road_name: roadName.trim(),
              landmark: landmark.trim(),
              address: address.trim() || fullAddress,
              type: finalType,
              status: "1"
            }),
          });

          const updateText = await updateResponse.text();
          let updateData = {};
          try { updateData = JSON.parse(updateText); } catch (e) { }

          if (updateResponse.ok && (updateData.status === 200 || updateData.status === '200' || updateData.status === true || updateData.success)) {
            success = true;
          } else if (updateData.message) {
            errorMsg = updateData.message;
          }
        } catch (e) {
          console.log("Update address JSON error:", e);
        }

        // 2. Try FormData if JSON failed
        if (!success) {
          try {
            const formData = new FormData();
            formData.append('address_id', String(addressId));
            formData.append('id', String(addressId));
            if (ID) formData.append('user_id', String(ID));
            formData.append('name', name.trim());
            formData.append('mobile', mobile.trim());
            formData.append('pin', zipCode.trim());
            formData.append('state', stateName.trim());
            formData.append('city', city.trim());
            formData.append('house_no', houseNo.trim());
            formData.append('road_name', roadName.trim());
            formData.append('landmark', landmark.trim());
            formData.append('address', address.trim() || fullAddress);
            formData.append('type', finalType);
            formData.append('status', '1');

            const fdResponse = await fetch(`${BASE_URL}update-address`, {
              method: "POST",
              headers: {
                Authorization: token ? `Bearer ${token}` : '',
              },
              body: formData,
            });
            const fdText = await fdResponse.text();
            let fdData = {};
            try { fdData = JSON.parse(fdText); } catch (e) { }
            if (fdResponse.ok && (fdData.status === 200 || fdData.status === '200' || fdData.status === true || fdData.success)) {
              success = true;
            }
          } catch (e) { }
        }

        // 3. Fallback to save-address with address_id if update-address endpoint not found
        if (!success) {
          try {
            const fallbackResponse = await fetch(`${BASE_URL}save-address`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": token ? `Bearer ${token}` : '',
              },
              body: JSON.stringify({
                address_id: addressId,
                id: addressId,
                user_id: ID,
                name: name.trim(),
                mobile: mobile.trim(),
                pin: zipCode.trim(),
                state: stateName.trim(),
                city: city.trim(),
                house_no: houseNo.trim(),
                road_name: roadName.trim(),
                landmark: landmark.trim(),
                address: address.trim() || fullAddress,
                type: finalType,
                status: "1"
              }),
            });
            const fbText = await fallbackResponse.text();
            let fbData = {};
            try { fbData = JSON.parse(fbText); } catch (e) { }
            if (fallbackResponse.ok && (fbData.status === 200 || fbData.status === '200' || fbData.status === true || fbData.success)) {
              success = true;
            }
          } catch (e) { }
        }
      } else {
        const response = await fetch(`${BASE_URL}save-address`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({
            user_id: ID,
            name: name.trim(),
            mobile: mobile.trim(),
            pin: zipCode.trim(),
            state: stateName.trim(),
            city: city.trim(),
            house_no: houseNo.trim(),
            road_name: roadName.trim(),
            landmark: landmark.trim(),
            address: address.trim() || fullAddress,
            type: finalType,
            status: "1"
          }),
        });

        const text = await response.text();
        let data = {};
        try {
          data = JSON.parse(text);
        } catch (e) { }

        if (response.ok && (data.status === 200 || data.status === '200' || data.status === true || data.success || data.id)) {
          success = true;
        } else {
          errorMsg = data.message || "Unable to save address.";
        }
      }

      if (success) {
        setIsSuccess(true);
      } else {
        Alert.alert("Error", errorMsg);
      }
    } catch (error) {
      console.log("Save Address Error:", error);
      Alert.alert("Error", "Something went wrong saving address.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar backgroundColor="transparent" barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent={true} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDarkMode ? '#334155' : undefined }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{isEdit ? 'Edit Address' : 'Save Address'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* HEADER */}
          <View style={styles.topSection}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{isEdit ? 'Edit Address' : 'Save Address'}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{isEdit ? 'Update your delivery address details' : 'Add your delivery address details'}</Text>
          </View>

          {/* Name */}
          <View style={styles.inputBox}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>Full Name *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? '#1E293B' : AllColors.white, borderColor: isDarkMode ? '#334155' : AllColors.lightGrey }]}>
              <Ionicons name="person-outline" size={20} color={isDarkMode ? '#94A3B8' : '#777'} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter Full Name"
                placeholderTextColor={isDarkMode ? '#94A3B8' : '#999'}
                style={[styles.input, { color: theme.textPrimary }]}
              />
            </View>
          </View>

          {/* House No */}
          <View style={styles.inputBox}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>House / Flat No *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? '#1E293B' : AllColors.white, borderColor: isDarkMode ? '#334155' : AllColors.lightGrey }]}>
              <Ionicons name="home-outline" size={20} color={isDarkMode ? '#94A3B8' : '#777'} />
              <TextInput
                value={houseNo}
                onChangeText={setHouseNo}
                placeholder="Enter House / Flat No"
                placeholderTextColor={isDarkMode ? '#94A3B8' : '#999'}
                style={[styles.input, { color: theme.textPrimary }]}
              />
            </View>
          </View>

          {/* Mobile */}
          <View style={styles.inputBox}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>Mobile Number (10 digits) *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? '#1E293B' : AllColors.white, borderColor: isDarkMode ? '#334155' : AllColors.lightGrey }]}>
              <Ionicons name="call-outline" size={20} color={isDarkMode ? '#94A3B8' : '#777'} />
              <TextInput
                value={mobile}
                onChangeText={(text) => setMobile(text.replace(/[^0-9]/g, '').slice(0, 10))}
                placeholder="Enter 10-digit Mobile Number"
                placeholderTextColor={isDarkMode ? '#94A3B8' : '#999'}
                keyboardType="phone-pad"
                maxLength={10}
                style={[styles.input, { color: theme.textPrimary }]}
              />
            </View>
          </View>

          {/* Road Name */}
          <View style={styles.inputBox}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>Road Name / Area</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? '#1E293B' : AllColors.white, borderColor: isDarkMode ? '#334155' : AllColors.lightGrey }]}>
              <Ionicons name="navigate-outline" size={20} color={isDarkMode ? '#94A3B8' : '#777'} />
              <TextInput
                value={roadName}
                onChangeText={setRoadName}
                placeholder="Enter Road Name or Area"
                placeholderTextColor={isDarkMode ? '#94A3B8' : '#999'}
                style={[styles.input, { color: theme.textPrimary }]}
              />
            </View>
          </View>

          {/* Landmark */}
          <View style={styles.inputBox}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>Landmark</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? '#1E293B' : AllColors.white, borderColor: isDarkMode ? '#334155' : AllColors.lightGrey }]}>
              <Ionicons name="pin-outline" size={20} color={isDarkMode ? '#94A3B8' : '#777'} />
              <TextInput
                value={landmark}
                onChangeText={setLandmark}
                placeholder="Enter Landmark (Optional)"
                placeholderTextColor={isDarkMode ? '#94A3B8' : '#999'}
                style={[styles.input, { color: theme.textPrimary }]}
              />
            </View>
          </View>

          {/* City */}
          <View style={styles.inputBox}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>City *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? '#1E293B' : AllColors.white, borderColor: isDarkMode ? '#334155' : AllColors.lightGrey }]}>
              <Ionicons name="business-outline" size={20} color={isDarkMode ? '#94A3B8' : '#777'} />
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Enter City"
                placeholderTextColor={isDarkMode ? '#94A3B8' : '#999'}
                style={[styles.input, { color: theme.textPrimary }]}
              />
            </View>
          </View>

          {/* State */}
          <View style={styles.inputBox}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>State *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? '#1E293B' : AllColors.white, borderColor: isDarkMode ? '#334155' : AllColors.lightGrey }]}>
              <Ionicons name="map-outline" size={20} color={isDarkMode ? '#94A3B8' : '#777'} />
              <TextInput
                value={stateName}
                onChangeText={setStateName}
                placeholder="Enter State"
                placeholderTextColor={isDarkMode ? '#94A3B8' : '#999'}
                style={[styles.input, { color: theme.textPrimary }]}
              />
            </View>
          </View>

          {/* Pin Code */}
          <View style={styles.inputBox}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>PIN Code *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? '#1E293B' : AllColors.white, borderColor: isDarkMode ? '#334155' : AllColors.lightGrey }]}>
              <Ionicons name="location-outline" size={20} color={isDarkMode ? '#94A3B8' : '#777'} />
              <TextInput
                value={zipCode}
                onChangeText={setpinCode}
                placeholder="Enter 6-digit PIN Code"
                placeholderTextColor={isDarkMode ? '#94A3B8' : '#999'}
                keyboardType="number-pad"
                maxLength={6}
                style={[styles.input, { color: theme.textPrimary }]}
              />
            </View>
          </View>

          {/* Address Type */}
          <View style={styles.inputBox}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>Address Type</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                onPress={() => setTypeType('Home')}
                style={[
                  styles.typeBadge,
                  { backgroundColor: isDarkMode ? '#1E293B' : AllColors.borderLight, borderColor: isDarkMode ? '#334155' : 'transparent', borderWidth: isDarkMode ? 1 : 0 },
                  typeType === 'Home' && styles.typeBadgeActive,
                ]}
              >
                <Text style={[styles.typeBadgeText, { color: isDarkMode ? '#CBD5E1' : AllColors.black }, typeType === 'Home' && styles.typeBadgeTextActive]}>
                  🏠 Home
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTypeType('Work')}
                style={[
                  styles.typeBadge,
                  { backgroundColor: isDarkMode ? '#1E293B' : AllColors.borderLight, borderColor: isDarkMode ? '#334155' : 'transparent', borderWidth: isDarkMode ? 1 : 0 },
                  typeType === 'Work' && styles.typeBadgeActive,
                ]}
              >
                <Text style={[styles.typeBadgeText, { color: isDarkMode ? '#CBD5E1' : AllColors.black }, typeType === 'Work' && styles.typeBadgeTextActive]}>
                  🏢 Work
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTypeType('Other')}
                style={[
                  styles.typeBadge,
                  { backgroundColor: isDarkMode ? '#1E293B' : AllColors.borderLight, borderColor: isDarkMode ? '#334155' : 'transparent', borderWidth: isDarkMode ? 1 : 0 },
                  typeType === 'Other' && styles.typeBadgeActive,
                ]}
              >
                <Text style={[styles.typeBadgeText, { color: isDarkMode ? '#CBD5E1' : AllColors.black }, typeType === 'Other' && styles.typeBadgeTextActive]}>
                  🏷️ {typeType === 'Other' && customType.trim() ? customType.trim() : 'Other'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Custom Address Type Title / Value Input */}
            {typeType === 'Other' && (
              <View style={[styles.inputWrapper, { marginTop: 10, backgroundColor: isDarkMode ? '#1E293B' : AllColors.white, borderColor: isDarkMode ? '#334155' : AllColors.lightGrey }]}>
                <Ionicons name="pricetag-outline" size={20} color={isDarkMode ? '#94A3B8' : '#777'} />
                <TextInput
                  value={customType}
                  onChangeText={setCustomType}
                  placeholder="Enter Title / Address Type (e.g. Hostel, Gym, Hotel)"
                  placeholderTextColor={isDarkMode ? '#94A3B8' : '#999'}
                  maxLength={30}
                  style={[styles.input, { color: theme.textPrimary }]}
                />
              </View>
            )}
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
                <Text style={styles.saveText}>{isEdit ? 'Update Address' : 'Save Address'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <SuccessModal
          visible={isSuccess}
          title={isEdit ? "Address Updated" : "Address Saved"}
          message={isEdit ? "Your address has been updated successfully." : "Your address has been saved successfully."}
          onClose={() => {
            setIsSuccess(false);
            navigation.goBack();
          }}
        />
      </ScrollView>
    </View>
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
    flexWrap: 'wrap',
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
  header: {
    height: 56 + STATUSBAR_HEIGHT,
    paddingTop: STATUSBAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AllColors.white,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AllColors.slateDark,
  },
  headerSpacer: {
    width: 40,
  },
});
