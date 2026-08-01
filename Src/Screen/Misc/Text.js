import React from "react";
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
import Feather from "react-native-vector-icons/Feather";
import AllColors from "../../Constants/Color";
export default function ViewAllProducts(){

const route=useRoute();
const navigation=useNavigation();

const {title,products}=route.params;
 
const gotoDetails=(item)=>{
    // console.log(item,'hjhkjjhkhjhg')
navigation.navigate("ProductDetails",{
id:item.id
})
}

return(

<View style={styles.container}>

<Text style={styles.title}>
{title}
</Text>

<FlatList
data={products}
numColumns={2}
keyExtractor={(item)=>item.id.toString()}
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
<View style={styles.counterRow}>
  <TouchableOpacity>
  <Text>+</Text>
</TouchableOpacity>
<Text>{count}</Text>
<TouchableOpacity> 
  <Text>-</Text>
</TouchableOpacity>
</View>

</View>

)

}

const styles=StyleSheet.create({
container: {
flex: 1,
backgroundColor: AllColors.white
},
counterRow: {
flexDirection: "row",
justifyContent: "space-between"
},

title:{
fontSize:22,
fontWeight:"bold",
padding:15,
color: AllColors.slateDark,
},

card:{
flex:1,
margin:8,
backgroundColor: AllColors.white,
borderRadius:10,
padding:10,
elevation:3
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
  color: AllColors.slateLight,
  marginRight: 8,
  fontSize: 12,
},

offer: {
  color: AllColors.greenLight,
  fontWeight: '700',
  fontSize: 12,
},
name:{
marginTop:8,
fontWeight:"600",
color: AllColors.slateDark,
},

price:{
marginTop:5,
color: AllColors.redLight,
fontWeight:"bold"
}

})