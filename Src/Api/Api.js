import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const BASE_URL = "https://deebazar.com/admin/api/";

// ================= STORAGE KEYS =================
const USER_ID_KEY = "USER_ID";
const MOBILE_KEY = "MOBILE";
const TOKEN_KEY = "TOKEN";
const DEVICE_ID_KEY = "DEVICE_ID";
const PASSWORD_KEY = "PASSWORD";

// ================= DEVICE ID =================

// Simple UUID v4 generator
export const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
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
    }
    return deviceId;
  } catch (e) {
    console.log("Device ID error:", e);
    return "unknown-device";
  }
};

// ================= USER ID =================

export const setuserId = async (user_id) => {
  try {
    await AsyncStorage.setItem(USER_ID_KEY, String(user_id));
  } catch (e) {
    console.log("userId save error", e);
  }
};

export const getuserId = async () => {
  try {
    return await AsyncStorage.getItem(USER_ID_KEY);
  } catch (e) {
    console.log("userId get error", e);
    return null;
  }
};

export const removeuserId = async () => {
  try {
    await AsyncStorage.removeItem(USER_ID_KEY);
  } catch (e) {
    console.log("userId remove error", e);
  }
};

// ================= MOBILE =================

export const setMobile = async (mobile) => {
  try {
    await AsyncStorage.setItem(MOBILE_KEY, String(mobile));
  } catch (e) {
    console.log("mobile save error", e);
  }
};

export const getMobile = async () => {
  try {
    return await AsyncStorage.getItem(MOBILE_KEY);
  } catch (e) {
    console.log("mobile get error", e);
    return null;
  }
};

export const removemobile = async () => {
  try {
    await AsyncStorage.removeItem(MOBILE_KEY);
  } catch (e) {
    console.log("mobile remove error", e);
  }
};

// ================= TOKEN =================

export const setToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.log("token save error", e);
  }
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (e) {
    console.log("token get error", e);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.log("token remove error", e);
  }
};

// ================= PASSWORD =================

export const setPassword = async (password) => {
  try {
    await AsyncStorage.setItem(PASSWORD_KEY, password);
  } catch (e) {
    console.log("password save error", e);
  }
};

export const getPassword = async () => {
  try {
    return await AsyncStorage.getItem(PASSWORD_KEY);
  } catch (e) {
    console.log("password get error", e);
    return null;
  }
};

export const removePassword = async () => {
  try {
    await AsyncStorage.removeItem(PASSWORD_KEY);
  } catch (e) {
    console.log("password remove error", e);
  }
};

// ================= CORE HTTP CLIENT HELPER =================

/**
 * Universal safe API caller with timeout, error recovery, token injection, and body handling.
 */
