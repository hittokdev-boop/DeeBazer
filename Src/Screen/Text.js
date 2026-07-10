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

return(

<View style={{flex:1,backgroundColor:"#fff"}}>

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
<View style={{flexDirection:"row",justifyContent:"space-between"}}>
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