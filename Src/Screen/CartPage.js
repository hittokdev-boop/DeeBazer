import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Rating } from '@kolking/react-native-rating';
import AllColors from '../Constants/Color';
import AntDesign from 'react-native-vector-icons/AntDesign'
import Feather from 'react-native-vector-icons/Feather'
const CartPage = () => {
  const [cartItems, setCartItems] = useState([
    {
      id: '1',
      name: 'Nike Shoes',
      price: 2499,
      qty: 1,
      rating:4.5,
      image:
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop',
      member:15290,
      isprime:true,
      discount:30,
      offer:800

    },
    {
      id: '2',
      name: 'Wireless Headphone',
      price: 1499,
      qty: 2,
      rating:3.4,
      image:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop',
        member:12000,
        isprime:false,
        discount:20,
        offer:500
    },
  ]);

  const increaseQty = id => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, qty: item.qty + 1 }
          : item,
      ),
    );
  };

  const decreaseQty = id => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id && item.qty > 1
          ? { ...item, qty: item.qty - 1 }
          : item,
      ),
    );
  };

  const removeItem = id => {
    setCartItems(prev =>
      prev.filter(item => item.id !== id),
    );
  };

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.image }}
        style={styles.image}
      />

      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={{flexDirection:'row',gap:5}}>
        <Rating size={13} rating={item.rating} fillColor={AllColors.green} />
        <Text style={{color:AllColors.green}}>{item.rating}</Text>
      <Text>({item.member.toLocaleString()})</Text>
    
      </View>
  {item.isprime ? <Text style={{color:AllColors.highLight,fontWeight:'bold'}}>Prime Products</Text> : null}
       <View style={{flexDirection:'row',gap:5}}>
        <View style={{flexDirection:'row'}}>
     
     
        <Feather   style={{marginTop:5}}color={AllColors.green} size={20} name='arrow-down'/>
          <Text style={styles.discount}>{item.discount}%</Text>
        </View>
        <Text style={styles.offer}>{item.offer}</Text>
        <Text style={styles.price}>₹{item.price}</Text>
        </View> 

        <View style={styles.bottomRow}>
          <View style={styles.qtyContainer}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => decreaseQty(item.id)}>
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>

            <Text style={styles.qty}>{item.qty}</Text>

            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => increaseQty(item.id)}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => removeItem(item.id)}>
            <AntDesign  size={20} color={AllColors.black} name='delete' />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>My Cart</Text>
      <View style={{marginHorizontal:20,margin:5,flexDirection:'row'}}>
        <View style={{width:300}}>
        <Text style={styles.Adress}>DeliVer to: <Text style={{color:"#000",fontWeight:'bold'}}>Hittok,</Text>123 Park Street, Kolkata...</Text>

        </View>
        <TouchableOpacity style={styles.changeButton}>
          <Text style={styles.change}>Change</Text>
        </TouchableOpacity>
      </View>
          <FlatList
        data={cartItems}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Total</Text>

          <Text style={styles.totalPrice}>₹{total}</Text>
        </View>

        <TouchableOpacity style={styles.checkoutBtn}>
          <Text style={styles.checkoutText}>
            Place Order
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CartPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },
  change:{
        color:AllColors.highLight
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    padding: 10,
    color: '#111',
   
  },
    Adress:{
        color:AllColors.black,
    },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 18,
    padding: 12,
    elevation: 3,
  },
  offer:{
        color:AllColors.grey,
        textDecorationLine:'line-through', 
        marginTop:5
  },
  changeButton:{
       borderWidth:1,borderColor:AllColors.grey,
       padding:5,
       borderRadius:3
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 14,
  },

  info: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },

  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },

  price: {
    fontSize: 18,
    fontWeight: '700',
    color: AllColors.black,
    marginTop: 5,
  },
  discount:{
      
    fontSize: 14,
    fontWeight: '700',
    color: AllColors.green,
    marginTop: 5,
  
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEE',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  qtyBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },

  qty: {
    marginHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
  },

  delete: {
    color: 'red',
    fontWeight: '600',
  },

  footer: {
      flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal:20,
    paddingVertical:5,
    backgroundColor:AllColors.white,
    marginVertical:2
  },

  totalRow: {
  
    marginBottom: 18,
  },

  totalText: {
    fontSize: 18,
    fontWeight: '600',
  },

  totalPrice: {
    fontSize: 24,
    fontWeight: '800',
  },

  checkoutBtn: {
    backgroundColor: AllColors.primary,
    // paddingVertical: 10,
    borderRadius: 16,
    height:50,
    alignSelf:"center",
    alignItems: 'center',
    justifyContent:'center',
    width:150
  },

  checkoutText: {
    color: '#fff',
    fontSize: 20,
    textAlign:"center",
    fontWeight:"bold"
   
  },
});