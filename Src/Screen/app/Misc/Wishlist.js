import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  ToastAndroid,
  View,
  Alert,
  Share,
  RefreshControl,
  ScrollView,
  Platform,
  StatusBar,
  DeviceEventEmitter,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  viewWishlistApi,
  removeFromWishlistApi,
  getCartViewApi,
  addToCartApi,
  getToken,
  getuserId,
} from '../../../Api/Api';
import AllColors from '../../../Constants/Color';
import { STATUSBAR_HEIGHT } from '../../../Constants/ScreenUtils';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LottieView from "lottie-react-native";
import { useTheme } from '../../../Context/ThemeContext';
import DifferentSellerModal from '../../../Common/DifferentSellerModal';
import {
  checkDifferentSeller,
  saveActiveCartSeller,
  getActiveCartSeller,
  clearActiveCartSeller,
  extractCartItems,
} from '../../../Common/sellerUtils';

// import Icon from 'react-native-vector-icons/Icon';
export default function Wishlist() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [sellerModalVisible, setSellerModalVisible] = useState(false);
  const [sellerModalData, setSellerModalData] = useState({
    cartSellerName: '',
    cartSellerId: null,
    targetSellerName: '',
    targetSellerId: null,
    targetProduct: null,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getWishlistItems = async () => {
    if (!refreshing) {
      setLoading(true);
    }
    const token = await getToken();
    const userId = await getuserId();

    if (!token || !userId) {
      setWishlistItems([]);
      setRefreshing(false);
      setLoading(false);
      return;
    }

    try {
      const data = await viewWishlistApi();
      const items = data?.data || data?.products || data?.wishlist || [];
      const validItems = Array.isArray(items) ? items : [];
      const normalizedItems = validItems
        .filter(Boolean)
        .map((entry) => {
          const p = (entry.product && typeof entry.product === 'object') ? entry.product : {};
          return {
            ...p,
            ...entry,
            id: entry.id ?? p.id,
            wishlist_id: entry.id,
            product_sku_id: entry.product_sku_id ?? p.product_sku_id ?? entry.sku_id ?? p.sku_id ?? entry.id,
            sku_id: entry.product_sku_id ?? p.product_sku_id ?? entry.sku_id ?? p.sku_id ?? entry.id,
            seller_sku_id: entry.seller_sku_id ?? p.seller_sku_id,
            seller_id: entry.seller_id ?? p.seller_id ?? entry.seller?.id ?? p.seller?.id,
            seller_name: entry.seller_name ?? p.seller_name ?? entry.seller?.shop_name ?? p.seller?.shop_name,
            image: entry.image || p.image || (Array.isArray(p.images) ? p.images[0] : null) || (Array.isArray(entry.images) ? entry.images[0] : null),
            is_active: entry.is_active ?? p.is_active ?? entry.isActive ?? p.isActive ?? entry.isactive ?? p.isactive ?? entry.sku?.is_active ?? entry.sku?.isActive ?? entry.product?.is_active ?? entry.product?.isActive ?? entry.active ?? p.active,
            isActive: entry.isActive ?? entry.is_active ?? p.isActive ?? p.is_active ?? entry.isactive ?? p.isactive,
            status: entry.status ?? p.status ?? entry.sku?.status ?? p.sku?.status ?? entry.product?.status,
            is_available: entry.is_available ?? p.is_available ?? entry.isAvailable ?? p.isAvailable ?? entry.available ?? p.available,
          };
        });
      setWishlistItems(normalizedItems);
    } catch (error) {
      console.log('Wishlist screen fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getCartItems = async () => {
    const token = await getToken();
    const userId = await getuserId();
    if (!token || !userId) {
      setCartItems([]);
      return;
    }
    try {
      const data = await getCartViewApi();
      const validItems = extractCartItems(data?.data);
      setCartItems(validItems);

      if (validItems.length === 0) {
        await clearActiveCartSeller();
      } else {
        await saveActiveCartSeller(validItems[0]);
      }
    } catch (error) {
      console.log('Cart fetch error in wishlist:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getWishlistItems();
      getCartItems();
    }, [])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('WISHLIST_UPDATED', () => {
      getWishlistItems();
    });
    return () => sub.remove();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    getWishlistItems();
    getCartItems();
  };

  const onShare = async (item) => {
    try {
      const playStoreUrl = `https://play.google.com/store/apps/details?id=com.deebazar.shopping&referrer=product_id%3D${item.id}`;
      const deepLinkUrl = `deebazar://product/${item.id}`;

      const message = `${item.name}\n\nPrice: ₹${item.discount_price}\n\nCheck out this product on DeeBazar!\n\nIf the app is installed, open directly:\n${deepLinkUrl}\n\nIf the app is not installed, install it from Play Store:\n${playStoreUrl}`;

      await Share.share({
        title: item.name,
        message: message,
      });
    } catch (error) {
      console.log(error);
    }
  };
  const isItemInactive = (item) => {
    if (!item) return false;

    // Check direct and nested active flag candidates
    const activeCandidates = [
      item.is_active,
      item.isActive,
      item.isactive,
      item.active,
      item.product?.is_active,
      item.product?.isActive,
      item.product?.isactive,
      item.sku?.is_active,
      item.sku?.isActive,
      item.seller?.is_active,
      item.seller?.isActive,
    ];

    for (const val of activeCandidates) {
      if (val !== undefined && val !== null) {
        if (
          val === false ||
          val === 0 ||
          val === '0' ||
          val === 'false' ||
          val === 'inactive' ||
          val === 'no' ||
          val === 'disabled' ||
          val === 'deactivated'
        ) {
          return true;
        }
      }
    }

    // Check status candidates
    const statusCandidates = [
      item.status,
      item.product?.status,
      item.sku?.status,
      item.product_status,
      item.sku_status,
      item.item_status,
    ];

    for (const val of statusCandidates) {
      if (val !== undefined && val !== null) {
        const s = String(val).toLowerCase().trim();
        if (
          s === '0' ||
          s === 'false' ||
          s === 'inactive' ||
          s === 'disabled' ||
          s === 'unavailable' ||
          s === 'deactivated' ||
          s === 'blocked'
        ) {
          return true;
        }
      }
    }

    // Check availability candidates
    const availCandidates = [
      item.is_available,
      item.isAvailable,
      item.available,
      item.product?.is_available,
      item.product?.isAvailable,
      item.sku?.is_available,
    ];

    for (const val of availCandidates) {
      if (val !== undefined && val !== null) {
        if (
          val === false ||
          val === 0 ||
          val === '0' ||
          val === 'false' ||
          val === 'no' ||
          val === 'unavailable'
        ) {
          return true;
        }
      }
    }

    return false;
  };

  const isOutOfStock = (item) => {
    if (!item) return false;
    if (item.in_stock === false || item.in_stock === 0 || item.in_stock === '0' || item.in_stock === 'false' || item.in_stock === 'no' || item.in_stock === 'out_of_stock') return true;
    if (item.out_of_stock === true || item.out_of_stock === 1 || item.out_of_stock === '1' || item.out_of_stock === 'true' || item.out_of_stock === 'yes') return true;
    if (item.is_out_of_stock === true || item.is_out_of_stock === 1 || item.is_out_of_stock === '1' || item.is_out_of_stock === 'true' || item.is_out_of_stock === 'yes') return true;
    if (item.is_stock === false || item.is_stock === 0 || item.is_stock === '0' || item.is_stock === 'false' || item.is_stock === 'no') return true;
    if (item.stock !== undefined && item.stock !== null && (item.stock === false || item.stock === 'false' || item.stock === 0 || item.stock === '0' || item.stock === 'no' || Number(item.stock) <= 0)) return true;
    if (item.stock_quantity !== undefined && item.stock_quantity !== null && (item.stock_quantity === '' || Number(item.stock_quantity) <= 0)) return true;
    if (item.quantity !== undefined && item.quantity !== null && (item.quantity === '' || Number(item.quantity) <= 0)) return true;
    if (item.available_quantity !== undefined && item.available_quantity !== null && Number(item.available_quantity) <= 0) return true;
    if (item.available_stock !== undefined && item.available_stock !== null && Number(item.available_stock) <= 0) return true;
    if (item.total_stock !== undefined && item.total_stock !== null && Number(item.total_stock) <= 0) return true;
    if (item.current_stock !== undefined && item.current_stock !== null && Number(item.current_stock) <= 0) return true;
    if (item.inventory !== undefined && item.inventory !== null && Number(item.inventory) <= 0) return true;
    if (item.stock_status && (
      item.stock_status === 'out_of_stock' ||
      item.stock_status === 'outofstock' ||
      item.stock_status === '0' ||
      item.stock_status === 0 ||
      item.stock_status === false ||
      String(item.stock_status).toLowerCase().includes('out')
    )) return true;
    if (item.status && (
      item.status === 'out_of_stock' ||
      item.status === 'outofstock' ||
      String(item.status).toLowerCase().includes('out')
    )) return true;
    return false;
  };

  const requestToCart = async (item) => {
    if (isItemInactive(item)) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('This product is currently unavailable', ToastAndroid.SHORT);
      } else {
        Alert.alert('Unavailable', 'This product is currently unavailable.');
      }
      return;
    }
    if (isOutOfStock(item)) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('This product is currently out of stock', ToastAndroid.SHORT);
      } else {
        Alert.alert('Out of Stock', 'This product is currently out of stock.');
      }
      return;
    }
    const id = item?.id || item?.product_id;
    const token = await getToken();
    const userId = await getuserId();
    if (!token || !userId) {
      navigation.navigate('Login');
      return;
    }

    // Single-seller policy check
    let currentCart = cartItems;
    if (!currentCart || currentCart.length === 0) {
      try {
        const cartJson = await getCartViewApi();
        currentCart = extractCartItems(cartJson?.data);
        setCartItems(currentCart);
      } catch (e) {
        console.log('Error refreshing cart in wishlist:', e);
      }
    }

    const cachedSeller = await getActiveCartSeller();
    if (currentCart && currentCart.length > 0) {
      const sellerCheck = await checkDifferentSeller(currentCart, item, cachedSeller);
      if (sellerCheck.isDifferent) {
        setSellerModalData({
          cartSellerName: sellerCheck.cartSellerName,
          cartSellerId: sellerCheck.cartSellerId,
          targetSellerName: sellerCheck.targetSellerName,
          targetSellerId: sellerCheck.targetSellerId,
          targetProduct: item,
        });
        setSellerModalVisible(true);
        return;
      }
    }

    const skuId = item?.product_sku_id ?? item?.sku_id ?? id;
    const sellerSkuId = item?.seller_sku_id;

    try {
      const data = await addToCartApi(
        skuId,
        1,
        sellerSkuId ? { seller_sku_id: sellerSkuId } : {},
        'add'
      );

      if (data.status == 200) {
        await saveActiveCartSeller(item);
        getCartItems();
        if (Platform.OS === 'android') {
          ToastAndroid.show('Product added to cart', ToastAndroid.SHORT);
        } else {
          Alert.alert('Success', 'Product added to cart successfully');
        }
      }
    } catch (error) {
      console.log('Error:', error);

      if (Platform.OS === 'android') {
        ToastAndroid.show('Failed to add product', ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', 'Something went wrong');
      }
    }
  }

  const removeWishlistItem = async (item) => {
    const token = await getToken();
    if (!token) return;

    const isObj = typeof item === 'object' && item !== null;
    const skuId = isObj ? (item?.product_sku_id ?? item?.sku_id ?? item?.id) : item;
    const sellerSkuId = isObj ? item?.seller_sku_id : null;
    const itemId = isObj ? item?.id : null;

    if (!skuId && !itemId) return;

    // Optimistically update list
    setWishlistItems((prev) =>
      prev.filter((i) => {
        if (itemId && i.id && String(i.id) === String(itemId)) return false;
        if (sellerSkuId && i.seller_sku_id && String(i.seller_sku_id) === String(sellerSkuId)) return false;
        const iSku = i.product_sku_id ?? i.sku_id;
        if (skuId && iSku && String(iSku) === String(skuId)) return false;
        return true;
      })
    );

    try {
      const data = await removeFromWishlistApi(skuId, sellerSkuId);

      if (response.ok && (data.status === 200 || data.success)) {
        DeviceEventEmitter.emit('WISHLIST_UPDATED');
        if (Platform.OS === 'android') {
          ToastAndroid.show('Removed from Wishlist', ToastAndroid.SHORT);
        }
      } else {
        getWishlistItems();
        Alert.alert("Error", data?.message || "Failed to remove product");
      }
    } catch (error) {
      console.log("Wishlist Remove Error:", error);
      getWishlistItems();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar backgroundColor="transparent" barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent={true} />
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
        <TouchableOpacity onPress={() => {
          if (navigation?.canGoBack && navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('AppTab');
          }
        }}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Wishlist</Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={AllColors.primary} style={styles.loaderMarginTop} />
      ) : wishlistItems.length === 0 ? (
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
          <View style={[styles.emptyContainer, { backgroundColor: theme.bg }]}>
            <LottieView
              source={require("../../../Assets/Wishlist.json")}
              autoPlay
              loop
              style={styles.emptyAnimation}
            />

            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              Your Wishlist is Empty
            </Text>

            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Save your favourite products here.
              {"\n"}
              Start exploring and add products to your wishlist.
            </Text>

            <TouchableOpacity
              style={styles.shopBtn}
              onPress={() => navigation.navigate('AppTab')}
            >
              <Text style={styles.shopBtnText}>
                Continue Shopping
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={wishlistItems}
          keyExtractor={(item, index) => (item?.id ? item.id.toString() : index.toString())}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[AllColors.primary]}
              tintColor={AllColors.primary}
            />
          }
          renderItem={({ item }) => {
            const inactive = isItemInactive(item);
            const outOfStock = isOutOfStock(item);

            return (
              <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor, borderWidth: isDarkMode ? 1 : 0 }]}>
                <TouchableOpacity
                  activeOpacity={inactive ? 1 : 0.8}
                  onPress={() => {
                    if (inactive) {
                      if (Platform.OS === 'android') {
                        ToastAndroid.show('This product is currently unavailable', ToastAndroid.SHORT);
                      } else {
                        Alert.alert('Unavailable', 'This product is currently unavailable.');
                      }
                      return;
                    }
                    navigation.navigate('ProductDetails', {
                      id: item.product_id || item.id,
                      sku_id: item.product_sku_id || item.sku_id || item.id,
                      product_sku_id: item.product_sku_id || item.sku_id || item.id,
                      seller_id: item.seller_id || item.sellerId || item.vendor_id || item.seller?.id || item.user_id,
                      seller_sku_id: item.seller_sku_id,
                      item,
                    });
                  }}
                  style={[styles.productRow, inactive && { opacity: 0.68 }]}
                >
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: item.image }}
                      style={[styles.image, { backgroundColor: isDarkMode ? '#0F172A' : AllColors.screenBg }]}
                      resizeMode="contain"
                    />
                    {outOfStock && !inactive && (
                      <View style={styles.outOfStockImageOverlay} pointerEvents="none">
                        <View style={styles.outOfStockPill}>
                          <Text style={styles.outOfStockPillText}>OUT OF STOCK</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  <View style={styles.details}>
                    <Text numberOfLines={2} style={[styles.title, { color: theme.textPrimary }]}>
                      {item.name}
                    </Text>

                    <View style={styles.priceRow}>
                      <Text style={[styles.price, { color: theme.textPrimary }]}>
                        ₹{item.discount_price}
                      </Text>

                      <Text style={[styles.oldPrice, { color: theme.textSecondary }]}>
                        ₹{item.actual_price}
                      </Text>

                      <Text style={styles.discount}>
                        {Math.round(
                          ((item.actual_price - item.discount_price) /
                            item.actual_price) *
                          100
                        )}
                        % Off
                      </Text>
                    </View>

                    <View style={styles.ratingRow}>
                      <Text style={styles.rating}>
                        ⭐ {item.rating || item.avg_rating || 0}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {inactive ? (
                  <View
                    style={[
                      styles.unavailableSingleBar,
                      {
                        backgroundColor: isDarkMode ? '#1E293B' : '#FEF2F2',
                        borderColor: isDarkMode ? '#334155' : '#FECACA',
                      },
                    ]}
                  >
                    <View style={styles.unavailableStatusGroup}>
                      <View
                        style={[
                          styles.unavailableShieldDot,
                          { backgroundColor: isDarkMode ? '#3B1818' : '#FEE2E2' },
                        ]}
                      >
                        <Ionicons
                          name="shield"
                          size={15}
                          color={isDarkMode ? '#F87171' : '#DC2626'}
                        />
                      </View>
                      <Text
                        style={[
                          styles.unavailableBarText,
                          { color: isDarkMode ? '#FCA5A5' : '#DC2626' },
                        ]}
                      >
                        Currently Unavailable
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.barRemoveBtn,
                        {
                          backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                          borderColor: isDarkMode ? '#475569' : '#E2E8F0',
                        },
                      ]}
                      onPress={() => removeWishlistItem(item)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={15}
                        color={isDarkMode ? '#CBD5E1' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.barRemoveText,
                          { color: isDarkMode ? '#CBD5E1' : '#64748B' },
                        ]}
                      >
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.bottomRow}>
                    <View style={styles.leftActions}>
                      <TouchableOpacity onPress={() => onShare(item)}>
                        <Ionicons
                          name="share-social-outline"
                          size={22}
                          color={theme.textPrimary}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.rightActions}>
                      <TouchableOpacity
                        style={[styles.removeBtn, { backgroundColor: isDarkMode ? '#334155' : undefined }]}
                        onPress={() => removeWishlistItem(item)}
                      >
                        <Text style={[styles.removeText, { color: isDarkMode ? '#CBD5E1' : undefined }]}>Remove</Text>
                      </TouchableOpacity>

                      {outOfStock ? (
                        <View style={styles.outOfStockBadge}>
                          <Text style={styles.outOfStockBadgeText}>Out of Stock</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.cartBtn}
                          onPress={() => requestToCart(item)}
                        >
                          <Text style={styles.cartBtnText}>
                            Add to cart
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyListWrapper}>
              <Text style={[styles.emptyListText, { color: theme.textSecondary }]}>
                No wishlist items found
              </Text>
            </View>
          }
        />
      )}

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

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: STATUSBAR_HEIGHT + 10,
    paddingBottom: 10,
    backgroundColor: AllColors.white,
    elevation: 3,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: AllColors.slateDark,
    marginLeft: 15,
  },

  card: {
    backgroundColor: AllColors.white,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    padding: 12,
    elevation: 4,
    shadowColor: AllColors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    position: 'relative',
    overflow: 'hidden',
  },

  productRow: {
    flexDirection: "row",
  },

  imageContainer: {
    width: 100,
    height: 120,
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: AllColors.screenBg,
  },

  outOfStockImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    zIndex: 5,
  },

  outOfStockPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
  },

  outOfStockPillText: {
    color: '#0F172A',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  details: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "space-between",
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: AllColors.slateDark,
    lineHeight: 22,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    flexWrap: "wrap",
  },

  price: {
    fontSize: 22,
    fontWeight: "bold",
    color: AllColors.primary,
  },

  oldPrice: {
    marginLeft: 10,
    color: AllColors.slateLight,
    textDecorationLine: "line-through",
    fontSize: 14,
  },

  discount: {
    marginLeft: 10,
    color: AllColors.greenSoftText,
    fontWeight: "700",
    fontSize: 13,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  rating: {
    backgroundColor: AllColors.greenLight,
    color: AllColors.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: "600",
    marginRight: 8,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: AllColors.divider,
    marginTop: 15,
    paddingTop: 15,
    zIndex: 15,
  },

  leftActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  rightActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  removeBtn: {
    backgroundColor: AllColors.redSoftBg,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 10,
  },

  cartBtn: {
    backgroundColor: AllColors.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },

  cartBtnText: {
    color: AllColors.white,
    fontWeight: "600",
    fontSize: 14,
  },

  outOfStockBadge: {
    backgroundColor: AllColors.redSoftBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  outOfStockBadgeText: {
    color: AllColors.redLight,
    fontWeight: "700",
    fontSize: 13,
  },

  unavailableSingleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
  },

  unavailableStatusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },

  unavailableShieldDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  unavailableBarText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  barRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },

  barRemoveText: {
    fontSize: 12.5,
    fontWeight: '600',
    marginLeft: 4,
  },

  unavailableShieldOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  shieldBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    maxWidth: '92%',
  },

  shieldIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  shieldTextCol: {
    flexShrink: 1,
  },

  shieldTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  shieldSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  unavailableBadge: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  unavailableBadgeText: {
    fontWeight: '700',
    fontSize: 13,
  },

  removeText: {
    color: AllColors.redLight,
    fontWeight: "600",
    fontSize: 14,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },

  emptyAnimation: {
    width: 250,
    height: 250,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: AllColors.primary,
    marginTop: 15,
  },

  emptySubtitle: {
    fontSize: 15,
    color: AllColors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 28,
  },

  shopBtn: {
    backgroundColor: AllColors.primary,
    borderRadius: 12,
    paddingHorizontal: 35,
    paddingVertical: 14,
    elevation: 3,
  },

  shopBtnText: {
    color: AllColors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  loaderMarginTop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollFlexGrow: {
    flexGrow: 1,
  },
  flatListContent: {
    paddingBottom: 100,
  },
  emptyListWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
  },
  emptyListText: {
    fontSize: 16,
    color: AllColors.textSecondary,
  },
});