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
  const { theme } = useTheme();
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
      //  console.log('data', data);

      if (data.status == 200) {
        //  setIsAddedToCart(true);

        // Toast Message
        if (Platform.OS === 'android') {
          // ToastAndroid.show(
          //   '✅ Product added to cart successfully',
          //   ToastAndroid.SHORT
          // );
        } else {
          Alert.alert('Success', 'Product added to cart successfully');
        }
      }
    } catch (error) {
      console.log('Error:', error);

      if (Platform.OS === 'android') {
        // ToastAndroid.show(
        //   'Something went wrong',
        //   ToastAndroid.SHORT
        // );
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
      // console.log("Remove Response:", data);

      if (response.ok && (data.status === 200 || data.success)) {

        setWishlistItems((prev) =>
          prev.filter((item) => item.id !== product_id)
        );

        // ToastAndroid.show(
        //   "Product removed from wishlist",
        //   ToastAndroid.SHORT
        // );
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

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item?.image }} style={styles.image} />
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item?.name || 'Product'}</Text>
        <Text numberOfLines={2} style={styles.desc}>{item?.short_desc || item?.desc}</Text>
        <Text style={styles.price}>₹{item?.discount_price || item?.price || item?.actual_price}</Text>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromWishlist(item)}>
        <Ionicons name="trash-outline" size={18} color={AllColors.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={AllColors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wishlist</Text>
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
          <View style={styles.emptyContainer}>
            <LottieView
              source={require("../../Assets/Wishlist.json")}
              autoPlay
              loop
              style={styles.emptyAnimation}
            />

            <Text style={styles.emptyTitle}>
              Your Wishlist is Empty
            </Text>

            <Text style={styles.emptySubtitle}>
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
            <View style={styles.card}>
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
                  style={styles.image}
                  resizeMode="contain"
                />

                <View style={styles.details}>
                  <Text numberOfLines={2} style={styles.title}>
                    {item.name}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.price}>
                      ₹{item.discount_price}
                    </Text>

                    <Text style={styles.oldPrice}>
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

                    <Text>
                      {item.reviews || 0} Ratings
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.bottomRow}>
                <View style={styles.leftActions}>
                  {/* <TouchableOpacity>
            <Ionicons
              name="heart"
              size={22}
              color={AllColors.primary}
            /> */}
                  {/* </TouchableOpacity> */}

                  <TouchableOpacity onPress={() => onShare(item)}>
                    <Ionicons
                      name="share-social-outline"
                      size={22}
                      color={AllColors.black}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.rightActions}>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeWishlistItem(item.id)}
                  >
                    <Text style={styles.removeText}>Remove</Text>
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
              <Text style={styles.emptyListText}>
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