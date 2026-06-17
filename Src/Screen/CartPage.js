import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
} from 'react-native';
import { Rating } from '@kolking/react-native-rating';
import AllColors from '../Constants/Color';
import AntDesign from 'react-native-vector-icons/AntDesign'
import Feather from 'react-native-vector-icons/Feather'
import { BASE_URL, getToken, getuserId } from '../Api/Api';
import { ScrollView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
const CartPage = () => {
  const [cartItems,setCartItems]=useState([])
  const [extraData,setExtraData]=useState({})
  const [addressList,setAddressList]=useState([])
  const [isModal,setIsModal]=useState(false)
  const [addressModal, setAddressModal] = useState(false);

const increaseQty = (id) => {

  setCartItems((prev) =>
    prev.map((item) =>
      item.product_id=== id
        ? {
            ...item,
            qty: Number(item.qty) + 1,
            actual_price:item.actual_price+1
          }
        : item
    )
  );
};

const decreaseQty = (id) => {
  setCartItems((prev) =>
    prev.map((item) =>
      item.product_id === id && Number(item.qty) > 1
        ? {
            ...item,
            qty: Number(item.qty) - 1,
                actual_price:item.actual_price-1

          }
        : item
    )
  );
};

const removeItem = (id) => {
  setCartItems((prev) =>
    prev.filter((item) => item.product_id !== id)
  );
};

const total = cartItems.reduce(
  (sum, item) =>
    sum + Number(item.actual_price) * Number(item.qty),
  0
);
  useEffect(()=>{
     CartView()
  },[])
  const CartView=async ()=>{
     const userid=await getuserId()
 
    const formData = new FormData();
    formData.append('user_id', userid);
          try {
         const response = await fetch(`${BASE_URL}cart-view`, {
           method: 'POST',
           body:formData
           
         });
     
         const data = await response.json();
        if(data.data){ 
     
         setCartItems(data.data)
         setExtraData(data.extra_data)
       };
       } catch (error) {
         console.log('Error:', error);
       }
  }
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.image }}
        style={styles.image}
      />

      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text>{item.short_desc02}</Text>
        <View style={{flexDirection:'row',gap:5}}>
        {/* <Rating size={13} rating={item.rating} fillColor={AllColors.green} /> */}
        {/* <Text style={{color:AllColors.green}}>{item.rating}</Text> */}
      {/* <Text>({item.member.toLocaleString()})</Text> */}
    
      </View>
  {item.isprime ? <Text style={{color:AllColors.highLight,fontWeight:'bold'}}>Prime Products</Text> : null}
       <View style={{flexDirection:'row',gap:5}}>
        <View style={{flexDirection:'row'}}>
     
     
        <Feather   style={{marginTop:5}}color={AllColors.green} size={20} name='arrow-down'/>
          <Text style={styles.discount}>{item.discount_price}%</Text>
        </View>
        {/* <Text style={styles.offer}>{item.offer}</Text> */}
        <Text style={styles.price}>₹{item.actual_price}</Text>
        </View> 

        <View style={styles.bottomRow}>
          <View style={styles.qtyContainer}> 
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => decreaseQty(item.product_id)}>
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>

            <Text style={styles.qty}>{item.qty}</Text>

            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => increaseQty(item.product_id)}>
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
 const requestForOder= async ()=>{
                   const token = await getToken();
                  const id= await getuserId()
             
               try {
              
                  const formData = new FormData();
                  formData.append('user_id',id);
              
                  const response = await fetch(`${BASE_URL}list-address`, {
                    method: 'POST',
                    headers: {
                    Authorization: `Bearer ${token}` },
                    body:formData
                  });
              
                  const data = await response.json();
              
                  if (response.ok) {
                   setAddressList(data.data)
                   
                  } else {
              
                   console.log("sh")
              
                  }
              
                } catch (error) {
              
                  console.log(error,'jjj');
              
                 
              
                } 
 }
 const requestForChangeAddress=()=>{
           setIsModal(true)
 }
 const openAddAddress = () => {
  setAddressModal(true);
  setIsModal(false);
};
const Navigation=useNavigation()
const gotoMAP=()=>{
  Navigation.navigate('MapScreen')
}
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>My Cart</Text>
      <View style={{marginHorizontal:20,margin:5,flexDirection:'row'}}>
        <View style={{width:300}}>
        <Text style={styles.Adress}>DeliVer to:
          {extraData.address_data                                                     }
           {/* <Text style={{color:"#000",fontWeight:'bold'}}>Hittok,</Text>123 Park Street, Kolkata... */}
           </Text>

        </View>
        <TouchableOpacity style={styles.changeButton} onPress={requestForChangeAddress}>
          <Text style={styles.change}>Change</Text>
        </TouchableOpacity>
      </View>
          <FlatList
        data={cartItems}
        keyExtractor={item => item.product_id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Total</Text>

          <Text style={styles.totalPrice}>₹{extraData.total_amount}</Text>
        </View>

        <TouchableOpacity style={styles.checkoutBtn} onPress={requestForOder}>
          <Text style={styles.checkoutText}>
            Place Order
          </Text>
        </TouchableOpacity>
      
      </View>
        <View style={{height:20}}/>
      <Modal
  visible={isModal}
  transparent
  animationType="slide"
  onRequestClose={() => setIsModal(false)}
>
  <View style={styles.overlay}>
    <View style={styles.modalContainer}>
      
      <Text style={styles.title}>Select Delivery Address</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
 <TouchableOpacity style={styles.addButton}   onPress={openAddAddress}>
        <Text style={styles.addButtonText}>+ Add New Address</Text>
      </TouchableOpacity>
        <TouchableOpacity style={styles.addressCard}>
          <View style={styles.radioOuter}>
            <View style={styles.radioInner} />
          </View>

          <View style={styles.addressInfo}>
            <Text style={styles.name}>Debdas Das</Text>
            <Text style={styles.address}>
              123 Main Road, Kolkata, West Bengal - 700001
            </Text>
            <Text style={styles.phone}>+91 9876543210</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addressCard}>
          <View style={styles.radioOuter} />

          <View style={styles.addressInfo}>
            <Text style={styles.name}>Home</Text>
            <Text style={styles.address}>
              Salt Lake Sector V, Kolkata, West Bengal - 700091
            </Text>
            <Text style={styles.phone}>+91 9123456789</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>

     

    </View>
  </View>
