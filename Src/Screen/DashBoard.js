import React, { useCallback, useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  ToastAndroid,
  Platform,
  Alert,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AllColors from '../Constants/Color';

import CommonLoginModal from './../Common/Login';
import { useNavigation,useFocusEffect } from '@react-navigation/native';
import { BASE_URL, getToken, getuserId,  } from '../Api/Api';
import Toast from 'react-native-toast-message';
import Swiper from 'react-native-swiper';
// import Feather from 'react-native-vector-icons/Feather'
const { width } = Dimensions.get('window');
import Ionicons from 'react-native-vector-icons/Ionicons';
export default function DashBoard() {
  
  const [id,setId]=useState('')
  const [open,setOpen]=useState(false)
  const [catagories,setCategories]=useState([])
  const [slug,setSlug]=useState('')
  const [catagoriesId,setCategoriesId]=useState('all')
  const [product,setProduct]=useState([])
  const [dealOfTheDay,setDealOfTheDay]=useState([])
  const [latestproducts,setLatestproducts]=useState([])
  const [featuredproducts,setFeaturedproducts]=useState([])
  const [bestsellingProduct,setBestsellingProduct]=useState([])
  const [popularProduct,setPopularProduct]=useState([])
 const [searchText, setSearchText] = useState("");
const [searchProducts, setSearchProducts] = useState([]);
const [loading, setLoading] = useState(false);
const [wishlistIds, setWishlistIds] = useState([]);
useFocusEffect(
  useCallback(() => {
    getWishlistIds();
  }, [])
);
const getSearchText = async (value) => {
  setSearchText(value);

 
  if (value.trim() === "") {
    setSearchProducts([]);
    return;
  }

  try {
    setLoading(true);

    const response = await fetch(`${BASE_URL}search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        keyword: value,
      }),
    });

    const result = await response.json();

    console.log(result);

    // যদি API products array return করে
    setSearchProducts(result.data || result.products || []);
  } catch (error) {
    console.log("Search Error:", error);
  } finally {
    setLoading(false);
  }
};

const Navigation=useNavigation()

const isItemWishlisted = (item) => {
  return wishlistIds.includes(String(item.id));
};
const getWishlistItems = async () => {
  const token = await getToken();
  const userId = await getuserId();

  if (!token || !userId) {
    setWishlistIds([]);
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
    const ids = items
      .map((entry) => entry?.product_id ?? entry?.id ?? entry?.product?.id)
      .filter(Boolean);

    setWishlistIds(ids);
  } catch (error) {
    console.log('Wishlist fetch error:', error);
  }
};

const toggleWishlist = async (item) => {
  const token = await getToken();
  const userId = await getuserId();

  if (!token || !userId) {
    Navigation.navigate('Login');
    return;
  }

  const productId = item?.id ?? item?.product_id;
  const isWishlisted = isItemWishlisted(item);
  const endpoint = isWishlisted ? 'wishlist-remove' : 'wishlist-add';

  const formData = new FormData();
  formData.append('user_id', userId);
  formData.append('product_id', productId);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data?.status === 200 || data?.success) {
      setWishlistIds((prev) =>
        isWishlisted
          ? prev.filter((id) => String(id) !== String(productId))
          : [...prev, String(productId)]
      );

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
// const gotoCart = async () => {
//   const token = await getToken();

//   // console.log(token);

//   setId(token);

//   if (!token || token === '') {
//     Navigation.navigate('Login');
//   } else {
//     ToastAndroid.show(
//       'Added to cart',
//       ToastAndroid.SHORT,
//     );

//   }
// };
const getCatagory= async()=>{
try {
    const response = await fetch(`${BASE_URL}categories`, {
      method: 'GET',
      
    });

    const data = await response.json();

   
   if(data.data){ 
    setCategories(data.data)
  };
  } catch (error) {
    console.error('Error:', error);
  }
  }
useEffect(()=>{
  getCatagory()
  getAllPrduct()
  getpopularPoduct()
  getDealOfTheDay()
  getlatestProduct()
  getfeaturedProducts()
  getbestsellingProducts()
  getWishlistItems()
},[])
const gotoProductDetails = (item) => {
  
  Navigation.navigate('ProductDetails', {
    id: item.id,
  });
};
const getcategoriesProduct=(item)=>{
  // console.log(item.id)
  setCategoriesId(item.id)
   setSlug(item.slug)
  
   getAllPrduct()
  // getCategorybySlug()
}
// const getCategorybySlug= async ()=>{
//   // console.log(`${BASE_URL}categories/${slug}`)
// // try {
// //     const response = await fetch(`${BASE_URL}categories/${slug}`, {
// //       method: 'GET',
      
// //     });

// //     const data = await response.json();

// //    console.log(';hdkjhkfjh',data)
// //   //  if(data.data){ 

// //   //   // setCategories(data.data)
// //   // };
// //   } catch (error) {
// //     console.error('Error:', error);
// //   }
// }
const getAllPrduct =async  ()=>{
  const formData = new FormData(); 
//   "page": 1
    formData.append('category_id', catagoriesId);
     formData.append("per_page", 12); 
     formData.append( "page",1);
          try {
    const response = await fetch(`${BASE_URL}product`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
// console.log(data.data[2],'anu')

   if(data.data){ 

    setProduct(data.data)
  };
  } catch (error) {
    console.error('Error:', error);
  }   
}

const getpopularPoduct=async ()=>{
  const userid=await getuserId()
  
     try {
    const response = await fetch(`${BASE_URL}popular-products`, {
      method: 'GET',
      
    });

    const data = await response.json();

   console.log('data1',data.data[0])
   if(data.data){ 

    setPopularProduct(data.data)
  };
  } catch (error) {
    console.log('Error:', error);
  }
}
const getlatestProduct=async ()=>{

  //    try {
  //   const response = await fetch(`${BASE_URL}latest-products`, {
  //     method: 'GET',
      
  //   });

  //   const data = await response.json();

  //  console.log('data1',data)
  //  if(data.data){ 

  //   setLatestproducts(data.data)
  // };
  // } catch (error) {
  //   console.log('Error:', error);
  // }
}
const getWishlistIds = async () => {
  const userId = await getuserId();

  if (!userId) return;

  const formData = new FormData();
  formData.append("user_id", userId);

  try {
    const response = await fetch(`${BASE_URL}wishlist-view`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    const ids = (data.data || []).map((item) =>
      String(item.id)
    );

    setWishlistIds(ids);
  } catch (e) {
    console.log(e);
  }
};
const getDealOfTheDay=async ()=>{
     try {
    const response = await fetch(`${BASE_URL}deal-of-the-day?limit=4`, {
      method: 'GET',
      
    });

    const data = await response.json();

   if(data.data){
    // console.log(data.data[0],'jljf')
    setDealOfTheDay(data.data)
   }
    } catch (error) {
    console.log('Error1:', error);
  }
}
const getfeaturedProducts= async ()=>{
     try {
    const response = await fetch(`${BASE_URL}featured-products`, {
      method: 'GET',
      
    });
  const datta= await getToken()
  const id= await getuserId()
  // console.log(datta)
  // console.log(id)
    const data = await response.json();

   if(data.data){
    setFeaturedproducts(data.data)
   }
    } catch (error) {
    console.log('Error1:', error);
  }
}
const getbestsellingProducts=  async ()=>{
     try {
    const response = await fetch(`${BASE_URL}featured-products`, {
      method: 'GET',
      
    });

    const data = await response.json();
 

   if(data.data){
   
    setBestsellingProduct(data.data)
   }
    } catch (error) {
    console.log('Error1:', error);
  }
}

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
 };
    const IsUser=async (item)=>{
     const userId=await getToken()
    //  console.log(userId)
    // console.log(ID.id,'kljlkjkjklhj')
     if(userId){
       requestToCart(item.id)
     }else{
       Navigation.navigate('Login')
     }
    }
    const gotoViewAll = (title, products) => {
  Navigation.navigate("ViewAllProducts", {
    title,
    products,
     totalProducts: products.length,
  });
};
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}

        < View
         
          style={styles.topHeader}
        >
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={{
                  uri: 'https://www.vhv.rs/dpng/d/409-4090121_transparent-background-user-icon-hd-png-download.png',
                }}
                style={styles.logo}
              />
             
            <View>
            <Text style={styles.logoText}>Hello Hittok</Text>
            <Text style={{color:AllColors.black}}>Find your favorite products at the best prices.</Text>
            </View>
             
            </View>

            <TouchableOpacity style={styles.bellBtn}>
              <FontAwesome
                name="bell"
                color={AllColors.drakGray}
                size={20}
              />
            </TouchableOpacity>
          </View>

          {/* SEARCH */}

          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <FontAwesome
                name="search"
                color={AllColors.primary}
                size={20}
              />

              <TextInput
                placeholder="Search your need"
                placeholderTextColor="#777"
                style={styles.input}
                onChangeText={(value)=>{getSearchText(value)}}
              />
            </View>

            <TouchableOpacity style={styles.filterBtn}>
              <Feather
                name="sliders"
                color="#fff"
                size={22}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* CATEGORY */}

      <FlatList
  data={catagories}
  horizontal
  showsHorizontalScrollIndicator={false}
  keyExtractor={(item) => item.id.toString()}
  contentContainerStyle={{
    paddingHorizontal: 10,
    paddingVertical: 5,
  }}
  nestedScrollEnabled={true}
  directionalLockEnabled={true}
  bounces={false}
  scrollEventThrottle={16}
  renderItem={({ item }) => (
    <TouchableOpacity
      onPress={() => getcategoriesProduct(item)}
      style={[
        styles.categoryBtn,
        catagoriesId === item.id && styles.activeCategory,
      ]}
    >
      <Image
        source={{ uri: item.image }}
        style={{
          width: 24,
          height: 24,
          marginRight: 8,
        }}
        resizeMode="contain"
      />

      <Text
        style={{
          color: '#000',
          fontWeight: '600',
        }}
      >
        {item.name} 
      </Text>
    </TouchableOpacity>
  )}
/>
        <View style={{height:10}}/>
{/* carousel */}

 {/* <Image
    
      source={{uri: 'http://ordinaree.com/cdn/shop/files/SPW_3220_5d1d71ef-0699-4de2-84fc-195e1f064aef.jpg?v=1756703234'}}
      style={{
        width: '100%',
        height: 250,
        // borderRadius: 15,
      }}
      resizeMode="cover"
    /> */}

<View style={{height:10}}/>
{/* product */}
        <FlatList
   data={searchText.trim() ? searchProducts : product}
  numColumns={2}
  scrollEnabled={false}
  keyExtractor={(item) => item.id}
  contentContainerStyle={{
    paddingHorizontal: 10,
    // paddingBottom: 100,
  }}
  columnWrapperStyle={{
  justifyContent: 'space-between',
}}
  renderItem={({ item }) => (
    <TouchableOpacity
  activeOpacity={0.9}
  style={styles.card}
  onPress={() => gotoProductDetails(item)}
>
  {/* Wishlist */}
  {/* <TouchableOpacity style={styles.wishlistBtn}>
    <AntDesign
      name="hearto"
      size={18}
      color={AllColors.primary}
    />
  </TouchableOpacity> */}

  {/* Product Image */}
  <View style={styles.imageBox}>
    <Image
      source={{uri: item.image}}
      style={styles.productImage}
    />

    <View style={styles.discountBox}>
      <Text style={styles.discountText}>
        {item.discount}
      </Text>
    </View>
  </View>

  <View style={{marginTop: 10}}>
    <Text numberOfLines={1} style={styles.productTitle}>
      {item.name}
    </Text>

    <Text numberOfLines={2} style={styles.subTitle}>
      {item.short_desc}
    </Text>

    <View style={styles.priceRow}>
      <Text style={styles.price}>
         ₹{item.discount_price} </Text>

      <Text style={styles.oldPrice}>
       ₹{item.actual_price}
      </Text>
    </View>

    {/* Add To Cart */}
    <TouchableOpacity style={styles.addCartBtn} onPress={()=>{IsUser(item)}}>
      <Ionicons
        name="cart-outline"
        size={18}
        color="#fff"
      />
      <Text style={styles.addCartText}>
        Add To Cart
      </Text>
    </TouchableOpacity>
    <View style={{height:10}}/>
  </View>
</TouchableOpacity>
  )}
/>
{/* DEAL OF THE DAY */}
 <>

 <Text style={styles.productHeader}>
  Deal of The Day
 </Text>
  <TouchableOpacity onPress={() =>
gotoViewAll(
'Deal Of The Day',
dealOfTheDay
)
}>
    <Text style={styles.ViewAll}>View all</Text>
  </TouchableOpacity>

<FlatList
  horizontal
  showsHorizontalScrollIndicator={false}
  data={dealOfTheDay.slice(0,5)}
  keyExtractor={(item) => item.id.toString()}
  contentContainerStyle={{ paddingHorizontal: 5 }}
  renderItem={({ item }) => (
    <TouchableOpacity style={styles.dealCard}  onPress={() => gotoProductDetails(item)}>
      <Image
        source={{ uri: item.image }}
        style={styles.dealImage}
      />
<TouchableOpacity
      style={[
        styles.wishlistButton,
        isItemWishlisted(item) && styles.wishlistButtonActive,
      ]}
      onPress={() => toggleWishlist(item)}
    >
      <Ionicons
        name={isItemWishlisted(item) ? "heart" : "heart-outline"}
        size={18}
        color={isItemWishlisted(item) ? "#fff" : AllColors.primary}
      />
    </TouchableOpacity>
      <Text numberOfLines={2} style={styles.productName}>
        {item.name}
      </Text>

   
      <View style={styles.priceRow}>
          <Text style={styles.price}>₹{item.originalPrice}</Text>

        <Text style={styles.oldPrice}>₹{item.price}</Text>
       
      </View>


<View style={{flexDirection:'row',justifyContent:'space-between'}}>
  <Text style={styles.offer}> 
          {item.discount}% OFF
        </Text>
      <View style={styles.actionContainer}>
    <TouchableOpacity style={styles.iconButton} onPress={()=>{IsUser(item)}}>
      <Ionicons
        name="cart-outline"
        size={18}
        color="#fff"
      />
    </TouchableOpacity>
  </View>
</View>
    </TouchableOpacity>
  )}
/>
 </>

 {/* popular product*/}
 <>

 <Text style={styles.productHeader}>Popular product for you</Text>
  <TouchableOpacity onPress={() =>
gotoViewAll(
'Popular Products',
popularProduct
)
}>
    <Text style={styles.ViewAll}>View all</Text>
  </TouchableOpacity>

<FlatList
  horizontal
  showsHorizontalScrollIndicator={false}
  data={popularProduct.slice(0,5)}
  keyExtractor={(item) => item.id.toString()}
  contentContainerStyle={{ paddingHorizontal: 10 }}
  renderItem={({ item }) => (
    <TouchableOpacity style={styles.dealCard}  onPress={() => gotoProductDetails(item)}>
      <Image
        source={{ uri: item.image }}
        style={styles.dealImage}
      />
<TouchableOpacity
      style={[
        styles.wishlistButton,
        isItemWishlisted(item) && styles.wishlistButtonActive,
      ]}
      onPress={() => toggleWishlist(item)}
    >
      <Ionicons
        name={isItemWishlisted(item) ? "heart" : "heart-outline"}
        size={18}
        color={isItemWishlisted(item) ? "#fff" : AllColors.primary}
      />
    </TouchableOpacity>
      <Text numberOfLines={2} style={styles.productName}>
        {item.name}
      </Text>


      <View style={styles.priceRow}>
          <Text style={styles.price}>₹{item.originalPrice}</Text>

        <Text style={styles.oldPrice}>₹{item.price}</Text>
       
      </View>


<View style={{flexDirection:'row',justifyContent:'space-between'}}>
  <Text style={styles.offer}> 
          {item.discount}% OFF
        </Text>
      <View style={styles.actionContainer}>
    <TouchableOpacity style={styles.iconButton} onPress={()=>{IsUser(item)}}>
      <Ionicons
        name="cart-outline"
        size={18}
        color="#fff"
      />
    </TouchableOpacity>
  </View>
</View>
    </TouchableOpacity>
  )}
/>
 </>
 {/* best Selling product */}
   <>

 <Text style={styles.productHeader}>bests selling Product</Text>
  <TouchableOpacity onPress={() =>
gotoViewAll(
'Best Selling Products',
bestsellingProduct
)
}>
    <Text style={styles.ViewAll}>View all</Text>
  </TouchableOpacity>

<FlatList
  horizontal
  showsHorizontalScrollIndicator={false}
  data={bestsellingProduct.slice(0,5)}
  keyExtractor={(item) => item.id.toString()}
  contentContainerStyle={{ paddingHorizontal: 10 }}
  renderItem={({ item }) => (
    <TouchableOpacity style={styles.dealCard}   onPress={() => gotoProductDetails(item)}>
      <Image
        source={{ uri: item.image }}
        style={styles.dealImage}
      />
<TouchableOpacity
      style={[
        styles.wishlistButton,
        isItemWishlisted(item) && styles.wishlistButtonActive,
      ]}
      onPress={() => toggleWishlist(item)}
    >
      <Ionicons
        name={isItemWishlisted(item) ? "heart" : "heart-outline"}
        size={18}
        color={isItemWishlisted(item) ? "#fff" : AllColors.primary}
      />
    </TouchableOpacity>

      <Text numberOfLines={2} style={styles.productName}>
        {item.name}
      </Text>

    
      <View style={styles.priceRow}>
          <Text style={styles.price}>₹{item.originalPrice}</Text>

        <Text style={styles.oldPrice}>₹{item.price}</Text>
       
      </View>


<View style={{flexDirection:'row',justifyContent:'space-between'}}>
  <Text style={styles.offer}> 
          {item.discount}% OFF
        </Text>
      <View style={styles.actionContainer}>
    <TouchableOpacity style={styles.iconButton} onPress={()=>{IsUser(item)}}>
      <Ionicons
        name="cart-outline"
        size={18}
        color="#fff"
      />
    </TouchableOpacity>
  </View>
</View>

     
    </TouchableOpacity>
  )}
/>
 </>
 {/* featured Product */}
       <>

 <Text style={styles.productHeader}>featured Product</Text>
  <TouchableOpacity onPress={() =>
gotoViewAll(
'Featured Products',
featuredproducts
)
}>
    <Text style={styles.ViewAll}>View all</Text>
  </TouchableOpacity>

<FlatList
  horizontal
  showsHorizontalScrollIndicator={false}
  data={featuredproducts.slice(0,5)}
  keyExtractor={(item) => item.id.toString()}
  contentContainerStyle={{ paddingHorizontal: 10 }}
  renderItem={({ item }) => (
 <TouchableOpacity
  style={styles.dealCard}
  onPress={() => gotoProductDetails(item)}
>
  <View style={styles.imageContainer}>
    <Image
      source={{ uri: item.image }}
      style={styles.dealImage}
    />

    <TouchableOpacity
      style={[
        styles.wishlistButton,
        isItemWishlisted(item) && styles.wishlistButtonActive,
      ]}
      onPress={() => toggleWishlist(item)}
    >
      <Ionicons
        name={isItemWishlisted(item) ? "heart" : "heart-outline"}
        size={18}
        color={isItemWishlisted(item) ? "#fff" : AllColors.primary}
      />
    </TouchableOpacity>
  </View>

  <Text numberOfLines={2} style={styles.productName}>
    {item.name}
  </Text>

 
      <View style={styles.priceRow}>
          <Text style={styles.price}>₹{item.originalPrice}</Text>

        <Text style={styles.oldPrice}>₹{item.price}</Text>
       
      </View>


<View style={{flexDirection:'row',justifyContent:'space-between'}}>
  <Text style={styles.offer}> 
          {item.discount}% OFF
        </Text>
      <View style={styles.actionContainer}>
    <TouchableOpacity style={styles.iconButton} onPress={()=>{IsUser(item)}}>
      <Ionicons
        name="cart-outline"
        size={18}
        color="#fff"
      />
    </TouchableOpacity>
  </View>
</View>
</TouchableOpacity>
  )}
/>

 </>
 
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({

imageContainer: {
  width: '100%',
  height: 120,
  position: 'relative',
},

dealImage: {
  width: '100%',
  height: '100%',
  resizeMode: 'contain',
},

wishlistButton: {
  position: 'absolute',
  top: 8,
  right: 8,
  width: 34,
  height: 34,
  borderRadius: 17,
  backgroundColor: '#fff',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 999,
  elevation: 10,
},

wishlistButtonActive: {
  backgroundColor: AllColors.primary,
},
  
  
  container: {
    flex: 1,
    backgroundColor:AllColors.lightPink,
    padding:10
  },

  topHeader: {
    paddingTop: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    // backgroundColor: '#ffeaf2',
  },
actionContainer: {
  flexDirection: 'row',
  
  alignSelf:"flex-end"
  // width:90, 
},

iconButton: {
  width: 38,
  height: 38,
  borderRadius: 19,
  backgroundColor: AllColors.primary, 
  justifyContent: 'center',
  alignItems: 'center',

  // Android
  elevation: 8,

  // iOS
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 3,
  },
  shadowOpacity: 0.25,
  shadowRadius: 5,
},
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal:10,
  },
 productHeader:{
      fontSize:20,
      color:AllColors.black,
      textAlign:"center",
      marginTop:10,
      fontWeight:'bold'

 },
 ViewAll:{
   color:AllColors.primary,
   fontSize:16,
   marginBottom:10,
   textAlign:"center"
 },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    borderRadius:10
  },

  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AllColors.primary,
    // marginLeft: 5,
  },

  bellBtn: {
    width: 45,
    height: 45,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth:2,
    borderColor:AllColors.lightPink,
    elevation: 3,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 18,
  },

  searchBox: {
    flex: 1,
    backgroundColor: '#fff',
    height: 55,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    elevation: 2,
  },

  input: {
    marginLeft: 10,
    fontSize: 16,
    width: '90%',
    color: '#000',
  },

  filterBtn: {
    width: 60,
    height: 55,
    backgroundColor: AllColors.primary,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    elevation: 3,
  },

  categoryBtn: {
    paddingHorizontal: 22,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },

  activeCategory: {
    backgroundColor: '#fd83b050',
    borderColor: AllColors.primary,
  },

  /* ========================= */
  /* CAROUSEL */
  /* ========================= */

  bannerCard: {
    width: 340,
    height: 190,
    borderRadius: 28,
    padding: 20,
    marginRight: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  smallText: {
    color: AllColors.primary,
    fontWeight: '600',
    fontSize: 15,
  },

  bigText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    marginTop: 5,
  },

  bigPink: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AllColors.primary,
  },

  desc: {
    marginTop: 8,
    color: '#555',
    width: 160,
    lineHeight: 20,
  },

  shopBtn: {
    marginTop: 15,
    backgroundColor: AllColors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },

  shopText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  bannerImage: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },

  /* ========================= */
  /* PRODUCT CARD */
  /* ========================= */

card: {
  flex: 1,
  backgroundColor: '#fff',
  margin: 4,
  borderRadius: 10,
  overflow: 'hidden',
  borderWidth: 0.5,
  borderColor: '#EAEAEA',
  elevation: 1,
  paddingHorizontal:10,
  
},

imageBox: {
  width: '100%',
  height: 150, 
  backgroundColor: '#F8F8F8',
  justifyContent: 'center',
  alignItems: 'center',
},

productTitle: {
  fontSize: 13,
  fontWeight: '700',
  color: '#111',
  // paddingHorizontal: 6,
  // marginTop: 6,
},
productImage: {
  width: '100%',
  height: '100%',
  resizeMode: 'cover',
},
subTitle: {
  fontSize: 11,
  color: '#777',
  // backgroundColor:"red "
  // paddingHorizontal: 6,
},

price: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#111',
},

oldPrice: {
  fontSize: 11,
  color: '#999',
  textDecorationLine: 'line-through',
  marginLeft: 5,
},

bottomRow: {
  paddingHorizontal: 6,
  paddingBottom: 6,
},

cartBtn: {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: '#F5F5F5',
  justifyContent: 'center',
  alignItems: 'center',
},
dealCard: {
  width: 170,
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 10,
  marginRight: 12,
  elevation: 3,
},

dealImage: {
  width: '100%',
  height: 120,
  resizeMode: 'contain',
  marginBottom: 8,
},

productName: {
  fontSize: 14,
  fontWeight: '600',
  color: '#333',
  // height: 40,
},

price: {
  fontSize: 18,
  fontWeight: '700',
  color: '#e53935',
  // marginTop: 5,
},

priceRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 4,
},

oldPrice: {
  textDecorationLine: 'line-through',
  color: '#999',
  marginRight: 8,
  fontSize: 12,
},

offer: {
  color: 'green',
  fontWeight: '700',
  fontSize: 12,
},
contentContainer: {
  padding: 10,
},

titleRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
},

wishlistBtn: {
  marginLeft: 5,
},

addCartBtn: {
  marginTop: 10,
  height: 40,
  borderRadius: 8,
  backgroundColor: AllColors.primary,
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
},

addCartText: {
  color: '#fff',
  fontWeight: '700',
  marginLeft: 5,
},

productTitle: {
  flex: 1,
  fontSize: 13,
  fontWeight: '700',
  color: '#111',
},

subTitle: {
  fontSize: 11,
  color: '#777',
  marginTop: 4,
  minHeight: 32,
},
});