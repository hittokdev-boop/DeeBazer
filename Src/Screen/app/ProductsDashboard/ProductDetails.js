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
import { BASE_URL, getToken, getuserId } from '../../../Api/Api';
import { useTheme } from '../../../Context/ThemeContext';

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

  const { id } = route.params || {};
  const navigation = useNavigation();

  const getProductImages = () => {
    if (!product) return [];
    if (Array.isArray(product.image)) {
      const list = product.image.filter((img) => typeof img === 'string' && img.trim().length > 0);
      if (list.length > 0) return list;
    }
    if (typeof product.image === 'string' && product.image.trim()) {
      return [product.image];
    }
    if (Array.isArray(product.images)) {
      const list = product.images.filter((img) => typeof img === 'string' && img.trim().length > 0);
      if (list.length > 0) return list;
    }
    if (Array.isArray(product.gallery)) {
      const list = product.gallery.filter((img) => typeof img === 'string' && img.trim().length > 0);
      if (list.length > 0) return list;
    }
    return [];
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
    }, [id, navigation])
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

  const getPrductDetails = async () => {
    const productId = id || route.params?.id;
    if (!productId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const userId = await getuserId();
    const formData = new FormData();
    formData.append('product_id', productId);
    if (userId) {
      formData.append('user_id', userId);
    }

    try {
      const response = await fetch(`${BASE_URL}product-details`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data?.data) {
        setProduct(data.data);
        if (data.data.image) {
          if (Array.isArray(data.data.image) && data.data.image.length > 0) {
            setProductImage(data.data.image[0]);
          } else if (typeof data.data.image === 'string') {
            setProductImage(data.data.image);
          }
        }
        if (data.data.isCartProduct !== undefined) {
          setIsAddedToCart(!!data.data.isCartProduct);
        }
        setIsWishlisted(!!data.data.isWishlistProduct);
      }
    } catch (error) {
      console.log('Error fetching product details:', error);
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
      const inCart = items.some(
        (item) => String(item?.product_id ?? item?.id ?? item?.product?.id) === String(id)
      );
      if (inCart) {
        setIsAddedToCart(true);
      }
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
      const hasProduct = items.some(
        (entry) => String(entry?.product_id ?? entry?.id ?? entry?.product?.id) === String(id)
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

    const endpoint = isWishlisted ? 'wishlist-remove' : 'wishlist-add';
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('product_id', id);

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

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('product_id', id);
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
        setIsAddedToCart(true);
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
  const productImages = getProductImages();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
        <StatusBar
          backgroundColor={isDarkMode ? theme.bg : '#fff'}
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
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
          backgroundColor={isDarkMode ? theme.bg : '#fff'}
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
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
        backgroundColor={isDarkMode ? theme.cardBg : '#F4F5F9'}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
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

          {/* Description Section */}
          <View style={styles.descSection}>
            <Text style={[styles.descTitle, { color: theme.textPrimary }]}>Description</Text>
            <Text style={[styles.fullDescText, { color: theme.textSecondary }]}>
              {product?.desc || product?.short_desc || 'No description available for this product.'}
            </Text>
          </View>

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
            <View style={[styles.featureDivider, { backgroundColor: theme.divider }]} />
            <View style={styles.featureItem}>
              <Ionicons name="refresh-outline" size={18} color={AllColors.primary} />
              <Text style={[styles.featureText, { color: theme.textPrimary }]}>Easy Return</Text>
            </View>
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
    height: 350,
    backgroundColor: AllColors.white,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
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
});