import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation, useRoute } from '@react-navigation/native';
import AllColors from '../../../Constants/Color';
import { useTheme } from '../../../Context/ThemeContext';
import { BASE_URL, getToken, getuserId } from '../../../Api/Api';

export default function OrderDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDarkMode } = useTheme();
  const params = route.params || {};

  const handleBack = () => {
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Orders');
    }
  };

  const initialOrder =
    params.order ||
    params.item ||
    (params.id && typeof params.id === 'object' ? params.id : null);

  const hasInitialData = Boolean(
    initialOrder &&
    ((Array.isArray(initialOrder.items) && initialOrder.items.length > 0) ||
      (Array.isArray(initialOrder.products) && initialOrder.products.length > 0) ||
      (Array.isArray(initialOrder.order_items) && initialOrder.order_items.length > 0) ||
      initialOrder.name ||
      initialOrder.img ||
      initialOrder.image ||
      initialOrder.order_number ||
      initialOrder.order_id_generate ||
      initialOrder.order_id)
  );

  const [order, setOrder] = useState(initialOrder);
  const orderRef = useRef(initialOrder); // track order without causing re-fetch loop
  const [loading, setLoading] = useState(!hasInitialData);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Return Policy State
  const [showReturnGuidelinesModal, setShowReturnGuidelinesModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedReturnReason, setSelectedReturnReason] = useState('');
  const [returnComment, setReturnComment] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const targetOrderId =
    params.order_id ||
    params.id ||
    params.order_number ||
    params.order_id_generate ||
    initialOrder?.order_id ||
    initialOrder?.id ||
    initialOrder?.order_number ||
    initialOrder?.order_id_generate;

  const targetId =
    params.id ||
    initialOrder?.id ||
    params.order_id ||
    initialOrder?.order_id;

  const targetOrderNumber =
    params.order_number ||
    params.order_id_generate ||
    initialOrder?.order_number ||
    initialOrder?.order_id_generate;

  const fetchOrderDetails = useCallback(
    async (isPullToRefresh = false) => {
      if (!isPullToRefresh && !orderRef.current) {
        setLoading(true);
      }
      setError(null);

      try {
        const token = await getToken();
        const userId = await getuserId();

        if (!token) {
          setLoading(false);
          setRefreshing(false);
          if (!orderRef.current) {
            setError('Authentication required to view order details.');
          }
          return;
        }

        if (!targetOrderId && !targetId && !targetOrderNumber) {
          setLoading(false);
          setRefreshing(false);
          if (!orderRef.current) {
            setError('Order ID is missing.');
          }
          return;
        }

        const parsedOrderId =
          targetOrderId && !isNaN(targetOrderId) && String(targetOrderId).trim() !== ''
            ? Number(targetOrderId)
            : targetOrderId;

        const parsedId =
          targetId && !isNaN(targetId) && String(targetId).trim() !== ''
            ? Number(targetId)
            : targetId;

        let result = null;

        // 1. Primary Attempt: JSON POST
        try {
          const jsonBody = {
            order_id: parsedOrderId || parsedId,
          };
          if (parsedId && parsedId !== parsedOrderId) jsonBody.id = parsedId;
          if (targetOrderNumber) jsonBody.order_number = targetOrderNumber;
          if (userId) jsonBody.user_id = isNaN(userId) ? userId : Number(userId);

          const response = await fetch(`${BASE_URL}order-details`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
            body: JSON.stringify(jsonBody),
          });
          console.log('📦 Order Details FULL API Response:', jsonBody);

          const text = await response.text();
          try {
            result = JSON.parse(text);
            console.log('📦 Order Details FULL API Response:', body);
          } catch (e) {
            console.log('Order details JSON parse error:', text);
          }
        } catch (e) {
          console.log('Order details JSON fetch error:', e);
        }

        let rawOrderData =
          result?.data_order ||
          result?.data?.order ||
          result?.data ||
          result?.order ||
          result?.order_details ||
          (result?.id || result?.order_id || result?.order_number ? result : null);

        // 2. Fallback Attempt: FormData POST if JSON failed
        if (!rawOrderData || typeof rawOrderData !== 'object') {
          try {
            const formData = new FormData();
            if (parsedOrderId) formData.append('order_id', String(parsedOrderId));
            if (parsedId) formData.append('id', String(parsedId));
            if (targetOrderNumber) formData.append('order_number', String(targetOrderNumber));
            if (userId) formData.append('user_id', String(userId));

            const response = await fetch(`${BASE_URL}order-details`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
              },
              body: formData,
            });

            const text = await response.text();
            try {
              const formResult = JSON.parse(text);
              rawOrderData =
                formResult?.data_order ||
                formResult?.data?.order ||
                formResult?.data ||
                formResult?.order ||
                formResult?.order_details ||
                (formResult?.id || formResult?.order_id ? formResult : null);

              if (formResult?.message && !rawOrderData) {
                result = formResult;
              }
            } catch (e) {
              console.log('Order details FormData parse error:', text);
            }
          } catch (e) {
            console.log('Order details FormData fetch error:', e);
          }
        }

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

          setOrder((prev) => {
            const updated = {
              ...(prev || {}),
              ...rawOrderData,
              items: extractedItems.length > 0 ? extractedItems : prev?.items || rawOrderData.items,
              address_user: typeof rawUser === 'object' && rawUser !== null ? rawUser : prev?.address_user || null,
              data_user: typeof rawUser === 'object' && rawUser !== null ? rawUser : prev?.data_user || null,
              user: typeof rawUser === 'object' && rawUser !== null ? rawUser : prev?.user || null,
            };
            orderRef.current = updated; // sync ref so callback reads latest without re-triggering
            return updated;
          });
        } else {
          if (!orderRef.current) {
            setError(result?.message || 'Failed to retrieve order details.');
          }
        }
      } catch (err) {
        console.log('OrderDetails fetch error:', err);
        if (!orderRef.current) {
          setError('Network error. Please check your internet connection.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [targetOrderId, targetId, targetOrderNumber] // ✅ `order` removed — was causing infinite re-fetch loop
  );

  useEffect(() => {
    fetchOrderDetails();
  }, []); // ✅ only runs once on mount

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
    const s = String(status || '').toLowerCase().trim();
    if (
      s.includes('delivered') ||
      s.includes('completed') ||
      s.includes('done')
    ) {
      return {
        bg: isDarkMode ? 'rgba(16, 185, 129, 0.18)' : '#DCFCE7',
        color: isDarkMode ? '#34D399' : '#15803D',
        borderColor: isDarkMode ? 'rgba(52, 211, 153, 0.3)' : '#BBF7D0',
        label: status || 'Delivered',
        icon: 'checkmark-circle',
        subtitle: 'Your order has been delivered successfully.',
        stepIndex: 3,
      };
    }
    if (s.includes('cancel') || s.includes('fail') || s.includes('reject') || s.includes('return')) {
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
    if (s.includes('ship') || s.includes('transit') || s.includes('out') || s.includes('dispatch')) {
      return {
        bg: isDarkMode ? 'rgba(59, 130, 246, 0.18)' : '#DBEAFE',
        color: isDarkMode ? '#60A5FA' : '#1D4ED8',
        borderColor: isDarkMode ? 'rgba(96, 165, 250, 0.3)' : '#BFDBFE',
        label: status || 'Out for Delivery',
        icon: 'car-outline',
        subtitle: 'Your package is on its way to you.',
        stepIndex: 2,
      };
    }
    return {
      bg: isDarkMode ? 'rgba(247, 22, 112, 0.15)' : AllColors.softPinkBg,
      color: AllColors.primary,
      borderColor: isDarkMode ? 'rgba(247, 22, 112, 0.3)' : '#FCE7F3',
      label: status === 'Success' || status === 'success' ? 'Order Placed' : (status || 'Processing'),
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

  // Check if order has any meaningful data to display
  const hasMeaningfulData = Boolean(
    order && (
      order.name || order.order_number || order.order_id ||
      order.id || order.img || order.image ||
      (Array.isArray(order.items) && order.items.length > 0)
    )
  );

  // Loading State
  if (loading && !refreshing && !hasMeaningfulData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar
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
            onPress={handleBack}
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
  if (error && !hasMeaningfulData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar
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
            onPress={handleBack}
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
                onPress={handleBack}
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
    currentOrder.order_number ||
    currentOrder.order_id_generate ||
    currentOrder.order_id ||
    currentOrder.id ||
    targetOrderId ||
    '---';

  const orderStatus =
    currentOrder.order_status ||
    currentOrder.status ||
    currentOrder.delivery_status ||
    currentOrder.type ||
    'Pending';

  const statusConfig = getStatusConfig(orderStatus);
  const dateText = formatDate(
    currentOrder.order_date ||
    currentOrder.created_at ||
    currentOrder.created_date ||
    currentOrder.date
  );

  const discountAmount = Number(
    currentOrder.extra_discount ??
    currentOrder.discount ??
    currentOrder.coupon_discount ??
    currentOrder.discount_amount ??
    0
  );
  const deliveryCharge = Number(
    currentOrder.shipping_fee ??
    currentOrder.shipping_charge ??
    currentOrder.delivery_charge ??
    currentOrder.shipping_cost ??
    0
  );
  const subTotal = Number(
    currentOrder.selling_price ??
    currentOrder.amount ??
    currentOrder.total_amount ??
    currentOrder.subtotal ??
    currentOrder.sub_total ??
    0
  );
  const netTotal = Number(
    currentOrder.total_amount ??
    currentOrder.net_amount ??
    currentOrder.grand_total ??
    currentOrder.selling_price ??
    currentOrder.amount ??
    0
  );

  // Address parsing
  const addressObj =
    (typeof currentOrder.address_user === 'object' && currentOrder.address_user !== null ? currentOrder.address_user : null) ||
    (typeof currentOrder.data_user === 'object' && currentOrder.data_user !== null ? currentOrder.data_user : null) ||
    (typeof currentOrder.shipping_address === 'object' && currentOrder.shipping_address !== null ? currentOrder.shipping_address : null) ||
    (typeof currentOrder.delivery_address === 'object' && currentOrder.delivery_address !== null ? currentOrder.delivery_address : null) ||
    (typeof currentOrder.user_address === 'object' && currentOrder.user_address !== null ? currentOrder.user_address : null) ||
    (typeof currentOrder.user === 'object' && currentOrder.user !== null ? currentOrder.user : null) ||
    (typeof currentOrder.address === 'object' && currentOrder.address !== null ? currentOrder.address : null);

  const customerName =
    addressObj?.name ||
    addressObj?.user_name ||
    currentOrder.name ||
    currentOrder.user_name ||
    currentOrder.shipping_name ||
    currentOrder.customer_name ||
    'Customer';

  const mobileNumber =
    addressObj?.mobile ||
    addressObj?.phone ||
    addressObj?.mobile_no ||
    addressObj?.phone_number ||
    currentOrder.mobile ||
    currentOrder.phone ||
    currentOrder.user_phone ||
    currentOrder.contact ||
    '';

  const addressString = addressObj
    ? (
      addressObj.address && typeof addressObj.address === 'string' && addressObj.address.trim().length > 0
        ? addressObj.address
        : [
          addressObj.house_no || addressObj.flat_no || addressObj.building,
          addressObj.road_name || addressObj.street || addressObj.area || addressObj.address_line_1,
          addressObj.landmark ? `Near ${addressObj.landmark}` : null,
          addressObj.city,
          addressObj.state
            ? `${addressObj.state}${addressObj.pin || addressObj.pincode || addressObj.zip_code ? ` - ${addressObj.pin || addressObj.pincode || addressObj.zip_code}` : ''}`
            : addressObj.pin || addressObj.pincode || addressObj.zip_code,
        ]
          .filter(Boolean)
          .join(', ')
    )
    : typeof currentOrder.address === 'string' &&
      currentOrder.address.trim().length > 0
      ? currentOrder.address
      : currentOrder.delivery_address ||
      currentOrder.shipping_address ||
      'Address not available';

  const addressType =
    addressObj?.address_type || currentOrder.address_type || '';

  // Items parsing
  const rawItems =
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

  const itemsList =
    rawItems.length > 0
      ? rawItems
      : currentOrder.name || currentOrder.img || currentOrder.image || currentOrder.product_name
        ? [currentOrder]
        : [];

  const paymentMethodText =
    currentOrder.payment_method ||
    currentOrder.payment_type ||
    currentOrder.payment_mode ||
    (params.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Online / Prepaid');

  const steps = [
    { title: 'Order Placed', icon: 'bag-check-outline' },
    { title: 'Processing', icon: 'sync-outline' },
    { title: 'Out for Delivery', icon: 'car-outline' },
    { title: 'Delivered', icon: 'checkmark-done-outline' },
  ];

  const sellerPolicy =
    currentOrder.seller_policy ||
    currentOrder.return_policy ||
    currentOrder.policy ||
    (itemsList && itemsList[0] ? (itemsList[0].seller_policy || itemsList[0].return_policy || itemsList[0].policy) : null) ||
    null;

  const dynamicReturnDays =
    sellerPolicy?.return_days !== undefined && sellerPolicy?.return_days !== null
      ? Number(sellerPolicy.return_days)
      : currentOrder.return_days !== undefined && currentOrder.return_days !== null
        ? Number(currentOrder.return_days)
        : (itemsList && itemsList[0] && itemsList[0].return_days !== undefined && itemsList[0].return_days !== null
          ? Number(itemsList[0].return_days)
          : null);

  const dynamicPolicyTitle =
    sellerPolicy?.title ||
    sellerPolicy?.name ||
    currentOrder.return_policy_title ||
    (dynamicReturnDays !== null
      ? dynamicReturnDays > 0
        ? `${dynamicReturnDays} Days Return`
        : 'Non-Returnable'
      : 'Return Policy');

  const dynamicPolicyDesc =
    sellerPolicy?.description ||
    sellerPolicy?.details ||
    sellerPolicy?.policy ||
    currentOrder.return_policy_description ||
    currentOrder.return_terms ||
    (dynamicReturnDays !== null && dynamicReturnDays > 0
      ? `Eligible for return within ${dynamicReturnDays} days of delivery as per seller terms.`
      : dynamicReturnDays === 0
        ? 'This product is non-returnable as per seller policy.'
        : 'Return terms and guidelines are governed by seller policy.');

  const returnReasonsList = [
    'Damaged / Defective Product',
    'Item Different from Description / Wrong Product Received',
    'Size / Fit Issue',
    'Quality / Performance Not as Expected',
    'Missing Accessories / Parts',
    'Product Arrived Too Late',
    'Other / Mind Changed',
  ];

  const handleInitiateReturn = async () => {
    if (!selectedReturnReason) {
      Alert.alert('Selection Required', 'Please select a reason for returning this item.');
      return;
    }
    setSubmittingReturn(true);
    try {
      const token = await getToken();
      const userId = await getuserId();
      const response = await fetch(`${BASE_URL}return-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          order_id: displayOrderId,
          user_id: userId,
          reason: selectedReturnReason,
          comment: returnComment,
        }),
      });
      await response.json().catch(() => null);
    } catch (e) {
      console.log('Return submission error:', e);
    } finally {
      setSubmittingReturn(false);
      setShowReturnModal(false);
      Alert.alert(
        'Return Request Submitted',
        `Your return request for Order #${displayOrderId} has been logged. Our customer executive will review and process your request within 24-48 hours.`,
        [
          { text: 'OK' },
          {
            text: 'Need Support?',
            onPress: () => {
              Linking.openURL(
                `https://wa.me/919876543210?text=${encodeURIComponent(
                  `Hi DeeBazar, I submitted a Return Request for Order #${displayOrderId}. Reason: ${selectedReturnReason}`
                )}`
              ).catch(() => { });
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
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
          onPress={handleBack}
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
          <View style={styles.cardHeaderRow}>
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
            {addressType ? (
              <View
                style={[
                  styles.miniStatusBadge,
                  {
                    backgroundColor: isDarkMode
                      ? 'rgba(247, 22, 112, 0.15)'
                      : AllColors.softPinkBg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.miniStatusText,
                    { color: AllColors.primary },
                  ]}
                >
                  {addressType}
                </Text>
              </View>
            ) : null}
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
                prod.product_price ||
                prod.product?.selling_price ||
                prod.product?.price ||
                prod.product?.unit_price ||
                0
              );
              const calculatedQty = Number(
                prod.qty ||
                prod.quantity ||
                prod.count ||
                prod.product_qty ||
                (itemPrice > 0 && prod.total_amount ? Math.round(Number(prod.total_amount) / itemPrice) : 1)
              );
              const itemTotal = Number(
                prod.total_amount ||
                prod.total ||
                prod.subtotal ||
                prod.amount ||
                (itemPrice * (calculatedQty || 1)) ||
                0
              );
              const displayPrice =
                itemPrice > 0
                  ? itemPrice
                  : itemTotal > 0 && calculatedQty > 0
                    ? Math.round(itemTotal / calculatedQty)
                    : itemTotal > 0
                      ? itemTotal
                      : 0;

              const itemImage =
                prod.img ||
                prod.image ||
                prod.product_image ||
                prod.thumbnail ||
                prod.photo ||
                prod.image_url ||
                prod.img_url ||
                prod.product?.img ||
                prod.product?.image ||
                prod.product?.product_image ||
                prod.product?.thumbnail ||
                prod.product?.image_url ||
                null;

              const itemName =
                prod.name ||
                prod.product_name ||
                prod.title ||
                prod.product_title ||
                prod.product?.name ||
                prod.product?.product_name ||
                prod.product?.title ||
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

        {/* Return & Refund Policy Card */}
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
              <Ionicons
                name="refresh-circle-outline"
                size={22}
                color={AllColors.primary}
              />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.textPrimary, marginLeft: 8 },
                ]}
              >
                Return & Refund Policy
              </Text>
            </View>
            <View
              style={[
                styles.miniStatusBadge,
                {
                  backgroundColor:
                    dynamicReturnDays === 0
                      ? (isDarkMode ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2')
                      : (isDarkMode ? 'rgba(16, 185, 129, 0.18)' : '#DCFCE7'),
                },
              ]}
            >
              <Text
                style={[
                  styles.miniStatusText,
                  {
                    color:
                      dynamicReturnDays === 0
                        ? (isDarkMode ? '#F87171' : '#B91C1C')
                        : (isDarkMode ? '#34D399' : '#15803D'),
                  },
                ]}
              >
                {dynamicPolicyTitle}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <Text style={[styles.policySummaryText, { color: theme.textSecondary }]}>
            {dynamicPolicyDesc}
          </Text>

          {/* Highlights & Buttons — hidden when No Return */}
          {dynamicReturnDays !== 0 && (
            <>
              <View style={styles.policyHighlightsRow}>
                <View style={[styles.policyHighlightChip, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={[styles.policyHighlightText, { color: theme.textPrimary }]}>Doorstep Pickup</Text>
                </View>
                <View style={[styles.policyHighlightChip, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={[styles.policyHighlightText, { color: theme.textPrimary }]}>3-5 Days Refund</Text>
                </View>
                <View style={[styles.policyHighlightChip, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={[styles.policyHighlightText, { color: theme.textPrimary }]}>100% Quality Guarantee</Text>
                </View>
              </View>

              <View style={styles.policyButtonsRow}>
                <TouchableOpacity
                  style={[styles.policyGuidelineBtn, { borderColor: AllColors.primary, backgroundColor: isDarkMode ? '#1E293B' : AllColors.softPinkBg }]}
                  onPress={() => setShowReturnGuidelinesModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="document-text-outline" size={16} color={AllColors.primary} />
                  <Text style={[styles.policyGuidelineBtnText, { color: AllColors.primary }]}>View Guidelines</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.policyRequestBtn, { backgroundColor: AllColors.primary }]}
                  onPress={() => setShowReturnModal(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="return-down-back-outline" size={16} color={AllColors.white} />
                  <Text style={styles.policyRequestBtnText}>Request Return</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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

      {/* Return Guidelines Modal */}
      <Modal
        visible={showReturnGuidelinesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReturnGuidelinesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleBox}>
                <Ionicons name="shield-checkmark" size={24} color={AllColors.primary} />
                <Text style={[styles.modalTitleText, { color: theme.textPrimary }]}>Return & Refund Policy</Text>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
                onPress={() => setShowReturnGuidelinesModal(false)}
              >
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.divider }]} />

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.guidelineSectionHeader, { color: AllColors.primary }]}>1. Return Eligibility Window</Text>
              <Text style={[styles.guidelineBodyText, { color: theme.textSecondary }]}>
                {dynamicReturnDays !== null && dynamicReturnDays > 0
                  ? `Items can be returned within ${dynamicReturnDays} days of delivery if damaged, defective, or different from order.`
                  : dynamicReturnDays === 0
                    ? 'This item is non-returnable as specified by seller terms.'
                    : 'Items can be returned within the designated seller return window after delivery.'}
              </Text>

              <Text style={[styles.guidelineSectionHeader, { color: AllColors.primary }]}>2. Return Conditions</Text>
              <Text style={[styles.guidelineBodyText, { color: theme.textSecondary }]}>
                • Items must be unused, unwashed, and in original packaging with intact tags and seal.{"\n"}
                • Freebies and combo components must be returned along with the main product.{"\n"}
                • Serial numbers and barcodes must match our fulfillment records.
              </Text>

              <Text style={[styles.guidelineSectionHeader, { color: AllColors.primary }]}>3. Pickup & Refund Steps</Text>
              <Text style={[styles.guidelineBodyText, { color: theme.textSecondary }]}>
                • Our courier partner will pick up the item from your delivery address within 2-3 business days.{"\n"}
                • Upon warehouse inspection, the refund will be credited back to your original payment method (or UPI/Bank) within 3-5 working days.
              </Text>

              <Text style={[styles.guidelineSectionHeader, { color: AllColors.primary }]}>4. Non-Returnable Items</Text>
              <Text style={[styles.guidelineBodyText, { color: theme.textSecondary }]}>
                Innerwear, personal hygiene products, perishable items, and products marked as "Non-Returnable" on the item page cannot be returned once delivered.
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalPrimaryActionBtn, { backgroundColor: AllColors.primary }]}
              onPress={() => {
                setShowReturnGuidelinesModal(false);
                setShowReturnModal(true);
              }}
            >
              <Text style={styles.modalPrimaryActionText}>Proceed to Request Return</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Request Return Modal */}
      <Modal
        visible={showReturnModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReturnModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleBox}>
                <Ionicons name="return-down-back-circle" size={24} color={AllColors.primary} />
                <Text style={[styles.modalTitleText, { color: theme.textPrimary }]}>Request Return / Refund</Text>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
                onPress={() => setShowReturnModal(false)}
              >
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubTitle, { color: theme.textSecondary }]}>
              Order ID: <Text style={{ fontWeight: '700', color: AllColors.primary }}>#{displayOrderId}</Text>
            </Text>

            <View style={[styles.divider, { backgroundColor: theme.divider }]} />

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Select Reason for Return *</Text>
              {returnReasonsList.map((reason, idx) => {
                const isSelected = selectedReturnReason === reason;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.reasonOptionItem,
                      {
                        backgroundColor: isSelected
                          ? (isDarkMode ? 'rgba(247, 22, 112, 0.15)' : AllColors.softPinkBg)
                          : (isDarkMode ? '#334155' : '#F8FAFC'),
                        borderColor: isSelected ? AllColors.primary : theme.borderColor,
                      },
                    ]}
                    onPress={() => setSelectedReturnReason(reason)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isSelected ? AllColors.primary : theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.reasonOptionText,
                        {
                          color: isSelected ? AllColors.primary : theme.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <Text style={[styles.inputLabel, { color: theme.textPrimary, marginTop: 14 }]}>
                Additional Comments / Item Details (Optional)
              </Text>
              <TextInput
                style={[
                  styles.commentInput,
                  {
                    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                    color: theme.textPrimary,
                    borderColor: theme.borderColor,
                  },
                ]}
                placeholder="Describe the issue in detail..."
                placeholderTextColor={isDarkMode ? '#94A3B8' : '#94A3B8'}
                multiline={true}
                numberOfLines={3}
                value={returnComment}
                onChangeText={setReturnComment}
              />
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.modalPrimaryActionBtn,
                { backgroundColor: AllColors.primary, opacity: submittingReturn ? 0.7 : 1 },
              ]}
              disabled={submittingReturn}
              onPress={handleInitiateReturn}
            >
              {submittingReturn ? (
                <ActivityIndicator size="small" color={AllColors.white} />
              ) : (
                <Text style={styles.modalPrimaryActionText}>Submit Return Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  // Return Policy Card & Modals Styles
  policySummaryText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  policyHighlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  policyHighlightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  policyHighlightText: {
    fontSize: 12,
    fontWeight: '600',
  },
  policyButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  policyGuidelineBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  policyGuidelineBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  policyRequestBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    elevation: 1,
  },
  policyRequestBtnText: {
    color: AllColors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContentCard: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    elevation: 5,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubTitle: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 4,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guidelineSectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  guidelineBodyText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 6,
  },
  modalPrimaryActionBtn: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    elevation: 2,
  },
  modalPrimaryActionText: {
    color: AllColors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  reasonOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  reasonOptionText: {
    fontSize: 13,
    flex: 1,
  },
  commentInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 13,
    minHeight: 75,
  },
});