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
import { BASE_URL, getToken, getuserId } from '../../Api/Api';
import AllColors from '../../Constants/Color';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LottieView from "lottie-react-native";
import { useTheme } from '../../Context/ThemeContext';

// import Icon from 'react-native-vector-icons/Icon';
export default function Wishlist() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const [wishlistItems, setWishlistItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const getWishlistItems = async () => {
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

  const onRefresh = () => {
    setRefreshing(true);
    getWishlistItems();
  };

  const onShare = async (item) => {
    try {
      await Share.share({
        title: item.name,
        message: `${item.name}
      
Price: ₹${item.discount_price}

https://deebazar.com/product/${item.id}`,
      });
    } catch (error) {
      console.log(error);
    }
  };
  const requestToCart = async (id) => {
    const userId = await getuserId();

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

      if (data.status == 200) {
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
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
              source={require("../../Assets/Wishlist.json")}
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
                <Image
                  source={{ uri: item.image }}
                  style={[styles.image, { backgroundColor: isDarkMode ? '#0F172A' : AllColors.screenBg }]}
                  resizeMode="contain"
                />

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
                      ⭐ {item.rating || 0}
                    </Text>

                    <Text style={{ color: theme.textSecondary, marginLeft: 8 }}>
                      {item.reviews || 0} Ratings
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

                  <TouchableOpacity
                    style={styles.cartBtn}
                    onPress={() => requestToCart(item.id)}
                  >
                    <Text style={styles.cartBtnText}>
                      Add to cart
                    </Text>
                  </TouchableOpacity>
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

  image: {
    width: 100,
    height: 120,
    borderRadius: 10,
    backgroundColor: AllColors.screenBg,
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
    marginTop: 24,
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