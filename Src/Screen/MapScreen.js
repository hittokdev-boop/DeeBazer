import React, { useEffect, useState } from 'react';
import {Alert, Modal, PermissionsAndroid, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import AllColors from '../Constants/Color';
import Entypo from 'react-native-vector-icons/Entypo'
import Geocoder from 'react-native-geocoding';
import { BASE_URL, getToken, getuserId } from "../Api/Api";
import SuccessModal from "../Common/SuccessScreen";
import { useNavigation } from '@react-navigation/native';

export default function MapScreen() {
  const [latitude,setLatitude]=useState(null)
  const [longitude,setLongitude]=useState(null)
  const [modalVisible, setModalVisible] = useState(false);
const [addressType, setAddressType] = useState('home');
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
 const Navigation=useNavigation()

 
const saveAddress = async () => {
  const token = await getToken();
  const ID = await getuserId();

  // Required Fields
  if (
    !name.trim() ||
    !mobile.trim() ||
    !houseNo.trim() ||
    !city.trim() ||
    !stateName.trim() ||
    !zipCode.trim()
  ) {
    Alert.alert("Validation", "Please fill all required fields.");
    return;
  }

  // Mobile Validation (Indian 10-digit)
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    Alert.alert(
      "Validation",
      "Please enter a valid 10-digit mobile number."
    );
    return;
  }

  // PIN Validation
  if (!/^\d{6}$/.test(zipCode)) {
    Alert.alert(
      "Validation",
      "Please enter a valid 6-digit PIN code."
    );
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

    const response = await fetch(`${BASE_URL}save-address`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      // Navigation.navigate('AllAddress')
      setIsSuccess(true);
      Navigation.goBack();
      
    } else {
      Alert.alert("Error", data.message || "Unable to save address.");
    }
  } catch (error) {
    console.log("Save Address Error :", error);
    Alert.alert("Error", "Something went wrong.");
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
          return getCurrentLocation();
        } else {
          console.log('Location permission denied');
        }
      } else {
        return getCurrentLocation();
      }
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    let watchId;
    requestmapPermission().then((id) => {
      watchId = id;
    });

    return () => {
      if (watchId !== undefined) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const reverseGeocode = async (lat, lng) => {
    // 1. Try Google Geocoder first
    try {
      Geocoder.init('AIzaSyCJKwxaSS0glDtxXMX37uHX_KHUEleCMk0');
      const res = await Geocoder.from(lat, lng);
      if (res.results && res.results.length > 0) {
        const parts = res.results[0].formatted_address.split(',').map(s => s.trim());
        const shortAddr = parts.slice(0, 3).join(', ');
        setAddress(shortAddr || res.results[0].formatted_address);

        const comps = res.results[0].address_components || [];
        comps.forEach((c) => {
          if (c.types.includes('postal_code')) setpinCode(c.long_name);
          if (c.types.includes('locality')) setCity(c.long_name);
          if (c.types.includes('administrative_area_level_1')) setStateName(c.long_name);
          if (c.types.includes('route')) setRoadName(c.long_name);
        });
        return;
      }
    } catch (error) {
      console.log('Google Geocoder failed, trying OpenStreetMap fallback:', error);
    }

    // 2. Fallback to OpenStreetMap Nominatim API (Free, concise address format)
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
        const pin = addr.postcode || '';

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
    Geolocation.getCurrentPosition(
      async position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log('Initial GPS Location:', lat, lng, 'Accuracy:', position.coords.accuracy);

        setLatitude(lat);
        setLongitude(lng);
        await reverseGeocode(lat, lng);
      },
      error => {
        console.log('GPS High Accuracy initial failed:', error);
        Geolocation.getCurrentPosition(
          async position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setLatitude(lat);
            setLongitude(lng);
            await reverseGeocode(lat, lng);
          },
          err => console.log('Geolocation Network Fallback Error:', err),
          {
            enableHighAccuracy: false,
            timeout: 20000,
            maximumAge: 0,
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );

    // Live continuous watch for pinpoint accuracy
    const watchId = Geolocation.watchPosition(
      async position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log('Watched Live GPS Location:', lat, lng, 'Accuracy:', position.coords.accuracy);
        setLatitude(lat);
        setLongitude(lng);
        await reverseGeocode(lat, lng);
      },
      err => console.log('Watch Position Error:', err),
      {
        enableHighAccuracy: true,
        distanceFilter: 3, // Update if moved 3 meters
        interval: 4000,
        fastestInterval: 2000,
      }
    );

    return watchId;
  };

  const handleSelectLocation = async (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    await reverseGeocode(lat, lng);
  };

  if (latitude === null || longitude === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text>Loading Map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.map}>
      <MapView
        style={{ height: '80%', width: "100%" }}
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
          title="Current Location"
          description={address}
        />
      </MapView>
      <Text style={styles.addressText}>{address || 'Fetching live address...'}</Text>
<TouchableOpacity style={styles.AddAddressButton}   onPress={() => setModalVisible(true)}>
  <Text style={styles.AddAdressText}>
    Add address Details
  </Text>
</TouchableOpacity>
<Modal
  visible={modalVisible}
  animationType="slide"
  onRequestClose={() => {
    setModalVisible(false);
  }}
  transparent={true}>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15,
        }}>
        <View>
          <Text style={styles.modalTitle}>Save Address</Text>
          <Text style={styles.modalInfo}>
            Add your delivery address details
          </Text>
        </View>

        <TouchableOpacity onPress={() => setModalVisible(false)}>
          <Entypo name="cross" size={28} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* House No */}
        <TextInput
          value={houseNo}
          onChangeText={setHouseNo}
          placeholder="Flat / House / Building Name *"
          style={styles.input}
        />

        {/* Current Address */}
        <View style={styles.addressCard}>
          <Text style={styles.addressLabel}>
            Area / Sector / Locality
          </Text>

          <Text style={styles.addressValue}>
            {address}
          </Text>
        </View>

        {/* Name */}
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter Full Name *"
          style={styles.input}
        />

        {/* Mobile */}
        <TextInput
          value={mobile}
          onChangeText={setMobile}
          placeholder="10-digit Mobile Number *"
          keyboardType="phone-pad"
          style={styles.input}
        />

        {/* Alternate Mobile */}
        <TextInput
          placeholder="Alternate Mobile Number (Optional)"
          keyboardType="phone-pad"
          style={styles.input}
        />

        {/* Landmark */}
        <TextInput
          value={landmark}
          onChangeText={setLandmark}
          placeholder="Landmark"
          style={styles.input}
        />

        {/* Road */}
        <TextInput
          value={roadName}
          onChangeText={setRoadName}
          placeholder="Road Name"
          style={styles.input}
        />

        {/* State */}
        <TextInput
          value={stateName}
          onChangeText={setStateName}
          placeholder="State"
          style={styles.input}
        />

        {/* City */}
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="City"
          style={styles.input}
        />

        {/* Pin */}
        <TextInput
          value={zipCode}
          onChangeText={setpinCode}
          placeholder="Pin Code"
          keyboardType="number-pad"
          style={styles.input}
        />

        {/* Address Type */}
        <Text style={styles.typeTitle}>Address Type</Text>

        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              typeType === 'Home' && styles.activeTypeBtn,
            ]}
            onPress={() => setTypeType('Home')}>
            <Text
              style={{
                color:  '#070707',
              }}>
              🏠 Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeBtn,
              typeType === 'work' && styles.activeTypeBtn,
            ]}
            onPress={() => setTypeType('work')}>
            <Text
              style={{
                color:  '#000',
              }}>
              🏢 work
            </Text>
          </TouchableOpacity>
        </View>

        {/* Current Location */}
        <TouchableOpacity
          style={styles.locationBtn}
          onPress={getCurrentLocation}>
          <Text style={styles.locationText}>
            Use Current Location
          </Text>
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={saveAddress}>
          <Text style={styles.saveBtnText}>
            Save Address
          </Text>
        </TouchableOpacity>

      </ScrollView>

    </View>
  </View>
