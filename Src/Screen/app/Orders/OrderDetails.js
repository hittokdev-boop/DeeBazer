import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
  PermissionsAndroid,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation, useRoute } from '@react-navigation/native';
import AllColors from '../../../Constants/Color';
import { STATUSBAR_HEIGHT } from '../../../Constants/ScreenUtils';
import { useTheme } from '../../../Context/ThemeContext';
import { getOrderDetailsApi, getOrderListApi, returnOrderApi, getToken, getuserId } from '../../../Api/Api';
import ProductReviewModal, {
  getStoredReviews,
  getRatingColor,
  getRatingColorConfig,
} from './ProductReviewModal';
import {
  isValidCoordinate,
  calculateDistanceKm,
  formatDistance,
  darkMapStyle,
  getCoordinatesFromAddress,
} from '../../../Common/geocodeUtils';

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
      initialOrder.product_name ||
      initialOrder.img ||
      initialOrder.image)
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

  // Review & Rating State
  const [storedReviews, setStoredReviews] = useState({});
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedReviewProduct, setSelectedReviewProduct] = useState(null);
  const [selectedExistingReview, setSelectedExistingReview] = useState(null);
  const [selectedInitialRating, setSelectedInitialRating] = useState(0);

  // Map, Live Location & Navigation State
  const [userLocation, setUserLocation] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [geocodedCoord, setGeocodedCoord] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    getStoredReviews().then((revs) => {
      if (revs && typeof revs === 'object') {
        setStoredReviews(revs);
      }
    });
  }, []);

  const handleOpenReviewModal = (prod, existing, initialStar = 0) => {
    setSelectedReviewProduct(prod);
    setSelectedExistingReview(existing);
    setSelectedInitialRating(existing?.rating ? Number(existing.rating) : (initialStar || 0));
    setReviewModalVisible(true);
  };

  const handleReviewSubmitted = (newReview) => {
    const pId = newReview.product_id;
    const oId = newReview.order_id;
    const key = `${oId}_${pId}`;
    setStoredReviews((prev) => ({
      ...prev,
      [key]: newReview,
    }));
  };

  const fetchUserLiveLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        const isGranted =
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

        if (!isGranted) {
          setLocationLoading(false);
          return;
        }
      }

      Geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos?.coords?.latitude;
          const lng = pos?.coords?.longitude;
          if (isValidCoordinate(lat, lng)) {
            setUserLocation({ latitude: lat, longitude: lng });
          }
          setLocationLoading(false);
        },
        () => {
          Geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos?.coords?.latitude;
              const lng = pos?.coords?.longitude;
              if (isValidCoordinate(lat, lng)) {
                setUserLocation({ latitude: lat, longitude: lng });
              }
              setLocationLoading(false);
            },
            () => {
              setLocationLoading(false);
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 10000 }
          );
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } catch {
      setLocationLoading(false);
    }
  }, []);

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

  const extractOrdersArray = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.orders)) return res.orders;
    if (Array.isArray(res?.data?.orders)) return res.data.orders;
    if (Array.isArray(res?.order_list)) return res.order_list;
    if (res?.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
      const values = Object.values(res.data).filter(
        (item) => item && typeof item === 'object' && (item.id || item.order_id || item.order_id_generate)
      );
      if (values.length > 0) return values;
    }
    return [];
  };

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

        const orderNumParam = targetOrderNumber || (isNaN(targetOrderId) ? targetOrderId : null);

        let result = await getOrderDetailsApi({
          order_id: parsedOrderId || parsedId,
          id: parsedId,
          order_number: orderNumParam,
          user_id: userId,
        });

        let rawOrderData =
          result?.data_order ||
          result?.data?.order ||
          result?.data ||
          result?.order ||
          result?.order_details ||
          (result?.id || result?.order_id || result?.order_number ? result : null);

        let rawUserData = result?.data_user || null;

        // Fallback: If no full order or no address found (e.g. targetOrderId was order_number not DB id), lookup real DB id via getOrderListApi
        if (!rawOrderData || !rawUserData || !rawOrderData.name) {
          try {
            const listRes = await getOrderListApi(userId);
            const ordersList = extractOrdersArray(listRes);
            const sTargetId = String(targetOrderId || targetId || '').trim();
            const sTargetNum = String(targetOrderNumber || '').trim();

            let foundOrder = ordersList.find((o) => {
              const oId = String(o?.order_id || o?.id || '').trim();
              const oNum = String(o?.order_number || o?.order_id_generate || '').trim();
              return (
                (sTargetId && (oId === sTargetId || oNum === sTargetId)) ||
                (sTargetNum && (oId === sTargetNum || oNum === sTargetNum))
              );
            });

            // If not found by exact ID and we came right after creating an order, newest order is ordersList[0]
            if (!foundOrder && ordersList.length > 0 && params.order) {
              foundOrder = ordersList[0];
            }

            if (foundOrder && typeof foundOrder === 'object') {
              const realDbId = foundOrder.order_id || foundOrder.id;
              if (realDbId) {
                try {
                  const detailedRes = await getOrderDetailsApi({
                    order_id: realDbId,
                    id: realDbId,
                    user_id: userId,
                  });
                  if (detailedRes?.data_order || detailedRes?.data || detailedRes?.data_user) {
                    result = detailedRes;
                    rawOrderData = detailedRes.data_order || detailedRes.data?.order || detailedRes.data || rawOrderData;
                    rawUserData = detailedRes.data_user || rawUserData;
                  }
                } catch (retryErr) {
                  console.log('Retry getOrderDetailsApi with realDbId error:', retryErr);
                }
              }

              if (!rawOrderData) {
                rawOrderData = foundOrder;
              }
            }
          } catch (listErr) {
            console.log('OrderDetails fallback getOrderListApi error:', listErr);
          }
        }

        let extractedItems = [];
        if (rawOrderData && typeof rawOrderData === 'object') {
          extractedItems =
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
        }

        if (rawOrderData && typeof rawOrderData === 'object') {
          const rawUser =
            rawUserData ||
            result?.data_user ||
            rawOrderData?.data_user ||
            rawOrderData?.address_user ||
            rawOrderData?.shipping_address ||
            rawOrderData?.delivery_address ||
            rawOrderData?.user_address ||
            result?.user ||
            (typeof rawOrderData?.address === 'object' ? rawOrderData.address : null);

          setOrder((prev) => {
            const finalItems =
              extractedItems.length > 0
                ? extractedItems
                : (Array.isArray(prev?.items) && prev.items.length > 0
                  ? prev.items
                  : (rawOrderData?.name ? [rawOrderData] : []));

            const finalAddress =
              (typeof rawUser === 'object' && rawUser !== null && Object.keys(rawUser).length > 0)
                ? rawUser
                : (prev?.data_user || prev?.address_user || prev?.delivery_address || prev?.shipping_address || prev?.user || null);

            const updated = {
              ...(prev || {}),
              ...rawOrderData,
              items: finalItems,
              data_user: finalAddress,
              address_user: finalAddress,
              shipping_address: finalAddress,
              delivery_address: finalAddress,
              user: finalAddress,
              ismapShow: rawOrderData?.ismapShow ?? result?.data_order?.ismapShow ?? prev?.ismapShow ?? false,
              status: rawOrderData?.status || prev?.status || 'pending',
              order_status: rawOrderData?.status || rawOrderData?.order_status || prev?.order_status || 'pending',
              delivery_status: rawOrderData?.status || rawOrderData?.delivery_status || prev?.delivery_status || 'pending',
              order_date: rawOrderData?.order_date || rawOrderData?.created_at || prev?.order_date || new Date().toISOString(),
              selling_price: rawOrderData?.selling_price ?? rawOrderData?.amount ?? rawOrderData?.total_amount ?? prev?.selling_price ?? prev?.subtotal ?? 0,
              subtotal: rawOrderData?.subtotal ?? rawOrderData?.sub_total ?? rawOrderData?.taxable_amount ?? rawOrderData?.selling_price ?? prev?.subtotal ?? prev?.selling_price ?? 0,
              taxable_amount: rawOrderData?.taxable_amount ?? rawOrderData?.selling_price ?? prev?.taxable_amount ?? 0,
              total_line_gst_amount: rawOrderData?.total_line_gst_amount ?? rawOrderData?.gst_amount ?? rawOrderData?.total_gst ?? rawOrderData?.gst ?? prev?.total_line_gst_amount ?? 0,
              line_total: rawOrderData?.line_total ?? rawOrderData?.payable_amount ?? rawOrderData?.total_amount ?? prev?.line_total ?? 0,
              total_amount: rawOrderData?.line_total ?? rawOrderData?.payable_amount ?? rawOrderData?.total_amount ?? prev?.total_amount ?? prev?.net_amount ?? 0,
              net_amount: rawOrderData?.line_total ?? rawOrderData?.payable_amount ?? rawOrderData?.net_amount ?? prev?.net_amount ?? prev?.total_amount ?? 0,
              shipping_fee: rawOrderData?.shipping_fee ?? rawOrderData?.shipping_charge ?? rawOrderData?.delivery_charge ?? prev?.shipping_fee ?? prev?.delivery_charge ?? 0,
              delivery_charge: rawOrderData?.delivery_charge ?? rawOrderData?.shipping_fee ?? prev?.delivery_charge ?? prev?.shipping_fee ?? 0,
              extra_discount: rawOrderData?.extra_discount ?? rawOrderData?.coupon_discount ?? rawOrderData?.discount ?? prev?.extra_discount ?? prev?.coupon_discount ?? 0,
              payment_method: rawOrderData?.payment_method || rawOrderData?.payment_mode || prev?.payment_method || prev?.payment_mode || 'Cash on Delivery (COD)',
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
    [targetOrderId, targetId, targetOrderNumber]
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
      (Array.isArray(order.items) && order.items.length > 0) ||
      (Array.isArray(order.products) && order.products.length > 0) ||
      (Array.isArray(order.order_items) && order.order_items.length > 0) ||
      order.name ||
      order.product_name ||
      order.img ||
      order.image
    )
  );

  // Loading State
  if (loading && !refreshing && !hasMeaningfulData) {
    return (
      <SafeAreaView edges={[]} style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar
          backgroundColor="transparent"
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          translucent={true}
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
      <SafeAreaView edges={[]} style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar
          backgroundColor="transparent"
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          translucent={true}
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
  const sLower = String(orderStatus || '').toLowerCase().trim();
  const isDelivered =
    sLower.includes('delivered') ||
    sLower.includes('completed') ||
    sLower.includes('done') ||
    sLower.includes('success');
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
    currentOrder.taxable_amount ??
    currentOrder.selling_price ??
    currentOrder.subtotal ??
    currentOrder.sub_total ??
    currentOrder.amount ??
    0
  );
  const totalGst = Number(
    currentOrder.total_line_gst_amount ??
    currentOrder.gst_amount ??
    currentOrder.total_gst ??
    currentOrder.gst ??
    0
  );
  const netTotal = Number(
    currentOrder.line_total ??
    currentOrder.payable_amount ??
    currentOrder.net_amount ??
    currentOrder.total_amount ??
    currentOrder.grand_total ??
    (subTotal + totalGst + deliveryCharge - discountAmount) ??
    0
  );

  // Address parsing
  const addressObj =
    (typeof currentOrder.data_user === 'object' && currentOrder.data_user !== null && Object.keys(currentOrder.data_user).length > 0 ? currentOrder.data_user : null) ||
    (typeof currentOrder.address_user === 'object' && currentOrder.address_user !== null && Object.keys(currentOrder.address_user).length > 0 ? currentOrder.address_user : null) ||
    (typeof currentOrder.shipping_address === 'object' && currentOrder.shipping_address !== null && Object.keys(currentOrder.shipping_address).length > 0 ? currentOrder.shipping_address : null) ||
    (typeof currentOrder.delivery_address === 'object' && currentOrder.delivery_address !== null && Object.keys(currentOrder.delivery_address).length > 0 ? currentOrder.delivery_address : null) ||
    (typeof currentOrder.user_address === 'object' && currentOrder.user_address !== null && Object.keys(currentOrder.user_address).length > 0 ? currentOrder.user_address : null) ||
    (typeof currentOrder.address === 'object' && currentOrder.address !== null && Object.keys(currentOrder.address).length > 0 ? currentOrder.address : null) ||
    (typeof currentOrder.user === 'object' && currentOrder.user !== null && (currentOrder.user.house_no || currentOrder.user.road_name || currentOrder.user.pin) ? currentOrder.user : null);

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
      (addressObj.house_no || addressObj.road_name || addressObj.city || addressObj.pin || addressObj.pincode)
        ? [
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
        : (typeof addressObj.address === 'string' && addressObj.address.trim().length > 0
          ? addressObj.address
          : '')
    )
    : typeof currentOrder.address === 'string' &&
      currentOrder.address.trim().length > 0
      ? currentOrder.address
      : currentOrder.delivery_address ||
      currentOrder.shipping_address ||
      'Address not available';

  const addressType =
    addressObj?.address_type || addressObj?.type || currentOrder.address_type || currentOrder.selected_mode || currentOrder.delivery_mode || '';

  const isMapShow = Boolean(
    currentOrder.ismapShow === true ||
    currentOrder.ismapShow === 'true' ||
    currentOrder.ismapShow === 1 ||
    currentOrder.ismapShow === '1' ||
    currentOrder.data_order?.ismapShow === true ||
    currentOrder.data_order?.ismapShow === 'true' ||
    currentOrder.is_map_show === true ||
    currentOrder.is_map_show === 'true' ||
    order?.ismapShow === true ||
    order?.ismapShow === 'true'
  );

  const rawLat =
    addressObj?.latitude ??
    addressObj?.lat ??
    currentOrder.data_user?.latitude ??
    currentOrder.latitude ??
    currentOrder.lat ??
    geocodedCoord?.latitude;

  const rawLng =
    addressObj?.longitude ??
    addressObj?.lng ??
    addressObj?.long ??
    currentOrder.data_user?.longitude ??
    currentOrder.longitude ??
    currentOrder.lng ??
    currentOrder.long ??
    geocodedCoord?.longitude;

  const hasValidDestination = isValidCoordinate(rawLat, rawLng);
  const destLat = hasValidDestination ? Number(rawLat) : null;
  const destLng = hasValidDestination ? Number(rawLng) : null;

  useEffect(() => {
    if (isMapShow) {
      fetchUserLiveLocation();
    }
  }, [isMapShow, fetchUserLiveLocation]);

  useEffect(() => {
    if (isMapShow && !hasValidDestination) {
      const house = addressObj?.house_no || currentOrder.house_no || '';
      const road = addressObj?.road_name || currentOrder.road_name || '';
      const landmark = addressObj?.landmark || currentOrder.landmark || '';
      const city = addressObj?.city || currentOrder.city || '';
      const state = addressObj?.state || currentOrder.state || '';
      const pin = addressObj?.pin || addressObj?.pincode || currentOrder.pin || '';

      if (city || pin || road || house) {
        getCoordinatesFromAddress(house, road, landmark, city, state, pin).then((coord) => {
          if (coord && isValidCoordinate(coord.latitude, coord.longitude)) {
            setGeocodedCoord(coord);
          }
        });
      }
    }
  }, [isMapShow, hasValidDestination, addressObj, currentOrder]);

  useEffect(() => {
    if (userLocation && destLat !== null && destLng !== null) {
      const dist = calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        destLat,
        destLng
      );
      setDistanceKm(dist);
    }
  }, [userLocation, destLat, destLng]);

  const mapRegion = useMemo(() => {
    if (destLat !== null && destLng !== null && userLocation?.latitude && userLocation?.longitude) {
      const midLat = (destLat + userLocation.latitude) / 2;
      const midLng = (destLng + userLocation.longitude) / 2;
      const dLat = Math.abs(destLat - userLocation.latitude) * 1.6;
      const dLng = Math.abs(destLng - userLocation.longitude) * 1.6;
      return {
        latitude: midLat,
        longitude: midLng,
        latitudeDelta: Math.max(dLat, 0.02),
        longitudeDelta: Math.max(dLng, 0.02),
      };
    }
    if (destLat !== null && destLng !== null) {
      return {
        latitude: destLat,
        longitude: destLng,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
    }
    return undefined;
  }, [destLat, destLng, userLocation]);

  // Route coordinates connecting userLocation (Start Point) and destLat/destLng (End Point)
  useEffect(() => {
    let isCancelled = false;

    if (
      userLocation?.latitude &&
      userLocation?.longitude &&
      destLat !== null &&
      destLng !== null
    ) {
      // Immediate straight fallback route line
      const directLine = [
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: destLat, longitude: destLng },
      ];
      setRouteCoordinates(directLine);

      // Fetch actual road geometry from OSRM
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userLocation.longitude},${userLocation.latitude};${destLng},${destLat}?overview=full&geometries=geojson`;

      fetch(osrmUrl, {
        headers: {
          'User-Agent': 'DeeBazer-App/1.0',
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (isCancelled) return;
          if (data?.routes?.[0]?.geometry?.coordinates?.length) {
            const roadPoints = data.routes[0].geometry.coordinates.map((coord) => ({
              latitude: Number(coord[1]),
              longitude: Number(coord[0]),
            }));
            if (roadPoints.length > 0) {
              setRouteCoordinates(roadPoints);
            }
          }
        })
        .catch(() => {
          // Keep straight line fallback on error
        });
    } else {
      setRouteCoordinates([]);
    }

    return () => {
      isCancelled = true;
    };
  }, [userLocation?.latitude, userLocation?.longitude, destLat, destLng]);

  const fitMapToRoute = useCallback(() => {
    if (mapRef.current && destLat !== null && destLng !== null) {
      if (userLocation?.latitude && userLocation?.longitude) {
        mapRef.current.fitToCoordinates(
          [
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            { latitude: destLat, longitude: destLng },
          ],
          {
            edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
            animated: true,
          }
        );
      } else if (mapRegion) {
        mapRef.current.animateToRegion(mapRegion, 300);
      }
    }
  }, [destLat, destLng, userLocation, mapRegion]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fitMapToRoute();
    }, 250);
    return () => clearTimeout(timer);
  }, [fitMapToRoute, routeCoordinates.length]);

  const currentRegionRef = useRef(mapRegion);

  const handleRegionChangeComplete = useCallback((reg) => {
    if (reg && reg.latitude && reg.longitude) {
      currentRegionRef.current = reg;
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    if (mapRef.current) {
      const reg = currentRegionRef.current || mapRegion;
      if (reg) {
        const nextLatDelta = Math.max(reg.latitudeDelta / 2, 0.001);
        const nextLngDelta = Math.max(reg.longitudeDelta / 2, 0.001);
        const newRegion = {
          latitude: reg.latitude,
          longitude: reg.longitude,
          latitudeDelta: nextLatDelta,
          longitudeDelta: nextLngDelta,
        };
        currentRegionRef.current = newRegion;
        mapRef.current.animateToRegion(newRegion, 250);
      }
    }
  }, [mapRegion]);

  const handleZoomOut = useCallback(() => {
    if (mapRef.current) {
      const reg = currentRegionRef.current || mapRegion;
      if (reg) {
        const nextLatDelta = Math.min(reg.latitudeDelta * 2, 80);
        const nextLngDelta = Math.min(reg.longitudeDelta * 2, 80);
        const newRegion = {
          latitude: reg.latitude,
          longitude: reg.longitude,
          latitudeDelta: nextLatDelta,
          longitudeDelta: nextLngDelta,
        };
        currentRegionRef.current = newRegion;
        mapRef.current.animateToRegion(newRegion, 250);
      }
    }
  }, [mapRegion]);

  const handleOpenNavigation = () => {
    if (destLat === null || destLng === null) {
      Alert.alert('Location Error', 'Destination coordinates are not available for navigation.');
      return;
    }
    const label = encodeURIComponent(customerName || 'Delivery Location');
    const scheme = Platform.select({
      ios: `maps:0,0?q=${label}@${destLat},${destLng}`,
      android: `google.navigation:q=${destLat},${destLng}`,
    });
    const webFallback = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;

    Linking.canOpenURL(scheme)
      .then((supported) => {
        if (supported) {
          Linking.openURL(scheme);
        } else {
          Linking.openURL(webFallback);
        }
      })
      .catch(() => {
        Linking.openURL(webFallback);
      });
  };

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

  const rawPaymentMethod =
    currentOrder.payment_method ||
    currentOrder.payment_type ||
    currentOrder.payment_mode ||
    params.payment_method ||
    '';

  const paymentMethodText = (() => {
    const pm = String(rawPaymentMethod).toLowerCase();
    if (pm === 'cod' || pm.includes('cash on delivery')) return 'Cash on Delivery (COD)';
    if (pm === 'cashfree' || pm === 'online' || pm.includes('prepaid')) return 'Online Payment (Prepaid)';
    return rawPaymentMethod || 'Cash on Delivery (COD)';
  })();

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
      await returnOrderApi({
        order_id: displayOrderId,
        user_id: userId,
        reason: selectedReturnReason,
        comment: returnComment,
      });
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
    <SafeAreaView edges={[]} style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        backgroundColor="transparent"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        translucent={true}
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

        {/* Delivery / Pickup Location Map & Navigation (displayed when ismapShow is true) */}
        {isMapShow && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor,
                paddingBottom: 16,
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleWithIcon}>
                <Ionicons
                  name="navigate-circle-outline"
                  size={20}
                  color={AllColors.primary}
                />
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.textPrimary, marginLeft: 8 },
                  ]}
                >
                  Location Map & Navigation
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
                      { color: AllColors.primary, textTransform: 'capitalize' },
                    ]}
                  >
                    {addressType}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.divider }]} />

            {/* Map Container - Small Version, Clickable to Navigate */}
            {destLat !== null && destLng !== null ? (
              <View style={[styles.mapBoxContainer, { borderColor: theme.borderColor }]}>
                <MapView
                  ref={mapRef}
                  style={styles.mapElement}
                  initialRegion={mapRegion}
                  onMapReady={fitMapToRoute}
                  onRegionChangeComplete={handleRegionChangeComplete}
                  customMapStyle={isDarkMode ? darkMapStyle : undefined}
                  nestedScrollEnabled={true}
                  scrollEnabled={true}
                  zoomEnabled={true}
                  zoomControlEnabled={false}
                  pitchEnabled={true}
                  rotateEnabled={true}
                >
                  {/* Start Point: User Current Live Location */}
                  {userLocation?.latitude && userLocation?.longitude ? (
                    <Marker
                      coordinate={{
                        latitude: userLocation.latitude,
                        longitude: userLocation.longitude,
                      }}
                      title="Start Point (Your Location)"
                      pinColor="#0284C7"
                      onPress={handleOpenNavigation}
                    />
                  ) : null}

                  {/* Destination Route Polyline (Start Point to End Point) */}
                  {routeCoordinates.length > 0 ? (
                    <>
                      {/* Outline for clear contrast */}
                      <Polyline
                        coordinates={routeCoordinates}
                        strokeColor={isDarkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.9)'}
                        strokeWidth={6}
                        lineCap="round"
                        lineJoin="round"
                        tappable={true}
                        onPress={handleOpenNavigation}
                      />
                      {/* Main Destination Route Line */}
                      <Polyline
                        coordinates={routeCoordinates}
                        strokeColor={AllColors.primary || '#F71670'}
                        strokeWidth={3.8}
                        lineCap="round"
                        lineJoin="round"
                        tappable={true}
                        onPress={handleOpenNavigation}
                      />
                    </>
                  ) : null}

                  {/* End Point: Destination Order Location */}
                  <Marker
                    coordinate={{ latitude: destLat, longitude: destLng }}
                    title="End Point (Delivery Location)"
                    description={addressString}
                    pinColor={AllColors.primary}
                    onPress={handleOpenNavigation}
                  />
                </MapView>

                {/* Floating Navigation Hint Pill */}
                <TouchableOpacity
                  style={styles.tapToNavigatePill}
                  onPress={handleOpenNavigation}
                  activeOpacity={0.8}
                >
                  <Ionicons name="navigate" size={13} color="#FFF" />
                  <Text style={styles.tapToNavigateText}>Open Navigation</Text>
                </TouchableOpacity>

                {/* Floating Zoom & Re-center Controls on the Right */}
                <View style={styles.mapControlsColumn}>
                  <TouchableOpacity
                    style={[
                      styles.mapControlBtn,
                      {
                        backgroundColor: isDarkMode
                          ? 'rgba(30, 41, 59, 0.94)'
                          : 'rgba(255, 255, 255, 0.96)',
                        borderColor: theme.borderColor,
                      },
                    ]}
                    onPress={handleZoomIn}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={18} color={theme.textPrimary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.mapControlBtn,
                      {
                        backgroundColor: isDarkMode
                          ? 'rgba(30, 41, 59, 0.94)'
                          : 'rgba(255, 255, 255, 0.96)',
                        borderColor: theme.borderColor,
                      },
                    ]}
                    onPress={handleZoomOut}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={18} color={theme.textPrimary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.mapControlBtn,
                      {
                        backgroundColor: isDarkMode
                          ? 'rgba(30, 41, 59, 0.94)'
                          : 'rgba(255, 255, 255, 0.96)',
                        borderColor: theme.borderColor,
                      },
                    ]}
                    onPress={fitMapToRoute}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name="crosshairs-gps"
                      size={16}
                      color={AllColors.primary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Start & End Point Legend */}
                <View style={styles.mapPointsLegend} pointerEvents="none">
                  {userLocation?.latitude && userLocation?.longitude ? (
                    <View style={styles.pointChip}>
                      <View style={[styles.pointDot, { backgroundColor: '#0284C7' }]} />
                      <Text style={styles.pointText}>Start Point</Text>
                    </View>
                  ) : null}
                  <View style={styles.pointChip}>
                    <View style={[styles.pointDot, { backgroundColor: AllColors.primary }]} />
                    <Text style={styles.pointText}>End Point</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.mapPlaceholder,
                  {
                    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                    borderColor: theme.borderColor,
                  },
                ]}
              >
                <ActivityIndicator size="small" color={AllColors.primary} />
                <Text
                  style={[
                    styles.mapPlaceholderText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Loading location map...
                </Text>
              </View>
            )}

            {/* Distance Section */}
            <View style={styles.distanceBadgeRow}>
              <View
                style={[
                  styles.distanceBadge,
                  {
                    backgroundColor: isDarkMode
                      ? 'rgba(235, 19, 109, 0.12)'
                      : '#FFF0F5',
                    borderColor: AllColors.primary,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="map-marker-distance"
                  size={18}
                  color={AllColors.primary}
                />
                <Text
                  style={[
                    styles.distanceBadgeText,
                    { color: AllColors.primary },
                  ]}
                >
                  {distanceKm !== null
                    ? `Distance: ${formatDistance(distanceKm)}`
                    : locationLoading
                    ? 'Calculating distance...'
                    : 'Live distance calculating...'}
                </Text>
              </View>

              {/* Refresh Distance Button */}
              <TouchableOpacity
                style={[
                  styles.refreshLocBtn,
                  { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' },
                ]}
                onPress={fetchUserLiveLocation}
                disabled={locationLoading}
                activeOpacity={0.7}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color={AllColors.primary} />
                ) : (
                  <Ionicons
                    name="refresh"
                    size={16}
                    color={theme.textPrimary}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

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
                (itemPrice > 0 && prod.amount && Number(prod.amount) > itemPrice ? Math.round(Number(prod.amount) / itemPrice) : null) ||
                (itemPrice > 0 && prod.total_amount && Number(prod.total_amount) > itemPrice ? Math.round(Number(prod.total_amount) / itemPrice) : null) ||
                1
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

                    {/* Review Button for Delivered Item */}
                    {isDelivered && (
                      <View style={styles.itemReviewActionContainer}>
                        {(() => {
                          const prodId = prod.id || prod.product_id || prod.product?.id || 'general';
                          const key = `${displayOrderId}_${prodId}`;
                          const itemReview =
                            (storedReviews && storedReviews[key]) ||
                            (storedReviews &&
                              typeof storedReviews === 'object' &&
                              Object.values(storedReviews).find(
                                (r) =>
                                  r &&
                                  typeof r === 'object' &&
                                  r.order_id &&
                                  String(r.order_id) === String(displayOrderId) &&
                                  String(r.product_id) === String(prodId)
                              )) ||
                            null;
                          const isItemReviewed = Boolean(itemReview && itemReview.rating);
                          const rNum = isItemReviewed ? Number(itemReview.rating) : 0;
                          const ratingConfig = getRatingColorConfig(rNum, isDarkMode);

                          if (isItemReviewed) {
                            return (
                              <TouchableOpacity
                                style={[
                                  styles.itemReviewedBadge,
                                  {
                                    backgroundColor: ratingConfig.bg,
                                    borderColor: ratingConfig.borderColor,
                                  },
                                ]}
                                onPress={() => handleOpenReviewModal(prod, itemReview, rNum)}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="star" size={13} color={ratingConfig.starColor} />
                                <Text style={[styles.itemReviewedBadgeText, { color: ratingConfig.color }]}>
                                  Rated {rNum}★ • {ratingConfig.label} (Tap to edit)
                                </Text>
                              </TouchableOpacity>
                            );
                          }

                          return (
                            <View style={styles.itemRateQuickRow}>
                              <TouchableOpacity
                                style={[
                                  styles.itemRateBtn,
                                  {
                                    backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                                    borderColor: isDarkMode ? '#64748B' : '#000000',
                                  },
                                ]}
                                onPress={() => handleOpenReviewModal(prod, null, 0)}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="star-outline" size={13} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                                <Text style={[styles.itemRateBtnText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                                  Rate:
                                </Text>
                              </TouchableOpacity>
                              <View style={styles.itemStarsQuickBox}>
                                {[1, 2, 3, 4, 5].map((starNum) => (
                                  <TouchableOpacity
                                    key={starNum}
                                    onPress={() => handleOpenReviewModal(prod, null, starNum)}
                                    style={styles.itemMiniStarTouch}
                                    activeOpacity={0.7}
                                  >
                                    <Ionicons
                                      name="star-outline"
                                      size={18}
                                      color={isDarkMode ? '#FFFFFF' : '#000000'}
                                    />
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          );
                        })()}
                      </View>
                    )}
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

        {/* Delivered Order Review Card with Red, Orange, Green */}
        {isDelivered && (() => {
          const targetProd = (itemsList && itemsList[0]) || {
            id: currentOrder.product_id || currentOrder.id || 'order',
            name: currentOrder.name || currentOrder.product_name || `Order #${displayOrderId}`,
            img: currentOrder.img || currentOrder.image,
          };
          const pId = targetProd.id || targetProd.product_id || 'general';
          const key = `${displayOrderId}_${pId}`;
          const existingOrderReview =
            (storedReviews && storedReviews[key]) ||
            (storedReviews &&
              typeof storedReviews === 'object' &&
              Object.values(storedReviews).find(
                (r) =>
                  r &&
                  typeof r === 'object' &&
                  r.order_id &&
                  String(r.order_id) === String(displayOrderId)
              )) ||
            null;
          const isReviewed = Boolean(existingOrderReview && existingOrderReview.rating);
          const orderRatingNum = isReviewed ? Number(existingOrderReview.rating) : 0;
          const ratingConfig = getRatingColorConfig(orderRatingNum, isDarkMode);

          return (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.cardBg,
                  borderColor: isReviewed ? ratingConfig.borderColor : theme.borderColor,
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleWithIcon}>
                  <Ionicons
                    name={isReviewed ? 'star' : 'star-outline'}
                    size={20}
                    color={isReviewed ? ratingConfig.starColor : (isDarkMode ? '#FFFFFF' : '#000000')}
                  />
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.textPrimary, marginLeft: 8 },
                    ]}
                  >
                    Ratings & Reviews
                  </Text>
                </View>
                <View
                  style={[
                    styles.miniStatusBadge,
                    {
                      backgroundColor: isReviewed
                        ? ratingConfig.bg
                        : (isDarkMode ? '#1E293B' : '#FFFFFF'),
                      borderColor: isReviewed
                        ? ratingConfig.borderColor
                        : (isDarkMode ? '#64748B' : '#000000'),
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.miniStatusText,
                      {
                        color: isReviewed
                          ? ratingConfig.color
                          : (isDarkMode ? '#FFFFFF' : '#000000'),
                      },
                    ]}
                  >
                    {isReviewed ? `${existingOrderReview.rating}★ ${ratingConfig.label}` : 'Not Rated Yet'}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.divider }]} />

              {/* Interactive Rating Box: Black border & white when not reviewed; Red/Orange/Green when reviewed */}
              <View
                style={[
                  styles.interactiveRatingBox,
                  {
                    backgroundColor: isReviewed
                      ? ratingConfig.bg
                      : (isDarkMode ? '#1E293B' : '#FFFFFF'),
                    borderColor: isReviewed
                      ? ratingConfig.borderColor
                      : (isDarkMode ? '#64748B' : '#000000'),
                    borderWidth: 1.5,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.interactiveRatingTitle,
                    { color: isReviewed ? ratingConfig.color : (isDarkMode ? '#FFFFFF' : '#000000') },
                  ]}
                >
                  {isReviewed
                    ? `Your Rating: ${existingOrderReview.rating} Stars (${ratingConfig.label})`
                    : 'Rate your delivery experience (Tap a star):'}
                </Text>

                <View style={styles.interactiveStarsRow}>
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = isReviewed && starVal <= orderRatingNum;

                    return (
                      <TouchableOpacity
                        key={starVal}
                        onPress={() => handleOpenReviewModal(targetProd, existingOrderReview, starVal)}
                        style={styles.interactiveStarBtn}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={isFilled ? 'star' : 'star-outline'}
                          size={32}
                          color={
                            isReviewed
                              ? (isFilled ? ratingConfig.starColor : (isDarkMode ? '#475569' : '#CBD5E1'))
                              : (isDarkMode ? '#FFFFFF' : '#000000')
                          }
                        />
                        <Text
                          style={[
                            styles.interactiveStarLabel,
                            {
                              color: isReviewed
                                ? (isFilled ? ratingConfig.color : (isDarkMode ? '#64748B' : '#94A3B8'))
                                : (isDarkMode ? '#FFFFFF' : '#000000'),
                            },
                          ]}
                        >
                          {starVal}★
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Show legend with colors only after user has rated */}
                {isReviewed && (
                  <View style={styles.ratingLegendRow}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                      <Text style={[styles.legendText, { color: theme.textSecondary }]}>1-2: Poor</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#F97316' }]} />
                      <Text style={[styles.legendText, { color: theme.textSecondary }]}>3: Average</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                      <Text style={[styles.legendText, { color: theme.textSecondary }]}>4-5: Good</Text>
                    </View>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: isReviewed ? ratingConfig.color : (isDarkMode ? '#334155' : '#000000'),
                    marginTop: 10,
                  },
                ]}
                onPress={() => handleOpenReviewModal(targetProd, existingOrderReview, orderRatingNum || 0)}
                activeOpacity={0.88}
              >
                <Ionicons
                  name={isReviewed ? 'star' : 'star-outline'}
                  size={18}
                  color={AllColors.white}
                  style={styles.btnIconLeft}
                />
                <Text style={styles.primaryBtnText}>
                  {isReviewed
                    ? 'View / Edit Detailed Review & Photos'
                    : 'Write a Review'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })()}

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
              ₹{subTotal > 0 ? subTotal.toFixed(2) : (netTotal - totalGst).toFixed(2)}
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
                -₹{discountAmount.toFixed(2)}
              </Text>
            </View>
          ) : null}

          {totalGst > 0 ? (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>
                Taxes & GST
              </Text>
              <Text
                style={[
                  styles.priceValue,
                  { color: theme.textPrimary },
                ]}
              >
                +₹{totalGst.toFixed(2)}
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
              {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toFixed(2)}`}
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
              Total Payable
            </Text>
            <Text style={styles.priceValueTotal}>₹{netTotal.toFixed(2)}</Text>
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

      {/* Product Review Modal */}
      <ProductReviewModal
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        product={selectedReviewProduct}
        orderId={displayOrderId}
        existingReview={selectedExistingReview}
        initialRating={selectedInitialRating}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56 + STATUSBAR_HEIGHT,
    paddingTop: STATUSBAR_HEIGHT,
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
  itemReviewActionContainer: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  itemRateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  itemRateBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  itemReviewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  itemReviewedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  itemRateQuickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  itemStarsQuickBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemMiniStarTouch: {
    padding: 2,
  },
  interactiveRatingBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginVertical: 10,
    alignItems: 'center',
  },
  interactiveRatingTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  interactiveStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginVertical: 4,
  },
  interactiveStarBtn: {
    alignItems: 'center',
    padding: 4,
  },
  interactiveStarLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  ratingLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  mapBoxContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
    marginTop: 6,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mapElement: {
    width: '100%',
    height: 200,
  },
  tapToNavigatePill: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 10,
  },
  tapToNavigateText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  mapControlsColumn: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'column',
    gap: 6,
    zIndex: 10,
  },
  mapControlBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.16,
    shadowRadius: 2,
    elevation: 3,
  },
  mapPointsLegend: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  pointDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pointText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E293B',
  },
  mapPlaceholder: {
    height: 140,
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  mapPlaceholderText: {
    fontSize: 13,
    fontWeight: '500',
  },
  distanceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  distanceBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  distanceBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  refreshLocBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});