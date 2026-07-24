import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL, getToken, getuserId } from '../Api/Api';
import AllColors from '../Constants/Color';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LottieView from "lottie-react-native";

// import Icon from 'react-native-vector-icons/Icon';
export default function Wishlist() {
  const navigation = useNavigation();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
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
  const getWishlistItems = async () => {
    const token = await getToken();
    const userId = await getuserId();

    if (!token || !userId) {
      setWishlistItems([]);
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('user_id', userId);

      const response = await fetch(`${BASE_URL}wishlist-view`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('Wishlist screen fetch data:', data);
      const items = data?.data || data?.products || data?.wishlist || [];
      const normalizedItems = items.map((entry) => entry?.product || entry);
      setWishlistItems(normalizedItems);
    } catch (error) {
      console.log('Wishlist screen fetch error:', error);
    } finally {
      setLoading(false);
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
    console.log("Remove Response:", data);

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
  useEffect(() => {
    getWishlistItems();
  }, []);

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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={AllColors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wishlist</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={AllColors.primary} style={{ marginTop: 24 }} />
      ) : wishlistItems.length === 0 ? (
       <View style={styles.emptyContainer}>
    <LottieView
      source={require("../Assets/Wishlist.json")}
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
      onPress={() => navigation.goBack()}
    >
      <Text style={styles.shopBtnText}>
        Continue Shopping
      </Text>
    </TouchableOpacity>
  </View>
      ) : (
      <FlatList
  data={wishlistItems}
  keyExtractor={(item) => item.id.toString()}
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ paddingBottom: 100 }}
  renderItem={({ item }) => (
    <View style={styles.card}>
      <View style={styles.productRow}>
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
      </View>

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
  <Text>Remove</Text>
</TouchableOpacity>

          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => requestToCart(item.id)}
          >
            <Text style={{ color: AllColors.white, fontWeight: "600" }}>
              Add to cart
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )}
  ListEmptyComponent={
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 80,
      }}
    >
      <Text style={{ fontSize: 16, color: "#777" }}>
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
    backgroundColor: "#F6F7FB",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    elevation: 3,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginLeft: 15,
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    padding: 12,
    elevation: 4,
    shadowColor: "#000",
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
    backgroundColor: "#F5F5F5",
  },

  details: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "space-between",
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
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
    color: "#999",
    textDecorationLine: "line-through",
    fontSize: 14,
  },

  discount: {
    marginLeft: 10,
    color: "#2E7D32",
    fontWeight: "700",
    fontSize: 13,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  rating: {
    backgroundColor: "#0BA360",
    color: "#fff",
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
    borderColor: "#F0F0F0",
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
    backgroundColor: "#FDECEC",
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
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  removeText: {
    color: "#E53935",
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
    color: "#777",
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});