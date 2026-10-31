import React, { useEffect, useState, useMemo } from 'react';
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
  RefreshControl,
  BackHandler,
  DeviceEventEmitter,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AllColors from '../../../Constants/Color';
import { STATUSBAR_HEIGHT } from '../../../Constants/ScreenUtils';
import {
  getProductDetailsApi,
  getSkuDetailsApi,
  getCartViewApi,
  viewWishlistApi,
  addToWishlistApi,
  removeFromWishlistApi,
  addToCartApi,
  getToken,
  getuserId,
} from '../../../Api/Api';
import { useTheme } from '../../../Context/ThemeContext';
import DifferentSellerModal from '../../../Common/DifferentSellerModal';
import {
  checkDifferentSeller,
  saveActiveCartSeller,
  getActiveCartSeller,
  clearActiveCartSeller,
  getCartSkuId,
  isCartItemMatching,
  extractCartItems,
} from '../../../Common/sellerUtils';

const { width } = Dimensions.get('window');
const slideWidth = width - 32;

const getStorageRamLabel = (attrs = []) => {
  if (!Array.isArray(attrs)) return '';
  const storage = attrs.find((a) => /storage|rom|internal\s*memory/i.test(a.attribute || ''))?.value;
  const ram = attrs.find((a) => /ram|memory/i.test(a.attribute || ''))?.value;
  if (storage && ram) return `${storage} + ${ram}`;
  if (storage) return storage;
  if (ram) return ram;
  return '';
};

