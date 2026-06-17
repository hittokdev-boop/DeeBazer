import React, { useEffect, useState } from 'react';
import {PermissionsAndroid, StyleSheet, View} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
// import Geolocation from 'react-native-geolocation-service';
import Geolocation from '@react-native-community/geolocation';

export default function MapScreen() {
  const [latitude,setLatitude]=useState(null)
  const [longitude,setLongitude]=useState(null)
  const requestmapPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  { title: 'Location Permission', message: 'App needs access to your location.', buttonPositive: 'OK', },
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      getCurrentLocation()
    } else {
      console.log('Camera permission denied');
    }
  } catch (err) {
    console.warn(err);
  }
};

useEffect(()=>{
      requestmapPermission()
},[])
 const getCurrentLocation= () =>{
   Geolocation.getCurrentPosition(
  position => {
    setLatitude(position.coords.latitude)
    setLongitude(position.coords.longitude)
    console.log(position);
  },
  error => {
    console.log(error);
  },
  {
    enableHighAccuracy: false,
    timeout: 30000,
    maximumAge: 10000,
  },
);
}
  return (
  <MapView
  style={{flex: 1}}
  initialRegion={{
    latitude: latitude,
    longitude: longitude,
          latitudeDelta: 0.01,
        longitudeDelta: 0.01,
  }}>
  <Marker
    coordinate={{
      latitude: latitude,
      longitude:longitude,
    }}
    title="Kolkata"
    description="My Location"
  />
</MapView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});