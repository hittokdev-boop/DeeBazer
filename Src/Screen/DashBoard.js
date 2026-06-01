import React, { useState } from 'react';
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
import { getuserId } from '../Api/Api';
import Toast from 'react-native-toast-message';
import Swiper from 'react-native-swiper';
// import Feather from 'react-native-vector-icons/Feather'
const { width } = Dimensions.get('window');
import Ionicons from 'react-native-vector-icons/Ionicons';
export default function DashBoard() {
  const [selected, setSelected] = useState('1');
  const [id,setId]=useState('')
  const [open,setOpen]=useState(false)
  const images = [
  {
    id: 1,
    image: 'http://ordinaree.com/cdn/shop/files/SPW_3220_5d1d71ef-0699-4de2-84fc-195e1f064aef.jpg?v=1756703234',
  },
  {
    id: 2,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxqp0vUxznXRs0QZSC2bQD1fwgPkKuRhOnDg&s',
  },
  {
    id: 3,
    image: 'https://img.drz.lazcdn.com/static/bd/p/97fc6d72eb86bddb1f11dc9d72efbc8f.jpg_720x720q80.jpg_.webp',
  },
];

  const categories = [
    { id: '1', title: 'Trending',icon:'trending-up'},
    { id: '2', title: 'Seasonal' ,icon:'sun'},
    { id: '3', title: 'New Arrivals',icon:"headphones" },
    { id: '4', title: 'Popular', icon:'zap'},
    { id: '5', title: 'Best Seller',icon:'eye' },
  ];

const products = [
  {
    id: '1',
    title: 'Running Shoes',
    subtitle: 'Nike Air Max',
    price: '₹1499',
    oldPrice: '₹1999',
    discount: '25% OFF',
    rating: 4.8,
    reviews: 245,
    stock: 'In Stock',
    delivery: 'Free Delivery',
    category: 'Trending',
    icon: 'flame',
    favorite: true,
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
    bg: '#FDEFF1',
  },

  {
    id: '2',
    title: 'Smart Watch',
    subtitle: 'Apple Series 8',
    price: '₹2999',
    oldPrice: '₹3999',
    discount: '40% OFF',
    rating: 4.9,
    reviews: 540,
    stock: 'Only 3 Left',
    delivery: 'Fast Delivery',
    category: 'Best Seller',
    icon: 'trophy',
    favorite: false,
    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
    bg: '#FFF6E9',
  },

  {
    id: '3',
    title: 'Oversized T-Shirt',
    subtitle: 'Summer Collection',
    price: '₹499',
    oldPrice: '₹799',
    discount: '35% OFF',
    rating: 4.5,
    reviews: 120,
    stock: 'In Stock',
    delivery: 'Free Delivery',
    category: 'New Arrival',
    icon: 'sparkles',
    favorite: true,
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
    bg: '#EEF9FB',
  },

  {
    id: '4',
    title: 'Leather Backpack',
    subtitle: 'Travel Edition',
    price: '₹1299',
    oldPrice: '₹1899',
    discount: '20% OFF',
    rating: 4.7,
    reviews: 310,
    stock: 'Limited Stock',
    delivery: 'Express Delivery',
    category: 'Popular',
    icon: 'heart',
    favorite: false,
    image:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62',
    bg: '#F7EEFF',
  },
];
const banners = [
  {
    id: '1',
    title: 'Top Products',
    subtitle: 'Great Prices!',
    desc: 'Shop latest trends now',
    image:
      'https://cdn-icons-png.flaticon.com/512/3514/3514491.png',
  },
  {
    id: '2',
    title: 'Mega Sale',
    subtitle: 'Up To 70% OFF',
    desc: 'Best collection for you',
    image:
      'https://cdn-icons-png.flaticon.com/512/3081/3081985.png',
  },
  {
    id: '3',
    title: 'Fashion Week',
    subtitle: 'New Arrivals',
    desc: 'Trending styles available',
    image:
      'https://cdn-icons-png.flaticon.com/512/892/892458.png',
  },
];
const Navigation=useNavigation()
const gotoCart = async () => {
  const userid = await getuserId();

  // console.log(userid);

  setId(userid);

  if (!userid || userid === '') {
    Navigation.navigate('Login');
  } else {
    ToastAndroid.show(
      'Added to cart',
      ToastAndroid.SHORT,
    );

  }
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
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 10,
            // marginTop: 15,
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelected(item.id)}
              style={[
                styles.categoryBtn,
                selected === item.id &&
                  styles.activeCategory,
              ]}
            >
              <Feather name={item.icon} size={20} color={AllColors.black}/>
              <Text
                style={{
                  color:AllColors.black,
                    
                  fontWeight: '600',
                }}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
        />
        <View style={{height:10}}/>
{/* carousel */}

      

<View style={{height:10}}/>
        <FlatList
  data={products}
  numColumns={2}
  scrollEnabled={false}
  keyExtractor={(item) => item.id}
  contentContainerStyle={{
    paddingHorizontal: 10,
    paddingBottom: 100,
  }}
  renderItem={({ item }) => (
    <TouchableOpacity activeOpacity={0.9} style={styles.card}>
      
      {/* Top Row */}
      <View style={styles.topRow}>
        
        {/* Category */}
        

        {/* Heart */}
        <TouchableOpacity style={styles.heart}>
          <AntDesign
            name={ 'hearto'}
            size={18}
            color={AllColors.black}
          />
        </TouchableOpacity>
      </View>
<Swiper
  autoplay
  autoplayTimeout={3}
  showsPagination={true}
  loop={true}

  // Dot Style
  dotStyle={{
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  }}

  // Active Dot Style
  activeDotStyle={{
    width: 22,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  }}

  height={250}
>
  {images.map((item, index) => (
    <Image
      key={index}
      source={{uri: item.image}}
      style={{
        width: '100%',
        height: 250,
        // borderRadius: 15,
      }}
      resizeMode="cover"
    />
  ))}
</Swiper>
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
          {item.title}
        </Text>

        <Text style={styles.subTitle}>
          {item.subtitle}
        </Text>

        {/* Rating */}
        <View style={styles.ratingRow}>
          <AntDesign
            name="star"
            size={14}
            color="#FFC107"
          />

          <Text style={styles.ratingText}>
            {item.rating}
          </Text>

          <Text style={styles.reviewText}>
            ({item.reviews})
          </Text>
        </View>

        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {item.price}
          </Text>

          <Text style={styles.oldPrice}>
            {item.oldPrice}
          </Text>
        </View>

        {/* Delivery */}
        {/* <Text style={styles.delivery}>
          🚚 {item.delivery}
        </Text> */}
      </View>

      {/* Bottom */}
      <View style={styles.bottomRow}>
       

        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => gotoCart()}
        >
          <Feather
            name="shopping-cart"
            size={18}
            color={AllColors.black}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )}
