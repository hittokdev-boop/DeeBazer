import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Rating } from '@kolking/react-native-rating';
import AllColors from '../Constants/Color';
import AntDesign from 'react-native-vector-icons/AntDesign'
import Feather from 'react-native-vector-icons/Feather'
import { BASE_URL, getToken, getuserId } from '../Api/Api';
import { ScrollView } from 'react-native-gesture-handler';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons'
 import RazorpayCheckout from "react-native-razorpay";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
const CartPage = () => {
  const [cartItems,setCartItems]=useState([])
  const [extraData,setExtraData]=useState({})

  const billSummary = useMemo(() => {
    try {
      const discountedSum = cartItems.reduce(
        (sum, it) => sum + Number(it.discount_total ?? it.discount_price ?? 0),
        0
      );

      const actualSum = cartItems.reduce(
        (sum, it) => sum + Number(it.actual_total ?? (Number(it.actual_price || 0) * Number(it.qty || 1))),
        0
      );

      const discount = actualSum - discountedSum;
      const delivery_charge = Number(extraData?.delivery_charge ?? 0);
      const total_amount = discountedSum + delivery_charge;

      return {
        sub_total: Number(actualSum.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        delivery_charge,
        total_amount: Number(total_amount.toFixed(2)),
      };
    } catch (e) {
      return {
        sub_total: 0,
        discount: 0,
        delivery_charge: 0,
        total_amount: 0,
      };
    }
  }, [cartItems, extraData]);
  const [addressList,setAddressList]=useState([])
  const [isModal,setIsModal]=useState(false)
  const [addressModal, setAddressModal] = useState(false);
  const [isuser,setIsUser]=useState(null)
  const [addressData,setAddressData]=useState({})
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [addressId,setAddresId]=useState('')
  const updateCartQty = async (product, qty) => {
      const ID = await getuserId();
  try {
    const formData = new FormData();

    formData.append("user_id", ID);
    formData.append("product_id", product.product_id);
    formData.append("qty", qty);

    const response = await fetch(`${BASE_URL}cart-to-add`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    // console.log("Cart Update:", result);

    if (result.status !== 200) {
      Alert.alert("Error", result.message || "Unable to update cart");
    }
  } catch (error) {
    console.log("Cart Update Error:", error);
  }
};
const increaseQty = async (product) => {
  const newQty = Number(product.qty) + 1;

  setCartItems((prev) => {
    const updated = prev.map((item) => {
      if (item.product_id !== product.product_id) return item;

      const prevQty = Number(item.qty) || 1;
      const perUnitFromDiscount =
        item.unit_price || (Number(item.discount_price) / prevQty) || Number(item.actual_price);
      const unitPrice = Number(perUnitFromDiscount) || Number(item.actual_price || 0);
      const actualTotal = Number(item.actual_price || 0) * newQty;
      const discountTotal = Number((unitPrice * newQty).toFixed(2));

      return {
        ...item,
        unit_price: unitPrice,
        qty: newQty,
        actual_total: Number(actualTotal.toFixed(2)),
        discount_total: discountTotal,
        discount_price: discountTotal,
      };
    });

    const nextSummary = computeExtraDataFromCart(updated);
    setExtraData(nextSummary);
    return updated;
  });

  await updateCartQty(product, newQty);
};

const decreaseQty = async (product) => {
  if (Number(product.qty) === 1) {
    removeItem(product.product_id);
    return;
  }

  const newQty = Number(product.qty) - 1;

  setCartItems((prev) => {
    const updated = prev.map((item) => {
      if (item.product_id !== product.product_id) return item;

      const prevQty = Number(item.qty) || 1;
      const perUnitFromDiscount =
        item.unit_price || (Number(item.discount_price) / prevQty) || Number(item.actual_price);
      const unitPrice = Number(perUnitFromDiscount) || Number(item.actual_price || 0);
      const actualTotal = Number(item.actual_price || 0) * newQty;
      const discountTotal = Number((unitPrice * newQty).toFixed(2));

      return {
        ...item,
        unit_price: unitPrice,
        qty: newQty,
        actual_total: Number(actualTotal.toFixed(2)),
        discount_total: discountTotal,
        discount_price: discountTotal,
      };
    });

    const nextSummary = computeExtraDataFromCart(updated);
    setExtraData(nextSummary);
    return updated;
  });

  await updateCartQty(product, newQty);
};

// compute local extra data (subtotal, discount, total) from cart items
const computeExtraDataFromCart = (items) => {
  try {
    const discountedSum = items.reduce(
      (sum, it) => sum + Number(it.discount_total ?? it.discount_price ?? 0),
      0
    );

    const actualSum = items.reduce(
      (sum, it) => sum + Number(it.actual_total ?? (Number(it.actual_price || 0) * Number(it.qty || 1))),
      0
    );

    const discount = actualSum - discountedSum;
    const delivery_charge = Number(extraData?.delivery_charge) || 0;
    const total_amount = discountedSum + delivery_charge;

    return {
      sub_total: Number(actualSum.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      delivery_charge,
      total_amount: Number(total_amount.toFixed(2)),
    };
  } catch (e) {
    return extraData || {};
  }
};
const requestForOder = async () => {
  try {
    if (!addressId) {
      Alert.alert("Select Address", "Please select a delivery address.");
      return;
    }

    const formData = new FormData();
    formData.append("address_id", addressId);
    formData.append("payment_method", "cashfree"); 

    if (couponCode && couponCode.trim() !== "") {
      formData.append("coupon_code", couponCode);
    }

    const response = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: formData,
    });

    const result = await response.json();

    console.log("Create Order Response:", result);

    if (result.status === 200) {
      Alert.alert("Success", result.message);

      // Cashfree Payment
      if (result.payment_url) {
        navigation.navigate("PaymentWebView", {
          paymentUrl: result.payment_url,
          orderId: result.order_id,
        });
      } else {
    
        navigation.replace("OrderSuccess", {
          orderId: result.order_id,
        });
      }
    } else {
      Alert.alert("Error", result.message || "Order creation failed");
    }
  } catch (error) {
    console.log("Create Order Error:", error);
    Alert.alert("Error", "Something went wrong.");
  }
};

const removeItem = async (productId) => {
    const userid = await getuserId();
            const token = await getToken();

  try {
    const formData = new FormData();
    formData.append("user_id", userid); 
    formData.append("product_id", productId);

    const response = await fetch(`${BASE_URL}cart-remove`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: formData,
    });

    const result = await response.json();

    // console.log("Remove Cart Response:", result);

    if (response.ok && result.status === 200) {
      setCartItems((prev) =>
        prev.filter((item) => item.product_id !== productId)
      );
    } else {
      Alert.alert("Error", result.message || "Failed to remove item");
    }
  } catch (error) {
    console.log("Remove Cart Error:", error);
    Alert.alert("Error", "Something went wrong");
  }
};

const total = cartItems.reduce(
  (sum, item) =>
    sum + Number(item.actual_price) * Number(item.qty),
  0
);
 const getUserId=async()=>{
       const userid=await getToken()
       setIsUser(userid)
        
 }
  // useEffect(()=>{
  //    CartView()
  //    getUserId()
  // },[])
useFocusEffect(
  useCallback(() => {
    CartView();
    getUserId();
  }, [])
);
  const CartView = async () => {
  const userid = await getuserId();

  const formData = new FormData();
  formData.append('user_id', userid);

  try {
    const response = await fetch(`${BASE_URL}cart-view`, {
      method: 'POST',
      body: formData,
    });

  
    const data = await response.json();
  setAddresId(data.address_data.id)

    setAddressData(data.address_data || {});
    setCartItems(data.data || []);
    setExtraData(data.extra_data || {});
  } catch (error) {
    console.log('Error:', error);
  }
};
 

 const requestForChangeAddress=async()=>{
           setIsModal(true)
 

            const token = await getToken();
  const ID = await getuserId();

  try {
    const response = await fetch(`${BASE_URL}list-address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: ID,
      }),
    });

    const data = await response.json();
   

    // console.log('Status:', response.status);
    // console.log('Address List:', data);

    if (response.ok) {
   
      setAddressList(data.data || data.addresses || []);
    } else {
      console.log('API Error:', data.message);
    }
  } catch (error) {
    console.log('Fetch Error:', error);
  }
 }
 const openAddAddress = () => {
      requestForChangeAddress()

  setAddressModal(true);
  setIsModal(true);
};
const navigation=useNavigation()
const gotoMAP=()=>{
  navigation.navigate('MapScreen')
}
const confirmUpdate = (addressId) => {
   Alert.alert(
    'Update Address',
    'Are you sure you want to update this location?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: () => handleUpdatte(addressId),
      },
    ],
    { cancelable: true }
  );
 
};
const handleUpdatte =()=>{
  console.log('no ')
}
const confirmDelete = (addressId) => {
  Alert.alert(
    'Delete Address',
    'Are you sure you want to delete this location?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: () => handleDelete(addressId),
      },
    ],
    { cancelable: true }
  );
};
const handleDelete = async (addressId) => {
  try {
    const token = await getToken();

    const response = await fetch(`${BASE_URL}delete-address`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address_id: addressId,
      }),
    });

    const result = await response.json();

    // console.log('Delete Response:', result);

    if (response.ok && result.status) {
      // Alert.alert('Success', 'Address deleted successfully.');

      setMenuId(null);

      if (selectedAddress?.id === addressId) {
        setSelectedAddress(null);
      }

    } else {
      Alert.alert('Error', result.message || 'Failed to delete address.');
    }

  } catch (error) {
    console.log(error);
    Alert.alert('Error', 'Something went wrong.');
  }
};

if (!isuser) {
  return (
    <SafeAreaView style={styles.container}>
   <View style={loginStyles.container}>
   <View style={loginStyles.iconBox}>
<AntDesign
      name="shoppingcart"
      size={80}
      color={AllColors.primary}
    />
  </View>

  <Text style={loginStyles.title}>Your Cart is Empty</Text>

  <Text style={loginStyles.subtitle}>
    Sign in to add products to your cart, save items for later,
    and place orders easily.
  </Text>

  <TouchableOpacity
    style={loginStyles.loginBtn}
    onPress={() => navigation.navigate('Login')}>
    <Text style={loginStyles.loginText}>Login to Continue</Text>
  </TouchableOpacity>

  <TouchableOpacity
    onPress={() => navigation.navigate('Profile')}>
    <Text style={loginStyles.skipText}>
      Continue Shopping
    </Text>
  </TouchableOpacity>
</View>
    </SafeAreaView>
  );
}
if (isuser && (!cartItems || cartItems.length === 0)) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={loginStyles.container}>
        <View style={loginStyles.iconBox}>
          <AntDesign
            name="shoppingcart"
            size={80}
            color={AllColors.primary}
          />
          {/* <Image
            source={require('../Assets/Images/empty_cart.png')}
            style={{ width: 80, height: 80, marginTop: 10 }}
          /> */}
        </View>

        <Text style={loginStyles.title}>Your Cart is Empty</Text>

        <Text style={loginStyles.subtitle}>
          Looks like you haven't added any products yet.
          Start shopping to fill your cart.
        </Text>

        <TouchableOpacity
          style={loginStyles.loginBtn}
          onPress={() => navigation.navigate("Home")} // বা Product Screen
        >
          <Text style={loginStyles.loginText}>
            Add Products
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

  return (

<SafeAreaView style={styles.container}>

{/* ================= Header ================= */}

<View style={styles.header}>

    <TouchableOpacity style={styles.iconBtn}>
        <AntDesign name="arrowleft" size={22} color= {AllColors.black}/>
    </TouchableOpacity>

    <Text style={styles.headerTitle}>
        Checkout
    </Text>

    <View style={{flexDirection:'row'}}>

        <TouchableOpacity style={styles.iconBtn}>
            <Feather name="search" size={22} color={AllColors.primary}/>
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.iconBtn}>
            <Feather name="share" size={22}/>
        </TouchableOpacity> */}

    </View>

</View>

<View 
>




{/* ================= Product Card ================= */}


<FlatList
  data={cartItems}
  keyExtractor={(item) => item.product_id.toString()}
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ paddingBottom: 170 }}
  renderItem={({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.deliveryTop}>
        <View style={styles.timeIcon}>
          <MaterialCommunityIcons
            name="clock-time-four-outline"
            size={22}
            color="#A26B00"
          />
        </View>

         {/* <View>
       <Text style={styles.deliveryTime}>
            Delivery in {item.delivery_time || 19} minutes
          </Text> 

          <Text style={styles.shipment}>
            Shipment of {item.qty} item
          </Text>
        </View> */}
      </View>

      <View style={styles.line} />

      <View style={styles.productRow}>
        <Image
          source={{ uri: item.image }}
          style={styles.image}
        />

        <View style={{ flex: 1, marginLeft: 15 }}>
          {item.offer ? (
            <View style={styles.offerBadge}>
              <Text style={styles.offerText}>
                {item.offer}
              </Text>
            </View>
          ) : null}

          <Text
            numberOfLines={2}
            style={styles.productName}
          >
            {item.name}
          </Text>

          <Text style={styles.size}>
            {item.short_desc02}
          </Text>

          <TouchableOpacity>
            <Text style={styles.wishlist}>
              Move to wishlist
            </Text>
          </TouchableOpacity>
        </View>

        <View>
          <View style={styles.qtyBox}>
            <TouchableOpacity
              onPress={() => decreaseQty(item)}
            >
              <Text style={styles.qtyBtn}>−</Text>
            </TouchableOpacity>

            <Text style={styles.qtyText}>
              {item.qty}
            </Text>

            <TouchableOpacity
              onPress={() => increaseQty(item)}
            >
              <Text style={styles.qtyBtn}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 10 }}>
            <Text style={styles.oldPrice}>
              ₹{item.actual_price}
            </Text>

            <Text style={styles.newPrice}>
              ₹{item.discount_price}
            </Text>
           
          </View>
        </View>
      </View>
       {/* <View style={{height:5,backgroundColor:all}}/> */}
    </View>
  )}
/>

  <View style={styles.billCard}>
      <Text style={styles.billTitle}>Bill Details</Text>

      <View style={styles.billRow}>
        <Text style={styles.billLabel}>Item Total</Text>
        <Text style={styles.billValue}>
          ₹{billSummary.sub_total}
        </Text>
      </View>

      <View style={styles.billRow}>
        <Text style={styles.billLabel}>Discount</Text>
        <Text style={styles.discountValue}>
          - ₹{billSummary.discount}
        </Text>
      </View>

      <View style={styles.billRow}>
        <Text style={styles.billLabel}>Delivery Charge</Text>
        <Text
          style={[
            styles.billValue,
            Number(billSummary.delivery_charge) === 0 && {
              color: "green",
            },
          ]}
        >
          {Number(billSummary.delivery_charge) === 0
            ? "FREE"
            : `₹${billSummary.delivery_charge}`}
        </Text>
      </View>

      <View style={styles.billDivider} />

      <View style={styles.billRow}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>
          ₹{billSummary.total_amount}
        </Text>
      </View>
    </View>
{/* ======= Second Card ======= */}




<View style={{height:120}}/>

</View>
{/* ================= Fixed Bottom ================= */}
<View style={styles.bottomContainer}>

  {/* Address */}
  <TouchableOpacity style={styles.addressCard}>
    <View style={styles.addressLeft}>
      <Ionicons
        name="location-outline"
        size={24}
        color={AllColors.primary}
      />

      <View style={{ marginLeft: 10, flex: 1 }}>
        <Text style={styles.deliverText}>
          Deliver to
        </Text>

      <Text
  numberOfLines={2}
  style={styles.addressText}
>
  {addressData?.id
    ? `${addressData?.house_no || ""}, ${addressData?.road_name || ""}, ${addressData?.city || ""}, ${addressData?.state || ""} - ${addressData?.pin || ""}`
    : "Select Delivery Address"}
</Text>
      </View>
    </View>

  <TouchableOpacity style={styles.changeBtn} onPress={openAddAddress}>
  <Text style={styles.changeBtnText}>Change</Text>
</TouchableOpacity>
  </TouchableOpacity>

  {/* Buy Now */}
  <TouchableOpacity style={styles.buyBtn}   onPress={requestForOder}>
    <Text style={styles.buyText}>
      Buy Now
    </Text>
  </TouchableOpacity>

</View>
<Modal
  visible={isModal}
  transparent
  animationType="slide"
  onRequestClose={() => setIsModal(false)}
>
  <TouchableOpacity
    style={styles.modalOverlay}
    activeOpacity={1}
    onPress={() => setIsModal(false)}
  >
    <TouchableOpacity
      activeOpacity={1}
      style={styles.modalContainer}
    >
      <View style={styles.dragBar} />

      <Text style={styles.modalTitle}>
        Select Delivery Address
      </Text>
     <TouchableOpacity style={{margin:10}} >
      <Text style={{color:AllColors.primary,textAlign:'right',fontSize:18}}>+Add New Address</Text>

     </TouchableOpacity>
          
      <FlatList
        data={addressList}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
           style={[
  styles.modalAddressCard,
  addressData?.id === item.id && styles.selectedCard,
]}
            onPress={() => {
              setAddressData(item);
              setIsModal(false);
            }}
          >
            <View style={styles.addressTop}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>
                  {item.type}
                </Text>
              </View>

              {addressData?.id === item.id && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={AllColors.primary}
                />
              )}
            </View>

           <Text style={styles.modalAddressName}>
              {item.name} • {item.mobile}
            </Text>

           <Text style={styles.modalAddressText}>
              {item.house_no}, {item.road_name},
              {"\n"}
              {item.landmark},
              {"\n"}
              {item.city}, {item.state} - {item.pin}
            </Text>
          </TouchableOpacity>
        )}
      />
       {/* Live Location */}
      <TouchableOpacity style={styles.liveLocationBtn} onPress={gotoMAP}>
        <Ionicons
          name="locate"
          size={22}
          color={AllColors.primary}
        />
        <Text style={styles.liveLocationText}>
          Use Live Location
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  </TouchableOpacity>
</Modal>
</SafeAreaView>

  );
};

export default CartPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AllColors.lightPink,
  },
  //---------//// bill ////----------
billCard: {
  backgroundColor: "#fff",
  marginHorizontal: 10,
  marginVertical: 6,
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderRadius: 12,
  elevation: 2,
},

billTitle: {
  fontSize: 16,
  fontWeight: "700",
  color: "#222",
  marginBottom: 10,
},

billRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: 4,
},

billLabel: {
  fontSize: 14,
  color: "#666",
},

billValue: {
  fontSize: 14,
  fontWeight: "600",
  color: "#222",
},

discountValue: {
  fontSize: 14,
  fontWeight: "600",
  color: "#1E9E45",
},

billDivider: {
  height: 1,
  backgroundColor: "#F0F0F0",
  marginVertical: 8,
},

totalLabel: {
  fontSize: 15,
  fontWeight: "700",
  color: "#222",
},

totalValue: {
  fontSize: 17,
  fontWeight: "700",
  color: AllColors.primary,
},


/* ================= Modal ================= */

modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.45)",
  justifyContent: "flex-end",
},

modalContainer: {
  backgroundColor: "#fff",
  height: "55%",
  borderTopLeftRadius: 25,
  borderTopRightRadius: 25,
  paddingHorizontal: 18,
  paddingTop: 12,
},

dragBar: {
  width: 45,
  height: 5,
  borderRadius: 10,
  backgroundColor: "#D9D9D9",
  alignSelf: "center",
  marginBottom: 18,
},

modalTitle: {
  fontSize: 20,
  fontWeight: "700",
  color: "#222",
  marginBottom: 18,
},

liveLocationBtn: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: AllColors.primary,
  borderRadius: 14,
  paddingVertical: 14,
  marginBottom: 18,
},

liveLocationText: {
  marginLeft: 8,
  color: AllColors.primary,
  fontWeight: "700",
  fontSize: 15,
},

modalAddressCard: {
  backgroundColor: "#fff",
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#E8E8E8",
  padding: 15,
  marginBottom: 14,
},

selectedCard: {
  borderColor: AllColors.primary,
  borderWidth: 2,
},

addressTop: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

typeBadge: {
  backgroundColor: "#F5F5F5",
  paddingHorizontal: 10,
  paddingVertical: 5,
  borderRadius: 20,
},

typeText: {
  fontSize: 13,
  fontWeight: "700",
  color: "#444",
},

modalAddressName: {
  fontSize: 16,
  fontWeight: "700",
  color: "#222",
  marginTop: 12,
},

modalAddressText: {
  fontSize: 14,
  color: "#666",
  marginTop: 6,
  lineHeight: 22,
},

addressText: {
  fontSize: 14,
  color: '#666',
  lineHeight: 22,
},

  changeBtn: {
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: AllColors.primary,
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 20,
  justifyContent: 'center',
  alignItems: 'center',
},

changeBtnText: {
  color: AllColors.primary,
  fontSize: 14,
  fontWeight: '600',
},
bottomContainer: {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor:  AllColors.white,
  paddingHorizontal: 15,
  paddingTop: 12,
  paddingBottom: 20,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  borderTopWidth: 1,
  borderColor: "#ECECEC",
  elevation: 15,
  shadowColor: AllColors.black,
  shadowOffset: {
    width: 0,
    height: -3,
  },
  shadowOpacity: 0.08,
  shadowRadius: 8,
},

addressCard: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: AllColors.yellow,
  borderRadius: 14,
  paddingVertical: 5,
  paddingHorizontal: 14,
  marginBottom: 12,
},

addressLeft: {
  flexDirection: "row",
  alignItems: "center",
  flex: 1,
},

deliverText: {
  fontSize: 12,
  color: AllColors.grey,
},

addressText: {
  fontSize: 15,
  fontWeight: "600",
  color:  AllColors.black,
  marginTop: 2,
},

buyBtn: {
  backgroundColor: AllColors.primary,
  height:40,
  borderRadius: 14,
  justifyContent: "center",
  alignItems: "center",
},

buyText: {
  color:  AllColors.white,
  fontSize: 17,
  fontWeight: "700",
},
header: {
  height: 56,
  backgroundColor: AllColors.white,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 12,
  elevation: 2,
},

iconBtn: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: "#F5F5F5",
  justifyContent: "center",
  alignItems: "center",
},

headerTitle: {
  flex: 1,
  fontSize: 19,
  fontWeight: "700",
  color: AllColors.black,
  marginLeft: 8,
},

  /* Banner */

  banner: {
  flexDirection: "row",
  backgroundColor: AllColors.yellow,
  marginHorizontal: 10,
  marginVertical: 8,
  borderRadius: 12,
  padding: 10,
  alignItems: "center",
},

bannerIcon: {
  width: 40,
  height: 40,
  borderRadius: 10,
  backgroundColor: AllColors.white,
  justifyContent: "center",
  alignItems: "center",
  marginRight: 10,
},

bannerTitle: {
  fontSize: 15,
  fontWeight: "700",
  color: "#333",
},

bannerSub: {
  fontSize: 12,
  color: AllColors.black,
  marginTop: 2,
},
  /* Card */
productCard: {
  backgroundColor: AllColors.white,
  marginHorizontal: 10,
  marginVertical: 6,
  borderRadius: 14,
  elevation: 2,
  overflow: "hidden",
},

deliveryTop: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 12,
  paddingVertical: 8,
},

timeIcon: {
  width: 34,
  height: 34,
  borderRadius: 17,
  backgroundColor: AllColors.yellow,
  justifyContent: "center",
  alignItems: "center",
  marginRight: 10,
},

deliveryTime: {
  fontSize: 14,
  fontWeight: "600",
  color: AllColors.black,
},

shipment: {
  fontSize: 11,
  color: AllColors.grey,
  marginTop: 2,
},

line: {
  height: 1,
  backgroundColor: "#F2F2F2",
},

productRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 12,
  paddingVertical: 10,
},

image: {
  width: 70,
  height: 70,
  borderRadius: 10,
  backgroundColor: AllColors.white,
},
offerBadge: {
  alignSelf: "flex-start",
  backgroundColor: "#DFF0FF",
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
  marginBottom: 4,
},

offerText: {
  color: "#0A66C2",
  fontWeight: "600",
  fontSize: 10,
},

productName: {
  fontSize: 14,
  fontWeight: "600",
  color: "#333",
  lineHeight: 18,
},

size: {
  color: "#777",
  fontSize: 11,
  marginTop: 3,
},

wishlist: {
  color: "#555",
  fontSize: 11,
  marginTop: 6,
  borderBottomWidth: 1,
  borderStyle: "dashed",
  alignSelf: "flex-start",
},

qtyBox: {
  width: 68,
  height: 32,
  backgroundColor: "#2F8F1E",
  borderRadius: 8,
  flexDirection: "row",
  justifyContent: "space-evenly",
  alignItems: "center",
},

qtyBtn: {
  color: AllColors.white,
  fontSize: 24,
  fontWeight: "700",
},

qtyText: {
  color: AllColors.white,
  fontSize: 14,
  fontWeight: "700",
},

oldPrice: {
  textDecorationLine: "line-through",
  color: "#999",
  textAlign: "right",
  fontSize: 11,
},

newPrice: {
  fontSize: 18,
  fontWeight: "700",
  color: AllColors.black,
  textAlign: "right",
},
buyBtn: {
  backgroundColor: AllColors.primary,
  height: 38,
  borderRadius: 10,
  justifyContent: "center",
  alignItems: "center",
},

buyText: {
  color: AllColors.white,
  fontSize: 15,
  fontWeight: "700",
},
addressText: {
  fontSize: 14,
  color: "#666",
  lineHeight: 22,
},
});
const loginStyles=StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },

  iconBox: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginTop: 25,
  },

  subtitle: {
    marginTop: 12,
    textAlign: 'center',
    color: '#666',
    fontSize: 15,
    lineHeight: 24,
  },

  loginBtn: {
    marginTop: 30,
    width: '100%',
    height: 55,
    backgroundColor: AllColors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loginText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },

  skipText: {
    marginTop: 20,
    color: AllColors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
})