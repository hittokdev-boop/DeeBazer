import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  RefreshControl,
  ScrollView,
  StatusBar,
} from 'react-native';
import { getAddressListApi, deleteAddressApi, getToken, getuserId } from '../../../Api/Api';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AllColors from '../../../Constants/Color';
import { STATUSBAR_HEIGHT } from '../../../Constants/ScreenUtils';
import { useTheme } from '../../../Context/ThemeContext';

export default function AllAddress() {
  const [addressList, setAddressList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { theme, isDarkMode } = useTheme();
  const [menuId, setMenuId] = useState(null);
  const Navigation = useNavigation();

  const handleUpdate = (item) => {
    setMenuId(null);
    Navigation.navigate('SaveAddress', { addressData: item, isEdit: true });
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
      const ID = await getuserId();

      const result = await deleteAddressApi(addressId, ID);
      const success = result.success;
      const errorMsg = result.error || 'Failed to delete address.';

      if (success) {
        requestForAllAddress();
        setMenuId(null);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  useEffect(() => {
    requestForAllAddress();
  }, []);

  useFocusEffect(
    useCallback(() => {
      requestForAllAddress();
    }, [])
  );

  const openAddAddress = () => {
    Navigation.navigate('MapScreen');
  };

  const openAddOtherAddress = () => {
    Navigation.navigate('SaveAddress');
  };

  const parseAddressList = (data) => {
    if (!data) return [];
    let list = [];
    if (Array.isArray(data.data)) {
      list = data.data;
    } else if (Array.isArray(data.addresses)) {
      list = data.addresses;
    } else if (Array.isArray(data.address)) {
      list = data.address;
    } else if (Array.isArray(data.list)) {
      list = data.list;
    } else if (Array.isArray(data.result)) {
      list = data.result;
    } else if (Array.isArray(data)) {
      list = data;
    } else if (data.data && typeof data.data === 'object' && (data.data.id || data.data.address_id)) {
      list = [data.data];
    } else if (data.address && typeof data.address === 'object' && (data.address.id || data.address.address_id)) {
      list = [data.address];
    }
    return list;
  };

  const getFormattedAddress = (item) => {
    if (!item) return 'No address details';
    const parts = [];

    const house = item.house_no || item.building || item.house || '';
    const mainAddr = item.address || item.address_1 || item.full_address || '';
    const road = item.road_name || item.road || item.area || item.street || '';
    const landmark = item.landmark || '';
    const city = item.city || '';
    const state = item.state || '';
    const pin = item.pin || item.pincode || item.zip_code || item.zip || '';

    const firstLine = [house, mainAddr !== house ? mainAddr : '', road].filter(Boolean).join(', ');
    if (firstLine) parts.push(firstLine);
    if (landmark) parts.push(`Landmark: ${landmark}`);

    let locLine = [city, state].filter(Boolean).join(', ');
    if (pin) {
      locLine = locLine ? `${locLine} - ${pin}` : `PIN: ${pin}`;
    }
    if (locLine) parts.push(locLine);

    return parts.length > 0 ? parts.join('\n') : 'No address details';
  };

  const requestForAllAddress = async () => {
    try {
      setLoading(true);
      const ID = await getuserId();

      const res = await getAddressListApi(ID);
      const list = parseAddressList(res.data);

      setAddressList(list);
    } catch (error) {
      console.log('Fetch address list error:', error);
      setAddressList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await requestForAllAddress();
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
      <StatusBar
        backgroundColor="transparent"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        translucent={true}
      />
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Addresses</Text>

        {/* Show only when address list has data */}
        {addressList?.length > 0 && (
          <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <TouchableOpacity
              onPress={openAddAddress}
              style={[
                styles.addBtn,
                {
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                  borderWidth: 1.5,
                  borderColor: isDarkMode ? '#334155' : '#CBD5E1',
                },
              ]}>
              <Ionicons
                name="navigate-outline"
                size={15}
                color={AllColors.primary}
              />
              <Text style={[styles.addBtnText, { fontSize: 12, fontWeight: '700', marginLeft: 5 }]}>Live Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={openAddOtherAddress}
              style={[
                styles.addBtn,
                {
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: AllColors.primary,
                },
              ]}>
              <MaterialCommunityIcons
                name="plus"
                size={15}
                color="#FFF"
              />
              <Text style={[styles.addBtnText, { color: '#FFF', fontSize: 12, fontWeight: '700', marginLeft: 4 }]}>Other Location</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {addressList?.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[AllColors.primary]}
              tintColor={AllColors.primary}
            />
          }
        >
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

            <View style={{ flexDirection: 'column', gap: 14, marginTop: 26, width: '100%', alignItems: 'center' }}>
              <TouchableOpacity
                style={[
                  styles.emptyButton,
                  {
                    marginTop: 0,
                    width: '88%',
                    height: 50,
                    justifyContent: 'center',
                    backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                    borderWidth: 1.5,
                    borderColor: AllColors.primary,
                    paddingHorizontal: 20,
                  },
                ]}
                onPress={openAddAddress}>
                <Ionicons
                  name="navigate-outline"
                  size={18}
                  color={AllColors.primary}
                />
                <Text style={[styles.emptyButtonText, { color: AllColors.primary, fontSize: 15, fontWeight: '700', marginLeft: 8 }]}>
                  Live Location
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.emptyButton, { marginTop: 0, width: '88%', height: 50, justifyContent: 'center', paddingHorizontal: 20 }]}
                onPress={openAddOtherAddress}>
                <MaterialCommunityIcons
                  name="plus"
                  size={20}
                  color={AllColors.white}
                />
                <Text style={[styles.emptyButtonText, { fontSize: 15, fontWeight: '700', marginLeft: 8 }]}>
                  Other Location
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={addressList}
          keyExtractor={(item, index) => (item?.id ? String(item.id) : item?.address_id ? String(item.address_id) : String(index))}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[AllColors.primary]}
              tintColor={AllColors.primary}
            />
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor, borderWidth: isDarkMode ? 1 : 0 }]}>
              <View style={styles.header}>
                <Text style={[styles.name, { color: theme.textPrimary }]}>{item.name || item.full_name || item.user_name || 'User'}</Text>

                <View style={styles.menuWrapper}>
                  <TouchableOpacity
                    onPress={() =>
                      setMenuId(menuId === (item.id || item.address_id) ? null : (item.id || item.address_id))
                    }>
                    <MaterialCommunityIcons
                      name="dots-vertical"
                      size={20}
                      color={isDarkMode ? '#94A3B8' : AllColors.slateMuted}
                    />
                  </TouchableOpacity>

                  {menuId === (item.id || item.address_id) && (
                    <View style={[styles.menu, { backgroundColor: isDarkMode ? '#334155' : AllColors.white, borderColor: theme.borderColor, borderWidth: isDarkMode ? 1 : 0 }]}>
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                          handleUpdate(item);
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
                          confirmDelete(item.id || item.address_id);
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

              <Text style={[styles.mobile, { color: theme.textSecondary }]}>{item.mobile || item.phone || item.mobile_no || ''}</Text>

              <Text style={[styles.address, { color: theme.textSecondary }]}>
                {getFormattedAddress(item)}
              </Text>

              {(item.type || item.address_type) && (
                <View style={[styles.badge, { backgroundColor: isDarkMode ? 'rgba(247, 22, 112, 0.2)' : AllColors.softPinkBg }]}>
                  <Text style={styles.badgeText}>{item.type || item.address_type}</Text>
                </View>
              )}
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
  emptyScroll: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
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
    paddingHorizontal: 15,
    paddingTop: STATUSBAR_HEIGHT + 14,
    paddingBottom: 15,
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