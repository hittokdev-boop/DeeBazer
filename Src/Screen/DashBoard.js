import React, { useCallback, useEffect, useState, useRef } from 'react';

import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  ToastAndroid,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Animated,
  BackHandler,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AllColors from '../Constants/Color';

import CommonLoginModal from './../Common/Login';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BASE_URL, getToken, getuserId, } from '../Api/Api';
import Swiper from 'react-native-swiper';

// import Feather from 'react-native-vector-icons/Feather'
const { width } = Dimensions.get('window');
import Ionicons from 'react-native-vector-icons/Ionicons';
export default function DashBoard() {
  const Navigation = useNavigation();

  const [id, setId] = useState('')
  const [open, setOpen] = useState(false)
  const [catagories, setCategories] = useState([])
  const [slug, setSlug] = useState('')
  const [catagoriesId, setCategoriesId] = useState('all')
  const [product, setProduct] = useState([])
  const [subCategories, setSubCategories] = useState([])
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null)
  const [subCategoriesLoading, setSubCategoriesLoading] = useState(false)
  const [dealOfTheDay, setDealOfTheDay] = useState([])
  const [latestproducts, setLatestproducts] = useState([])
  const [featuredproducts, setFeaturedproducts] = useState([])
  const [bestsellingProduct, setBestsellingProduct] = useState([])
  const [popularProduct, setPopularProduct] = useState([])
  const [searchText, setSearchText] = useState("");
  const [searchProducts, setSearchProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [cartQty, setCartQty] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const skeletonOpacity = React.useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isInitialLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(skeletonOpacity, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(skeletonOpacity, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isInitialLoading, skeletonOpacity]);

  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [sortByPrice, setSortByPrice] = useState('none');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isFilterActive, setIsFilterActive] = useState(false);

  const [isCartBarVisible, setIsCartBarVisible] = useState(true);
  const scrollTimeoutRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const lastBackPressedRef = useRef(0);
  const cartBarAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(cartBarAnim, {
      toValue: isCartBarVisible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isCartBarVisible, cartBarAnim]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleScroll = () => {
    if (isCartBarVisible) {
      setIsCartBarVisible(false);
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsCartBarVisible(true);
    }, 350);
  };

  const availableBrands = React.useMemo(() => {
    const set = new Set();
    const allPool = [
      ...(product || []),
      ...(dealOfTheDay || []),
      ...(popularProduct || []),
      ...(bestsellingProduct || []),
      ...(featuredproducts || []),
    ];
    allPool.forEach((p) => {
      if (p?.brand) set.add(String(p.brand).trim());
      if (p?.brand_name) set.add(String(p.brand_name).trim());
    });
    return Array.from(set).filter(Boolean);
  }, [product, dealOfTheDay, popularProduct, bestsellingProduct, featuredproducts]);

  const applyFilters = () => {
    const allPool = [
      ...(product || []),
      ...(dealOfTheDay || []),
      ...(popularProduct || []),
      ...(bestsellingProduct || []),
      ...(featuredproducts || []),
    ];
    const uniquePool = allPool.filter(
      (item, index, self) =>
        item && item.id && index === self.findIndex((t) => String(t.id) === String(item.id))
    );

    let sourceList = searchText.trim()
      ? searchProducts
      : (product && product.length > 0 ? product : uniquePool);
    let list = [...sourceList];

    // Filter by Category
    if (selectedCategory !== 'all') {
      const targetCat = catagories.find((c) => String(c.id) === String(selectedCategory));
      const catName = targetCat?.name ? String(targetCat.name).toLowerCase() : '';

      list = list.filter((item) => {
        const itemCatId = String(item?.category_id ?? item?.cat_id ?? item?.category?.id ?? '');
        const itemCatName = String(item?.category_name ?? item?.category?.name ?? item?.category ?? '').toLowerCase();
        return (
          itemCatId === String(selectedCategory) ||
          (catName && itemCatName.includes(catName))
        );
      });
    }

    // Filter by Brand
    if (selectedBrand !== 'all') {
      const bQuery = String(selectedBrand).toLowerCase();
      list = list.filter((item) => {
        const itemBrand = String(item?.brand ?? item?.brand_name ?? '').toLowerCase();
        const itemName = String(item?.name ?? '').toLowerCase();
        return itemBrand.includes(bQuery) || itemName.includes(bQuery);
      });
    }

    const getItemPrice = (item) =>
      Number(item?.discount_price ?? item?.price ?? item?.originalPrice ?? item?.actual_price) || 0;

    // Filter by Price Range
    if (selectedPriceRange === 'under500') {
      list = list.filter((item) => {
        const p = getItemPrice(item);
        return p > 0 && p < 500;
      });
    } else if (selectedPriceRange === '500to1000') {
      list = list.filter((item) => {
        const p = getItemPrice(item);
        return p >= 500 && p <= 1000;
      });
    } else if (selectedPriceRange === 'above1000') {
      list = list.filter((item) => getItemPrice(item) > 1000);
    }

    // Sort by Price
    if (sortByPrice === 'lowToHigh') {
      list.sort((a, b) => getItemPrice(a) - getItemPrice(b));
    } else if (sortByPrice === 'highToLow') {
      list.sort((a, b) => getItemPrice(b) - getItemPrice(a));
    }

    setFilteredProducts(list);
    const active =
      selectedCategory !== 'all' ||
      selectedBrand !== 'all' ||
      selectedPriceRange !== 'all' ||
      sortByPrice !== 'none';
    setIsFilterActive(active);
    setFilterModalVisible(false);
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedPriceRange('all');
    setSortByPrice('none');
    setIsFilterActive(false);
    setFilteredProducts([]);
    setFilterModalVisible(false);
  };
  useFocusEffect(
    useCallback(() => {
      getWishlistIds();
      getCartItems();

      const onBackPress = () => {
        const now = Date.now();
        const canGoBack = Navigation?.canGoBack ? Navigation.canGoBack() : false;
        if (!canGoBack) {
          if (now - lastBackPressedRef.current < 2000) {
            BackHandler.exitApp();
            return true;
          }
          lastBackPressedRef.current = now;
          if (Platform.OS === 'android') {
            ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
          }
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        subscription.remove();
      };
    }, [Navigation])
  );

  const getSearchText = async (value) => {
    setSearchText(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim() === "") {
      setSearchProducts([]);
      return;
    }

    const query = value.toLowerCase().trim();
    const allPool = [
      ...(product || []),
      ...(dealOfTheDay || []),
      ...(latestproducts || []),
      ...(featuredproducts || []),
      ...(bestsellingProduct || []),
      ...(popularProduct || []),
    ];
    const filteredLocal = allPool.filter(
      (item, index, self) =>
        item?.name?.toLowerCase().includes(query) &&
        index === self.findIndex((t) => String(t.id) === String(item.id))
    );
    setSearchProducts(filteredLocal);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);

        const response = await fetch(`${BASE_URL}search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            keyword: value,
          }),
        });

        const result = await response.json();
        const apiResults = result.data || result.products || [];

        const mergedMap = new Map();
        [...filteredLocal, ...apiResults].forEach((item) => {
          if (item && item.id) {
            mergedMap.set(String(item.id), item);
          }
        });
        setSearchProducts(Array.from(mergedMap.values()));
      } catch (error) {
        console.log("Search Error:", error);
      } finally {
        setLoading(false);
      }
    }, 400);
  };
  const removeCart = async (id) => {
    const userId = await getuserId();

    // Optimistically remove from cart
    setCartQty(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    setCartItems(prev => prev.filter(ci => String(ci.product_id) !== String(id)));

    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("product_id", id);

    try {
      const response = await fetch(`${BASE_URL}cart-remove`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.status !== 200) {
        // Revert on error
        getCartItems();
      } else {
        getCartItems();
      }
    } catch (error) {
      console.log("Remove cart error:", error);
      getCartItems();
    }
  };
  const increaseQty = async (id) => {
    const qty = (cartQty[id] || 0) + 1;
    const userId = await getuserId();

    // Optimistically update
    setCartQty(prev => ({
      ...prev,
      [id]: qty,
    }));
    setCartItems(prev =>
      prev.map(ci => String(ci.product_id) === String(id) ? { ...ci, qty: qty } : ci)
    );

    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("product_id", id);
    formData.append("qty", qty);

    try {
      const response = await fetch(`${BASE_URL}cart-to-add`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.status !== 200) {
        // Revert
        setCartQty(prev => ({
          ...prev,
          [id]: qty - 1,
        }));
        setCartItems(prev =>
          prev.map(ci => String(ci.product_id) === String(id) ? { ...ci, qty: qty - 1 } : ci)
        );
      } else {
        getCartItems();
      }
    } catch (error) {
      console.log("Increase qty error:", error);
      setCartQty(prev => ({
        ...prev,
        [id]: qty - 1,
      }));
      setCartItems(prev =>
        prev.map(ci => String(ci.product_id) === String(id) ? { ...ci, qty: qty - 1 } : ci)
      );
    }
  };
  const decreaseQty = async (id) => {
    const qty = cartQty[id];

    if (qty <= 1) {
      await removeCart(id);
      return;
    }

    const newQty = qty - 1;
    const userId = await getuserId();

    // Optimistically update
    setCartQty(prev => ({
      ...prev,
      [id]: newQty,
    }));
    setCartItems(prev =>
      prev.map(ci => String(ci.product_id) === String(id) ? { ...ci, qty: newQty } : ci)
    );

    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("product_id", id);
    formData.append("qty", newQty);

    try {
      const response = await fetch(`${BASE_URL}cart-to-add`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.status !== 200) {
        // Revert
        setCartQty(prev => ({
          ...prev,
          [id]: qty,
        }));
        setCartItems(prev =>
          prev.map(ci => String(ci.product_id) === String(id) ? { ...ci, qty: qty } : ci)
        );
      } else {
        getCartItems();
      }
    } catch (error) {
      console.log("Decrease qty error:", error);
      setCartQty(prev => ({
        ...prev,
        [id]: qty,
      }));
      setCartItems(prev =>
        prev.map(ci => String(ci.product_id) === String(id) ? { ...ci, qty: qty } : ci)
      );
    }
  };
  const isItemWishlisted = (item) => {
    return wishlistIds.includes(String(item.id));
  };
  const isOutOfStock = (item) => {
    if (!item) return false;
    if (item.in_stock === false || item.in_stock === 0 || item.in_stock === 'false') return true;
    if (item.stock_quantity !== undefined && item.stock_quantity !== null && Number(item.stock_quantity) <= 0) return true;
    return false;
  };
  const getWishlistItems = async () => {
    const token = await getToken();
    const userId = await getuserId();

    if (!token || !userId) {
      setWishlistIds([]);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('user_id', userId);

      const response = await fetch(`${BASE_URL}wishlist-view`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      const items = data?.data || data?.products || data?.wishlist || [];
      const ids = items
        .map((entry) => entry?.product_id ?? entry?.id ?? entry?.product?.id)
        .filter(Boolean);

      setWishlistIds(ids);
    } catch (error) {
      console.log('Wishlist fetch error:', error);
    }
  };
  const updateCartQty = async (productId, qty) => {
    const userId = await getuserId();

    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("product_id", productId);
    formData.append("qty", qty);

    await fetch(`${BASE_URL}cart-to-add`, {
      method: "POST",
      body: formData,
    });
  };
  const toggleWishlist = async (item) => {
    const token = await getToken();
    const userId = await getuserId();

    if (!token || !userId) {
      Navigation.navigate('Login');
      return;
    }

    const productId = item?.id ?? item?.product_id;
    const isWishlisted = isItemWishlisted(item);
    const endpoint = isWishlisted ? 'wishlist-remove' : 'wishlist-add';

    // Optimistically update
    setWishlistIds((prev) =>
      isWishlisted
        ? prev.filter((id) => String(id) !== String(productId))
        : [...prev, String(productId)]
    );

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('product_id', productId);

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!(data?.status === 200 || data?.success)) {
        // Revert optimistic update on error
        setWishlistIds((prev) =>
          isWishlisted
            ? [...prev, String(productId)]
            : prev.filter((id) => String(id) !== String(productId))
        );
        Alert.alert('Error', data?.message || 'Wishlist action failed');
      }
    } catch (error) {
      console.log('Wishlist toggle error:', error);
      // Revert optimistic update on error
      setWishlistIds((prev) =>
        isWishlisted
          ? [...prev, String(productId)]
          : prev.filter((id) => String(id) !== String(productId))
      );
    }
  };
  // const gotoCart = async () => {
  //   const token = await getToken();

  //   // console.log(token);

  //   setId(token);

  //   if (!token || token === '') {
  //     Navigation.navigate('Login');
  //   } else {
  //     ToastAndroid.show(
  //       'Added to cart',
  //       ToastAndroid.SHORT,
  //     );

  //   }
  // };
  const getCatagory = async () => {
    try {
      const response = await fetch(`${BASE_URL}categories`, {
        method: 'GET',
      });

      const data = await response.json();

      if (data?.data) {
        setCategories([
          {
            id: 'all',
            name: 'All',
            image: null,
          },
          ...data.data,
        ]);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getBanners = async () => {
    setBannersLoading(true);
    try {
      const response = await fetch(`${BASE_URL}banners`, {
        method: 'GET',
      });
      const data = await response.json();

      if (data?.status === 200 && data?.data && data.data.length > 0) {
        setBanners(data.data);
      } else {
        await fetchLegacyBanners();
      }
    } catch (error) {
      console.error('Error fetching active banners, trying legacy fallback:', error);
      await fetchLegacyBanners();
    } finally {
      setBannersLoading(false);
    }
  };

  const fetchLegacyBanners = async () => {
    try {
      const response = await fetch(`${BASE_URL}banner`, {
        method: 'POST',
        body: new FormData(),
      });
      const data = await response.json();
      if (data?.data) {
        setBanners(data.data);
      }
    } catch (err) {
      console.error('Legacy fallback error:', err);
    }
  };

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        getCatagory(),
        getAllPrduct(catagoriesId, selectedSubCategoryId),
        getpopularPoduct(),
        getDealOfTheDay(),
        getlatestProduct(),
        getfeaturedProducts(),
        getbestsellingProducts(),
        getWishlistItems(),
        getCartItems(),
        getSubCategories(catagoriesId),
        getBanners(),
      ]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      try {
        await Promise.all([
          getCatagory(),
          getAllPrduct('all'),
          getpopularPoduct(),
          getDealOfTheDay(),
          getlatestProduct(),
          getfeaturedProducts(),
          getbestsellingProducts(),
          getWishlistItems(),
          getBanners(),
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gotoProductDetails = (item) => {
    Navigation.navigate('ProductDetails', {
      id: item.id,
    });
  };

  const getSubCategories = async (catId) => {
    if (!catId || catId === 'all') {
      setSubCategories([]);
      setSelectedSubCategoryId(null);
      return;
    }
    setSubCategoriesLoading(true);
    try {
      const formData = new FormData();
      formData.append('category_id', catId);

      const response = await fetch(`${BASE_URL}sub-category`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data?.status === 200 && data?.data) {
        setSubCategories(data.data);
      } else {
        setSubCategories([]);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubCategories([]);
    } finally {
      setSubCategoriesLoading(false);
    }
  };

  const handleSubCategoryClick = (subCatId) => {
    if (selectedSubCategoryId === subCatId) {
      setSelectedSubCategoryId(null);
      getAllPrduct(catagoriesId, null);
    } else {
      setSelectedSubCategoryId(subCatId);
      getAllPrduct(catagoriesId, subCatId);
    }
  };

  const getcategoriesProduct = (item) => {
    setCategoriesId(item.id);
    setSelectedSubCategoryId(null);
    setSlug(item.slug || '');
    getAllPrduct(item.id, null);
    getSubCategories(item.id);
    setSearchText('');
    setIsFilterActive(false);
  };

  const getAllPrduct = async (catId, subCatId) => {
    setProductLoading(true);
    const selectedCategoryId = catId !== undefined ? catId : catagoriesId;
    const selectedSubId = subCatId !== undefined ? subCatId : selectedSubCategoryId;

    const formData = new FormData();
    if (selectedCategoryId && selectedCategoryId !== 'all') {
      formData.append('category_id', selectedCategoryId);
    }
    if (selectedSubId) {
      formData.append('sub_category_id', selectedSubId);
    }
    formData.append("per_page", 12);
    formData.append("page", 1);
    try {
      const response = await fetch(`${BASE_URL}product`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data?.data) {
        setProduct(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setProductLoading(false);
    }
  };

  const getpopularPoduct = async () => {
    const userid = await getuserId()

    try {
      const response = await fetch(`${BASE_URL}popular-products`, {
        method: 'GET',

      });

      const data = await response.json();

      // console.log('data1', data.data[0])
      if (data.data) {

        setPopularProduct(data.data)
      };
    } catch (error) {
      console.log('Error:', error);
    }
  }
  const getlatestProduct = async () => {

    //    try {
    //   const response = await fetch(`${BASE_URL}latest-products`, {
    //     method: 'GET',

    //   });

    //   const data = await response.json();

    //  console.log('data1',data)
    //  if(data.data){ 

    //   setLatestproducts(data.data)
    // };
    // } catch (error) {
    //   console.log('Error:', error);
    // }
  }
  const getWishlistIds = async () => {
    const userId = await getuserId();

    if (!userId) return;

    const formData = new FormData();
    formData.append("user_id", userId);

    try {
      const response = await fetch(`${BASE_URL}wishlist-view`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      const ids = (data.data || []).map((item) =>
        String(item.id)
      );

      setWishlistIds(ids);
    } catch (e) {
      console.log(e);
    }
  };
  const getDealOfTheDay = async () => {
    try {
      const response = await fetch(`${BASE_URL}deal-of-the-day?limit=4`, {
        method: 'GET',

      });

      const data = await response.json();

      if (data.data) {
        // console.log(data.data[0], 'jljf')
        setDealOfTheDay(data.data)
      }
    } catch (error) {
      console.log('Error1:', error);
    }
  }
  const getfeaturedProducts = async () => {
    try {
      const response = await fetch(`${BASE_URL}featured-products`, {
        method: 'GET',

      });
      const datta = await getToken()
      const id = await getuserId()
      // console.log(datta)
      // console.log(id)
      const data = await response.json();

      if (data.data) {
        setFeaturedproducts(data.data)
      }
    } catch (error) {
      console.log('Error1:', error);
    }
  }
  const getbestsellingProducts = async () => {
    try {
      const response = await fetch(`${BASE_URL}featured-products`, {
        method: 'GET',

      });

      const data = await response.json();


      if (data.data) {

        setBestsellingProduct(data.data)
      }
    } catch (error) {
      console.log('Error1:', error);
    }
  }
  const getCartItems = async () => {
    const userId = await getuserId();
    if (!userId) {
      setCartItems([]);
      setCartQty({});
      return;
    }

    const formData = new FormData();
    formData.append("user_id", userId);

    try {
      const response = await fetch(`${BASE_URL}cart-view`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      console.log('Cart Items:', result);
      const itemsList = result.data || [];
      setCartItems(itemsList);

      let qtyObj = {};
      itemsList.forEach(item => {
        qtyObj[item.product_id] = Number(item.qty);
      });

      setCartQty(qtyObj);

    } catch (e) {
      console.log(e);
    }
  };
  const requestToCart = async (item) => {
    const id = item?.id ?? item?.product_id;
    if (!id) return;
    const userId = await getuserId();

    // Optimistically update quantity
    setCartQty(prev => ({
      ...prev,
      [id]: 1,
    }));

    // Optimistically update cart items preview
    setCartItems(prev => {
      const exists = prev.some(ci => String(ci.product_id) === String(id));
      if (exists) {
        return prev.map(ci => String(ci.product_id) === String(id) ? { ...ci, qty: 1 } : ci);
      } else {
        const newCartItem = {
          product_id: id,
          qty: 1,
          image: item.image || item.cat_image || '',
        };
        return [...prev, newCartItem];
      }
    });

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('product_id', id);
    formData.append('qty', 1);

    try {
      const response = await fetch(`${BASE_URL}cart-to-add`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('data', data);

      if (data.status != 200) {
        // Revert optimistic updates
        setCartQty(prev => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
        setCartItems(prev => prev.filter(ci => String(ci.product_id) !== String(id)));
        Alert.alert('Error', data.message || 'Something went wrong');
      } else {
        // Background sync
        getCartItems();
      }
    } catch (error) {
      console.log('Error:', error);
      // Revert optimistic updates
      setCartQty(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      setCartItems(prev => prev.filter(ci => String(ci.product_id) !== String(id)));
    }
  };
  const IsUser = async (item) => {
    const userId = await getToken()
    if (userId) {
      requestToCart(item)
    } else {
      Navigation.navigate('Login')
    }
  }
  const gotoViewAll = (title, products) => {
    Navigation.navigate("ViewAllProducts", {
      title,
      products,
      totalProducts: products.length,
    });
  };

  const renderBanners = () => {
    if (bannersLoading) {
      return (
        <View style={styles.bannerLoadingContainer}>
          <ActivityIndicator size="small" color={AllColors.primary} />
        </View>
      );
    }
    if (!banners || banners.length === 0) return null;

    return (
      <View style={styles.swiperContainer}>
        <Swiper
          autoplay
          autoplayTimeout={4}
          showsPagination={true}
          dotStyle={styles.swiperDot}
          activeDotStyle={styles.swiperActiveDot}
          paginationStyle={styles.swiperPagination}
          height={160}
        >
          {banners.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              style={styles.slide}
              onPress={() => {
                if (item.link) {
                  console.log('Banner pressed link:', item.link);
                }
              }}
            >
              <Image
                source={{ uri: item.image }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
              {(item.title || item.name) ? (
                <View style={styles.bannerTextContainer}>
                  <Text style={styles.bannerTitleText} numberOfLines={1}>
                    {item.title || item.name}
                  </Text>
                  {(item.desc || item.description) ? (
                    <Text style={styles.bannerDescText} numberOfLines={1}>
                      {item.desc || item.description}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </Swiper>
      </View>
    );
  };

  const renderSkeleton = () => {
    const categoriesPlaceholder = Array(5).fill(0);
    const productsPlaceholder = Array(4).fill(0);

    return (
      <View style={styles.skeletonContainer}>
        {/* Header Skeleton */}
        <View style={styles.skeletonHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Animated.View style={[styles.skeletonAvatar, { opacity: skeletonOpacity }]} />
            <View style={{ gap: 6 }}>
              <Animated.View style={[styles.skeletonTextLine, { width: 120, height: 16, opacity: skeletonOpacity }]} />
              <Animated.View style={[styles.skeletonTextLine, { width: 200, height: 12, opacity: skeletonOpacity }]} />
            </View>
          </View>
          <Animated.View style={[styles.skeletonBell, { opacity: skeletonOpacity }]} />
        </View>

        {/* Search Bar Skeleton */}
        <View style={styles.skeletonSearchContainer}>
          <Animated.View style={[styles.skeletonSearchBox, { opacity: skeletonOpacity }]} />
          <Animated.View style={[styles.skeletonFilterBtn, { opacity: skeletonOpacity }]} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Banner Skeleton */}
          <Animated.View style={[styles.skeletonBanner, { opacity: skeletonOpacity }]} />

          {/* Categories Skeleton */}
          <View style={styles.skeletonCategoryRow}>
            {categoriesPlaceholder.map((_, index) => (
              <Animated.View key={index} style={[styles.skeletonCategoryBadge, { opacity: skeletonOpacity }]} />
            ))}
          </View>

          {/* Section Header Skeleton */}
          <View style={styles.skeletonSectionHeader}>
            <Animated.View style={[styles.skeletonTextLine, { width: 150, height: 18, opacity: skeletonOpacity }]} />
            <Animated.View style={[styles.skeletonTextLine, { width: 60, height: 14, opacity: skeletonOpacity }]} />
          </View>

          {/* Products Grid Skeleton */}
          <View style={styles.skeletonGrid}>
            {productsPlaceholder.map((_, index) => (
              <View key={index} style={styles.skeletonCard}>
                <Animated.View style={[styles.skeletonCardImage, { opacity: skeletonOpacity }]} />
                <Animated.View style={[styles.skeletonTextLine, { width: '85%', height: 14, marginTop: 12, opacity: skeletonOpacity }]} />
                <Animated.View style={[styles.skeletonTextLine, { width: '60%', height: 12, marginTop: 8, opacity: skeletonOpacity }]} />
                <View style={styles.skeletonCardFooter}>
                  <Animated.View style={[styles.skeletonTextLine, { width: 50, height: 16, opacity: skeletonOpacity }]} />
                  <Animated.View style={[styles.skeletonAddBtn, { opacity: skeletonOpacity }]} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderHeader = () => {
    return (
      <>
        {/* HEADER */}
        <View style={styles.topHeader}>
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Image
                source={{
                  uri: 'https://www.vhv.rs/dpng/d/409-4090121_transparent-background-user-icon-hd-png-download.png',
                }}
                style={styles.logo}
              />
              <View>
                <Text style={styles.logoText}>Hello, Hittok 👋</Text>
                <Text style={styles.logoSubtext}>Find your favorite products at the best prices.</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.bellBtn}>
              <FontAwesome
                name="bell"
                color={AllColors.drakGray}
                size={18}
              />
            </TouchableOpacity>
          </View>

          {/* SEARCH */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <FontAwesome
                name="search"
                color={AllColors.primary}
                size={18}
              />
              <TextInput
                placeholder="Search your need"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={searchText}
                onChangeText={(value) => { getSearchText(value) }}
              />
            </View>
            <TouchableOpacity
              style={styles.filterBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => setFilterModalVisible(true)}>
              <Ionicons
                name="options-outline"
                color="#fff"
                size={22}
              />
              {isFilterActive ? <View style={styles.activeFilterDot} pointerEvents="none" /> : null}
            </TouchableOpacity>
          </View>
        </View>

        {/* BANNER SWIPER */}
        {renderBanners()}

        {/* CATEGORY */}
        <FlatList
          data={catagories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
          nestedScrollEnabled={true}
          directionalLockEnabled={true}
          bounces={false}
          scrollEventThrottle={16}
          renderItem={({ item }) => {
            const imgSrc = item?.image || item?.icon || item?.cat_image || item?.category_image;
            return (
              <TouchableOpacity
                onPress={() => getcategoriesProduct(item)}
                style={[
                  styles.categoryBtn,
                  catagoriesId === item.id && styles.activeCategory,
                ]}
              >
                {imgSrc ? (
                  <Image
                    source={{ uri: imgSrc }}
                    style={{
                      width: 20,
                      height: 20,
                      marginRight: 6,
                    }}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons
                    name={item.id === 'all' ? 'grid-outline' : 'pricetag-outline'}
                    size={16}
                    color={catagoriesId === item.id ? AllColors.primary : '#64748B'}
                    style={{ marginRight: 6 }}
                  />
                )}

                <Text
                  style={{
                    color: catagoriesId === item.id ? AllColors.primary : '#334155',
                    fontWeight: '600',
                    fontSize: 13,
                  }}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* SUB CATEGORY LIST */}
        {subCategoriesLoading ? (
          <ActivityIndicator size="small" color={AllColors.primary} style={{ marginVertical: 10 }} />
        ) : (
          subCategories && subCategories.length > 0 && (
            <View style={styles.subCategoryContainer}>
              <Text style={styles.subCategoryHeaderTitle}>Sub Categories</Text>
              <FlatList
                data={subCategories}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
                nestedScrollEnabled={true}
                directionalLockEnabled={true}
                bounces={false}
                renderItem={({ item }) => {
                  const isSelected = selectedSubCategoryId === item.id;
                  const subImgSrc = item?.image || item?.icon;
                  return (
                    <TouchableOpacity
                      onPress={() => handleSubCategoryClick(item.id)}
                      style={[
                        styles.subCategoryCard,
                        isSelected && styles.activeSubCategoryCard
                      ]}
                    >
                      <View style={styles.subCategoryImageContainer}>
                        {subImgSrc ? (
                          <Image
                            source={{ uri: subImgSrc }}
                            style={styles.subCategoryImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Ionicons
                            name="pricetag-outline"
                            size={20}
                            color={isSelected ? AllColors.primary : '#64748B'}
                          />
                        )}
                      </View>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.subCategoryText,
                          isSelected && styles.activeSubCategoryText
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )
        )}

        {productLoading ? (
          <ActivityIndicator size="large" color={AllColors.primary} style={{ marginVertical: 40 }} />
        ) : (
          <>
            {isFilterActive ? (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Filtered Products ({filteredProducts.length})</Text>
                <TouchableOpacity onPress={resetFilters}>
                  <Text style={styles.sectionViewAll}>Clear Filter</Text>
                </TouchableOpacity>
              </View>
            ) : searchText.trim() ? (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Search Results ({searchProducts.length})</Text>
                {loading && <ActivityIndicator size="small" color={AllColors.primary} />}
              </View>
            ) : (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>All Products</Text>
              </View>
            )}

            {((isFilterActive && filteredProducts.length === 0) || (searchText.trim() && searchProducts.length === 0 && !loading)) && (
              <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="search-outline" size={48} color="#94A3B8" />
                <Text style={{ marginTop: 12, color: '#64748B', fontSize: 15, fontWeight: '500', textAlign: 'center' }}>
                  {isFilterActive ? "No products match the selected filters" : `No products found for "${searchText}"`}
                </Text>
              </View>
            )}
          </>
        )}
      </>
    );
  };

  const renderProductCard = ({ item }) => {
    return (
      <TouchableOpacity style={styles.gridCard} onPress={() => gotoProductDetails(item)}>
        <View style={styles.cardImageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.dealImage}
          />
          <TouchableOpacity
            style={[
              styles.wishlistButton,
              isItemWishlisted(item) && styles.wishlistButtonActive,
            ]}
            onPress={() => toggleWishlist(item)}
          >
            <Ionicons
              name={isItemWishlisted(item) ? "heart" : "heart-outline"}
              size={18}
              color={isItemWishlisted(item) ? "#fff" : AllColors.primary}
            />
          </TouchableOpacity>
        </View>

        <Text numberOfLines={2} style={styles.productName}>
          {item.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{item.discount_price ?? item.price}</Text>
          {item.actual_price ? <Text style={styles.oldPrice}>₹{item.actual_price}</Text> : null}
        </View>

        <View style={styles.cardFooterRow}>
          <Text style={styles.offer}>
            16% OFF
          </Text>
          <View style={styles.actionContainer}>
            {isOutOfStock(item) ? (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>Out of Stock</Text>
              </View>
            ) : cartQty[item.id] ? (
              <View style={styles.qtyContainer}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => decreaseQty(item.id)}>
                  <Text style={styles.qtyText}>-</Text>
                </TouchableOpacity>

                <Text style={styles.qtyCount}>{cartQty[item.id]}</Text>

                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => increaseQty(item.id)}>
                  <Text style={styles.qtyPlusText}>+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => IsUser(item)}>
                <Ionicons
                  name="cart-outline"
                  size={18}
                  color="#fff"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (searchText.trim() || isFilterActive) return null;

    return (
      <>
        {/* DEAL OF THE DAY */}
        {dealOfTheDay && dealOfTheDay.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Deal of the Day</Text>
              <TouchableOpacity onPress={() => gotoViewAll('Deal Of The Day', dealOfTheDay)}>
                <Text style={styles.sectionViewAll}>View all</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={dealOfTheDay.slice(0, 5)}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.dealCard} onPress={() => gotoProductDetails(item)}>
                  <View style={styles.cardImageContainer}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.dealImage}
                    />
                    <TouchableOpacity
                      style={[
                        styles.wishlistButton,
                        isItemWishlisted(item) && styles.wishlistButtonActive,
                      ]}
                      onPress={() => toggleWishlist(item)}
                    >
                      <Ionicons
                        name={isItemWishlisted(item) ? "heart" : "heart-outline"}
                        size={16}
                        color={isItemWishlisted(item) ? "#fff" : AllColors.primary}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text numberOfLines={2} style={styles.productName}>
                    {item.name}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.price}>₹{item.originalPrice}</Text>
                    <Text style={styles.oldPrice}>₹{item.price}</Text>
                  </View>

                  <View style={styles.cardFooterRow}>
                    <Text style={styles.offer}>
                      {item.discount}% OFF
                    </Text>
                    <View style={styles.actionContainer}>
                      {isOutOfStock(item) ? (
                        <View style={styles.outOfStockBadge}>
                          <Text style={styles.outOfStockText}>Out of Stock</Text>
                        </View>
                      ) : cartQty[item.id] ? (
                        <View style={styles.qtyContainer}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => decreaseQty(item.id)}>
                            <Text style={styles.qtyText}>-</Text>
                          </TouchableOpacity>

                          <Text style={styles.qtyCount}>{cartQty[item.id]}</Text>

                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => increaseQty(item.id)}>
                            <Text style={styles.qtyPlusText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => IsUser(item)}>
                          <Ionicons
                            name="cart-outline"
                            size={16}
                            color="#fff"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        {/* POPULAR PRODUCTS */}
        {popularProduct && popularProduct.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Products</Text>
              <TouchableOpacity onPress={() => gotoViewAll('Popular Products', popularProduct)}>
                <Text style={styles.sectionViewAll}>View all</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={popularProduct.slice(0, 5)}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.dealCard} onPress={() => gotoProductDetails(item)}>
                  <View style={styles.cardImageContainer}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.dealImage}
                    />
                    <TouchableOpacity
                      style={[
                        styles.wishlistButton,
                        isItemWishlisted(item) && styles.wishlistButtonActive,
                      ]}
                      onPress={() => toggleWishlist(item)}
                    >
                      <Ionicons
                        name={isItemWishlisted(item) ? "heart" : "heart-outline"}
                        size={16}
                        color={isItemWishlisted(item) ? "#fff" : AllColors.primary}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text numberOfLines={2} style={styles.productName}>
                    {item.name}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.price}>₹{item.price}</Text>
                    <Text style={styles.oldPrice}>₹{item.originalPrice}</Text>
                  </View>

                  <View style={styles.cardFooterRow}>
                    <Text style={styles.offer}>
                      {item.discount}% OFF
                    </Text>
                    <View style={styles.actionContainer}>
                      {isOutOfStock(item) ? (
                        <View style={styles.outOfStockBadge}>
                          <Text style={styles.outOfStockText}>Out of Stock</Text>
                        </View>
                      ) : cartQty[item.id] ? (
                        <View style={styles.qtyContainer}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => decreaseQty(item.id)}>
                            <Text style={styles.qtyText}>-</Text>
                          </TouchableOpacity>

                          <Text style={styles.qtyCount}>{cartQty[item.id]}</Text>

                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => increaseQty(item.id)}>
                            <Text style={styles.qtyPlusText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => IsUser(item)}>
                          <Ionicons
                            name="cart-outline"
                            size={16}
                            color="#fff"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        {/* BEST SELLING PRODUCTS */}
        {bestsellingProduct && bestsellingProduct.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Best Selling Products</Text>
              <TouchableOpacity onPress={() => gotoViewAll('Best Selling Products', bestsellingProduct)}>
                <Text style={styles.sectionViewAll}>View all</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={bestsellingProduct.slice(0, 5)}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.dealCard} onPress={() => gotoProductDetails(item)}>
                  <View style={styles.cardImageContainer}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.dealImage}
                    />
                    <TouchableOpacity
                      style={[
                        styles.wishlistButton,
                        isItemWishlisted(item) && styles.wishlistButtonActive,
                      ]}
                      onPress={() => toggleWishlist(item)}
                    >
                      <Ionicons
                        name={isItemWishlisted(item) ? "heart" : "heart-outline"}
                        size={16}
                        color={isItemWishlisted(item) ? "#fff" : AllColors.primary}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text numberOfLines={2} style={styles.productName}>
                    {item.name}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.price}>₹{item.originalPrice}</Text>
                    <Text style={styles.oldPrice}>₹{item.price}</Text>
                  </View>

                  <View style={styles.cardFooterRow}>
                    <Text style={styles.offer}>
                      {item.discount}% OFF
                    </Text>
                    <View style={styles.actionContainer}>
                      {isOutOfStock(item) ? (
                        <View style={styles.outOfStockBadge}>
                          <Text style={styles.outOfStockText}>Out of Stock</Text>
                        </View>
                      ) : cartQty[item.id] ? (
                        <View style={styles.qtyContainer}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => decreaseQty(item.id)}>
                            <Text style={styles.qtyText}>-</Text>
                          </TouchableOpacity>

                          <Text style={styles.qtyCount}>{cartQty[item.id]}</Text>

                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => increaseQty(item.id)}>
                            <Text style={styles.qtyPlusText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => IsUser(item)}>
                          <Ionicons
                            name="cart-outline"
                            size={16}
                            color="#fff"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        {/* FEATURED PRODUCTS */}
        {featuredproducts && featuredproducts.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Products</Text>
              <TouchableOpacity onPress={() => gotoViewAll('Featured Products', featuredproducts)}>
                <Text style={styles.sectionViewAll}>View all</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={featuredproducts.slice(0, 5)}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.dealCard} onPress={() => gotoProductDetails(item)}>
                  <View style={styles.cardImageContainer}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.dealImage}
                    />
                    <TouchableOpacity
                      style={[
                        styles.wishlistButton,
                        isItemWishlisted(item) && styles.wishlistButtonActive,
                      ]}
                      onPress={() => toggleWishlist(item)}
                    >
                      <Ionicons
                        name={isItemWishlisted(item) ? "heart" : "heart-outline"}
                        size={16}
                        color={isItemWishlisted(item) ? "#fff" : AllColors.primary}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text numberOfLines={2} style={styles.productName}>
                    {item.name}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.price}>₹{item.originalPrice}</Text>
                    <Text style={styles.oldPrice}>₹{item.price}</Text>
                  </View>

                  <View style={styles.cardFooterRow}>
                    <Text style={styles.offer}>
                      {item.discount}% OFF
                    </Text>
                    <View style={styles.actionContainer}>
                      {isOutOfStock(item) ? (
                        <View style={styles.outOfStockBadge}>
                          <Text style={styles.outOfStockText}>Out of Stock</Text>
                        </View>
                      ) : cartQty[item.id] ? (
                        <View style={styles.qtyContainer}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => decreaseQty(item.id)}>
                            <Text style={styles.qtyText}>-</Text>
                          </TouchableOpacity>

                          <Text style={styles.qtyCount}>{cartQty[item.id]}</Text>

                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => increaseQty(item.id)}>
                            <Text style={styles.qtyPlusText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => IsUser(item)}>
                          <Ionicons
                            name="cart-outline"
                            size={16}
                            color="#fff"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        )}
      </>
    );
  };

  if (isInitialLoading) {
    return renderSkeleton();
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={isFilterActive ? filteredProducts : (searchText.trim() ? searchProducts : product)}
        numColumns={2}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: cartItems.length > 0 ? 100 : 20 }}
        columnWrapperStyle={{
          justifyContent: 'space-between',
          paddingHorizontal: 16,
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[AllColors.primary]}
            tintColor={AllColors.primary}
          />
        }
        ListHeaderComponent={renderHeader()}
        renderItem={renderProductCard}
        ListFooterComponent={renderFooter()}
      />

      {/* Floating Cart Bar (Blinkit-style) */}
      {cartItems.length > 0 && (
        <Animated.View
          style={[
            styles.floatingCartBar,
            {
              opacity: cartBarAnim,
              transform: [
                {
                  translateY: cartBarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.floatingCartBarInner}
            activeOpacity={0.9}
            onPress={() => Navigation.navigate('CartPage')}
          >
            <View style={styles.cartItemsPreview}>
              {cartItems.slice(0, 3).map((item, index) => (
                <Image
                  key={item.product_id || index}
                  source={{ uri: item.image }}
                  style={[
                    styles.miniCartImage,
                    { marginLeft: index > 0 ? -12 : 0, zIndex: 10 - index }
                  ]}
                />
              ))}
              {cartItems.length > 3 && (
                <View style={styles.miniCartMoreBadge}>
                  <Text style={styles.miniCartMoreText}>+{cartItems.length - 3}</Text>
                </View>
              )}
              <View style={styles.cartQuantityInfo}>
                <Text style={styles.cartQuantityText}>
                  {cartItems.reduce((sum, item) => sum + Number(item.qty), 0)} Item{cartItems.length > 1 ? 's' : ''} Added
                </Text>
              </View>
            </View>

            <View style={styles.viewCartButtonContainer}>
              <Text style={styles.viewCartText}>View Cart</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* FILTER MODAL */}
      <Modal
        visible={isFilterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Products</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Price Range Filter */}
              <Text style={styles.filterSectionLabel}>Price Range</Text>
              <View style={styles.chipRow}>
                {[
                  { label: 'All Prices', val: 'all' },
                  { label: 'Under ₹500', val: 'under500' },
                  { label: '₹500 - ₹1000', val: '500to1000' },
                  { label: 'Above ₹1000', val: 'above1000' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.val}
                    style={[styles.chip, selectedPriceRange === item.val && styles.activeChip]}
                    onPress={() => setSelectedPriceRange(item.val)}>
                    <Text style={[styles.chipText, selectedPriceRange === item.val && styles.activeChipText]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sort by Price */}
              <Text style={[styles.filterSectionLabel, { marginTop: 16 }]}>Sort by Price</Text>
              <View style={styles.chipRow}>
                {[
                  { label: 'Default', val: 'none' },
                  { label: 'Price: Low to High', val: 'lowToHigh' },
                  { label: 'Price: High to Low', val: 'highToLow' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.val}
                    style={[styles.chip, sortByPrice === item.val && styles.activeChip]}
                    onPress={() => setSortByPrice(item.val)}>
                    <Text style={[styles.chipText, sortByPrice === item.val && styles.activeChipText]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Brand Filter */}
              {availableBrands.length > 0 && (
                <>
                  <Text style={[styles.filterSectionLabel, { marginTop: 16 }]}>Brand</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    <TouchableOpacity
                      style={[styles.chip, selectedBrand === 'all' && styles.activeChip]}
                      onPress={() => setSelectedBrand('all')}>
                      <Text style={[styles.chipText, selectedBrand === 'all' && styles.activeChipText]}>All Brands</Text>
                    </TouchableOpacity>
                    {availableBrands.map((brand) => (
                      <TouchableOpacity
                        key={brand}
                        style={[styles.chip, selectedBrand === brand && styles.activeChip]}
                        onPress={() => setSelectedBrand(brand)}>
                        <Text style={[styles.chipText, selectedBrand === brand && styles.activeChipText]}>
                          {brand}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <LinearGradient
                  colors={[AllColors.primary, '#D8065B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.applyGradient}>
                  <Text style={styles.applyBtnText}>Apply Filter</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: AllColors.primary,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  logoSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  searchBox: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  input: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
    paddingVertical: 0,
    color: '#0F172A',
  },
  filterBtn: {
    width: 46,
    height: 46,
    backgroundColor: AllColors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    elevation: 2,
    shadowColor: AllColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 10,
  },
  activeFilterDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  categoryBtn: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  activeCategory: {
    backgroundColor: '#FFF1F7',
    borderColor: AllColors.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionViewAll: {
    fontSize: 13,
    fontWeight: '700',
    color: AllColors.primary,
  },
  dealCard: {
    width: 156,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginRight: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 8,
  },
  gridCard: {
    flex: 1,
    maxWidth: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: '1%',
    marginVertical: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardImageContainer: {
    width: '100%',
    height: 110,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  dealImage: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
  wishlistButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  wishlistButtonActive: {
    backgroundColor: AllColors.primary,
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 16,
    height: 32,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  oldPrice: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
    marginLeft: 4,
    fontSize: 10,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  offer: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 10,
  },
  actionContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AllColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 76,
    height: 32,
    borderWidth: 1.5,
    borderColor: AllColors.primary,
    borderRadius: 16,
    paddingHorizontal: 3,
  },
  qtyBtn: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 18,
    fontWeight: '900',
    color: AllColors.black,
    lineHeight: 20,
  },
  qtyPlusText: {
    fontSize: 15,
    fontWeight: '900',
    color: AllColors.black,
    lineHeight: 18,
  },
  qtyCount: {
    fontSize: 13,
    fontWeight: '900',
    color: AllColors.black,
    textAlign: 'center',
    minWidth: 14,
  },
  outOfStockBadge: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: '#E11D48',
    fontSize: 9,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  filterSectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
    marginBottom: 6,
  },
  activeChip: {
    backgroundColor: AllColors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  resetBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: AllColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: AllColors.primary,
  },
  applyBtn: {
    flex: 2,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
  },
  applyGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  floatingCartBar: {
    position: 'absolute',
    bottom: 20,
    left: 44,
    right: 44,
    backgroundColor: AllColors.primary,
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  cartItemsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniCartImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#F8FAFC',
  },
  miniCartMoreBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
    zIndex: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  miniCartMoreText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
  },
  cartQuantityInfo: {
    marginLeft: 12,
  },
  cartQuantityText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  viewCartButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewCartText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  floatingCartBarInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  subCategoryContainer: {
    marginVertical: 10,
  },
  subCategoryHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  subCategoryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: 80,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  activeSubCategoryCard: {
    borderColor: AllColors.primary,
    backgroundColor: '#FFF1F7',
  },
  subCategoryImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  subCategoryImage: {
    width: '100%',
    height: '100%',
  },
  subCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    width: '100%',
  },
  activeSubCategoryText: {
    color: AllColors.primary,
    fontWeight: '700',
  },
  swiperContainer: {
    marginTop: 16,
    marginHorizontal: 16,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  swiperDot: {
    backgroundColor: '#CBD5E1',
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  swiperActiveDot: {
    backgroundColor: AllColors.primary,
    width: 14,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  swiperPagination: {
    bottom: 8,
  },
  slide: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerLoadingContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  bannerTextContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: '80%',
  },
  bannerTitleText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  bannerDescText: {
    color: '#e2e8f0',
    fontSize: 11,
    marginTop: 2,
  },
  skeletonContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
  },
  skeletonTextLine: {
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  skeletonBell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  skeletonSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: 12,
  },
  skeletonSearchBox: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  skeletonFilterBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  skeletonBanner: {
    marginTop: 16,
    marginHorizontal: 16,
    height: 160,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  skeletonCategoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  skeletonCategoryBadge: {
    width: 70,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  skeletonSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  skeletonCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  skeletonCardImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  skeletonCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  skeletonAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },
});