export const requestApi = async (endpoint, options = {}) => {
  const {
    method = "GET",
    body = null,
    headers = {},
    requiresAuth = true,
    token: explicitToken = null,
    timeoutMs = 15000,
  } = options;

  try {
    const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint.replace(/^\//, "")}`;

    const requestHeaders = {
      Accept: "application/json",
      ...headers,
    };

    if (requiresAuth || explicitToken) {
      const token = explicitToken || (await getToken());
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }
    }

    // Set JSON content-type if body is a plain object and not FormData
    let requestBody = body;
    if (body && typeof body === "object" && !(body instanceof FormData)) {
      requestHeaders["Content-Type"] = "application/json";
      requestBody = JSON.stringify(body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const text = await response.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (data && typeof data === "object") {
      if (!("status" in data)) {
        data.status = response.status;
      }
      if (!("ok" in data)) {
        data.ok = response.ok;
      }
      if (!("data" in data)) {
        data.data = data;
      }
      return data;
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      headers: response.headers,
    };
  } catch (error) {
    console.log(`API [${method} ${endpoint}] error:`, error?.message || error);
    return {
      ok: false,
      status: 0,
      data: null,
      error: error?.message || "Network Error",
    };
  }
};

// ================= AUTH APIS =================

/**
 * Send OTP
 * POST /api/send-otp
 * Body: { mobile, device_id, fcm_token?, device_type? }
 */
export const sendOtpApi = async (params) => {
  const {
    mobile,
    deviceId,
    device_id,
    fcmToken,
    fcm_token,
    deviceType,
    device_type,
  } = typeof params === "object" ? params : { mobile: params };

  const finalDeviceId = deviceId || device_id || (await getDeviceId());
  const finalDeviceType = deviceType || device_type || Platform.OS;
  const finalFcm = fcmToken || fcm_token;

  const formData = new FormData();
  formData.append("mobile", String(mobile || "").trim());
  formData.append("device_id", String(finalDeviceId));
  if (finalFcm) formData.append("fcm_token", String(finalFcm));
  formData.append("device_type", String(finalDeviceType));

  const res = await requestApi("send-otp", {
    method: "POST",
    body: formData,
    requiresAuth: false,
  });

  return res;
};

/**
 * Register User
 * POST /api/register
 * Body: { name, email, mobile, password, role? }
 */
export const registerApi = async ({ name, email, mobile, password, role = "user" }) => {
  const formData = new FormData();
  formData.append("name", String(name || "").trim());
  formData.append("email", String(email || "").trim().toLowerCase());
  formData.append("mobile", String(mobile || "").trim());
  formData.append("password", String(password || "").trim());
  formData.append("role", String(role || "user"));

  const res = await requestApi("register", {
    method: "POST",
    body: formData,
    requiresAuth: false,
  });

  return res;
};

/**
 * Verify OTP
 * POST /api/verify-otp
 * Body: { mobile, otp, device_id, fcm_token?, device_type? }
 */
export const verifyOtpApi = async (params) => {
  const {
    mobile,
    otp,
    deviceId,
    device_id,
    fcmToken,
    fcm_token,
    deviceType,
    device_type,
  } = params;

  const finalDeviceId = deviceId || device_id || (await getDeviceId());
  const finalDeviceType = deviceType || device_type || Platform.OS;
  const finalFcm = fcmToken || fcm_token;

  const formData = new FormData();
  formData.append("mobile", String(mobile || "").trim());
  formData.append("otp", String(otp || "").trim());
  formData.append("device_id", String(finalDeviceId));
  if (finalFcm) formData.append("fcm_token", String(finalFcm));
  formData.append("device_type", String(finalDeviceType));

  const res = await requestApi("verify-otp", {
    method: "POST",
    body: formData,
    requiresAuth: false,
  });

  return res;
};

/**
 * Logout
 * POST /api/logout
 */
export const logoutApi = async () => {
  return await requestApi("logout", {
    method: "POST",
    requiresAuth: true,
  });
};

/**
 * Send OTP for Account Deletion
 * POST /api/send-delete-account-otp
 */
export const sendDeleteAccountOtpApi = async (mobile) => {
  const formData = new FormData();
  formData.append("mobile", String(mobile || "").trim());

  return await requestApi("send-delete-account-otp", {
    method: "POST",
    body: formData,
    requiresAuth: true,
  });
};

/**
 * Confirm Account Deletion
 * POST /api/delete-account
 */
export const deleteAccountApi = async ({ mobile, otp, reason }) => {
  return await requestApi("delete-account", {
    method: "POST",
    body: {
      mobile: String(mobile || "").trim(),
      otp: String(otp || "").trim(),
      reason: reason || "I no longer want to use the app",
      reasons: reason || "I no longer want to use the app",
    },
    requiresAuth: true,
  });
};

// ================= USER / PROFILE APIS =================

/**
 * Get User Profile
 * GET /api/me
 */
export const getUserProfileApi = async () => {
  return await requestApi("me", {
    method: "GET",
    requiresAuth: true,
  });
};

/**
 * Update User Profile
 * POST /api/user/profile
 */
export const updateUserProfileApi = async (formDataOrPayload) => {
  return await requestApi("user/profile", {
    method: "POST",
    body: formDataOrPayload,
    requiresAuth: true,
  });
};

// ================= CATEGORIES & BANNERS APIS =================

/**
 * Get Categories List
 * GET /api/categories
 */
export const getCategoriesApi = async () => {
  return await requestApi("categories", {
    method: "GET",
    requiresAuth: false,
  });
};

/**
 * Get Sub-categories for a category
 * POST /api/sub-category
 */
export const getSubCategoriesApi = async (categoryId) => {
  const formData = new FormData();
  formData.append("category_id", String(categoryId));

  return await requestApi("sub-category", {
    method: "POST",
    body: formData,
    requiresAuth: false,
  });
};

/**
 * Get Active Banners
 * GET /api/banners (with fallback to POST /api/banner)
 */
export const getBannersApi = async () => {
  const res = await requestApi("banners", {
    method: "GET",
    requiresAuth: false,
  });

  if (res.ok && res.data?.status === 200 && Array.isArray(res.data?.data) && res.data.data.length > 0) {
    return res;
  }

  // Fallback to legacy banner endpoint
  return await getLegacyBannerApi();
};

/**
 * Legacy Banner Endpoint
 * POST /api/banner
 */
export const getLegacyBannerApi = async () => {
  return await requestApi("banner", {
    method: "POST",
    body: new FormData(),
    requiresAuth: false,
  });
};

// ================= PRODUCTS & SKU APIS =================

/**
 * Get Product SKU List
 * POST /api/sku
 */
export const getSkuListApi = async ({
  categoryId = null,
  subCategoryId = null,
  childCategoryId = null,
  productId = null,
  skuId = null,
  gender = null,
  perPage = 10,
  page = 1,
} = {}) => {
  try {
    const formData = new FormData();
    if (categoryId && categoryId !== "all") formData.append("category_id", String(categoryId));
    if (subCategoryId && subCategoryId !== "all" && subCategoryId !== "null") formData.append("sub_category_id", String(subCategoryId));
    if (childCategoryId && childCategoryId !== "all" && childCategoryId !== "null") formData.append("child_category_id", String(childCategoryId));
    if (productId) formData.append("product_id", String(productId));
    if (skuId) formData.append("sku_id", String(skuId));
    if (gender && gender !== "all") formData.append("gender", String(gender));
    formData.append("per_page", String(perPage));
    formData.append("page", String(page));

    const token = await getToken();
    const headers = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}sku`, {
      method: "POST",
      headers,
      body: formData,
    });

    return await response.json();
  } catch (error) {
    console.log("getSkuListApi error:", error);
    throw error;
  }
};

/**
 * Get SKU Details
 * POST /api/sku-details
 */
export const getSkuDetailsApi = async (skuIdOrParams, optionalSellerId) => {
  try {
    let skuId;
    let sellerId;

    if (typeof skuIdOrParams === "object" && skuIdOrParams !== null) {
      skuId = skuIdOrParams.skuId ?? skuIdOrParams.sku_id;
      sellerId = skuIdOrParams.sellerId ?? skuIdOrParams.seller_id;
    } else {
      skuId = skuIdOrParams;
      sellerId = optionalSellerId;
    }

    const token = await getToken();
    const formData = new FormData();
    if (skuId !== undefined && skuId !== null) {
      formData.append("sku_id", String(skuId));
    }
    if (sellerId !== undefined && sellerId !== null && sellerId !== "") {
      formData.append("seller_id", String(sellerId));
    }

    const headers = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

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
 * Search Product SKU List
 * POST /api/sku-search
 */
export const searchSkuApi = async (keywordOrParams, optionalPerPage = 12, optionalPage = 1) => {
  try {
    let keyword = "";
    let perPage = optionalPerPage;
    let page = optionalPage;

    if (typeof keywordOrParams === "object" && keywordOrParams !== null) {
      keyword = keywordOrParams.keyword ?? keywordOrParams.search ?? keywordOrParams.query ?? "";
      perPage = keywordOrParams.perPage ?? keywordOrParams.per_page ?? optionalPerPage;
      page = keywordOrParams.page ?? optionalPage;
    } else {
      keyword = keywordOrParams ?? "";
    }

    const token = await getToken();
    const formData = new FormData();
    formData.append("keyword", String(keyword || "").trim());
    if (perPage !== undefined && perPage !== null) formData.append("per_page", String(perPage));
    if (page !== undefined && page !== null) formData.append("page", String(page));

    const headers = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}sku-search`, {
      method: "POST",
      headers,
      body: formData,
    });

    return await response.json();
  } catch (error) {
    console.log("searchSkuApi error:", error);
    throw error;
  }
};

