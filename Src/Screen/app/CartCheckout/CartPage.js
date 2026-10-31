import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ToastAndroid,
  ActivityIndicator,
  Linking,
  Platform,
  RefreshControl,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Rating } from '@kolking/react-native-rating';
import AllColors from '../../../Constants/Color';
import AntDesign from 'react-native-vector-icons/AntDesign'
import Feather from 'react-native-vector-icons/Feather'
import {
  addToCartApi,
  removeFromCartApi,
  addToWishlistApi,
  getCartViewApi,
  createOrderApi,
  createCashfreeOrderApi,
  getUserProfileApi,
  getAddressListApi,
  deleteAddressApi,
  getToken,
  getuserId,
} from '../../../Api/Api';
import { ScrollView } from 'react-native-gesture-handler';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons'
import RazorpayCheckout from "react-native-razorpay";
import LottieView from 'lottie-react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../Context/ThemeContext';
import { STATUSBAR_HEIGHT } from '../../../Constants/ScreenUtils';
import CustomAlert from '../../../Common/Alert';
import {
  saveActiveCartSeller,
  clearActiveCartSeller,
  getCartSkuId,
  isCartItemMatching,
  extractCartItems,
} from '../../../Common/sellerUtils';

const formatDeliveryEstimate = (opt) => {
  const dateStr = opt?.delivery_date || opt?.date || opt?.estimated_delivery_date || opt?.expected_date || opt?.etd;
  const daysNum = opt?.days ?? opt?.estimated_days ?? opt?.delivery_days ?? opt?.transit_time;

  if (dateStr) {
    return {
      title: `Delivery by ${dateStr}`,
      subtitle: daysNum ? `Estimated in ${daysNum} ${Number(daysNum) === 1 ? 'Day' : 'Days'}` : null,
    };
  }

  const days = Number(daysNum);
  if (!isNaN(days) && days > 0) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const dateFormatted = targetDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    return {
      title: `Delivery by ${dateFormatted}`,
      subtitle: `Estimated in ${days} ${days === 1 ? 'Day' : 'Days'}`,
    };
  }

  return {
    title: 'Standard Delivery',
    subtitle: 'Estimated in 2-4 Days',
  };
};

const SELECTED_CART_ADDR_ID_KEY = 'SELECTED_CART_ADDRESS_ID';
const SELECTED_CART_ADDR_DATA_KEY = 'SELECTED_CART_ADDRESS_DATA';

