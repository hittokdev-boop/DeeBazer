import react, { useEffect, useId, useState } from 'react'
import { Button, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View , ToastAndroid, Platform, Alert,Share } from 'react-native'
  // import {} from 'react-native';
import { BASE_URL, getToken, getuserId } from '../Api/Api';
import { useNavigation } from '@react-navigation/native';
import AllColors from '../Constants/Color';
import Ionicons from 'react-native-vector-icons/Ionicons';
// import {  } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
export default function ProductDetails({route}){
    const [product,setProduct]=useState({})
    const [productImage,setProductImage]=useState( null)
    const [isAddedToCart, setIsAddedToCart] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);
     const { id } = route.params;
    
const navigation=useNavigation()
    // setProductId(id)
    useEffect(()=>{
            getPrductDetails()
            getWishlistStatus()
    },[])
    const shareProduct = async () => {
  try {
    await Share.share({
      title: product?.name,
      message: `${product?.name}

Price: ₹${product?.discount_price}

${product?.short_desc}

${product?.image?.[0]}`,
    });
  } catch (error) {
    console.log(error);
  }
};
    const getPrductDetails =async  ()=>{
      const formData = new FormData(); 
       formData.append('product_id',id );
         
              try {
        const response = await fetch(`${BASE_URL}product-details`, {
          method: 'POST',
          body: formData,
        });
    
        const data = await response.json();
        console.log('data',data.data)
       if(data.data){ 
          setProduct(data.data)
          setProductImage(data.data.image[0])
      };
      } catch (error) {
        console.log('Error:', error);
      }   
    }


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
    const hasProduct = items.some((entry) => String(entry?.product_id ?? entry?.id ?? entry?.product?.id) === String(id));
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
          isWishlisted ? 'Removed from wishlist' : 'Added to wishlist',
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

    if (Platform.OS === 'android') {
      ToastAndroid.show('Something went wrong', ToastAndroid.SHORT);
    } else {
      Alert.alert('Error', 'Something went wrong');
    }
  }
};

const requestToCart = async () => {
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
    console.log('data', data);

    if (data.status == 200) {
      setIsAddedToCart(true);

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
};
   const IsUser=async ()=>{
    const userId=await getToken()
    // console.log(userId)
    if(userId){
      requestToCart()
    }else{
      navigation.navigate('Login')
    }
   }
            return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
 <View style={styles.imageContainer}>

  {/* Back Button */}
  <TouchableOpacity
    style={styles.backButton}
    onPress={() => navigation.goBack()}>
    <Ionicons
      name="arrow-back"
      size={22}
      color="#222"
    />
  </TouchableOpacity>

  {/* Right Side Buttons */}
  <View style={styles.rightButtons}>

    {/* Wishlist */}
    <TouchableOpacity
      style={styles.iconButton}
      onPress={toggleWishlist}>
      <AntDesign
        name={isWishlisted ? 'heart' : 'hearto'}
        size={20}
        color={AllColors.primary}
      />
    </TouchableOpacity>

    {/* Share */}
    <TouchableOpacity
      style={styles.iconButton}
      onPress={shareProduct}>
      <Ionicons
        name="share-social-outline"
        size={21}
        color={AllColors.primary}
      />
    </TouchableOpacity>

  </View>

  {/* Product Image */}
  <Image
    source={{ uri: product?.image?.[0] }}
    style={styles.image}
    resizeMode="contain"
  />

</View>

  <View style={styles.detailsContainer}>
    <Text style={styles.category}>Premium Product</Text>

    <Text style={styles.title}>
      {product?.name} 
    </Text>
      <Text style={styles.description}>
      {product?.short_desc}
    </Text>
    <View style={styles.priceRow}>
      <Text style={styles.price}>
        ₹ {product?.discount_price}
      </Text>

      <Text style={styles.oldPrice}>
        ₹ {product?.actual_price }
      </Text>
    </View>

    <View style={styles.offerBadge}>
      <Text style={styles.offerText}>20% OFF</Text>
    </View>

    <Text style={styles.sectionTitle}>
      Description
    </Text>

    <Text style={styles.description}>
      {product?.desc}
    </Text>
  </View>

  <View style={styles.bottomButtons}>
    <TouchableOpacity style={styles.cartBtn} onPress={IsUser}>
      <Text style={styles.cartText}>
        {isAddedToCart ? <Text>goto cart</Text> :<Text>Add To Cart </Text> }
      </Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.buyBtn}>
      <Text style={styles.buyText}>
        Buy Now
      </Text>
    </TouchableOpacity>
  </View>
</ScrollView>
  );
}
 const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fd',
  },

 imageContainer: {
  height: 360,
  backgroundColor: "#fff",
  justifyContent: "center",
  alignItems: "center",
  borderBottomLeftRadius: 30,
  borderBottomRightRadius: 30,
  elevation: 6,
  position: "relative",
},

image: {
  width: "82%",
  height: 280,
  resizeMode: "contain",
},

/* Back Button */
backButton: {
  position: "absolute",
  top: 18,
  left: 18,
  width: 45,
  height: 45,
  borderRadius: 22.5,
  backgroundColor: "#fff",
  justifyContent: "center",
  alignItems: "center",
  elevation: 8,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.15,
  shadowRadius: 5,
  zIndex: 100,
},

/* Right Side Buttons */
rightButtons: {
  position: "absolute",
  top: 18,
  right: 18,
  zIndex: 100,
},

/* Wishlist & Share Button */
iconButton: {
  width: 45,
  height: 45,
  borderRadius: 22.5,
  backgroundColor: "#fff",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: 12,
  elevation: 8,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.15,
  shadowRadius: 5,
},
  detailsContainer: {
    padding: 20,
  },

  category: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    // lineHeight: 34,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginTop: 15,
  },

  price: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#16a34a',
  },

  oldPrice: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 12,
  },

  offerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },

  offerText: {
    color: '#16a34a',
    fontWeight: '700',
    fontSize: 13,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginTop: 25,
    marginBottom: 10,
  },

  description: {
    fontSize: 15,
    color: '#555',
    // lineHeight: 24,
  },

  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 30,
    marginTop: 20,
    gap: 12,
  },

  cartBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: AllColors.primary,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
  },

  buyBtn: {
    flex: 1,
    backgroundColor: AllColors.primary,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
  },

  cartText: {
    color:AllColors.primary,
    fontWeight: '700',
    fontSize: 16,
  },

  buyText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});