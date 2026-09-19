import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BASE_URL, getToken, getuserId, setuserId } from '../../../Api/Api';
import AllColors from '../../../Constants/Color';
import { useTheme } from '../../../Context/ThemeContext';

const TABS = ['All', 'Processing', 'Delivered', 'Cancelled'];

export default function Orders() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('All');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const extractOrdersArray = (result) => {
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.data?.data)) return result.data.data;
    if (Array.isArray(result?.orders)) return result.orders;
    if (Array.isArray(result?.data?.orders)) return result.data.orders;
    if (Array.isArray(result?.order_list)) return result.order_list;
    if (result?.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
      const values = Object.values(result.data).filter(
        (item) => item && typeof item === 'object' && (item.id || item.order_id || item.order_id_generate)
      );
      if (values.length > 0) return values;
    }
    if (result?.orders && typeof result.orders === 'object' && !Array.isArray(result.orders)) {
      const values = Object.values(result.orders).filter(
        (item) => item && typeof item === 'object' && (item.id || item.order_id || item.order_id_generate)
      );
      if (values.length > 0) return values;
    }
    return [];
  };

  const fetchOrders = async () => {
    try {
      const token = await getToken();
      let userId = await getuserId();

      if (!token) {
        setIsLoggedIn(false);
        setOrders([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setIsLoggedIn(true);

      // If userId is missing from storage, fetch from /me
      if (!userId) {
        try {
          const profileRes = await fetch(`${BASE_URL}me`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          });
          const profileData = await profileRes.json();
          const resolvedId = profileData?.user?.id || profileData?.data?.id || profileData?.id;
          if (resolvedId) {
            userId = resolvedId;
            await setuserId(resolvedId);
          }
        } catch (e) {
          console.log('Error fetching user profile for userId:', e);
        }
      }

      const parsedUserId = userId && !isNaN(userId) ? Number(userId) : userId;
      let orderListResult = null;

      // 1. Primary Attempt: JSON POST
      try {
        const jsonBody = {};
        if (parsedUserId) jsonBody.user_id = parsedUserId;

        const response = await fetch(`${BASE_URL}order-list`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: JSON.stringify(jsonBody),
        });

        const text = await response.text();
        try {
          orderListResult = JSON.parse(text);
        } catch (e) {
          console.log('Order list JSON parse error:', text);
        }
      } catch (e) {
        console.log('Order list JSON fetch error:', e);
      }

      let parsedOrders = extractOrdersArray(orderListResult);

      // 2. Fallback Attempt: FormData POST if no orders found or status not successful
      if (
        (!parsedOrders || parsedOrders.length === 0) &&
        (!orderListResult || (orderListResult.status !== 200 && orderListResult.status !== '200' && !orderListResult.success))
      ) {
        try {
          const formData = new FormData();
          if (parsedUserId) formData.append('user_id', String(parsedUserId));

          const response = await fetch(`${BASE_URL}order-list`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
            body: formData,
          });

          const text = await response.text();
          try {
            const formDataResult = JSON.parse(text);
            const extracted = extractOrdersArray(formDataResult);
            if (extracted.length > 0) {
              parsedOrders = extracted;
            }
          } catch (e) {
            console.log('Order list FormData parse error:', text);
          }
        } catch (e) {
          console.log('Order list FormData fetch error:', e);
        }
      }

      setOrders(Array.isArray(parsedOrders) ? parsedOrders : []);
    } catch (error) {
      console.log('Fetch Orders Error:', error);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusBadgeStyle = (status) => {
    const s = String(status || '').toLowerCase();
    if (
      s.includes('delivered') ||
      s.includes('success') ||
      s.includes('completed') ||
      s.includes('done')
    ) {
      return {
        bg: isDarkMode ? 'rgba(16, 185, 129, 0.18)' : '#DCFCE7',
        color: isDarkMode ? '#34D399' : '#15803D',
        label: status || 'Delivered',
        icon: 'checkmark-circle-outline',
      };
    }
    if (
      s.includes('cancel') ||
      s.includes('fail') ||
      s.includes('reject') ||
      s.includes('return')
    ) {
      return {
        bg: isDarkMode ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2',
        color: isDarkMode ? '#F87171' : '#B91C1C',
        label: status || 'Cancelled',
        icon: 'close-circle-outline',
      };
    }
    if (s.includes('ship') || s.includes('transit') || s.includes('out')) {
      return {
        bg: isDarkMode ? 'rgba(59, 130, 246, 0.18)' : '#DBEAFE',
        color: isDarkMode ? '#60A5FA' : '#1D4ED8',
        label: status || 'Out for Delivery',
        icon: 'car-outline',
      };
    }
    return {
      bg: isDarkMode ? 'rgba(247, 22, 112, 0.15)' : AllColors.softPinkBg,
      color: AllColors.primary,
      label: status || 'Processing',
      icon: 'time-outline',
    };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently Ordered';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const filteredOrders = orders.filter((ord) => {
    if (activeTab === 'All') return true;
    const st = String(ord.order_status || ord.status || ord.delivery_status || '').toLowerCase();
    if (activeTab === 'Processing') {
      return !st.includes('delivered') && !st.includes('cancel') && !st.includes('fail') && !st.includes('reject');
    }
    if (activeTab === 'Delivered') {
      return st.includes('delivered') || st.includes('success') || st.includes('completed') || st.includes('done');
    }
    if (activeTab === 'Cancelled') {
      return st.includes('cancel') || st.includes('fail') || st.includes('reject') || st.includes('return');
    }
    return true;
  });

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar backgroundColor={isDarkMode ? theme.cardBg : AllColors.white} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={[styles.header, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: isDarkMode ? '#334155' : undefined }]}
            onPress={() => {
              if (navigation?.canGoBack && navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('AppTab');
              }
            }}>
            <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Orders</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.emptyContainer, { backgroundColor: theme.bg }]}>
          <MaterialCommunityIcons name="account-lock-outline" size={70} color={AllColors.primary} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Login Required</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Please sign in to your account to view your past orders and track current shipments.
          </Text>
          <TouchableOpacity
            style={styles.shopNowBtn}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.shopNowBtnText}>Login to Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar backgroundColor={isDarkMode ? theme.cardBg : AllColors.white} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Top App Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDarkMode ? '#334155' : undefined }]}
          onPress={() => {
            if (navigation?.canGoBack && navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('AppTab');
            }
          }}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Orders</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filter Tabs Bar */}
      <View style={[styles.tabContainer, { backgroundColor: theme.cardBg, borderBottomColor: theme.borderColor }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}>
          {TABS.map((tabId) => {
            const isActive = activeTab === tabId;
            return (
              <TouchableOpacity
                key={tabId}
                style={[
                  styles.tabItem,
                  { backgroundColor: isDarkMode ? '#334155' : AllColors.divider },
                  isActive && styles.activeTabItem,
                ]}
                onPress={() => setActiveTab(tabId)}
                activeOpacity={0.8}>
                <Text style={[
                  styles.tabText,
                  { color: isDarkMode ? '#CBD5E1' : AllColors.slateSub },
                  isActive && styles.activeTabText,
                ]}>
                  {tabId}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Orders List */}
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={AllColors.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Fetching your orders...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item, idx) => (item.id ? String(item.id) : String(idx))}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[AllColors.primary]}
              tintColor={AllColors.primary}
            />
          }
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { backgroundColor: theme.bg }]}>
              <View style={[styles.emptyIconBox, { backgroundColor: isDarkMode ? '#1E293B' : undefined }]}>
                <Feather name="package" size={40} color={isDarkMode ? '#64748B' : AllColors.slateLight} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Orders Found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                You haven't placed any orders in this category yet.
              </Text>
              <TouchableOpacity
                style={styles.shopNowBtn}
                onPress={() => navigation.navigate('AppTab')}
                activeOpacity={0.85}>
                <Text style={styles.shopNowBtnText}>Start Shopping</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const statusVal = item.order_status || item.status || item.delivery_status || item.orderStatus;
            const config = getStatusBadgeStyle(statusVal);
            const orderId = item.order_number || item.order_id_generate || item.order_id || item.id || 'ORD-000';
            const amount = item.selling_price ?? item.net_amount ?? item.total_amount ?? item.amount ?? item.grand_total ?? item.total ?? item.price ?? 0;
            const rawItemsList = item.items || item.products || item.order_items || item.order_details || [];
            const itemsList =
              rawItemsList.length > 0
                ? rawItemsList
                : item.name || item.img || item.product_name
                ? [item]
                : [];
            const dateText = formatDate(item.created_at || item.created_date || item.order_date || item.date || item.createdAt);

            return (
              <TouchableOpacity
                style={[styles.orderCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}
                onPress={() =>
                  navigation.navigate('OrderDetails', {
                    order_id: item.id || item.order_id || item.order_number || item.order_id_generate,
                    id: item.id,
                    order_number: item.order_number,
                    order: item,
                  })
                }
                activeOpacity={0.88}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.orderMetaContainer}>
                    <View style={[styles.orderIconWrapper, { backgroundColor: isDarkMode ? 'rgba(247, 22, 112, 0.2)' : AllColors.softPinkBg }]}>
                      <Feather name="package" size={18} color={AllColors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.orderNumberText, { color: theme.textPrimary }]}>Order #{orderId}</Text>
                      <Text style={[styles.orderDateText, { color: theme.textSecondary }]}>{dateText}</Text>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: config.color }]}>
                      {config.label}
                    </Text>
                  </View>
                </View>

                <View style={[styles.cardDivider, { backgroundColor: isDarkMode ? '#334155' : AllColors.divider }]} />

                {itemsList.length > 0 ? (
                  itemsList.map((prod, idx) => (
                    <View key={prod.id || prod.product_id || idx} style={styles.productRow}>
                      <Image
                        source={{ uri: prod.img || prod.image || prod.product_image || prod.thumbnail || 'https://via.placeholder.com/100' }}
                        style={[styles.productThumb, { backgroundColor: isDarkMode ? '#0F172A' : AllColors.screenBg }]}
                        resizeMode="cover"
                      />
                      <View style={styles.productDetailsContainer}>
                        <Text style={[styles.productTitleText, { color: theme.textPrimary }]} numberOfLines={2}>
                          {prod.name || prod.product_name || prod.title || 'Item'}
                        </Text>
                        <Text style={[styles.productQtyText, { color: theme.textSecondary }]}>Qty: {prod.qty || prod.quantity || 1}</Text>
                        <Text style={styles.productPriceText}>₹{prod.selling_price || prod.price || prod.total_amount || prod.net_amount || 0}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.singleOrderInfoRow}>
                    <View style={[styles.singleOrderIconBox, { backgroundColor: isDarkMode ? '#334155' : undefined }]}>
                      <Feather name="shopping-bag" size={22} color={isDarkMode ? '#94A3B8' : AllColors.slateSub} />
                    </View>
                    <View style={styles.orderInfoWrapper}>
                      <Text style={[styles.productTitleText, { color: theme.textPrimary }]}>Order #{orderId}</Text>
                      <Text style={[styles.productQtyText, { color: theme.textSecondary }]}>Tap to view complete details</Text>
                    </View>
                  </View>
                )}

                <View style={[styles.cardDivider, { backgroundColor: isDarkMode ? '#334155' : AllColors.divider }]} />

                <View style={styles.cardFooterRow}>
                  <View>
                    <Text style={[styles.totalPriceLabel, { color: theme.textSecondary }]}>Total Amount</Text>
                    <Text style={[styles.totalPriceValue, { color: theme.textPrimary }]}>₹{amount}</Text>
                  </View>

                  <View style={styles.customerActionRow}>
                    <TouchableOpacity
                      style={[styles.helpBtn, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
                      onPress={() => navigation.navigate('HelpCenter')}
                      activeOpacity={0.8}>
                      <Feather name="headphones" size={13} color={isDarkMode ? '#CBD5E1' : AllColors.slateMuted} style={styles.iconMarginRight} />
                      <Text style={[styles.helpBtnText, { color: isDarkMode ? '#CBD5E1' : '#475569' }]}>Help</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.reorderBtn}
                      onPress={() =>
                        navigation.navigate('OrderDetails', {
                          order_id: item.id || item.order_id || item.order_number || item.order_id_generate,
                          id: item.id,
                          order_number: item.order_number,
                          order: item,
                        })
                      }
                      activeOpacity={0.85}>
                      <Feather name="refresh-cw" size={13} color={AllColors.white} style={styles.iconMarginRight} />
                      <Text style={styles.reorderBtnText}>Details</Text>
                      <Feather name="chevron-right" size={16} color={AllColors.white} style={styles.iconMarginLeft} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AllColors.screenBg,
  },
  header: {
    height: 56,
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
  tabContainer: {
    backgroundColor: AllColors.white,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AllColors.divider,
  },
  tabScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: AllColors.divider,
    alignItems: 'center',
  },
  activeTabItem: {
    backgroundColor: AllColors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: AllColors.slateSub,
  },
  activeTabText: {
    color: AllColors.white,
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: AllColors.slateSub,
    fontSize: 14,
    fontWeight: '500',
  },
  orderCard: {
    backgroundColor: AllColors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: AllColors.divider,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AllColors.softPinkBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  orderNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: AllColors.slateDark,
  },
  orderDateText: {
    fontSize: 11,
    color: AllColors.slateSub,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: AllColors.divider,
    marginVertical: 12,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  productThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: AllColors.screenBg,
  },
  productDetailsContainer: {
    flex: 1,
    marginLeft: 12,
  },
  productTitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: AllColors.slateHeader,
    lineHeight: 18,
  },
  productQtyText: {
    fontSize: 11,
    color: AllColors.slateSub,
    marginTop: 2,
  },
  productPriceText: {
    fontSize: 13,
    fontWeight: '700',
    color: AllColors.primary,
    marginTop: 2,
  },
  singleOrderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  singleOrderIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: AllColors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalPriceLabel: {
    fontSize: 11,
    color: AllColors.slateSub,
  },
  totalPriceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: AllColors.slateDark,
    marginTop: 1,
  },
  customerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: AllColors.divider,
  },
  helpBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: AllColors.slateMuted,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: AllColors.primary,
  },
  reorderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: AllColors.white,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 80,
  },
  emptyIconBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: AllColors.divider,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AllColors.slateHeader,
  },
  emptySubtitle: {
    fontSize: 13,
    color: AllColors.slateSub,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  shopNowBtn: {
    marginTop: 20,
    backgroundColor: AllColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
  },
  shopNowBtnText: {
    color: AllColors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  iconMarginRight: {
    marginRight: 4,
  },
  iconMarginLeft: {
    marginLeft: 2,
  },
  orderInfoWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  headerSpacer: {
    width: 40,
  },
});
