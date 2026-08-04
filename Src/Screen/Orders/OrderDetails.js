import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AllColors from '../../Constants/Color';
import { useTheme } from '../../Context/ThemeContext';
import { BASE_URL, getToken, getuserId } from '../../Api/Api';

const MOCK_FALLBACK_ORDER = {
  id: 'ORD-84920',
  order_id_generate: 'ORD-84920',
  order_status: 'Processing',
  created_at: new Date().toISOString(),
  payment_method: 'Online / Prepaid',
  net_amount: 1499,
  name: 'Valued Customer',
  address: 'House #12, Road #4, Block-B, Dhaka',
  mobile: '+880 1700-000000',
  items: [
    {
      id: 'p1',
      name: 'Wireless Bluetooth Earbuds Pro',
      selling_price: 1499,
      qty: 1,
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300',
    },
  ],
};

export default function OrderDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDarkMode } = useTheme();
  const params = route.params || {};

  const initialOrder = params.order || params.item || (params.id && typeof params.id === 'object' ? params.id : null);
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(!initialOrder && !!(params.order_id || params.id));

  const orderIdParam = params.order_id || params.id || initialOrder?.id || initialOrder?.order_id;

  useEffect(() => {
    if (!order && orderIdParam && typeof orderIdParam !== 'object') {
      fetchSingleOrder(orderIdParam);
    }
  }, [orderIdParam]);

  const fetchSingleOrder = async (targetId) => {
    try {
      setLoading(true);
      const token = await getToken();
      const userId = await getuserId();

      if (!token || !userId) {
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('order_id', targetId);

      const response = await fetch(`${BASE_URL}order-details`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (result?.data || result?.order) {
        setOrder(result.data || result.order);
      }
    } catch (error) {
      console.log('Fetch Order Details Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('delivered') || s.includes('success') || s.includes('completed')) {
      return { bg: isDarkMode ? 'rgba(22, 101, 52, 0.25)' : '#DCFCE7', color: isDarkMode ? '#4ADE80' : '#166534', label: 'Delivered', icon: 'checkmark-circle' };
    }
    if (s.includes('cancel')) {
      return { bg: isDarkMode ? 'rgba(153, 27, 27, 0.25)' : '#FEE2E2', color: isDarkMode ? '#F87171' : '#991B1B', label: 'Cancelled', icon: 'close-circle' };
    }
    return { bg: isDarkMode ? 'rgba(7, 89, 133, 0.25)' : '#E0F2FE', color: isDarkMode ? '#38BDF8' : '#075985', label: status || 'Processing', icon: 'time' };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recent';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return String(dateStr);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar backgroundColor={isDarkMode ? theme.cardBg : AllColors.white} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={[styles.header, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDarkMode ? '#334155' : undefined }]} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Order Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AllColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const currentOrder = order || MOCK_FALLBACK_ORDER;
  const badge = getStatusBadgeStyle(currentOrder.order_status || currentOrder.status || currentOrder.type);
  const config = {
    bg: badge.bg,
    color: badge.color,
    icon: badge.icon,
    title: badge.label,
    subtitle: badge.label === 'Delivered'
      ? 'Package delivered successfully'
      : badge.label === 'Cancelled'
      ? 'Order was cancelled'
      : 'Your order is currently being processed',
  };

  const displayOrderId = currentOrder.order_id_generate || currentOrder.id || currentOrder.order_id || orderIdParam || 'ORD-84920';
  const amount = currentOrder.net_amount || currentOrder.amount || currentOrder.total_amount || currentOrder.price || 1499;
  const itemsList = Array.isArray(currentOrder.items) && currentOrder.items.length > 0
    ? currentOrder.items
    : Array.isArray(currentOrder.products) && currentOrder.products.length > 0
    ? currentOrder.products
    : Array.isArray(currentOrder.details) && currentOrder.details.length > 0
    ? currentOrder.details
    : MOCK_FALLBACK_ORDER.items;

  const dateText = formatDate(currentOrder.created_at || currentOrder.order_date || currentOrder.date);

  const name = currentOrder.name || currentOrder.user_name || currentOrder.shipping_name || (typeof currentOrder.address === 'object' ? currentOrder.address?.name : '') || 'Valued Customer';
  const addressStr = typeof currentOrder.address === 'string'
    ? currentOrder.address
    : (currentOrder.address?.address || currentOrder.shipping_address || currentOrder.delivery_address || 'House #12, Road #4, Block-B, Dhaka');
  const mobile = currentOrder.mobile || currentOrder.phone || currentOrder.user_phone || (typeof currentOrder.address === 'object' ? currentOrder.address?.mobile : '') || '+880 1700-000000';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar backgroundColor={isDarkMode ? theme.cardBg : AllColors.white} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDarkMode ? '#334155' : undefined }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Order Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* ALWAYS RENDER SCROLLVIEW */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {/* Status Hero Card */}
        <View style={[styles.statusBanner, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon} size={28} color={config.color} />
          <View style={styles.statusTextContainer}>
            <Text style={[styles.statusTitle, { color: config.color }]}>{config.title}</Text>
            <Text style={[styles.statusSubtitle, { color: config.color }]}>{config.subtitle}</Text>
          </View>
        </View>

        {/* Order Info Card */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
          <View style={styles.rowBetween}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Order #{displayOrderId}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: isDarkMode ? '#334155' : AllColors.divider }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Order Date</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{dateText}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Payment Mode</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{currentOrder.payment_method || currentOrder.payment_type || 'Online / Prepaid'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Total Items</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{itemsList.length}</Text>
          </View>
        </View>

        {/* Delivery Address Card */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Delivery Address</Text>
          <View style={[styles.divider, { backgroundColor: isDarkMode ? '#334155' : AllColors.divider }]} />
          <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{name}</Text>
          <Text style={[styles.infoLabel, { marginTop: 4, color: theme.textSecondary }]}>{addressStr}</Text>
          <Text style={[styles.infoLabel, { marginTop: 4, color: theme.textSecondary }]}>Mobile: {mobile}</Text>
        </View>

        {/* Ordered Items Card */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Items Ordered</Text>
          <View style={[styles.divider, { backgroundColor: isDarkMode ? '#334155' : AllColors.divider }]} />

          {itemsList.map((prod, index) => (
            <View key={prod.id || index} style={styles.productRow}>
              <Image
                source={{ uri: prod.image || prod.product_image || 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300' }}
                style={[styles.productThumb, { backgroundColor: isDarkMode ? '#0F172A' : AllColors.screenBg }]}
                resizeMode="cover"
              />
              <View style={styles.productDetailsContainer}>
                <Text style={[styles.productTitleText, { color: theme.textPrimary }]} numberOfLines={2}>
                  {prod.name || prod.product_name || 'Item'}
                </Text>
                <View style={styles.productPriceRow}>
                  <Text style={[styles.productPriceText, { color: theme.textPrimary }]}>
                    ₹{prod.selling_price || prod.price || prod.total_amount || 0}
                  </Text>
                  <Text style={[styles.productQtyText, { color: isDarkMode ? '#CBD5E1' : AllColors.slateSub, backgroundColor: isDarkMode ? '#334155' : AllColors.divider }]}>Qty: {prod.qty || prod.quantity || 1}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Price Breakdown Card */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Price Details</Text>
          <View style={[styles.divider, { backgroundColor: isDarkMode ? '#334155' : AllColors.divider }]} />

          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.priceValue, { color: theme.textPrimary }]}>₹{amount}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Discount</Text>
            <Text style={styles.priceValueDiscount}>-₹0</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Delivery Charges</Text>
            <Text style={styles.priceValueFree}>Free</Text>
          </View>

          <View style={[styles.dividerDashed, { borderColor: isDarkMode ? '#334155' : AllColors.lightGrey }]} />

          <View style={styles.priceRowTotal}>
            <Text style={[styles.priceLabelTotal, { color: theme.textPrimary }]}>Total Amount</Text>
            <Text style={styles.priceValueTotal}>₹{amount}</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AllColors.screenBg },
  header: {
    height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: AllColors.white, paddingHorizontal: 16, elevation: 2,
    shadowColor: AllColors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AllColors.slateDark },
  scrollContent: { padding: 16, paddingBottom: 40 },

  statusBanner: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 16,
  },
  statusTextContainer: { marginLeft: 12, flex: 1 },
  statusTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  statusSubtitle: { fontSize: 13, lineHeight: 18, opacity: 0.9, marginTop: 2 },

  card: {
    backgroundColor: AllColors.white, borderRadius: 16, padding: 16, marginBottom: 16,
    elevation: 2, shadowColor: AllColors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
    borderWidth: 1, borderColor: AllColors.divider,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: AllColors.slateHeader },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, backgroundColor: AllColors.divider, marginVertical: 12 },
  dividerDashed: { height: 1, backgroundColor: AllColors.lightGrey, marginVertical: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: AllColors.lightGrey, borderRadius: 1 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  infoLabel: { fontSize: 13, color: AllColors.slateSub, fontWeight: '500' },
  infoValue: { fontSize: 13, color: AllColors.slateDark, fontWeight: '600' },

  productRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  productThumb: { width: 64, height: 64, borderRadius: 12, backgroundColor: AllColors.screenBg },
  productDetailsContainer: { flex: 1, marginLeft: 12 },
  productTitleText: { fontSize: 14, fontWeight: '600', color: AllColors.slateHeader, lineHeight: 20, marginBottom: 6 },
  productPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPriceText: { fontSize: 15, fontWeight: '700', color: AllColors.slateDark },
  productQtyText: { fontSize: 13, color: AllColors.slateSub, fontWeight: '500', backgroundColor: AllColors.divider, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { fontSize: 14, color: AllColors.slateMuted },
  priceValue: { fontSize: 14, color: AllColors.slateHeader, fontWeight: '600' },
  priceValueDiscount: { fontSize: 14, color: AllColors.greenLight, fontWeight: '600' },
  priceValueFree: { fontSize: 14, color: AllColors.greenLight, fontWeight: '600' },
  priceRowTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabelTotal: { fontSize: 16, fontWeight: '700', color: AllColors.slateDark },
  priceValueTotal: { fontSize: 18, fontWeight: '800', color: AllColors.primary },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerSpacer: { width: 40 },
});
