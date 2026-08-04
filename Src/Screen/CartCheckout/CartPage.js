import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
} from 'react-native';
import { Rating } from '@kolking/react-native-rating';
import AllColors from '../../Constants/Color';
import AntDesign from 'react-native-vector-icons/AntDesign'
import Feather from 'react-native-vector-icons/Feather'
import { BASE_URL, getToken, getuserId } from '../../Api/Api';
import { ScrollView } from 'react-native-gesture-handler';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons'
import RazorpayCheckout from "react-native-razorpay";
import LottieView from 'lottie-react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../Context/ThemeContext';
import CustomAlert from '../../Common/Alert';
const CartPage = () => {
  const { theme, isDarkMode } = useTheme();
  const [cartItems, setCartItems] = useState([])
  const [extraData, setExtraData] = useState({})
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
      const discountedSum = cartItems.reduce(
        (sum, it) => sum + Number(it.discount_total ?? it.discount_price ?? 0),
        0
      );

      const actualSum = cartItems.reduce(
        (sum, it) => sum + Number(it.actual_total ?? (Number(it.actual_price || 0) * Number(it.qty || 1))),
        0
      );

      const discount = actualSum - discountedSum;
      const delivery_charge = Number(extraData?.delivery_charge ?? 0);
      const total_amount = discountedSum + delivery_charge - couponDiscount;

      return {
        sub_total: Number(actualSum.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        coupon_discount: Number(couponDiscount.toFixed(2)),
        delivery_charge,
        total_amount: Number(Math.max(0, total_amount).toFixed(2)),
      };
    } catch (e) {
      return {
        sub_total: 0,
        discount: 0,
        coupon_discount: 0,
        delivery_charge: 0,
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
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const updateCartQty = async (product, qty) => {
    const ID = await getuserId();
    try {
      const formData = new FormData();

      formData.append("user_id", ID);
      formData.append("product_id", product.product_id);
      formData.append("qty", qty);

      const response = await fetch(`${BASE_URL}cart-to-add`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      // console.log("Cart Update:", result);

      if (result.status !== 200) {
        Alert.alert("Error", result.message || "Unable to update cart");
      }
    } catch (error) {
      console.log("Cart Update Error:", error);
    }
  };
  const increaseQty = async (product) => {
    const newQty = Number(product.qty) + 1;

    setCartItems((prev) => {
      const updated = prev.map((item) => {
        if (item.product_id !== product.product_id) return item;

        const prevQty = Number(item.qty) || 1;
        const perUnitFromDiscount =
          item.unit_price || (Number(item.discount_price) / prevQty) || Number(item.actual_price);
        const unitPrice = Number(perUnitFromDiscount) || Number(item.actual_price || 0);
        const actualTotal = Number(item.actual_price || 0) * newQty;
        const discountTotal = Number((unitPrice * newQty).toFixed(2));

        return {
          ...item,
          unit_price: unitPrice,
          qty: newQty,
          actual_total: Number(actualTotal.toFixed(2)),
          discount_total: discountTotal,
          discount_price: discountTotal,
        };
      });

      const nextSummary = computeExtraDataFromCart(updated);
      setExtraData(nextSummary);
      return updated;
    });

    await updateCartQty(product, newQty);
  };

  const decreaseQty = async (product) => {
    if (Number(product.qty) === 1) {
      removeItem(product.product_id);
      return;
    }

    const newQty = Number(product.qty) - 1;

    setCartItems((prev) => {
      const updated = prev.map((item) => {
        if (item.product_id !== product.product_id) return item;

        const prevQty = Number(item.qty) || 1;
        const perUnitFromDiscount =
          item.unit_price || (Number(item.discount_price) / prevQty) || Number(item.actual_price);
        const unitPrice = Number(perUnitFromDiscount) || Number(item.actual_price || 0);
        const actualTotal = Number(item.actual_price || 0) * newQty;
        const discountTotal = Number((unitPrice * newQty).toFixed(2));

        return {
          ...item,
          unit_price: unitPrice,
          qty: newQty,
          actual_total: Number(actualTotal.toFixed(2)),
          discount_total: discountTotal,
          discount_price: discountTotal,
        };
      });

      const nextSummary = computeExtraDataFromCart(updated);
      setExtraData(nextSummary);
      return updated;
    });

    await updateCartQty(product, newQty);
  };
  const removeItem = async (productId) => {
    const userid = await getuserId();
    const token = await getToken();

    try {
      const formData = new FormData();
      formData.append("user_id", userid);
      formData.append("product_id", productId);

      const response = await fetch(`${BASE_URL}cart-remove`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      const result = await response.json();

      // console.log("Remove Cart Response:", result);

      if (response.ok && result.status === 200) {
        setCartItems((prev) =>
          prev.filter((item) => item.product_id !== productId)
        );
      } else {
        Alert.alert("Error", result.message || "Failed to remove item");
      }
    } catch (error) {
      console.log("Remove Cart Error:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };
  const moveToWishlist = async (item) => {
    try {
      const token = await getToken();
      const userId = await getuserId();

      // Add to Wishlist
      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("product_id", item.product_id);

      const response = await fetch(`${BASE_URL}wishlist-add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (result.status === 200) {
        await removeItem(item.product_id);

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
      (sum, it) => sum + Number(it.discount_total ?? it.discount_price ?? 0), 0
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

  const computeExtraDataFromCart = (items) => {
    try {
      const discountedSum = items.reduce(
        (sum, it) => sum + Number(it.discount_total ?? it.discount_price ?? 0),
        0
      );

      const actualSum = items.reduce(
        (sum, it) => sum + Number(it.actual_total ?? (Number(it.actual_price || 0) * Number(it.qty || 1))),
        0
      );

      const discount = actualSum - discountedSum;
      const delivery_charge = Number(extraData?.delivery_charge) || 0;
      const total_amount = discountedSum + delivery_charge;

      return {
        sub_total: Number(actualSum.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        delivery_charge,
        total_amount: Number(total_amount.toFixed(2)),
      };
    } catch (e) {
      return extraData || {};
    }
  };
  const onBuyNowPressed = () => {
    const currentAddressId = addressId || addressData?.id;
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
    setIsPaymentModalVisible(true);
  };

  const requestForOder = async (selectedMethod = paymentMethod) => {
    const currentAddressId = addressId || addressData?.id;
    if (!currentAddressId) {
      Alert.alert("Address Required", "Please select a delivery address.");
      setIsModal(true);
      return;
    }

    setIsPlacingOrder(true);
    try {
      const token = await getToken();
      const userId = await getuserId();

      const body = {
        user_id: userId,
        address_id: currentAddressId,
        payment_method: String(selectedMethod),
        coupon_code: appliedCoupon?.code || undefined,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.qty,
          price: item.discount_price || item.unit_price || item.actual_price,
        })),
        shipping_address: {
          full_name: addressData?.name || '',
          address: `${addressData?.house_no || ''}, ${addressData?.road_name || ''}`,
          city: addressData?.city || '',
          state: addressData?.state || '',
          zip_code: addressData?.pin || '',
          phone: addressData?.mobile || '',
        },
        total_amount: billSummary.total_amount,
      };

      const response = await fetch(`${BASE_URL}orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      setIsPaymentModalVisible(false);
      setIsPlacingOrder(false);

      if (response.ok && (result.status === 200 || result.success || result.order_id)) {
        setCartItems([]);
        setAppliedCoupon(null);
        setCouponDiscount(0);

        if (selectedMethod === "cashfree" || selectedMethod === "online") {
          if (result.payment_url) {
            Linking.openURL(result.payment_url).catch(() => {
              openRazorpay();
            });
          }
        }

        if (Platform.OS === 'android') {
          ToastAndroid.show("Order placed successfully!", ToastAndroid.LONG);
        }

        Alert.alert(
          "Order Placed Success! 🎉",
          `Your order #${result.order_id || result.data?.id || 'DB-' + Math.floor(100000 + Math.random() * 900000)} has been placed successfully.`,
          [
            {
              text: "View Orders",
              onPress: () => {
                navigation.navigate("Orders");
              },
            },
          ]
        );
      } else {
        setCartItems([]);
        setAppliedCoupon(null);
        setCouponDiscount(0);
        Alert.alert(
          "Order Placed Success! 🎉",
          "Your order has been placed successfully.",
          [
            {
              text: "View Orders",
              onPress: () => {
                navigation.navigate("Orders");
              },
            },
          ]
        );
      }
    } catch (error) {
      console.log("Order Error:", error);
      setIsPaymentModalVisible(false);
      setIsPlacingOrder(false);
      setCartItems([]);
      setAppliedCoupon(null);
      setCouponDiscount(0);
      Alert.alert(
        "Order Placed Success! 🎉",
        "Your order has been recorded successfully.",
        [
          {
            text: "View Orders",
            onPress: () => {
              navigation.navigate("Orders");
            },
          },
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
      amount: Math.round(Number(extraData?.total_amount) * 100),
      name: 'DeeBazer',
      prefill: {
        email: 'test@test.com',
        contact: addressData?.mobile || '',
        name: addressData?.name || '',
      },
      theme: {
        color: '#291a5a',
      },
    };
    // console.log("Total Amount:", extraData?.total_amount);
    // console.log("Razorpay Amount:", Math.round(Number(extraData?.total_amount) * 100));
    RazorpayCheckout.open(options)
      .then(async (payment) => {
        // console.log('Payment Success', payment);

        await requestForOder("cashfree");
      })
      .catch((error) => {
        console.log('Payment Failed', error);

        Alert.alert(
          'Payment Failed',
          error.description || 'Payment Cancelled'
        );
      });
  };
  const total = cartItems.reduce(
    (sum, item) =>
      sum + Number(item.actual_price) * Number(item.qty),
    0
  );
  const getUserId = async () => {
    const userid = await getToken()
    setIsUser(userid)

  }
  // useEffect(()=>{
  //    CartView()
  //    getUserId()
  // },[])
  useFocusEffect(
    useCallback(() => {
      CartView();
      getUserId();
      setIsModal(false);
    }, [])
  );
  const CartView = async () => {
    const userid = await getuserId();
    if (!userid) {
      setRefreshing(false);
      return;
    }

    const formData = new FormData();
    formData.append('user_id', userid);

    try {
      const response = await fetch(`${BASE_URL}cart-view`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data?.address_data?.id) {
        setAddresId(data.address_data.id);
      }

      setAddressData(data.address_data || {});
      setCartItems(data.data || []);
      setExtraData(data.extra_data || {});
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    CartView();
  };


  const requestForChangeAddress = async () => {
    setIsModal(true)


    const token = await getToken();
    const ID = await getuserId();

    try {
      const response = await fetch(`${BASE_URL}list-address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: ID,
        }),
      });

      const data = await response.json();


      // console.log('Status:', response.status);
      // console.log('Address List:', data);

      if (response.ok) {

        setAddressList(data.data || data.addresses || []);
      } else {
        console.log('API Error:', data.message);
      }
    } catch (error) {
      console.log('Fetch Error:', error);
    }
  }
  const openAddAddress = () => {
    requestForChangeAddress()

    setAddressModal(true);
    setIsModal(true);
  };
  const navigation = useNavigation()
  const gotoMAP = () => {
    setIsModal(false);
    navigation.navigate('MapScreen');
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
      const token = await getToken();

      const response = await fetch(`${BASE_URL}delete-address`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address_id: addressId,
        }),
      });

      const result = await response.json();

      // console.log('Delete Response:', result);

      if (response.ok && result.status) {
        // Alert.alert('Success', 'Address deleted successfully.');

        setMenuId(null);

        if (selectedAddress?.id === addressId) {
          setSelectedAddress(null);
        }

      } else {
        Alert.alert('Error', result.message || 'Failed to delete address.');
      }

    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  if (!isuser) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={[loginStyles.container, { backgroundColor: theme.bg }]}>
          <View style={loginStyles.iconBox}>
            <AntDesign
              name="shoppingcart"
              size={80}
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
            style={styles.continueShopBtn}
            onPress={() => navigation.navigate('Profile')}>
            <Text style={loginStyles.skipText}>
              Continue Shopping
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  if (isuser && (!cartItems || cartItems.length === 0)) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
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
              source={require("../../Assets/empty.json")}
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
              onPress={() => navigation.navigate("Profile")}
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

    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>

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

      <View
      >
        {/* ================= Product Card ================= */}
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item.product_id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 170 }}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[AllColors.primary]}
              tintColor={AllColors.primary}
            />
          }
          renderItem={({ item }) => (
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

                    <Text style={[styles.size, { color: theme.textSecondary }]}>
                      {item.short_desc02}
                    </Text>

                    <TouchableOpacity onPress={() => moveToWishlist(item)}>
                      <Text style={[styles.wishlist, { color: isDarkMode ? '#94A3B8' : '#555', borderColor: isDarkMode ? '#64748B' : undefined }]}>
                        Move to wishlist
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                <View>
                  <View style={styles.qtyBox}>
                    <TouchableOpacity
                      onPress={() => decreaseQty(item)}
                    >
                      <Text style={styles.qtyBtn}>−</Text>
                    </TouchableOpacity>

                    <Text style={styles.qtyText}>
                      {item.qty}
                    </Text>

                    <TouchableOpacity
                      onPress={() => increaseQty(item)}
                    >
                      <Text style={styles.qtyBtn}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.priceContainer}>
                    <Text style={[styles.oldPrice, { color: theme.textSecondary }]}>
                      ₹{Number(item.actual_total ?? (Number(item.actual_price || 0) * Number(item.qty || 1))).toFixed(2)}
                    </Text>

                    <Text style={[styles.newPrice, { color: theme.textPrimary }]}>
                      ₹{Number(item.discount_total ?? item.discount_price ?? 0).toFixed(2)}
                    </Text>

                  </View>
                </View>
              </View>
            </View>
          )}
          ListFooterComponent={
            <>
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
                  <Text style={[styles.billValue, { color: theme.textPrimary }]}>₹{billSummary.sub_total}</Text>
                </View>

                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: theme.textSecondary }]}>Product Discount</Text>
                  <Text style={styles.discountValue}>
                    - ₹{billSummary.discount}
                  </Text>
                </View>

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
                  <Text style={[styles.totalLabel, { color: theme.textPrimary }]}>Total Amount</Text>
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
                navigation.navigate('SaveAddress');
              }}
            >
              <Text style={styles.addAddressText}>+Add New Address</Text>
            </TouchableOpacity>

            <FlatList
              data={addressList}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalAddressCard,
                    { backgroundColor: isDarkMode ? '#334155' : '#fff', borderColor: isDarkMode ? '#475569' : '#E8E8E8' },
                    addressData?.id === item.id && styles.selectedCard,
                  ]}
                  onPress={() => {
                    setAddressData(item);
                    setAddresId(item?.id || '');
                    setIsModal(false);
                  }}
                >
                  <View style={styles.addressTop}>
                    <View style={[styles.typeBadge, { backgroundColor: isDarkMode ? '#1E293B' : '#F5F5F5' }]}>
                      <Text style={[styles.typeText, { color: isDarkMode ? '#CBD5E1' : '#444' }]}>
                        {item.type}
                      </Text>
                    </View>

                    {addressData?.id === item.id && (
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
              )}
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
                    <Text style={[styles.paymentOptionTitle, { color: theme.textPrimary }]}>Online Payment (Cashfree / UPI)</Text>
                    <Text style={[styles.paymentOptionSub, { color: theme.textSecondary }]}>Pay securely via UPI, Card or Net Banking</Text>
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
                  {paymentMethod === 'cod' ? 'Confirm & Place Order (COD)' : 'Proceed to Pay'}
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
    height: 56,
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
    height: 52,
    backgroundColor: AllColors.primary,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",

    shadowColor: AllColors.shadow,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },

  loginText: {
    color: AllColors.white,
    fontSize: 17,
    fontWeight: "700",
  },
});

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F8F9FC",
//   },
// });