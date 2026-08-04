import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useTheme } from '../../Context/ThemeContext';

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
  DeviceEventEmitter,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleNotificationRouting } from '../../Services/NotificationService';

import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AllColors from '../../Constants/Color';

import CommonLoginModal from '../../Common/Login';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BASE_URL, getToken, getuserId, } from '../../Api/Api';
import Swiper from 'react-native-swiper';

// import Feather from 'react-native-vector-icons/Feather'
const { width } = Dimensions.get('window');
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchCamera } from 'react-native-image-picker';

const DEFAULT_DUMMY_SUB_CATEGORIES = [
  { id: 'sub_d1', name: 'Smartphones', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80' },
  { id: 'sub_d2', name: 'Men Fashion', image: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=300&auto=format&fit=crop&q=80' },
  { id: 'sub_d3', name: 'Women Fashion', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&auto=format&fit=crop&q=80' },
  { id: 'sub_d4', name: 'Fresh Fruits', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&auto=format&fit=crop&q=80' },
  { id: 'sub_d5', name: 'Footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80' },
  { id: 'sub_d6', name: 'Beauty Care', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&auto=format&fit=crop&q=80' },
  { id: 'sub_d7', name: 'Home Essentials', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300&auto=format&fit=crop&q=80' },
  { id: 'sub_d8', name: 'Gadgets', image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&auto=format&fit=crop&q=80' },
  { id: 'sub_d9', name: 'Watches', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80' },
  { id: 'sub_d10', name: 'Fitness', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&auto=format&fit=crop&q=80' },
];
const DEFAULT_SUB_CAT_IMAGE = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300';

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif_1',
    title: 'Special Offer! 🎉',
    body: 'Get 20% off on your next purchase at DeeBazer! Use code DEE20.',
    time: '5m ago',
    isRead: false,
    type: 'promo',
    data: { screen: 'ProductsDashboard' },
  },
  {
    id: 'notif_2',
    title: 'Order Shipped 🚚',
    body: 'Your order #DB-84920 has been shipped and is on its way.',
    time: '2h ago',
    isRead: false,
    type: 'order',
    data: { order_id: '84920' },
  },
  {
    id: 'notif_3',
    title: 'Items in Cart 🛒',
    body: 'You have items saved in your cart. Complete purchase now!',
    time: '1d ago',
    isRead: true,
    type: 'cart',
    data: { type: 'cart' },
  },
];

const formatSubCategoryImageUri = (item) => {
  if (!item) return DEFAULT_SUB_CAT_IMAGE;
  let raw =
    item?.image ||
    item?.sub_category_image ||
    item?.subcategory_image ||
    item?.sub_cat_image ||
    item?.icon ||
    item?.cat_image ||
    item?.category_image ||
    item?.img ||
    item?.photo ||
    item?.thumbnail;

  if (!raw || typeof raw !== 'string') return DEFAULT_SUB_CAT_IMAGE;
  raw = raw.trim();
  if (!raw) return DEFAULT_SUB_CAT_IMAGE;

  if (raw.startsWith('http://deebazar.com')) {
    raw = raw.replace('http://deebazar.com', 'https://deebazar.com');
  }

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }

  const cleanPath = raw.startsWith('/') ? raw.slice(1) : raw;
  return `https://deebazar.com/admin/${cleanPath}`;
};

const SubCategoryCardItem = ({ item, isSelected, onPress }) => {
  const { theme, isDarkMode } = useTheme();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [item]);

  const rawUri = formatSubCategoryImageUri(item);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.subCategoryItemContainer}
    >
      <View
        style={[
          styles.subCategoryWrapper,
          isSelected && styles.activeSubCategoryWrapper,
        ]}
      >
        <View style={[styles.subCategoryCard, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
          <Ionicons
            name="cube-outline"
            size={28}
            color={isSelected ? AllColors.primary : (isDarkMode ? '#94A3B8' : '#64748B')}
          />
          {rawUri && !imgError && (
            <Image
              source={{ uri: rawUri }}
              style={styles.subCategoryImage}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          )}
        </View>
      </View>
      {item?.name ? (
        <Text style={[styles.subCategoryItemText, { color: isSelected ? AllColors.primary : theme.textSecondary }]} numberOfLines={1}>
          {item.name}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

export default function DashBoard() {
  const Navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();

  const [id, setId] = useState('')
  const [open, setOpen] = useState(false)
  const [catagories, setCategories] = useState([])
  const [slug, setSlug] = useState('')
  const [catagoriesId, setCategoriesId] = useState('all')
  const [product, setProduct] = useState([])
  const [subCategories, setSubCategories] = useState(DEFAULT_DUMMY_SUB_CATEGORIES)
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null)

  const handleVoiceSearch = () => {
    Alert.alert("Voice Search", "Voice search feature coming soon!");
    // Requires a native module like @react-native-voice/voice for actual implementation
  };

  const handleCameraSearch = () => {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          Alert.alert('Error', response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          const imageUri = response.assets[0].uri;
          // Handle the image for visual search here
          Alert.alert("Image Search", "Image captured! Visual search API integration coming soon.");
        }
      }
    );
  };

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
  const [userName, setUserName] = useState('User');
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

  // Foreground Notification Animation & Notification Drawer History State
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeNotification, setActiveNotification] = useState(null);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const drawerAnim = useRef(new Animated.Value(0)).current;
  const bannerTimerRef = useRef(null);

  const updateNotificationsState = useCallback((newList) => {
    setNotifications(newList);
    const unread = newList.filter(n => !n.isRead).length;
    setUnreadCount(unread);
    AsyncStorage.setItem('NOTIFICATION_HISTORY', JSON.stringify(newList)).catch(() => {});
    AsyncStorage.setItem('NOTIFICATION_UNREAD_COUNT', String(unread)).catch(() => {});
  }, []);

  const openNotificationDrawer = useCallback(() => {
    setIsDrawerOpen(true);
    drawerAnim.setValue(0);
    Animated.timing(drawerAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto mark all notifications as read when drawer is opened
    setNotifications(prev => {
      const allRead = prev.map(n => ({ ...n, isRead: true }));
      AsyncStorage.setItem('NOTIFICATION_HISTORY', JSON.stringify(allRead)).catch(() => {});
      return allRead;
    });
    setUnreadCount(0);
    AsyncStorage.setItem('NOTIFICATION_UNREAD_COUNT', '0').catch(() => {});
  }, [drawerAnim]);

  const closeNotificationDrawer = useCallback(() => {
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsDrawerOpen(false);
    });
  }, [drawerAnim]);

  const triggerNotificationBanner = useCallback((title, body, data = {}) => {
    setActiveNotification({ title, body, data });
    setIsBannerVisible(true);

    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
    }

    bannerAnim.setValue(0);
    Animated.spring(bannerAnim, {
      toValue: 1,
      tension: 40,
      friction: 7,
      useNativeDriver: true,
    }).start();

    bannerTimerRef.current = setTimeout(() => {
      dismissNotificationBanner();
    }, 4500);
  }, [bannerAnim]);

  const dismissNotificationBanner = useCallback(() => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
    }
    Animated.timing(bannerAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      setIsBannerVisible(false);
      setActiveNotification(null);
    });
  }, [bannerAnim]);

  const handleBellPress = () => {
    openNotificationDrawer();
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    updateNotificationsState(updated);
  };

  const handleClearAll = () => {
    updateNotificationsState([]);
  };

  const handleDeleteNotification = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    updateNotificationsState(updated);
  };

  const handleNotificationClick = (item) => {
    const updated = notifications.map(n => n.id === item.id ? { ...n, isRead: true } : n);
    updateNotificationsState(updated);
    closeNotificationDrawer();
    if (item.data) {
      handleNotificationRouting(item);
    }
  };

  useEffect(() => {
    AsyncStorage.getItem('NOTIFICATION_HISTORY')
      .then(val => {
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setNotifications(parsed);
              const unread = parsed.filter(n => !n.isRead).length;
              setUnreadCount(unread);
            } else {
              const unread = DEFAULT_NOTIFICATIONS.filter(n => !n.isRead).length;
              setUnreadCount(unread);
            }
          } catch (e) {}
        } else {
          const unread = DEFAULT_NOTIFICATIONS.filter(n => !n.isRead).length;
          setUnreadCount(unread);
        }
      })
      .catch(() => {});

    const notificationSub = DeviceEventEmitter.addListener(
      'SHOW_FOREGROUND_NOTIFICATION',
      remoteMessage => {
        const title =
          remoteMessage?.notification?.title ||
          remoteMessage?.title ||
          'New Notification';
        const body =
          remoteMessage?.notification?.body ||
          remoteMessage?.body ||
          'You have a new notification!';

        const newNotif = {
          id: 'notif_' + Date.now(),
          title,
          body,
          time: 'Just now',
          isRead: false,
          type: remoteMessage?.data?.type || 'promo',
          data: remoteMessage?.data || {},
        };

        setNotifications(prev => {
          const updated = [newNotif, ...prev];
          const unread = updated.filter(n => !n.isRead).length;
          setUnreadCount(unread);
          AsyncStorage.setItem('NOTIFICATION_HISTORY', JSON.stringify(updated)).catch(() => {});
          AsyncStorage.setItem('NOTIFICATION_UNREAD_COUNT', String(unread)).catch(() => {});
          return updated;
        });

        triggerNotificationBanner(title, body, remoteMessage?.data || {});
      },
    );

    return () => {
      notificationSub.remove();
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, [triggerNotificationBanner]);

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
  const getQtyForItem = (item) => {
    if (!item) return 0;
    const id = item?.id ?? item?.product_id;
    return cartQty[id] || cartQty[String(id)] || cartQty[Number(id)] || 0;
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

  const getUserProfile = async () => {
    const token = await getToken();
    if (token) {
      try {
        const response = await fetch(`${BASE_URL}me`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.status === 200 && data.user) {
          setUserName(data.user.name || 'User');
        } else {
          setUserName('Guest');
        }
      } catch (error) {
        console.log('Profile fetch error:', error);
        setUserName('Guest');
      }
    } else {
      setUserName('Guest');
    }
  };

  useFocusEffect(
    useCallback(() => {
      getUserProfile();
    }, [])
  );

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
          getSubCategories('all'),
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

  const gotoEditProfile = async () => {
    const token = await getToken();
    if (token) {
      try {
        const parent = Navigation.getParent ? Navigation.getParent() : null;
        if (parent && parent.navigate) {
          parent.navigate('editProfile');
        } else {
          Navigation.navigate('editProfile');
        }
      } catch (e) {
        Navigation.navigate('editProfile');
      }
    } else {
      Navigation.navigate('Login');
    }
  };

  const getSubCategories = async (catId) => {
    if (!catId || catId === 'all') {
      setSubCategories(DEFAULT_DUMMY_SUB_CATEGORIES);
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
      const list = data?.data || data?.subcategories || data?.sub_categories || (Array.isArray(data) ? data : null);
      if ((data?.status == 200 || data?.status === 'success') && list && list.length > 0) {
        setSubCategories(list);
      } else if (list && list.length > 0) {
        setSubCategories(list);
      } else {
        setSubCategories(DEFAULT_DUMMY_SUB_CATEGORIES);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubCategories(DEFAULT_DUMMY_SUB_CATEGORIES);
    } finally {
      setSubCategoriesLoading(false);
    }
  };

  const handleSubCategoryClick = (subCatId) => {
    if (selectedSubCategoryId === subCatId) {
      setSelectedSubCategoryId(null);
      setIsFilterActive(false);
      setFilteredProducts([]);
      getAllPrduct(catagoriesId, null);
    } else {
      setSelectedSubCategoryId(subCatId);
      if (String(subCatId).startsWith('sub_d')) {
        const subItem = subCategories.find((s) => String(s.id) === String(subCatId));
        if (subItem) {
          const subName = subItem.name.toLowerCase();
          const allPool = [
            ...(product || []),
            ...(dealOfTheDay || []),
            ...(latestproducts || []),
            ...(featuredproducts || []),
            ...(bestsellingProduct || []),
            ...(popularProduct || []),
          ];
          const matches = allPool.filter(
            (p, index, self) =>
              (p.name?.toLowerCase().includes(subName) ||
                p.short_desc02?.toLowerCase().includes(subName) ||
                p.category_name?.toLowerCase().includes(subName)) &&
              index === self.findIndex((t) => String(t.id) === String(p.id))
          );
          if (matches.length > 0) {
            setFilteredProducts(matches);
            setIsFilterActive(true);
          } else {
            setIsFilterActive(false);
            getAllPrduct(catagoriesId, null);
          }
        }
      } else {
        getAllPrduct(catagoriesId, subCatId);
      }
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
      // console.log(e);
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
      // console.log('Cart Items:', result);
      const itemsList = result.data || [];
      setCartItems(itemsList);

      let qtyObj = {};
      itemsList.forEach(item => {
        qtyObj[item.product_id] = Number(item.qty);
      });

      setCartQty(qtyObj);

    } catch (e) {
      // console.log(e);
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
      // console.log('data', data);

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
                  // console.log('Banner pressed link:', item.link);
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
      <View style={[styles.skeletonContainer, { backgroundColor: theme.bg }]}>
        {/* Header Skeleton */}
        <View style={[styles.skeletonHeader, { backgroundColor: theme.cardBg }]}>
          <View style={styles.flexRowGap12}>
            <Animated.View style={[styles.skeletonAvatar, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', opacity: skeletonOpacity }]} />
            <View style={styles.gap6}>
              <Animated.View style={[styles.skeletonTextLine, { width: 120, height: 16, backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', opacity: skeletonOpacity }]} />
              <Animated.View style={[styles.skeletonTextLine, { width: 200, height: 12, backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', opacity: skeletonOpacity }]} />
            </View>
          </View>
          <Animated.View style={[styles.skeletonBell, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', opacity: skeletonOpacity }]} />
        </View>

        {/* Search Bar Skeleton */}
        <View style={[styles.skeletonSearchContainer, { backgroundColor: theme.cardBg }]}>
          <Animated.View style={[styles.skeletonSearchBox, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', opacity: skeletonOpacity }]} />
          <Animated.View style={[styles.skeletonFilterBtn, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', opacity: skeletonOpacity }]} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Banner Skeleton */}
          <Animated.View style={[styles.skeletonBanner, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', opacity: skeletonOpacity }]} />

          {/* Categories Skeleton */}
          <View style={styles.skeletonCategoryRow}>
            {categoriesPlaceholder.map((_, index) => (
              <Animated.View key={index} style={[styles.skeletonCategoryBadge, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', opacity: skeletonOpacity }]} />
            ))}
          </View>

          {/* Section Header Skeleton */}
          <View style={styles.skeletonSectionHeader}>
            <Animated.View style={[styles.skeletonTextLine, { width: 150, height: 18, backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', opacity: skeletonOpacity }]} />
            <Animated.View style={[styles.skeletonTextLine, { width: 60, height: 14, backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', opacity: skeletonOpacity }]} />
          </View>

          {/* Products Grid Skeleton */}
          <View style={styles.skeletonGrid}>
            {productsPlaceholder.map((_, index) => (
              <View key={index} style={[styles.skeletonCard, { backgroundColor: theme.cardBg }]}>
                <Animated.View style={[styles.skeletonCardImage, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', opacity: skeletonOpacity }]} />
                <Animated.View style={[styles.skeletonTextLine, { width: '85%', height: 14, marginTop: 12, backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', opacity: skeletonOpacity }]} />
                <Animated.View style={[styles.skeletonTextLine, { width: '60%', height: 12, marginTop: 8, backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', opacity: skeletonOpacity }]} />
                <View style={styles.skeletonCardFooter}>
                  <Animated.View style={[styles.skeletonTextLine, { width: 50, height: 16, backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', opacity: skeletonOpacity }]} />
                  <Animated.View style={[styles.skeletonAddBtn, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', opacity: skeletonOpacity }]} />
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
        <View style={[styles.topHeader, { backgroundColor: theme.cardBg }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={gotoEditProfile}
              style={styles.flexRowGap12}
            >
              <Image
                source={{
                  uri: 'https://www.vhv.rs/dpng/d/409-4090121_transparent-background-user-icon-hd-png-download.png',
                }}
                style={styles.logo}
              />
              <View>
                <Text style={[styles.logoText, { color: theme.textPrimary }]}>Hello, {userName} 👋</Text>
                <Text style={[styles.logoSubtext, { color: theme.textSecondary }]}>Find your favorite products at the best prices.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bellBtn, { backgroundColor: isDarkMode ? '#334155' : AllColors.divider }]}
              activeOpacity={0.7}
              onPress={handleBellPress}
            >
              <FontAwesome
                name="bell"
                color={isDarkMode ? '#F8FAFC' : AllColors.drakGray}
                size={18}
              />
              {unreadCount > 0 && (
                <View style={styles.notificationBadgeContainer}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* FOREGROUND NOTIFICATION CONTAINER */}
          {isBannerVisible && activeNotification && (
            <Animated.View
              style={[
                styles.notificationBannerContainer,
                {
                  backgroundColor: theme.cardBg,
                  borderColor: AllColors.primary,
                  opacity: bannerAnim.interpolate({
                    inputRange: [0, 0.2, 1],
                    outputRange: [0, 1, 1],
                  }),
                  transform: [
                    {
                      translateX: bannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [40, 0],
                      }),
                    },
                    {
                      scale: bannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.85, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.bannerInnerContent}
                onPress={() => {
                  dismissNotificationBanner();
                  if (activeNotification?.data) {
                    handleNotificationRouting(activeNotification);
                  }
                }}
              >
                <View style={styles.bannerIconCircle}>
                  <FontAwesome name="bell" color="#FFFFFF" size={14} />
                </View>
                <View style={styles.bannerTextColumn}>
                  <Text numberOfLines={1} style={[styles.bannerTitleText, { color: theme.textPrimary }]}>
                    {activeNotification.title}
                  </Text>
                  <Text numberOfLines={1} style={[styles.bannerBodyText, { color: theme.textSecondary }]}>
                    {activeNotification.body}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* SEARCH */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchBox, { backgroundColor: theme.searchBg }]}>
              <FontAwesome
                name="search"
                color={AllColors.primary}
                size={18}
              />
              <TextInput
                placeholder="Search your need"
                placeholderTextColor={isDarkMode ? '#94A3B8' : '#94A3B8'}
                style={[styles.input, { flex: 1, color: theme.textPrimary }]}
                value={searchText}
                onChangeText={(value) => { getSearchText(value) }}
              />
              <TouchableOpacity
                style={styles.searchIconButton}
                onPress={handleVoiceSearch}
              >
                <Ionicons name="mic" color={AllColors.primary} size={20} />
              </TouchableOpacity>
              <View style={[styles.verticalDivider, { backgroundColor: isDarkMode ? '#475569' : '#E2E8F0' }]} />
              <TouchableOpacity
                style={styles.searchIconButton}
                onPress={handleCameraSearch}
              >
                <Ionicons name="camera" color={AllColors.primary} size={20} />
              </TouchableOpacity>
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
          extraData={catagoriesId}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
          nestedScrollEnabled={true}
          directionalLockEnabled={true}
          bounces={false}
          scrollEventThrottle={16}
          renderItem={({ item }) => {
            const isSelected = String(catagoriesId) === String(item.id);
            const imgSrc = item?.image || item?.icon || item?.cat_image || item?.category_image;
            return (
              <TouchableOpacity
                onPress={() => getcategoriesProduct(item)}
                style={[
                  styles.categoryBtn,
                  {
                    backgroundColor: isDarkMode
                      ? (isSelected ? 'rgba(247, 22, 112, 0.25)' : theme.cardBg)
                      : (isSelected ? AllColors.softPinkBg : AllColors.white),
                    borderColor: isDarkMode
                      ? (isSelected ? AllColors.primary : '#334155')
                      : (isSelected ? AllColors.primary : AllColors.divider),
                  },
                ]}
              >
                {imgSrc ? (
                  <Image
                    source={{ uri: imgSrc }}
                    style={styles.catImageStyle}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons
                    name={item.id === 'all' ? 'grid-outline' : 'pricetag-outline'}
                    size={16}
                    color={isSelected ? AllColors.primary : (isDarkMode ? '#CBD5E1' : '#64748B')}
                    style={styles.catIconMargin}
                  />
                )}

                <Text
                  style={[
                    styles.catNameText,
                    isSelected
                      ? styles.catNameSelected
                      : { color: theme.textPrimary, fontWeight: '600' },
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* SUB CATEGORY LIST */}
        {subCategoriesLoading ? (
          <ActivityIndicator size="small" color={AllColors.primary} style={styles.subCatLoader} />
        ) : (
          subCategories && subCategories.length > 0 && (
            <View style={styles.subCategoryContainer}>
              <Text style={[styles.subCategoryHeaderTitle, { color: theme.textPrimary }]}>Sub Categories</Text>
              <FlatList
                data={subCategories}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id.toString()}
                extraData={selectedSubCategoryId}
                contentContainerStyle={styles.subCatContentContainer}
                nestedScrollEnabled={true}
                directionalLockEnabled={true}
                bounces={false}
                renderItem={({ item }) => (
                  <SubCategoryCardItem
                    item={item}
                    isSelected={String(selectedSubCategoryId) === String(item.id)}
                    onPress={() => handleSubCategoryClick(item.id)}
                  />
                )}
              />
            </View>
          )
        )}

        {productLoading ? (
          <ActivityIndicator size="large" color={AllColors.primary} style={styles.productLoader} />
        ) : (
          <>
            {isFilterActive ? (
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Filtered Products ({filteredProducts.length})</Text>
                <TouchableOpacity onPress={resetFilters}>
                  <Text style={styles.sectionViewAll}>Clear Filter</Text>
                </TouchableOpacity>
              </View>
            ) : searchText.trim() ? (
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Search Results ({searchProducts.length})</Text>
                {loading && <ActivityIndicator size="small" color={AllColors.primary} />}
              </View>
            ) : (
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>All Products</Text>
              </View>
            )}

            {((isFilterActive && filteredProducts.length === 0) || (searchText.trim() && searchProducts.length === 0 && !loading)) && (
              <View style={styles.emptySearchContainer}>
                <Ionicons name="search-outline" size={48} color={isDarkMode ? '#64748B' : '#94A3B8'} />
                <Text style={[styles.emptySearchText, { color: theme.textSecondary }]}>
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
      <TouchableOpacity
        style={[styles.gridCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}
        onPress={() => gotoProductDetails(item)}
      >
        <View style={[styles.cardImageContainer, { backgroundColor: isDarkMode ? '#0F172A' : AllColors.screenBg }]}>
          <Image
            source={{ uri: item.image }}
            style={styles.dealImage}
          />
          <TouchableOpacity
            style={[
              styles.wishlistButton,
              {
                backgroundColor: isDarkMode
                  ? (isItemWishlisted(item) ? AllColors.primary : 'rgba(30, 41, 59, 0.9)')
                  : (isItemWishlisted(item) ? AllColors.primary : 'rgba(255, 255, 255, 0.9)'),
              },
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

        <Text numberOfLines={2} style={[styles.productName, { color: theme.textPrimary }]}>
          {item.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: theme.textPrimary }]}>₹{item.discount_price ?? item.price}</Text>
          {item.actual_price ? <Text style={[styles.oldPrice, { color: theme.textSecondary }]}>₹{item.actual_price}</Text> : null}
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
            ) : getQtyForItem(item) > 0 ? (
              <View style={[styles.qtyContainer, { backgroundColor: isDarkMode ? '#0F172A' : undefined }]}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => decreaseQty(item.id ?? item.product_id)}>
                  <Text style={[styles.qtyText, { color: theme.textPrimary }]}>-</Text>
                </TouchableOpacity>

                <Text style={[styles.qtyCount, { color: theme.textPrimary }]}>{getQtyForItem(item)}</Text>

                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => increaseQty(item.id ?? item.product_id)}>
                  <Text style={[styles.qtyPlusText, { color: theme.textPrimary }]}>+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: isDarkMode ? 'rgba(247, 22, 112, 0.15)' : AllColors.softPinkBg }]}
                onPress={() => IsUser(item)}>
                <Ionicons
                  name="cart"
                  size={22}
                  color={AllColors.primary}
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
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Deal of the Day</Text>
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
                <TouchableOpacity style={[styles.dealCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]} onPress={() => gotoProductDetails(item)}>
                  <View style={[styles.cardImageContainer, { backgroundColor: isDarkMode ? '#0F172A' : AllColors.screenBg }]}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.dealImage}
                    />
                    <TouchableOpacity
                      style={[
                        styles.wishlistButton,
                        {
                          backgroundColor: isDarkMode
                            ? (isItemWishlisted(item) ? AllColors.primary : 'rgba(30, 41, 59, 0.9)')
                            : (isItemWishlisted(item) ? AllColors.primary : 'rgba(255, 255, 255, 0.9)'),
                        },
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

                  <Text numberOfLines={2} style={[styles.productName, { color: theme.textPrimary }]}>
                    {item.name}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={[styles.price, { color: theme.textPrimary }]}>₹{item.originalPrice}</Text>
                    <Text style={[styles.oldPrice, { color: theme.textSecondary }]}>₹{item.price}</Text>
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
                        <View style={[styles.qtyContainer, { backgroundColor: isDarkMode ? '#0F172A' : undefined }]}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => decreaseQty(item.id)}>
                            <Text style={[styles.qtyText, { color: theme.textPrimary }]}>-</Text>
                          </TouchableOpacity>

                          <Text style={[styles.qtyCount, { color: theme.textPrimary }]}>{cartQty[item.id]}</Text>

                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => increaseQty(item.id)}>
                            <Text style={[styles.qtyPlusText, { color: theme.textPrimary }]}>+</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.iconButton, { backgroundColor: isDarkMode ? 'rgba(247, 22, 112, 0.15)' : AllColors.softPinkBg }]}
                          onPress={() => IsUser(item)}>
                          <Ionicons
                            name="cart"
                            size={20}
                            color={AllColors.primary}
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
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Popular Products</Text>
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
                <TouchableOpacity style={[styles.dealCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]} onPress={() => gotoProductDetails(item)}>
                  <View style={[styles.cardImageContainer, { backgroundColor: isDarkMode ? '#0F172A' : AllColors.screenBg }]}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.dealImage}
                    />
                    <TouchableOpacity
                      style={[
                        styles.wishlistButton,
                        {
                          backgroundColor: isDarkMode
                            ? (isItemWishlisted(item) ? AllColors.primary : 'rgba(30, 41, 59, 0.9)')
                            : (isItemWishlisted(item) ? AllColors.primary : 'rgba(255, 255, 255, 0.9)'),
                        },
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

                  <Text numberOfLines={2} style={[styles.productName, { color: theme.textPrimary }]}>
                    {item.name}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={[styles.price, { color: theme.textPrimary }]}>₹{item.price}</Text>
                    <Text style={[styles.oldPrice, { color: theme.textSecondary }]}>₹{item.originalPrice}</Text>
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
                      ) : getQtyForItem(item) > 0 ? (
                        <View style={[styles.qtyContainer, { backgroundColor: isDarkMode ? '#0F172A' : undefined }]}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => decreaseQty(item.id ?? item.product_id)}>
                            <Text style={[styles.qtyText, { color: theme.textPrimary }]}>-</Text>
                          </TouchableOpacity>

                          <Text style={[styles.qtyCount, { color: theme.textPrimary }]}>{getQtyForItem(item)}</Text>

                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => increaseQty(item.id ?? item.product_id)}>
                            <Text style={[styles.qtyPlusText, { color: theme.textPrimary }]}>+</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.iconButton, { backgroundColor: isDarkMode ? 'rgba(247, 22, 112, 0.15)' : AllColors.softPinkBg }]}
                          onPress={() => IsUser(item)}>
                          <Ionicons
                            name="cart"
                            size={20}
                            color={AllColors.primary}
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
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Best Selling Products</Text>
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
                <TouchableOpacity style={[styles.dealCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]} onPress={() => gotoProductDetails(item)}>
                  <View style={[styles.cardImageContainer, { backgroundColor: isDarkMode ? '#0F172A' : AllColors.screenBg }]}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.dealImage}
                    />
                    <TouchableOpacity
                      style={[
                        styles.wishlistButton,
                        {
                          backgroundColor: isDarkMode
                            ? (isItemWishlisted(item) ? AllColors.primary : 'rgba(30, 41, 59, 0.9)')
                            : (isItemWishlisted(item) ? AllColors.primary : 'rgba(255, 255, 255, 0.9)'),
                        },
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

                  <Text numberOfLines={2} style={[styles.productName, { color: theme.textPrimary }]}>
                    {item.name}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={[styles.price, { color: theme.textPrimary }]}>₹{item.originalPrice}</Text>
                    <Text style={[styles.oldPrice, { color: theme.textSecondary }]}>₹{item.price}</Text>
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
                      ) : getQtyForItem(item) > 0 ? (
                        <View style={[styles.qtyContainer, { backgroundColor: isDarkMode ? '#0F172A' : undefined }]}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => decreaseQty(item.id ?? item.product_id)}>
                            <Text style={[styles.qtyText, { color: theme.textPrimary }]}>-</Text>
                          </TouchableOpacity>

                          <Text style={[styles.qtyCount, { color: theme.textPrimary }]}>{getQtyForItem(item)}</Text>

                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => increaseQty(item.id ?? item.product_id)}>
                            <Text style={[styles.qtyPlusText, { color: theme.textPrimary }]}>+</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.iconButton, { backgroundColor: isDarkMode ? 'rgba(247, 22, 112, 0.15)' : AllColors.softPinkBg }]}
                          onPress={() => IsUser(item)}>
                          <Ionicons
                            name="cart"
                            size={20}
                            color={AllColors.primary}
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
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Featured Products</Text>
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
                <TouchableOpacity style={[styles.dealCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]} onPress={() => gotoProductDetails(item)}>
                  <View style={[styles.cardImageContainer, { backgroundColor: isDarkMode ? '#0F172A' : AllColors.screenBg }]}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.dealImage}
                    />
                    <TouchableOpacity
                      style={[
                        styles.wishlistButton,
                        {
                          backgroundColor: isDarkMode
                            ? (isItemWishlisted(item) ? AllColors.primary : 'rgba(30, 41, 59, 0.9)')
                            : (isItemWishlisted(item) ? AllColors.primary : 'rgba(255, 255, 255, 0.9)'),
                        },
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

                  <Text numberOfLines={2} style={[styles.productName, { color: theme.textPrimary }]}>
                    {item.name}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={[styles.price, { color: theme.textPrimary }]}>₹{item.originalPrice}</Text>
                    <Text style={[styles.oldPrice, { color: theme.textSecondary }]}>₹{item.price}</Text>
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
                      ) : getQtyForItem(item) > 0 ? (
                        <View style={[styles.qtyContainer, { backgroundColor: isDarkMode ? '#0F172A' : undefined }]}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => decreaseQty(item.id ?? item.product_id)}>
                            <Text style={[styles.qtyText, { color: theme.textPrimary }]}>-</Text>
                          </TouchableOpacity>

                          <Text style={[styles.qtyCount, { color: theme.textPrimary }]}>{getQtyForItem(item)}</Text>

                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => increaseQty(item.id ?? item.product_id)}>
                            <Text style={[styles.qtyPlusText, { color: theme.textPrimary }]}>+</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.iconButton, { backgroundColor: isDarkMode ? 'rgba(247, 22, 112, 0.15)' : AllColors.softPinkBg }]}
                          onPress={() => IsUser(item)}>
                          <Ionicons
                            name="cart"
                            size={20}
                            color={AllColors.primary}
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
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
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
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={styles.cartArrowMargin} />
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
          <View style={[styles.filterModalContent, { backgroundColor: theme.modalBg }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Filter Products</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.filterModalScroll}>
              {/* Price Range Filter */}
              <Text style={[styles.filterSectionLabel, { color: theme.textPrimary }]}>Price Range</Text>
              <View style={styles.chipRow}>
                {[
                  { label: 'All Prices', val: 'all' },
                  { label: 'Under ₹500', val: 'under500' },
                  { label: '₹500 - ₹1000', val: '500to1000' },
                  { label: 'Above ₹1000', val: 'above1000' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.val}
                    style={[
                      styles.chip,
                      { backgroundColor: isDarkMode ? '#334155' : AllColors.divider },
                      selectedPriceRange === item.val && styles.activeChip,
                    ]}
                    onPress={() => setSelectedPriceRange(item.val)}>
                    <Text
                      style={[
                        styles.chipText,
                        { color: theme.textSecondary },
                        selectedPriceRange === item.val && styles.activeChipText,
                      ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sort by Price */}
              <Text style={[styles.filterSectionLabel, styles.mt16, { color: theme.textPrimary }]}>Sort by Price</Text>
              <View style={styles.chipRow}>
                {[
                  { label: 'Default', val: 'none' },
                  { label: 'Price: Low to High', val: 'lowToHigh' },
                  { label: 'Price: High to Low', val: 'highToLow' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.val}
                    style={[
                      styles.chip,
                      { backgroundColor: isDarkMode ? '#334155' : AllColors.divider },
                      sortByPrice === item.val && styles.activeChip,
                    ]}
                    onPress={() => setSortByPrice(item.val)}>
                    <Text
                      style={[
                        styles.chipText,
                        { color: theme.textSecondary },
                        sortByPrice === item.val && styles.activeChipText,
                      ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Brand Filter */}
              {availableBrands.length > 0 && (
                <>
                  <Text style={[styles.filterSectionLabel, styles.mt16, { color: theme.textPrimary }]}>Brand</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.brandScrollMb}>
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        { backgroundColor: isDarkMode ? '#334155' : AllColors.divider },
                        selectedBrand === 'all' && styles.activeChip,
                      ]}
                      onPress={() => setSelectedBrand('all')}>
                      <Text
                        style={[
                          styles.chipText,
                          { color: theme.textSecondary },
                          selectedBrand === 'all' && styles.activeChipText,
                        ]}>
                        All Brands
                      </Text>
                    </TouchableOpacity>
                    {availableBrands.map((brand) => (
                      <TouchableOpacity
                        key={brand}
                        style={[
                          styles.chip,
                          { backgroundColor: isDarkMode ? '#334155' : AllColors.divider },
                          selectedBrand === brand && styles.activeChip,
                        ]}
                        onPress={() => setSelectedBrand(brand)}>
                        <Text
                          style={[
                            styles.chipText,
                            { color: theme.textSecondary },
                            selectedBrand === brand && styles.activeChipText,
                          ]}>
                          {brand}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
            </ScrollView>

            {/* Bottom Actions */}
            <View style={[styles.modalFooter, { borderTopColor: theme.divider }]}>
              <TouchableOpacity style={[styles.resetBtn, { backgroundColor: theme.modalBg }]} onPress={resetFilters}>
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

      {/* NOTIFICATION DRAWER MODAL (SLIDE-IN FROM RIGHT) */}
      <Modal
        visible={isDrawerOpen}
        transparent={true}
        animationType="none"
        onRequestClose={closeNotificationDrawer}
      >
        <View style={styles.drawerOverlayContainer}>
          {/* Backdrop */}
          <Animated.View
            style={[
              styles.drawerBackdrop,
              {
                opacity: drawerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.45],
                }),
              },
            ]}
          >
            <TouchableOpacity
              style={styles.flex1}
              activeOpacity={1}
              onPress={closeNotificationDrawer}
            />
          </Animated.View>

          {/* Drawer Content */}
          <Animated.View
            style={[
              styles.drawerPanel,
              {
                backgroundColor: theme.modalBg,
                transform: [
                  {
                    translateX: drawerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [width * 0.70, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Drawer Header */}
            <View style={[styles.drawerHeader, { borderBottomColor: theme.divider, backgroundColor: theme.modalBg }]}>
              <View style={styles.drawerTitleRow}>
                <View style={styles.drawerHeaderIconCircle}>
                  <FontAwesome name="bell" color="#FFFFFF" size={15} />
                </View>
                <Text style={[styles.drawerTitleText, { color: theme.textPrimary }]}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.drawerUnreadBadgeChip}>
                    <Text style={styles.drawerUnreadBadgeText}>{unreadCount} New</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={[styles.drawerCloseBtn, { backgroundColor: isDarkMode ? '#334155' : '#F8FAFC' }]}
                onPress={closeNotificationDrawer}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Subheader */}
            {notifications.length > 0 && (
              <View style={[styles.drawerSubHeader, { borderBottomColor: theme.divider, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }]}>
                <Text style={[styles.drawerCountSummary, { color: theme.textSecondary }]}>
                  {notifications.length} Notification{notifications.length > 1 ? 's' : ''}
                </Text>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={handleMarkAllRead}>
                    <Text style={styles.markAllReadText}>Mark all as read</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Notifications List */}
            {notifications.length === 0 ? (
              <View style={styles.drawerEmptyContainer}>
                <View style={[styles.emptyBellCircle, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}>
                  <Ionicons name="notifications-off-outline" size={44} color={isDarkMode ? '#94A3B8' : '#94A3B8'} />
                </View>
                <Text style={[styles.drawerEmptyTitle, { color: theme.textPrimary }]}>No Notifications</Text>
                <Text style={[styles.drawerEmptySub, { color: theme.textSecondary }]}>
                  You're all caught up! Updates and promos will appear here.
                </Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.drawerListPadding}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isUnread = !item.isRead;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleNotificationClick(item)}
                      style={[
                        styles.notificationItemCard,
                        {
                          backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                          borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                        },
                        isUnread && {
                          backgroundColor: isDarkMode ? 'rgba(247, 22, 112, 0.15)' : 'rgba(255, 235, 243, 0.85)',
                          borderColor: 'rgba(247, 22, 112, 0.35)',
                          borderWidth: 1.5,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.itemIconCircle,
                          isUnread ? styles.unreadIconBg : { backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9' },
                        ]}
                      >
                        <Ionicons
                          name={
                            item.type === 'order'
                              ? 'cube-outline'
                              : item.type === 'cart'
                              ? 'cart-outline'
                              : 'pricetag-outline'
                          }
                          size={16}
                          color={isUnread ? AllColors.primary : (isDarkMode ? '#94A3B8' : '#64748B')}
                        />
                      </View>

                      <View style={styles.itemTextContainer}>
                        <View style={styles.itemTitleRow}>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.itemTitleText,
                              { color: theme.textPrimary },
                              isUnread && styles.unreadTitleText,
                            ]}
                          >
                            {item.title}
                          </Text>
                          {isUnread && <View style={styles.unreadDot} />}
                        </View>
                        <Text numberOfLines={2} style={[styles.itemBodyText, { color: theme.textSecondary }]}>
                          {item.body}
                        </Text>
                        <Text style={styles.itemTimeText}>{item.time}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.itemDeleteBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => handleDeleteNotification(item.id)}
                      >
                        <Ionicons name="trash-outline" size={16} color={isDarkMode ? '#94A3B8' : '#94A3B8'} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            {/* Footer */}
            {notifications.length > 0 && (
              <View style={[styles.drawerFooter, { borderTopColor: theme.divider, backgroundColor: theme.modalBg }]}>
                <TouchableOpacity
                  style={styles.clearAllBtn}
                  onPress={handleClearAll}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AllColors.screenBg,
  },
  topHeader: {
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: AllColors.white,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 2,
    shadowColor: AllColors.shadow,
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
    color: AllColors.slateDark,
  },
  logoSubtext: {
    fontSize: 11,
    color: AllColors.slateSub,
    marginTop: 2,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AllColors.divider,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
    elevation: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  notificationBannerContainer: {
    position: 'absolute',
    top: 10,
    right: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderTopRightRadius: 0,
    zIndex: 9999,
    elevation: 12,
    shadowColor: AllColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    borderWidth: 1.5,
    borderColor: AllColors.primary,
    overflow: 'hidden',
    maxWidth: width * 0.78,
  },
  bannerInnerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 26,
  },
  bannerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AllColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  bannerTextColumn: {
    flexShrink: 1,
    justifyContent: 'center',
  },
  bannerTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 1,
  },
  bannerBodyText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 16,
  },
  searchBox: {
    flex: 1,
    backgroundColor: AllColors.divider,
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
    color: AllColors.slateDark,
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
    backgroundColor: AllColors.greenLight,
    borderWidth: 1.5,
    borderColor: AllColors.white,
  },
  categoryBtn: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    backgroundColor: AllColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    elevation: 1,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: AllColors.divider,
  },
  activeCategory: {
    backgroundColor: AllColors.softPinkBg,
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
    color: AllColors.slateDark,
  },
  sectionViewAll: {
    fontSize: 13,
    fontWeight: '700',
    color: AllColors.primary,
  },
  dealCard: {
    width: 156,
    backgroundColor: AllColors.white,
    borderRadius: 12,
    padding: 10,
    marginRight: 10,
    elevation: 2,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: AllColors.divider,
    marginBottom: 8,
  },
  gridCard: {
    flex: 1,
    maxWidth: '48%',
    backgroundColor: AllColors.white,
    borderRadius: 12,
    padding: 10,
    marginHorizontal: '1%',
    marginVertical: 6,
    elevation: 2,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: AllColors.divider,
  },
  cardImageContainer: {
    width: '100%',
    height: 110,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: AllColors.screenBg,
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
    shadowColor: AllColors.shadow,
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
    color: AllColors.slateText,
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
    color: AllColors.slateDark,
  },
  oldPrice: {
    textDecorationLine: 'line-through',
    color: AllColors.slateLight,
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
    color: AllColors.greenLight,
    fontWeight: '700',
    fontSize: 10,
  },
  actionContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AllColors.softPinkBg,
    borderWidth: 1,
    borderColor: AllColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 82,
    height: 36,
    borderWidth: 1.5,
    borderColor: AllColors.primary,
    borderRadius: 18,
    paddingHorizontal: 4,
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
    backgroundColor: AllColors.redSoftBg,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: AllColors.redLight,
    fontSize: 9,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: AllColors.modalOverlay,
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: AllColors.white,
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
    borderBottomColor: AllColors.divider,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AllColors.slateDark,
  },
  filterSectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: AllColors.slateText,
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
    backgroundColor: AllColors.divider,
    marginRight: 6,
    marginBottom: 6,
  },
  activeChip: {
    backgroundColor: AllColors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: AllColors.slateMuted,
  },
  activeChipText: {
    color: AllColors.white,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AllColors.divider,
  },
  resetBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: AllColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AllColors.white,
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
    color: AllColors.white,
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
    shadowColor: AllColors.shadow,
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
    borderColor: AllColors.white,
    backgroundColor: AllColors.screenBg,
  },
  miniCartMoreBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: AllColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
    zIndex: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: AllColors.lightGrey,
  },
  miniCartMoreText: {
    fontSize: 10,
    fontWeight: '800',
    color: AllColors.slateDark,
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
  subCategoryItemContainer: {
    alignItems: 'center',
    marginRight: 14,
    width: 80,
  },
  subCategoryWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
  },
  activeSubCategoryWrapper: {
    borderWidth: 3,
    borderColor: AllColors.primary,
    borderRadius: 38,
    transform: [{ translateY: -4 }],
    elevation: 6,
    shadowColor: AllColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  subCategoryCard: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  subCategoryImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  subCategoryItemText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginTop: 4,
    textAlign: 'center',
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
  iconButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
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
  searchIconButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: AllColors.primary,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerCartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  flexRowGap12: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gap6: {
    gap: 6,
  },
  catImageStyle: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  catIconMargin: {
    marginRight: 6,
  },
  catNameText: {
    fontSize: 13,
  },
  catNameSelected: {
    color: AllColors.primary,
    fontWeight: '700',
  },
  catNameUnselected: {
    color: '#334155',
    fontWeight: '600',
  },
  subCatLoader: {
    marginVertical: 10,
  },
  subCatContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  productLoader: {
    marginVertical: 40,
  },
  emptySearchContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySearchText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  cartArrowMargin: {
    marginLeft: 4,
  },
  filterModalScroll: {
    maxHeight: 420,
  },
  mt16: {
    marginTop: 16,
  },
  brandScrollMb: {
    marginBottom: 12,
  },
  flex1: {
    flex: 1,
  },
  drawerOverlayContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
  },
  drawerPanel: {
    width: width * 0.70,
    height: '100%',
    backgroundColor: '#FFFFFF',
    elevation: 20,
    shadowColor: '#000000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    overflow: 'hidden',
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  drawerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  drawerHeaderIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AllColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  drawerUnreadBadgeChip: {
    backgroundColor: 'rgba(247, 22, 112, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(247, 22, 112, 0.3)',
  },
  drawerUnreadBadgeText: {
    color: AllColors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  drawerCloseBtn: {
    padding: 6,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
  },
  drawerSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  drawerCountSummary: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  markAllReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: AllColors.primary,
  },
  drawerListPadding: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },
  notificationItemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  unreadNotificationCard: {
    backgroundColor: 'rgba(255, 235, 243, 0.85)',
    borderColor: 'rgba(247, 22, 112, 0.35)',
    borderWidth: 1.5,
  },
  itemIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  unreadIconBg: {
    backgroundColor: 'rgba(247, 22, 112, 0.12)',
  },
  readIconBg: {
    backgroundColor: '#F1F5F9',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 6,
  },
  itemTitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  unreadTitleText: {
    fontWeight: '800',
    color: '#0F172A',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AllColors.primary,
    marginLeft: 6,
  },
  itemBodyText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 3,
    lineHeight: 16,
  },
  itemTimeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 6,
  },
  itemDeleteBtn: {
    padding: 4,
    marginLeft: 4,
  },
  drawerEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyBellCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  drawerEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  drawerEmptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  drawerFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    gap: 6,
  },
  clearAllText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
});