import React,{ useState, useRef } from "react";
import {
View,
Text,
FlatList,
Image,
TouchableOpacity,
StyleSheet
} from "react-native";

import { useRoute,useNavigation } from "@react-navigation/native";
import AntDesign from "react-native-vector-icons/AntDesign";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import AllColors from "../Constants/Color";
export default function ViewAllProducts(){

const route=useRoute();
const navigation=useNavigation();

const {title,products}=route.params;
 
const gotoDetails=(item)=>{
    console.log(item,'hjhkjjhkhjhg')
navigation.navigate("ProductDetails",{
id:item.id
})
}
const [currentIndex, setCurrentIndex] = useState(1);

const viewabilityConfig = {
  itemVisiblePercentThreshold: 50,
};

const onViewableItemsChanged = useRef(({ viewableItems }) => {
  if (viewableItems.length > 0) {
    setCurrentIndex(viewableItems[0].index + 1);
  }
}).current;
return (
  <View
    style={{
      flex: 1,
      backgroundColor: "#fff",
      paddingVertical: 10,
      paddingHorizontal: 15,
    }}
  >

    {/* Header */}
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <AntDesign
          name="arrowleft"
          color={AllColors.black}
          size={22}
        />
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>
    </View>

    {/* Counter */}
    <View style={styles.counterWrapper}>
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {currentIndex}/{products.length}
        </Text>
      </View>
    </View>

    {/* Product List */}
    <FlatList
      data={products}
      numColumns={2}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      keyExtractor={(item) => item.id.toString()}
    renderItem={({item})=>(

<TouchableOpacity
style={styles.card}
onPress={()=>gotoDetails(item)}
>

<Image
source={{uri:item.image}}
style={styles.image}
/>

<Text
numberOfLines={2}
style={styles.name}
>
{item.name}
</Text>

<Text style={styles.price}>
₹ {item.price}
</Text>
 <View style={styles.priceRow}>
        <Text style={styles.oldPrice}>₹{item.originalPrice}</Text>
        <Text style={styles.offer}> 
          {item.discount}% OFF
        </Text>
      </View>
</TouchableOpacity>

)}
/>

  </View>
);

}

const styles=StyleSheet.create({

title:{
fontSize:22,
fontWeight:"bold",
padding:15
},

card:{
flex:1,
margin:8,
backgroundColor:"#fff",
borderRadius:10,
padding:10,
elevation:3
},
header: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 15,
  paddingTop: 15,
  paddingBottom: 10,
},

title: {
  fontSize: 22,
  fontWeight: "bold",
},

counterContainer: {
  position: "absolute",
  top:30,          // যত নিচে নামাতে চাও
  alignSelf: "center",
  width: 45,
  height: 45,
  borderRadius: 32.5,
  backgroundColor: AllColors.white,
  justifyContent: "center",
  alignItems: "center",
  elevation: 6,
  zIndex: 999,
},

counterText: {
  color: "#0f0f0f",
  fontWeight: "bold",
  fontSize: 16,
},
image:{
width:"100%",
height:150,
resizeMode:"contain"
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
name:{
marginTop:8,
fontWeight:"600"
},

price:{
marginTop:5,
color:"red",
fontWeight:"bold"
}

})