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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BASE_URL, getToken, getuserId } from '../../../Api/Api';
import AllColors from '../../../Constants/Color';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LottieView from "lottie-react-native";
import { useTheme } from '../../../Context/ThemeContext';
import DifferentSellerModal from '../../../Common/DifferentSellerModal';
import {
  checkDifferentSeller,
  saveActiveCartSeller,
  getActiveCartSeller,
  clearActiveCartSeller,
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
      const formData = new FormData();
      formData.append('user_id', userId);

      const response = await fetch(`${BASE_URL}wishlist-view`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      const items = data?.data || data?.products || data?.wishlist || [];
      const normalizedItems = items.map((entry) => entry?.product || entry);
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
      const data = await response.json();
      const items = data?.data || data?.cart || [];
      const validItems = Array.isArray(items) ? items : [];
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
        const formData = new FormData();
        formData.append('user_id', userId);
        const cartResp = await fetch(`${BASE_URL}cart-view`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: formData,
        });
        const cartJson = await cartResp.json();
        currentCart = (cartJson?.data && Array.isArray(cartJson.data)) ? cartJson.data : [];
        setCartItems(currentCart);
      } catch (e) {
        console.log('Error refreshing cart in wishlist:', e);
      }
    }

    const cachedSeller = await getActiveCartSeller();
    if (currentCart && currentCart.length > 0) {
      const sellerCheck = checkDifferentSeller(currentCart, item, cachedSeller);
      if (sellerCheck.isDifferent) {
        setSellerModalData({
          cartSellerName: sellerCheck.cartSellerName,
          targetSellerName: sellerCheck.targetSellerName,
          targetSellerId: sellerCheck.targetSellerId,
          targetProduct: item,
        });
        setSellerModalVisible(true);
        return;
      }
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

      if (data.status == 200) {
        await saveActiveCartSeller(item);
        getCartItems();
        if (Platform.OS === 'android') {
        } else {
          Alert.alert('Success', 'Product added to cart successfully');
        }
      }
    } catch (error) {
      console.log('Error:', error);

      if (Platform.OS === 'android') {
      } else {
        Alert.alert('Error', 'Something went wrong');
      }
    }
  }
  const removeWishlistItem = async (product_id) => {
    const userId = await getuserId();

    try {
      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("product_id", product_id);

      const response = await fetch(`${BASE_URL}wishlist-remove`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && (data.status === 200 || data.success)) {
        setWishlistItems((prev) =>
          prev.filter((item) => item.id !== product_id)
        );
      } else {
        Alert.alert("Error", data.message || "Failed to remove product");
      }
    } catch (error) {
      console.log("Wishlist Remove Error:", error);
    }
  };
  useFocusEffect(
    useCallback(() => {
      getWishlistItems();
    }, [])
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar backgroundColor={isDarkMode ? theme.cardBg : AllColors.white} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
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
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor, borderWidth: isDarkMode ? 1 : 0 }]}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('ProductDetails', {
                    id: item.id || item.product_id,
                  })
                }
                style={styles.productRow}
              >
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: item.image }}
                    style={[styles.image, { backgroundColor: isDarkMode ? '#0F172A' : AllColors.screenBg }]}
                    resizeMode="contain"
                  />
                  {isOutOfStock(item) && (
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
                    onPress={() => removeWishlistItem(item.id)}
                  >
                    <Text style={[styles.removeText, { color: isDarkMode ? '#CBD5E1' : undefined }]}>Remove</Text>
                  </TouchableOpacity>

                  {isOutOfStock(item) ? (
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
            </View>
          )}
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
        targetSellerName={sellerModalData.targetSellerName}
        targetSellerId={sellerModalData.targetSellerId}
        targetProduct={sellerModalData.targetProduct}
        onClose={() => setSellerModalVisible(false)}
        onViewSellerProducts={() => {
          const sId = sellerModalData.targetSellerId;
          const sName = sellerModalData.targetSellerName;
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
    paddingVertical: 14,
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