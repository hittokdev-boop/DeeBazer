import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import { useRoute, useNavigation } from "@react-navigation/native";
import AntDesign from "react-native-vector-icons/AntDesign";
import Ionicons from "react-native-vector-icons/Ionicons";

import AllColors from "../../../Constants/Color";
import { useTheme } from '../../../Context/ThemeContext';
import { BASE_URL } from "../../../Api/Api";
import { extractSellerInfo } from '../../../Common/sellerUtils';

export default function ViewAllProducts() {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();

  const {
    title,
    products: initialProducts = [],
    categoryId,
    subCategoryId,
    childCategoryId,
    sellerId,
    sellerName,
  } = route.params || {};

  const [productList, setProductList] = useState(initialProducts);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(1);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index + 1);
    }
  }).current;

  const fetchProducts = async (pageNum = 1, isLoadMore = false) => {
    if ((!categoryId || categoryId === 'all') && initialProducts.length > 0 && !isLoadMore && !sellerId && !sellerName) {
      setProductList(initialProducts);
      setRefreshing(false);
      return;
    }

    if (isLoadMore) {
      if (loadingMore || !hasMore) return;
      setLoadingMore(true);
    } else {
      if (productList.length === 0) setLoading(true);
    }

    try {
      const formData = new FormData();
      if (categoryId && categoryId !== 'all') {
        formData.append('category_id', categoryId);
      } else {
        formData.append('category_id', 'all');
      }
      if (subCategoryId && subCategoryId !== 'all' && subCategoryId !== 'null') {
        formData.append('sub_category_id', subCategoryId);
      }
      if (childCategoryId && childCategoryId !== 'all' && childCategoryId !== 'null') {
        formData.append('child_category_id', childCategoryId);
      }
      formData.append('per_page', 24);
      formData.append('page', pageNum);

      const response = await fetch(`${BASE_URL}product`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      const allItems = (data?.data && Array.isArray(data.data)) ? data.data : [];

      let finalItems = allItems;
      if (sellerId || sellerName) {
        const targetSellerId = sellerId !== null && sellerId !== undefined ? String(sellerId) : null;
        const targetSellerName = sellerName ? String(sellerName).trim().toLowerCase() : '';

        const isDefaultOrAdminTarget =
          targetSellerName.includes('deebazar') ||
          targetSellerName.includes('current') ||
          targetSellerName.includes('this') ||
          targetSellerId === '1' ||
          targetSellerId === '0';

        finalItems = allItems.filter((p) => {
          const pInfo = extractSellerInfo(p);
          const pSellerId = pInfo.sellerId;
          const pSellerName = pInfo.sellerName ? pInfo.sellerName.toLowerCase() : '';

          // If target is a third-party seller (e.g. ananya, id != 1):
          if (!isDefaultOrAdminTarget) {
            if (targetSellerId && pSellerId && String(pSellerId) === targetSellerId) {
              return true;
            }
            if (targetSellerName && pSellerName && (pSellerName.includes(targetSellerName) || targetSellerName.includes(pSellerName))) {
              return true;
            }
            return false;
          }

          // If target is Deebazar Store (admin/main store):
          // Exclude any product that belongs to another third-party seller (e.g. ananya, id > 1)
          if (pSellerName && (pSellerName.includes('ananya') || (pSellerId && pSellerId !== '1' && pSellerId !== '0'))) {
            return false;
          }
          if (pSellerId && pSellerId !== '1' && pSellerId !== '0') {
            return false;
          }
          // Include products that have no other vendor or are from Deebazar store
          return true;
        });
      }

      if (isLoadMore) {
        setProductList((prev) => {
          const existingIds = new Set(prev.map((p) => String(p.id)));
          const newItems = finalItems.filter((p) => !existingIds.has(String(p.id)));
          return [...prev, ...newItems];
        });
        setPage(pageNum);
      } else {
        setProductList(finalItems.length > 0 ? finalItems : (initialProducts.length > 0 ? initialProducts : []));
        setPage(1);
      }

      if (allItems.length < 12) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error) {
      console.error('Error fetching view all products:', error);
      if (!isLoadMore && initialProducts.length > 0) {
        setProductList(initialProducts);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts(1, false);
  }, [categoryId, subCategoryId, childCategoryId, sellerId, sellerName]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(1, false);
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore && (categoryId || productList.length >= 12)) {
      fetchProducts(page + 1, true);
    }
  };

  const isOutOfStock = (item) => {
    if (!item) return false;
    if (item.in_stock === false || item.in_stock === 0 || item.in_stock === '0' || item.in_stock === 'false' || item.in_stock === 'no' || item.in_stock === 'out_of_stock') return true;
    if (item.out_of_stock === true || item.out_of_stock === 1 || item.out_of_stock === '1' || item.out_of_stock === 'true' || item.out_of_stock === 'yes') return true;
    if (item.is_out_of_stock === true || item.is_out_of_stock === 1 || item.is_out_of_stock === '1' || item.is_out_of_stock === 'true' || item.is_out_of_stock === 'yes') return true;
    if (item.is_stock === false || item.is_stock === 0 || item.is_stock === '0' || item.is_stock === 'false' || item.is_stock === 'no') return true;
    if (item.stock !== undefined && item.stock !== null && (item.stock === false || item.stock === 'false' || item.stock === 0 || item.stock === '0' || item.stock === 'no' || Number(item.stock) <= 0)) return true;
    if (item.stock_quantity !== undefined && item.stock_quantity !== null && (item.stock_quantity === '' || Number(item.stock_quantity) <= 0)) return true;
    if (item.quantity !== undefined && item.quantity !== null && (item.quantity === '' || Number(item.quantity) <= 0)) return true;
    if (item.available_quantity !== undefined && item.available_quantity !== null && Number(item.available_quantity) <= 0) return true;
    if (item.available_stock !== undefined && item.available_stock !== null && Number(item.available_stock) <= 0) return true;
    if (item.total_stock !== undefined && item.total_stock !== null && Number(item.total_stock) <= 0) return true;
    if (item.current_stock !== undefined && item.current_stock !== null && Number(item.current_stock) <= 0) return true;
    if (item.inventory !== undefined && item.inventory !== null && Number(item.inventory) <= 0) return true;
    if (item.stock_status && (
      item.stock_status === 'out_of_stock' || 
      item.stock_status === 'outofstock' || 
      item.stock_status === '0' || 
      item.stock_status === 0 || 
      item.stock_status === false || 
      String(item.stock_status).toLowerCase().includes('out')
    )) return true;
    if (item.status && (
      item.status === 'out_of_stock' || 
      item.status === 'outofstock' || 
      String(item.status).toLowerCase().includes('out')
    )) return true;
    return false;
  };

  const gotoDetails = (item) => {
    navigation.navigate("ProductDetails", {
      id: item.id
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDarkMode ? '#334155' : AllColors.divider }]}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('AppTab');
            }
          }}
        >
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>{title || 'Products'}</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>{productList ? `${productList.length} Items Available` : 'Showing all'}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={AllColors.primary} />
        </View>
      ) : (
        /* Product Grid */
        <FlatList
          data={productList}
          numColumns={2}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          keyExtractor={(item, index) => item.id ? item.id.toString() : String(index)}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[AllColors.primary]}
              tintColor={AllColors.primary}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={AllColors.primary} />
                <Text style={[styles.loadingMoreText, { color: theme.textSecondary }]}>Loading more products...</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const outOfStock = isOutOfStock(item);
            return (
              <TouchableOpacity
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.cardBg,
                    borderColor: theme.borderColor,
                    position: 'relative',
                    overflow: 'hidden',
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => gotoDetails(item)}
              >
                {/* Image Container */}
                <View style={[styles.cardImageContainer, { backgroundColor: isDarkMode ? '#0F172A' : AllColors.screenBg, position: 'relative', overflow: 'hidden' }]}>
                  <Image source={{ uri: item.image }} style={styles.image} />
                  {outOfStock && (
                    <View
                      style={[
                        styles.meeshoImageOverlay,
                        { backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.65)' },
                      ]}
                      pointerEvents="none"
                    >
                      <View
                        style={[
                          styles.meeshoOutOfStockBadge,
                          {
                            backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                            borderColor: isDarkMode ? '#475569' : '#CBD5E1',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.meeshoOutOfStockText,
                            { color: isDarkMode ? '#F8FAFC' : '#1E293B' },
                          ]}
                        >
                          OUT OF STOCK
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Product Details */}
                <View style={styles.cardContent}>
                  <Text numberOfLines={2} style={[styles.name, { color: theme.textPrimary }]}>
                    {item.name}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={[styles.price, { color: theme.textPrimary }]}>₹{item.price ?? item.discount_price}</Text>
                    {item.originalPrice || item.actual_price ? (
                      <Text style={[styles.oldPrice, { color: theme.textSecondary }]}>₹{item.originalPrice ?? item.actual_price}</Text>
                    ) : null}
                  </View>

                  {item.discount ? (
                    <View style={styles.cardFooterRow}>
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{item.discount}% OFF</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Floating Counter */}
      {productList.length > 0 && (
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {currentIndex}/{productList.length}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AllColors.screenBg,
  },
  centerLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  },
  discountText: {
    color: AllColors.greenLight,
    fontWeight: '700',
    fontSize: 10,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  outOfStockBadge: {
    backgroundColor: AllColors.redSoftBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-end',
  },
  outOfStockText: {
    color: AllColors.redLight,
    fontWeight: '700',
    fontSize: 10,
  },
  inStockBadge: {
    backgroundColor: AllColors.greenSoftBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-end',
  },
  inStockText: {
    color: AllColors.greenLight,
    fontWeight: '700',
    fontSize: 10,
  },
  meeshoImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  meeshoOutOfStockBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  meeshoOutOfStockText: {
    color: '#1E293B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  loadingMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
});