import AsyncStorage from "@react-native-async-storage/async-storage";

export const BASE_URL = "https://deebazar.com/admin/api/";

// STORAGE KEYS
const USER_ID_KEY = "USER_ID";
const MOBILE_KEY = "MOBILE";
const TOKEN_KEY = "TOKEN";
const DEVICE_ID_KEY = "DEVICE_ID";
const PASSWORD_KEY = "PASSWORD";

// ================= DEVICE ID =================

// Simple UUID v4 generator (no external dependency needed)
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Get or create a permanent device ID (created once, stored forever)
export const getDeviceId = async () => {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = generateUUID();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      // console.log('🆔 New Device ID created:', deviceId);
    }
    return deviceId;
  } catch (e) {
    console.log('Device ID error:', e);
    return 'unknown-device';
  }
};



// ================= USER ID =================

// Save userId
export const setuserId = async (user_id) => {
  try {
    await AsyncStorage.setItem(USER_ID_KEY, String(user_id));
  } catch (e) {
    console.log("userId save error", e);
  }
};

// Get userId
export const getuserId = async () => {
  try {
    return await AsyncStorage.getItem(USER_ID_KEY);
  } catch (e) {
    console.log("userId get error", e);
    return null;
  }
};

// Remove userId
export const removeuserId = async () => {
  try {
    await AsyncStorage.removeItem(USER_ID_KEY);
  } catch (e) {
    console.log("userId remove error", e);
  }
};


// ================= MOBILE =================

// Save mobile
export const setMobile = async (mobile) => {
  try {
    await AsyncStorage.setItem(MOBILE_KEY, String(mobile));
  } catch (e) {
    console.log("mobile save error", e);
  }
};

// Get mobile
export const getMobile = async () => {
  try {
    return await AsyncStorage.getItem(MOBILE_KEY);
  } catch (e) {
    console.log("mobile get error", e);
    return null;
  }
};

// Remove mobile
export const removemobile = async () => {
  try {
    await AsyncStorage.removeItem(MOBILE_KEY);
  } catch (e) {
    console.log("mobile remove error", e);
  }
};


// ================= TOKEN =================

// Save token
export const setToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.log("token save error", e);
  }
};

// Get token
export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (e) {
    console.log("token get error", e);
    return null;
  }
};

// Remove token
export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.log("token remove error", e);
  }
};

// ================= PASSWORD =================

// Save password
export const setPassword = async (password) => {
  try {
    await AsyncStorage.setItem(PASSWORD_KEY, password);
  } catch (e) {
    console.log("password save error", e);
  }
};

// Get password
export const getPassword = async () => {
  try {
    return await AsyncStorage.getItem(PASSWORD_KEY);
  } catch (e) {
    console.log("password get error", e);
    return null;
  }
};

// Remove password
export const removePassword = async () => {
  try {
    await AsyncStorage.removeItem(PASSWORD_KEY);
  } catch (e) {
    console.log("password remove error", e);
  }
};

// ================= CART APIS =================

/**
 * Add or update item in cart
 * POST /api/cart-to-add
 * Headers: Authorization: Bearer {token}
 * Body: { product_sku_id, qty }
 */
