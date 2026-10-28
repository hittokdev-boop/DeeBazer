import React, { useEffect, useState, useRef } from "react";
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
import Geolocation from '@react-native-community/geolocation';
import { useNavigation, useRoute } from "@react-navigation/native";
import { getUserProfileApi, saveAddressApi, updateAddressApi, getToken, getuserId, getMobile } from "../../../Api/Api";
import SuccessModal from "../../../Common/SuccessScreen";
import AllColors from "../../../Constants/Color";
import { STATUSBAR_HEIGHT } from '../../../Constants/ScreenUtils';
import { useTheme } from '../../../Context/ThemeContext';
import { getCoordinatesFromAddress, isValidCoordinate } from '../../../Common/geocodeUtils';

export default function SaveAddress() {
  const navigation = useNavigation();
  const route = useRoute();
  const editData = route?.params?.addressData || route?.params?.item || null;
  const isEdit = Boolean(route?.params?.isEdit || editData);
  const isFromCart = Boolean(route?.params?.fromCart || route?.params?.returnScreen === 'CartPage');
  const { theme, isDarkMode } = useTheme();

  const [latitude, setLatitude] = useState(
    route?.params?.latitude || route?.params?.lat || editData?.latitude || editData?.lat || null
  );
  const [longitude, setLongitude] = useState(
    route?.params?.longitude || route?.params?.lng || route?.params?.long || editData?.longitude || editData?.lng || editData?.long || null
  );

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
  const [lastSavedId, setLastSavedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (route?.params?.fromMap) {
      if (route.params.latitude) setLatitude(route.params.latitude);
      if (route.params.longitude) setLongitude(route.params.longitude);
      setCity(String(route.params.city || ''));
      setStateName(String(route.params.state || ''));
      setpinCode(String(route.params.pin || ''));
      setHouseNo(String(route.params.houseNo || ''));
      setRoadName(String(route.params.roadName || ''));
      setLandmark(String(route.params.landmark || ''));
      setAddress(String(route.params.address || ''));
      if (route.params.name) setName(String(route.params.name));
      if (route.params.mobile) setMobile(String(route.params.mobile));
      if (route.params.type) setTypeType(String(route.params.type));
      if (route.params.customType) setCustomType(String(route.params.customType));
      return;
    }

    if (route?.params?.latitude) setLatitude(route.params.latitude);
    if (route?.params?.longitude) setLongitude(route.params.longitude);
    if (route?.params?.city !== undefined) setCity(String(route.params.city || ''));
    if (route?.params?.state !== undefined) setStateName(String(route.params.state || ''));
    if (route?.params?.pin !== undefined) setpinCode(String(route.params.pin || ''));
    if (route?.params?.houseNo !== undefined) setHouseNo(String(route.params.houseNo || ''));
    if (route?.params?.roadName !== undefined) setRoadName(String(route.params.roadName || ''));
    if (route?.params?.landmark !== undefined) setLandmark(String(route.params.landmark || ''));
    if (route?.params?.address !== undefined) setAddress(String(route.params.address || ''));
    if (route?.params?.name) setName(String(route.params.name));
    if (route?.params?.mobile) setMobile(String(route.params.mobile));
    if (route?.params?.type) setTypeType(String(route.params.type));
    if (route?.params?.customType) setCustomType(String(route.params.customType));
  }, [
    route?.params?.fromMap,
    route?.params?.latitude,
    route?.params?.longitude,
    route?.params?.city,
    route?.params?.state,
    route?.params?.pin,
    route?.params?.houseNo,
    route?.params?.roadName,
    route?.params?.landmark,
    route?.params?.address,
    route?.params?.name,
    route?.params?.mobile,
    route?.params?.type,
    route?.params?.customType,
  ]);

  useEffect(() => {
    if (!isInitialMount.current) return;
    isInitialMount.current = false;

    if (route?.params?.fromMap) return;

    if (editData) {
      if (editData.latitude || editData.lat) {
        setLatitude(editData.latitude || editData.lat);
      }
      if (editData.longitude || editData.lng || editData.long) {
        setLongitude(editData.longitude || editData.lng || editData.long);
      }
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
  }, [editData, route?.params?.fromMap]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const googlePromise = fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyA5Jo2sWSApjLojgYNdSgyICND-t3Gzb5M`
      ).then(res => res.json()).catch(() => null);

      const osmPromise = fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'DeeBazer-App',
            'Accept-Language': 'en',
          },
        }
      ).then(res => res.json()).catch(() => null);

      const bdcPromise = fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      ).then(res => res.json()).catch(() => null);

      const [googleData, osmData, bdcData] = await Promise.all([googlePromise, osmPromise, bdcPromise]);

      let foundCity = '';
      let foundState = '';
      let foundPin = '';
      let foundRoad = '';
      let foundHouse = '';
      let foundLandmark = '';
      let foundAddress = '';

      if (googleData && googleData.status === 'OK' && googleData.results && googleData.results[0]) {
        const topResult = googleData.results[0];
        foundAddress = (topResult.formatted_address || '')
          .replace(/, India$/i, '')
          .replace(/unnamed road,?/gi, '')
          .trim();

        let subLoc1 = '';
        let subLoc2 = '';
        let routeStr = '';
        let premiseStr = '';

        topResult.address_components.forEach(comp => {
          const types = comp.types || [];
          if (types.includes('postal_code')) {
            foundPin = comp.long_name;
          } else if (types.includes('locality')) {
            foundCity = comp.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            foundState = comp.long_name;
          } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
            subLoc1 = comp.long_name;
          } else if (types.includes('sublocality_level_2') || types.includes('neighborhood')) {
            subLoc2 = comp.long_name;
          } else if (types.includes('route')) {
            routeStr = comp.long_name;
          } else if (types.includes('street_number') || types.includes('premise') || types.includes('subpremise')) {
            premiseStr = comp.long_name;
          }
        });

        foundHouse = premiseStr || '';
        foundRoad = [premiseStr, routeStr].filter(Boolean).join(' ') || subLoc2 || '';
        foundLandmark = subLoc2 || subLoc1 || '';
      }

      if (osmData && osmData.address) {
        const addr = osmData.address;
        if (!foundRoad) foundRoad = addr.road || addr.street || addr.suburb || addr.pedestrian || '';
        if (!foundHouse) foundHouse = addr.house_number || addr.building || '';
        if (!foundCity) foundCity = addr.city || addr.town || addr.village || addr.municipality || '';
        if (!foundState) foundState = addr.state || '';
        if (!foundPin) foundPin = addr.postcode ? String(addr.postcode).replace(/\D/g, '').slice(0, 6) : '';
        if (!foundLandmark) foundLandmark = addr.neighbourhood || addr.suburb || '';
      }

      if (bdcData) {
        if (!foundCity) foundCity = bdcData.city || bdcData.locality || '';
        if (!foundState) foundState = bdcData.principalSubdivision || '';
        if (!foundPin && bdcData.postcode) {
          const cleaned = String(bdcData.postcode).replace(/\D/g, '');
          if (cleaned.length === 6) foundPin = cleaned;
        }
        if (!foundRoad && bdcData.locality) foundRoad = bdcData.locality;
      }

      setCity(foundCity || '');
      setStateName(foundState || '');
      setpinCode(foundPin || '');
      setRoadName(foundRoad || '');
      setHouseNo(foundHouse || '');
      setLandmark(foundLandmark || '');
      if (foundAddress) setAddress(foundAddress);
    } catch (e) {
      console.log('Reverse geocode error in SaveAddress:', e);
    }
  };

  const handleUseLiveLocation = async () => {
    setLocationLoading(true);
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        const isGranted =
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
        if (!isGranted) {
          Alert.alert("Permission Required", "Please allow location access to detect your live location.");
          setLocationLoading(false);
          return;
        }
      }

      Geolocation.getCurrentPosition(
        async position => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);
          await reverseGeocode(lat, lng);
          setLocationLoading(false);
        },
        error => {
          Geolocation.getCurrentPosition(
            async position => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              setLatitude(lat);
              setLongitude(lng);
              await reverseGeocode(lat, lng);
              setLocationLoading(false);
            },
            err => {
              setLocationLoading(false);
              Alert.alert("Location Error", "Could not detect your live location. Please ensure GPS is turned on.");
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 10000 }
          );
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    } catch (err) {
      setLocationLoading(false);
      Alert.alert("Error", "Failed to retrieve location.");
    }
  };

  const handlePickOnMap = () => {
    navigation.navigate('MapScreen', {
      fromSaveAddress: true,
      fromCart: isFromCart,
      returnScreen: isFromCart ? 'CartPage' : undefined,
      initialLat: latitude,
      initialLng: longitude,
      isEdit: isEdit,
      addressData: editData,
      currentName: name,
      currentMobile: mobile,
      currentHouseNo: houseNo,
      currentRoadName: roadName,
      currentLandmark: landmark,
      currentCity: city,
      currentState: stateName,
      currentPin: zipCode,
      currentType: typeType,
      currentCustomType: customType,
    });
  };

  const calculateAndSetCoords = async (h, r, l, c, s, p) => {
    try {
      const coords = await getCoordinatesFromAddress(h, r, l, c, s, p);
      if (coords && coords.latitude && coords.longitude) {
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
      }
    } catch (e) {
      console.log('Error calculating coords from address:', e);
    }
  };


  const loadUserData = async () => {
    try {
      const storedMobile = await getMobile();
      if (storedMobile) {
        const cleaned = String(storedMobile).replace(/[^0-9]/g, '').slice(0, 10);
        if (cleaned) setMobile(cleaned);
      }

      const token = await getToken();
      if (token) {
        const response = await getUserProfileApi();
        const data = response.data || {};
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

      let finalLat = latitude;
      let finalLng = longitude;

      // Calculate coordinates dynamically by mapping the address if not already selected from map/live GPS
      if (!isValidCoordinate(finalLat, finalLng)) {
        const calculated = await getCoordinatesFromAddress(houseNo, roadName, landmark, city, stateName, zipCode);
        if (calculated && isValidCoordinate(calculated.latitude, calculated.longitude)) {
          finalLat = calculated.latitude;
          finalLng = calculated.longitude;
          setLatitude(finalLat);
          setLongitude(finalLng);
        }
      }

      const payload = {
        user_id: ID ? (Number(ID) || ID) : undefined,
        name: name.trim(),
        mobile: mobile.trim(),
        pin: zipCode.trim(),
        state: stateName.trim(),
        house_no: houseNo.trim(),
        city: city.trim(),
        road_name: roadName.trim(),
        landmark: landmark.trim() || undefined,
        address: address.trim() || fullAddress,
        type: finalType,
        status: "active"
      };

      if (isValidCoordinate(finalLat, finalLng)) {
        payload.latitude = Number(Number(finalLat).toFixed(6));
        payload.longitude = Number(Number(finalLng).toFixed(6));
      }

      const getApiErrorMessage = (res, fallback) => {
        if (res?.message && typeof res.message === 'string') return res.message;
        if (res?.data?.message && typeof res.data.message === 'string') return res.data.message;
        if (res?.errors && typeof res.errors === 'object') {
          const firstKey = Object.keys(res.errors)[0];
          if (firstKey && Array.isArray(res.errors[firstKey]) && res.errors[firstKey][0]) {
            return res.errors[firstKey][0];
          }
        }
        if (res?.data?.errors && typeof res.data.errors === 'object') {
          const firstKey = Object.keys(res.data.errors)[0];
          if (firstKey && Array.isArray(res.data.errors[firstKey]) && res.data.errors[firstKey][0]) {
            return res.data.errors[firstKey][0];
          }
        }
        return res?.error || res?.data?.error || fallback;
      };

      let savedId = null;
      if (isEdit && addressId) {
        payload.address_id = Number(addressId) || addressId;
        payload.id = Number(addressId) || addressId;
        const updateRes = await updateAddressApi(payload);
        const uStatus = updateRes?.status ?? updateRes?.data?.status;
        const uSuccess = updateRes?.success ?? updateRes?.data?.success;
        const uMsg = updateRes?.message || updateRes?.data?.message;
        if (
          uStatus === 200 ||
          uStatus === '200' ||
          uStatus === 201 ||
          uStatus === '201' ||
          uSuccess === true ||
          uSuccess === 'true' ||
          (typeof uMsg === 'string' && /success|updated/i.test(uMsg)) ||
          (updateRes?.ok && !updateRes?.error && uStatus !== 400 && uStatus !== 422)
        ) {
          success = true;
          savedId = Number(addressId) || addressId;
        } else {
          errorMsg = getApiErrorMessage(updateRes, "Unable to update address.");
        }
      } else {
        const saveRes = await saveAddressApi(payload);
        const sStatus = saveRes?.status ?? saveRes?.data?.status;
        const sSuccess = saveRes?.success ?? saveRes?.data?.success;
        const sMsg = saveRes?.message || saveRes?.data?.message;
        if (
          sStatus === 200 ||
          sStatus === '200' ||
          sStatus === 201 ||
          sStatus === '201' ||
          sSuccess === true ||
          sSuccess === 'true' ||
          saveRes?.id ||
          saveRes?.data?.id ||
          saveRes?.address_id ||
          saveRes?.data?.address_id ||
          (typeof sMsg === 'string' && /success|saved/i.test(sMsg)) ||
          (saveRes?.ok && !saveRes?.error && sStatus !== 400 && sStatus !== 422)
        ) {
          success = true;
          savedId =
            saveRes?.id ||
            saveRes?.data?.id ||
            saveRes?.address_id ||
            saveRes?.data?.address_id ||
            saveRes?.data?.data?.id ||
            null;
        } else {
          errorMsg = getApiErrorMessage(saveRes, "Unable to save address.");
        }
      }

      setLastSavedId(savedId);

      if (success) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          if (isFromCart) {
            navigation.navigate('CartPage', savedId ? { selectedAddressId: savedId } : undefined);
          } else {
            navigation.navigate('AllAddress');
          }
        }, 1200);
      } else {
        Alert.alert("Error", errorMsg);
      }
    } catch (error) {
      console.log("Save Address Error:", error);
      Alert.alert("Error", error?.message || "Something went wrong saving address.");
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

          {/* LOCATION ACTIONS (LIVE LOCATION / OTHER LOCATION ON MAP) */}
          <View style={[styles.locationCard, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
            <View style={styles.locationHeaderRow}>
              <View style={styles.locationTitleRow}>
                <Ionicons name="location" size={18} color={AllColors.primary} />
                <Text style={[styles.locationCardTitle, { color: theme.textPrimary }]}>Choose Delivery Location</Text>
              </View>
            </View>

            <Text style={[styles.locationCardSub, { color: theme.textSecondary }]}>
              Auto-fill address using current live location or search on map.
            </Text>

            <View style={styles.locationBtnsRow}>
              {/* Live Location Button */}
              <TouchableOpacity
                style={[styles.locActionBtn, styles.liveLocBtn, locationLoading && { opacity: 0.7 }]}
                onPress={handleUseLiveLocation}
                disabled={locationLoading}
                activeOpacity={0.8}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="navigate" size={18} color="#FFF" />
                    <Text style={styles.liveLocBtnText}>Use Live Location</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Choose / Search Location on Map Button */}
              <TouchableOpacity
                style={[
                  styles.locActionBtn,
                  styles.mapLocBtn,
                  {
                    borderColor: AllColors.primary,
                    backgroundColor: isDarkMode ? 'rgba(235, 19, 109, 0.08)' : '#FFF0F5',
                  },
                ]}
                onPress={handlePickOnMap}
                activeOpacity={0.8}
              >
                <Ionicons name="map-outline" size={19} color={AllColors.primary} />
                <Text style={[styles.mapLocBtnText, { color: AllColors.primary }]}>
                  Select Location on Map
                </Text>
              </TouchableOpacity>
            </View>
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
                onBlur={() => {
                  if (city.trim()) {
                    calculateAndSetCoords(houseNo, roadName, landmark, city.trim(), stateName, zipCode);
                  }
                }}
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
                onBlur={() => {
                  if (stateName.trim() && city.trim()) {
                    calculateAndSetCoords(houseNo, roadName, landmark, city, stateName.trim(), zipCode);
                  }
                }}
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
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
                  setpinCode(cleaned);
                  if (cleaned.length === 6) {
                    calculateAndSetCoords(houseNo, roadName, landmark, city, stateName, cleaned);
                  }
                }}
                onBlur={() => {
                  if (zipCode.trim()) {
                    calculateAndSetCoords(houseNo, roadName, landmark, city, stateName, zipCode.trim());
                  }
                }}
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
            if (isFromCart) {
              navigation.navigate('CartPage', lastSavedId ? { selectedAddressId: lastSavedId } : undefined);
            } else {
              navigation.navigate('AllAddress');
            }
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
  locationCard: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  locationCardSub: {
    fontSize: 12,
    marginBottom: 12,
  },
  coordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  coordsText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  locationBtnsRow: {
    flexDirection: 'column',
    gap: 12,
  },
  locActionBtn: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  liveLocBtn: {
    backgroundColor: AllColors.primary,
  },
  liveLocBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  mapLocBtn: {
    borderWidth: 1.5,
  },
  mapLocBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