/>
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

  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    borderRadius:10
  },

  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff2d7a',
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
    backgroundColor: '#ff2d7a',
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
    borderColor: '#ff2d7a',
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
    color: '#ff2d7a',
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
    color: '#ff2d7a',
  },

  desc: {
    marginTop: 8,
    color: '#555',
    width: 160,
    lineHeight: 20,
  },

  shopBtn: {
    marginTop: 15,
    backgroundColor: '#ff2d7a',
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
    margin: 8,
    borderRadius: 25,
    padding: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f1f1',
  },

  heart: {
    position: 'absolute',
    right: 15,
    top: 15,
    zIndex: 1,
  },

  imageBox: {
    height: 170,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  productImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },

  bottomRow: {
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  productTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },

  price: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ff2d7a',
    marginTop: 5,
  },

  cartBtn: {
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: '#FFF1F7',
    justifyContent: 'center',
    alignItems: 'center',
  },topRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
},

tag: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FFF0F6',
  paddingHorizontal: 10,
  paddingVertical: 5,
  borderRadius: 30,
  alignSelf: 'flex-start',
  marginBottom: 8,
},

tagText: {
  fontSize: 11,
  color: '#ff2d7a',
  marginLeft: 5,
  fontWeight: '600',
},

subTitle: {
  fontSize: 13,
  color: '#777',
  marginTop: 4,
},

ratingRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 7,
},

ratingText: {
  fontSize: 12,
  fontWeight: '700',
  marginLeft: 4,
  color: '#222',
},

reviewText: {
  fontSize: 11,
  color: '#999',
  marginLeft: 4,
},

priceRow: {
  flexDirection: 'row',
  alignItems: 'center',
  // marginTop: 8,
},

oldPrice: {
  fontSize: 13,
  color: '#999',
  textDecorationLine: 'line-through',
  marginLeft: 8,
},

delivery: {
  fontSize: 11,
  color: 'green',
  marginTop: 7,
  fontWeight: '600',
},

discountBox: {
  position: 'absolute',
  top: 10,
  left: 10,
  backgroundColor: '#ff2d7a',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 30,
},

discountText: {
  color: '#fff',
  fontSize: 10,
  fontWeight: '700',
},

stock: {
  fontSize: 11,
  color: '#444',
  fontWeight: '600',
},

card: {
  flex: 1,
  backgroundColor: '#fff',
  margin: 8,
  borderRadius: 25,
  padding: 12,
  elevation: 3,
  borderWidth: 1,
  borderColor: '#f3f3f3',
},
});