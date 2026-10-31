import React, { useEffect, useState, useRef } from 'react';
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
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import AllColors from '../../../Constants/Color';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getUserProfileApi, saveAddressApi, getToken, getuserId, getMobile } from "../../../Api/Api";
import SuccessModal from "../../../Common/SuccessScreen";
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STATUSBAR_HEIGHT } from '../../../Constants/ScreenUtils';
import { useTheme } from '../../../Context/ThemeContext';
import { getCoordinatesFromAddress, isValidCoordinate } from '../../../Common/geocodeUtils';

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

const GOOGLE_MAPS_API_KEY = "AIzaSyA5Jo2sWSApjLojgYNdSgyICND-t3Gzb5M";

export default function MapScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const isFromSaveAddress = Boolean(route?.params?.fromSaveAddress);
  const isFromCart = Boolean(
    (route?.params?.fromCart || route?.params?.returnScreen === 'CartPage') &&
    !route?.params?.fromAddressList
  );
  const { theme, isDarkMode } = useTheme();

  // Coordinates & Permission state (no default lat/lng)
  const [latitude, setLatitude] = useState(
    route?.params?.initialLat ? Number(route.params.initialLat) : null
  );
  const [longitude, setLongitude] = useState(
    route?.params?.initialLng ? Number(route.params.initialLng) : null
  );
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const [locationLoading, setLocationLoading] = useState(!route?.params?.initialLat);
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
  const [customType, setCustomType] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastSavedId, setLastSavedId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef(null);
  const mapRef = useRef(null);

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (!text || text.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchTimeoutRef.current = setTimeout(() => {
      executeSearch(text);
    }, 350);
  };

  const executeSearch = async (text) => {
    if (!text || text.trim().length < 2) return;
    setSearchLoading(true);
    try {
      const q = text.trim();
      const currentLat = latitude;
      const currentLng = longitude;
      const results = [];
      const seen = new Set();

      const addResult = (item) => {
        const key = item.lat && item.lon
          ? `${parseFloat(item.lat).toFixed(3)}_${parseFloat(item.lon).toFixed(3)}`
          : (item.place_id || item.display_name);
        if (!seen.has(key)) {
          seen.add(key);
          results.push(item);
        }
      };

      // 1. Google Places Autocomplete with user API key
      const gPlacesPromise = fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&components=country:in&key=${GOOGLE_MAPS_API_KEY}`
      ).then((r) => r.json()).catch(() => ({ predictions: [] }));

      // 2. Nominatim OpenStreetMap (India specific query)
      const nPromise = fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&limit=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'DeeBazer-ECommerce-App/1.0 (contact@deebazar.com)',
            'Accept-Language': 'en',
          },
        }
      ).then((r) => r.json()).catch(() => []);

      // 3. Photon (OSM geocoder with regional proximity bias if location is available)
      const photonUrl = (currentLat && currentLng)
        ? `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=${currentLat}&lon=${currentLng}&limit=10&lang=en`
        : `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=10&lang=en`;
      const pPromise = fetch(photonUrl).then((r) => r.json()).catch(() => ({ features: [] }));

      const [gData, nData, pData] = await Promise.all([gPlacesPromise, nPromise, pPromise]);

      // Process Google Places predictions
      if (gData && Array.isArray(gData.predictions)) {
        gData.predictions.forEach((p) => {
          const mainText = p.structured_formatting?.main_text || (p.description ? p.description.split(',')[0] : q);
          addResult({
            place_id: p.place_id,
            name: mainText,
            display_name: p.description,
            lat: null,
            lon: null,
          });
        });
      }

      // Process Nominatim results
      if (Array.isArray(nData)) {
        nData.forEach((item) => {
          const parts = (item.display_name || '').split(',').map((s) => s.trim());
          const primaryName = parts[0] || q;
          addResult({
            place_id: `nom-${item.place_id || Math.random()}`,
            name: primaryName,
            display_name: item.display_name,
            lat: String(item.lat),
            lon: String(item.lon),
          });
        });
      }

      // Process Photon results
      if (pData && Array.isArray(pData.features)) {
        pData.features.forEach((f) => {
          const p = f.properties || {};
          const coords = f.geometry?.coordinates || [];
          const lng = coords[0];
          const lat = coords[1];

          const isIndia = p.countrycode === 'IN' || p.country === 'India' || (lat >= 6 && lat <= 38 && lng >= 68 && lng <= 98);
          if (isIndia && lat && lng) {
            const parts = [
              p.name,
              p.street,
              p.district || p.suburb || p.locality,
              p.city,
              p.state,
              p.postcode,
            ].filter(Boolean);

            const uniqueParts = parts.filter((val, idx, self) => self.indexOf(val) === idx);
            const displayName = uniqueParts.join(', ');

            addResult({
              place_id: `pho-${p.osm_id || Math.random()}`,
              name: p.name || uniqueParts[0] || q,
              display_name: displayName,
              lat: String(lat),
              lon: String(lng),
            });
          }
        });
      }

      setSearchResults(results);
    } catch (e) {
      console.log('Search places error:', e);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchLoading(false);
    Keyboard.dismiss();
  };

  const handleSelectSearchResult = async (item) => {
    Keyboard.dismiss();
    setSearchResults([]);
    setSearchQuery(item.name || (item.display_name ? item.display_name.split(',')[0] : ''));

    let lat = parseFloat(item.lat);
    let lng = parseFloat(item.lon);

    // Fetch coordinates from Google Places if needed
    if ((isNaN(lat) || isNaN(lng)) && item.place_id && !String(item.place_id).startsWith('nom-') && !String(item.place_id).startsWith('pho-')) {
      try {
        const detailsRes = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.place_id}&fields=geometry,formatted_address&key=${GOOGLE_MAPS_API_KEY}`
        ).then((r) => r.json());
        if (detailsRes?.result?.geometry?.location) {
          lat = detailsRes.result.geometry.location.lat;
          lng = detailsRes.result.geometry.location.lng;
        }
      } catch (e) {
        console.log('Place details fetch error:', e);
      }
    }

    if (!isNaN(lat) && !isNaN(lng)) {
      setLatitude(lat);
      setLongitude(lng);

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }, 500);
      }

      await reverseGeocode(lat, lng);
    }
  };
  useEffect(() => {
    if (route?.params?.initialLat && route?.params?.initialLng) {
      const lat = Number(route.params.initialLat);
      const lng = Number(route.params.initialLng);
      setLatitude(lat);
      setLongitude(lng);
      setHasLocationPermission(true);
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          }, 500);
        }
      }, 300);
      reverseGeocode(lat, lng);
    } else {
      requestmapPermission();
    }
    loadUserData();
  }, [route?.params]);

  const handleConfirmForSaveAddress = () => {
    if (!latitude || !longitude) {
      Alert.alert("Select Location", "Please select a location on the map first.");
      return;
    }
    navigation.navigate('SaveAddress', {
      fromMap: true,
      fromCart: isFromCart,
      returnScreen: isFromCart ? 'CartPage' : undefined,
      latitude: latitude,
      longitude: longitude,
      city: city || '',
      state: stateName || '',
      pin: zipCode || '',
      houseNo: houseNo || '',
      roadName: roadName || '',
      landmark: landmark || '',
      address: address || '',
      name: route?.params?.currentName || '',
      mobile: route?.params?.currentMobile || '',
      type: route?.params?.currentType || 'Home',
      customType: route?.params?.currentCustomType || '',
      isEdit: route?.params?.isEdit,
      addressData: route?.params?.addressData,
    });
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

      const finalAddressType = typeType === 'Other' ? (customType.trim() || 'Other') : typeType;

      let finalLat = latitude;
      let finalLng = longitude;

      if (!isValidCoordinate(finalLat, finalLng)) {
        const coords = await getCoordinatesFromAddress(houseNo, roadName, landmark, city, stateName, zipCode);
        if (coords && isValidCoordinate(coords.latitude, coords.longitude)) {
          finalLat = coords.latitude;
          finalLng = coords.longitude;
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
        type: finalAddressType,
        status: "active"
      };

      if (isValidCoordinate(finalLat, finalLng)) {
        payload.latitude = Number(Number(finalLat).toFixed(6));
        payload.longitude = Number(Number(finalLng).toFixed(6));
      } else {
        payload.latitude = 22.5726;
        payload.longitude = 88.3639;
      }

      const res = await saveAddressApi(payload);

      const resStatus = res?.status ?? res?.data?.status;
      const resSuccess = res?.success ?? res?.data?.success;
      const resMsg = res?.message || res?.data?.message;

      const getApiErrorMessage = (resp, fallback) => {
        if (resp?.message && typeof resp.message === 'string') return resp.message;
        if (resp?.data?.message && typeof resp.data.message === 'string') return resp.data.message;
        if (resp?.errors && typeof resp.errors === 'object') {
          const firstKey = Object.keys(resp.errors)[0];
          if (firstKey && Array.isArray(resp.errors[firstKey]) && resp.errors[firstKey][0]) {
            return resp.errors[firstKey][0];
          }
        }
        if (resp?.data?.errors && typeof resp.data.errors === 'object') {
          const firstKey = Object.keys(resp.data.errors)[0];
          if (firstKey && Array.isArray(resp.data.errors[firstKey]) && resp.data.errors[firstKey][0]) {
            return resp.data.errors[firstKey][0];
          }
        }
        return resp?.error || resp?.data?.error || fallback;
      };

      const isOk = (
        resStatus === 200 ||
        resStatus === '200' ||
        resStatus === 201 ||
        resStatus === '201' ||
        resSuccess === true ||
        resSuccess === 'true' ||
        res?.id ||
        res?.data?.id ||
        res?.address_id ||
        res?.data?.address_id ||
        (typeof resMsg === 'string' && /success|saved/i.test(resMsg)) ||
        (res?.ok && !res?.error && resStatus !== 400 && resStatus !== 422)
      );

      const savedAddressId =
        res?.id ||
        res?.data?.id ||
        res?.address_id ||
        res?.data?.address_id ||
        res?.data?.data?.id ||
        res?.address?.id ||
        res?.data?.address?.id ||
        null;
      setLastSavedId(savedAddressId);

      if (isOk) {
        setModalVisible(false);
        if (isFromCart) {
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
          navigation.navigate('CartPage', savedAddressId ? { selectedAddressId: savedAddressId } : undefined);
        } else {
          setIsSuccess(true);
          setTimeout(() => {
            setIsSuccess(false);
            navigation.reset({
              index: 1,
              routes: [
                { name: 'AppTab', state: { routes: [{ name: 'Account' }] } },
                { name: 'AllAddress' },
              ],
            });
          }, 1200);
        }
      } else {
        Alert.alert("Error", getApiErrorMessage(res, "Unable to save address."));
      }
    } catch (error) {
      console.log("Save Address Error:", error);
      Alert.alert("Error", error?.message || "Something went wrong.");
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
      let premiseStr = '';
      let buildingName = '';

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
        premiseStr = '';

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
        buildingName = addr.house_number || addr.building || addr.shop || addr.amenity || addr.complex || addr.railway || '';

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
          .replace(/, \d{6}$/i, '')
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
      setHouseNo(premiseStr || (buildingName && buildingName !== streetOrBuilding ? buildingName : '') || '');
      setRoadName(streetOrBuilding || localityArea || '');
      if (cityName) setCity(cityName);
      if (state) setStateName(state);
      if (pin) setpinCode(pin);
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
        setLatitude(lat);
        setLongitude(lng);
        setLocationLoading(false);
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 500);
        }
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
    if (lat === null || lat === undefined || lng === null || lng === undefined) return;
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (isNaN(numLat) || isNaN(numLng)) return;

    setLatitude(numLat);
    setLongitude(numLng);
    setAddress('Fetching address for selected point...');

    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: numLat,
        longitude: numLng,
        latitudeDelta: 0.006,
        longitudeDelta: 0.006,
      }, 350);
    }

    await reverseGeocode(numLat, numLng);
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
      <SafeAreaView edges={[]} style={[styles.mapContainer, { backgroundColor: theme.bg }]}>
        <StatusBar backgroundColor="transparent" barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent={true} />
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

          <TouchableOpacity
            style={[
              styles.permissionBtn,
              {
                backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                borderWidth: 1.5,
                borderColor: AllColors.primary,
                marginTop: 12,
              },
            ]}
            onPress={() =>
              navigation.navigate('SaveAddress', {
                fromCart: isFromCart,
                returnScreen: isFromCart ? 'CartPage' : undefined,
              })
            }
            activeOpacity={0.85}
          >
            <Text style={[styles.permissionBtnText, { color: AllColors.primary }]}>
              Add Other Location (Manual)
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={[]} style={[styles.mapContainer, { backgroundColor: theme.bg }]}>
      <StatusBar backgroundColor="transparent" barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent={true} />
      {/* Header Bar */}
      <View style={[styles.topHeader, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topHeaderTitle, { color: theme.textPrimary }]}>Select Location</Text>
        <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <TouchableOpacity
            style={[
              styles.headerActionBtn,
              {
                backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                borderColor: isDarkMode ? '#334155' : '#CBD5E1',
              },
            ]}
            onPress={getCurrentLocation}
            activeOpacity={0.8}>
            <Ionicons name="locate" size={16} color={AllColors.primary} />
            <Text style={[styles.headerActionText, { color: AllColors.primary }]}>Live Location</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.headerActionBtn,
              {
                backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                borderColor: AllColors.primary,
              },
            ]}
            onPress={() =>
              navigation.navigate('SaveAddress', {
                fromCart: isFromCart,
                returnScreen: isFromCart ? 'CartPage' : undefined,
              })
            }
            activeOpacity={0.8}>
            <Ionicons name="create-outline" size={16} color={AllColors.primary} />
            <Text style={[styles.headerActionText, { color: AllColors.primary }]}>Other Location</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Content Area with Floating Search & Actions */}
      <View style={{ flex: 1, position: 'relative' }}>
        {/* Floating Search Bar on Map */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: isDarkMode ? '#1E293B' : AllColors.white, borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
            <Ionicons name="search" size={20} color={AllColors.primary} style={styles.searchIcon} />
            <TextInput
              placeholder="Search area, landmark or street..."
              placeholderTextColor={isDarkMode ? '#94A3B8' : '#777'}
              value={searchQuery}
              onChangeText={handleSearchChange}
              style={[styles.searchInput, { color: theme.textPrimary }]}
              returnKeyType="search"
              onSubmitEditing={() => executeSearch(searchQuery)}
            />
            {searchLoading ? (
              <ActivityIndicator size="small" color={AllColors.primary} style={{ marginRight: 6 }} />
            ) : searchQuery.length > 0 ? (
              <TouchableOpacity onPress={clearSearch} style={{ padding: 4, marginRight: 2 }}>
                <Ionicons name="close-circle" size={18} color={isDarkMode ? '#94A3B8' : '#888'} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Search Results Dropdown List */}
          {searchResults.length > 0 && (
            <View style={[styles.searchResultsCard, { backgroundColor: isDarkMode ? '#1E293B' : AllColors.white, borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
              <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled={true} style={{ maxHeight: 280 }}>
                {searchResults.map((item, idx) => (
                  <TouchableOpacity
                    key={`res-${idx}-${item.place_id || idx}`}
                    style={[
                      styles.searchResultItem,
                      idx < searchResults.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#334155' : AllColors.divider },
                    ]}
                    onPress={() => handleSelectSearchResult(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.searchPinIconWrapper}>
                      <Ionicons name="location-sharp" size={16} color={AllColors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.searchResultTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                        {item.name || (item.display_name ? item.display_name.split(',')[0] : 'Location')}
                      </Text>
                      <Text style={[styles.searchResultSub, { color: isDarkMode ? '#94A3B8' : AllColors.slateSub }]} numberOfLines={2}>
                        {item.display_name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Floating Status Chip (when fetching location) */}
        {locationLoading && (
          <View style={[styles.locatingChip, { backgroundColor: isDarkMode ? '#1E293B' : AllColors.white }]}>
            <ActivityIndicator size="small" color={AllColors.primary} />
            <Text style={[styles.locatingText, { color: theme.textPrimary }]}>Fetching live location...</Text>
          </View>
        )}

        <MapView
          ref={mapRef}
          style={styles.map}
          customMapStyle={isDarkMode ? darkMapStyle : []}
          region={latitude && longitude ? {
            latitude: latitude,
            longitude: longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          } : undefined}
          onPress={(e) => {
            if (e?.nativeEvent?.coordinate) {
              handleSelectLocation(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude);
            }
          }}
          onPoiClick={(e) => {
            if (e?.nativeEvent?.coordinate) {
              handleSelectLocation(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude);
            }
          }}
          onLongPress={(e) => {
            if (e?.nativeEvent?.coordinate) {
              handleSelectLocation(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude);
            }
          }}
        >
          {latitude && longitude ? (
            <Marker
              draggable
              coordinate={{
                latitude: latitude,
                longitude: longitude,
              }}
              title="Selected Location"
              description={address || "Delivery location"}
              onDragEnd={(e) => {
                if (e?.nativeEvent?.coordinate) {
                  handleSelectLocation(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude);
                }
              }}
            />
          ) : null}
        </MapView>

        {/* Floating GPS Button on Map */}
        <TouchableOpacity
          style={[styles.floatingGpsBtn, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}
          onPress={getCurrentLocation}
          activeOpacity={0.85}
        >
          <Ionicons name="locate" size={24} color={AllColors.primary} />
        </TouchableOpacity>

        {/* Floating Bottom Card */}
        <View style={[styles.bottomCardContainer, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
          <Text style={[styles.addressText, { color: theme.textPrimary }]}>{address || (locationLoading ? 'Detecting your location...' : 'Search or tap on map to pick location')}</Text>
          {isFromSaveAddress ? (
            <TouchableOpacity
              style={[styles.AddAddressButton, { backgroundColor: AllColors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
              onPress={handleConfirmForSaveAddress}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.AddAdressText}>Confirm This Location</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.AddAddressButton} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
              <Text style={styles.AddAdressText}>Add Address Details</Text>
            </TouchableOpacity>
          )}
        </View>
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
                    typeType === 'Work' && styles.activeTypeBtn,
                  ]}
                  onPress={() => setTypeType('Work')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeBtnText, { color: theme.textPrimary }, typeType === 'Work' && styles.activeTypeBtnText]}>
                    🏢 Work
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: isDarkMode ? '#334155' : AllColors.screenBg,
                      borderColor: isDarkMode ? '#475569' : AllColors.lightGrey,
                    },
                    typeType === 'Other' && styles.activeTypeBtn,
                  ]}
                  onPress={() => setTypeType('Other')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeBtnText, { color: theme.textPrimary }, typeType === 'Other' && styles.activeTypeBtnText]}>
                    🏷️ {typeType === 'Other' && customType.trim() ? customType.trim() : 'Other'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Custom Address Type Title / Value Input */}
              {typeType === 'Other' && (
                <TextInput
                  value={customType}
                  onChangeText={setCustomType}
                  placeholder="Enter Title / Address Type (e.g. Hostel, Gym, Hotel)"
                  placeholderTextColor={placeholderColor}
                  maxLength={30}
                  style={[inputStyle, { marginBottom: 12 }]}
                />
              )}

              {/* Location Action Buttons */}
              <View style={{ flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                <TouchableOpacity
                  style={[
                    styles.locationBtn,
                    {
                      marginBottom: 0,
                      backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                      borderWidth: 1.5,
                      borderColor: AllColors.primary,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 15,
                      borderRadius: 12,
                    },
                  ]}
                  onPress={() => {
                    setModalVisible(false);
                    navigation.navigate('SaveAddress', {
                      fromCart: isFromCart,
                      returnScreen: isFromCart ? 'CartPage' : undefined,
                    });
                  }}
                  activeOpacity={0.85}>
                  <Ionicons name="create-outline" size={18} color={AllColors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.locationText, { color: AllColors.primary, fontSize: 15, fontWeight: '700' }]}>Other Location (Manual)</Text>
                </TouchableOpacity>
              </View>

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
          if (isFromCart) {
            if (lastSavedId) {
              AsyncStorage.setItem('SELECTED_CART_ADDRESS_ID', String(lastSavedId)).catch(() => {});
            }
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
            navigation.navigate('CartPage', lastSavedId ? { selectedAddressId: lastSavedId } : undefined);
          } else {
            navigation.reset({
              index: 1,
              routes: [
                { name: 'AppTab', state: { routes: [{ name: 'Account' }] } },
                { name: 'AllAddress' },
              ],
            });
          }
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
    paddingTop: STATUSBAR_HEIGHT + 10,
    paddingBottom: 12,
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
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  headerActionText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
  floatingGpsBtn: {
    position: 'absolute',
    right: 16,
    bottom: 110,
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    borderWidth: 1,
    zIndex: 15,
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
  searchContainer: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    zIndex: 99,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
    elevation: 6,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
    height: '100%',
  },
  searchResultsCard: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 8,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  searchPinIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(238, 59, 107, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  searchResultSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  locatingChip: {
    position: 'absolute',
    top: 68,
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
    zIndex: 50,
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
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  typeBtn: {
    borderWidth: 1,
    borderColor: AllColors.lightGrey,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 6,
    marginBottom: 6,
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