export default function ProductDetails({ route }) {
  const { theme, isDarkMode } = useTheme();
  const [product, setProduct] = useState({});
  const [productImage, setProductImage] = useState(null);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  const [skuOptions, setSkuOptions] = useState([]);
  const [selectors, setSelectors] = useState([]);

  const initialSkuId =
    sku_id ??
    product_sku_id ??
    id ??
    item?.product_sku_id ??
    item?.sku_id ??
    item?.sku?.id ??
    item?.product_id ??
    item?.id ??
    null;

  const initialSellerId =
    seller_id ??
    sellerId ??
    vendor_id ??
    item?.seller_id ??
    item?.sellerId ??
    item?.vendor_id ??
    item?.seller?.id ??
    item?.user_id ??
    null;

  const [selectedSkuId, setSelectedSkuId] = useState(initialSkuId);
  const [selectedSellerId, setSelectedSellerId] = useState(initialSellerId);
  const [isHighlightsOpen, setIsHighlightsOpen] = useState(true);
  const [isAllDetailsOpen, setIsAllDetailsOpen] = useState(false);

  const hasLoadedRef = React.useRef(false);
  const isFetchingRef = React.useRef(false);

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
      const onBackPress = () => {
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      // When returning from another screen (Cart / Wishlist), update cart & wishlist quietly without blinking
      if (hasLoadedRef.current) {
        getWishlistStatus();
        getCartStatus();
      }

      return () => subscription.remove();
    }, [])
  );

  // Initial load: fetch once, show loader, show page when ready
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setLoading(true);

      try {
        await Promise.all([
          getPrductDetails(initialSkuId, initialSellerId, false, false),
          getWishlistStatus(initialSkuId),
          getCartStatus(),
        ]);
        if (isMounted) {
          hasLoadedRef.current = true;
        }
      } catch (e) {
        console.log('Error loading initial product details:', e);
      } finally {
        isFetchingRef.current = false;
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle route params updates when navigating between products on the same screen instance
  useEffect(() => {
    if (!hasLoadedRef.current) return;

    const incomingSkuId =
      route.params?.sku_id ??
      route.params?.product_sku_id ??
      route.params?.id ??
      route.params?.item?.sku_id ??
      route.params?.item?.product_sku_id ??
      route.params?.item?.id;

    const incomingSellerId =
      route.params?.seller_id ??
      route.params?.sellerId ??
      route.params?.vendor_id ??
      route.params?.item?.seller_id ??
      route.params?.item?.sellerId;

    if (incomingSkuId && String(incomingSkuId) !== String(selectedSkuId)) {
      setSelectedSkuId(incomingSkuId);
      if (incomingSellerId) setSelectedSellerId(incomingSellerId);
      setLoading(true);
      getPrductDetails(incomingSkuId, incomingSellerId, false, false);
      getWishlistStatus(incomingSkuId);
      getCartStatus();
    }
  }, [
    route.params?.sku_id,
    route.params?.product_sku_id,
    route.params?.id,
    route.params?.seller_id,
    route.params?.sellerId,
  ]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('WISHLIST_UPDATED', () => {
      getWishlistStatus();
    });
    return () => sub.remove();
  }, [selectedSkuId]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        getPrductDetails(selectedSkuId, selectedSellerId, true, false),
        getWishlistStatus(),
        getCartStatus(),
      ]);
    } catch (e) {
      console.log('Error refreshing product details:', e);
    } finally {
      setRefreshing(false);
    }
  };

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
    getPrductDetails(variant.product_sku_id, varSellerId, false, true);
    getWishlistStatus(variant.product_sku_id, variant?.seller_sku_id);
  };

  const handleSelectSelectorValue = (val) => {
    if (!val?.product_sku_id) return;
    if (String(val.product_sku_id) === String(selectedSkuId)) return;
    setSelectedSkuId(val.product_sku_id);
    const matchedVariant = variants.find(
      (v) => String(v.product_sku_id) === String(val.product_sku_id)
    );
    const varSellerId =
      matchedVariant?.seller_id ??
      val?.seller_id ??
      selectedSellerId;
    if (varSellerId) {
      setSelectedSellerId(varSellerId);
    }
    getPrductDetails(val.product_sku_id, varSellerId, false, true);
    getWishlistStatus(val.product_sku_id, matchedVariant?.seller_sku_id ?? val?.seller_sku_id);
  };

  const handleSelectColor = (colorItem) => {
    if (!colorItem) return;
    const currentAttrs = skuData?.attributes || product?.attributes || [];
    const currentColorValue = currentAttrs.find((a) => /color|colour/i.test(a.attribute || ''))?.value;
    if (currentColorValue && String(currentColorValue).toLowerCase() === String(colorItem.value).toLowerCase()) {
      return;
    }

    let targetSkuId = colorItem.product_sku_id;
    let targetSellerId = colorItem.seller_id || selectedSellerId;

    if (variants && variants.length > 0) {
      const currentStorageRam = getStorageRamLabel(currentAttrs);
      // Try to match the current variant configuration for the newly selected color
      let matchingVariant = variants.find((v) => {
        const vColor = (v.attributes || []).find((a) => /color|colour/i.test(a.attribute || ''))?.value;
        if (!vColor || String(vColor).toLowerCase() !== String(colorItem.value).toLowerCase()) return false;
        if (currentStorageRam) {
          const vStorageRam = getStorageRamLabel(v.attributes);
          return vStorageRam === currentStorageRam;
        }
        return true;
      });

      // Fallback: any variant with the selected color
      if (!matchingVariant) {
        matchingVariant = variants.find((v) => {
          const vColor = (v.attributes || []).find((a) => /color|colour/i.test(a.attribute || ''))?.value;
          return vColor && String(vColor).toLowerCase() === String(colorItem.value).toLowerCase();
        });
      }

      if (matchingVariant) {
        targetSkuId = matchingVariant.product_sku_id;
        targetSellerId = matchingVariant.seller_id || targetSellerId;
      }
    }

    if (targetSkuId && String(targetSkuId) !== String(selectedSkuId)) {
      setSelectedSkuId(targetSkuId);
      if (targetSellerId) setSelectedSellerId(targetSellerId);
      getPrductDetails(targetSkuId, targetSellerId, false, true);
      getWishlistStatus(targetSkuId, colorItem?.seller_sku_id);
    }
  };

  const handleSelectVariantOption = (item) => {
    if (!item?.product_sku_id) return;
    if (String(item.product_sku_id) === String(selectedSkuId)) return;
    const targetSkuId = item.product_sku_id;
    const matchedVariant = (variants || []).find(
      (v) => String(v.product_sku_id) === String(targetSkuId)
    );
    const varSellerId =
      matchedVariant?.seller_id ??
      item?.seller_id ??
      selectedSellerId;
    if (varSellerId) {
      setSelectedSellerId(varSellerId);
    }
    setSelectedSkuId(targetSkuId);
    getPrductDetails(targetSkuId, varSellerId, false, true);
    getWishlistStatus(targetSkuId, matchedVariant?.seller_sku_id ?? item?.seller_sku_id);
  };

  const getPrductDetails = async (
    overrideSkuId,
    overrideSellerId,
    isPullToRefresh = false,
    isVariantChange = false
  ) => {
    const currentSkuId =
      overrideSkuId ??
      selectedSkuId ??
      sku_id ??
      product_sku_id ??
      id ??
      route.params?.sku_id ??
      route.params?.product_sku_id ??
      route.params?.id;
    const currentProductId =
      route.params?.item?.product_id ??
      route.params?.id ??
      route.params?.item?.id ??
      product?.product_id ??
      product?.id ??
      id;

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

    if (!isPullToRefresh && !isVariantChange && !hasLoadedRef.current) {
      setLoading(true);
    }
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
        console.log('Fetching sku-details with params:', {
          sku_id: currentSkuId,
          seller_id: currentSellerId,
        });

        result = await getSkuDetailsApi(currentSkuId, currentSellerId);
      }
      if (result?.status === 200 && result?.data) {
        const d = result.data;
        const p = d.product || {};
        const s = d.sku || {};
        const v = Array.isArray(d.variants) ? d.variants : [];
        const opts = Array.isArray(d.options) ? d.options : [];
        const sel = Array.isArray(d.selectors) ? d.selectors : [];

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
        setSkuOptions(opts);
        setSelectors(sel);
        setSelectedSkuId(s.product_sku_id ?? currentSkuId);

        // Dynamic SKU display name: Always use sku.name from API
        const sName = s.name ? s.name.trim() : '';
        const pName = p.name ? p.name.trim() : '';
        const displayName = sName || pName || 'Product Details';

        const merged = {
          ...p,
          ...s,
          id: p.id ?? s.product_id ?? currentSkuId,
          product_id: p.id ?? s.product_id,
          product_sku_id: s.product_sku_id ?? currentSkuId,
          seller_sku_id: s.seller_sku_id ?? p.seller_sku_id,
          seller_id: incomingSellerId,
          seller_name: s.seller_name ?? p.seller_name ?? p.seller?.name,
          sku_code: s.sku_code,
          name: displayName,
          product_name: pName || sName,
          sku_name: sName,
          actual_price: s.actual_price ?? p.actual_price,
          discount_price: s.discount_price ?? p.discount_price,
          price: s.discount_price ?? s.actual_price ?? p.discount_price ?? p.actual_price,
          discount_percent: s.discount_percent ?? p.discount_percent,
          in_stock: s.in_stock ?? true,
          stock_quantity: s.available_qty ?? p.stock_quantity,
          available_qty: s.available_qty,
          weight: s.weight,
          dimensions: s.dimensions,
          attributes: Array.isArray(s.attributes) ? s.attributes : [],
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
        getWishlistStatus(s.product_sku_id ?? currentSkuId, s.seller_sku_id ?? p.seller_sku_id);

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

        const fbData = await getProductDetailsApi(
          currentProductId ?? currentSkuId,
          currentSellerId,
          userId
        );
        if (fbData?.data) {
          setProduct(fbData.data);
          getWishlistStatus(fbData.data.product_sku_id ?? currentSkuId, fbData.data.seller_sku_id);
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
      if (!isVariantChange) {
        setLoading(false);
      }
    }
  };

  const getCartStatus = async () => {
    const token = await getToken();
    const userId = await getuserId();
    if (!userId) return;

    try {
      const result = await getCartViewApi();
      const validItems = extractCartItems(result?.data);
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

  const getWishlistStatus = async (overrideCheckSkuId, overrideCheckSellerSkuId) => {
    const token = await getToken();
    const userId = await getuserId();

    if (!token || !userId) {
      setIsWishlisted(false);
      return;
    }

    try {
      const data = await viewWishlistApi();
      const items = data?.data || data?.products || data?.wishlist || [];
      const validItems = Array.isArray(items) ? items : [];

      const currentSkuId =
        overrideCheckSkuId ??
        selectedSkuId ??
        skuData?.product_sku_id ??
        product?.product_sku_id ??
        product_sku_id ??
        sku_id ??
        product?.sku_id ??
        product?.id ??
        id;

      const currentSellerSkuId =
        overrideCheckSellerSkuId ??
        skuData?.seller_sku_id ??
        product?.seller_sku_id;

      const currentProductId =
        product?.id ??
        product?.product_id ??
        id;

      const hasProduct = validItems.some((entry) => {
        if (!entry) return false;
        // 1. Direct seller_sku_id match
        if (currentSellerSkuId && entry.seller_sku_id && String(entry.seller_sku_id) === String(currentSellerSkuId)) {
          return true;
        }
        // 2. product_sku_id match
        const entrySku = entry.product_sku_id ?? entry.sku_id;
        if (currentSkuId && entrySku && String(entrySku) === String(currentSkuId)) {
          return true;
        }
        // 3. product_id match
        if (currentProductId && entry.product_id && String(entry.product_id) === String(currentProductId)) {
          return true;
        }
        // 4. entry id fallback if entry has no product_sku_id
        if (!entrySku && currentSkuId && entry.id && String(entry.id) === String(currentSkuId)) {
          return true;
        }
        return false;
      });

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

    const currentSkuId =
      skuData?.product_sku_id ??
      selectedSkuId ??
      product?.product_sku_id ??
      product_sku_id ??
      sku_id ??
      product?.sku_id ??
      product?.id ??
      id;

    if (!currentSkuId) {
      Alert.alert('Unable to update wishlist', 'Product SKU is missing.');
      return;
    }

    const currentSellerSkuId = skuData?.seller_sku_id ?? product?.seller_sku_id;
    const prevWishlisted = isWishlisted;
    setIsWishlisted(!prevWishlisted);

    try {
      const data = prevWishlisted
        ? await removeFromWishlistApi(currentSkuId, currentSellerSkuId)
        : await addToWishlistApi(currentSkuId, currentSellerSkuId);

      if (data?.status === 200 || data?.success) {
        DeviceEventEmitter.emit('WISHLIST_UPDATED');
        if (Platform.OS === 'android') {
          ToastAndroid.show(
            prevWishlisted ? 'Removed from Wishlist' : 'Added to Wishlist',
            ToastAndroid.SHORT
          );
        } else {
          Alert.alert('Success', prevWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
        }
      } else {
        setIsWishlisted(prevWishlisted);
        Alert.alert('Error', data?.message || 'Wishlist action failed');
      }
    } catch (error) {
      console.log('Wishlist toggle error:', error);
      setIsWishlisted(prevWishlisted);
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
        const cData = await getCartViewApi();
        currentCart = extractCartItems(cData?.data);
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

    const sellerSkuId = skuData?.seller_sku_id ?? product?.seller_sku_id;

    try {
      const data = await addToCartApi(
        skuId,
        1,
        sellerSkuId ? { seller_sku_id: sellerSkuId } : {},
        'add'
      );

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

  // Flipkart style - Process Color and Variant selection data
  const { colorSection, variantSections } = useMemo(() => {
    const currentAttrs = skuData?.attributes || product?.attributes || [];
    const currentColorValue =
      currentAttrs.find((a) => /color|colour/i.test(a.attribute || ''))?.value ||
      (selectors || []).find((s) => /color|colour/i.test(s.attribute || ''))?.selected_value ||
      '';

    // 1. Color attribute
    const colorSelector = (selectors || []).find(
      (s) => /color|colour/i.test(s.attribute || '')
    );

    let colorList = [];
    let selectedColorName = currentColorValue;

    if (colorSelector && Array.isArray(colorSelector.values) && colorSelector.values.length > 0) {
      colorList = colorSelector.values.map((v) => {
        const isSel =
          (currentColorValue && String(v.value).toLowerCase() === String(currentColorValue).toLowerCase()) ||
          v.is_selected ||
          String(v.product_sku_id) === String(selectedSkuId);
        if (isSel && !selectedColorName) selectedColorName = v.value;
        const matchedVar = (variants || []).find(
          (vt) => String(vt.product_sku_id) === String(v.product_sku_id)
        );
        return {
          id: String(v.attribute_value_id || v.product_sku_id || v.value),
          value: v.value,
          product_sku_id: v.product_sku_id,
          seller_id: matchedVar?.seller_id,
          seller_sku_id: matchedVar?.seller_sku_id,
          image: v.image || matchedVar?.image || (isSel ? productImage : null),
          in_stock: v.in_stock !== false,
          is_selected: Boolean(isSel),
        };
      });
    } else if (variants && variants.length > 0) {
      const seenColors = new Set();
      variants.forEach((v) => {
        const cAttr = (v.attributes || []).find((a) => /color|colour/i.test(a.attribute || ''));
        if (cAttr && cAttr.value && !seenColors.has(String(cAttr.value).toLowerCase())) {
          seenColors.add(String(cAttr.value).toLowerCase());
          const isSel =
            (currentColorValue && String(cAttr.value).toLowerCase() === String(currentColorValue).toLowerCase()) ||
            String(v.product_sku_id) === String(selectedSkuId);
          if (isSel) selectedColorName = cAttr.value;
          colorList.push({
            id: String(v.product_sku_id || cAttr.value),
            value: cAttr.value,
            product_sku_id: v.product_sku_id,
            seller_id: v.seller_id,
            seller_sku_id: v.seller_sku_id,
            image: v.image || (isSel ? productImage : null),
            in_stock: v.in_stock !== false,
            is_selected: Boolean(isSel),
          });
        }
      });
    }

    const otherSelectors = (selectors || []).filter(
      (s) => !/color|colour/i.test(s.attribute || '')
    );

    const storageSel = otherSelectors.find((s) => /storage|rom|internal\s*memory/i.test(s.attribute || ''));
    const ramSel = otherSelectors.find((s) => /ram|memory/i.test(s.attribute || ''));

    let variantGroups = [];

    const hasStorageOrRamInVariants = (variants || []).some((v) =>
      Boolean(getStorageRamLabel(v.attributes))
    );

    if (hasStorageOrRamInVariants && variants && variants.length > 0) {
      // Filter variants that match the currently selected color (if color exists)
      const matchingColorVariants = currentColorValue
        ? variants.filter((v) => {
          const vColor = (v.attributes || []).find((a) => /color|colour/i.test(a.attribute || ''))?.value;
          return vColor && String(vColor).toLowerCase() === String(currentColorValue).toLowerCase();
        })
        : variants;

      const relevantVariants = matchingColorVariants.length > 0 ? matchingColorVariants : variants;

      // Collect unique Storage + RAM configurations ONLY from relevantVariants (variants belonging to this SKU's color)
      const uniqueConfigMap = new Map();
      relevantVariants.forEach((v) => {
        const label = getStorageRamLabel(v.attributes);
        if (!label) return;

        const isCurrentSku = String(v.product_sku_id) === String(selectedSkuId);
        // Prefer the currently selected SKU if duplicate config exists
        if (!uniqueConfigMap.has(label) || isCurrentSku) {
          uniqueConfigMap.set(label, v);
        }
      });

      const currentSkuStorageRam = getStorageRamLabel(currentAttrs);

      const siblingItems = Array.from(uniqueConfigMap.entries()).map(([label, v]) => {
        const isSel = String(v.product_sku_id) === String(selectedSkuId) ||
          (currentSkuStorageRam && label === currentSkuStorageRam);
        const price = v.discount_price ?? v.actual_price;
        const actualPrice = v.actual_price;
        const discPercent = v.discount_percent;
        const hasDiscount = Boolean(discPercent && actualPrice && price && actualPrice > price);

        return {
          id: String(v.product_sku_id || v.seller_sku_id),
          label,
          product_sku_id: v.product_sku_id,
          seller_id: v.seller_id,
          seller_sku_id: v.seller_sku_id,
          price,
          actualPrice,
          discountPercent: discPercent,
          hasDiscount,
          in_stock: v.in_stock !== false,
          is_selected: Boolean(isSel),
        };
      });

      const activeSibling = siblingItems.find((s) => s.is_selected);
      const selectedVariantLabel = activeSibling?.label || currentSkuStorageRam || siblingItems[0]?.label || '';

      variantGroups.push({
        title: 'Variant',
        selectedLabel: selectedVariantLabel,
        items: siblingItems,
        isVariantCards: true,
      });
    } else if (storageSel || ramSel) {
      const currentStorage = storageSel?.selected_value || storageSel?.values?.[0]?.value || '';
      const currentRam = ramSel?.selected_value || ramSel?.values?.[0]?.value || '';
      const combinedLabel = [currentStorage, currentRam].filter(Boolean).join(' + ');

      const curPrice = product?.discount_price ?? product?.actual_price;
      const curActual = product?.actual_price;
      const curDisc = discountPercent;
      const hasDiscount = Boolean(curDisc && curActual && curPrice && curActual > curPrice);

      variantGroups.push({
        title: 'Variant',
        selectedLabel: combinedLabel,
        items: [
          {
            id: 'combined_variant',
            label: combinedLabel,
            product_sku_id: selectedSkuId,
            price: curPrice,
            actualPrice: curActual,
            discountPercent: curDisc,
            hasDiscount,
            in_stock: !outOfStockFlag,
            is_selected: true,
          },
        ],
        isVariantCards: true,
      });
    } else if (variants && variants.length > 1) {
      // Non-tech product with variants (e.g. Size or style)
      const matchingColorVariants = currentColorValue
        ? variants.filter((v) => {
          const vColor = (v.attributes || []).find((a) => /color|colour/i.test(a.attribute || ''))?.value;
          return vColor && String(vColor).toLowerCase() === String(currentColorValue).toLowerCase();
        })
        : variants;
      const relevantVariants = matchingColorVariants.length > 0 ? matchingColorVariants : variants;

      const uniqueNonTechMap = new Map();
      relevantVariants.forEach((v) => {
        const nonSpecAttrs = (v.attributes || []).filter(
          (a) => !/color|colour|weight|dimension|screen|display|battery|camera|processor|cpu|os|operating|connectivity|network/i.test(a.attribute || '')
        );
        let label = '';
        if (nonSpecAttrs.length > 0) {
          label = nonSpecAttrs.map((a) => a.value).join(' + ');
        } else {
          label = v.name || v.sku_code || 'Variant';
        }

        const isCurrentSku = String(v.product_sku_id) === String(selectedSkuId);
        if (!uniqueNonTechMap.has(label) || isCurrentSku) {
          uniqueNonTechMap.set(label, v);
        }
      });

      const siblingItems = Array.from(uniqueNonTechMap.entries()).map(([label, v]) => {
        const isSel = String(v.product_sku_id) === String(selectedSkuId);
        const price = v.discount_price ?? v.actual_price;
        const actualPrice = v.actual_price;
        const discPercent = v.discount_percent;
        const hasDiscount = Boolean(discPercent && actualPrice && price && actualPrice > price);

        return {
          id: String(v.product_sku_id || v.seller_sku_id),
          label,
          product_sku_id: v.product_sku_id,
          seller_id: v.seller_id,
          seller_sku_id: v.seller_sku_id,
          price,
          actualPrice,
          discountPercent: discPercent,
          hasDiscount,
          in_stock: v.in_stock !== false,
          is_selected: isSel,
        };
      });

      const activeSibling = siblingItems.find((s) => s.is_selected);
      const selectedVariantLabel = activeSibling ? activeSibling.label : (siblingItems[0]?.label || '');

      variantGroups.push({
        title: 'Variant',
        selectedLabel: selectedVariantLabel,
        items: siblingItems,
        isVariantCards: true,
      });
    } else {
      // Check for Size in fashion products
      const sizeSel = otherSelectors.find((s) => /size|fit/i.test(s.attribute || ''));
      if (sizeSel && Array.isArray(sizeSel.values) && sizeSel.values.length > 0) {
        const items = sizeSel.values.map((v) => {
          const isSel = v.is_selected || String(v.product_sku_id) === String(selectedSkuId);
          return {
            id: String(v.attribute_value_id || v.product_sku_id || v.value),
            label: v.value,
            product_sku_id: v.product_sku_id,
            is_selected: isSel,
            isChipOnly: true,
            in_stock: v.in_stock !== false,
          };
        });
        variantGroups.push({
          title: sizeSel.attribute || 'Size',
          selectedLabel: sizeSel.selected_value || (items.find((i) => i.is_selected)?.label) || '',
          items,
          isVariantCards: false,
        });
      }
    }

    return {
      colorSection: colorList.length > 0 ? {
        title: 'Selected Color',
        selectedLabel: selectedColorName || colorList.find((c) => c.is_selected)?.value || colorList[0]?.value || '',
        items: colorList,
      } : null,
      variantSections: variantGroups,
    };
  }, [selectors, variants, selectedSkuId, product, skuData, discountPercent, productImage, outOfStockFlag]);

  // Flipkart style - Highlights computation
  const highlights = useMemo(() => {
    const list = [];
    const attrs = Array.isArray(skuData?.attributes) ? skuData.attributes : [];

    const ramAttr = attrs.find((a) => /^(ram|memory)$/i.test(a.attribute?.trim()));
    const romAttr = attrs.find((a) => /^(storage|rom|internal\s*memory)$/i.test(a.attribute?.trim()));
    const processorAttr = attrs.find((a) => /^(processor|cpu|chipset)$/i.test(a.attribute?.trim()));
    const rearCameraAttr = attrs.find((a) => /^(rear\s*camera|primary\s*camera|back\s*camera|camera)$/i.test(a.attribute?.trim()));
    const frontCameraAttr = attrs.find((a) => /^(front\s*camera|selfie\s*camera)$/i.test(a.attribute?.trim()));
    const screenAttr = attrs.find((a) => /^(screen\s*size|screen|display)$/i.test(a.attribute?.trim()));
    const batteryAttr = attrs.find((a) => /^(battery|battery\s*capacity)$/i.test(a.attribute?.trim()));
    const osAttr = attrs.find((a) => /^(operating\s*system|os)$/i.test(a.attribute?.trim()));

    if (ramAttr && romAttr) {
      list.push({
        icon: 'memory',
        text: `${ramAttr.value} RAM | ${romAttr.value} ROM`,
      });
    } else if (ramAttr) {
      list.push({
        icon: 'memory',
        text: `${ramAttr.value} RAM`,
      });
    } else if (romAttr) {
      list.push({
        icon: 'chip',
        text: `${romAttr.value} ROM`,
      });
    }

    if (processorAttr) {
      list.push({
        icon: 'cpu-64-bit',
        text: processorAttr.value.toLowerCase().includes('processor')
          ? processorAttr.value
          : `${processorAttr.value} Processor`,
      });
    }

    if (rearCameraAttr) {
      list.push({
        icon: 'camera-outline',
        text: rearCameraAttr.value.toLowerCase().includes('camera')
          ? rearCameraAttr.value
          : `${rearCameraAttr.value} Rear Camera`,
      });
    }

    if (frontCameraAttr) {
      list.push({
        icon: 'camera-front-variant',
        text: frontCameraAttr.value.toLowerCase().includes('camera')
          ? frontCameraAttr.value
          : `${frontCameraAttr.value} Front Camera`,
      });
    }

    if (screenAttr) {
      list.push({
        icon: 'cellphone',
        text: screenAttr.value,
      });
    }

    if (batteryAttr) {
      list.push({
        icon: 'battery-high',
        text: batteryAttr.value.toLowerCase().includes('battery')
          ? batteryAttr.value
          : `${batteryAttr.value} Battery`,
      });
    }

    if (osAttr) {
      list.push({
        icon: 'android',
        text: osAttr.value,
      });
    }

    const weightVal = skuData?.weight || attrs.find((a) => /^weight$/i.test(a.attribute?.trim()))?.value;
    if (weightVal) {
      list.push({
        icon: 'scale',
        text: typeof weightVal === 'number' ? `${weightVal} kg Weight` : `${weightVal} Weight`,
      });
    }

    const handledAttributes = [
      ramAttr,
      romAttr,
      processorAttr,
      rearCameraAttr,
      frontCameraAttr,
      screenAttr,
      batteryAttr,
      osAttr,
    ].filter(Boolean);

    attrs.forEach((attr) => {
      if (/color|colour/i.test(attr.attribute || '')) return;
      if (handledAttributes.some((h) => h.attribute === attr.attribute)) return;
      if (/weight/i.test(attr.attribute || '') && weightVal) return;

      list.push({
        icon: 'check-circle-outline',
        text: `${attr.attribute}: ${attr.value}`,
      });
    });

    return list;
  }, [skuData]);

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[AllColors.primary]}
            tintColor={AllColors.primary}
          />
        }
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
                style={styles.imageFlatList}
                contentContainerStyle={styles.imageFlatListContent}
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
            {skuData?.name || product?.sku_name || product?.name || 'Product Name'}
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

          {/* Stock Status Badge */}
          {outOfStockFlag ? (
            <View style={styles.stockStatusBadgeOutOfStock}>
              <Ionicons name="close-circle" size={13} color="#DC2626" />
              <Text style={styles.stockStatusTextOutOfStock}>Out of Stock</Text>
            </View>
          ) : (
            <View style={styles.stockStatusBadgeInStock}>
              <Ionicons name="checkmark-circle" size={13} color="#059669" />
              <Text style={styles.stockStatusTextInStock}>
                {product?.available_qty !== undefined && product?.available_qty !== null
                  ? product.available_qty <= 10
                    ? `Only ${product.available_qty} left in stock - order soon`
                    : `In Stock (${product.available_qty} available)`
                  : 'In Stock'}
              </Text>
            </View>
          )}

          {/* Short Description */}
          {product?.short_desc ? (
            <Text style={[styles.shortDescText, { color: theme.textSecondary }]}>
              {product?.short_desc}
            </Text>
          ) : null}

          {/* Flipkart Style - Selected Color Swatches */}
          {colorSection && colorSection.items.length > 0 && (
            <View style={styles.fkSectionContainer}>
              <View style={styles.fkSectionHeader}>
                <Text style={[styles.fkSectionTitle, { color: theme.textPrimary }]}>
                  {colorSection.title}:{' '}
                  <Text style={[styles.fkSectionValue, { color: theme.textSecondary }]}>
                    {colorSection.selectedLabel}
                  </Text>
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.fkScroll}
              >
                {colorSection.items.map((cItem) => {
                  const isSelected = cItem.is_selected;
                  const isOutOfStock = !cItem.in_stock;

                  return (
                    <TouchableOpacity
                      key={cItem.id}
                      style={[
                        styles.fkColorCard,
                        {
                          backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                          borderColor: isSelected
                            ? (isDarkMode ? '#F8FAFC' : '#0F172A')
                            : (isDarkMode ? '#334155' : '#CBD5E1'),
                          borderWidth: isSelected ? 2 : 1,
                          opacity: isOutOfStock ? 0.5 : 1,
                        },
                      ]}
                      onPress={() => handleSelectColor(cItem)}
                      activeOpacity={0.7}
                    >
                      {cItem.image ? (
                        <Image
                          source={{ uri: cItem.image }}
                          style={styles.fkColorImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.fkColorFallback}>
                          <Text
                            style={[
                              styles.fkColorFallbackText,
                              { color: isSelected ? theme.textPrimary : theme.textSecondary },
                            ]}
                            numberOfLines={2}
                          >
                            {cItem.value}
                          </Text>
                        </View>
                      )}
                      {isOutOfStock && (
                        <View style={styles.fkColorOosTag}>
                          <Text style={styles.fkColorOosText}>Out of stock</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Flipkart Style - Variant Cards / Options */}
          {variantSections && variantSections.length > 0 && (
            <View style={styles.fkVariantSectionsWrapper}>
              {variantSections.map((vGroup, gIdx) => (
                <View key={`vgroup-${gIdx}`} style={styles.fkSectionContainer}>
                  <View style={styles.fkSectionHeader}>
                    <Text style={[styles.fkSectionTitle, { color: theme.textPrimary }]}>
                      {vGroup.title}:{' '}
                      <Text style={[styles.fkSectionValue, { color: theme.textSecondary }]}>
                        {vGroup.selectedLabel}
                      </Text>
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.fkScroll}
                  >
                    {vGroup.items.map((item) => {
                      const isSelected = item.is_selected;
                      const isOutOfStock = !item.in_stock;

                      if (item.isChipOnly || !vGroup.isVariantCards) {
                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={[
                              styles.fkChip,
                              {
                                backgroundColor: isSelected
                                  ? (isDarkMode ? '#1E293B' : '#FEF2F2')
                                  : (isDarkMode ? '#0F172A' : '#FFFFFF'),
                                borderColor: isSelected
                                  ? (isDarkMode ? '#F8FAFC' : '#0F172A')
                                  : (isDarkMode ? '#334155' : '#CBD5E1'),
                                borderWidth: isSelected ? 2 : 1,
                                opacity: isOutOfStock ? 0.5 : 1,
                              },
                            ]}
                            onPress={() => handleSelectVariantOption(item)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.fkChipText,
                                {
                                  color: isSelected ? theme.textPrimary : theme.textSecondary,
                                  fontWeight: isSelected ? '700' : '600',
                                  textDecorationLine: isOutOfStock ? 'line-through' : 'none',
                                },
                              ]}
                            >
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      }

                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.fkVariantCard,
                            {
                              backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                              borderColor: isSelected
                                ? (isDarkMode ? '#F8FAFC' : '#0F172A')
                                : (isDarkMode ? '#334155' : '#CBD5E1'),
                              borderWidth: isSelected ? 2 : 1,
                              opacity: isOutOfStock ? 0.55 : 1,
                            },
                          ]}
                          onPress={() => handleSelectVariantOption(item)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.fkVariantTitle,
                              {
                                color: theme.textPrimary,
                                fontWeight: isSelected ? '700' : '600',
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {item.label}
                          </Text>

                          {item.hasDiscount && (
                            <View style={styles.fkVariantDiscountRow}>
                              <Text style={styles.fkVariantDiscountDown}>
                                ↓{item.discountPercent}%
                              </Text>
                              <Text style={styles.fkVariantOldMrp}>
                                ₹{item.actualPrice}
                              </Text>
                            </View>
                          )}

                          {item.price !== undefined && item.price !== null && (
                            <Text
                              style={[
                                styles.fkVariantPrice,
                                { color: theme.textPrimary },
                              ]}
                            >
                              ₹{item.price}
                            </Text>
                          )}

                          {isOutOfStock && (
                            <Text style={styles.fkVariantOosText}>Out of stock</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ))}
            </View>
          )}

          {/* Flipkart Style - Product Highlights Accordion */}
          {highlights && highlights.length > 0 && (
            <View
              style={[
                styles.highlightsSection,
                {
                  borderTopColor: isDarkMode ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => setIsHighlightsOpen(!isHighlightsOpen)}
                activeOpacity={0.7}
              >
                <Text style={[styles.accordionTitle, { color: theme.textPrimary }]}>
                  Product highlights
                </Text>
                <View
                  style={[
                    styles.chevronBadge,
                    { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' },
                  ]}
                >
                  <Feather
                    name={isHighlightsOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={theme.textPrimary}
                  />
                </View>
              </TouchableOpacity>

              {isHighlightsOpen && (
                <View style={styles.highlightsList}>
                  {highlights.map((item, idx) => (
                    <View key={`hl-${idx}`} style={styles.highlightRow}>
                      <View
                        style={[
                          styles.highlightIconBox,
                          { backgroundColor: isDarkMode ? '#0F2942' : '#E0F2FE' },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={item.icon}
                          size={20}
                          color={isDarkMode ? '#38BDF8' : '#0284C7'}
                        />
                      </View>
                      <Text
                        style={[
                          styles.highlightText,
                          { color: theme.textPrimary },
                        ]}
                      >
                        {item.text}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Flipkart Style - All Details / Specifications Accordion */}
          {(skuData?.sku_code || skuData?.weight || skuData?.dimensions || (Array.isArray(skuData?.attributes) && skuData.attributes.length > 0) || skuData?.available_qty !== undefined || skuData?.seller_name) && (
            <View
              style={[
                styles.allDetailsSection,
                {
                  borderTopColor: isDarkMode ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => setIsAllDetailsOpen(!isAllDetailsOpen)}
                activeOpacity={0.7}
              >
                <Text style={[styles.accordionTitle, { color: theme.textPrimary }]}>
                  All details
                </Text>
                <View
                  style={[
                    styles.chevronBadge,
                    { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' },
                  ]}
                >
                  <Feather
                    name={isAllDetailsOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={theme.textPrimary}
                  />
                </View>
              </TouchableOpacity>

              {isAllDetailsOpen && (
                <View
                  style={[
                    styles.specsTable,
                    {
                      backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                      borderColor: theme.borderColor,
                      marginTop: 12,
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
                  {Array.isArray(skuData?.attributes) && skuData.attributes.length > 0 &&
                    skuData.attributes.map((attr, idx) => (
                      <View key={`attr-${idx}`} style={styles.specRow}>
                        <Text style={[styles.specLabel, { color: theme.textSecondary }]}>
                          {attr.attribute || 'Attribute'}
                        </Text>
                        <Text style={[styles.specValue, { color: theme.textPrimary }]}>
                          {attr.value}
                        </Text>
                      </View>
                    ))
                  }
                  {skuData?.weight ? (
                    <View style={styles.specRow}>
                      <Text style={[styles.specLabel, { color: theme.textSecondary }]}>Weight</Text>
                      <Text style={[styles.specValue, { color: theme.textPrimary }]}>
                        {skuData.weight} {typeof skuData.weight === 'number' ? 'kg' : ''}
                      </Text>
                    </View>
                  ) : null}
                  {skuData?.dimensions ? (
                    <View style={styles.specRow}>
                      <Text style={[styles.specLabel, { color: theme.textSecondary }]}>Dimensions</Text>
                      <Text style={[styles.specValue, { color: theme.textPrimary }]}>
                        {skuData.dimensions}
                      </Text>
                    </View>
                  ) : null}
                  {skuData?.available_qty !== undefined && skuData?.available_qty !== null ? (
                    <View style={styles.specRow}>
                      <Text style={[styles.specLabel, { color: theme.textSecondary }]}>Available Stock</Text>
                      <Text style={[styles.specValue, { color: skuData.available_qty > 0 ? '#059669' : '#EF4444' }]}>
                        {skuData.available_qty} units
                      </Text>
                    </View>
                  ) : null}
                  {skuData?.seller_name ? (
                    <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
                      <Text style={[styles.specLabel, { color: theme.textSecondary }]}>Seller</Text>
                      <Text style={[styles.specValue, { color: theme.textPrimary }]}>
                        {skuData.seller_name}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
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
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageFlatList: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageFlatListContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  imageShieldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
    elevation: 10,
  },
  meeshoOutOfStockBadgeLarge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#000000',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meeshoOutOfStockTextLarge: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
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
    position: 'relative',
    overflow: 'hidden',
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
  /* Flipkart-style Variant & Highlights Design */
  fkVariantSectionsWrapper: {
    marginBottom: 4,
  },
  fkSectionContainer: {
    marginTop: 14,
    marginBottom: 4,
  },
  fkSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  fkSectionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  fkSectionValue: {
    fontWeight: '500',
  },
  fkScroll: {
    paddingVertical: 3,
    paddingRight: 10,
  },
  fkColorCard: {
    width: 70,
    height: 86,
    borderRadius: 10,
    marginRight: 10,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fkColorImage: {
    width: '100%',
    height: '100%',
  },
  fkColorFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    padding: 4,
  },
  fkColorFallbackText: {
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  fkColorOosTag: {
    position: 'absolute',
    bottom: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  fkColorOosText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '700',
  },
  fkVariantCard: {
    minWidth: 114,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 10,
    justifyContent: 'center',
  },
  fkVariantTitle: {
    fontSize: 13,
    marginBottom: 2,
  },
  fkVariantDiscountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 1,
  },
  fkVariantDiscountDown: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  fkVariantOldMrp: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  fkVariantPrice: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  fkVariantOosText: {
    fontSize: 9.5,
    color: '#EF4444',
    fontWeight: '700',
    marginTop: 2,
  },
  fkChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 46,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fkChipText: {
    fontSize: 13.5,
    textAlign: 'center',
  },
  highlightsSection: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  allDetailsSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  chevronBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightsList: {
    marginTop: 14,
    gap: 12,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  highlightIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightText: {
    fontSize: 13.5,
    fontWeight: '500',
    flex: 1,
    lineHeight: 19,
  },
  stockStatusBadgeOutOfStock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: -4,
  },
  stockStatusTextOutOfStock: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  stockStatusBadgeInStock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: -4,
  },
  stockStatusTextInStock: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
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