</Modal>
<Modal
  visible={addressModal}
  transparent
  animationType="slide"
  onRequestClose={() => setAddressModal(false)}
>
  <View style={styles.overlay}>
    <View style={styles.modalContainer}>

     
      <Text  style={styles.title} >
        Where do you want us to deliver the order?
      </Text>
      <Text style={styles.subTitel}>This will help with the right map location</Text>

      <TouchableOpacity
        style={styles.locationBtn}
        onPress={gotoMAP}
        
      >
        <Text style={styles.locationBtnText}>
          📍 Use Current Location
        </Text>
      </TouchableOpacity>

     

    

    

    </View>
  </View> 
</Modal>
    </SafeAreaView>
  );
};

export default CartPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },
   overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  locationBtn:{
        backgroundColor:AllColors.primary,
        padding:10,
       borderRadius:5


  },
locationBtnText:{
       color:AllColors.white,
       fontSize:20,
       textAlign:"center"
},
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: '70%',
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subTitel:{
     color:AllColors.grey,
     fontSize:16,
    marginBottom: 20,

  },
  addressCard: {
    flexDirection: 'row',
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    marginBottom: 12,
    alignItems: 'flex-start',
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: AllColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 3,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor:AllColors.primary,
  },

  addressInfo: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  address: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 20,
  },

  phone: {
    fontSize: 13,
    color: '#374151',
    marginTop: 5,
  },

  addButton: {
  
     alignSelf:'flex-end',
    borderRadius: 14,
    alignItems: 'center',
    margin: 10,
  },

  addButtonText: {
    color: AllColors.black,
    fontWeight: '700',
    fontSize: 15,
    textAlign:"right"
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