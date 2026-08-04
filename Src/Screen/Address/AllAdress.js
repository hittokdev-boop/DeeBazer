import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { BASE_URL, getToken, getuserId } from '../../Api/Api';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import AllColors from '../../Constants/Color';
import { useTheme } from '../../Context/ThemeContext';
export default function AllAddress() {
  const [addressList, setAddressList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme, isDarkMode } = useTheme();
  const [menuId, setMenuId] = useState(null);
  const Navigation = useNavigation();

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

  const handleUpdatte = () => {
    // console.log('no ')
  };

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

      if (response.ok && result.status) {
        requestForAllAddress();
        setMenuId(null);
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

  const openAddAddress = () => {
    Navigation.navigate('MapScreen');
  };

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

      if (response.ok) {
        setAddressList(data.data || []);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
        <Text style={{ color: theme.textSecondary }}>Loading addresses...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Addresses</Text>

        {/* Show only when address list has data */}
        {addressList?.length > 0 && (
          <TouchableOpacity
            onPress={openAddAddress}
            style={styles.addBtn}>
            <MaterialCommunityIcons
              name="plus"
              size={18}
              color={AllColors.primary}
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
            color={isDarkMode ? '#64748B' : AllColors.lightGrey}
          />

          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Address Found</Text>

          <Text style={[styles.emptySubTitle, { color: theme.textSecondary }]}>
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
              color={AllColors.white}
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
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor, borderWidth: isDarkMode ? 1 : 0 }]}>
              <View style={styles.header}>
                <Text style={[styles.name, { color: theme.textPrimary }]}>{item.name}</Text>

                <View style={styles.menuWrapper}>
                  <TouchableOpacity
                    onPress={() =>
                      setMenuId(menuId === item.id ? null : item.id)
                    }>
                    <MaterialCommunityIcons
                      name="dots-vertical"
                      size={20}
                      color={isDarkMode ? '#94A3B8' : AllColors.slateMuted}
                    />
                  </TouchableOpacity>

                  {menuId === item.id && (
                    <View style={[styles.menu, { backgroundColor: isDarkMode ? '#334155' : AllColors.white, borderColor: theme.borderColor, borderWidth: isDarkMode ? 1 : 0 }]}>
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                          setMenuId(null);
                          // handleEdit(item);
                        }}>
                        <MaterialCommunityIcons
                          name="pencil-outline"
                          size={17}
                          color={theme.textPrimary}
                        />
                        <Text style={[styles.menuText, { color: theme.textPrimary }]}>Edit</Text>
                      </TouchableOpacity>

                      <View style={[styles.divider, { backgroundColor: isDarkMode ? '#475569' : AllColors.divider }]} />

                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                          setMenuId(null);
                          confirmDelete(item.id);
                        }}>
                        <MaterialCommunityIcons
                          name="delete-outline"
                          size={17}
                          color={AllColors.redLight}
                        />
                        <Text
                          style={[
                            styles.menuText,
                            styles.deleteMenuText,
                          ]}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              <Text style={[styles.mobile, { color: theme.textSecondary }]}>{item.mobile}</Text>

              <Text style={[styles.address, { color: theme.textSecondary }]}>
                {item.house_no}, {item.road_name}
                {"\n"}
                {item.landmark}
                {"\n"}
                {item.city}, {item.state} - {item.pin}
              </Text>

              <View style={[styles.badge, { backgroundColor: isDarkMode ? 'rgba(247, 22, 112, 0.2)' : AllColors.softPinkBg }]}>
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
    backgroundColor: AllColors.white,
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
  color: AllColors.slateDark,
},

emptySubTitle: {
  marginTop: 10,
  fontSize: 15,
  color: AllColors.textSecondary,
  textAlign: 'center',
  lineHeight: 22,
},

emptyButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: AllColors.primary,
  paddingHorizontal: 22,
  paddingVertical: 12,
  borderRadius: 30,
  marginTop: 28,
},

emptyButtonText: {
  color: AllColors.white,
  fontSize: 15,
  fontWeight: '600',
  marginLeft: 8,
},
headerTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: AllColors.slateDark,
},

addBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 4,
},

addBtnText: {
  marginLeft: 4,
  color: AllColors.primary,
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
    color: AllColors.slateDark,
  },

  mobile: {
    marginTop: 3,
    fontSize: 13,
    color: AllColors.slateSub,
  },

  address: {
    marginTop: 5,
    fontSize: 13,
    color: AllColors.slateMuted,
    lineHeight: 18,
  },

  badge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: AllColors.softPinkBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 15,
  },

  badgeText: {
    color: AllColors.primary,
    fontSize: 11,
    fontWeight: '600',
  },

  menu: {
    position: 'absolute',
    right: 0,
    top: 24,
    width: 130,
    backgroundColor: AllColors.white,
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
    color: AllColors.slateText,
  },

  deleteMenuText: {
    color: AllColors.redLight,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  screenContainer: {
    flex: 1,
    padding: 15,
  },

  listContent: {
    paddingBottom: 20,
  },

  menuWrapper: {
    position: 'relative',
  },

  divider: {
    height: 1,
    backgroundColor: AllColors.divider,
  },
});