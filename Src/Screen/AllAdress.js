import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { BASE_URL, getToken, getuserId } from '../Api/Api';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
export default function AllAddress() {
  const [addressList, setAddressList] = useState([]);
  const [loading, setLoading] = useState(true);
const [menuId, setMenuId] = useState(null);
const Navigation=useNavigation()

const confirmUpdate = (addressId) => {
   Alert.alert(
    'Update Address',
    'Are you sure you want to update this location?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: () => handleUpdatte(addressId),
      },
    ],
    { cancelable: true }
  );
 
};
const handleUpdatte =()=>{
  console.log('no ')
}
const confirmDelete = (addressId) => {
  Alert.alert(
    'Delete Address',
    'Are you sure you want to delete this location?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: () => handleDelete(addressId),
      },
    ],
    { cancelable: true }
  );
};
const handleDelete = async (addressId) => {
  try {
    const token = await getToken();

    const response = await fetch(`${BASE_URL}delete-address`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address_id: addressId,
      }),
    });

    const result = await response.json();

    // console.log('Delete Response:', result);

    if (response.ok && result.status) {
      // Alert.alert('Success', 'Address deleted successfully.');
requestForAllAddress()
    //  requestForChangeAddress()
      setMenuId(null);

    //   if (selectedAddress?.id === addressId) {
    //     setSelectedAddress(null);
    //   }

    } else {
      Alert.alert('Error', result.message || 'Failed to delete address.');
    }

  } catch (error) {
    console.log(error);
    Alert.alert('Error', 'Something went wrong.');
  }
};
  useEffect(() => {
    requestForAllAddress();
  }, []);
const openAddAddress =()=>{
    Navigation.navigate('MapScreen')
}
  const requestForAllAddress = async () => {
    const token = await getToken();
    const ID = await getuserId();

    try {
      const response = await fetch(`${BASE_URL}list-address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: ID,
        }),
      });

      const data = await response.json();

      console.log(data);

      if (response.ok) {
        setAddressList(data.data || []);
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

return (
  <View style={{ flex: 1, padding: 15 }}>
    {/* Header */}
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>My Addresses</Text>

      {/* Show only when address list has data */}
      {addressList?.length > 0 && (
        <TouchableOpacity
          onPress={openAddAddress}
          style={styles.addBtn}>
          <MaterialCommunityIcons
            name="plus"
            size={18}
            color="#FF4D6D"
          />
          <Text style={styles.addBtnText}>Add New Address</Text>
        </TouchableOpacity>
      )}
    </View>

    {addressList?.length === 0 ? (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="map-marker-off-outline"
          size={90}
          color="#D0D0D0"
        />

        <Text style={styles.emptyTitle}>No Address Found</Text>

        <Text style={styles.emptySubTitle}>
          You don't have any saved addresses yet.
          {"\n"}
          Add a new address to continue shopping.
        </Text>

        <TouchableOpacity
          style={styles.emptyButton}
          onPress={openAddAddress}>
          <MaterialCommunityIcons
            name="plus"
            size={18}
            color="#fff"
          />
          <Text style={styles.emptyButtonText}>
            Add New Address
          </Text>
        </TouchableOpacity>
      </View>
    ) : (
      <FlatList
        data={addressList}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.name}>{item.name}</Text>

              <View style={{ position: 'relative' }}>
                <TouchableOpacity
                  onPress={() =>
                    setMenuId(menuId === item.id ? null : item.id)
                  }>
                  <MaterialCommunityIcons
                    name="dots-vertical"
                    size={20}
                    color="#555"
                  />
                </TouchableOpacity>

                {menuId === item.id && (
                  <View style={styles.menu}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        setMenuId(null);
                        handleEdit(item);
                      }}>
                      <MaterialCommunityIcons
                        name="pencil-outline"
                        size={17}
                      />
                      <Text style={styles.menuText}>Edit</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        setMenuId(null);
                        confirmDelete(item.id);
                      }}>
                      <MaterialCommunityIcons
                        name="delete-outline"
                        size={17}
                        color="red"
                      />
                      <Text
                        style={[
                          styles.menuText,
                          { color: 'red' },
                        ]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.mobile}>{item.mobile}</Text>

            <Text style={styles.address}>
              {item.house_no}, {item.road_name}
              {"\n"}
              {item.landmark}
              {"\n"}
              {item.city}, {item.state} - {item.pin}
            </Text>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.type}</Text>
            </View>
          </View>
        )}
      />
    )}
  </View>
);
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
  },
headerContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 15,
},
emptyContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 30,
},

emptyTitle: {
  marginTop: 18,
  fontSize: 22,
  fontWeight: '700',
  color: '#222',
},

emptySubTitle: {
  marginTop: 10,
  fontSize: 15,
  color: '#777',
  textAlign: 'center',
  lineHeight: 22,
},

emptyButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FF4D6D',
  paddingHorizontal: 22,
  paddingVertical: 12,
  borderRadius: 30,
  marginTop: 28,
},

emptyButtonText: {
  color: '#fff',
  fontSize: 15,
  fontWeight: '600',
  marginLeft: 8,
},
headerTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: '#222',
},

addBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 4,
},

addBtnText: {
  marginLeft: 4,
  color: '#FF4D6D',
  fontSize: 15,
  fontWeight: '600',
},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },

  mobile: {
    marginTop: 3,
    fontSize: 13,
    color: '#666',
  },

  address: {
    marginTop: 5,
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },

  badge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#FFE8EC',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 15,
  },

  badgeText: {
    color: '#FF4D6D',
    fontSize: 11,
    fontWeight: '600',
  },

  menu: {
    position: 'absolute',
    right: 0,
    top: 24,
    width: 130,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 8,
    zIndex: 999,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  menuText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },

  divider: {
    height: 1,
    backgroundColor: '#eee',
  },
});