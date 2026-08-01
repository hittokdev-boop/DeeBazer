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

  // Coordinates & Permission state - no hardcoded defaults
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
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
        const isGranted =
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

        setHasLocationPermission(isGranted);
        if (isGranted) {
          getCurrentLocation();
        }
      } else {
        setHasLocationPermission(true);
        getCurrentLocation();
      }
    } catch (err) {
      console.warn(err);
      setHasLocationPermission(false);
    }
  };

  useEffect(() => {
    requestmapPermission();
  }, []);

  const extractPincode = (data) => {
    if (!data) return '';
    const addr = data.address || {};

    // 1. Try addr.postcode directly
    if (addr.postcode) {
      const cleaned = String(addr.postcode).replace(/\D/g, '');
      if (cleaned.length === 6 && /^[1-9]/.test(cleaned)) return cleaned;
    }

    // 2. Search for valid 6-digit Indian PIN code pattern ONLY in display_name (not raw JSON object)
    if (data.display_name) {
      const match = data.display_name.match(/\b[1-9][0-9]{5}\b/);
      if (match && match[0]) {
        return match[0];
      }
    }

    return '';
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      // 1. Fetch OpenStreetMap Nominatim data
      const osmPromise = fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'DeeBazer-App',
            'Accept-Language': 'en',
          },
        }
      ).then(res => res.json()).catch(() => null);

      // 2. Fetch BigDataCloud reverse geocode data (highly accurate for Indian localities & postal codes)
      const bdcPromise = fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      ).then(res => res.json()).catch(() => null);

      const [osmData, bdcData] = await Promise.all([osmPromise, bdcPromise]);

      let streetOrBuilding = '';
      let localityArea = '';
      let cityName = '';
      let state = '';
      let pin = '';

      if (osmData && osmData.address) {
        const addr = osmData.address;

        const rawRoad = addr.road || addr.pedestrian || addr.street || addr.footway || addr.path || '';
        if (rawRoad && !rawRoad.toLowerCase().includes('unnamed')) {
          streetOrBuilding = rawRoad;
        }

        const buildingName = addr.house_number || addr.building || addr.shop || addr.amenity || addr.complex || '';
        if (buildingName) {
          streetOrBuilding = streetOrBuilding ? `${buildingName}, ${streetOrBuilding}` : buildingName;
        }

        localityArea = addr.suburb || addr.neighbourhood || addr.residential || addr.subdistrict || addr.quarter || addr.city_district || '';
        cityName = addr.city || addr.town || addr.village || addr.municipality || addr.county || addr.state_district || '';
        state = addr.state || '';
        pin = extractPincode(osmData);
      }

      // Supplement missing fields from BigDataCloud
      if (bdcData) {
        if (!localityArea) {
          localityArea = bdcData.locality || bdcData.city || '';
        }
        if (!cityName) {
          cityName = bdcData.city || bdcData.locality || bdcData.principalSubdivision || '';
        }
        if (!state) {
          state = bdcData.principalSubdivision || '';
        }
        if (!pin && bdcData.postcode) {
          const cleaned = String(bdcData.postcode).replace(/\D/g, '');
          if (cleaned.length === 6 && /^[1-9]/.test(cleaned)) {
            pin = cleaned;
          }
        }
      }

      // Filter and deduplicate parts
      let parts = [streetOrBuilding, localityArea, cityName, state, pin].filter(Boolean);

      parts = parts.filter((item, index, self) =>
        item && self.findIndex(t => t.toLowerCase() === item.toLowerCase()) === index
      );

      let cleanAddress = parts.join(', ');

      if (!cleanAddress && osmData && osmData.display_name) {
        cleanAddress = osmData.display_name
          .replace(/unnamed road,?/gi, '')
          .replace(/, India$/i, '')
          .trim();
      }

      if (!cleanAddress) {
        cleanAddress = `Location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      }

      setAddress(cleanAddress);
      if (cityName) setCity(cityName);
      if (state) setStateName(state);
      if (pin) setpinCode(pin);
      if (streetOrBuilding || localityArea) setRoadName(streetOrBuilding || localityArea);
    } catch (osmErr) {
      console.log('Reverse Geocode error:', osmErr);
      setAddress(`Location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);

    // Primary attempt: High Accuracy (GPS) for exact lat/long coordinates
    Geolocation.getCurrentPosition(
      async position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log('📍 LIVE LOCATION (GPS High Accuracy) -> Latitude:', lat, '| Longitude:', lng);
        setLatitude(lat);
        setLongitude(lng);
        setLocationLoading(false);
        await reverseGeocode(lat, lng);
      },
      error => {
        console.log('High accuracy GPS geolocation failed/timed out, trying coarse fallback:', error);
        // Secondary attempt: Coarse Network location fallback
        Geolocation.getCurrentPosition(
          async position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            console.log('📍 LIVE LOCATION (Network Fallback) -> Latitude:', lat, '| Longitude:', lng);
            setLatitude(lat);
            setLongitude(lng);
            setLocationLoading(false);
            await reverseGeocode(lat, lng);
          },
          err => {
            console.log('Geolocation Error:', err);
            setLocationLoading(false);
            Alert.alert("Location Error", "Could not detect your current location. Please check your GPS / location settings or select location manually.");
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 10000,
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  const handleSelectLocation = async (lat, lng) => {
    console.log('📍 SELECTED LOCATION -> Latitude:', lat, '| Longitude:', lng);
    setLatitude(lat);
    setLongitude(lng);
    await reverseGeocode(lat, lng);
  };

  // If location permission is not granted
  if (hasLocationPermission === false) {
    return (
      <SafeAreaView style={styles.mapContainer}>
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.topHeaderTitle}>Select Location</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.permissionContainer}>
          <View style={styles.permissionIconCircle}>
            <Ionicons name="location-outline" size={60} color={AllColors.primary} />
          </View>
          <Text style={styles.permissionTitle}>Location Access Required</Text>
          <Text style={styles.permissionSub}>
            Please enable location permission to view the map and select your delivery address.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestmapPermission} activeOpacity={0.85}>
            <Text style={styles.permissionBtnText}>Enable Location Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // If waiting for coordinates (no default coordinates used)
  if (latitude === null || longitude === null) {
    return (
      <SafeAreaView style={styles.mapContainer}>
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.topHeaderTitle}>Select Location</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color={AllColors.primary} />
          <Text style={[styles.permissionTitle, styles.mt16]}>Detecting Live Location...</Text>
          <Text style={styles.permissionSub}>Please wait while we retrieve your current position.</Text>
        </View>
      </SafeAreaView>
    );
  }

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
                <Entypo name="cross" size={28} color={AllColors.slateDark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* House No */}
              <TextInput
                value={houseNo}
                onChangeText={setHouseNo}
                placeholder="Flat / House / Building Name *"
                placeholderTextColor={AllColors.slateLight}
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
                placeholderTextColor={AllColors.slateLight}
                style={styles.input}
              />

              {/* Mobile */}
              <TextInput
                value={mobile}
                onChangeText={(text) => setMobile(text.replace(/[^0-9]/g, '').slice(0, 10))}
                placeholder="10-digit Mobile Number *"
                placeholderTextColor={AllColors.slateLight}
                keyboardType="phone-pad"
                maxLength={10}
                style={styles.input}
              />

              {/* Alternate Mobile */}
              <TextInput
                value={altMobile}
                onChangeText={(text) => setAltMobile(text.replace(/[^0-9]/g, '').slice(0, 10))}
                placeholder="Alternate Mobile Number (Optional)"
                placeholderTextColor={AllColors.slateLight}
                keyboardType="phone-pad"
                maxLength={10}
                style={styles.input}
              />

              {/* Landmark */}
              <TextInput
                value={landmark}
                onChangeText={setLandmark}
                placeholder="Landmark"
                placeholderTextColor={AllColors.slateLight}
                style={styles.input}
              />

              {/* Road */}
              <TextInput
                value={roadName}
                onChangeText={setRoadName}
                placeholder="Road Name"
                placeholderTextColor={AllColors.slateLight}
                style={styles.input}
              />

              {/* State */}
              <TextInput
                value={stateName}
                onChangeText={setStateName}
                placeholder="State *"
                placeholderTextColor={AllColors.slateLight}
                style={styles.input}
              />

              {/* City */}
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="City *"
                placeholderTextColor={AllColors.slateLight}
                style={styles.input}
              />

              {/* PIN Code */}
              <TextInput
                value={zipCode}
                onChangeText={setpinCode}
                placeholder="PIN Code *"
                placeholderTextColor={AllColors.slateLight}
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
                  <Text style={[styles.typeBtnText, typeType === 'Home' && styles.activeTypeBtnText]}>
                    🏠 Home
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeBtn, typeType === 'Office' && styles.activeTypeBtn]}
                  onPress={() => setTypeType('Office')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeBtnText, typeType === 'Office' && styles.activeTypeBtnText]}>
                    🏢 Office
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Use Live Location */}
              <TouchableOpacity style={styles.locationBtn} onPress={getCurrentLocation} activeOpacity={0.85}>
                <Text style={styles.locationText}>Use Live Location</Text>
              </TouchableOpacity>

              {/* Save */}
              <TouchableOpacity style={[styles.saveBtn, saving && styles.savingBtnDisabled]} onPress={saveAddress} disabled={saving} activeOpacity={0.85}>
                {saving ? (
                  <ActivityIndicator size="small" color={AllColors.white} />
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
    backgroundColor: AllColors.screenBg,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: AllColors.white,
    elevation: 3,
    shadowColor: AllColors.shadow,
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
    color: AllColors.slateDark,
  },
  refreshLocBtn: {
    padding: 6,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    backgroundColor: AllColors.screenBg,
  },
  permissionIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AllColors.softPinkBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AllColors.slateDark,
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionSub: {
    fontSize: 14,
    color: AllColors.slateSub,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  permissionBtn: {
    backgroundColor: AllColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 2,
  },
  permissionBtnText: {
    color: AllColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  locatingChip: {
    position: 'absolute',
    top: 65,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AllColors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 20,
  },
  locatingText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: AllColors.slateText,
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
    backgroundColor: AllColors.white,
    borderRadius: 16,
    padding: 14,
    elevation: 6,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: AllColors.divider,
  },
  addressText: {
    color: AllColors.slateDark,
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
    color: AllColors.white,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: AllColors.modalOverlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: AllColors.white,
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
    color: AllColors.slateDark,
  },
  modalSub: {
    fontSize: 12,
    color: AllColors.slateSub,
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: AllColors.lightGrey,
    backgroundColor: AllColors.screenBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    height: 48,
    fontSize: 14,
    color: AllColors.slateDark,
  },
  addressCard: {
    backgroundColor: AllColors.divider,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  addressLabel: {
    color: AllColors.slateSub,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressValue: {
    color: AllColors.slateDark,
    fontSize: 13,
  },
  typeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AllColors.slateText,
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeBtn: {
    borderWidth: 1,
    borderColor: AllColors.lightGrey,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: AllColors.screenBg,
  },
  activeTypeBtn: {
    borderColor: AllColors.primary,
    backgroundColor: AllColors.softPinkBg,
  },
  locationBtn: {
    backgroundColor: AllColors.divider,
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
    color: AllColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 24,
  },
  mt16: {
    marginTop: 16,
  },
  typeBtnText: {
    color: AllColors.slateText,
    fontWeight: '600',
  },
  activeTypeBtnText: {
    color: AllColors.primary,
  },
  savingBtnDisabled: {
    opacity: 0.7,
  },
});