const CartPage = () => {
  const route = useRoute();
  const { theme, isDarkMode } = useTheme();
  const [cartItems, setCartItems] = useState([]);
  const [sellerGroups, setSellerGroups] = useState([]);
  const [sellerSelections, setSellerSelections] = useState({});
  const [updatingSellerId, setUpdatingSellerId] = useState(null);
  const [unavailableItems, setUnavailableItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [extraData, setExtraData] = useState({});
  const [couponCode, setCouponCode] = useState('DEEBAZER50');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isCouponModalVisible, setIsCouponModalVisible] = useState(false);
  const [couponAlert, setCouponAlert] = useState({ visible: false, title: '', message: '' });

  const showCouponAlert = (title, message) => {
    setCouponAlert({ visible: true, title, message });
  };

  const closeCouponAlert = () => {
    setCouponAlert({ visible: false, title: '', message: '' });
  };

  const billSummary = useMemo(() => {
    try {
      const serverActualTotal = extraData?.actual_total != null ? Number(extraData.actual_total) : null;
      const serverSubTotal = extraData?.sub_total != null ? Number(extraData.sub_total) : null;
      const serverDiscount = extraData?.discount != null ? Number(extraData.discount) : null;
      const serverDelivery = extraData?.delivery_charge != null ? Number(extraData.delivery_charge) : null;
      const serverTotalGst = extraData?.total_gst != null ? Number(extraData.total_gst) : null;
      const serverCgst = extraData?.cgst != null ? Number(extraData.cgst) : 0;
      const serverSgst = extraData?.sgst != null ? Number(extraData.sgst) : 0;
      const serverIgst = extraData?.igst != null ? Number(extraData.igst) : 0;
      const serverTotal = extraData?.total_payable_amount != null
        ? Number(extraData.total_payable_amount)
        : (extraData?.total_amount != null ? Number(extraData.total_amount) : null);

      const actualSum = cartItems.reduce(
        (sum, it) => sum + Number(it.actual_total ?? (Number(it.actual_price || 0) * Number(it.qty || 1))),
        0
      );

      const sellingSum = cartItems.reduce(
        (sum, it) => sum + Number(
          it.after_discount_total ??
          it.after_discount_price ??
          (it.discount_total != null && it.discount_total !== it.actual_total ? it.discount_total : null) ??
          it.actual_price ??
          0
        ),
        0
      );

      const discountSum = cartItems.reduce(
        (sum, it) => sum + Number(it.discount_total ?? it.discount_price ?? 0),
        0
      );

      const actual_total = serverActualTotal !== null ? serverActualTotal : Number(actualSum.toFixed(2));
      const sub_total = serverSubTotal !== null ? serverSubTotal : Number(sellingSum.toFixed(2));
      const discount = serverDiscount !== null ? serverDiscount : Number((discountSum > 0 ? discountSum : Math.max(0, actual_total - sub_total)).toFixed(2));
      const delivery_charge = serverDelivery !== null ? serverDelivery : Number(extraData?.delivery_charge ?? 0);
      const total_gst = serverTotalGst !== null ? serverTotalGst : 0;

      const calculatedTotal = serverTotal !== null
        ? Math.max(0, serverTotal - couponDiscount)
        : Math.max(0, sub_total + total_gst + delivery_charge - couponDiscount);

      return {
        actual_total: Number(actual_total.toFixed(2)),
        sub_total: Number(sub_total.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        coupon_discount: Number(couponDiscount.toFixed(2)),
        delivery_charge: Number(delivery_charge.toFixed(2)),
        total_gst: Number(total_gst.toFixed(2)),
        cgst: Number(serverCgst.toFixed(2)),
        sgst: Number(serverSgst.toFixed(2)),
        igst: Number(serverIgst.toFixed(2)),
        total_amount: Number(calculatedTotal.toFixed(2)),
      };
    } catch (e) {
      return {
        actual_total: 0,
        sub_total: 0,
        discount: 0,
        coupon_discount: 0,
        delivery_charge: 0,
        total_gst: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total_amount: 0,
      };
    }
  }, [cartItems, extraData, couponDiscount]);
  const [addressList, setAddressList] = useState([])
  const [isModal, setIsModal] = useState(false)
  const [addressModal, setAddressModal] = useState(false);
  const [isuser, setIsUser] = useState(null)
  const [addressData, setAddressData] = useState({})
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [addressId, setAddresId] = useState('')
  const selectedAddressIdRef = useRef('');
  const selectedAddressDataRef = useRef(null);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const updateCartQty = async (product, mode = 'add') => {
    const ID = await getuserId();
    const token = await getToken();
    const skuId = getCartSkuId(product);
    if (!skuId) {
      Alert.alert('Error', 'This cart item is missing its SKU.');
      return;
    }
    const sellerSkuId = product?.seller_sku_id;
    try {
      const result = await addToCartApi(
        skuId,
        1,
        sellerSkuId ? { seller_sku_id: sellerSkuId } : {},
        mode
      );

      console.log("Cart Update:", result);

      if (result.status !== 200) {
        Alert.alert("Error", result.message || "Unable to update cart");
        CartView();
      }
    } catch (error) {
      console.log("Cart Update Error:", error);
      CartView();
    }
  };
  const computeExtraDataFromCart = (items) => {
    try {
      const actualSum = items.reduce(
        (sum, it) => sum + Number(it.actual_total ?? (Number(it.actual_price || 0) * Number(it.qty || 1))),
        0
      );

      const sellingSum = items.reduce(
        (sum, it) => sum + Number(
          it.after_discount_total ??
          it.after_discount_price ??
          it.unit_price ??
          it.actual_price ??
          0
        ),
        0
      );

      const discountSum = items.reduce(
        (sum, it) => sum + Number(it.discount_total ?? it.discount_price ?? 0),
        0
      );

      const total_gst = Number(extraData?.total_gst) || 0;
      const delivery_charge = Number(extraData?.delivery_charge) || 0;
      const total_payable_amount = Number((sellingSum + total_gst + delivery_charge).toFixed(2));

      return {
        ...extraData,
        actual_total: Number(actualSum.toFixed(2)),
        sub_total: Number(sellingSum.toFixed(2)),
        discount: Number(discountSum.toFixed(2)),
        total_gst,
        delivery_charge,
        total_payable_amount,
        total_amount: total_payable_amount,
      };
    } catch (e) {
      return extraData || {};
    }
  };

  const increaseQty = async (product) => {
    const currentQty = Number(product.qty) || 1;
    const newQty = currentQty + 1;
    const targetSkuId = getCartSkuId(product);
    if (!targetSkuId) return;

    setCartItems((prev) => {
      const updated = prev.map((item) => {
        const isMatch = isCartItemMatching(item, product);
        if (!isMatch) return item;

        const prevQty = Number(item.qty) || 1;
        const unitActual = Number(item.actual_price ?? (item.actual_total ? Number(item.actual_total) / prevQty : null) ?? 0);
        const unitSelling = Number(
          item.after_discount_price ??
          (item.after_discount_total != null ? Number(item.after_discount_total) / prevQty : null) ??
          item.unit_price ??
          unitActual
        );
        const unitDiscount = Number(
          item.discount_price ??
          (item.discount_total != null ? Number(item.discount_total) / prevQty : null) ??
          Math.max(0, unitActual - unitSelling)
        );

        const newActualTotal = Number((unitActual * newQty).toFixed(2));
        const newAfterDiscountTotal = Number((unitSelling * newQty).toFixed(2));
        const newDiscountTotal = Number((unitDiscount * newQty).toFixed(2));

        return {
          ...item,
          qty: newQty,
          unit_price: unitSelling,
          actual_price: unitActual,
          after_discount_price: unitSelling,
          discount_price: unitDiscount,
          actual_total: newActualTotal,
          after_discount_total: newAfterDiscountTotal,
          discount_total: newDiscountTotal,
        };
      });

      const nextSummary = computeExtraDataFromCart(updated);
      setExtraData(nextSummary);
      return updated;
    });

    setSellerGroups((prev) => {
      if (!Array.isArray(prev)) return [];
      return prev.map((seller) => {
        let sellerSubtotal = 0;
        const updatedItems = (seller.items || []).map((item) => {
          if (!isCartItemMatching(item, product)) {
            sellerSubtotal += Number(item.after_discount_total ?? item.after_discount_price ?? item.actual_price ?? 0);
            return item;
          }
          const prevQty = Number(item.qty) || 1;
          const unitActual = Number(item.actual_price ?? (item.actual_total ? Number(item.actual_total) / prevQty : null) ?? 0);
          const unitSelling = Number(
            item.after_discount_price ??
            (item.after_discount_total != null ? Number(item.after_discount_total) / prevQty : null) ??
            item.unit_price ??
            unitActual
          );
          const unitDiscount = Number(
            item.discount_price ??
            (item.discount_total != null ? Number(item.discount_total) / prevQty : null) ??
            Math.max(0, unitActual - unitSelling)
          );

          const newActualTotal = Number((unitActual * newQty).toFixed(2));
          const newAfterDiscountTotal = Number((unitSelling * newQty).toFixed(2));
          const newDiscountTotal = Number((unitDiscount * newQty).toFixed(2));
          sellerSubtotal += newAfterDiscountTotal;

          return {
            ...item,
            qty: newQty,
            unit_price: unitSelling,
            actual_price: unitActual,
            after_discount_price: unitSelling,
            discount_price: unitDiscount,
            actual_total: newActualTotal,
            after_discount_total: newAfterDiscountTotal,
            discount_total: newDiscountTotal,
          };
        });

        const gstTotal = Number(seller.seller_gst?.total || 0);
        const delCharge = Number(seller.delivery_charge || 0);
        return {
          ...seller,
          items: updatedItems,
          seller_subtotal: Number(sellerSubtotal.toFixed(2)),
          seller_total: Number((sellerSubtotal + gstTotal + delCharge).toFixed(2)),
        };
      });
    });

    await updateCartQty(product, 'add');
  };

  const decreaseQty = async (product) => {
    const currentQty = Number(product.qty) || 1;
    if (currentQty <= 1) {
      await removeItem(product);
      return;
    }

    const newQty = currentQty - 1;
    const targetSkuId = getCartSkuId(product);
    if (!targetSkuId) return;

    setCartItems((prev) => {
      const updated = prev.map((item) => {
        const isMatch = isCartItemMatching(item, product);
        if (!isMatch) return item;

        const prevQty = Number(item.qty) || 1;
        const unitActual = Number(item.actual_price ?? (item.actual_total ? Number(item.actual_total) / prevQty : null) ?? 0);
        const unitSelling = Number(
          item.after_discount_price ??
          (item.after_discount_total != null ? Number(item.after_discount_total) / prevQty : null) ??
          item.unit_price ??
          unitActual
        );
        const unitDiscount = Number(
          item.discount_price ??
          (item.discount_total != null ? Number(item.discount_total) / prevQty : null) ??
          Math.max(0, unitActual - unitSelling)
        );

        const newActualTotal = Number((unitActual * newQty).toFixed(2));
        const newAfterDiscountTotal = Number((unitSelling * newQty).toFixed(2));
        const newDiscountTotal = Number((unitDiscount * newQty).toFixed(2));

        return {
          ...item,
          qty: newQty,
          unit_price: unitSelling,
          actual_price: unitActual,
          after_discount_price: unitSelling,
          discount_price: unitDiscount,
          actual_total: newActualTotal,
          after_discount_total: newAfterDiscountTotal,
          discount_total: newDiscountTotal,
        };
      });

      const nextSummary = computeExtraDataFromCart(updated);
      setExtraData(nextSummary);
      return updated;
    });

    setSellerGroups((prev) => {
      if (!Array.isArray(prev)) return [];
      return prev.map((seller) => {
        let sellerSubtotal = 0;
        const updatedItems = (seller.items || []).map((item) => {
          if (!isCartItemMatching(item, product)) {
            sellerSubtotal += Number(item.after_discount_total ?? item.after_discount_price ?? item.actual_price ?? 0);
            return item;
          }
          const prevQty = Number(item.qty) || 1;
          const unitActual = Number(item.actual_price ?? (item.actual_total ? Number(item.actual_total) / prevQty : null) ?? 0);
          const unitSelling = Number(
            item.after_discount_price ??
            (item.after_discount_total != null ? Number(item.after_discount_total) / prevQty : null) ??
            item.unit_price ??
            unitActual
          );
          const unitDiscount = Number(
            item.discount_price ??
            (item.discount_total != null ? Number(item.discount_total) / prevQty : null) ??
            Math.max(0, unitActual - unitSelling)
          );

          const newActualTotal = Number((unitActual * newQty).toFixed(2));
          const newAfterDiscountTotal = Number((unitSelling * newQty).toFixed(2));
          const newDiscountTotal = Number((unitDiscount * newQty).toFixed(2));
          sellerSubtotal += newAfterDiscountTotal;

          return {
            ...item,
            qty: newQty,
            unit_price: unitSelling,
            actual_price: unitActual,
            after_discount_price: unitSelling,
            discount_price: unitDiscount,
            actual_total: newActualTotal,
            after_discount_total: newAfterDiscountTotal,
            discount_total: newDiscountTotal,
          };
        });

        const gstTotal = Number(seller.seller_gst?.total || 0);
        const delCharge = Number(seller.delivery_charge || 0);
        return {
          ...seller,
          items: updatedItems,
          seller_subtotal: Number(sellerSubtotal.toFixed(2)),
          seller_total: Number((sellerSubtotal + gstTotal + delCharge).toFixed(2)),
        };
      });
    });

    await updateCartQty(product, 'sub');
  };

  const removeItem = async (itemOrId) => {
    const userid = await getuserId();
    const token = await getToken();
    const isObject = typeof itemOrId === 'object' && itemOrId !== null;
    const skuId = isObject
      ? getCartSkuId(itemOrId)
      : String(itemOrId);
    const sellerId = isObject ? (itemOrId.seller_id ?? itemOrId.sellerId ?? itemOrId.vendor_id) : null;
    const sellerSkuId = isObject ? itemOrId.seller_sku_id : null;
    if (!skuId) {
      Alert.alert('Error', 'This cart item is missing its SKU.');
      return;
    }

    // Save previous state for rollback if network fails
    const prevCartItems = [...cartItems];
    const prevSellerGroups = [...sellerGroups];
    const prevExtraData = { ...extraData };

    // 1. Optimistically update cartItems
    const updatedCartItems = cartItems.filter((item) => {
      return isObject
        ? !isCartItemMatching(item, itemOrId)
        : getCartSkuId(item) !== skuId;
    });
    setCartItems(updatedCartItems);

    // 2. Optimistically update sellerGroups
    const updatedSellerGroups = sellerGroups
      .map((seller) => {
        const remainingItems = (seller.items || []).filter((item) => {
          return isObject
            ? !isCartItemMatching(item, itemOrId)
            : getCartSkuId(item) !== skuId;
        });
        return {
          ...seller,
          items: remainingItems,
        };
      })
      .filter((seller) => seller.items && seller.items.length > 0);
    setSellerGroups(updatedSellerGroups);

    if (updatedCartItems.length === 0) {
      clearActiveCartSeller();
    }
    const nextSummary = computeExtraDataFromCart(updatedCartItems);
    setExtraData(nextSummary);

    try {
      const result = await removeFromCartApi(skuId, sellerSkuId, userid);
      const isSuccess = result?.status == 200 || result?.status === '200' || result?.success;

      if (!isSuccess) {
        // Rollback state if server rejected removal
        setCartItems(prevCartItems);
        setSellerGroups(prevSellerGroups);
        setExtraData(prevExtraData);
        Alert.alert("Error", result?.message || "Failed to remove item");
        CartView();
      } else {
        // Quietly sync cart in background
        CartView();
      }
    } catch (error) {
      console.log("Remove Cart Error:", error);
      // Rollback state on network error
      setCartItems(prevCartItems);
      setSellerGroups(prevSellerGroups);
      setExtraData(prevExtraData);
      Alert.alert("Error", "Something went wrong");
      CartView();
    }
  };
  const moveToWishlist = async (item) => {
    try {
      const skuId = getCartSkuId(item);
      const sellerSkuId = item?.seller_sku_id;

      const result = await addToWishlistApi(skuId, sellerSkuId);
      if (result.status === 200 || result.success) {
        await removeItem(item);

        // ToastAndroid.show(
        //   "Product moved to Wishlist",
        //   ToastAndroid.SHORT
        // );
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Something went wrong");
    }
  };
  // compute local extra data (subtotal, discount, total) from cart items
  // ===== COUPON LOGIC =====
  const COUPONS_DATA = [
    { id: '1', code: 'DEEBAZER50', discount: '50% OFF', title: 'Flat 50% Off', minSpend: 499, type: 'percent', value: 50, description: 'Use code DEEBAZER50 on orders above ₹499.', validTill: '31 Aug 2026' },
    { id: '2', code: 'FESTIVE200', discount: '₹200 OFF', title: 'Festival Discount', minSpend: 999, type: 'flat', value: 200, description: 'Save flat ₹200 on all orders above ₹999.', validTill: '15 Aug 2026' },
    { id: '3', code: 'MEGA100', discount: '₹100 OFF', title: 'Super Saver', minSpend: 799, type: 'flat', value: 100, description: 'Enjoy ₹100 instant discount on orders above ₹799.', validTill: '10 Aug 2026' },
    { id: '4', code: 'FREESHIP', discount: 'FREE SHIPPING', title: 'Free Delivery', minSpend: 0, type: 'flat', value: 0, description: 'Get free delivery on any order.', validTill: '30 Sep 2026' },
  ];

  const applyCoupon = (customCoupon = null) => {
    const code = customCoupon ? customCoupon.code : couponCode.trim().toUpperCase();
    if (!code) {
      setIsCouponModalVisible(false);
      showCouponAlert('Empty Coupon Code', 'Please enter or select a valid coupon code.');
      return;
    }
    const matched = customCoupon || COUPONS_DATA.find(c => c.code === code);
    if (!matched) {
      setIsCouponModalVisible(false);
      showCouponAlert('Invalid Coupon', `The coupon code "${code}" is invalid or expired.`);
      return;
    }
    const cartTotal = cartItems.reduce(
      (sum, it) => sum + Number(it.after_discount_total ?? it.after_discount_price ?? it.discount_total ?? it.discount_price ?? 0), 0
    );
    if (cartTotal < matched.minSpend) {
      const neededAmount = (matched.minSpend - cartTotal).toFixed(2);
      setIsCouponModalVisible(false);
      showCouponAlert(
        'Minimum Spend Not Met',
        `Coupon "${matched.code}" requires a minimum cart value of ₹${matched.minSpend}.\n\nAdd ₹${neededAmount} more worth of items to unlock this coupon!`
      );
      return;
    }
    let discAmt = 0;
    if (matched.type === 'flat') {
      discAmt = matched.value;
    } else if (matched.type === 'percent') {
      discAmt = (cartTotal * matched.value) / 100;
    }
    setAppliedCoupon(matched);
    setCouponDiscount(Number(discAmt.toFixed(2)));
    setCouponCode(matched.code);
    setIsCouponModalVisible(false);
    if (Platform.OS === 'android') {
      ToastAndroid.show(`🎉 Coupon ${matched.code} Applied!`, ToastAndroid.SHORT);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('DEEBAZER50');
  };

  const onBuyNowPressed = () => {
    const currentAddressId = addressId || addressData?.id || selectedAddressIdRef.current;
    if (!currentAddressId) {
      Alert.alert(
        "Select Delivery Address",
        "Please select a delivery address to proceed with your order.",
        [
          { text: "Select Address", onPress: () => openAddAddress() }
        ]
      );
      return;
    }

    if (Array.isArray(unavailableItems) && unavailableItems.length > 0) {
      Alert.alert(
        "Unavailable Items in Cart",
        "Your cart contains items that are currently unavailable. Please remove them before proceeding with checkout."
      );
      return;
    }

    if (Array.isArray(sellerGroups) && sellerGroups.length > 0) {
      for (const seller of sellerGroups) {
        const sid = String(seller.seller_id);
        const sel = sellerSelections[sid];
        const sName = seller.seller_name || `Seller #${sid}`;

        if (seller.delivery_error) {
          Alert.alert(
            "Delivery Error",
            `${sName}: ${seller.delivery_error}. Please select Store Pickup or choose another delivery address.`
          );
          return;
        }

        const hasUnavailable = (seller.items || []).some(
          (it) => it.available === false || it.available_stock === 0
        );
        if (hasUnavailable) {
          Alert.alert(
            "Unavailable Product",
            `One or more items from ${sName} are out of stock. Please remove them before checkout.`
          );
          return;
        }

        if (!sel || !sel.mode) {
          Alert.alert(
            "Choose Delivery Method",
            `Please select Home Delivery or Store Pickup for ${sName}.`
          );
          return;
        }
        if (
          sel.mode === 'delivery' &&
          Array.isArray(seller.delivery_options) &&
          seller.delivery_options.length > 0 &&
          !sel.option &&
          !seller.selected_option
        ) {
          Alert.alert(
            "Select Delivery Partner",
            `Please choose a delivery partner for ${sName}.`
          );
          return;
        }
      }
    }

    setIsPaymentModalVisible(true);
  };

  const requestForOder = async (selectedMethod = paymentMethod) => {
    const currentAddressId = addressId || addressData?.id || selectedAddressIdRef.current;
    if (!currentAddressId) {
      Alert.alert("Address Required", "Please select a delivery address.");
      setIsModal(true);
      return;
    }

    setIsPlacingOrder(true);
    try {
      const token = await getToken();
      const userId = await getuserId();

      let checkoutUrl = null;
      if (selectedMethod === "cashfree" || selectedMethod === "online") {
        try {
          const cashfreeBody = {
            amount: billSummary.total_amount,
            customer_id: String(userId),
            email: userProfile?.email || addressData?.email || 'customer@deebazar.com',
            phone: addressData?.mobile || userProfile?.mobile || '9876543210',
            name: addressData?.name || userProfile?.name || 'Customer',
            order_note: "Product Purchase",
            return_url: "https://deebazar.com/payment-return",
            notify_url: "https://deebazar.com/payment-notify"
          };

          const cashfreeRes = await createCashfreeOrderApi(cashfreeBody);
          const cashfreeResult = cashfreeRes.data || {};
          if (cashfreeRes.ok && (cashfreeResult.status === "success" || cashfreeResult.checkout_url)) {
            checkoutUrl = cashfreeResult.checkout_url;
          } else {
            console.log("Cashfree order creation failed:", cashfreeResult);
          }
        } catch (err) {
          console.log("Cashfree order API call error:", err);
        }
      }

      // Format seller selections: { [seller_id]: { mode: "pickup" } } or { [seller_id]: { mode: "delivery", option: "seller" } }
      const finalSelections = {};
      if (Array.isArray(sellerGroups) && sellerGroups.length > 0) {
        sellerGroups.forEach((s) => {
          const sid = String(s.seller_id);
          const sel = sellerSelections[sid] || {};
          const mode = sel.mode || s.selected_mode || 'delivery';
          if (mode === 'pickup') {
            finalSelections[sid] = { mode: 'pickup' };
          } else {
            const option = sel.option || s.selected_option || (s.delivery_options?.[0]?.code) || 'seller';
            finalSelections[sid] = {
              mode: 'delivery',
              option: option,
            };
          }
        });
      } else if (sellerSelections && Object.keys(sellerSelections).length > 0) {
        Object.keys(sellerSelections).forEach((sid) => {
          const sel = sellerSelections[sid];
          if (sel?.mode === 'pickup') {
            finalSelections[sid] = { mode: 'pickup' };
          } else {
            finalSelections[sid] = {
              mode: 'delivery',
              option: sel?.option || 'seller',
            };
          }
        });
      }

      console.log("Placing order payload selections:", JSON.stringify(finalSelections));

      const result = await createOrderApi(currentAddressId, selectedMethod, finalSelections, appliedCoupon?.code);
      console.log("Create Order Result:", result);

      setIsPaymentModalVisible(false);
      setIsPlacingOrder(false);

      const isSuccess = result && (result.status === 200 || result.status === '200' || result.status === 'success' || result.success === true);

      if (isSuccess) {
        const orderedCartItems = [...cartItems];
        const currentSummary = { ...billSummary };
        const chosenFromList = Array.isArray(addressList)
          ? addressList.find((a) => String(a.id) === String(currentAddressId))
          : null;
        const activeDeliveryAddress =
          chosenFromList ||
          (addressData && Object.keys(addressData).length > 0 ? addressData : null) ||
          selectedAddress ||
          {};

        setCartItems([]);
        setAppliedCoupon(null);
        setCouponDiscount(0);

        if (selectedMethod === "cashfree" || selectedMethod === "online") {
          const targetUrl = checkoutUrl || result.payment_url || result.data?.payment_url || result.checkout_url;
          if (targetUrl) {
            Linking.openURL(targetUrl).catch(() => {
              openRazorpay();
            });
          } else {
            openRazorpay();
          }
        }

        if (Platform.OS === 'android') {
          ToastAndroid.show(result.message || "Order created successfully", ToastAndroid.LONG);
        } else {
          Alert.alert("Success", result.message || "Order created successfully");
        }

        const firstOrderId = Array.isArray(result.order_ids) && result.order_ids.length > 0 ? result.order_ids[0] : null;
        const createdOrderId = firstOrderId || result.order_id || result.data?.id || result.id || result.order?.id || result.order?.order_id || result.data?.order_id;
        const orderNumber = result.order_number || firstOrderId || result.order?.order_number || result.data?.order_number || createdOrderId;

        const constructedOrder = {
          order_id: createdOrderId,
          id: createdOrderId,
          order_number: orderNumber,
          order_status: "Processing",
          status: "Processing",
          delivery_status: "Processing",
          payment_method: selectedMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment (Prepaid)',
          payment_mode: selectedMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment (Prepaid)',
          payment_type: selectedMethod,
          items: orderedCartItems.map((item, idx) => ({
            id: item.id || item.product_id || idx,
            product_id: item.product_id || item.id,
            name: item.name || item.product_name || item.title || 'Product',
            product_name: item.name || item.product_name || item.title || 'Product',
            img: item.img || item.image || item.product_image || item.thumbnail,
            image: item.img || item.image || item.product_image || item.thumbnail,
            selling_price: item.after_discount_price ?? item.discount_price ?? item.selling_price ?? item.price ?? 0,
            price: item.after_discount_price ?? item.discount_price ?? item.selling_price ?? item.price ?? 0,
            actual_price: item.actual_price ?? item.selling_price ?? item.price ?? 0,
            qty: item.qty || item.quantity || 1,
            seller_policy: item.seller_policy || item.policy || null,
            return_days: item.return_days,
          })),
          selling_price: currentSummary.sub_total || 0,
          subtotal: currentSummary.sub_total || 0,
          amount: currentSummary.sub_total || 0,
          shipping_fee: currentSummary.delivery_charge || 0,
          shipping_charge: currentSummary.delivery_charge || 0,
          delivery_charge: currentSummary.delivery_charge || 0,
          extra_discount: currentSummary.coupon_discount || currentSummary.discount || 0,
          coupon_discount: currentSummary.coupon_discount || 0,
          discount: currentSummary.discount || 0,
          total_amount: currentSummary.total_amount || 0,
          net_amount: currentSummary.total_amount || 0,
          created_at: new Date().toISOString(),
          created_date: new Date().toISOString(),
          order_date: new Date().toISOString(),
          ...(result.data && typeof result.data === 'object' ? result.data : {}),
          ...(result.order && typeof result.order === 'object' ? result.order : {}),
          address_user: activeDeliveryAddress,
          data_user: activeDeliveryAddress,
          shipping_address: activeDeliveryAddress,
          delivery_address: activeDeliveryAddress,
          user: activeDeliveryAddress,
        };

        navigation.navigate("OrderDetails", {
          order_id: createdOrderId,
          id: createdOrderId,
          order_number: orderNumber,
          order: constructedOrder,
          payment_method: selectedMethod,
        });
      } else {
        Alert.alert(
          "Order Placement Failed ❌",
          result?.message || result?.error || "Something went wrong while placing your order. Please try again.",
          [
            { text: "OK" }
          ]
        );
      }
    } catch (error) {
      console.log("Order Error:", error);
      setIsPaymentModalVisible(false);
      setIsPlacingOrder(false);
      Alert.alert(
        "Order Error ❌",
        "A network error occurred. Please check your internet connection and try again.",
        [
          { text: "OK" }
        ]
      );
    }
  };

  const openRazorpay = () => {
    const options = {
      description: 'Order Payment',
      image: 'https://your-logo.com/logo.png',
      currency: 'INR',
      key: 'rzp_test_SSIXQ48CfHlnJs',
      amount: Math.round(Number(billSummary.total_amount) * 100),
      name: 'DeeBazer',
      prefill: {
        email: userProfile?.email || addressData?.email || 'customer@deebazar.com',
        contact: addressData?.mobile || userProfile?.mobile || '',
        name: addressData?.name || userProfile?.name || '',
      },
      theme: {
        color: '#291a5a',
      },
    };
    RazorpayCheckout.open(options)
      .then(async (payment) => {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Payment Successful!', ToastAndroid.SHORT);
        } else {
          Alert.alert('Payment Successful', 'Your payment was completed successfully.');
        }
      })
      .catch((error) => {
        console.log('Payment Failed', error);

        Alert.alert(
          'Payment Incomplete',
          error.description || 'Payment was cancelled or failed.'
        );
      });
  };
  const total = cartItems.reduce(
    (sum, item) =>
      sum + Number(item.actual_price) * Number(item.qty),
    0
  );
  const getUserId = async () => {
    const userid = await getToken();
    setIsUser(userid);
    if (!userid) {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      setLoading(true);
      setIsModal(false);
      setAddressModal(false);

      const initCartFocus = async () => {
        try {
          const ID = await getuserId();
          setIsUser(ID);
          if (!ID) {
            if (isMounted) setLoading(false);
            return;
          }

          // 1. Resolve delivery address ID (Route params > AsyncStorage > State/Ref)
          let targetAddrId = route?.params?.selectedAddressId;
          if (targetAddrId) {
            targetAddrId = String(targetAddrId);
            selectedAddressIdRef.current = targetAddrId;
            setAddresId(targetAddrId);
            await AsyncStorage.setItem(SELECTED_CART_ADDR_ID_KEY, targetAddrId).catch(() => {});
            navigation.setParams({ selectedAddressId: undefined });
          } else {
            const savedAddrId = await AsyncStorage.getItem(SELECTED_CART_ADDR_ID_KEY).catch(() => null);
            if (savedAddrId) {
              targetAddrId = String(savedAddrId);
              selectedAddressIdRef.current = targetAddrId;
              setAddresId(targetAddrId);
            } else if (selectedAddressIdRef.current) {
              targetAddrId = selectedAddressIdRef.current;
            }
          }

          // Preload saved address data if present
          try {
            const savedDataStr = await AsyncStorage.getItem(SELECTED_CART_ADDR_DATA_KEY);
            if (savedDataStr) {
              const parsed = JSON.parse(savedDataStr);
              if (parsed && typeof parsed === 'object' && parsed.id) {
                if (isMounted) {
                  setAddressData(parsed);
                  selectedAddressDataRef.current = parsed;
                }
              }
            }
          } catch {}

          // 2. Request CartView with target address
          if (isMounted) {
            await CartView(targetAddrId || null);
          }

          // 3. Fetch address list in background
          try {
            const res = await getAddressListApi(ID);
            const list = parseAddressList(res.data);
            if (isMounted) {
              setAddressList(list || []);
              const currentId = targetAddrId || selectedAddressIdRef.current || addressId;
              if (currentId && Array.isArray(list)) {
                const matched = list.find((a) => String(a.id) === String(currentId));
                if (matched) {
                  setAddressData(matched);
                  selectedAddressDataRef.current = matched;
                  AsyncStorage.setItem(SELECTED_CART_ADDR_DATA_KEY, JSON.stringify(matched)).catch(() => {});
                }
              }
            }
          } catch (err) {
            console.log('Error fetching address list in focus effect:', err);
          }
        } catch (err) {
          console.log('initCartFocus error:', err);
          if (isMounted) setLoading(false);
        }
      };

      initCartFocus();

      return () => {
        isMounted = false;
      };
    }, [route?.params?.selectedAddressId])
  );
  const handleSelectMode = (sellerId, mode) => {
    console.log(`🚚 [handleSelectMode] Seller ID: ${sellerId} selected mode: "${mode}"`);
    const sKey = String(sellerId);
    const current = sellerSelections[sKey] || {};
    if (current.mode === mode) return;

    const sellerObj = Array.isArray(sellerGroups) ? sellerGroups.find((s) => String(s.seller_id) === sKey) : null;
    const defaultOption = current.option || sellerObj?.selected_option || sellerObj?.delivery_options?.[0]?.code || 'seller';

    const updatedForSeller = mode === 'pickup'
      ? { mode: 'pickup' }
      : { mode: 'delivery', option: defaultOption };

    const nextSelections = {
      ...sellerSelections,
      [sKey]: updatedForSeller,
    };
    setSellerSelections(nextSelections);

    // Optimistic local update
    setSellerGroups((prev) =>
      prev.map((s) => {
        if (String(s.seller_id) === sKey) {
          return {
            ...s,
            selected_mode: mode,
            selected_option: mode === 'pickup' ? null : (s.selected_option || defaultOption),
          };
        }
        return s;
      })
    );

    CartView(null, nextSelections, sellerId);
  };

  const handleSelectDeliveryOption = (sellerId, optionCode) => {
    console.log(`🚚 [handleSelectDeliveryOption] Seller ID: ${sellerId} selected option code: "${optionCode}"`);
    const sKey = String(sellerId);
    const current = sellerSelections[sKey] || {};
    const chosenOption = optionCode || 'seller';
    if (current.option === chosenOption) return;

    const sellerObj = Array.isArray(sellerGroups) ? sellerGroups.find((s) => String(s.seller_id) === sKey) : null;
    const selectedOptObj = sellerObj?.delivery_options?.find((o) => (o?.code || o?.id) === chosenOption);
    if (selectedOptObj) {
      console.log(`🚚 [handleSelectDeliveryOption] Option object:`, JSON.stringify(selectedOptObj, null, 2));
    }

    const updatedForSeller = {
      mode: 'delivery',
      option: chosenOption,
    };
    const nextSelections = {
      ...sellerSelections,
      [sKey]: updatedForSeller,
    };
    setSellerSelections(nextSelections);

    // Optimistic local update
    setSellerGroups((prev) =>
      prev.map((s) => {
        if (String(s.seller_id) === sKey) {
          return {
            ...s,
            selected_mode: 'delivery',
            selected_option: chosenOption,
          };
        }
        return s;
      })
    );

    CartView(null, nextSelections, sellerId);
  };

  const CartView = async (selectedAddrId = null, overrideSelections = null, targetSellerId = null) => {
    const userid = await getuserId();
    if (!userid) {
      setRefreshing(false);
      setLoading(false);
      return;
    }

    let currentAddressId = selectedAddrId || selectedAddressIdRef.current || addressId || addressData?.id;
    if (!currentAddressId) {
      try {
        currentAddressId = await AsyncStorage.getItem(SELECTED_CART_ADDR_ID_KEY);
      } catch {}
    }

    if (targetSellerId) {
      setUpdatingSellerId(targetSellerId);
    }

    const activeSelections = overrideSelections !== null ? overrideSelections : sellerSelections;

    try {
      const data = await getCartViewApi(currentAddressId, activeSelections);

      console.log('================ [CartView] DELIVERY OPTIONS LOG ================');
      console.log('Address ID:', currentAddressId);
      console.log('Active Selections:', JSON.stringify(activeSelections));
      if (Array.isArray(data?.data)) {
        data.data.forEach((seller, idx) => {
          console.log(`\n📦 Seller [${idx + 1}] ID: ${seller?.seller_id} | Name: "${seller?.seller_name}"`);
          console.log(`   - modes:`, seller?.modes);
          console.log(`   - selected_mode:`, seller?.selected_mode);
          console.log(`   - selected_option:`, seller?.selected_option);
          console.log(`   - delivery_charge:`, seller?.delivery_charge);
          console.log(`   - delivery_error:`, seller?.delivery_error);
          console.log(`   - delivery_options count:`, seller?.delivery_options ? seller.delivery_options.length : 0);
          console.log(`   - delivery_options:`, JSON.stringify(seller?.delivery_options, null, 2));
        });
      }
      console.log('=================================================================');

      // Resolve final address: protect selected address from being overwritten by backend default address
      let finalAddressObj = null;
      if (data?.address_data && typeof data.address_data === 'object' && Object.keys(data.address_data).length > 0) {
        if (currentAddressId && String(data.address_data.id) !== String(currentAddressId)) {
          const matchedFromList = Array.isArray(addressList)
            ? addressList.find((a) => String(a.id) === String(currentAddressId))
            : null;
          finalAddressObj = matchedFromList || selectedAddressDataRef.current || data.address_data;
        } else {
          finalAddressObj = data.address_data;
        }
      } else {
        const matchedFromList = Array.isArray(addressList)
          ? addressList.find((a) => String(a.id) === String(currentAddressId))
          : null;
        finalAddressObj = matchedFromList || selectedAddressDataRef.current || (addressData?.id ? addressData : null);
      }

      if (finalAddressObj && finalAddressObj.id) {
        setAddresId(finalAddressObj.id);
        setAddressData(finalAddressObj);
        selectedAddressIdRef.current = String(finalAddressObj.id);
        selectedAddressDataRef.current = finalAddressObj;
        AsyncStorage.setItem(SELECTED_CART_ADDR_ID_KEY, String(finalAddressObj.id)).catch(() => {});
        AsyncStorage.setItem(SELECTED_CART_ADDR_DATA_KEY, JSON.stringify(finalAddressObj)).catch(() => {});
      } else {
        setAddressData({});
      }

      setExtraData(data?.extra_data || {});
      setUnavailableItems(Array.isArray(data?.unavailable) ? data.unavailable : []);

      if (Array.isArray(data?.data)) {
        const isGrouped = data.data.length > 0 && Array.isArray(data.data[0]?.items);
        if (isGrouped) {
          setSellerGroups(data.data);
          const flat = extractCartItems(data.data);
          setCartItems(flat);

          // Synchronize selections with backend response
          const nextSelections = { ...activeSelections };
          data.data.forEach((s) => {
            const sid = String(s.seller_id);
            if (s.selected_mode) {
              if (s.selected_mode === 'pickup') {
                nextSelections[sid] = { mode: 'pickup' };
              } else {
                nextSelections[sid] = {
                  mode: 'delivery',
                  option: s.selected_option || nextSelections[sid]?.option || (s.delivery_options?.[0]?.code) || 'seller',
                };
              }
            }
          });
          setSellerSelections(nextSelections);

          if (flat.length === 0) {
            await clearActiveCartSeller();
          } else {
            await saveActiveCartSeller(flat[0]);
          }
        } else {
          setSellerGroups([]);
          setCartItems(data.data);
          if (data.data.length === 0) {
            await clearActiveCartSeller();
          } else {
            await saveActiveCartSeller(data.data[0]);
          }
        }
      } else {
        setSellerGroups([]);
        setCartItems([]);
        await clearActiveCartSeller();
      }

      const token = await getToken();
      if (token) {
        const profileResponse = await getUserProfileApi();
        const profileData = profileResponse.data || {};
        if (profileData && profileData.user) {
          setUserProfile(profileData.user);
        }
      }
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
      setUpdatingSellerId(null);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    CartView();
  };


  const parseAddressList = (data) => {
    if (!data) return [];
    let list = [];
    if (Array.isArray(data.data)) {
      list = data.data;
    } else if (Array.isArray(data.addresses)) {
      list = data.addresses;
    } else if (Array.isArray(data.address)) {
      list = data.address;
    } else if (Array.isArray(data.list)) {
      list = data.list;
    } else if (Array.isArray(data.result)) {
      list = data.result;
    } else if (Array.isArray(data)) {
      list = data;
    } else if (data.data && typeof data.data === 'object' && (data.data.id || data.data.address_id)) {
      list = [data.data];
    } else if (data.address && typeof data.address === 'object' && (data.address.id || data.address.address_id)) {
      list = [data.address];
    }
    return list;
  };

  const requestForChangeAddress = async () => {
    setIsModal(true);

    const token = await getToken();
    const ID = await getuserId();

    try {
      const res = await getAddressListApi(ID);
      const list = parseAddressList(res.data);
      setAddressList(list || []);
    } catch (error) {
      console.log('Fetch Error:', error);
    }
  };
  const openAddAddress = () => {
    requestForChangeAddress()

    setAddressModal(true);
    setIsModal(true);
  };

  const handleSelectAddress = async (item) => {
    if (!item?.id) return;
    const itemAddrId = String(item.id);
    selectedAddressIdRef.current = itemAddrId;
    selectedAddressDataRef.current = item;
    setAddressData(item);
    setAddresId(item.id);
    setIsModal(false);
    setAddressModal(false);

    try {
      await AsyncStorage.setItem(SELECTED_CART_ADDR_ID_KEY, itemAddrId);
      await AsyncStorage.setItem(SELECTED_CART_ADDR_DATA_KEY, JSON.stringify(item));
    } catch (e) {
      console.log('Error saving address to AsyncStorage:', e);
    }

    CartView(item.id);
  };
  const navigation = useNavigation()
  const gotoMAP = () => {
    setIsModal(false);
    navigation.navigate('MapScreen', { fromCart: true, returnScreen: 'CartPage' });
  };
  const confirmUpdate = (addressId) => {
    Alert.alert(
      'Update Address',
      'Are you sure you want to update this location?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => handleUpdatte(addressId),
        },
      ],
      { cancelable: true }
    );

  };
  const handleUpdatte = () => {
    // console.log('no ')
  }
  const confirmDelete = (addressId) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this location?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => handleDelete(addressId),
        },
      ],
      { cancelable: true }
    );
  };
  const handleDelete = async (addressId) => {
    try {
      const result = await deleteAddressApi(addressId);

      if (result.success || result.ok) {
        setMenuId(null);

        if (selectedAddress?.id === addressId) {
          setSelectedAddress(null);
        }

        if (String(addressId) === String(addressData?.id) || String(addressId) === String(selectedAddressIdRef.current)) {
          selectedAddressIdRef.current = '';
          selectedAddressDataRef.current = null;
          setAddresId('');
          setAddressData({});
          await AsyncStorage.removeItem(SELECTED_CART_ADDR_ID_KEY).catch(() => {});
          await AsyncStorage.removeItem(SELECTED_CART_ADDR_DATA_KEY).catch(() => {});
          CartView();
        }

        requestForChangeAddress();
      } else {
        Alert.alert('Error', result?.data?.message || 'Failed to delete address.');
      }

    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView edges={[]} style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={[styles.header, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: isDarkMode ? '#334155' : '#F5F5F5' }]} onPress={() => navigation.goBack()}>
            <AntDesign name="arrowleft" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            My Cart
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={AllColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isuser) {
    return (
      <SafeAreaView edges={[]} style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={[loginStyles.container, { backgroundColor: theme.bg }]}>
          <View style={[loginStyles.iconBox, { backgroundColor: isDarkMode ? 'rgba(247, 22, 112, 0.15)' : AllColors.softPinkBg }]}>
            <AntDesign
              name="shoppingcart"
              size={65}
              color={AllColors.primary}
            />
          </View>

          <Text style={[loginStyles.title, { color: theme.textPrimary }]}>Your Cart is Empty</Text>

          <Text style={[loginStyles.subtitle, { color: theme.textSecondary }]}>
            Sign in to add products to your cart, save items for later,
            and place orders easily.
          </Text>

          <TouchableOpacity
            style={loginStyles.loginBtn}
            onPress={() => navigation.navigate('Login')}>
            <Text style={loginStyles.loginText}>Login to Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={loginStyles.continueShopBtn}
            onPress={() => navigation.navigate('AppTab', { screen: 'Profile' })}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AntDesign
                name="shoppingcart"
                size={18}
                color={AllColors.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={loginStyles.continueShopText}>
                Continue Shopping
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && (!cartItems || cartItems.length === 0)) {
    return (
      <SafeAreaView edges={[]} style={[styles.container, { backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={AllColors.primary} />
      </SafeAreaView>
    );
  }

  if (!loading && isuser && (!cartItems || cartItems.length === 0) && (!unavailableItems || unavailableItems.length === 0)) {
    return (
      <SafeAreaView edges={[]} style={[styles.container, { backgroundColor: theme.bg }]}>
        <ScrollView
          contentContainerStyle={styles.scrollFlexGrow}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[AllColors.primary]}
              tintColor={AllColors.primary}
            />
          }
        >
          <View style={[loginStyles.container, { backgroundColor: theme.bg }]}>
            <LottieView
              source={require("../../../Assets/empty.json")}
              autoPlay
              loop
              style={loginStyles.animation}
            />

            <Text style={[loginStyles.title, { color: theme.textPrimary }]}>Your Cart is Empty</Text>

            <Text style={[loginStyles.subtitle, { color: theme.textSecondary }]}>
              Looks like you haven't added any products yet.
              {"\n"}
              Start shopping to fill your cart.
            </Text>

            <TouchableOpacity
              style={loginStyles.loginBtn}
              onPress={() => navigation.navigate("AppTab", { screen: "Profile" })}
              activeOpacity={0.8}
            >
              <Text style={loginStyles.loginText}>Add Products</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (

    <SafeAreaView edges={[]} style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar backgroundColor="transparent" barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent={true} />

      {/* ================= Header ================= */}

      <View style={[styles.header, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>

        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: isDarkMode ? '#334155' : '#F5F5F5' }]} onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={22} color={theme.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Checkout
        </Text>

        <View style={styles.headerRightRow}>
        </View>

      </View>

      <View style={{ flex: 1 }}>
        {/* ================= Product Cards / Seller Packages ================= */}
        <FlatList
          data={sellerGroups.length > 0 ? sellerGroups : cartItems}
          keyExtractor={(item, index) =>
            sellerGroups.length > 0
              ? `seller_${item.seller_id || index}`
              : String(item.seller_sku_id || (item.seller_id ? `${item.seller_id}_${getCartSkuId(item) || index}` : `${getCartSkuId(item) || index}`))
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 220 }}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[AllColors.primary]}
              tintColor={AllColors.primary}
            />
          }
          renderItem={({ item }) => {
            if (sellerGroups.length > 0) {
              const seller = item;
              return (
                <View
                  style={[
                    styles.sellerGroupCard,
                    {
                      backgroundColor: theme.cardBg,
                      borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                    },
                  ]}
                >
                  {/* Seller Header */}
                  <View
                    style={[
                      styles.sellerHeaderRow,
                      { borderBottomColor: isDarkMode ? '#334155' : '#F1F5F9' },
                    ]}
                  >
                    <View style={styles.sellerHeaderLeft}>
                      <View
                        style={[
                          styles.sellerIconBox,
                          {
                            backgroundColor: isDarkMode
                              ? 'rgba(247, 22, 112, 0.15)'
                              : '#FFF1F7',
                          },
                        ]}
                      >
                        <Feather
                          name="shopping-bag"
                          size={15}
                          color={AllColors.primary}
                        />
                      </View>
                      <Text
                        style={[styles.sellerGroupTitle, { color: theme.textPrimary }]}
                        numberOfLines={1}
                      >
                        {seller.seller_name || `Seller #${seller.seller_id}`}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.sellerBadge,
                        { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' },
                      ]}
                    >
                      <Text style={[styles.sellerItemsCount, { color: theme.textSecondary }]}>
                        {seller.items?.length || 0} {seller.items?.length === 1 ? 'item' : 'items'}
                      </Text>
                    </View>
                  </View>

                  {/* Items for this seller */}
                  {Array.isArray(seller.items) &&
                    seller.items.map((prodItem, pIdx) => (
                      <View
                        key={String(prodItem.cart_id || prodItem.product_sku_id || pIdx)}
                        style={[
                          styles.groupProductItem,
                          pIdx > 0 && {
                            borderTopWidth: 1,
                            borderTopColor: isDarkMode ? '#334155' : '#F1F5F9',
                          },
                        ]}
                      >
                        <View style={styles.productRow}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            style={styles.productTouchable}
                            onPress={() =>
                              navigation.navigate('ProductDetails', {
                                id: prodItem.product_id || prodItem.id,
                                product_sku_id: getCartSkuId(prodItem),
                                sku_id: getCartSkuId(prodItem),
                                seller_id: prodItem.seller_id || seller.seller_id,
                                item: prodItem,
                              })
                            }
                          >
                            <Image
                              source={{ uri: prodItem.image }}
                              style={[
                                styles.image,
                                {
                                  backgroundColor: isDarkMode ? '#0F172A' : AllColors.white,
                                  borderColor: isDarkMode ? '#334155' : '#F1F5F9',
                                },
                              ]}
                            />

                            <View style={styles.productInfoWrapper}>
                              {prodItem.offer ? (
                                <View style={styles.offerBadge}>
                                  <Text style={styles.offerText}>{prodItem.offer}</Text>
                                </View>
                              ) : null}

                              <Text
                                numberOfLines={2}
                                style={[styles.productName, { color: theme.textPrimary }]}
                              >
                                {prodItem.name}
                              </Text>

                              {prodItem.available === false || prodItem.available_stock === 0 ? (
                                <View style={styles.stockBadgeOut}>
                                  <Text style={styles.stockTextOut}>Out of Stock</Text>
                                </View>
                              ) : prodItem.available_stock > 0 && prodItem.available_stock <= 5 ? (
                                <Text style={styles.stockTextLow}>
                                  Only {prodItem.available_stock} left!
                                </Text>
                              ) : null}

                              <TouchableOpacity
                                style={styles.wishlistRow}
                                activeOpacity={0.7}
                                onPress={() => moveToWishlist(prodItem)}
                              >
                                <Feather
                                  name="heart"
                                  size={12}
                                  color={isDarkMode ? '#94A3B8' : '#64748B'}
                                />
                                <Text
                                  style={[
                                    styles.wishlist,
                                    { color: isDarkMode ? '#94A3B8' : '#64748B' },
                                  ]}
                                >
                                  Move to wishlist
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </TouchableOpacity>

                          <View style={styles.productRightCol}>
                            <View style={styles.qtyBox}>
                              <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => decreaseQty(prodItem)}
                              >
                                <Text style={styles.qtyBtnSymbol}>−</Text>
                              </TouchableOpacity>
                              <Text style={styles.qtyText}>{prodItem.qty}</Text>
                              <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => increaseQty(prodItem)}
                              >
                                <Text style={styles.qtyBtnSymbol}>+</Text>
                              </TouchableOpacity>
                            </View>

                            <View style={styles.priceContainer}>
                              {Number(
                                prodItem.actual_total ??
                                Number(prodItem.actual_price || 0) * Number(prodItem.qty || 1)
                              ) >
                                Number(
                                  prodItem.after_discount_total ??
                                  prodItem.after_discount_price ??
                                  prodItem.discount_total ??
                                  prodItem.discount_price ??
                                  0
                                ) && (
                                  <Text style={[styles.oldPrice, { color: theme.textSecondary }]}>
                                    ₹
                                    {Number(
                                      prodItem.actual_total ??
                                      Number(prodItem.actual_price || 0) * Number(prodItem.qty || 1)
                                    ).toFixed(2)}
                                  </Text>
                                )}
                              <Text style={[styles.newPrice, { color: theme.textPrimary }]}>
                                ₹
                                {Number(
                                  prodItem.after_discount_total ??
                                  prodItem.after_discount_price ??
                                  prodItem.discount_total ??
                                  prodItem.discount_price ??
                                  0
                                ).toFixed(2)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}

                  {/* Delivery / Fulfillment Method Box */}
                  <View
                    style={[
                      styles.fulfillmentBox,
                      {
                        backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                        borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                      },
                    ]}
                  >
                    <View style={styles.fulfillmentHeader}>
                      <View style={styles.fulfillmentTitleRow}>
                        <Feather name="truck" size={14} color={AllColors.primary} />
                        <Text style={[styles.fulfillmentTitle, { color: isDarkMode ? '#CBD5E1' : '#475569' }]}>
                          Delivery Method
                        </Text>
                      </View>
                      {updatingSellerId === seller.seller_id ? (
                        <ActivityIndicator size="small" color={AllColors.primary} />
                      ) : null}
                    </View>

                    {/* Mode Selection Tabs (Delivery vs Store Pickup) */}
                    {Array.isArray(seller.modes) && seller.modes.length > 0 && (
                      <View style={styles.modeTabsRow}>
                        {seller.modes.map((mode) => {
                          const isSelected = seller.selected_mode === mode;
                          const isDelivery = mode === 'delivery';
                          return (
                            <TouchableOpacity
                              key={mode}
                              activeOpacity={0.7}
                              style={[
                                styles.modeTabBtn,
                                {
                                  backgroundColor: isSelected
                                    ? isDarkMode
                                      ? 'rgba(247, 22, 112, 0.15)'
                                      : '#FFF1F7'
                                    : isDarkMode
                                      ? '#1E293B'
                                      : '#FFFFFF',
                                  borderColor: isSelected
                                    ? AllColors.primary
                                    : isDarkMode
                                      ? '#334155'
                                      : '#CBD5E1',
                                  marginRight: isDelivery ? 8 : 0,
                                },
                              ]}
                              onPress={() => handleSelectMode(seller.seller_id, mode)}
                            >
                              <Feather
                                name={isDelivery ? 'truck' : 'shopping-bag'}
                                size={15}
                                color={isSelected ? AllColors.primary : (isDarkMode ? '#94A3B8' : '#64748B')}
                              />
                              <Text
                                style={[
                                  styles.modeTabText,
                                  {
                                    color: isSelected ? AllColors.primary : theme.textPrimary,
                                    fontWeight: isSelected ? '700' : '600',
                                  },
                                ]}
                              >
                                {isDelivery ? 'Delivery' : 'Store Pickup'}
                              </Text>
                              {isSelected && (
                                <Feather
                                  name="check-circle"
                                  size={13}
                                  color={AllColors.primary}
                                  style={{ marginLeft: 4 }}
                                />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}

                    {/* Delivery Partner options if Delivery mode is chosen */}
                    {seller.selected_mode === 'delivery' && (
                      <View style={styles.deliveryOptionsContainer}>
                        {Array.isArray(seller.delivery_options) && seller.delivery_options.length > 0 ? (
                          <>
                            <Text style={[styles.chooseCourierText, { color: theme.textSecondary }]}>
                              Estimated Delivery Date:
                            </Text>
                            {seller.delivery_options.map((opt) => {
                              const isOptSelected = seller.selected_option === opt.code;
                              const estimate = formatDeliveryEstimate(opt);
                              return (
                                <TouchableOpacity
                                  key={opt.code}
                                  activeOpacity={0.7}
                                  style={[
                                    styles.courierCard,
                                    {
                                      backgroundColor: isOptSelected
                                        ? isDarkMode
                                          ? 'rgba(16, 185, 129, 0.15)'
                                          : '#F0FDF4'
                                        : isDarkMode
                                          ? '#1E293B'
                                          : '#FFFFFF',
                                      borderColor: isOptSelected
                                        ? '#10B981'
                                        : isDarkMode
                                          ? '#334155'
                                          : '#E2E8F0',
                                    },
                                  ]}
                                  onPress={() =>
                                    handleSelectDeliveryOption(seller.seller_id, opt.code)
                                  }
                                >
                                  <View style={styles.courierLeft}>
                                    <Feather
                                      name={isOptSelected ? 'check-circle' : 'circle'}
                                      size={17}
                                      color={isOptSelected ? '#10B981' : (isDarkMode ? '#64748B' : '#94A3B8')}
                                    />
                                    <View style={{ marginLeft: 8 }}>
                                      <Text
                                        style={[styles.courierName, { color: theme.textPrimary }]}
                                      >
                                        {estimate.title}
                                      </Text>
                                      {estimate.subtitle ? (
                                        <Text
                                          style={[styles.courierDays, { color: theme.textSecondary }]}
                                        >
                                          {estimate.subtitle}
                                        </Text>
                                      ) : null}
                                    </View>
                                  </View>
                                  <Text
                                    style={[
                                      styles.courierCharge,
                                      {
                                        color:
                                          Number(opt?.charge ?? opt?.rate ?? opt?.delivery_charge ?? 0) === 0
                                            ? '#10B981'
                                            : theme.textPrimary,
                                      },
                                    ]}
                                  >
                                    {Number(opt?.charge ?? opt?.rate ?? opt?.delivery_charge ?? 0) === 0
                                      ? 'FREE'
                                      : `₹${opt?.charge ?? opt?.rate ?? opt?.delivery_charge ?? 0}`}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </>
                        ) : updatingSellerId === seller.seller_id ? (
                          <View style={{ paddingVertical: 8, alignItems: 'center' }}>
                            <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                              Calculating delivery date...
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    )}

                    {/* Store Pickup Banner */}
                    {seller.selected_mode === 'pickup' && (
                      <View style={styles.pickupActiveBox}>
                        <Feather name="check-circle" size={16} color="#059669" />
                        <Text style={styles.pickupActiveText}>
                          Store Pickup selected • Free of charge. Collect directly from seller store.
                        </Text>
                      </View>
                    )}

                    {/* Delivery Error Notice if any */}
                    {seller.delivery_error ? (
                      <View style={styles.deliveryErrorBox}>
                        <Feather name="alert-circle" size={14} color="#DC2626" />
                        <Text style={styles.deliveryErrorText}>
                          {seller.delivery_error}
                        </Text>
                      </View>
                    ) : null}

                    {/* Seller Subtotal Summary (Commented out as requested)
                    {(seller.seller_subtotal != null || seller.seller_total != null) && (
                      <View
                        style={{
                          marginTop: 12,
                          paddingTop: 10,
                          borderTopWidth: 1,
                          borderTopColor: isDarkMode ? '#334155' : '#F1F5F9',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary }}>
                          Seller Subtotal ({seller.items?.length || 0} item{(seller.items?.length || 0) > 1 ? 's' : ''})
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textPrimary }}>
                          ₹{Number(seller.seller_total ?? seller.seller_subtotal).toFixed(2)}
                        </Text>
                      </View>
                    )}
                    */}



                  </View>
                </View>
              );
            }

            // Fallback for flat array items
            return (
              <View style={[styles.productCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor, borderWidth: isDarkMode ? 1 : 0 }]}>
                <View style={styles.deliveryTop} />
                <View style={[styles.line, { backgroundColor: isDarkMode ? '#334155' : '#F2F2F2' }]} />
                <View style={styles.productRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.productTouchable}
                    onPress={() =>
                      navigation.navigate('ProductDetails', {
                        id: item.product_id || item.id,
                        product_sku_id: getCartSkuId(item),
                        sku_id: getCartSkuId(item),
                        seller_id: item.seller_id || item.sellerId || item.vendor_id || item.seller?.id || item.user_id,
                        item,
                      })
                    }
                  >
                    <Image
                      source={{ uri: item.image }}
                      style={[styles.image, { backgroundColor: isDarkMode ? '#0F172A' : AllColors.white }]}
                    />

                    <View style={styles.productInfoWrapper}>
                      {item.offer ? (
                        <View style={styles.offerBadge}>
                          <Text style={styles.offerText}>
                            {item.offer}
                          </Text>
                        </View>
                      ) : null}

                      <Text
                        numberOfLines={2}
                        style={[styles.productName, { color: theme.textPrimary }]}
                      >
                        {item.name}
                      </Text>

                      {item.available === false || item.available_stock === 0 ? (
                        <View style={styles.stockBadgeOut}>
                          <Text style={styles.stockTextOut}>Out of Stock</Text>
                        </View>
                      ) : item.available_stock > 0 && item.available_stock <= 5 ? (
                        <Text style={styles.stockTextLow}>
                          Only {item.available_stock} left!
                        </Text>
                      ) : null}

                      <TouchableOpacity onPress={() => moveToWishlist(item)}>
                        <Text style={[styles.wishlist, { color: isDarkMode ? '#94A3B8' : '#555', borderColor: isDarkMode ? '#64748B' : undefined }]}>
                          Move to wishlist
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.productRightCol}>
                    <View style={styles.qtyBox}>
                      <TouchableOpacity onPress={() => decreaseQty(item)}>
                        <Text style={styles.qtyBtnSymbol}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.qty}</Text>
                      <TouchableOpacity onPress={() => increaseQty(item)}>
                        <Text style={styles.qtyBtnSymbol}>+</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.priceContainer}>
                      {Number(item.actual_total ?? (Number(item.actual_price || 0) * Number(item.qty || 1))) >
                        Number(item.after_discount_total ?? item.after_discount_price ?? item.discount_total ?? item.discount_price ?? 0) && (
                          <Text style={[styles.oldPrice, { color: theme.textSecondary }]}>
                            ₹{Number(item.actual_total ?? (Number(item.actual_price || 0) * Number(item.qty || 1))).toFixed(2)}
                          </Text>
                        )}
                      <Text style={[styles.newPrice, { color: theme.textPrimary }]}>
                        ₹{Number(item.after_discount_total ?? item.after_discount_price ?? item.discount_total ?? item.discount_price ?? 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            <>
              {/* ===== UNAVAILABLE ITEMS SECTION ===== */}
              {Array.isArray(unavailableItems) && unavailableItems.length > 0 && (
                <View
                  style={[
                    styles.unavailableSectionCard,
                    {
                      backgroundColor: theme.cardBg,
                      borderColor: isDarkMode ? '#7F1D1D' : '#FEE2E2',
                    },
                  ]}
                >
                  <View style={styles.unavailableHeaderRow}>
                    <View style={styles.unavailableHeaderLeft}>
                      <Feather name="alert-triangle" size={16} color="#DC2626" />
                      <Text
                        style={[
                          styles.unavailableTitle,
                          { color: isDarkMode ? '#FCA5A5' : '#B91C1C' },
                        ]}
                      >
                        Unavailable Items ({unavailableItems.length})
                      </Text>
                    </View>
                    <Text style={[styles.unavailableSubtext, { color: theme.textSecondary }]}>
                      These items are out of stock and cannot be purchased
                    </Text>
                  </View>

                  {unavailableItems.map((uItem, uIdx) => (
                    <View
                      key={String(uItem.cart_id || uItem.product_sku_id || uIdx)}
                      style={[
                        styles.unavailableItemRow,
                        uIdx > 0 && {
                          borderTopWidth: 1,
                          borderTopColor: isDarkMode ? '#334155' : '#FEE2E2',
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: uItem.image }}
                        style={[styles.unavailableImg, { opacity: 0.6 }]}
                      />
                      <View style={styles.unavailableItemInfo}>
                        <Text
                          numberOfLines={1}
                          style={[styles.unavailableItemName, { color: theme.textSecondary }]}
                        >
                          {uItem.name}
                        </Text>
                        <View style={styles.outOfStockPill}>
                          <Text style={styles.outOfStockPillText}>Currently Unavailable</Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.unavailableRemoveBtn}
                        onPress={() => requestForRemoveCart(uItem)}
                      >
                        <Feather name="trash-2" size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* ===== COUPON SECTION ===== */}
              <View style={[styles.couponCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor, borderWidth: isDarkMode ? 1 : 0 }]}>
                <View style={styles.couponHeader}>
                  <View style={styles.couponHeaderLeft}>
                    <MaterialCommunityIcons name="ticket-percent-outline" size={20} color={AllColors.primary} />
                    <Text style={[styles.couponHeaderText, { color: theme.textPrimary }]}>Apply Coupon</Text>
                  </View>
                  <TouchableOpacity onPress={() => setIsCouponModalVisible(true)} activeOpacity={0.7} style={styles.seeAllBtn}>
                    <Text style={styles.seeAllText}>See All</Text>
                    <Ionicons name="chevron-forward" size={15} color={AllColors.primary} />
                  </TouchableOpacity>
                </View>

                {appliedCoupon ? (
                  <View style={[styles.appliedCouponRow, { backgroundColor: isDarkMode ? 'rgba(5, 150, 105, 0.15)' : '#F0FDF4', borderColor: isDarkMode ? 'rgba(5, 150, 105, 0.4)' : '#86EFAC' }]}>
                    <View style={styles.appliedBadge}>
                      <MaterialCommunityIcons name="check-circle" size={16} color={isDarkMode ? '#34D399' : '#059669'} />
                      <Text style={[styles.appliedCode, { color: isDarkMode ? '#34D399' : '#059669' }]}>{appliedCoupon.code}</Text>
                      <Text style={[styles.appliedSaving, { color: isDarkMode ? '#34D399' : '#059669' }]}>- ₹{couponDiscount} saved</Text>
                    </View>
                    <TouchableOpacity onPress={removeCoupon} style={styles.removeBtn}>
                      <Text style={styles.removeBtnText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.couponInputRow}>
                    <TextInput
                      placeholder="Enter coupon code"
                      placeholderTextColor={isDarkMode ? '#94A3B8' : '#94A3B8'}
                      style={[styles.couponInput, { backgroundColor: isDarkMode ? '#334155' : '#F8FAFC', color: theme.textPrimary, borderColor: isDarkMode ? '#475569' : '#E2E8F0' }]}
                      value={couponCode}
                      onChangeText={setCouponCode}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity style={styles.applyBtn} onPress={applyCoupon} activeOpacity={0.85}>
                      <Text style={styles.applyBtnText}>APPLY</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* ===== BILL DETAILS ===== */}
              <View style={[styles.billCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor, borderWidth: isDarkMode ? 1 : 0 }]}>
                <Text style={[styles.billTitle, { color: theme.textPrimary }]}>Bill Details</Text>

                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: theme.textSecondary }]}>Item Total</Text>
                  <Text style={[styles.billValue, { color: theme.textPrimary }]}>
                    ₹{billSummary.actual_total || billSummary.sub_total}
                  </Text>
                </View>

                {billSummary.discount > 0 && (
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, { color: theme.textSecondary }]}>Product Discount</Text>
                    <Text style={styles.discountValue}>
                      - ₹{billSummary.discount}
                    </Text>
                  </View>
                )}

                {billSummary.total_gst > 0 && (
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, { color: theme.textSecondary }]}>
                      Taxes & GST {billSummary.cgst > 0 && billSummary.sgst > 0 ? `(CGST+SGST)` : ''}
                    </Text>
                    <Text style={[styles.billValue, { color: theme.textPrimary }]}>
                      + ₹{billSummary.total_gst}
                    </Text>
                  </View>
                )}

                {billSummary.coupon_discount > 0 && (
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, { color: theme.textSecondary }]}>Coupon Discount</Text>
                    <Text style={styles.discountValue}>
                      - ₹{billSummary.coupon_discount}
                    </Text>
                  </View>
                )}

                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: theme.textSecondary }]}>Delivery Charge</Text>
                  <Text style={[styles.billValue, { color: theme.textPrimary }]}>
                    {Number(billSummary.delivery_charge) === 0
                      ? "FREE"
                      : `₹${billSummary.delivery_charge}`}
                  </Text>
                </View>

                <View style={[styles.billDivider, { backgroundColor: isDarkMode ? '#334155' : '#F0F0F0' }]} />

                <View style={styles.billRow}>
                  <Text style={[styles.totalLabel, { color: theme.textPrimary }]}>Total Payable</Text>
                  <Text style={styles.totalValue}>
                    ₹{billSummary.total_amount}
                  </Text>
                </View>

              </View>
              <View style={[styles.bottomSectionDivider, { backgroundColor: theme.bg }]} />
            </>

          }
        />

        <View style={styles.bottomSpaceHeight} />

      </View>
      {/* ================= Fixed Bottom ================= */}
      <View style={[styles.bottomContainer, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>

        {/* Address */}
        <TouchableOpacity style={[styles.addressCard, { backgroundColor: isDarkMode ? '#1E293B' : AllColors.yellow, borderWidth: isDarkMode ? 1 : 0, borderColor: isDarkMode ? '#334155' : undefined }]}>
          <View style={styles.addressLeft}>
            <Ionicons
              name="location-outline"
              size={24}
              color={AllColors.primary}
            />

            <View style={styles.addressInfoWrapper}>
              <Text style={[styles.deliverText, { color: isDarkMode ? '#CBD5E1' : AllColors.grey }]}>
                Deliver to
              </Text>

              <Text
                numberOfLines={2}
                style={[styles.addressText, { color: isDarkMode ? '#F8FAFC' : AllColors.black }]}
              >
                {addressData?.id
                  ? `${addressData?.house_no || ""}, ${addressData?.road_name || ""}, ${addressData?.city || ""}, ${addressData?.state || ""} - ${addressData?.pin || ""}`
                  : "Select Delivery Address"}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.changeBtn, { backgroundColor: isDarkMode ? '#334155' : '#fff' }]} onPress={openAddAddress}>
            <Text style={styles.changeBtnText}>Change</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Buy Now */}
        <TouchableOpacity style={styles.buyBtn} onPress={onBuyNowPressed} activeOpacity={0.85}>
          <Text style={styles.buyText}>
            Buy Now • ₹{billSummary.total_amount}
          </Text>
        </TouchableOpacity>

      </View>
      <Modal
        visible={isModal}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalContainer, { backgroundColor: theme.modalBg }]}
          >
            <View style={[styles.dragBar, { backgroundColor: isDarkMode ? '#475569' : '#D9D9D9' }]} />

            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Select Delivery Address
            </Text>
            <TouchableOpacity
              style={styles.addAddressMargin}
              onPress={() => {
                setIsModal(false);
                setAddressModal(false);
                navigation.navigate('SaveAddress', { fromCart: true, returnScreen: 'CartPage' });
              }}
            >
              <Text style={styles.addAddressText}>+Add New Address</Text>
            </TouchableOpacity>

            <FlatList
              data={addressList}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = String(addressId || addressData?.id || selectedAddressIdRef.current) === String(item.id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalAddressCard,
                      { backgroundColor: isDarkMode ? '#334155' : '#fff', borderColor: isDarkMode ? '#475569' : '#E8E8E8' },
                      isSelected && styles.selectedCard,
                    ]}
                    onPress={() => handleSelectAddress(item)}
                  >
                    <View style={styles.addressTop}>
                      <View style={[styles.typeBadge, { backgroundColor: isDarkMode ? '#1E293B' : '#F5F5F5' }]}>
                        <Text style={[styles.typeText, { color: isDarkMode ? '#CBD5E1' : '#444' }]}>
                          {item.type}
                        </Text>
                      </View>

                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={AllColors.primary}
                        />
                      )}
                    </View>

                    <Text style={[styles.modalAddressName, { color: theme.textPrimary }]}>
                      {item.name} • {item.mobile}
                    </Text>

                    <Text style={[styles.modalAddressText, { color: theme.textSecondary }]}>
                      {item.house_no}, {item.road_name},
                      {"\n"}
                      {item.landmark},
                      {"\n"}
                      {item.city}, {item.state} - {item.pin}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
            {/* Live Location */}
            <TouchableOpacity style={styles.liveLocationBtn} onPress={gotoMAP}>
              <Ionicons
                name="locate"
                size={22}
                color={AllColors.primary}
              />
              <Text style={styles.liveLocationText}>
                Use Live Location
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ================= Payment Method Modal ================= */}
      <Modal
        visible={isPaymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPaymentModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsPaymentModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.paymentModalContainer, { backgroundColor: theme.modalBg }]}
          >
            <View style={[styles.dragBar, { backgroundColor: isDarkMode ? '#475569' : '#D9D9D9' }]} />
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Choose Payment Method</Text>

            <View style={styles.paymentOptionList}>
              {/* COD Option */}
              <TouchableOpacity
                style={[
                  styles.paymentOptionCard,
                  {
                    backgroundColor: isDarkMode ? '#334155' : '#F8FAFC',
                    borderColor: isDarkMode ? '#475569' : '#E2E8F0',
                  },
                  paymentMethod === 'cod' && {
                    borderColor: AllColors.primary,
                    backgroundColor: isDarkMode ? 'rgba(247, 22, 112, 0.15)' : '#FFF1F7',
                  },
                ]}
                onPress={() => setPaymentMethod('cod')}
                activeOpacity={0.8}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={[styles.paymentIconBox, { backgroundColor: isDarkMode ? 'rgba(22, 101, 52, 0.25)' : '#DCFCE7' }]}>
                    <MaterialCommunityIcons name="cash-multiple" size={24} color={isDarkMode ? '#4ADE80' : '#166534'} />
                  </View>
                  <View style={styles.paymentTextWrapper}>
                    <Text style={[styles.paymentOptionTitle, { color: theme.textPrimary }]}>Cash on Delivery (COD)</Text>
                    <Text style={[styles.paymentOptionSub, { color: theme.textSecondary }]}>Pay with cash upon order delivery</Text>
                  </View>
                </View>
                <Ionicons
                  name={paymentMethod === 'cod' ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={paymentMethod === 'cod' ? AllColors.primary : (isDarkMode ? '#64748B' : '#94A3B8')}
                />
              </TouchableOpacity>

              {/* Online Payment Option */}
              <TouchableOpacity
                style={[
                  styles.paymentOptionCard,
                  {
                    backgroundColor: isDarkMode ? '#334155' : '#F8FAFC',
                    borderColor: isDarkMode ? '#475569' : '#E2E8F0',
                  },
                  paymentMethod === 'cashfree' && {
                    borderColor: AllColors.primary,
                    backgroundColor: isDarkMode ? 'rgba(247, 22, 112, 0.15)' : '#FFF1F7',
                  },
                ]}
                onPress={() => setPaymentMethod('cashfree')}
                activeOpacity={0.8}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={[styles.paymentIconBox, { backgroundColor: isDarkMode ? 'rgba(7, 89, 133, 0.25)' : '#E0F2FE' }]}>
                    <MaterialCommunityIcons name="credit-card-outline" size={24} color={isDarkMode ? '#38BDF8' : '#075985'} />
                  </View>
                  <View style={styles.paymentTextWrapper}>
                    <Text style={[styles.paymentOptionTitle, { color: theme.textPrimary }]}>Online Payment</Text>
                    <Text style={[styles.paymentOptionSub, { color: theme.textSecondary }]}>Pay via UPI, Cards, Net Banking & Wallets</Text>
                  </View>
                </View>
                <Ionicons
                  name={paymentMethod === 'cashfree' ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={paymentMethod === 'cashfree' ? AllColors.primary : (isDarkMode ? '#64748B' : '#94A3B8')}
                />
              </TouchableOpacity>
            </View>

            {/* Total Summary */}
            <View style={[styles.paymentTotalRow, { borderTopColor: theme.divider }]}>
              <Text style={[styles.paymentTotalLabel, { color: theme.textSecondary }]}>Total Payable:</Text>
              <Text style={styles.paymentTotalValue}>₹{billSummary.total_amount}</Text>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              style={[styles.confirmOrderBtn, isPlacingOrder && { opacity: 0.7 }]}
              onPress={() => requestForOder(paymentMethod)}
              disabled={isPlacingOrder}
              activeOpacity={0.85}
            >
              {isPlacingOrder ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmOrderText}>
                  {paymentMethod === 'cod' ? 'Confirm & Place Order (COD)' : 'Proceed to Pay Online'}
                </Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ================= All Coupons Modal ================= */}
      <Modal
        visible={isCouponModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCouponModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsCouponModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.couponModalContainer, { backgroundColor: theme.modalBg }]}
          >
            <View style={[styles.dragBar, { backgroundColor: isDarkMode ? '#475569' : '#D9D9D9' }]} />
            <View style={styles.couponModalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary, marginBottom: 0 }]}>Available Coupons</Text>
              <TouchableOpacity onPress={() => setIsCouponModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={COUPONS_DATA}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 10 }}
              renderItem={({ item }) => {
                const isSelected = appliedCoupon?.code === item.code;
                return (
                  <View style={[
                    styles.couponListItem,
                    {
                      backgroundColor: isDarkMode ? '#334155' : '#F8FAFC',
                      borderColor: isSelected ? AllColors.primary : (isDarkMode ? '#475569' : '#E2E8F0'),
                    }
                  ]}>
                    <View style={styles.couponListLeft}>
                      <View style={styles.couponBadge}>
                        <Text style={styles.couponBadgeText}>{item.discount}</Text>
                      </View>
                      <View>
                        <Text style={[styles.couponListTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                        <Text style={[styles.couponListDesc, { color: theme.textSecondary }]}>{item.description}</Text>
                        <Text style={[styles.couponMinSpend, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                          Min Spend: ₹{item.minSpend} • Valid till {item.validTill}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.couponApplyBtn,
                        isSelected && styles.couponAppliedBtn,
                        { backgroundColor: isSelected ? '#10B981' : AllColors.primary }
                      ]}
                      onPress={() => applyCoupon(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.couponApplyBtnText}>
                        {isSelected ? 'APPLIED' : 'APPLY'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ================= Custom Coupon Alert Modal ================= */}
      <CustomAlert
        visible={couponAlert.visible}
        title={couponAlert.title}
        message={couponAlert.message}
        type="error"
        confirmText="Got It"
        onConfirm={closeCouponAlert}
        onClose={closeCouponAlert}
      />
    </SafeAreaView>
  );
};

export default CartPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AllColors.lightPink,
  },
  paymentModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    maxHeight: '75%',
  },
  paymentOptionList: {
    marginVertical: 16,
    gap: 12,
  },
  paymentOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  selectedPaymentCard: {
    borderColor: AllColors.primary,
    backgroundColor: '#FFF1F7',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  paymentIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  paymentOptionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  paymentTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 16,
  },
  paymentTotalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  paymentTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: AllColors.primary,
  },
  confirmOrderBtn: {
    height: 50,
    backgroundColor: AllColors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: AllColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  confirmOrderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  //---------//// bill ////----------
  billCard: {
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginVertical: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    elevation: 2,
  },

  billTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 10,
  },

  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },

  billLabel: {
    fontSize: 14,
    color: "#666",
  },

  billValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },

  discountValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E9E45",
  },


  couponCard: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginVertical: 6,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    elevation: 2,
  },
  couponHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  couponHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: AllColors.primary,
  },
  couponModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingBottom: 24,
    paddingTop: 12,
    maxHeight: '75%',
  },
  couponModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalCloseBtn: {
    padding: 4,
  },
  couponListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  couponListLeft: {
    flex: 1,
    marginRight: 10,
  },
  couponBadge: {
    alignSelf: 'flex-start',
    backgroundColor: AllColors.lightPink,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AllColors.primary,
    marginBottom: 6,
  },
  couponBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: AllColors.primary,
  },
  couponListTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  couponListDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  couponMinSpend: {
    fontSize: 11,
    marginTop: 4,
  },
  couponApplyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponAppliedBtn: {
    backgroundColor: '#10B981',
  },
  couponApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  customAlertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  customAlertBox: {
    width: '100%',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  alertIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  customAlertTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  customAlertMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  customAlertBtn: {
    width: '100%',
    height: 46,
    backgroundColor: AllColors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customAlertBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  couponInput: {
    flex: 1,
    height: 46,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  applyBtn: {
    height: 46,
    paddingHorizontal: 18,
    backgroundColor: AllColors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  appliedCouponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  appliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  appliedCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  appliedSaving: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  removeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  removeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },

  billDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 8,
  },

  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
  },

  totalValue: {
    fontSize: 17,
    fontWeight: "700",
    color: AllColors.primary,
  },


  /* ================= Modal ================= */

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: "#fff",
    height: "55%",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 18,
    paddingTop: 12,
  },

  dragBar: {
    width: 45,
    height: 5,
    borderRadius: 10,
    backgroundColor: "#D9D9D9",
    alignSelf: "center",
    marginBottom: 18,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginBottom: 18,
  },

  liveLocationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: AllColors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 18,
  },

  liveLocationText: {
    marginLeft: 8,
    color: AllColors.primary,
    fontWeight: "700",
    fontSize: 15,
  },

  modalAddressCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    padding: 15,
    marginBottom: 14,
  },

  selectedCard: {
    borderColor: AllColors.primary,
    borderWidth: 2,
  },

  addressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  typeBadge: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  typeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
  },

  modalAddressName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginTop: 12,
  },

  modalAddressText: {
    fontSize: 14,
    color: "#666",
    marginTop: 6,
    lineHeight: 22,
  },

  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },

  changeBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: AllColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  changeBtnText: {
    color: AllColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: AllColors.white,
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: "#ECECEC",
    elevation: 15,
    shadowColor: AllColors.black,
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },

  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AllColors.yellow,
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 14,
    marginBottom: 12,
  },

  addressLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  deliverText: {
    fontSize: 12,
    color: AllColors.grey,
  },

  addressText: {
    fontSize: 15,
    fontWeight: "600",
    color: AllColors.black,
    marginTop: 2,
  },

  buyBtn: {
    backgroundColor: AllColors.primary,
    height: 40,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  buyText: {
    color: AllColors.white,
    fontSize: 17,
    fontWeight: "700",
  },
  header: {
    height: 56 + STATUSBAR_HEIGHT,
    paddingTop: STATUSBAR_HEIGHT,
    backgroundColor: AllColors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    elevation: 2,
  },

  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: "700",
    color: AllColors.black,
    marginLeft: 8,
  },

  /* Banner */

  banner: {
    flexDirection: "row",
    backgroundColor: AllColors.yellow,
    marginHorizontal: 10,
    marginVertical: 8,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },

  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: AllColors.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  bannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },

  bannerSub: {
    fontSize: 12,
    color: AllColors.black,
    marginTop: 2,
  },
  /* Card */
  productCard: {
    backgroundColor: AllColors.white,
    marginHorizontal: 10,
    marginVertical: 6,
    borderRadius: 14,
    elevation: 2,
    overflow: "hidden",
  },

  deliveryTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  timeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: AllColors.yellow,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  deliveryTime: {
    fontSize: 14,
    fontWeight: "600",
    color: AllColors.black,
  },

  shipment: {
    fontSize: 11,
    color: AllColors.grey,
    marginTop: 2,
  },

  line: {
    height: 1,
    backgroundColor: "#F2F2F2",
  },

  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  image: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: AllColors.white,
  },
  offerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#DFF0FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },

  offerText: {
    color: "#0A66C2",
    fontWeight: "600",
    fontSize: 10,
  },

  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    lineHeight: 18,
  },

  size: {
    color: "#777",
    fontSize: 11,
    marginTop: 3,
  },

  wishlist: {
    color: "#555",
    fontSize: 11,
    marginTop: 6,
    borderBottomWidth: 1,
    borderStyle: "dashed",
    alignSelf: "flex-start",
  },

  qtyBox: {
    width: 68,
    height: 32,
    backgroundColor: "#2F8F1E",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },

  qtyBtn: {
    color: AllColors.white,
    fontSize: 24,
    fontWeight: "700",
  },

  qtyText: {
    color: AllColors.white,
    fontSize: 14,
    fontWeight: "700",
  },

  oldPrice: {
    textDecorationLine: "line-through",
    color: "#999",
    textAlign: "right",
    fontSize: 11,
  },

  newPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: AllColors.black,
    textAlign: "right",
  },
  buyBtn: {
    backgroundColor: AllColors.primary,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  buyText: {
    color: AllColors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
  },

  // ===== COUPON STYLES =====
  couponCard: {
    backgroundColor: AllColors.white,
    marginHorizontal: 10,
    marginVertical: 6,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    elevation: 2,
  },
  couponHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  couponHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: AllColors.slateHeader,
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  couponInput: {
    flex: 1,
    height: 46,
    backgroundColor: AllColors.screenBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AllColors.lightGrey,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    color: AllColors.slateDark,
    letterSpacing: 0.5,
  },
  applyBtn: {
    height: 46,
    paddingHorizontal: 18,
    backgroundColor: AllColors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: AllColors.white,
    letterSpacing: 0.5,
  },
  appliedCouponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AllColors.greenSoftBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: AllColors.lightGreen,
  },
  appliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  appliedCode: {
    fontSize: 13,
    fontWeight: '800',
    color: AllColors.greenSoftText,
    letterSpacing: 0.5,
  },
  appliedSaving: {
    fontSize: 12,
    color: AllColors.greenSoftText,
    fontWeight: '600',
  },
  removeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  removeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: AllColors.redLight,
  },
  continueShopBtn: {
    marginHorizontal: 10,
  },
  scrollFlexGrow: {
    flexGrow: 1,
  },
  headerRightRow: {
    flexDirection: 'row',
  },
  productTouchable: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  productInfoWrapper: {
    flex: 1,
    marginLeft: 15,
  },
  priceContainer: {
    marginTop: 10,
  },
  bottomSectionDivider: {
    width: '100%',
    height: 50,
    backgroundColor: AllColors.divider,
  },
  bottomSpaceHeight: {
    height: 120,
  },
  addressInfoWrapper: {
    marginLeft: 10,
    flex: 1,
  },
  addAddressMargin: {
    margin: 10,
  },
  addAddressText: {
    color: AllColors.primary,
    textAlign: 'right',
    fontSize: 18,
  },
  paymentTextWrapper: {
    marginLeft: 12,
    flex: 1,
  },

  // ===== MULTI-SELLER & FULFILLMENT STYLES =====
  sellerGroupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 12,
    marginBottom: 14,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sellerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  sellerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  sellerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFF1F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sellerGroupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  sellerBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  sellerItemsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  groupProductItem: {
    paddingVertical: 8,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productTouchable: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  productInfoWrapper: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 18,
  },
  wishlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  wishlist: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 4,
  },
  productRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 68,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 7,
    paddingHorizontal: 4,
    height: 26,
  },
  qtyBtn: {
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  qtyBtnSymbol: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 16,
  },
  qtyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  oldPrice: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  newPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  fulfillmentBox: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  fulfillmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fulfillmentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fulfillmentTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  modeTabsRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  modeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 9,
    borderWidth: 1.5,
  },
  modeTabText: {
    fontSize: 13,
    marginLeft: 5,
  },
  deliveryOptionsContainer: {
    marginTop: 4,
  },
  chooseCourierText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
    marginTop: 4,
  },
  courierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 9,
    borderRadius: 9,
    borderWidth: 1.5,
    marginBottom: 6,
    backgroundColor: '#FFFFFF',
  },
  courierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  courierName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  courierDays: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  courierCharge: {
    fontSize: 13,
    fontWeight: '700',
  },
  pickupActiveBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  pickupActiveText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },
  sellerSummaryFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sellerSummaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  sellerSummaryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  sellerSummaryVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  sellerSummaryTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  sellerSummaryTotalVal: {
    fontSize: 14,
    fontWeight: '800',
    color: AllColors.primary,
  },
});
const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AllColors.screenBg,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  animation: {
    width: 280,
    height: 280,
    marginBottom: 15,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: AllColors.slateDark,
    marginBottom: 10,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    color: AllColors.slateSub,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 35,
    paddingHorizontal: 15,
  },

  loginBtn: {
    width: "100%",
    height: 42,
    backgroundColor: AllColors.primary,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",

    shadowColor: AllColors.shadow,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },

  loginText: {
    color: AllColors.white,
    fontSize: 14,
    fontWeight: "700",
  },

  iconBox: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
    shadowColor: AllColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },

  continueShopBtn: {
    width: "100%",
    height: 42,
    borderWidth: 1.5,
    borderColor: AllColors.primary,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },

  continueShopText: {
    color: AllColors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  variantText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  stockBadgeOut: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  stockTextOut: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '700',
  },
  stockTextLow: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },
  deliveryErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 8,
  },
  deliveryErrorText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },
  sellerSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  sellerSummaryCol: {
    alignItems: 'center',
  },
  sellerSummaryLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  sellerSummaryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  sellerSummaryValBold: {
    fontSize: 13,
    fontWeight: '800',
    color: AllColors.primary,
  },
  unavailableSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginHorizontal: 12,
    marginBottom: 14,
    padding: 14,
  },
  unavailableHeaderRow: {
    marginBottom: 10,
  },
  unavailableHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unavailableTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  unavailableSubtext: {
    fontSize: 11,
    marginTop: 2,
    marginLeft: 22,
  },
  unavailableItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  unavailableImg: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  unavailableItemInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
  },
  unavailableItemName: {
    fontSize: 12,
    fontWeight: '600',
  },
  unavailableVariantText: {
    fontSize: 10,
    marginTop: 1,
  },
  outOfStockPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  outOfStockPillText: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: '700',
  },
  unavailableRemoveBtn: {
    padding: 8,
  },
});

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F8F9FC",
//   },
// });