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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AllColors from '../Constants/Color';
import { BASE_URL, getToken, getuserId } from '../Api/Api';

const { width } = Dimensions.get('window');
const slideWidth = width - 32;

export default function ProductDetails({ route }) {
  const [product, setProduct] = useState({});
  const [productImage, setProductImage] = useState(null);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { id } = route.params || {};
  const navigation = useNavigation();

  const getProductImages = () => {
    if (!product?.image) return [];
    if (Array.isArray(product.image)) return product.image;
    if (typeof product.image === 'string') return [product.image];
    return [];
  };

  useFocusEffect(
    React.useCallback(() => {
      getPrductDetails();
      getWishlistStatus();
      getCartStatus();
    }, [id])
  );

  const shareProduct = async () => {
    try {
      await Share.share({
        title: product?.name || 'Product Details',
        message: `${product?.name || ''}\n\nPrice: ₹${product?.discount_price || ''}\n\n${product?.short_desc || ''}\n\n${productImage || ''}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const getPrductDetails = async () => {
    setLoading(true);
    const userId = await getuserId();
    const formData = new FormData();
    formData.append('product_id', id);
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
        if (data.data.image && data.data.image.length > 0) {
          setProductImage(data.data.image[0]);
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
    const userId = await getuserId();
    if (!userId) return;

    try {
      const formData = new FormData();
      formData.append('user_id', userId);

      const response = await fetch(`${BASE_URL}cart-view`, {
        method: 'POST',
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
          // ToastAndroid.show(
          //   isWishlisted ? 'Removed from wishlist' : 'Added to wishlist',
          //   ToastAndroid.SHORT
          // );
        } else {
          Alert.alert('Success', isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
        }
      } else {
        throw new Error(data?.message || 'Wishlist action failed');
      }
    } catch (error) {
      console.log('Wishlist toggle error:', error);
      if (Platform.OS === 'android') {
        // ToastAndroid.show('Something went wrong', ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', 'Something went wrong');
      }
    }
  };

  const requestToCart = async () => {
    const userId = await getuserId();
    if (!userId) {
      navigation.navigate('Login');
      return;
    }

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('product_id', id);
    formData.append('qty', 1);

    try {
      const response = await fetch(`${BASE_URL}cart-to-add`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data?.status == 200 || data?.success) {
        setIsAddedToCart(true);

        if (Platform.OS === 'android') {
          // ToastAndroid.show('✅ Product added to cart successfully', ToastAndroid.SHORT);
        } else {
          Alert.alert('Success', 'Product added to cart successfully');
        }
      }
    } catch (error) {
      console.log('Error adding to cart:', error);
      if (Platform.OS === 'android') {
        // ToastAndroid.show('Something went wrong', ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', 'Something went wrong');
      }
    }
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
    if (isAddedToCart) {
      navigateToCart();
      return;
    }
    await IsUser();
  };

  const handleBuyNow = async () => {
    if (!isAddedToCart) {
      const token = await getToken();
      if (!token) {
        navigation.navigate('Login');
        return;
      }
      await requestToCart();
    }
    navigateToCart();
  };

  const discountPercent =
    product?.actual_price && product?.discount_price && product.actual_price > product.discount_price
      ? Math.round(((product.actual_price - product.discount_price) / product.actual_price) * 100)
      : null;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
        <ActivityIndicator size="large" color={AllColors.primary} />
        <Text style={styles.loadingText}>Loading Product...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#F4F5F9" barStyle="dark-content" />

      {/* Top Header & Product Image Section */}
      <View style={styles.imageHeaderCard}>
        {/* Navigation Bar */}
        <View style={styles.topNav}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color="#1E293B" />
          </TouchableOpacity>

          <View style={styles.rightNavGroup}>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={toggleWishlist}
              activeOpacity={0.8}>
              <AntDesign
                name={isWishlisted ? 'heart' : 'hearto'}
                size={20}
                color={isWishlisted ? '#EF4444' : '#1E293B'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circleBtn}
              onPress={shareProduct}
              activeOpacity={0.8}>
              <Ionicons name="share-social-outline" size={20} color="#1E293B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Product Image Slider */}
        <View style={styles.imageWrapper}>
          <FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={getProductImages()}
            keyExtractor={(item, index) => String(index)}
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
        </View>

        {/* Pagination Dots */}
        {getProductImages().length > 1 && (
          <View style={styles.paginationContainer}>
            {getProductImages().map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  activeImageIndex === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Product Details Section */}
      <View style={styles.contentSection}>
        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>PREMIUM PRODUCT</Text>
        </View>

        {/* Title */}
        <Text style={styles.productTitle} numberOfLines={2}>
          {product?.name || 'Product Name'}
        </Text>

        {/* Price Row */}
        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>₹{product?.discount_price ?? 0}</Text>
          {product?.actual_price ? (
            <Text style={styles.oldPriceText}>₹{product?.actual_price}</Text>
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
          <Text style={styles.shortDescText} numberOfLines={2}>
            {product?.short_desc}
          </Text>
        ) : null}

        {/* Description Header & Text */}
        <View style={styles.descSection}>
          <Text style={styles.descTitle}>Description</Text>
          <Text style={styles.fullDescText} numberOfLines={5}>
            {product?.desc || product?.short_desc || 'No description available for this product.'}
          </Text>
        </View>

        {/* Highlight Features Row */}
        <View style={styles.featuresRow}>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark-outline" size={18} color={AllColors.primary} />
            <Text style={styles.featureText}>100% Genuine</Text>
          </View>
          <View style={styles.featureDivider} />
          <View style={styles.featureItem}>
            <Feather name="truck" size={18} color={AllColors.primary} />
            <Text style={styles.featureText}>Fast Delivery</Text>
          </View>
          <View style={styles.featureDivider} />
          <View style={styles.featureItem}>
            <Ionicons name="refresh-outline" size={18} color={AllColors.primary} />
            <Text style={styles.featureText}>Easy Return</Text>
          </View>
        </View>
      </View>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={handleCart}
          activeOpacity={0.85}>
          <Ionicons
            name={isAddedToCart ? 'bag-check-outline' : 'cart-outline'}
            size={20}
            color={AllColors.primary}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.cartButtonText}>
            {isAddedToCart ? 'Go To Cart' : 'Add To Cart'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buyButtonWrapper}
          onPress={handleBuyNow}
          activeOpacity={0.85}>
          <LinearGradient
            colors={[AllColors.primary, '#D8065B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buyGradient}>
            <Feather name="zap" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.buyButtonText}>Buy Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  /* Image Header Card */
  imageHeaderCard: {
    height: '38%',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000000',
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
    zIndex: 10,
  },
  rightNavGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 12,
  },
  productImg: {
    width: '85%',
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
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 14,
    backgroundColor: AllColors.primary,
  },

  /* Content Section */
  contentSection: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 12,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: AllColors.lightPink || '#FCEBF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: AllColors.primary,
    letterSpacing: 0.5,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 20,
    gap: 3,
  },
  discountBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },

  productTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
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
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  shortDescText: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },

  descSection: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  descTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  fullDescText: {
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 20,
  },

  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  featureDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#CBD5E1',
  },

  /* Bottom Bar */
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    gap: 12,
    elevation: 10,
    shadowColor: '#000000',
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
    backgroundColor: '#FFFFFF',
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
    color: '#FFFFFF',
  },
});