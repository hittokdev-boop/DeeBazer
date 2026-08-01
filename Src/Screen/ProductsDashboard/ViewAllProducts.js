import React, { useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar
} from "react-native";

import { useRoute, useNavigation } from "@react-navigation/native";
import AntDesign from "react-native-vector-icons/AntDesign";

import AllColors from "../../Constants/Color";
import { useTheme } from '../../Context/ThemeContext';

export default function ViewAllProducts() {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();

  const { title, products = [] } = route.params || {};

  const [currentIndex, setCurrentIndex] = useState(1);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index + 1);
    }
  }).current;

  const gotoDetails = (item) => {
    navigation.navigate("ProductDetails", {
      id: item.id
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar backgroundColor={AllColors.white} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={AllColors.slateDark} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Products'}</Text>
          <Text style={styles.headerSubtitle}>{products ? `${products.length} Items Available` : 'Showing all'}</Text>
        </View>
      </View>

      {/* Product Grid */}
      <FlatList
        data={products}
        numColumns={2}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => gotoDetails(item)}
          >
            {/* Image Container */}
            <View style={styles.cardImageContainer}>
              <Image source={{ uri: item.image }} style={styles.image} />
            </View>

            {/* Product Details */}
            <View style={styles.cardContent}>
              <Text numberOfLines={2} style={styles.name}>
                {item.name}
              </Text>

              <View style={styles.priceRow}>
                <Text style={styles.price}>₹{item.price}</Text>
                {item.originalPrice ? (
                  <Text style={styles.oldPrice}>₹{item.originalPrice}</Text>
                ) : null}
              </View>

              {item.discount ? (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{item.discount}% OFF</Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Floating Counter */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {currentIndex}/{products.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AllColors.screenBg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: AllColors.white,
    borderBottomWidth: 1,
    borderColor: AllColors.lightGrey,
    elevation: 2,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AllColors.divider,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: AllColors.slateDark,
  },
  headerSubtitle: {
    fontSize: 12,
    color: AllColors.slateSub,
    marginTop: 2,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  card: {
    flex: 1,
    maxWidth: '48%',
    backgroundColor: AllColors.white,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AllColors.divider,
    elevation: 2,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardImageContainer: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: AllColors.screenBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  image: {
    width: "90%",
    height: "90%",
    resizeMode: "contain",
  },
  cardContent: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: AllColors.slateText,
    lineHeight: 18,
    height: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: AllColors.slateDark,
  },
  oldPrice: {
    textDecorationLine: 'line-through',
    color: AllColors.slateLight,
    marginLeft: 6,
    fontSize: 11,
  },
  discountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: AllColors.greenSoftBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  discountText: {
    color: AllColors.greenLight,
    fontWeight: '700',
    fontSize: 10,
  },
  counterContainer: {
    position: "absolute",
    top: 76,
    alignSelf: "center",
    backgroundColor: AllColors.modalOverlay,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  counterText: {
    color: AllColors.white,
    fontSize: 14,
    fontWeight: "700",
  },
});