/**
 * Get Product Details (Fallback or primary)
 * POST /api/product-details
 */
export const getProductDetailsApi = async (productIdOrParams, sellerId = null, userId = null) => {
  try {
    let productId = productIdOrParams;
    let finalSellerId = sellerId;
    let finalUserId = userId;

    if (typeof productIdOrParams === "object" && productIdOrParams !== null) {
      productId = productIdOrParams.productId ?? productIdOrParams.product_id ?? productIdOrParams.id;
      finalSellerId = productIdOrParams.sellerId ?? productIdOrParams.seller_id ?? sellerId;
      finalUserId = productIdOrParams.userId ?? productIdOrParams.user_id ?? userId;
    }

    const token = await getToken();
    const formData = new FormData();
    formData.append("product_id", String(productId));
    if (finalSellerId) formData.append("seller_id", String(finalSellerId));
    if (finalUserId) formData.append("user_id", String(finalUserId));

    const headers = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}product-details`, {
      method: "POST",
      headers,
      body: formData,
    });

    return await response.json();
  } catch (error) {
    console.log("getProductDetailsApi error:", error);
    throw error;
  }
};

/**
 * Get Popular Products
 * GET /api/popular-products
 */
export const getPopularProductsApi = async () => {
  return await requestApi("popular-products", {
    method: "GET",
    requiresAuth: false,
  });
};

/**
 * Get Deal of the Day
 * GET /api/deal-of-the-day?limit={limit}
 */
export const getDealOfTheDayApi = async (limit = 4) => {
  return await requestApi(`deal-of-the-day?limit=${limit}`, {
    method: "GET",
    requiresAuth: false,
  });
};

/**
 * Get Featured Products
 * GET /api/featured-products
 */
export const getFeaturedProductsApi = async () => {
  return await requestApi("featured-products", {
    method: "GET",
    requiresAuth: false,
  });
};

// ================= CART APIS =================

/**
 * Add or update item in cart
 * POST /api/cart-to-add
 */
export const addToCartApi = async (productSkuId, qty = 1, extra = {}, mode = "add") => {
  try {
    const token = await getToken();
    const userId = await getuserId();
    const formData = new FormData();
    formData.append("product_sku_id", String(productSkuId));
    formData.append("qty", String(qty));
    formData.append("mode", mode);
    if (userId) formData.append("user_id", String(userId));
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
 */
export const removeFromCartApi = async (productSkuId, sellerSkuId = null, userIdParam = null) => {
  try {
    const token = await getToken();
    const userId = userIdParam || (await getuserId());
    const formData = new FormData();
    formData.append("product_sku_id", String(productSkuId));
    if (sellerSkuId) formData.append("seller_sku_id", String(sellerSkuId));
    if (userId) formData.append("user_id", String(userId));

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
 * View cart items, multi-seller packages, and billing summary
 * POST /api/cart-view
 */
export const getCartViewApi = async (addressId = null, selections = null) => {
  try {
    const token = await getToken();
    const payload = {};
    if (addressId && !isNaN(addressId) && Number(addressId) > 0) {
      payload.address_id = Number(addressId);
    }
    if (selections && typeof selections === "object" && Object.keys(selections).length > 0) {
      payload.selections = selections;
    }

    const response = await fetch(`${BASE_URL}cart-view`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    return await response.json();
  } catch (error) {
    console.log("getCartViewApi error:", error);
    throw error;
  }
};

// ================= WISHLIST APIS =================

/**
 * View wishlist items
 * POST /api/wishlist-view
 */
export const viewWishlistApi = async () => {
  try {
    const token = await getToken();
    const response = await fetch(`${BASE_URL}wishlist-view`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.log("viewWishlistApi error:", error);
    throw error;
  }
};

/**
 * Add product to wishlist
 * POST /api/wishlist-add
 */
export const addToWishlistApi = async (productSkuId, sellerSkuId = null) => {
  try {
    const token = await getToken();
    const formData = new FormData();
    formData.append("product_sku_id", String(productSkuId));
    if (sellerSkuId) formData.append("seller_sku_id", String(sellerSkuId));

    const response = await fetch(`${BASE_URL}wishlist-add`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    return await response.json();
  } catch (error) {
    console.log("addToWishlistApi error:", error);
    throw error;
  }
};

/**
 * Remove product from wishlist
 * POST /api/wishlist-remove
 */
export const removeFromWishlistApi = async (productSkuId, sellerSkuId = null) => {
  try {
    const token = await getToken();
    const formData = new FormData();
    formData.append("product_sku_id", String(productSkuId));
    if (sellerSkuId) formData.append("seller_sku_id", String(sellerSkuId));

    const response = await fetch(`${BASE_URL}wishlist-remove`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    return await response.json();
  } catch (error) {
    console.log("removeFromWishlistApi error:", error);
    throw error;
  }
};

// ================= ADDRESS APIS =================

/**
 * Get User Saved Address List
 * POST /api/list-address
 */
export const getAddressListApi = async (userId = null) => {
  const token = await getToken();
  const resolvedUserId = userId || (await getuserId());

  // 1. Try FormData
  try {
    const formData = new FormData();
    if (resolvedUserId) formData.append("user_id", String(resolvedUserId));

    const res = await fetch(`${BASE_URL}list-address`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData,
    });

    const text = await res.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch { }

    if (res.ok && (data.status === 200 || data.data)) {
      return { ok: true, status: 200, data };
    }
  } catch (e) {
    console.log("list-address FormData error:", e);
  }

  // 2. Try JSON body
  try {
    const bodyData = {};
    if (resolvedUserId) bodyData.user_id = resolvedUserId;

    const res = await fetch(`${BASE_URL}list-address`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(bodyData),
    });

    const text = await res.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch { }

    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.log("list-address JSON error:", e);
    return { ok: false, status: 0, data: null, error: e?.message };
  }
};

/**
 * Save New Address
 * POST /api/save-address
 */
export const saveAddressApi = async (addressData) => {
  const token = await getToken();
  return await requestApi("save-address", {
    method: "POST",
    body: addressData,
    token,
    requiresAuth: true,
  });
};

/**
 * Update Existing Address
 * POST /api/update-address
 */
export const updateAddressApi = async (addressData) => {
  const token = await getToken();
  return await requestApi("update-address", {
    method: "POST",
    body: addressData,
    token,
    requiresAuth: true,
  });
};

/**
 * Delete Address
 * POST /api/delete-address
 */
export const deleteAddressApi = async (addressId, userId = null) => {
  const token = await getToken();
  const resolvedUserId = userId || (await getuserId());

  // 1. Try FormData
  try {
    const formData = new FormData();
    formData.append("address_id", String(addressId));
    if (resolvedUserId) formData.append("user_id", String(resolvedUserId));

    const res = await fetch(`${BASE_URL}delete-address`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData,
    });

    const text = await res.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch { }

    if (res.ok && (data.status === 200 || data.status === "200" || data.success)) {
      return { ok: true, status: 200, data, success: true };
    }
  } catch (e) {
    console.log("delete-address FormData error:", e);
  }

  // 2. Try JSON
  try {
    const res = await fetch(`${BASE_URL}delete-address`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address_id: addressId,
        user_id: resolvedUserId,
      }),
    });

    const text = await res.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch { }

    return {
      ok: res.ok,
      status: res.status,
      data,
      success: res.ok && (data.status === 200 || data.success),
    };
  } catch (e) {
    return { ok: false, status: 0, error: e?.message, success: false };
  }
};

// ================= ORDERS & PAYMENTS APIS =================

/**
 * Create Order
 * POST /api/orders
 * Body format:
 * {
 *   "address_id": 2,
 *   "payment_method": "cod",
 *   "selections": {
 *     "1": { "mode": "pickup" }           // where 1 is seller_id
 *     // or: "1": { "mode": "delivery", "option": "seller" }
 *   }
 * }
 */
export const createOrderApi = async (addressId, paymentMethod = "cod", selections = null, couponCode = null) => {
  try {
    const token = await getToken();
    const payload = {
      address_id: addressId ? (isNaN(addressId) ? addressId : Number(addressId)) : undefined,
      payment_method: String(paymentMethod),
    };

    if (selections && typeof selections === "object" && Object.keys(selections).length > 0) {
      payload.selections = selections;
    }

    if (couponCode) {
      payload.coupon_code = couponCode;
    }

    console.log("createOrderApi payload:", JSON.stringify(payload));

    const response = await fetch(`${BASE_URL}orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    let result;
    try {
      result = await response.json();
    } catch (parseErr) {
      console.log("createOrderApi JSON parse error:", parseErr);
      result = { status: response.status, message: "Server returned unexpected response" };
    }

    // Fallback: If server rejects JSON with 415 or validation error requiring FormData
    if (!response.ok && (!result || result.status !== 200) && response.status === 415) {
      const formData = new FormData();
      if (addressId) formData.append("address_id", String(addressId));
      formData.append("payment_method", String(paymentMethod));
      if (selections && Object.keys(selections).length > 0) {
        formData.append("selections", JSON.stringify(selections));
      }
      if (couponCode) formData.append("coupon_code", String(couponCode));

      const formRes = await fetch(`${BASE_URL}orders`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      try {
        const formResult = await formRes.json();
        return formResult;
      } catch (e) {
        return result;
      }
    }

    return result;
  } catch (error) {
    console.log("createOrderApi error:", error);
    throw error;
  }
};
/**
 * Get Order List
 * POST /api/order-list
 */
