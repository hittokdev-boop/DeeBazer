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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AllColors from '../../../Constants/Color';
import { useTheme } from '../../../Context/ThemeContext';
import { BASE_URL, getToken, getuserId } from '../../../Api/Api';
import { clearActiveCartSeller } from '../../../Common/sellerUtils';

export default function OrderSuccess() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDarkMode } = useTheme();
  const {
    order_id,
    order: initialOrder,
    payment_method = 'cod',
  } = route.params || {};

  const hasInitialData = Boolean(
    initialOrder &&
      ((Array.isArray(initialOrder.items) && initialOrder.items.length > 0) ||
        (Array.isArray(initialOrder.products) && initialOrder.products.length > 0) ||
        initialOrder.name ||
        initialOrder.img ||
        initialOrder.image ||
        initialOrder.order_number ||
        initialOrder.order_id_generate ||
        initialOrder.order_id)
  );

  const [order, setOrder] = useState(initialOrder || null);
  const [loading, setLoading] = useState(!hasInitialData && Boolean(order_id));

  useEffect(() => {
    clearActiveCartSeller();
    if (order_id) {
      fetchOrderDetails(order_id);
    } else {
      setLoading(false);
    }
  }, [order_id]);

  const fetchOrderDetails = async (targetId) => {
    try {
      if (!order) setLoading(true);
      const token = await getToken();

      if (!token) {
        setLoading(false);
        return;
      }

      const parsedOrderId =
        !isNaN(targetId) && String(targetId).trim() !== ''
          ? Number(targetId)
          : targetId;

      const requestBody = {
        order_id: parsedOrderId,
      };

      const response = await fetch(`${BASE_URL}order-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      const rawOrderData =
        result?.data_order ||
        result?.data?.order ||
        result?.data ||
        result?.order ||
        result?.order_details ||
        (result?.id || result?.order_id ? result : null);

      if (rawOrderData && typeof rawOrderData === 'object') {
        const rawUser =
          result?.data_user ||
          result?.user ||
          rawOrderData?.address_user ||
          rawOrderData?.data_user ||
          rawOrderData?.shipping_address ||
          rawOrderData?.delivery_address ||
          rawOrderData?.user_address ||
          rawOrderData?.user ||
          (typeof rawOrderData?.address === 'object' ? rawOrderData.address : null);

        const extractedItems =
          Array.isArray(rawOrderData.items) && rawOrderData.items.length > 0
            ? rawOrderData.items
            : Array.isArray(rawOrderData.order_items) && rawOrderData.order_items.length > 0
            ? rawOrderData.order_items
            : Array.isArray(rawOrderData.products) && rawOrderData.products.length > 0
            ? rawOrderData.products
            : Array.isArray(rawOrderData.details) && rawOrderData.details.length > 0
            ? rawOrderData.details
            : Array.isArray(rawOrderData.order_details) && rawOrderData.order_details.length > 0
            ? rawOrderData.order_details
            : Array.isArray(result?.items) && result.items.length > 0
            ? result.items
            : [];

        setOrder((prev) => ({
          ...(prev || {}),
          ...rawOrderData,
          items: extractedItems.length > 0 ? extractedItems : prev?.items || rawOrderData.items,
          address_user: typeof rawUser === 'object' && rawUser !== null ? rawUser : prev?.address_user || null,
          data_user: typeof rawUser === 'object' && rawUser !== null ? rawUser : prev?.data_user || null,
        }));
      }
    } catch (error) {
      console.log('Error fetching order details for success page:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'AppTab' }],
    });
  };

  const handleViewOrders = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'AppTab' }],
    });
    setTimeout(() => {
      navigation.navigate('Orders');
    }, 200);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={AllColors.primary} />
      </SafeAreaView>
    );
  }

  // Parse order details
  const displayOrderId = order?.order_id_generate || order?.order_number || order?.order_id || order?.id || order_id || '---';
  const paymentText =
    order?.payment_method ||
    order?.payment_type ||
    order?.payment_mode ||
    (payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Paid Online (Prepaid)');
  const amount = Number(order?.total_amount ?? order?.net_amount ?? order?.amount ?? order?.selling_price ?? 0);

  const itemsList =
    Array.isArray(order?.items) && order.items.length > 0
      ? order.items
      : Array.isArray(order?.products) && order.products.length > 0
      ? order.products
      : Array.isArray(order?.order_items) && order.order_items.length > 0
      ? order.order_items
      : Array.isArray(order?.details) && order.details.length > 0
      ? order.details
      : [];

  const addressObj =
    (typeof order?.address_user === 'object' && order.address_user !== null ? order.address_user : null) ||
    (typeof order?.data_user === 'object' && order.data_user !== null ? order.data_user : null) ||
    (typeof order?.shipping_address === 'object' && order.shipping_address !== null ? order.shipping_address : null) ||
    (typeof order?.address === 'object' && order.address !== null ? order.address : null);

  const name =
    addressObj?.name ||
    addressObj?.user_name ||
    order?.name ||
    order?.user_name ||
    order?.shipping_name ||
    'Customer';

  const addressString = addressObj
    ? (
        addressObj.address && typeof addressObj.address === 'string' && addressObj.address.trim().length > 0
          ? addressObj.address
          : [
              addressObj.house_no || addressObj.flat_no,
              addressObj.road_name || addressObj.street || addressObj.area,
              addressObj.landmark ? `Near ${addressObj.landmark}` : null,
              addressObj.city,
              addressObj.state
                ? `${addressObj.state}${addressObj.pin || addressObj.pincode ? ` - ${addressObj.pin || addressObj.pincode}` : ''}`
                : addressObj.pin || addressObj.pincode,
            ]
              .filter(Boolean)
              .join(', ')
      )
    : typeof order?.address === 'string' && order.address.trim().length > 0
    ? order.address
    : order?.delivery_address ||
      order?.shipping_address ||
      'Address not available';

  const mobile =
    addressObj?.mobile ||
    addressObj?.phone ||
    order?.mobile ||
    order?.phone ||
    order?.user_phone ||
    '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Animated Checkbox Header Banner */}
        <View style={styles.successHeader}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={80} color={AllColors.greenLight} />
          </View>
          <Text style={[styles.successTitle, { color: theme.textPrimary }]}>Order Placed Successfully! 🎉</Text>
          <Text style={[styles.successSub, { color: theme.textSecondary }]}>
            Thank you for shopping with DeeBazer. Your order has been registered and is being processed.
          </Text>
        </View>

        {/* Invoice details card */}
        <View style={[styles.invoiceCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
          <View style={[styles.invoiceHeader, { borderBottomColor: theme.divider }]}>
            <View>
              <Text style={[styles.invoiceLabel, { color: theme.textSecondary }]}>ORDER ID</Text>
              <Text style={[styles.invoiceValueId, { color: AllColors.primary }]}>#{displayOrderId}</Text>
            </View>
            <View style={styles.alignRight}>
              <Text style={[styles.invoiceLabel, { color: theme.textSecondary }]}>PAYMENT METHOD</Text>
              <Text style={[styles.invoiceValueMode, { color: theme.textPrimary }]}>{paymentText}</Text>
            </View>
          </View>

          {/* Items Summary */}
          {itemsList.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Items Summary</Text>
              <View style={styles.itemsContainer}>
                {itemsList.map((item, index) => (
                  <View key={`order-item-${item.id || ''}-${index}`} style={styles.itemRow}>
                    {item.image || item.img || item.product_image || item.thumbnail ? (
                      <Image
                        source={{ uri: item.image || item.img || item.product_image || item.thumbnail }}
                        style={[styles.itemThumb, { backgroundColor: isDarkMode ? '#0F172A' : AllColors.screenBg }]}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.itemThumb, { backgroundColor: isDarkMode ? '#334155' : AllColors.divider, justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="cube-outline" size={20} color={isDarkMode ? '#94A3B8' : AllColors.slateSub} />
                      </View>
                    )}
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, { color: theme.textPrimary }]} numberOfLines={1}>
                        {item.name || item.product_name || 'Product'}
                      </Text>
                      <Text style={[styles.itemQty, { color: theme.textSecondary }]}>
                        Qty: {item.qty || item.quantity || 1} × ₹{item.selling_price || item.price || 0}
                      </Text>
                    </View>
                    <Text style={[styles.itemTotal, { color: theme.textPrimary }]}>
                      ₹{(item.qty || item.quantity || 1) * (item.selling_price || item.price || 0)}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={[styles.divider, { backgroundColor: theme.divider }]} />
            </>
          )}

          {/* Delivery Address */}
          <View style={styles.addressSection}>
            <View style={styles.addressTitleRow}>
              <MaterialCommunityIcons name="map-marker-radius" size={20} color={AllColors.primary} />
              <Text style={[styles.addressTitle, { color: theme.textPrimary }]}>Delivery Address</Text>
            </View>
            <Text style={[styles.customerName, { color: theme.textPrimary }]}>{name}</Text>
            <Text style={[styles.addressDetails, { color: theme.textSecondary }]}>{addressString}</Text>
            {mobile ? <Text style={[styles.addressPhone, { color: theme.textSecondary }]}>Mobile: {mobile}</Text> : null}
          </View>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          {/* Bill details */}
          <View style={styles.billContainer}>
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: theme.textSecondary }]}>Subtotal</Text>
              <Text style={[styles.billValue, { color: theme.textPrimary }]}>₹{amount}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: theme.textSecondary }]}>Delivery Fee</Text>
              <Text style={[styles.billValue, { color: AllColors.greenLight, fontWeight: '700' }]}>FREE</Text>
            </View>
            <View style={[styles.billRowTotal, { borderTopColor: theme.divider }]}>
              <Text style={[styles.billTotalLabel, { color: theme.textPrimary }]}>Total Payable</Text>
              <Text style={styles.billTotalValue}>₹{amount}</Text>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.btnWrapper}>
          <TouchableOpacity style={styles.viewOrdersBtn} onPress={handleViewOrders} activeOpacity={0.85}>
            <Ionicons name="receipt-outline" size={20} color={AllColors.white} style={styles.btnIcon} />
            <Text style={styles.viewOrdersText}>View My Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.continueShoppingBtn, { borderColor: theme.borderColor }]}
            onPress={handleGoHome}
            activeOpacity={0.85}
          >
            <Ionicons name="cart-outline" size={20} color={AllColors.primary} style={styles.btnIcon} />
            <Text style={styles.continueShoppingText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  successHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  iconCircle: {
    marginBottom: 16,
    transform: [{ scale: 1.1 }],
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 30,
  },
  successSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  invoiceCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    elevation: 3,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  invoiceLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  invoiceValueId: {
    fontSize: 16,
    fontWeight: '800',
  },
  invoiceValueMode: {
    fontSize: 14,
    fontWeight: '700',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  itemsContainer: {
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemQty: {
    fontSize: 12,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  addressSection: {
    paddingVertical: 4,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 13,
  },
  billContainer: {
    paddingTop: 4,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 14,
  },
  billValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  billRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  billTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  billTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: AllColors.primary,
  },
  btnWrapper: {
    width: '100%',
    paddingHorizontal: 8,
  },
  viewOrdersBtn: {
    width: '100%',
    backgroundColor: AllColors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: AllColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  viewOrdersText: {
    color: AllColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  continueShoppingBtn: {
    width: '100%',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
  },
  continueShoppingText: {
    color: AllColors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  btnIcon: {
    marginRight: 8,
  },
});