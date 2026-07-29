import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AllColors from '../../Constants/Color';

export default function OrderDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { order } = route.params || {};

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order details not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusBadgeStyle = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('delivered') || s.includes('success') || s.includes('completed')) {
      return { bg: '#DCFCE7', color: '#166534', label: 'Delivered', icon: 'checkmark-circle' };
    }
    if (s.includes('cancel')) {
      return { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelled', icon: 'close-circle' };
    }
    return { bg: '#E0F2FE', color: '#075985', label: status || 'Processing', icon: 'time' };
  };

  const badge = getStatusBadgeStyle(order.order_status || order.status);
  const orderId = order.order_id_generate || order.id || order.order_id || 'ORD-000';
  const amount = order.net_amount || order.amount || order.total_amount || order.price || 0;
  const itemsList = order.items || order.products || [];
  
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently Ordered';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Order Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: badge.bg }]}>
          <Ionicons name={badge.icon} size={28} color={badge.color} />
          <View style={styles.statusTextContainer}>
            <Text style={[styles.statusTitle, { color: badge.color }]}>{badge.label}</Text>
            <Text style={[styles.statusSubtitle, { color: badge.color }]}>
              {badge.label === 'Delivered' 
                ? 'Your order has been delivered successfully.' 
                : badge.label === 'Cancelled' 
                ? 'This order was cancelled.' 
                : 'Your order is currently being processed.'}
            </Text>
          </View>
        </View>

        {/* Order Info Card */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Order Information</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order ID</Text>
            <Text style={styles.infoValue}>#{orderId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order Date</Text>
            <Text style={styles.infoValue}>{formatDate(order.created_at || order.date)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Method</Text>
            <Text style={styles.infoValue}>{order.payment_method || 'Online'}</Text>
          </View>
        </View>

        {/* Items Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items in your order</Text>
          <View style={styles.divider} />
          {itemsList.map((prod, index) => (
            <View key={prod.id || index} style={styles.productRow}>
              <Image
                source={{ uri: prod.image || prod.product_image || 'https://via.placeholder.com/100' }}
                style={styles.productThumb}
                resizeMode="cover"
              />
              <View style={styles.productDetailsContainer}>
                <Text style={styles.productTitleText} numberOfLines={2}>
                  {prod.name || prod.product_name || 'Item'}
                </Text>
                <View style={styles.productPriceRow}>
                  <Text style={styles.productPriceText}>
                    ₹{prod.selling_price || prod.price || prod.total_amount || 0}
                  </Text>
                  <Text style={styles.productQtyText}>Qty: {prod.qty || prod.quantity || 1}</Text>
                </View>
              </View>
            </View>
          ))}
          {itemsList.length === 0 && (
            <Text style={styles.noItemsText}>No specific items found for this order.</Text>
          )}
        </View>

        {/* Price Breakdown Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          <View style={styles.divider} />
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>₹{amount}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Discount</Text>
            <Text style={styles.priceValueDiscount}>-₹0</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Charges</Text>
            <Text style={styles.priceValueFree}>Free</Text>
          </View>
          
          <View style={styles.dividerDashed} />
          
          <View style={styles.priceRowTotal}>
            <Text style={styles.priceLabelTotal}>Total Amount</Text>
            <Text style={styles.priceValueTotal}>₹{amount}</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 16,
  },
  statusTextContainer: { marginLeft: 12, flex: 1 },
  statusTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  statusSubtitle: { fontSize: 13, lineHeight: 18, opacity: 0.9, marginTop: 2 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  dividerDashed: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 1 },
  
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  infoLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  infoValue: { fontSize: 13, color: '#0F172A', fontWeight: '600' },

  productRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  productThumb: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#F8FAFC' },
  productDetailsContainer: { flex: 1, marginLeft: 12 },
  productTitleText: { fontSize: 14, fontWeight: '600', color: '#1E293B', lineHeight: 20, marginBottom: 6 },
  productPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPriceText: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  productQtyText: { fontSize: 13, color: '#64748B', fontWeight: '500', backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  noItemsText: { fontSize: 14, color: '#64748B', fontStyle: 'italic', textAlign: 'center', marginVertical: 10 },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { fontSize: 14, color: '#475569' },
  priceValue: { fontSize: 14, color: '#1E293B', fontWeight: '600' },
  priceValueDiscount: { fontSize: 14, color: '#16A34A', fontWeight: '600' },
  priceValueFree: { fontSize: 14, color: '#16A34A', fontWeight: '600' },
  priceRowTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabelTotal: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  priceValueTotal: { fontSize: 18, fontWeight: '800', color: AllColors.primary },

  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#64748B' },
});
