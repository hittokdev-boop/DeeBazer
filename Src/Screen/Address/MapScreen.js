import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import AllColors from '../../Constants/Color';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BASE_URL, getToken, getuserId } from "../../Api/Api";
import SuccessModal from "../../Common/SuccessScreen";
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MapScreen() {
  const navigation = useNavigation();

  // Default initial coordinates so map opens INSTANTLY without blocking spinner
  const [latitude, setLatitude] = useState(22.5726);
  const [longitude, setLongitude] = useState(88.3639);
  const [locationLoading, setLocationLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [stateName, setStateName] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setpinCode] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [altMobile, setAltMobile] = useState('');
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

    if (altMobile.trim() && altMobile.trim().length !== 10) {
      Alert.alert("Validation", "Please enter a valid 10-digit alternate mobile number.");
      return;
    }

    if (!/^\d{6}$/.test(zipCode.trim())) {
      Alert.alert("Validation", "Please enter a valid 6-digit PIN code.");
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

      const data = await response.json();

      if (response.ok || data.status === 200) {
        setModalVisible(false);
        setIsSuccess(true);
      } else {
        Alert.alert("Error", data.message || "Unable to save address.");
      }
    } catch (error) {
      console.log("Save Address Error:", error);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const requestmapPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        if (
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          getCurrentLocation();
        } else {
          // If permission is denied, fallback reverse geocode initial coords
          reverseGeocode(22.5726, 88.3639);
        }
      } else {
        getCurrentLocation();
      }
    } catch (err) {
      console.warn(err);
      reverseGeocode(22.5726, 88.3639);
    }
  };

  useEffect(() => {
    requestmapPermission();
  }, []);

  const extractPincode = (data) => {
    if (!data) return '';
    const addr = data.address || {};

    // 1. Try addr.postcode
    if (addr.postcode) {
      const cleaned = String(addr.postcode).replace(/\D/g, '');
      if (cleaned.length === 6) return cleaned;
      if (cleaned.length > 6) return cleaned.slice(0, 6);
    }

    // 2. Search for 6-digit PIN code pattern in display_name or JSON
    const searchString = data.display_name || JSON.stringify(data);
    const match = searchString.match(/\b[1-9][0-9]{5}\b/);
    if (match && match[0]) {
      return match[0];
    }

    return '';
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'DeeBazer-App',
            'Accept-Language': 'en',
          },
        }
      );
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const area = addr.road || addr.suburb || addr.neighbourhood || addr.residential || '';
        const cityName = addr.city || addr.town || addr.village || addr.suburb || addr.county || '';
        const state = addr.state || '';
        let pin = extractPincode(data);

        // Fallback to BigDataCloud API if pincode is still missing
        if (!pin) {
          try {
            const bdcRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
            );
            const bdcData = await bdcRes.json();
            if (bdcData) {
              if (bdcData.postcode) {
                const cleaned = String(bdcData.postcode).replace(/\D/g, '');
                if (cleaned.length === 6) pin = cleaned;
                else if (cleaned.length > 6) pin = cleaned.slice(0, 6);
              }
              if (!pin && bdcData.localityInfo) {
                const searchStr = JSON.stringify(bdcData.localityInfo);
                const bdcMatch = searchStr.match(/\b[1-9][0-9]{5}\b/);
                if (bdcMatch && bdcMatch[0]) pin = bdcMatch[0];
              }
            }
          } catch (bdcErr) {
            console.log('BigDataCloud fallback error:', bdcErr);
          }
        }

        const cleanParts = [area, cityName, state, pin].filter(Boolean);
        const cleanAddress = cleanParts.length > 0 ? cleanParts.join(', ') : (data.display_name || `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);

        setAddress(cleanAddress);
        if (cityName) setCity(cityName);
        if (state) setStateName(state);
        if (pin) setpinCode(pin);
        if (area) setRoadName(area);
      } else {
        setAddress(`Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch (osmErr) {
      console.log('OpenStreetMap Reverse Geocode error:', osmErr);
      setAddress(`Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);

    // Fast position retrieval (uses cached/cell tower location first)
    Geolocation.getCurrentPosition(
      async position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setLocationLoading(false);
        await reverseGeocode(lat, lng);
      },
      error => {
        console.log('Fast geolocation failed, trying standard fallback:', error);
        Geolocation.getCurrentPosition(
          async position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setLatitude(lat);
            setLongitude(lng);
            setLocationLoading(false);
            await reverseGeocode(lat, lng);
          },
          err => {
            console.log('Geolocation Network Fallback Error:', err);
            setLocationLoading(false);
            reverseGeocode(latitude, longitude);
          },
          {
            enableHighAccuracy: false,
            timeout: 7000,
            maximumAge: 10000,
          }
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 4000,
        maximumAge: 60000,
      },
    );
  };

  const handleSelectLocation = async (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    await reverseGeocode(lat, lng);
  };

  return (
    <SafeAreaView style={styles.mapContainer}>
      {/* Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Select Location</Text>
        <TouchableOpacity style={styles.refreshLocBtn} onPress={getCurrentLocation} activeOpacity={0.8}>
          <Ionicons name="locate" size={22} color={AllColors.primary} />
        </TouchableOpacity>
      </View>

      {/* Floating Status Chip when fetching location */}
      {locationLoading && (
        <View style={styles.locatingChip}>
          <ActivityIndicator size="small" color={AllColors.primary} />
          <Text style={styles.locatingText}>Locating your position...</Text>
        </View>
      )}

      <MapView
        style={styles.map}
        region={{
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onPress={(e) => handleSelectLocation(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
      >
        <Circle
          center={{
            latitude: latitude,
            longitude: longitude,
          }}
          radius={300}
          fillColor="rgba(126, 184, 247, 0.2)"
          strokeColor="rgba(0,122,255,0.8)"
        />
        <Marker
          draggable
          coordinate={{
            latitude: latitude,
            longitude: longitude,
          }}
          onDragEnd={(e) => handleSelectLocation(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
          title="Selected Location"
          description={address}
        />
      </MapView>

      {/* Floating Bottom Card */}
      <View style={styles.bottomCardContainer}>
        <Text style={styles.addressText}>{address || 'Fetching live address...'}</Text>
        <TouchableOpacity style={styles.AddAddressButton} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <Text style={styles.AddAdressText}>Add Address Details</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Save Address</Text>
                <Text style={styles.modalSub}>Add your delivery address details</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <Entypo name="cross" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* House No */}
              <TextInput
                value={houseNo}
                onChangeText={setHouseNo}
                placeholder="Flat / House / Building Name *"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />

              {/* Current Address Card */}
              <View style={styles.addressCard}>
                <Text style={styles.addressLabel}>Area / Sector / Locality</Text>
                <Text style={styles.addressValue}>{address}</Text>
              </View>

              {/* Name */}
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter Full Name *"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />

              {/* Mobile */}
              <TextInput
                value={mobile}
                onChangeText={(text) => setMobile(text.replace(/[^0-9]/g, '').slice(0, 10))}
                placeholder="10-digit Mobile Number *"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
                style={styles.input}
              />

              {/* Alternate Mobile */}
              <TextInput
                value={altMobile}
                onChangeText={(text) => setAltMobile(text.replace(/[^0-9]/g, '').slice(0, 10))}
                placeholder="Alternate Mobile Number (Optional)"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
                style={styles.input}
              />

              {/* Landmark */}
              <TextInput
                value={landmark}
                onChangeText={setLandmark}
                placeholder="Landmark"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />

              {/* Road */}
              <TextInput
                value={roadName}
                onChangeText={setRoadName}
                placeholder="Road Name"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />

              {/* State */}
              <TextInput
                value={stateName}
                onChangeText={setStateName}
                placeholder="State *"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />

              {/* City */}
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="City *"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />

              {/* PIN Code */}
              <TextInput
                value={zipCode}
                onChangeText={setpinCode}
                placeholder="PIN Code *"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={6}
                style={styles.input}
              />

              {/* Address Type */}
              <Text style={styles.typeTitle}>Address Type</Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[styles.typeBtn, typeType === 'Home' && styles.activeTypeBtn]}
                  onPress={() => setTypeType('Home')}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: typeType === 'Home' ? AllColors.primary : '#334155', fontWeight: '600' }}>
                    🏠 Home
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeBtn, typeType === 'Office' && styles.activeTypeBtn]}
                  onPress={() => setTypeType('Office')}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: typeType === 'Office' ? AllColors.primary : '#334155', fontWeight: '600' }}>
                    🏢 Office
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Use Live Location */}
              <TouchableOpacity style={styles.locationBtn} onPress={getCurrentLocation} activeOpacity={0.85}>
                <Text style={styles.locationText}>Use Live Location</Text>
              </TouchableOpacity>

              {/* Save */}
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={saveAddress} disabled={saving} activeOpacity={0.85}>
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Address</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SuccessModal
        visible={isSuccess}
        title="Address Saved"
        message="Your address has been saved successfully."
        onClose={() => {
          setIsSuccess(false);
          navigation.goBack();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 10,
  },
  backBtn: {
    padding: 6,
  },
  topHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  refreshLocBtn: {
    padding: 6,
  },
  locatingChip: {
    position: 'absolute',
    top: 65,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 20,
  },
  locatingText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  bottomCardContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  addressText: {
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  AddAddressButton: {
    backgroundColor: AllColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  AddAdressText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    height: 48,
    fontSize: 14,
    color: '#0F172A',
  },
  addressCard: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  addressLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressValue: {
    color: '#0F172A',
    fontSize: 13,
  },
  typeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: '#F8FAFC',
  },
  activeTypeBtn: {
    borderColor: AllColors.primary,
    backgroundColor: '#FFF1F7',
  },
  locationBtn: {
    backgroundColor: '#F1F5F9',
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    color: AllColors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: AllColors.primary,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
