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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL, getToken, getuserId } from '../Api/Api';
import AllColors from '../Constants/Color';
import Ionicons from 'react-native-vector-icons/Ionicons';
// import Icon from 'react-native-vector-icons/Icon';
export default function Wishlist() {
  const navigation = useNavigation();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

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
         ToastAndroid.show(
           '✅ Product added to cart successfully',
           ToastAndroid.SHORT
         );
       } else {
         Alert.alert('Success', 'Product added to cart successfully');
       }
     }
   } catch (error) {
     console.log('Error:', error);
 
     if (Platform.OS === 'android') {
       ToastAndroid.show(
         'Something went wrong',
         ToastAndroid.SHORT
       );
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
      // সঙ্গে সঙ্গে UI থেকে remove
      setWishlistItems((prev) =>
        prev.filter((item) => item.id !== product_id)
      );

      ToastAndroid.show(
        "Product removed from wishlist",
        ToastAndroid.SHORT
      );
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
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Your wishlist is empty.</Text>
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
          <TouchableOpacity>
            <Ionicons
              name="heart"
              size={22}
              color={AllColors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity>
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
            <Text style={{ color: AllColors.primary }}>
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
  card: {
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 10,
    margin:10
  },

  productRow: {
    flexDirection: "row",
  },

  image: {
    width: 90,
    height: 110,
    resizeMode: "contain",
  },

  details: {
    flex: 1,
    marginLeft: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: "500",
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  price: {
    fontSize: 20,
    fontWeight: "700",
  },

  oldPrice: {
    marginLeft: 8,
    textDecorationLine: "line-through",
    color: "#888",
  },

  discount: {
    marginLeft: 8,
    color: "green",
    fontWeight: "600",
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  rating: {
    backgroundColor: "green",
    color: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#eee",
  },

  leftActions: {
    flexDirection: "row",
    gap: 20,
  },

  rightActions: {
    flexDirection: "row",
    gap: 10,
  },

  removeBtn: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },

  cartBtn: {
    borderWidth: 1,
    borderColor: AllColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
});