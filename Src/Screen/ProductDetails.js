import react, { useEffect, useId, useState } from 'react'
import { Button, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { BASE_URL, getuserId } from '../Api/Api';

export default function ProductDetails({route}){
    const [product,setProduct]=useState({})
    const [productImage,setProductImage]=useState( null)
    const [isAddedToCart, setIsAddedToCart] = useState(false);
     const { id } = route.params;
    
    
    // setProductId(id)
    useEffect(()=>{
            getPrductDetails()
    },[])
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
    const requestToCart=async  ()=>{
      const userId=await getuserId()
      const formData = new FormData(); 
       formData.append('user_id',userId );
       formData.append('product_id',id);
       formData.append('qty',1);

                       try {
        const response = await fetch(`${BASE_URL}cart-to-add`, {
          method: 'POST',
          body: formData,
        });
    
        const data = await response.json();
        console.log('data',data)
       if(data.status==200){ 
         setIsAddedToCart(true);
         
      };
      } catch (error) {
        console.log('Error:', error);
      }   
    }
   
            return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
  <View style={styles.imageContainer}>
    <Image
      source={{ uri: product?.image?.[0] }}
      style={styles.image}
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
        ₹ {product?.actual_price}
      </Text>

      <Text style={styles.oldPrice}>
        ₹ {product?.actual_price + 500}
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
    <TouchableOpacity style={styles.cartBtn} onPress={requestToCart}>
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
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
  },

  image: {
    width: '90%',
    height: 300,
    resizeMode: 'contain',
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
    lineHeight: 34,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
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
    lineHeight: 24,
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
    borderColor: '#ff6b00',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
  },

  buyBtn: {
    flex: 1,
    backgroundColor: '#ff6b00',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
  },

  cartText: {
    color: '#ff6b00',
    fontWeight: '700',
    fontSize: 16,
  },

  buyText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});