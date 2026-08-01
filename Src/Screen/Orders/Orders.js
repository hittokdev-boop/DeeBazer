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
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BASE_URL, getToken, getuserId } from '../../Api/Api';
import AllColors from '../../Constants/Color';
import { useTheme } from '../../Context/ThemeContext';

const TABS = ['All', 'Processing', 'Delivered', 'Cancelled'];

export default function Orders() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('All');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const fetchOrders = async () => {
    try {
      const token = await getToken();
      const userId = await getuserId();

      if (!token || !userId) {
        setIsLoggedIn(false);
        setOrders([]);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);

      const formData = new FormData();
      formData.append('user_id', userId);

      const response = await fetch(`${BASE_URL}order-list`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result?.status === 200 || result?.success) {
        const orderData = result?.data || result?.orders || [];
        setOrders(Array.isArray(orderData) ? orderData : []);
      } else {
        setOrders([]);
      }
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
    if (s.includes('delivered') || s.includes('success') || s.includes('completed')) {
      return {
        bg: '#DCFCE7',
        color: '#166534',
        label: 'Delivered',
        icon: 'checkmark-circle-outline',
      };
    }
    if (s.includes('cancel')) {
      return {
        bg: '#FEE2E2',
        color: '#991B1B',
        label: 'Cancelled',
        icon: 'close-circle-outline',
      };
    }
    return {
      bg: '#E0F2FE',
      color: '#075985',
      label: status || 'Processing',
      icon: 'time-outline',
    };
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'All') return true;
    const badge = getStatusBadgeStyle(order.order_status || order.status);
    if (activeTab === 'Processing') {
      return badge.label !== 'Delivered' && badge.label !== 'Cancelled';
    }
    return badge.label.toLowerCase() === activeTab.toLowerCase();
  });

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

  const renderOrderItem = ({ item }) => {
    const badge = getStatusBadgeStyle(item.order_status || item.status);
    const orderId = item.order_id_generate || item.id || item.order_id || 'ORD-000';
    const amount = item.net_amount || item.amount || item.total_amount || item.price || 0;
    const itemsList = item.items || item.products || [];
    const dateText = formatDate(item.created_at || item.date);

    return (
      <View style={styles.orderCard}>
        {/* Order Card Top Banner */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.orderMetaContainer}>
            <View style={styles.orderIconWrapper}>
              <MaterialCommunityIcons name="shopping" size={20} color={AllColors.primary} />
            </View>
            <View>
              <Text style={styles.orderNumberText}>Order #{orderId}</Text>
              <Text style={styles.orderDateText}>Placed on {dateText}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Ionicons name={badge.icon} size={14} color={badge.color} style={styles.iconMarginRight} />
            <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        {/* Order Items Preview */}
        {itemsList.length > 0 ? (
          itemsList.map((prod, index) => (
            <View key={prod.id || index} style={styles.productRow}>
              <Image
                source={{
                  uri:
                    prod.image ||
                    prod.product_image ||
                    'https://via.placeholder.com/100',
                }}
                style={styles.productThumb}
                resizeMode="cover"
              />
              <View style={styles.productDetailsContainer}>
                <Text style={styles.productTitleText} numberOfLines={2}>
                  {prod.name || prod.product_name || 'Item'}
                </Text>
                <Text style={styles.productQtyText}>Qty: {prod.qty || prod.quantity || 1}</Text>
                <Text style={styles.productPriceText}>₹{prod.selling_price || prod.price || prod.total_amount || 0}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.singleOrderInfoRow}>
            <View style={styles.singleOrderIconBox}>
              <Feather name="package" size={24} color="#64748B" />
            </View>
            <View style={styles.orderInfoWrapper}>
              <Text style={styles.productTitleText}>Package #{orderId}</Text>
              <Text style={styles.productQtyText}>Standard Delivery</Text>
            </View>
          </View>
        )}

        <View style={styles.cardDivider} />

        {/* Order Footer & Actions */}
        <View style={styles.cardFooterRow}>
          <View>
            <Text style={styles.totalPriceLabel}>Total Amount</Text>
            <Text style={styles.totalPriceValue}>₹{amount}</Text>
          </View>

          <View style={styles.customerActionRow}>
            <TouchableOpacity
              style={styles.helpBtn}
              onPress={() => navigation.navigate('HelpCenter')}
              activeOpacity={0.7}>
              <Feather name="help-circle" size={14} color="#475569" style={styles.iconMarginRight} />
              <Text style={styles.helpBtnText}>Help</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reorderBtn}
              onPress={() => navigation.navigate('OrderDetails', { order: item })}
              activeOpacity={0.8}>
              <Text style={styles.reorderBtnText}>View Details</Text>
              <Ionicons name="chevron-forward" size={14} color="#FFFFFF" style={styles.iconMarginLeft} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-lock-outline" size={70} color={AllColors.primary} />
          <Text style={styles.emptyTitle}>Login Required</Text>
          <Text style={styles.emptySubtitle}>
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
      <StatusBar backgroundColor={AllColors.white} barStyle="dark-content" />

      {/* Top App Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={AllColors.slateDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filter Tabs Bar */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}>
          {TABS.map((tabId) => {
            const isActive = activeTab === tabId;
            return (
              <TouchableOpacity
                key={tabId}
                style={[styles.tabItem, isActive && styles.activeTabItem]}
                onPress={() => setActiveTab(tabId)}
                activeOpacity={0.8}>
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
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
          <Text style={styles.loadingText}>Fetching your orders...</Text>
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
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Feather name="package" size={40} color={AllColors.slateLight} />
              </View>
              <Text style={styles.emptyTitle}>No Orders Found</Text>
              <Text style={styles.emptySubtitle}>
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
            const config = getStatusConfig(item.order_status || item.status);
            const orderId = item.order_id_generate || item.id || item.order_id || 'ORD-000';
            const amount = item.net_amount || item.amount || item.total_amount || item.price || 0;
            const itemsList = item.items || item.products || [];
            const dateText = formatDate(item.created_at || item.date);

            return (
              <TouchableOpacity
                style={styles.orderCard}
                onPress={() => navigation.navigate('OrderDetails', { order: item })}
                activeOpacity={0.88}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.orderMetaContainer}>
                    <View style={styles.orderIconWrapper}>
                      <Feather name="package" size={18} color={AllColors.primary} />
                    </View>
                    <View>
                      <Text style={styles.orderNumberText}>Order #{orderId}</Text>
                      <Text style={styles.orderDateText}>{dateText}</Text>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: config.color }]}>
                      {config.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                {itemsList.length > 0 ? (
                  itemsList.map((prod, idx) => (
                    <View key={prod.id || idx} style={styles.productRow}>
                      <Image
                        source={{ uri: prod.image || prod.product_image || 'https://via.placeholder.com/100' }}
                        style={styles.productThumb}
                        resizeMode="cover"
                      />
                      <View style={styles.productDetailsContainer}>
                        <Text style={styles.productTitleText} numberOfLines={1}>
                          {prod.name || prod.product_name || 'Item'}
                        </Text>
                        <Text style={styles.productQtyText}>Qty: {prod.qty || prod.quantity || 1}</Text>
                        <Text style={styles.productPriceText}>₹{prod.selling_price || prod.price || prod.total_amount || 0}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.singleOrderInfoRow}>
                    <View style={styles.singleOrderIconBox}>
                      <Feather name="shopping-bag" size={22} color={AllColors.slateSub} />
                    </View>
                    <View style={styles.orderInfoWrapper}>
                      <Text style={styles.productTitleText}>Order #{orderId}</Text>
                      <Text style={styles.productQtyText}>Tap to view complete details</Text>
                    </View>
                  </View>
                )}

                <View style={styles.cardDivider} />

                <View style={styles.cardFooterRow}>
                  <View>
                    <Text style={styles.totalPriceLabel}>Total Amount</Text>
                    <Text style={styles.totalPriceValue}>₹{amount}</Text>
                  </View>

                  <View style={styles.customerActionRow}>
                    <TouchableOpacity
                      style={styles.helpBtn}
                      onPress={() => navigation.navigate('HelpCenter')}
                      activeOpacity={0.8}>
                      <Feather name="headphones" size={13} color={AllColors.slateMuted} style={styles.iconMarginRight} />
                      <Text style={styles.helpBtnText}>Help</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.reorderBtn}
                      onPress={() => navigation.navigate('OrderDetails', { order: item })}
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
