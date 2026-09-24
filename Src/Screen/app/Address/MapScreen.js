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
  StatusBar,
} from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import AllColors from '../../../Constants/Color';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BASE_URL, getToken, getuserId, getMobile } from "../../../Api/Api";
import SuccessModal from "../../../Common/SuccessScreen";
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../Context/ThemeContext';

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

export default function MapScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();

  // Coordinates & Permission state
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

  useEffect(() => {
    requestmapPermission();
    loadUserData();
  }, []);

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
      console.log('Error loading user data in MapScreen:', e);
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

      const fullAddress = [houseNo.trim(), roadName.trim(), landmark.trim(), city.trim(), stateName.trim(), zipCode.trim()]
        .filter(Boolean)
        .join(', ');

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
          type: typeType,
          status: "1"
        }),
      });

      const responseText = await response.text();

      let data = {};
      try {
        data = JSON.parse(responseText);
      } catch (e) { }

      if (response.ok && (data.status === 200 || data.status === '200' || data.status === true || data.success || data.id)) {
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

  const GOOGLE_MAPS_API_KEY = "AIzaSyCJKwxaSS0glDtxXMX37uHX_KHUEleCMk0";

  const extractPincode = (data) => {
    if (!data) return '';
    const addr = data.address || {};

    const rawPin = addr.postcode || addr.postal_code || addr.zip || addr.zipcode || '';
    if (rawPin) {
      const cleaned = String(rawPin).replace(/\D/g, '');
      if (cleaned.length === 6 && /^[1-9]/.test(cleaned)) return cleaned;
    }

    if (data.display_name) {
      const matches = data.display_name.match(/\b[1-9][0-9]{5}\b/g);
      if (matches && matches.length > 0) {
        return matches[0];
      }
    }

    return '';
  };

  const reverseGeocode = async (lat, lng) => {
    // console.log('📍 [LOCATION DETECTED] Latitude:', lat, 'Longitude:', lng);
    try {
      const googlePromise = fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
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

      const osmAreaPromise = fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
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

      const [googleData, osmData, osmAreaData, bdcData] = await Promise.all([
        googlePromise,
        osmPromise,
        osmAreaPromise,
        bdcPromise,
      ]);

      let streetOrBuilding = '';
      let localityArea = '';
      let cityName = '';
      let state = '';
      let pin = '';
      let googleFormattedAddr = '';

      // console.log('Google Geocode status:', googleData?.status, googleData?.error_message || '');

      if (googleData && googleData.status === 'OK' && googleData.results && googleData.results.length > 0) {
        const topResult = googleData.results[0];
        googleFormattedAddr = (topResult.formatted_address || '')
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
            pin = comp.long_name;
          } else if (types.includes('locality')) {
            cityName = comp.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = comp.long_name;
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

        streetOrBuilding = [premiseStr, routeStr].filter(Boolean).join(' ') || subLoc2 || '';
        localityArea = [subLoc2, subLoc1].filter(Boolean).join(', ') || subLoc1 || '';
      }

      if (osmData && osmData.address) {
        const addr = osmData.address;

        const rawRoad = addr.road || addr.pedestrian || addr.street || addr.footway || addr.path || addr.cycleway || '';
        const buildingName = addr.house_number || addr.building || addr.shop || addr.amenity || addr.complex || addr.railway || '';

        if (!streetOrBuilding) {
          if (rawRoad && buildingName) {
            streetOrBuilding = `${buildingName}, ${rawRoad}`;
          } else {
            streetOrBuilding = rawRoad || buildingName || '';
          }
        }

        const sub = addr.suburb || addr.subdistrict || addr.quarter || '';
        const neigh = addr.neighbourhood || addr.residential || addr.city_district || '';

        if (!localityArea) {
          if (sub && neigh && sub !== neigh) {
            localityArea = `${sub}, ${neigh}`;
          } else {
            localityArea = sub || neigh || '';
          }
        }

        if (!cityName) {
          cityName = addr.city || addr.town || addr.village || addr.municipality || addr.county || addr.state_district || '';
        }
        if (!state) {
          state = addr.state || '';
        }
        if (!pin) {
          pin = extractPincode(osmData);
        }
      }

      if (!pin && osmAreaData) {
        pin = extractPincode(osmAreaData);
        if (!localityArea && osmAreaData.address) {
          localityArea = osmAreaData.address.suburb || osmAreaData.address.subdistrict || osmAreaData.address.neighbourhood || '';
        }
        if (!cityName && osmAreaData.address) {
          cityName = osmAreaData.address.city || osmAreaData.address.town || osmAreaData.address.village || osmAreaData.address.county || '';
        }
        if (!state && osmAreaData.address) {
          state = osmAreaData.address.state || '';
        }
      }

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

      // Fallback: If Pincode is still empty, search Indian Postal Pincode API by Locality/City
      if (!pin && (localityArea || cityName)) {
        try {
          const searchTarget = localityArea || cityName;
          const pinRes = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(searchTarget)}`)
            .then(res => res.json())
            .catch(() => null);
          if (pinRes && pinRes[0] && pinRes[0].Status === 'Success' && pinRes[0].PostOffice && pinRes[0].PostOffice.length > 0) {
            const foundPin = pinRes[0].PostOffice[0].Pincode;
            if (foundPin && String(foundPin).length === 6) {
              pin = String(foundPin);
            }
          }
        } catch (pErr) {
          console.log('Postal pincode API error:', pErr);
        }
      }

      let cleanAddress = googleFormattedAddr;

      if (!cleanAddress && osmData && osmData.display_name) {
        cleanAddress = osmData.display_name
          .replace(/unnamed road,?/gi, '')
          .replace(/, India$/i, '')
          .replace(/, 700\d{3}$/i, '')
          .trim();

        if (pin && !cleanAddress.includes(pin)) {
          cleanAddress = `${cleanAddress}, ${pin}`;
        }
      }

      if (!cleanAddress) {
        let parts = [streetOrBuilding, localityArea, cityName, state, pin].filter(Boolean);
        parts = parts.filter((item, index, self) =>
          item && self.findIndex(t => t.toLowerCase() === item.toLowerCase()) === index
        );
        cleanAddress = parts.join(', ');
      }

      if (!cleanAddress) {
        cleanAddress = `Location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      }

      // console.log('🗺️ [LOCATION REVERSED] Address:', cleanAddress, '| City:', cityName, '| State:', state, '| Pincode:', pin);

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

    Geolocation.getCurrentPosition(
      async position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        // console.log('📡 [GPS LOCATION SUCCESS] Lat:', lat, 'Lng:', lng);
        setLatitude(lat);
        setLongitude(lng);
        setLocationLoading(false);
        await reverseGeocode(lat, lng);
      },
      error => {
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
            setLocationLoading(false);
            Alert.alert("Location Error", "Could not detect your current location. Please check your GPS settings or select location manually.");
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
    setLatitude(lat);
    setLongitude(lng);
    await reverseGeocode(lat, lng);
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: isDarkMode ? '#334155' : AllColors.screenBg,
      borderColor: isDarkMode ? '#475569' : AllColors.lightGrey,
      color: theme.textPrimary,
    },
  ];
  const placeholderColor = isDarkMode ? '#94A3B8' : AllColors.slateLight;

  // Permission not granted view
  if (hasLocationPermission === false) {
    return (
      <SafeAreaView style={[styles.mapContainer, { backgroundColor: theme.bg }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={[styles.topHeader, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.topHeaderTitle, { color: theme.textPrimary }]}>Select Location</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.permissionContainer, { backgroundColor: theme.bg }]}>
          <View style={[styles.permissionIconCircle, { backgroundColor: isDarkMode ? '#1E293B' : AllColors.softPinkBg }]}>
            <Ionicons name="location-outline" size={60} color={AllColors.primary} />
          </View>
          <Text style={[styles.permissionTitle, { color: theme.textPrimary }]}>Location Access Required</Text>
          <Text style={[styles.permissionSub, { color: theme.textSecondary }]}>
            Please enable location permission to view the map and select your delivery address.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestmapPermission} activeOpacity={0.85}>
            <Text style={styles.permissionBtnText}>Enable Location Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Loading coordinates view
  if (latitude === null || longitude === null) {
    return (
      <SafeAreaView style={[styles.mapContainer, { backgroundColor: theme.bg }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={[styles.topHeader, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.topHeaderTitle, { color: theme.textPrimary }]}>Select Location</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.permissionContainer, { backgroundColor: theme.bg }]}>
          <ActivityIndicator size="large" color={AllColors.primary} />
          <Text style={[styles.permissionTitle, styles.mt16, { color: theme.textPrimary }]}>Detecting Live Location...</Text>
          <Text style={[styles.permissionSub, { color: theme.textSecondary }]}>Please wait while we retrieve your current position.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.mapContainer, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {/* Header Bar */}
      <View style={[styles.topHeader, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topHeaderTitle, { color: theme.textPrimary }]}>Select Location</Text>
        <TouchableOpacity style={styles.refreshLocBtn} onPress={getCurrentLocation} activeOpacity={0.8}>
          <Ionicons name="locate" size={22} color={AllColors.primary} />
        </TouchableOpacity>
      </View>

      {/* Floating Status Chip */}
      {locationLoading && (
        <View style={[styles.locatingChip, { backgroundColor: theme.cardBg }]}>
          <ActivityIndicator size="small" color={AllColors.primary} />
          <Text style={[styles.locatingText, { color: theme.textPrimary }]}>Locating your position...</Text>
        </View>
      )}

      <MapView
        style={styles.map}
        customMapStyle={isDarkMode ? darkMapStyle : []}
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
      <View style={[styles.bottomCardContainer, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
        <Text style={[styles.addressText, { color: theme.textPrimary }]}>{address || 'Fetching live address...'}</Text>
        <TouchableOpacity style={styles.AddAddressButton} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <Text style={styles.AddAdressText}>Add Address Details</Text>
        </TouchableOpacity>
      </View>

      {/* Save Address Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.cardBg }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Save Address</Text>
                <Text style={[styles.modalSub, { color: theme.textSecondary }]}>Add your delivery address details</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <Entypo name="cross" size={28} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* House No */}
              <TextInput
                value={houseNo}
                onChangeText={setHouseNo}
                placeholder="Flat / House / Building Name *"
                placeholderTextColor={placeholderColor}
                style={inputStyle}
              />

              {/* Current Address Card */}
              <View style={[styles.addressCard, { backgroundColor: isDarkMode ? '#0F172A' : AllColors.divider }]}>
                <Text style={[styles.addressLabel, { color: theme.textSecondary }]}>Area / Sector / Locality</Text>
                <Text style={[styles.addressValue, { color: theme.textPrimary }]}>{address}</Text>
              </View>

              {/* Name */}
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter Full Name *"
                placeholderTextColor={placeholderColor}
                style={inputStyle}
              />

              {/* Mobile */}
              <TextInput
                value={mobile}
                onChangeText={(text) => setMobile(text.replace(/[^0-9]/g, '').slice(0, 10))}
                placeholder="10-digit Mobile Number *"
                placeholderTextColor={placeholderColor}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                maxLength={10}
                style={inputStyle}
              />

              {/* Alternate Mobile */}
              <TextInput
                value={altMobile}
                onChangeText={(text) => setAltMobile(text.replace(/[^0-9]/g, '').slice(0, 10))}
                placeholder="Alternate Mobile Number (Optional)"
                placeholderTextColor={placeholderColor}
                keyboardType="phone-pad"
                textContentType="none"
                autoComplete="off"
                importantForAutofill="no"
                maxLength={10}
                style={inputStyle}
              />

              {/* Landmark */}
              <TextInput
                value={landmark}
                onChangeText={setLandmark}
                placeholder="Landmark"
                placeholderTextColor={placeholderColor}
                style={inputStyle}
              />

              {/* Road */}
              <TextInput
                value={roadName}
                onChangeText={setRoadName}
                placeholder="Road Name"
                placeholderTextColor={placeholderColor}
                style={inputStyle}
              />

              {/* State */}
              <TextInput
                value={stateName}
                onChangeText={setStateName}
                placeholder="State *"
                placeholderTextColor={placeholderColor}
                style={inputStyle}
              />

              {/* City */}
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="City *"
                placeholderTextColor={placeholderColor}
                style={inputStyle}
              />

              {/* PIN Code */}
              <TextInput
                value={zipCode}
                onChangeText={setpinCode}
                placeholder="PIN Code *"
                placeholderTextColor={placeholderColor}
                keyboardType="number-pad"
                maxLength={6}
                style={inputStyle}
              />

              {/* Address Type */}
              <Text style={[styles.typeTitle, { color: theme.textPrimary }]}>Address Type</Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: isDarkMode ? '#334155' : AllColors.screenBg,
                      borderColor: isDarkMode ? '#475569' : AllColors.lightGrey,
                    },
                    typeType === 'Home' && styles.activeTypeBtn,
                  ]}
                  onPress={() => setTypeType('Home')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeBtnText, { color: theme.textPrimary }, typeType === 'Home' && styles.activeTypeBtnText]}>
                    🏠 Home
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: isDarkMode ? '#334155' : AllColors.screenBg,
                      borderColor: isDarkMode ? '#475569' : AllColors.lightGrey,
                    },
                    typeType === 'Office' && styles.activeTypeBtn,
                  ]}
                  onPress={() => setTypeType('Office')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeBtnText, { color: theme.textPrimary }, typeType === 'Office' && styles.activeTypeBtnText]}>
                    🏢 Office
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Use Live Location */}
              <TouchableOpacity
                style={[styles.locationBtn, { backgroundColor: isDarkMode ? '#0F172A' : AllColors.divider }]}
                onPress={getCurrentLocation}
                activeOpacity={0.85}>
                <Text style={[styles.locationText, { color: theme.textPrimary }]}>Use Live Location</Text>
              </TouchableOpacity>

              {/* Save Button */}
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
    borderBottomWidth: 1,
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
  typeBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeTypeBtn: {
    borderColor: AllColors.primary,
    backgroundColor: AllColors.softPinkBg,
  },
  activeTypeBtnText: {
    color: AllColors.primary,
  },
  locationBtn: {
    backgroundColor: AllColors.divider,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: AllColors.slateDark,
  },
  saveBtn: {
    backgroundColor: AllColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  savingBtnDisabled: {
    opacity: 0.7,
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
});
