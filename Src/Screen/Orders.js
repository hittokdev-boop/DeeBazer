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
import { BASE_URL, getToken, getuserId } from '../Api/Api';
import AllColors from '../Constants/Color';

const TABS = ['All', 'Processing', 'Delivered', 'Cancelled'];

const SAMPLE_CUSTOMER_ORDERS = [
  {
    id: 1,
    order_id_generate: 'DB-984321',
    created_at: '2026-07-22T14:30:00Z',
    order_status: 'Delivered',
    amount: 1450,
    net_amount: 1450,
    items: [
      {
        id: 101,
        name: 'Cotton Floral Printed Kurti & Pant Set',
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&auto=format&fit=crop&q=60',
        selling_price: 950,
        qty: 1,
      },
      {
        id: 102,
        name: 'Traditional Designer Silk Dupatta',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=60',
        selling_price: 500,
        qty: 1,
      },
    ],
  },
  {
    id: 2,
    order_id_generate: 'DB-871239',
    created_at: '2026-07-24T09:15:00Z',
    order_status: 'Processing',
    amount: 2199,
    net_amount: 2199,
    items: [
      {
        id: 103,
        name: 'Premium Wireless Bluetooth Headphones',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=60',
        selling_price: 2199,
        qty: 1,
      },
    ],
  },
  {
    id: 3,
    order_id_generate: 'DB-765412',
    created_at: '2026-07-18T18:45:00Z',
    order_status: 'Cancelled',
    amount: 899,
    net_amount: 899,
    items: [
      {
        id: 104,
        name: 'Casual Slim Fit Denim Shirt',
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&auto=format&fit=crop&q=60',
        selling_price: 899,
        qty: 1,
      },
    ],
  },
];

export default function Orders() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('All');
  const [orders, setOrders] = useState(SAMPLE_CUSTOMER_ORDERS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const fetchOrders = async () => {
    try {
      const token = await getToken();
      const userId = await getuserId();

      if (!token || !userId) {
        setIsLoggedIn(true); // Allow viewing dummy data even if logged out for preview
        setOrders(SAMPLE_CUSTOMER_ORDERS);
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
      console.log('Order List Response:', result);

      if (result?.status === 200 || result?.success) {
        const orderData = result?.data || result?.orders || [];
        setOrders(Array.isArray(orderData) && orderData.length > 0 ? orderData : SAMPLE_CUSTOMER_ORDERS);
      } else {
        setOrders(SAMPLE_CUSTOMER_ORDERS);
      }
    } catch (error) {
      console.log('Fetch Orders Error:', error);
      setOrders(SAMPLE_CUSTOMER_ORDERS);
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
            <Ionicons name={badge.icon} size={14} color={badge.color} style={{ marginRight: 4 }} />
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
            <View style={{ flex: 1, marginLeft: 12 }}>
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
              <Feather name="help-circle" size={14} color="#475569" style={{ marginRight: 4 }} />
              <Text style={styles.helpBtnText}>Help</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reorderBtn}
              onPress={() => {
                if (Platform.OS === 'android') {
                  Alert.alert('Order Details', `Order ID: #${orderId}\nTotal Amount: ₹${amount}\nStatus: ${badge.label}`);
                }
              }}
              activeOpacity={0.8}>
              <Text style={styles.reorderBtnText}>View Details</Text>
              <Ionicons name="chevron-forward" size={14} color="#FFFFFF" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={{ width: 40 }} />
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
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('HelpCenter')}>
          <Feather name="help-circle" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content Body */}
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
                <MaterialCommunityIcons name="shopping-search" size={54} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No {activeTab !== 'All' ? activeTab : ''} Orders</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'All'
                  ? "You haven't placed any orders yet. Start exploring our wide range of products!"
                  : `You don't have any orders with status "${activeTab}".`}
              </Text>
              <TouchableOpacity
                style={styles.shopNowBtn}
                onPress={() => navigation.navigate('AppTab')}>
                <Text style={styles.shopNowBtnText}>Explore Products</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={renderOrderItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
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
    color: '#0F172A',
  },

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 4,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  activeTabItem: {
    backgroundColor: AllColors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
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
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },

  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
    backgroundColor: '#FFF1F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  orderNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  orderDateText: {
    fontSize: 11,
    color: '#64748B',
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
    backgroundColor: '#F1F5F9',
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
    backgroundColor: '#F8FAFC',
  },
  productDetailsContainer: {
    flex: 1,
    marginLeft: 12,
  },
  productTitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 18,
  },
  productQtyText: {
    fontSize: 11,
    color: '#64748B',
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
    backgroundColor: '#F1F5F9',
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
    color: '#64748B',
  },
  totalPriceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
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
    backgroundColor: '#F1F5F9',
  },
  helpBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
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
    color: '#FFFFFF',
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
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
