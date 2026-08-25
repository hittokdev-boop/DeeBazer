import React, { useEffect, useState, useCallback } from 'react';
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
  RefreshControl,
  Share,
  Platform,
  ToastAndroid,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation, useRoute } from '@react-navigation/native';
import AllColors from '../../../Constants/Color';
import { useTheme } from '../../../Context/ThemeContext';
import { BASE_URL, getToken } from '../../../Api/Api';

export default function OrderDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDarkMode } = useTheme();
  const params = route.params || {};

  const initialOrder =
    params.order ||
    params.item ||
    (params.id && typeof params.id === 'object' ? params.id : null);

  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(!initialOrder?.items);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const targetOrderId =
    params.order_id ||
    params.id ||
    initialOrder?.order_id_generate ||
    initialOrder?.id ||
    initialOrder?.order_id;

  const fetchOrderDetails = useCallback(
    async (isPullToRefresh = false) => {
      if (!isPullToRefresh && (!order || !order.items)) {
        setLoading(true);
      }
      setError(null);

      try {
        const token = await getToken();

        if (!token) {
          setLoading(false);
          setRefreshing(false);
          setError('Authentication required to view order details.');
          return;
        }

        if (!targetOrderId) {
          setLoading(false);
          setRefreshing(false);
          if (!order) {
            setError('Order ID is missing.');
          }
          return;
        }

        const parsedOrderId =
          !isNaN(targetOrderId) && String(targetOrderId).trim() !== ''
            ? Number(targetOrderId)
            : targetOrderId;

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

        if (
          response.ok &&
          (result?.status === 200 ||
            result?.status === '200' ||
            result?.status === 'success' ||
            result?.success)
        ) {
          const orderData =
            result?.data ||
            result?.order ||
            result?.order_details ||
            (result?.id ? result : null);
          if (orderData) {
            setOrder(orderData);
          }
        } else {
          if (!order || !order.items) {
            setError(result?.message || 'Failed to retrieve order details.');
          }
        }
      } catch (err) {
        console.log('OrderDetails fetch error:', err);
        if (!order || !order.items) {
          setError('Network error. Please check your internet connection.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [targetOrderId]
  );

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderDetails(true);
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    Clipboard.setString(String(text));
    if (Platform.OS === 'android') {
      ToastAndroid.show('Order ID copied to clipboard', ToastAndroid.SHORT);
    } else {
      Alert.alert('Copied', 'Order ID copied to clipboard');
    }
  };

  const getStatusConfig = (status) => {
    const s = String(status || '').toLowerCase();
    if (
      s.includes('delivered') ||
      s.includes('success') ||
      s.includes('completed')
    ) {
      return {
        bg: isDarkMode ? 'rgba(16, 185, 129, 0.18)' : '#DCFCE7',
        color: isDarkMode ? '#34D399' : '#15803D',
        borderColor: isDarkMode ? 'rgba(52, 211, 153, 0.3)' : '#BBF7D0',
        label: status || 'Success',
        icon: 'checkmark-circle',
        subtitle: 'Your order has been completed successfully.',
        stepIndex: 3,
      };
    }
    if (s.includes('cancel') || s.includes('fail') || s.includes('reject')) {
      return {
        bg: isDarkMode ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2',
        color: isDarkMode ? '#F87171' : '#B91C1C',
        borderColor: isDarkMode ? 'rgba(248, 113, 113, 0.3)' : '#FECACA',
        label: status || 'Cancelled',
        icon: 'close-circle',
        subtitle: 'This order was cancelled.',
        stepIndex: -1,
      };
    }
    if (s.includes('ship') || s.includes('transit') || s.includes('out')) {
      return {
        bg: isDarkMode ? 'rgba(59, 130, 246, 0.18)' : '#DBEAFE',
        color: isDarkMode ? '#60A5FA' : '#1D4ED8',
        borderColor: isDarkMode ? 'rgba(96, 165, 250, 0.3)' : '#BFDBFE',
        label: status || 'Shipped',
        icon: 'car-outline',
        subtitle: 'Your package is on its way to you.',
        stepIndex: 2,
      };
    }
    return {
      bg: isDarkMode ? 'rgba(247, 22, 112, 0.15)' : AllColors.softPinkBg,
      color: AllColors.primary,
      borderColor: isDarkMode ? 'rgba(247, 22, 112, 0.3)' : '#FCE7F3',
      label: status || 'Processing',
      icon: 'time',
      subtitle: 'Your order is placed and is currently being processed.',
      stepIndex: 1,
    };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return String(dateStr);
    }
  };

  const handleShareOrder = async () => {
    if (!order) return;
    try {
      const id = order.order_id_generate || order.id || targetOrderId;
      await Share.share({
        message: `DeeBazer Order #${id}\nStatus: ${order.order_status || 'Processing'}\nTotal: ₹${order.net_amount || order.amount || 0}`,
      });
    } catch (e) {
      console.log('Share error:', e);
    }
  };

  // Loading State
  if (loading && !refreshing && !order) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar
          backgroundColor={isDarkMode ? theme.cardBg : AllColors.white}
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        />
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.backBtn,
              { backgroundColor: isDarkMode ? '#334155' : AllColors.divider },
            ]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Order Details
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={AllColors.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading order details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Professional Error / Fallback State
  if (error && (!order || !order.items)) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar
          backgroundColor={isDarkMode ? theme.cardBg : AllColors.white}
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        />
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.backBtn,
              { backgroundColor: isDarkMode ? '#334155' : AllColors.divider },
            ]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Order Details
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Scrollable Error Card Screen */}
        <ScrollView
          contentContainerStyle={styles.errorScrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[AllColors.primary]}
              tintColor={AllColors.primary}
            />
          }
        >
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor,
              },
            ]}
          >
            {/* Glowing Icon Wrapper */}
            <View
              style={[
                styles.errorIconOuterRing,
                {
                  backgroundColor: isDarkMode
                    ? 'rgba(239, 68, 68, 0.12)'
                    : 'rgba(239, 68, 68, 0.08)',
                },
              ]}
            >
              <View
                style={[
                  styles.errorIconInnerRing,
                  {
                    backgroundColor: isDarkMode
                      ? 'rgba(239, 68, 68, 0.22)'
                      : '#FEE2E2',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="package-variant-closed-remove"
                  size={46}
                  color={isDarkMode ? '#F87171' : AllColors.red}
                />
              </View>
            </View>

            {targetOrderId ? (
              <TouchableOpacity
                style={[
                  styles.orderRefBadge,
                  {
                    backgroundColor: isDarkMode
                      ? 'rgba(247, 22, 112, 0.15)'
                      : AllColors.softPinkBg,
                  },
                ]}
                onPress={() => copyToClipboard(targetOrderId)}
                activeOpacity={0.7}
              >
                <Feather name="hash" size={13} color={AllColors.primary} />
                <Text
                  style={[
                    styles.orderRefText,
                    { color: AllColors.primary },
                  ]}
                >
                  Order #{targetOrderId}
                </Text>
                <Feather
                  name="copy"
                  size={12}
                  color={AllColors.primary}
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>
            ) : null}

            <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>
              Unable to Load Order
            </Text>

            <Text style={[styles.errorSub, { color: theme.textSecondary }]}>
              {error ||
                'We could not retrieve your order details at this time. Please verify your connection or try again.'}
            </Text>

            {/* Quick Tips Box */}
            <View
              style={[
                styles.errorTipsBox,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                  borderColor: theme.borderColor,
                },
              ]}
            >
              <View style={styles.errorTipRow}>
                <Ionicons
                  name="wifi-outline"
                  size={16}
                  color={AllColors.primary}
                  style={styles.tipIcon}
                />
                <Text
                  style={[
                    styles.errorTipText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Check your internet or Wi-Fi connection
                </Text>
              </View>

              <View style={styles.errorTipRow}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={AllColors.primary}
                  style={styles.tipIcon}
                />
                <Text
                  style={[
                    styles.errorTipText,
                    { color: theme.textSecondary },
                  ]}
                >
                  If placed recently, please give it a moment
                </Text>
              </View>

              <View style={styles.errorTipRow}>
                <Ionicons
                  name="headset-outline"
                  size={16}
                  color={AllColors.primary}
                  style={styles.tipIcon}
                />
                <Text
                  style={[
                    styles.errorTipText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Reach out to support if the issue persists
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.errorRetryBtn}
              onPress={() => fetchOrderDetails(false)}
              activeOpacity={0.85}
            >
              <Feather
                name="refresh-cw"
                size={18}
                color={AllColors.white}
                style={styles.btnIconLeft}
              />
              <Text style={styles.errorRetryBtnText}>Try Again</Text>
            </TouchableOpacity>

            <View style={styles.errorSecondaryActions}>
              <TouchableOpacity
                style={[
                  styles.errorOutlineBtn,
                  {
                    backgroundColor: isDarkMode ? '#1E293B' : AllColors.white,
                    borderColor: theme.borderColor,
                  },
                ]}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="arrow-back"
                  size={16}
                  color={theme.textPrimary}
                  style={styles.btnIconLeft}
                />
                <Text
                  style={[
                    styles.errorOutlineBtnText,
                    { color: theme.textPrimary },
                  ]}
                >
                  Go Back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.errorOutlineBtn,
                  {
                    backgroundColor: isDarkMode ? '#1E293B' : AllColors.white,
                    borderColor: theme.borderColor,
                  },
                ]}
                onPress={() => navigation.navigate('HelpCenter')}
                activeOpacity={0.8}
              >
                <Feather
                  name="headphones"
                  size={15}
                  color={theme.textPrimary}
                  style={styles.btnIconLeft}
                />
                <Text
                  style={[
                    styles.errorOutlineBtnText,
                    { color: theme.textPrimary },
                  ]}
                >
                  Need Help?
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentOrder = order || {};
  const displayOrderId =
    currentOrder.order_id_generate ||
    currentOrder.id ||
    targetOrderId ||
    '---';

  const orderStatus =
    currentOrder.order_status ||
    currentOrder.status ||
    currentOrder.type ||
    'Pending';

  const statusConfig = getStatusConfig(orderStatus);
  const dateText = formatDate(
    currentOrder.created_at || currentOrder.order_date || currentOrder.date
  );

  const subTotal = Number(
    currentOrder.amount ??
      currentOrder.total_amount ??
      currentOrder.subtotal ??
      0
  );
  const netTotal = Number(
    currentOrder.net_amount ??
      currentOrder.amount ??
      currentOrder.total_amount ??
      0
  );
  const discountAmount = Number(
    currentOrder.discount ?? currentOrder.coupon_discount ?? 0
  );
  const deliveryCharge = Number(
    currentOrder.shipping_charge ?? currentOrder.delivery_charge ?? 0
  );

  // Address parsing
  const addressObj =
    typeof currentOrder.address === 'object' && currentOrder.address !== null
      ? currentOrder.address
      : null;

  const customerName =
    currentOrder.name ||
    currentOrder.user_name ||
    currentOrder.shipping_name ||
    currentOrder.customer_name ||
    addressObj?.name ||
    'Customer';

  const mobileNumber =
    currentOrder.mobile ||
    currentOrder.phone ||
    currentOrder.user_phone ||
    currentOrder.contact ||
    addressObj?.mobile ||
    addressObj?.phone ||
    '';

  const addressString =
    typeof currentOrder.address === 'string' &&
    currentOrder.address.trim().length > 0
      ? currentOrder.address
      : addressObj
      ? [
          addressObj.house_no,
          addressObj.address,
          addressObj.road_name,
          addressObj.city,
          addressObj.state,
          addressObj.pin || addressObj.zip_code,
        ]
          .filter(Boolean)
          .join(', ')
      : currentOrder.delivery_address ||
        currentOrder.shipping_address ||
        'Address not available';

  // Items parsing
  const itemsList =
    Array.isArray(currentOrder.items) && currentOrder.items.length > 0
      ? currentOrder.items
      : Array.isArray(currentOrder.order_items) &&
        currentOrder.order_items.length > 0
      ? currentOrder.order_items
      : Array.isArray(currentOrder.products) &&
        currentOrder.products.length > 0
      ? currentOrder.products
      : Array.isArray(currentOrder.details) &&
        currentOrder.details.length > 0
      ? currentOrder.details
      : Array.isArray(currentOrder.order_details) &&
        currentOrder.order_details.length > 0
      ? currentOrder.order_details
      : [];

  const paymentMethodText =
    currentOrder.payment_method ||
    currentOrder.payment_type ||
    currentOrder.payment_mode ||
    'Online / Prepaid';

  const steps = [
    { title: 'Order Placed', icon: 'bag-check-outline' },
    { title: 'Processing', icon: 'sync-outline' },
    { title: 'Shipped', icon: 'car-outline' },
    { title: 'Delivered', icon: 'checkmark-done-outline' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        backgroundColor={isDarkMode ? theme.cardBg : AllColors.white}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backBtn,
            { backgroundColor: isDarkMode ? '#334155' : AllColors.divider },
          ]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Order Details
        </Text>

        <TouchableOpacity
          style={[
            styles.backBtn,
            { backgroundColor: isDarkMode ? '#334155' : AllColors.divider },
          ]}
          onPress={handleShareOrder}
          activeOpacity={0.7}
        >
          <Feather name="share-2" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollFlex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[AllColors.primary]}
            tintColor={AllColors.primary}
          />
        }
      >
        {/* Status Hero Card */}
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: statusConfig.bg,
              borderColor: statusConfig.borderColor,
            },
          ]}
        >
          <Ionicons
            name={statusConfig.icon}
            size={32}
            color={statusConfig.color}
          />
          <View style={styles.statusTextContainer}>
            <Text style={[styles.statusTitle, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
            <Text
              style={[styles.statusSubtitle, { color: statusConfig.color }]}
            >
              {statusConfig.subtitle}
            </Text>
          </View>
        </View>

        {/* Timeline Stepper (if not cancelled) */}
        {statusConfig.stepIndex >= 0 && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor,
              },
            ]}
          >
            <View style={styles.cardTitleWithIcon}>
              <Feather name="activity" size={18} color={AllColors.primary} />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.textPrimary, marginLeft: 8 },
                ]}
              >
                Order Tracker
              </Text>
            </View>

            <View
              style={[styles.divider, { backgroundColor: theme.divider }]}
            />

            <View style={styles.trackerContainer}>
              {steps.map((step, idx) => {
                const isPassed = statusConfig.stepIndex >= idx;
                const isCurrent = statusConfig.stepIndex === idx;

                return (
                  <View key={step.title} style={styles.trackerStepWrapper}>
                    <View
                      style={[
                        styles.trackerCircle,
                        isPassed
                          ? { backgroundColor: AllColors.primary }
                          : {
                              backgroundColor: isDarkMode
                                ? '#334155'
                                : AllColors.divider,
                            },
                        isCurrent && styles.trackerCircleCurrent,
                      ]}
                    >
                      <Ionicons
                        name={step.icon}
                        size={14}
                        color={
                          isPassed
                            ? AllColors.white
                            : isDarkMode
                            ? '#94A3B8'
                            : AllColors.slateSub
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.trackerStepLabel,
                        {
                          color: isPassed
                            ? theme.textPrimary
                            : theme.textSecondary,
                          fontWeight: isCurrent ? '700' : '500',
                        },
                      ]}
                    >
                      {step.title}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Order Info Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleWithIcon}>
              <Feather name="package" size={18} color={AllColors.primary} />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.textPrimary, marginLeft: 8 },
                ]}
              >
                Order Summary
              </Text>
            </View>
            <View
              style={[
                styles.miniStatusBadge,
                { backgroundColor: statusConfig.bg },
              ]}
            >
              <Text
                style={[
                  styles.miniStatusText,
                  { color: statusConfig.color },
                ]}
              >
                {statusConfig.label}
              </Text>
            </View>
          </View>

          <View
            style={[styles.divider, { backgroundColor: theme.divider }]}
          />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
              Order ID
            </Text>
            <TouchableOpacity
              style={styles.orderIdCopyRow}
              onPress={() => copyToClipboard(displayOrderId)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.infoValue,
                  { color: AllColors.primary, fontWeight: '700' },
                ]}
              >
                #{displayOrderId}
              </Text>
              <Feather
                name="copy"
                size={14}
                color={AllColors.primary}
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
              Order Date
            </Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              {dateText}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
              Payment Mode
            </Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              {paymentMethodText}
            </Text>
          </View>

          {itemsList.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Total Items
              </Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                {itemsList.length} item{itemsList.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Delivery Address Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
            },
          ]}
        >
          <View style={styles.cardTitleWithIcon}>
            <MaterialCommunityIcons
              name="map-marker-radius-outline"
              size={20}
              color={AllColors.primary}
            />
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.textPrimary, marginLeft: 8 },
              ]}
            >
              Delivery Address
            </Text>
          </View>

          <View
            style={[styles.divider, { backgroundColor: theme.divider }]}
          />

          <Text style={[styles.customerName, { color: theme.textPrimary }]}>
            {customerName}
          </Text>
          <Text style={[styles.addressText, { color: theme.textSecondary }]}>
            {addressString}
          </Text>
          {mobileNumber ? (
            <View style={styles.phoneRow}>
              <Feather name="phone" size={13} color={theme.textSecondary} />
              <Text style={[styles.phoneText, { color: theme.textSecondary }]}>
                {mobileNumber}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Ordered Items Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
            },
          ]}
        >
          <View style={styles.cardTitleWithIcon}>
            <Feather name="shopping-bag" size={18} color={AllColors.primary} />
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.textPrimary, marginLeft: 8 },
              ]}
            >
              Items Ordered {itemsList.length > 0 ? `(${itemsList.length})` : ''}
            </Text>
          </View>

          <View
            style={[styles.divider, { backgroundColor: theme.divider }]}
          />

          {itemsList.length > 0 ? (
            itemsList.map((prod, index) => {
              const itemPrice = Number(
                prod.selling_price ||
                  prod.price ||
                  prod.unit_price ||
                  prod.product?.selling_price ||
                  prod.product?.price ||
                  0
              );
              const itemTotal = Number(
                prod.total_amount ||
                  prod.total ||
                  prod.subtotal ||
                  prod.amount ||
                  0
              );
              const calculatedQty =
                prod.qty ||
                prod.quantity ||
                prod.count ||
                (itemPrice > 0 && itemTotal > 0
                  ? Math.round(itemTotal / itemPrice)
                  : 1);
              const displayPrice =
                itemPrice > 0 ? itemPrice : itemTotal > 0 ? itemTotal : 0;

              const itemImage =
                prod.image ||
                prod.product_image ||
                prod.thumbnail ||
                prod.photo ||
                prod.product?.image ||
                prod.product?.thumbnail ||
                null;

              const itemName =
                prod.name ||
                prod.product_name ||
                prod.title ||
                prod.product?.name ||
                'Product Item';

              return (
                <View
                  key={prod.id || prod.product_id || index}
                  style={[
                    styles.productRow,
                    index < itemsList.length - 1 && styles.productRowBorder,
                    { borderBottomColor: theme.divider },
                  ]}
                >
                  {itemImage ? (
                    <Image
                      source={{ uri: itemImage }}
                      style={[
                        styles.productThumb,
                        {
                          backgroundColor: isDarkMode
                            ? '#0F172A'
                            : AllColors.screenBg,
                        },
                      ]}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.productThumbPlaceholder,
                        {
                          backgroundColor: isDarkMode
                            ? '#334155'
                            : AllColors.divider,
                        },
                      ]}
                    >
                      <Feather
                        name="package"
                        size={22}
                        color={isDarkMode ? '#94A3B8' : AllColors.slateSub}
                      />
                    </View>
                  )}

                  <View style={styles.productDetailsContainer}>
                    <Text
                      style={[
                        styles.productTitleText,
                        { color: theme.textPrimary },
                      ]}
                      numberOfLines={2}
                    >
                      {itemName}
                    </Text>

                    <View style={styles.productMetaRow}>
                      <Text
                        style={[
                          styles.productPriceText,
                          { color: AllColors.primary },
                        ]}
                      >
                        ₹{displayPrice}
                      </Text>

                      <View
                        style={[
                          styles.qtyBadge,
                          {
                            backgroundColor: isDarkMode
                              ? '#334155'
                              : AllColors.divider,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.qtyBadgeText,
                            {
                              color: isDarkMode
                                ? '#CBD5E1'
                                : AllColors.slateSub,
                            },
                          ]}
                        >
                          Qty: {calculatedQty}
                        </Text>
                      </View>

                      {prod.status ? (
                        <View
                          style={[
                            styles.itemStatusBadge,
                            {
                              backgroundColor: isDarkMode
                                ? 'rgba(247, 22, 112, 0.15)'
                                : AllColors.softPinkBg,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.itemStatusText,
                              { color: AllColors.primary },
                            ]}
                          >
                            {prod.status}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyItemsBox}>
              <Feather
                name="info"
                size={20}
                color={theme.textSecondary}
                style={styles.btnIconLeft}
              />
              <Text
                style={[styles.emptyItemsText, { color: theme.textSecondary }]}
              >
                Order #{displayOrderId} details recorded.
              </Text>
            </View>
          )}
        </View>

        {/* Price Breakdown Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
            },
          ]}
        >
          <View style={styles.cardTitleWithIcon}>
            <Ionicons
              name="receipt-outline"
              size={18}
              color={AllColors.primary}
            />
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.textPrimary, marginLeft: 8 },
              ]}
            >
              Price Details
            </Text>
          </View>

          <View
            style={[styles.divider, { backgroundColor: theme.divider }]}
          />

          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>
              Subtotal
            </Text>
            <Text style={[styles.priceValue, { color: theme.textPrimary }]}>
              ₹{subTotal > 0 ? subTotal : netTotal}
            </Text>
          </View>

          {discountAmount > 0 ? (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>
                Discount
              </Text>
              <Text
                style={[
                  styles.priceValue,
                  { color: isDarkMode ? '#34D399' : '#15803D' },
                ]}
              >
                -₹{discountAmount}
              </Text>
            </View>
          ) : null}

          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>
              Delivery Charges
            </Text>
            <Text
              style={
                deliveryCharge === 0
                  ? styles.priceValueFree
                  : [styles.priceValue, { color: theme.textPrimary }]
              }
            >
              {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
            </Text>
          </View>

          <View
            style={[
              styles.dividerDashed,
              { borderColor: theme.divider },
            ]}
          />

          <View style={styles.priceRowTotal}>
            <Text
              style={[styles.priceLabelTotal, { color: theme.textPrimary }]}
            >
              Total Amount
            </Text>
            <Text style={styles.priceValueTotal}>₹{netTotal}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.outlineBtn,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor,
              },
            ]}
            onPress={() => navigation.navigate('HelpCenter')}
            activeOpacity={0.8}
          >
            <Feather
              name="headphones"
              size={16}
              color={theme.textPrimary}
              style={styles.btnIconLeft}
            />
            <Text style={[styles.outlineBtnText, { color: theme.textPrimary }]}>
              Need Help?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('AppTab')}
            activeOpacity={0.85}
          >
            <Ionicons
              name="bag-handle-outline"
              size={18}
              color={AllColors.white}
              style={styles.btnIconLeft}
            />
            <Text style={styles.primaryBtnText}>Continue Shopping</Text>
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
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 38,
  },
  scrollFlex: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  statusTextContainer: {
    marginLeft: 14,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.95,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  miniStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  miniStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  dividerDashed: {
    height: 1,
    marginVertical: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderRadius: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderIdCopyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 6,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  phoneText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  productRowBorder: {
    borderBottomWidth: 1,
  },
  productThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  productThumbPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetailsContainer: {
    flex: 1,
    marginLeft: 12,
  },
  productTitleText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
    marginBottom: 6,
  },
  productMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  productPriceText: {
    fontSize: 15,
    fontWeight: '800',
  },
  qtyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  qtyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyItemsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  emptyItemsText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  priceValueFree: {
    fontSize: 14,
    fontWeight: '700',
    color: AllColors.greenLight,
  },
  priceRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  priceLabelTotal: {
    fontSize: 16,
    fontWeight: '700',
  },
  priceValueTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: AllColors.primary,
  },
  trackerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  trackerStepWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  trackerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  trackerCircleCurrent: {
    borderWidth: 2,
    borderColor: AllColors.primary,
  },
  trackerStepLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  outlineBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 1.3,
    height: 48,
    borderRadius: 14,
    backgroundColor: AllColors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: AllColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  primaryBtnText: {
    color: AllColors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  btnIconLeft: {
    marginRight: 6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },

  // Premium Error / Fallback Screen Styles
  errorScrollContainer: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  errorCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 4,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  errorIconOuterRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorIconInnerRing: {
    width: 74,
    height: 74,
    borderRadius: 37,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderRefBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  orderRefText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  errorSub: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  errorTipsBox: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    marginBottom: 22,
    borderWidth: 1,
    gap: 10,
  },
  errorTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIcon: {
    marginRight: 10,
  },
  errorTipText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
  errorRetryBtn: {
    width: '100%',
    height: 50,
    borderRadius: 15,
    backgroundColor: AllColors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: AllColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    marginBottom: 12,
  },
  errorRetryBtnText: {
    color: AllColors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  errorSecondaryActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  errorOutlineBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorOutlineBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
