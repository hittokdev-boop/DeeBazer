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
  Linking,
  Alert,
  Platform,
  ToastAndroid,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AllColors from '../../../Constants/Color';
import { STATUSBAR_HEIGHT } from '../../../Constants/ScreenUtils';
import { useTheme } from '../../../Context/ThemeContext';
import { getOrderDetailsApi, checkPaymentStatusApi, getToken, getuserId } from '../../../Api/Api';
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
  const [checkingPayment, setCheckingPayment] = useState(false);

  const handleCheckPaymentStatus = async (silent = false) => {
    const targetTxn =
      order?.txnid ||
      initialOrder?.txnid ||
      (typeof order?.id === 'string' && order.id.startsWith('DBZ') ? order.id : null) ||
      (typeof order?.order_number === 'string' && order.order_number.startsWith('DBZ') ? order.order_number : null);

    if (!targetTxn) {
      if (!silent) Alert.alert('Information', 'No transaction ID available to check payment status.');
      return;
    }

    if (!silent) setCheckingPayment(true);
    try {
      const res = await checkPaymentStatusApi(targetTxn);
      console.log('Payment status API result in OrderSuccess:', res);
      if (res && (res.status === 200 || res.status === '200')) {
        const pStatus = String(res.payment_status || '').toLowerCase();
        const pState = String(res.state || '').toLowerCase();

        if (pStatus === 'order_failed' || pState.includes('refund')) {
          setOrder((prev) => ({
            ...prev,
            payment_status: res.payment_status || 'order_failed',
            payment_state: res.state || 'refund_pending',
            payment_message: res.message,
            refund_amount: res.amount,
          }));
          if (!silent) {
            Alert.alert('Refund Notice ℹ️', res.message || 'Payment received, but the order could not be placed. Your money will be refunded.');
          }
        } else if (pStatus === 'success' || pStatus === 'completed' || pStatus === 'paid' || pState === 'success') {
          setOrder((prev) => ({
            ...prev,
            payment_status: 'paid',
            payment_state: 'completed',
          }));
          if (Array.isArray(res.order_ids) && res.order_ids.length > 0) {
            fetchOrderDetails(res.order_ids[0]);
          }
          if (!silent) {
            if (Platform.OS === 'android') {
              ToastAndroid.show('Payment Verified Successfully! 🎉', ToastAndroid.LONG);
            } else {
              Alert.alert('Success 🎉', 'Payment verified successfully!');
            }
          }
        } else if (!silent) {
          Alert.alert('Payment Pending', res.message || 'Payment is still pending.');
        }
      } else if (!silent) {
        Alert.alert('Payment Status', res?.message || 'Could not verify payment status at this moment.');
      }
    } catch (err) {
      console.log('OrderSuccess check payment error:', err);
    } finally {
      if (!silent) setCheckingPayment(false);
    }
  };

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

      const result = await getOrderDetailsApi(parsedOrderId);
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
            : (rawOrderData.name || rawOrderData.img || rawOrderData.image)
            ? [rawOrderData]
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
  const rawPayment =
    order?.payment_method ||
    order?.payment_type ||
    order?.payment_mode ||
    payment_method ||
    '';

  const paymentText = (() => {
    const pm = String(rawPayment).toLowerCase();
    if (pm === 'cod' || pm.includes('cash on delivery')) return 'Cash on Delivery (COD)';
    if (pm === 'payu' || pm.includes('payu')) return 'Paid Online (PayU)';
    if (pm === 'cashfree' || pm === 'online' || pm.includes('prepaid')) return 'Paid Online (Prepaid)';
    return rawPayment || 'Cash on Delivery (COD)';
  })();

  const paymentUrl = order?.payment_url || null;
  const isRefundPending =
    String(order?.payment_status || '').toLowerCase() === 'order_failed' ||
    String(order?.payment_state || '').toLowerCase().includes('refund');
  const isPaymentPending =
    !isRefundPending &&
    (String(order?.payment_status || '').toLowerCase() === 'pending' ||
      (paymentText.includes('PayU') && Boolean(paymentUrl)));

  const amount = Number(order?.line_total ?? order?.payable_amount ?? order?.total_amount ?? order?.net_amount ?? order?.amount ?? order?.selling_price ?? 0);

  const itemsList =
    Array.isArray(order?.items) && order.items.length > 0
      ? order.items
      : Array.isArray(order?.products) && order.products.length > 0
      ? order.products
      : Array.isArray(order?.order_items) && order.order_items.length > 0
      ? order.order_items
      : Array.isArray(order?.details) && order.details.length > 0
      ? order.details
      : (order?.name || order?.img || order?.image)
      ? [order]
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
        backgroundColor="transparent"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        translucent={true}
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

        {/* Refund Pending Notice Banner */}
        {isRefundPending ? (
          <View
            style={[
              styles.pendingPaymentBanner,
              {
                backgroundColor: isDarkMode ? '#2D0A0A' : '#FEF2F2',
                borderColor: '#EF4444',
              },
            ]}
          >
            <View style={styles.pendingPaymentRow}>
              <View
                style={[
                  styles.pendingPaymentIconWrapper,
                  { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.25)' : '#FEE2E2' },
                ]}
              >
                <MaterialCommunityIcons name="cash-refund" size={24} color="#DC2626" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.pendingPaymentTitle, { color: isDarkMode ? '#FCA5A5' : '#B91C1C' }]}>
                  Order Placement Failed • Refund Initiated
                </Text>
                <Text style={[styles.pendingPaymentSub, { color: isDarkMode ? '#F87171' : '#7F1D1D' }]}>
                  {order?.payment_message || 'Payment received, but the order could not be placed. Your money will be refunded.'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.checkPaymentStatusSuccessBtn,
                {
                  borderColor: isDarkMode ? '#7F1D1D' : '#FCA5A5',
                  marginTop: 12,
                },
              ]}
              onPress={() => handleCheckPaymentStatus(false)}
              disabled={checkingPayment}
              activeOpacity={0.8}
            >
              {checkingPayment ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <>
                  <Feather name="refresh-cw" size={14} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text style={[styles.checkPaymentStatusSuccessBtnText, { color: '#DC2626' }]}>Refresh Refund Status</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {/* PayU Payment Pending Action Banner */}
        {isPaymentPending ? (
          <View
            style={[
              styles.pendingPaymentBanner,
              {
                backgroundColor: isDarkMode ? '#2D1F03' : '#FFFBEB',
                borderColor: '#F59E0B',
              },
            ]}
          >
            <View style={styles.pendingPaymentRow}>
              <View
                style={[
                  styles.pendingPaymentIconWrapper,
                  { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.25)' : '#FEF3C7' },
                ]}
              >
                <Ionicons name="card-outline" size={24} color="#D97706" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.pendingPaymentTitle, { color: isDarkMode ? '#FDE68A' : '#92400E' }]}>
                  Complete Your Payment
                </Text>
                <Text style={[styles.pendingPaymentSub, { color: isDarkMode ? '#FCD34D' : '#B45309' }]}>
                  Please complete payment via PayU to confirm this order.
                </Text>
              </View>
            </View>

            {paymentUrl ? (
              <TouchableOpacity
                style={styles.payNowSuccessBtn}
                onPress={() => Linking.openURL(paymentUrl).catch(() => {})}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="shield-check" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.payNowSuccessBtnText}>Pay Now via PayU</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[
                styles.checkPaymentStatusSuccessBtn,
                {
                  backgroundColor: isDarkMode ? '#3A2000' : '#FEF3C7',
                  borderColor: isDarkMode ? '#78350F' : '#FDE68A',
                  marginTop: paymentUrl ? 8 : 12,
                },
              ]}
              onPress={() => handleCheckPaymentStatus(false)}
              disabled={checkingPayment}
              activeOpacity={0.8}
            >
              {checkingPayment ? (
                <ActivityIndicator size="small" color="#D97706" />
              ) : (
                <>
                  <Feather name="refresh-cw" size={14} color="#D97706" style={{ marginRight: 6 }} />
                  <Text style={styles.checkPaymentStatusSuccessBtnText}>Check Payment Status</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

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
    marginTop: STATUSBAR_HEIGHT + 14,
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
  pendingPaymentBanner: {
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
  },
  pendingPaymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingPaymentIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingPaymentTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  pendingPaymentSub: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 17,
  },
  payNowSuccessBtn: {
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 12,
  },
  payNowSuccessBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  checkPaymentStatusSuccessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  checkPaymentStatusSuccessBtnText: {
    color: '#D97706',
    fontSize: 13,
    fontWeight: '700',
  },
});