export const addToCartApi = async (productSkuId, qty = 1, extra = {}, mode = 'add') => {
  try {
    const token = await getToken();
    const userId = await getuserId();
    const formData = new FormData();
    formData.append("product_sku_id", productSkuId);
    formData.append("qty", qty);
    formData.append("mode", mode);
    if (userId) formData.append("user_id", userId);
    if (extra?.seller_sku_id) formData.append("seller_sku_id", String(extra.seller_sku_id));

    const response = await fetch(`${BASE_URL}cart-to-add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: formData,
    });

    return await response.json();
  } catch (error) {
    console.log("addToCartApi error:", error);
    throw error;
  }
};

/**
 * Remove item from cart
 * POST /api/cart-remove
 * Headers: Authorization: Bearer {token}
 * Body: { product_sku_id, seller_sku_id }
 */
export const removeFromCartApi = async (productSkuId, sellerSkuId = null) => {
  try {
    const token = await getToken();
    const userId = await getuserId();
    const formData = new FormData();
    formData.append("product_sku_id", String(productSkuId));
    if (sellerSkuId) formData.append("seller_sku_id", String(sellerSkuId));
    if (userId) formData.append("user_id", userId);

    const response = await fetch(`${BASE_URL}cart-remove`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: formData,
    });

    return await response.json();
  } catch (error) {
    console.log("removeFromCartApi error:", error);
    throw error;
  }
};

/**
 * View cart items, extra totals, and address data
 * POST /api/cart-view
 * Headers: Authorization: Bearer {token}
 * Body: { user_id, address_id }
 */
export const getCartViewApi = async (addressId = null) => {
  try {
    const token = await getToken();
    const userId = await getuserId();
    const formData = new FormData();
    if (userId) formData.append("user_id", userId);
    if (addressId) formData.append("address_id", addressId);

    const response = await fetch(`${BASE_URL}cart-view`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: formData,
    });

    return await response.json();
  } catch (error) {
    console.log("getCartViewApi error:", error);
    throw error;
  }
};

/**
 * Get SKU List
 * POST /api/sku
 * Headers: Authorization: Bearer {token}
 * Body: { category_id, sub_category_id, child_category_id, product_id, sku_id, per_page, page }
 */
export const getSkuListApi = async ({
  categoryId = null,
  subCategoryId = null,
  childCategoryId = null,
  productId = null,
  skuId = null,
  perPage = 12,
  page = 1,
} = {}) => {
  try {
    const token = await getToken();
    const formData = new FormData();
    if (categoryId && categoryId !== 'all') formData.append('category_id', categoryId);
    if (subCategoryId && subCategoryId !== 'all' && subCategoryId !== 'null') formData.append('sub_category_id', subCategoryId);
    if (childCategoryId && childCategoryId !== 'all' && childCategoryId !== 'null') formData.append('child_category_id', childCategoryId);
    if (productId) formData.append('product_id', productId);
    if (skuId) formData.append('sku_id', skuId);
    formData.append('per_page', perPage);
    formData.append('page', page);

    const headers = {
      Accept: 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}sku`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return await response.json();
  } catch (error) {
    console.log('getSkuListApi error:', error);
    throw error;
  }
};

/**
 * Get SKU Details
 * POST /api/sku-details
 * Headers: Authorization: Bearer {token}
 * Body: { sku_id, seller_id }
 */
export const getSkuDetailsApi = async (skuId, sellerId) => {
  try {
    const token = await getToken();
    const formData = new FormData();
    formData.append("sku_id", String(skuId));
    if (sellerId !== undefined && sellerId !== null && sellerId !== '') {
      formData.append("seller_id", String(sellerId));
    }

    const headers = {
      Accept: "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}sku-details`, {
      method: "POST",
      headers,
      body: formData,
    });

    return await response.json();
  } catch (error) {
    console.log("getSkuDetailsApi error:", error);
    throw error;
  }
};

/**
 * Create Order
 * POST /api/orders
 * Headers: Authorization: Bearer {token}
 * Body: { address_id, payment_method }
 */
export const createOrderApi = async (addressId, paymentMethod = 'cod') => {
  try {
    const token = await getToken();
    const formData = new FormData();
    formData.append("address_id", addressId);
    formData.append("payment_method", paymentMethod);

    const headers = {
      Accept: "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}orders`, {
      method: "POST",
      headers,
      body: formData,
    });

    return await response.json();
  } catch (error) {
    console.log("createOrderApi error:", error);
    throw error;
  }
};

/**
 * Get Order List
 * POST /api/order-list
 * Headers: Authorization: Bearer {token}
 */
export const getOrderListApi = async () => {
  try {
    const token = await getToken();
    const headers = {
      Accept: "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}order-list`, {
      method: "POST",
      headers,
    });

    return await response.json();
  } catch (error) {
    console.log("getOrderListApi error:", error);
    throw error;
  }
};

/**
 * Get Order Details
 * POST /api/order-details
 * Headers: Authorization: Bearer {token}
 * Body: { order_id }
 */
export const getOrderDetailsApi = async (orderId) => {
  try {
    const token = await getToken();
    const formData = new FormData();
    formData.append("order_id", orderId);

    const headers = {
      Accept: "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}order-details`, {
      method: "POST",
      headers,
      body: formData,
    });

    return await response.json();
  } catch (error) {
    console.log("getOrderDetailsApi error:", error);
    throw error;
  }
};