export const getOrderListApi = async (userId = null) => {
  try {
    const token = await getToken();
    const resolvedUserId = userId || (await getuserId());

    // 1. Plain POST without body
    let response = await fetch(`${BASE_URL}order-list`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    let result = await response.json().catch(() => null);

    // 2. Fallback with user_id FormData if empty or error
    if (!result || (result.status !== 200 && result.status !== "200" && !result.success)) {
      if (resolvedUserId) {
        const formData = new FormData();
        formData.append("user_id", String(resolvedUserId));

        const fdResponse = await fetch(`${BASE_URL}order-list`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: formData,
        });

        const fdResult = await fdResponse.json().catch(() => null);
        if (fdResult) return fdResult;
      }
    }

    return result;
  } catch (error) {
    console.log("getOrderListApi error:", error);
    throw error;
  }
};

/**
 * Get Order Details
 * POST /api/order-details
 */
export const getOrderDetailsApi = async (orderIdOrParams) => {
  try {
    const token = await getToken();
    let orderId = orderIdOrParams;
    let optionalParams = {};

    if (typeof orderIdOrParams === "object" && orderIdOrParams !== null) {
      orderId = orderIdOrParams.order_id || orderIdOrParams.orderId || orderIdOrParams.id;
      optionalParams = orderIdOrParams;
    }

    // 1. FormData POST
    const formData = new FormData();
    formData.append("order_id", String(orderId));

    const response = await fetch(`${BASE_URL}order-details`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: formData,
    });

    let result = await response.json().catch(() => null);

    // 2. Fallback JSON POST if empty
    if (!result || (result.status !== 200 && !result.data && !result.data_order && !result.order)) {
      const jsonBody = {
        order_id: isNaN(orderId) ? orderId : Number(orderId),
        ...optionalParams,
      };

      const jsonRes = await fetch(`${BASE_URL}order-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(jsonBody),
      });

      const jsonResult = await jsonRes.json().catch(() => null);
      if (jsonResult) return jsonResult;
    }

    return result;
  } catch (error) {
    console.log("getOrderDetailsApi error:", error);
    throw error;
  }
};

/**
 * Return Order Request
 * POST /api/return-order
 */
export const returnOrderApi = async ({ order_id, user_id, reason, comment }) => {
  return await requestApi("return-order", {
    method: "POST",
    body: {
      order_id,
      user_id,
      reason,
      comment,
    },
    requiresAuth: true,
  });
};

/**
 * Create Cashfree Order
 * POST /api/payment/cashfree/create-order
 */
export const createCashfreeOrderApi = async (cashfreeBody) => {
  return await requestApi("payment/cashfree/create-order", {
    method: "POST",
    body: cashfreeBody,
    requiresAuth: true,
  });
};

// ================= REVIEWS APIS =================

/**
 * Submit Product Review
 * POST /api/review
 */
export const submitReviewApi = async ({
  order_id,
  product_id,
  rating,
  comment,
  photos = [],
  user_id = null,
}) => {
  const token = await getToken();
  const formData = new FormData();
  formData.append("order_id", String(order_id));
  formData.append("product_id", String(product_id));
  formData.append("rating", String(rating));
  formData.append("comment", String(comment || "").trim());
  if (user_id) formData.append("user_id", String(user_id));

  if (Array.isArray(photos)) {
    photos.forEach((uri, idx) => {
      formData.append(`photos[${idx}]`, {
        uri,
        type: "image/jpeg",
        name: `review_photo_${idx}.jpg`,
      });
    });
  }

  return await requestApi("review", {
    method: "POST",
    body: formData,
    token,
    requiresAuth: true,
  });
};

// ================= NOTIFICATIONS APIS =================

/**
 * Get Paginated Notifications
 * GET /api/notifications?page={page}
 */
export const getNotificationsApi = async (page = 1) => {
  return await requestApi(`notifications?page=${page}`, {
    method: "GET",
    requiresAuth: true,
  });
};

/**
 * Get Unread Notification Count
 * GET /api/notifications/unread-count
 */
export const getUnreadNotificationCountApi = async () => {
  return await requestApi("notifications/unread-count", {
    method: "GET",
    requiresAuth: true,
  });
};

/**
 * Mark Single Notification As Read
 * POST /api/notifications/read
 */
export const markNotificationReadApi = async (id) => {
  const formData = new FormData();
  formData.append("id", String(id));

  const res = await requestApi("notifications/read", {
    method: "POST",
    body: formData,
    requiresAuth: true,
  });

  if (res.ok && (res.data?.status === 200 || res.data?.status === "200")) {
    return res;
  }

  // Fallback JSON body
  return await requestApi("notifications/read", {
    method: "POST",
    body: { id },
    requiresAuth: true,
  });
};

/**
 * Mark All Notifications As Read
 * POST /api/notifications/read-all
 */
export const markAllNotificationsReadApi = async () => {
  return await requestApi("notifications/read-all", {
    method: "POST",
    body: {},
    requiresAuth: true,
  });
};