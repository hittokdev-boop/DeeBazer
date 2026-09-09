import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Dimensions,
  Animated
} from "react-native";

import { useRoute, useNavigation } from "@react-navigation/native";
import AntDesign from "react-native-vector-icons/AntDesign";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Feather from "react-native-vector-icons/Feather";
import AllColors from "../../../Constants/Color";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDER_WIDTH = SCREEN_WIDTH - 32;

const DEFAULT_SLIDER_IMAGES = [
  {
    id: "1",
    title: "Summer Mega Sale",
    subtitle: "Up to 50% OFF on Electronics",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "2",
    title: "New Arrivals",
    subtitle: "Trendy Men & Women Fashion",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "3",
    title: "Fresh & Healthy",
    subtitle: "Organic Groceries at Best Prices",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "4",
    title: "Smart Devices",
    subtitle: "Latest Gadgets & Accessories",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80",
  },
];

export default function ViewAllProducts() {
  const [productsData, setProductData] = useState([]);
  const [inputText, setInputText] = useState("");
  const [count, setCount] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const sliderRef = useRef(null);

  const route = useRoute();
  const navigation = useNavigation();

  const title = route?.params?.title || "Products";
  const products = route?.params?.products || [];

  // Auto-scroll for Image Slider
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % DEFAULT_SLIDER_IMAGES.length;
        if (sliderRef.current) {
          sliderRef.current.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
        }
        return nextIndex;
      });
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  const handleSliderScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SLIDER_WIDTH);
    if (index >= 0 && index < DEFAULT_SLIDER_IMAGES.length) {
      setActiveIndex(index);
    }
  };

  const gotoDetails = (item) => {
    navigation.navigate("ProductDetails", {
      id: item.id
    });
  };

  const requestForGetProducttData = (data) => {
    if (data && data.isActive) {
      setProductData(data);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {/* TextInput Section */}
      <View style={styles.inputContainer}>
        <Feather name="search" size={20} color={AllColors.slateLight} style={styles.inputIcon} />
        <TextInput
          style={styles.textInput}
          placeholder="Enter text or search products..."
          placeholderTextColor={AllColors.slateLight}
          value={inputText}
          onChangeText={(text) => setInputText(text)}
        />
        {inputText.length > 0 && (
          <TouchableOpacity onPress={() => setInputText("")}>
            <AntDesign name="closecircle" size={16} color={AllColors.slateLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Image Slider */}
      <View style={styles.sliderContainer}>
        <FlatList
          ref={sliderRef}
          data={DEFAULT_SLIDER_IMAGES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={handleSliderScroll}
          getItemLayout={(data, index) => ({
            length: SLIDER_WIDTH,
            offset: SLIDER_WIDTH * index,
            index,
          })}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.9} style={styles.slideItem}>
              <Image source={{ uri: item.image }} style={styles.sliderImage} />
              <View style={styles.sliderOverlay}>
                <Text style={styles.sliderTitle}>{item.title}</Text>
                <Text style={styles.sliderSubtitle}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* Slider Pagination Dots */}
        <View style={styles.paginationContainer}>
          {DEFAULT_SLIDER_IMAGES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                activeIndex === index && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => gotoDetails(item)}
          >
            <Image
              source={{ uri: item.image }}
              style={styles.image}
            />

            <Text numberOfLines={2} style={styles.name}>
              {item.name}
            </Text>

            <Text style={styles.price}>
              ₹ {item.price}
            </Text>
            <View style={styles.priceRow}>
              {item.originalPrice ? <Text style={styles.oldPrice}>₹{item.originalPrice}</Text> : null}
              {item.discount ? (
                <Text style={styles.offer}>
                  {item.discount}% OFF
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
      />

      <View style={styles.counterRow}>
        <TouchableOpacity
          style={styles.counterBtn}
          onPress={() => setCount((prev) => (prev > 1 ? prev - 1 : 1))}
        >
          <Text style={styles.counterBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.counterValue}>{count}</Text>
        <TouchableOpacity
          style={styles.counterBtn}
          onPress={() => setCount((prev) => prev + 1)}
        >
          <Text style={styles.counterBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => requestForGetProducttData(products)}
      >
        <Text style={styles.actionBtnText}>
          Get Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AllColors.white
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    padding: 15,
    color: AllColors.slateDark,
  },

  card: {
    flex: 1,
    margin: 8,
    backgroundColor: AllColors.white,
    borderRadius: 10,
    padding: 10,
    elevation: 3
  },

  image: {
    width: "100%",
    height: 150,
    resizeMode: "contain"
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
  name: {
    marginTop: 8,
    fontWeight: "600",
    color: AllColors.slateDark,
  },

  price: {
    marginTop: 5,
    color: AllColors.redLight,
    fontWeight: "bold"
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    marginRight: 8,
  },
  sliderContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  slideItem: {
    width: SLIDER_WIDTH,
    height: 160,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#1E293B",
  },
  sliderImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  sliderOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sliderTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  sliderSubtitle: {
    color: "#E2E8F0",
    fontSize: 12,
    marginTop: 2,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  paginationDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: AllColors.primary,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: AllColors.slateDark,
    paddingVertical: 0,
  },
  counterRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 12,
  },
  counterBtn: {
    backgroundColor: AllColors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  counterBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  counterValue: {
    marginHorizontal: 20,
    fontSize: 18,
    fontWeight: "700",
    color: AllColors.slateDark,
  },
  actionBtn: {
    backgroundColor: AllColors.primary,
    marginHorizontal: 15,
    marginVertical: 10,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});