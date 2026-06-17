import React, { useEffect, useState } from 'react';
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
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AllColors from '../Constants/Color';

import CommonLoginModal from './../Common/Login';
import { useNavigation } from '@react-navigation/native';
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
 

const Navigation=useNavigation()
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


   if(data.data){ 

    setProduct(data.data)
  };
  } catch (error) {
    console.error('Error:', error);
  }   
}
const getSearchText=(value)=>{
  console.log(value)
}
const getpopularPoduct=async ()=>{
  const userid=await getuserId()
  
     try {
    const response = await fetch(`${BASE_URL}popular-products`, {
      method: 'GET',
      
    });

    const data = await response.json();

  //  console.log('data1',data)
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
const getDealOfTheDay=async ()=>{
     try {
    const response = await fetch(`${BASE_URL}deal-of-the-day?limit=4`, {
      method: 'GET',
      
    });

    const data = await response.json();

   if(data.data){
    console.log(data)
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

 <Image
    
      source={{uri: 'http://ordinaree.com/cdn/shop/files/SPW_3220_5d1d71ef-0699-4de2-84fc-195e1f064aef.jpg?v=1756703234'}}
      style={{
        width: '100%',
        height: 250,
        // borderRadius: 15,
      }}
      resizeMode="cover"
    />

<View style={{height:10}}/>
{/* product */}
        <FlatList
  data={product}
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
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={() => gotoProductDetails(item)}>
      
     

      {/* Product Image */}
      <View
        style={[
          styles.imageBox,
          { backgroundColor: item.bg },
        ]}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.productImage}
        />

        {/* Discount */}
        <View style={styles.discountBox}>
          <Text style={styles.discountText}>
            {item.discount}
          </Text>
        </View>
      </View>

      {/* Product Details */}
      <View style={{ marginTop: 10 }}>
        
        <Text style={styles.productTitle}>
          {item.name}
        </Text>

        <Text style={styles.subTitle}>
          {item.subtitle}
        </Text>

     

        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {item.actual_price}
          </Text>

          <Text style={styles.oldPrice}>
            {item.discount_price}
          </Text>
        </View>

      </View>

      
    </TouchableOpacity>
  )}
/>
{/* DEAL OF THE DAY */}
 <>

 <Text style={styles.productHeader}>
  Deal of The Day
 </Text>
  <TouchableOpacity>
    <Text style={styles.ViewAll}>View all</Text>
  </TouchableOpacity>

<FlatList
  horizontal
  showsHorizontalScrollIndicator={false}
  data={dealOfTheDay}
  keyExtractor={(item) => item.id.toString()}
  contentContainerStyle={{ paddingHorizontal: 10 }}
  renderItem={({ item }) => (
    <TouchableOpacity style={styles.dealCard}>
      <Image
        source={{ uri: item.image }}
        style={styles.dealImage}
      />

      <Text numberOfLines={2} style={styles.productName}>
        {item.product_name}
      </Text>

      <Text style={styles.price}>₹{item.originalPrice}</Text>

      <View style={styles.priceRow}>
        <Text style={styles.oldPrice}>₹{item.price}</Text>
        <Text style={styles.offer}>
          {item.discount}% OFF
        </Text>
      </View>
    </TouchableOpacity>
  )}
/>
 </>

 {/* popular product*/}
 <>

 <Text style={styles.productHeader}>Popular product for you</Text>
  <TouchableOpacity>
    <Text style={styles.ViewAll}>View all</Text>
  </TouchableOpacity>

<FlatList
  horizontal
  showsHorizontalScrollIndicator={false}
  data={popularProduct}
  keyExtractor={(item) => item.id.toString()}
  contentContainerStyle={{ paddingHorizontal: 10 }}
  renderItem={({ item }) => (
    <TouchableOpacity style={styles.dealCard}>
      <Image
        source={{ uri: item.image }}
        style={styles.dealImage}
      />

      <Text numberOfLines={2} style={styles.productName}>
        {item.product_name}
      </Text>

      <Text style={styles.price}>₹{item.originalPrice}</Text>

      <View style={styles.priceRow}>
        <Text style={styles.oldPrice}>₹{item.price}</Text>
        <Text style={styles.offer}>
          {item.discount}% OFF
        </Text>
      </View>
    </TouchableOpacity>
  )}
/>
 </>
 {/* best Selling product */}
   <>

 <Text style={styles.productHeader}>bests selling Product</Text>
  <TouchableOpacity>
    <Text style={styles.ViewAll}>View all</Text>
  </TouchableOpacity>

<FlatList
  horizontal
  showsHorizontalScrollIndicator={false}
  data={bestsellingProduct}
  keyExtractor={(item) => item.id.toString()}
  contentContainerStyle={{ paddingHorizontal: 10 }}
  renderItem={({ item }) => (
    <TouchableOpacity style={styles.dealCard}>
      <Image
        source={{ uri: item.image }}
        style={styles.dealImage}
      />

      <Text numberOfLines={2} style={styles.productName}>
        {item.product_name}
      </Text>

      <Text style={styles.price}>₹{item.originalPrice}</Text>

      <View style={styles.priceRow}>
        <Text style={styles.oldPrice}>₹{item.price}</Text>
        <Text style={styles.offer}>
          {item.discount}% OFF
        </Text>
      </View>
    </TouchableOpacity>
  )}
/>
 </>
 {/* featured Product */}
       <>

 <Text style={styles.productHeader}>featured Product</Text>
  <TouchableOpacity>
    <Text style={styles.ViewAll}>View all</Text>
  </TouchableOpacity>

<FlatList
  horizontal
  showsHorizontalScrollIndicator={false}
  data={featuredproducts}
  keyExtractor={(item) => item.id.toString()}
  contentContainerStyle={{ paddingHorizontal: 10 }}
  renderItem={({ item }) => (
    <TouchableOpacity style={styles.dealCard}>
      <Image
        source={{ uri: item.image }}
        style={styles.dealImage}
      />

      <Text numberOfLines={2} style={styles.productName}>
        {item.product_name}
      </Text>

      <Text style={styles.price}>₹{item.originalPrice}</Text>

      <View style={styles.priceRow}>
        <Text style={styles.oldPrice}>₹{item.price}</Text>
        <Text style={styles.offer}>
          {item.discount}% OFF
        </Text>
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

  
  
  
  container: {
    flex: 1,
    backgroundColor:AllColors.lightPink
  },

  topHeader: {
    paddingTop: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    // backgroundColor: '#ffeaf2',
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
  padding: 0,
},

imageBox: {
  width: '100%',
  height: 150, // আগে 220 ছিল
  backgroundColor: '#F8F8F8',
  justifyContent: 'center',
  alignItems: 'center',
},

productTitle: {
  fontSize: 13,
  fontWeight: '700',
  color: '#111',
  paddingHorizontal: 6,
  marginTop: 6,
},
productImage: {
  width: '100%',
  height: '100%',
  resizeMode: 'cover',
},
subTitle: {
  fontSize: 11,
  color: '#777',
  paddingHorizontal: 6,
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
  height: 40,
},

price: {
  fontSize: 18,
  fontWeight: '700',
  color: '#e53935',
  marginTop: 5,
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
});