</Modal>
    <SuccessModal
      visible={isSuccess}
       title=" Save Address "
       message="Your Address have been save successfully."
       onClose={() =>
       setIsSuccess(false)} />
 </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  AddAddressButton:{
    backgroundColor:AllColors.primary,
    padding:10,
    margin:15,
    borderRadius:5
  },
  AddAdressText:{
    color:AllColors.white,
    textAlign:"center",
    fontSize:20
  },
  locationBtn: {
  backgroundColor: AllColors.primary,
  height: 50,
  borderRadius: 10,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 15,
},

locationText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
},
  addressText:{
    borderWidth:1,
    borderColor:AllColors.primary,
    color:AllColors.black,
    // textAlign:'center',
    paddingVertical:16,
    padding:5,
    borderRadius:10,
    marginHorizontal:15,
    marginTop:10
  },modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
  justifyContent: 'flex-end',
},

modalContainer: {
  backgroundColor: '#fff',
  borderTopLeftRadius: 25,
  borderTopRightRadius: 25,
  padding: 20,
},

modalTitle: {
  fontSize: 22,
  fontWeight: '700',
  marginBottom: 15,
},

modalInfo: {
  backgroundColor: '#FFF7E8',
  padding: 12,
  borderRadius: 10,
  marginBottom: 15,
},

input: {
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 10,
  paddingHorizontal: 15,
  marginBottom: 12,
  height: 50,
},

addressCard: {
  backgroundColor: '#F5F5F5',
  padding: 12,
  borderRadius: 10,
  marginBottom: 12,
},

addressLabel: {
  color: '#666',
  marginBottom: 5,
},

addressValue: {
  color: '#111',
},

typeTitle: {
  fontSize: 16,
  fontWeight: '600',
  marginBottom: 10,
},

typeContainer: {
  flexDirection: 'row',
  marginBottom: 20,
},

typeBtn: {
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 10,
  paddingHorizontal: 20,
  paddingVertical: 10,
  marginRight: 10,
},

activeTypeBtn: {
  borderColor: AllColors.primary,
  backgroundColor: '#EAF2FF',
},

saveBtn: {
  backgroundColor: AllColors.primary,
  padding: 15,
  borderRadius: 10,
},

saveBtnText: {
  color: '#fff',
  textAlign: 'center',
  fontSize: 18,
  fontWeight: '600',
},
});