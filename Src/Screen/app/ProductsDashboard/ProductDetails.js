import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ToastAndroid,
  Platform,
  Alert,
  Share,
  ActivityIndicator,
  StatusBar,
  FlatList,
  Dimensions,
  ScrollView,
  BackHandler,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AllColors from '../../../Constants/Color';
import { STATUSBAR_HEIGHT } from '../../../Constants/ScreenUtils';
import { BASE_URL, getToken, getuserId } from '../../../Api/Api';
import { useTheme } from '../../../Context/ThemeContext';
import DifferentSellerModal from '../../../Common/DifferentSellerModal';
import {
  checkDifferentSeller,
  saveActiveCartSeller,
  getActiveCartSeller,
  clearActiveCartSeller,
  getCartSkuId,
  isCartItemMatching,
} from '../../../Common/sellerUtils';

const { width } = Dimensions.get('window');
const slideWidth = width - 32;

export default function ProductDetails({ route }) {
  const { theme, isDarkMode } = useTheme();
  const [product, setProduct] = useState({});
  const [productImage, setProductImage] = useState(null);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [cartList, setCartList] = useState([]);
  const [sellerModalVisible, setSellerModalVisible] = useState(false);
  const [sellerModalData, setSellerModalData] = useState({
    cartSellerName: '',
    cartSellerId: null,
    targetSellerName: '',
    targetSellerId: null,
    targetProduct: null,
  });

  const { id, product_sku_id, sku_id, seller_id, sellerId, vendor_id, item } = route.params || {};
  const navigation = useNavigation();

  const [skuData, setSkuData] = useState(null);
  const [productInfo, setProductInfo] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedSkuId, setSelectedSkuId] = useState(
    sku_id ?? product_sku_id ?? item?.product_sku_id ?? item?.sku_id ?? item?.sku?.id
  );
  const [selectedSellerId, setSelectedSellerId] = useState(
    seller_id ??
    sellerId ??
    vendor_id ??
    item?.seller_id ??
    item?.sellerId ??
    item?.vendor_id ??
    item?.seller?.id ??
    item?.user_id ??
    null
  );

  const getProductImages = () => {
    const list = [];
    if (skuData?.image && typeof skuData.image === 'string' && skuData.image.trim()) {
      list.push(skuData.image);
    }
    if (product?.image) {
      if (Array.isArray(product.image)) {
        product.image.forEach((img) => {
          if (typeof img === 'string' && img.trim().length > 0 && !list.includes(img)) {
            list.push(img);
          }
        });
      } else if (typeof product.image === 'string' && product.image.trim() && !list.includes(product.image)) {
        list.push(product.image);
      }
    }
    if (Array.isArray(product?.images)) {
      product.images.forEach((img) => {
        if (typeof img === 'string' && img.trim().length > 0 && !list.includes(img)) {
          list.push(img);
        }
      });
    }
    if (Array.isArray(product?.gallery)) {
      product.gallery.forEach((img) => {
        if (typeof img === 'string' && img.trim().length > 0 && !list.includes(img)) {
          list.push(img);
        }
      });
    }
    return list;
  };

  const handleBack = () => {
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('AppTab');
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      getPrductDetails();
      getWishlistStatus();
      getCartStatus();

      const onBackPress = () => {
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [id, product_sku_id, sku_id, selectedSkuId, navigation])
  );

  const shareProduct = async () => {
    try {
      const productId = id || product?.id || product?.product_id;
      const playStoreUrl = `https://play.google.com/store/apps/details?id=com.deebazar.shopping&referrer=product_id%3D${productId}`;
      const deepLinkUrl = `deebazar://product/${productId}`;

      const message = `${product?.name || ''}\n\nPrice: ₹${product?.discount_price || product?.actual_price || ''
        }\n\nCheck out this product on DeeBazar!\n\nIf the app is installed, open directly:\n${deepLinkUrl}\n\nIf the app is not installed, install it from Play Store:\n${playStoreUrl}`;

      await Share.share({
        title: product?.name || 'Product Details',
        message: message,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleSelectVariant = (variant) => {
    if (!variant?.product_sku_id) return;
    if (String(variant.product_sku_id) === String(selectedSkuId)) return;
    setSelectedSkuId(variant.product_sku_id);
    const varSellerId =
      variant?.seller_id ??
      variant?.sellerId ??
      variant?.vendor_id ??
      selectedSellerId;
    if (varSellerId) {
      setSelectedSellerId(varSellerId);
    }
    getPrductDetails(variant.product_sku_id, varSellerId);
  };

  const getPrductDetails = async (overrideSkuId, overrideSellerId) => {
    const currentSkuId =
      overrideSkuId ??
      selectedSkuId ??
      sku_id ??
      product_sku_id ??
      route.params?.sku_id ??
      route.params?.product_sku_id;
    const currentProductId =
      route.params?.item?.product_id ??
      route.params?.id ??
      route.params?.item?.id;

    if (!currentSkuId && !currentProductId) {
      setLoading(false);
      return;
    }

    const currentSellerId =
      overrideSellerId ??
      selectedSellerId ??
      route.params?.seller_id ??
      route.params?.sellerId ??
      route.params?.vendor_id ??
      route.params?.item?.seller_id ??
      route.params?.item?.sellerId ??
      route.params?.item?.vendor_id ??
      route.params?.item?.seller?.id ??
      route.params?.item?.user_id ??
      product?.seller_id ??
      product?.vendor_id ??
      productInfo?.seller_id ??
      skuData?.seller_id;

    setLoading(true);
    const token = await getToken();
    const userId = await getuserId();
    const headers = {
      Accept: 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      let result = null;
      if (currentSkuId) {
        const formData = new FormData();
        formData.append('sku_id', String(currentSkuId));
        if (currentSellerId !== undefined && currentSellerId !== null && currentSellerId !== '') {
          formData.append('seller_id', String(currentSellerId));
        }
        if (userId) {
          formData.append('user_id', String(userId));
        }

        console.log('Fetching sku-details with body:', {
          sku_id: currentSkuId,
          seller_id: currentSellerId,
        });

        const response = await fetch(`${BASE_URL}sku-details`, {
          method: 'POST',
          headers,
          body: formData,
        });

        result = await response.json();
      }
      if (result?.status === 200 && result?.data) {
        const d = result.data;
        const p = d.product || {};
        const s = d.sku || {};
        const v = Array.isArray(d.variants) ? d.variants : [];

        const incomingSellerId =
          s.seller_id ??
          p.seller_id ??
          d.seller_id ??
          currentSellerId;
        if (incomingSellerId) {
          setSelectedSellerId(incomingSellerId);
        }

        setProductInfo(p);
        setSkuData(s);
        setVariants(v);
        setSelectedSkuId(s.product_sku_id ?? currentSkuId);

        const merged = {
          ...p,
          ...s,
          id: p.id ?? s.product_id ?? currentSkuId,
          product_id: p.id ?? s.product_id,
          product_sku_id: s.product_sku_id ?? currentSkuId,
          seller_id: incomingSellerId,
          sku_code: s.sku_code,
          name: p.name ? (s.name && s.name !== p.name ? `${p.name} - ${s.name}` : p.name) : (s.name || 'Product Details'),
          product_name: p.name,
          sku_name: s.name,
          actual_price: s.actual_price ?? p.actual_price,
          discount_price: s.discount_price ?? p.discount_price,
          price: s.discount_price ?? s.actual_price ?? p.discount_price ?? p.actual_price,
          discount_percent: s.discount_percent ?? p.discount_percent,
          in_stock: s.in_stock ?? true,
          stock_quantity: s.available_qty ?? p.stock_quantity,
          available_qty: s.available_qty,
          weight: s.weight,
          dimensions: s.dimensions,
          image: s.image || p.image,
          short_desc: p.short_desc || s.short_desc,
          desc: p.desc || s.desc,
          category_id: p.category_id,
          category_name: p.category_name,
          sub_category_id: p.sub_category_id,
          sub_category_name: p.sub_category_name,
          child_category_id: p.child_category_id,
          child_category_name: p.child_category_name,
          reviews: p.reviews,
        };

        setProduct(merged);

        if (s.image) {
          setProductImage(s.image);
        } else if (p.image) {
          if (Array.isArray(p.image) && p.image.length > 0) {
            setProductImage(p.image[0]);
          } else if (typeof p.image === 'string') {
            setProductImage(p.image);
          }
        }
      } else {
        // Fallback for resiliency
        const fallbackFormData = new FormData();
        fallbackFormData.append('product_id', String(currentProductId ?? currentSkuId));
        if (currentSellerId) fallbackFormData.append('seller_id', String(currentSellerId));
        if (userId) fallbackFormData.append('user_id', String(userId));

        const fbRes = await fetch(`${BASE_URL}product-details`, {
          method: 'POST',
          headers,
          body: fallbackFormData,
        });
        const fbData = await fbRes.json();
        if (fbData?.data) {
          setProduct(fbData.data);
          if (fbData.data.image) {
            if (Array.isArray(fbData.data.image) && fbData.data.image.length > 0) {
              setProductImage(fbData.data.image[0]);
            } else if (typeof fbData.data.image === 'string') {
              setProductImage(fbData.data.image);
            }
          }
        }
      }
    } catch (error) {
      console.log('Error fetching sku-details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCartStatus = async () => {
    const token = await getToken();
    const userId = await getuserId();
    if (!userId) return;

    try {
      const formData = new FormData();
      formData.append('user_id', userId);

      const response = await fetch(`${BASE_URL}cart-view`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      const result = await response.json();
      const items = result?.data || result?.cart || [];
      const validItems = Array.isArray(items) ? items : [];
      setCartList(validItems);

      if (validItems.length === 0) {
        await clearActiveCartSeller();
      } else {
        await saveActiveCartSeller(validItems[0]);
      }

      const currentSkuId = selectedSkuId ?? getCartSkuId(product);
      const currentCartItem = {
        ...product,
        product_sku_id: currentSkuId,
        seller_id: selectedSellerId ?? product?.seller_id,
        seller_sku_id: skuData?.seller_sku_id ?? product?.seller_sku_id,
      };
      setIsAddedToCart(Boolean(
        currentSkuId && validItems.some((item) => isCartItemMatching(item, currentCartItem))
      ));
    } catch (error) {
      console.log('Cart status check error:', error);
    }
  };

  const getWishlistStatus = async () => {
    const token = await getToken();
    const userId = await getuserId();

    if (!token || !userId) {
      setIsWishlisted(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('user_id', userId);

      const response = await fetch(`${BASE_URL}wishlist-view`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      const items = data?.data || data?.products || data?.wishlist || [];
      const productId = product?.product_id ?? product?.id ?? id;
      const hasProduct = items.some(
        (entry) => String(entry?.product_id ?? entry?.id ?? entry?.product?.id) === String(productId)
      );
      setIsWishlisted(hasProduct);
    } catch (error) {
      console.log('Wishlist status error:', error);
    }
  };

  const toggleWishlist = async () => {
    const token = await getToken();
    const userId = await getuserId();

    if (!token || !userId) {
      navigation.navigate('Login');
      return;
    }

    const productId = product?.product_id ?? product?.id ?? id;
    const endpoint = isWishlisted ? 'wishlist-remove' : 'wishlist-add';
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('product_id', productId);

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data?.status === 200 || data?.success) {
        setIsWishlisted((prev) => !prev);
        if (Platform.OS === 'android') {
          ToastAndroid.show(
            isWishlisted ? 'Removed from Wishlist' : 'Added to Wishlist',
            ToastAndroid.SHORT
          );
        } else {
          Alert.alert('Success', isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
        }
      } else {
        throw new Error(data?.message || 'Wishlist action failed');
      }
    } catch (error) {
      console.log('Wishlist toggle error:', error);
      if (Platform.OS !== 'android') {
        Alert.alert('Error', 'Something went wrong');
      }
    }
  };

  const requestToCart = async () => {
    const token = await getToken();
    const userId = await getuserId();
    if (!token || !userId) {
      navigation.navigate('Login');
      return false;
    }

    // Single-seller policy check
    let currentCart = cartList;
    if (!currentCart || currentCart.length === 0) {
      try {
        const formData = new FormData();
        formData.append('user_id', userId);
        const cRes = await fetch(`${BASE_URL}cart-view`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: formData,
        });

        const cData = await cRes.json();
        currentCart = (cData?.data && Array.isArray(cData.data)) ? cData.data : (cData?.cart || []);
        setCartList(currentCart);
      } catch (e) {
        console.log('Error refreshing cart in details:', e);
      }
    }

    const cachedSeller = await getActiveCartSeller();
    if (currentCart && currentCart.length > 0) {
      const sellerCheck = await checkDifferentSeller(currentCart, product, cachedSeller);
      if (sellerCheck.isDifferent) {
        setSellerModalData({
          cartSellerName: sellerCheck.cartSellerName,
          cartSellerId: sellerCheck.cartSellerId,
          targetSellerName: sellerCheck.targetSellerName,
          targetSellerId: sellerCheck.targetSellerId,
          targetProduct: product,
        });
        setSellerModalVisible(true);
        return false;
      }
    }

    const skuId = selectedSkuId ?? product_sku_id ?? sku_id ?? getCartSkuId(product);
    if (!skuId) {
      Alert.alert('Unable to add item', 'This item does not have a valid SKU.');
      return false;
    }
    const formData = new FormData();
    formData.append('product_sku_id', String(skuId));
    const sellerId = selectedSellerId ?? product?.seller_id ?? product?.vendor_id;
    const sellerSkuId = skuData?.seller_sku_id ?? product?.seller_sku_id;
    if (sellerId) formData.append('seller_id', String(sellerId));
    if (sellerSkuId) formData.append('seller_sku_id', String(sellerSkuId));
    if (userId) {
      formData.append('user_id', userId);
    }
    formData.append('qty', 1);

    try {
      const response = await fetch(`${BASE_URL}cart-to-add`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      const data = await response.json();

      if (data?.status == 200 || data?.success) {
        await saveActiveCartSeller(product);
        setIsAddedToCart(true);
        getCartStatus();
        if (Platform.OS !== 'android') {
          Alert.alert('Success', 'Product added to cart successfully');
        }
        return true;
      }
    } catch (error) {
      console.log('Error adding to cart:', error);
      if (Platform.OS !== 'android') {
        Alert.alert('Error', 'Something went wrong');
      }
    }
    return false;
  };

  const isOutOfStock = (item) => {
    if (!item) return false;
    if (
      item.in_stock === false ||
      item.in_stock === 0 ||
      item.in_stock === '0' ||
      item.in_stock === 'false' ||
      item.in_stock === 'no' ||
      item.in_stock === 'out_of_stock' ||
      item.in_stock === 'null'
    )
      return true;
    if (
      item.stock_quantity !== undefined &&
      item.stock_quantity !== null &&
      (item.stock_quantity === '' ||
        item.stock_quantity === 0 ||
        item.stock_quantity === '0' ||
        Number(item.stock_quantity) <= 0)
    )
      return true;
    if (
      item.out_of_stock === true ||
      item.out_of_stock === 1 ||
      item.out_of_stock === '1' ||
      item.out_of_stock === 'true' ||
      item.out_of_stock === 'yes'
    )
      return true;
    if (
      item.is_out_of_stock === true ||
      item.is_out_of_stock === 1 ||
      item.is_out_of_stock === '1' ||
      item.is_out_of_stock === 'true' ||
      item.is_out_of_stock === 'yes'
    )
      return true;
    if (
      item.is_stock === false ||
      item.is_stock === 0 ||
      item.is_stock === '0' ||
      item.is_stock === 'false' ||
      item.is_stock === 'no'
    )
      return true;
    if (
      item.stock !== undefined &&
      item.stock !== null &&
      (item.stock === false ||
        item.stock === 'false' ||
        item.stock === 0 ||
        item.stock === '0' ||
        item.stock === 'no' ||
        Number(item.stock) <= 0)
    )
      return true;
    if (
      item.quantity !== undefined &&
      item.quantity !== null &&
      (item.quantity === '' || item.quantity === 0 || item.quantity === '0' || Number(item.quantity) <= 0)
    )
      return true;
    if (
      item.available_quantity !== undefined &&
      item.available_quantity !== null &&
      Number(item.available_quantity) <= 0
    )
      return true;
    if (
      item.available_stock !== undefined &&
      item.available_stock !== null &&
      Number(item.available_stock) <= 0
    )
      return true;
    if (
      item.total_stock !== undefined &&
      item.total_stock !== null &&
      Number(item.total_stock) <= 0
    )
      return true;
    if (
      item.current_stock !== undefined &&
      item.current_stock !== null &&
      Number(item.current_stock) <= 0
    )
      return true;
    if (
      item.inventory !== undefined &&
      item.inventory !== null &&
      Number(item.inventory) <= 0
    )
      return true;
    if (
      item.stock_status &&
      (item.stock_status === 'out_of_stock' ||
        item.stock_status === 'outofstock' ||
        item.stock_status === '0' ||
        item.stock_status === 0 ||
        item.stock_status === false ||
        String(item.stock_status).toLowerCase().includes('out'))
    )
      return true;
    if (
      item.status &&
      (item.status === 'out_of_stock' ||
        item.status === 'outofstock' ||
        String(item.status).toLowerCase().includes('out'))
    )
      return true;
    return false;
  };

  const IsUser = async () => {
    const token = await getToken();
    if (token) {
      await requestToCart();
    } else {
      navigation.navigate('Login');
    }
  };

  const navigateToCart = () => {
    try {
      navigation.navigate('AppTab', { screen: 'CartPage' });
    } catch (e) {
      navigation.navigate('CartPage');
    }
  };

  const handleCart = async () => {
    if (isOutOfStock(product)) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('This product is currently out of stock', ToastAndroid.SHORT);
      } else {
        Alert.alert('Out of Stock', 'This product is currently out of stock.');
      }
      return;
    }
    if (isAddedToCart) {
      navigateToCart();
      return;
    }
    await IsUser();
  };

  const handleBuyNow = async () => {
    if (isOutOfStock(product)) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('This product is currently out of stock', ToastAndroid.SHORT);
      } else {
        Alert.alert('Out of Stock', 'This product is currently out of stock.');
      }
      return;
    }
    if (!isAddedToCart) {
      const token = await getToken();
      if (!token) {
        navigation.navigate('Login');
        return;
      }
      const success = await requestToCart();
      if (!success) {
        return; // Don't navigate if adding to cart failed or was blocked by seller check
      }
    }
    navigateToCart();
  };

  const outOfStockFlag = isOutOfStock(product);

  const discountPercent =
    product?.actual_price && product?.discount_price && product.actual_price > product.discount_price
      ? Math.round(((product.actual_price - product.discount_price) / product.actual_price) * 100)
      : null;

  const categoryBreadcrumbs = [
    product?.category_name,
    product?.sub_category_name,
    product?.child_category_name,
  ]
    .filter(Boolean)
    .join('  ›  ');

  const ratingValue =
    product?.rating !== undefined && product?.rating !== null && Number(product.rating) > 0
      ? Number(product.rating)
      : null;

  const reviewsCount = product?.reviews ?? product?.rating_count ?? product?.reviews_count ?? null;
  const sellerName = product?.seller_name || product?.seller?.name || product?.seller?.shop_name || null;
  const sellerPolicy = product?.seller_policy || product?.return_policy || product?.policy || null;
  const returnDays = sellerPolicy?.return_days !== undefined && sellerPolicy?.return_days !== null
    ? Number(sellerPolicy.return_days)
    : null;
  console.log('🔁 sellerPolicy:', sellerPolicy, '| returnDays:', returnDays);
  const productImages = getProductImages();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
        <StatusBar
          backgroundColor="transparent"
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          translucent={true}
        />
        <ActivityIndicator size="large" color={AllColors.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading Product...</Text>
      </View>
    );
  }

  if (!loading && (!product || (!product.id && !product.name))) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
        <StatusBar
          backgroundColor="transparent"
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          translucent={true}
        />
        <Ionicons name="alert-circle-outline" size={60} color={AllColors.primary} />
        <Text
          style={[
            styles.loadingText,
            { color: theme.textPrimary, marginTop: 12, fontSize: 18, fontWeight: '600' },
          ]}
        >
          Product Not Found
        </Text>
        <Text
          style={{
            color: theme.textSecondary,
            marginTop: 6,
            textAlign: 'center',
            paddingHorizontal: 30,
          }}
        >
          The product you are looking for is unavailable or link is invalid.
        </Text>
        <TouchableOpacity
          style={{
            marginTop: 20,
            backgroundColor: AllColors.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 10,
          }}
          onPress={() => navigation.navigate('AppTab')}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        backgroundColor="transparent"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        translucent={true}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Header & Product Image Section */}
        <View
          style={[
            styles.imageHeaderCard,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
              borderWidth: isDarkMode ? 1 : 0,
            },
          ]}
        >
          {/* Navigation Bar - Always Active */}
          <View style={styles.topNav}>
            <TouchableOpacity
              style={[
                styles.circleBtn,
                { backgroundColor: isDarkMode ? '#334155' : AllColors.white },
              ]}
              onPress={handleBack}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color={isDarkMode ? '#F8FAFC' : '#1E293B'} />
            </TouchableOpacity>

            <View style={styles.rightNavGroup}>
              <TouchableOpacity
                style={[
                  styles.circleBtn,
                  { backgroundColor: isDarkMode ? '#334155' : AllColors.white },
                ]}
                onPress={toggleWishlist}
                activeOpacity={0.8}
              >
                <AntDesign
                  name={isWishlisted ? 'heart' : 'hearto'}
                  size={20}
                  color={isWishlisted ? '#EF4444' : isDarkMode ? '#F8FAFC' : '#1E293B'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.circleBtn,
                  { backgroundColor: isDarkMode ? '#334155' : AllColors.white },
                ]}
                onPress={shareProduct}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="share-social-outline"
                  size={20}
                  color={isDarkMode ? '#F8FAFC' : '#1E293B'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Product Image Slider */}
          <View style={styles.imageWrapper}>
            {productImages.length > 0 ? (
              <FlatList
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                data={productImages}
                keyExtractor={(_, index) => String(index)}
                onMomentumScrollEnd={(e) => {
                  const contentOffset = e.nativeEvent.contentOffset.x;
                  const widthVal = e.nativeEvent.layoutMeasurement.width;
                  if (widthVal > 0) {
                    const index = Math.round(contentOffset / widthVal);
                    setActiveImageIndex(index);
                  }
                }}
                renderItem={({ item }) => (
                  <View style={styles.slideImageWrapper}>
                    <Image
                      source={{ uri: item }}
                      style={styles.productImg}
                      resizeMode="contain"
                    />
                  </View>
                )}
              />
            ) : (
              <View style={styles.slideImageWrapper}>
                <Ionicons
                  name="image-outline"
                  size={80}
                  color={isDarkMode ? '#64748B' : '#CBD5E1'}
                />
              </View>
            )}

            {/* Transparent shield overlay covering the full image when Out of Stock */}
            {outOfStockFlag && (
              <View
                style={[
                  styles.meeshoImageOverlay,
                  { backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.65)' },
                ]}
                pointerEvents="none"
              >
                <View
                  style={[
                    styles.meeshoOutOfStockBadgeLarge,
                    {
                      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                      borderColor: isDarkMode ? '#475569' : '#CBD5E1',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.meeshoOutOfStockTextLarge,
                      { color: isDarkMode ? '#F8FAFC' : '#1E293B' },
                    ]}
                  >
                    OUT OF STOCK
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Pagination Dots */}
          {productImages.length > 1 && (
            <View style={styles.paginationContainer}>
              {productImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    { backgroundColor: isDarkMode ? '#475569' : AllColors.slateBorder },
                    activeImageIndex === index && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Details Section - Dimmed/Disabled style if out of stock */}
        <View style={[styles.contentSection, outOfStockFlag && styles.disabledContentSection]}>
          {/* Breadcrumb / Category Row */}
          {categoryBreadcrumbs ? (
            <Text
              style={[styles.breadcrumbText, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {categoryBreadcrumbs}
            </Text>
          ) : null}

          {/* Title */}
          <Text style={[styles.productTitle, { color: theme.textPrimary }]}>
            {product?.name || 'Product Name'}
          </Text>

          {/* Rating & Seller Row */}
          {(ratingValue !== null || sellerName) && (
            <View style={styles.metaRow}>
              {ratingValue !== null ? (
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={13} color="#F59E0B" />
                  <Text style={styles.ratingText}>{ratingValue.toFixed(1)}</Text>
                  {reviewsCount !== null ? (
                    <Text style={styles.reviewsCountText}>({reviewsCount} reviews)</Text>
                  ) : null}
                </View>
              ) : null}

              {sellerName ? (
                <View
                  style={[
                    styles.sellerPill,
                    {
                      backgroundColor: isDarkMode ? '#334155' : '#F1F5F9',
                      borderColor: theme.borderColor,
                    },
                  ]}
                >
                  <Feather name="shopping-bag" size={12} color={AllColors.primary} />
                  <Text
                    style={[styles.sellerPillText, { color: theme.textSecondary }]}
                    numberOfLines={1}
                  >
                    Sold by <Text style={{ fontWeight: '700', color: theme.textPrimary }}>{sellerName}</Text>
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Price Row */}
          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>
              ₹{product?.discount_price ?? product?.actual_price ?? 0}
            </Text>
            {product?.actual_price && product?.discount_price && product.actual_price > product.discount_price ? (
              <Text
                style={[
                  styles.oldPriceText,
                  { color: isDarkMode ? '#94A3B8' : AllColors.slateLight },
                ]}
              >
                ₹{product?.actual_price}
              </Text>
            ) : null}
            {discountPercent ? (
              <View style={styles.discountBadge}>
                <Feather name="percent" size={11} color="#059669" />
                <Text style={styles.discountBadgeText}>{discountPercent}% OFF</Text>
              </View>
            ) : null}
          </View>

          {/* Short Description */}
          {product?.short_desc ? (
            <Text style={[styles.shortDescText, { color: theme.textSecondary }]}>
              {product?.short_desc}
            </Text>
          ) : null}

          {/* Variants Section */}
          {variants && variants.length > 0 && (
            <View style={styles.variantsSection}>
              <Text style={[styles.variantsHeading, { color: theme.textPrimary }]}>
                Select Variant ({variants.length})
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.variantsScroll}
              >
                {variants.map((v) => {
                  const isSelected = String(v.product_sku_id) === String(selectedSkuId);
                  return (
                    <TouchableOpacity
                      key={v.product_sku_id}
                      style={[
                        styles.variantCard,
                        {
                          backgroundColor: isSelected
                            ? (isDarkMode ? '#1E293B' : '#FEF2F2')
                            : (isDarkMode ? '#0F172A' : '#F8FAFC'),
                          borderColor: isSelected ? AllColors.primary : theme.borderColor,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                      onPress={() => handleSelectVariant(v)}
                      activeOpacity={0.7}
                    >
                      {v.image ? (
                        <Image source={{ uri: v.image }} style={styles.variantThumb} />
                      ) : null}
                      <View style={styles.variantInfo}>
                        <Text
                          style={[
                            styles.variantName,
                            { color: isSelected ? AllColors.primary : theme.textPrimary },
                          ]}
                          numberOfLines={1}
                        >
                          {v.name || v.sku_code}
                        </Text>
                        <Text style={[styles.variantPrice, { color: theme.textSecondary }]}>
                          ₹{v.discount_price ?? v.actual_price}
                        </Text>
                        {v.discount_percent ? (
                          <Text style={styles.variantDiscount}>{v.discount_percent}% off</Text>
                        ) : null}
                        {v.in_stock === false && (
                          <Text style={styles.variantOutOfStock}>Out of stock</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* SKU Specifications */}
          {(skuData?.sku_code || skuData?.weight || skuData?.dimensions) && (
            <View style={styles.specsSection}>
              <Text style={[styles.specsTitle, { color: theme.textPrimary }]}>
                SKU Specifications
              </Text>
              <View
                style={[
                  styles.specsTable,
                  {
                    backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                    borderColor: theme.borderColor,
                  },
                ]}
              >
                {skuData?.sku_code ? (
                  <View style={styles.specRow}>
                    <Text style={[styles.specLabel, { color: theme.textSecondary }]}>SKU Code</Text>
                    <Text style={[styles.specValue, { color: theme.textPrimary }]}>
                      {skuData.sku_code}
                    </Text>
                  </View>
                ) : null}
                {skuData?.weight ? (
                  <View style={styles.specRow}>
                    <Text style={[styles.specLabel, { color: theme.textSecondary }]}>Weight</Text>
                    <Text style={[styles.specValue, { color: theme.textPrimary }]}>
                      {skuData.weight} kg
                    </Text>
                  </View>
                ) : null}
                {skuData?.dimensions ? (
                  <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
                    <Text style={[styles.specLabel, { color: theme.textSecondary }]}>Dimensions</Text>
                    <Text style={[styles.specValue, { color: theme.textPrimary }]}>
                      {skuData.dimensions}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}

          {/* Description Section */}
          <View style={styles.descSection}>
            <Text style={[styles.descTitle, { color: theme.textPrimary }]}>Description</Text>
            <Text style={[styles.fullDescText, { color: theme.textSecondary }]}>
              {product?.desc || product?.short_desc || 'No description available for this product.'}
            </Text>
          </View>

          {/* Seller Return Policy Section */}
          {sellerPolicy ? (
            <View
              style={[
                styles.policyCard,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                  borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.policyHeader}>
                <View style={styles.policyTitleRow}>
                  <View
                    style={[
                      styles.policyIconBox,
                      {
                        backgroundColor: sellerPolicy?.return_days > 0 ? (isDarkMode ? '#064E3B' : '#DEF7EC') : (isDarkMode ? '#7F1D1D' : '#FDE8E8'),
                      },
                    ]}
                  >
                    <Ionicons
                      name={sellerPolicy?.return_days > 0 ? 'refresh-outline' : 'alert-circle-outline'}
                      size={20}
                      color={sellerPolicy?.return_days > 0 ? (isDarkMode ? '#34D399' : '#0E9F6E') : (isDarkMode ? '#FCA5A5' : '#E02424')}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.policyHeaderTitle, { color: theme.textPrimary }]}>
                      Return Policy
                    </Text>
                    {sellerPolicy?.title ? (
                      <Text style={[styles.policySubTitle, { color: sellerPolicy?.return_days > 0 ? '#10B981' : '#EF4444' }]}>
                        {sellerPolicy.title}
                      </Text>
                    ) : null}
                  </View>
                </View>
                {sellerPolicy?.return_days !== undefined && sellerPolicy?.return_days !== null && (
                  <View
                    style={[
                      styles.policyBadge,
                      {
                        backgroundColor: sellerPolicy.return_days > 0 ? (isDarkMode ? '#075985' : '#E0F2FE') : (isDarkMode ? '#7F1D1D' : '#FEE2E2'),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.policyBadgeText,
                        {
                          color: sellerPolicy.return_days > 0 ? (isDarkMode ? '#38BDF8' : '#0284C7') : (isDarkMode ? '#FCA5A5' : '#DC2626'),
                        },
                      ]}
                    >
                      {sellerPolicy.return_days > 0
                        ? `${sellerPolicy.return_days} Days Return`
                        : 'No Return'}
                    </Text>
                  </View>
                )}
              </View>
              {sellerPolicy?.description ? (
                <Text style={[styles.policyDescText, { color: theme.textSecondary }]}>
                  {sellerPolicy.description}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Highlight Features Row */}
          <View
            style={[
              styles.featuresRow,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor,
                borderWidth: isDarkMode ? 1 : 0,
              },
            ]}
          >
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark-outline" size={18} color={AllColors.primary} />
              <Text style={[styles.featureText, { color: theme.textPrimary }]}>100% Genuine</Text>
            </View>
            <View style={[styles.featureDivider, { backgroundColor: theme.divider }]} />
            <View style={styles.featureItem}>
              <Feather name="truck" size={18} color={AllColors.primary} />
              <Text style={[styles.featureText, { color: theme.textPrimary }]}>Fast Delivery</Text>
            </View>
            {/* Show return chip only when return is allowed (returnDays > 0 or policy not set) */}
            {returnDays !== 0 && (
              <>
                <View style={[styles.featureDivider, { backgroundColor: theme.divider }]} />
                <View style={styles.featureItem}>
                  <Ionicons name="refresh-outline" size={18} color={AllColors.primary} />
                  <Text style={[styles.featureText, { color: theme.textPrimary }]}>
                    {returnDays > 0 ? `${returnDays} Days Return` : 'Easy Return'}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: theme.cardBg, borderTopColor: theme.divider },
        ]}
      >
        {outOfStockFlag ? (
          <TouchableOpacity
            style={[
              styles.outOfStockWishlistBtn,
              {
                backgroundColor: isWishlisted ? (isDarkMode ? '#334155' : '#FEF2F2') : AllColors.primary,
                borderColor: isWishlisted ? '#EF4444' : AllColors.primary,
              },
            ]}
            activeOpacity={0.85}
            onPress={toggleWishlist}
          >
            <AntDesign
              name={isWishlisted ? 'heart' : 'hearto'}
              size={18}
              color={isWishlisted ? '#EF4444' : '#FFFFFF'}
              style={styles.btnIconMarginRight}
            />
            <Text
              style={[
                styles.outOfStockWishlistText,
                { color: isWishlisted ? '#EF4444' : '#FFFFFF' },
              ]}
            >
              {isWishlisted ? 'Saved in Wishlist ❤️' : 'Out of Stock - Add to Wishlist'}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.cartButton,
                { backgroundColor: isDarkMode ? '#334155' : AllColors.white },
              ]}
              onPress={handleCart}
              activeOpacity={0.85}
            >
              <Ionicons
                name={isAddedToCart ? 'bag-check-outline' : 'cart-outline'}
                size={20}
                color={AllColors.primary}
                style={styles.btnIconMarginRight}
              />
              <Text style={styles.cartButtonText}>
                {isAddedToCart ? 'Go To Cart' : 'Add To Cart'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buyButtonWrapper}
              onPress={handleBuyNow}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[AllColors.primary, AllColors.primaryGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buyGradient}
              >
                <Feather
                  name="zap"
                  size={18}
                  color={AllColors.white}
                  style={styles.btnIconMarginRight}
                />
                <Text style={styles.buyButtonText}>Buy Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Different Seller Modal */}
      <DifferentSellerModal
        visible={sellerModalVisible}
        cartSellerName={sellerModalData.cartSellerName}
        cartSellerId={sellerModalData.cartSellerId}
        targetSellerName={sellerModalData.targetSellerName}
        targetSellerId={sellerModalData.targetSellerId}
        targetProduct={sellerModalData.targetProduct}
        onClose={() => setSellerModalVisible(false)}
        onViewSellerProducts={() => {
          const sId = sellerModalData.cartSellerId;
          const sName = sellerModalData.cartSellerName;
          setSellerModalVisible(false);
          navigation.navigate('ViewAllProducts', {
            sellerId: sId,
            sellerName: sName,
            title: sName ? `${sName}'s Products` : "Seller's Products",
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AllColors.screenBg,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AllColors.white,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: AllColors.slateSub,
    fontWeight: '500',
  },

  /* Image Header Card */
  imageHeaderCard: {
    height: 350 + STATUSBAR_HEIGHT,
    backgroundColor: AllColors.white,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingTop: Platform.OS === 'ios' ? 44 : STATUSBAR_HEIGHT + 10,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    position: 'relative',
    justifyContent: 'space-between',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  rightNavGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AllColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 12,
    position: 'relative',
  },
  meeshoImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    zIndex: 10,
  },
  meeshoOutOfStockBadgeLarge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 6,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  meeshoOutOfStockTextLarge: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  productImg: {
    width: '90%',
    height: '100%',
  },
  slideImageWrapper: {
    width: slideWidth,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AllColors.slateBorder,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 14,
    backgroundColor: AllColors.primary,
  },

  /* Content Section */
  contentSection: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 12,
  },
  disabledContentSection: {
    opacity: 0.65,
  },
  breadcrumbText: {
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  reviewsCountText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#78350F',
  },
  sellerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0.5,
    gap: 5,
  },
  sellerPillText: {
    fontSize: 11,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AllColors.greenSoftBg,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 20,
    gap: 3,
  },
  discountBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: AllColors.greenSoftText,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AllColors.slateDark,
    lineHeight: 26,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currentPrice: {
    fontSize: 25,
    fontWeight: '800',
    color: AllColors.primary,
  },
  oldPriceText: {
    fontSize: 15,
    fontWeight: '500',
    color: AllColors.slateLight,
    textDecorationLine: 'line-through',
  },
  shortDescText: {
    fontSize: 13,
    color: AllColors.slateSub,
    lineHeight: 19,
  },
  descSection: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  descTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AllColors.slateHeader,
    marginBottom: 4,
  },
  fullDescText: {
    fontSize: 13.5,
    color: AllColors.slateMuted,
    lineHeight: 21,
  },
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: AllColors.white,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  /* Return Policy Card */
  policyCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 4,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  policyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  policyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  policyHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  policySubTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  policyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
  },
  policyBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  policyDescText: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: AllColors.slateHeader,
  },
  featureDivider: {
    width: 1,
    height: 18,
    backgroundColor: AllColors.slateBorder,
  },

  /* Bottom Bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AllColors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    gap: 12,
    elevation: 10,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cartButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: AllColors.primary,
    backgroundColor: AllColors.white,
  },
  cartButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: AllColors.primary,
  },
  buyButtonWrapper: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  buyGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: AllColors.white,
  },
  outOfStockWishlistBtn: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  outOfStockWishlistText: {
    fontSize: 15,
    fontWeight: '700',
  },
  btnIconMarginRight: {
    marginRight: 8,
  },
  variantsSection: {
    marginTop: 18,
    marginBottom: 4,
  },
  variantsHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  variantsScroll: {
    paddingVertical: 4,
  },
  variantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    marginRight: 10,
    minWidth: 130,
    maxWidth: 170,
  },
  variantThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  variantInfo: {
    flex: 1,
  },
  variantName: {
    fontSize: 13,
    fontWeight: '700',
  },
  variantPrice: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  variantDiscount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  variantOutOfStock: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
  },
  specsSection: {
    marginTop: 18,
  },
  specsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  specsTable: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CBD5E1',
  },
  specLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
  },
});