import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../Api/Api';

const ACTIVE_CART_SELLER_KEY = 'ACTIVE_CART_SELLER';

/**
 * Extracts seller ID and seller Name from any product or cart item object.
 */
export const extractSellerInfo = (item) => {
  if (!item || typeof item !== 'object') {
    return { sellerId: null, sellerName: '' };
  }

  const sellerId =
    item.seller_id ??
    item.sellerId ??
    item.seller?.id ??
    item.vendor_id ??
    item.user_id ??
    item.product?.seller_id ??
    item.product?.seller?.id ??
    null;

  const sellerName =
    item.seller_name ||
    item.sellerName ||
    item.seller?.name ||
    item.seller?.store_name ||
    item.seller?.shop_name ||
    item.product?.seller_name ||
    item.product?.seller?.name ||
    item.product?.seller?.shop_name ||
    item.vendor_name ||
    item.store_name ||
    item.shop_name ||
    '';

  return {
    sellerId: sellerId !== null && sellerId !== undefined ? String(sellerId) : null,
    sellerName: String(sellerName || '').trim(),
  };
};

/**
 * Fetches product details if seller info is missing from an item.
 */
export const resolveSellerInfo = async (itemOrId) => {
  if (!itemOrId) return { sellerId: null, sellerName: '' };

  // If already an object with seller info:
  if (typeof itemOrId === 'object') {
    const existing = extractSellerInfo(itemOrId);
    if (existing.sellerId || existing.sellerName) {
      return existing;
    }
  }

  const productId =
    typeof itemOrId === 'object'
      ? (itemOrId.product_id ?? itemOrId.id ?? itemOrId.product?.id)
      : itemOrId;

  if (!productId) return { sellerId: null, sellerName: '' };

  try {
    const formData = new FormData();
    formData.append('product_id', productId);
    const res = await fetch(`${BASE_URL}product-details`, {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    if (json?.data) {
      return extractSellerInfo(json.data);
    }
  } catch (e) {
    console.log('resolveSellerInfo error:', e);
  }

  return { sellerId: null, sellerName: '' };
};

/**
 * Saves the active cart's seller info in AsyncStorage.
 */
export const saveActiveCartSeller = async (itemOrSeller) => {
  try {
    if (!itemOrSeller) return;
    let sellerInfo;
    if (itemOrSeller.sellerId !== undefined || itemOrSeller.sellerName !== undefined) {
      sellerInfo = {
        sellerId: itemOrSeller.sellerId !== null && itemOrSeller.sellerId !== undefined ? String(itemOrSeller.sellerId) : null,
        sellerName: String(itemOrSeller.sellerName || '').trim(),
      };
    } else {
      sellerInfo = await resolveSellerInfo(itemOrSeller);
    }

    if (sellerInfo.sellerId || sellerInfo.sellerName) {
      await AsyncStorage.setItem(ACTIVE_CART_SELLER_KEY, JSON.stringify(sellerInfo));
    }
  } catch (error) {
    console.log('Error saving active cart seller:', error);
  }
};

/**
 * Retrieves the active cart's seller info from AsyncStorage.
 */
export const getActiveCartSeller = async () => {
  try {
    const data = await AsyncStorage.getItem(ACTIVE_CART_SELLER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.log('Error getting active cart seller:', error);
    return null;
  }
};

/**
 * Clears the active cart's seller info from AsyncStorage (e.g. when cart is emptied).
 */
export const clearActiveCartSeller = async () => {
  try {
    await AsyncStorage.removeItem(ACTIVE_CART_SELLER_KEY);
  } catch (error) {
    console.log('Error clearing active cart seller:', error);
  }
};

/**
 * Checks if targetProduct is from a different seller compared to the current cart.
 */
export const checkDifferentSeller = async (cartItems = [], targetProduct = null, cachedSeller = null) => {
  // Temporarily disable different seller check as requested
  return {
    isDifferent: false,
    cartSellerName: '',
    targetSellerName: '',
    targetSellerId: null,
  };
/*
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return {
      isDifferent: false,
      cartSellerName: '',
      targetSellerName: '',
      targetSellerId: null,
    };
  }


  let targetSeller = extractSellerInfo(targetProduct);
  if (!targetSeller.sellerId && !targetSeller.sellerName && targetProduct) {
    targetSeller = await resolveSellerInfo(targetProduct);
  }

  let cartSeller = null;
  for (const item of cartItems) {
    const info = extractSellerInfo(item);
    if (info.sellerId || info.sellerName) {
      cartSeller = info;
      break;
    }
  }

  if (!cartSeller && cachedSeller) {
    cartSeller = {
      sellerId: cachedSeller.sellerId !== null && cachedSeller.sellerId !== undefined ? String(cachedSeller.sellerId) : null,
      sellerName: String(cachedSeller.sellerName || '').trim(),
    };
  }

  // If still missing seller info for cart items, fetch details of first cart item
  if ((!cartSeller || (!cartSeller.sellerId && !cartSeller.sellerName)) && cartItems.length > 0) {
    const resolved = await resolveSellerInfo(cartItems[0]);
    if (resolved.sellerId || resolved.sellerName) {
      cartSeller = resolved;
      await saveActiveCartSeller(cartSeller);
    }
  }

  if (!cartSeller || (!cartSeller.sellerId && !cartSeller.sellerName)) {
    return {
      isDifferent: false,
      cartSellerName: '',
      targetSellerName: targetSeller.sellerName || '',
      targetSellerId: targetSeller.sellerId || null,
    };
  }

  if (!targetSeller || (!targetSeller.sellerId && !targetSeller.sellerName)) {
    return {
      isDifferent: false,
      cartSellerName: cartSeller.sellerName || '',
      targetSellerName: '',
      targetSellerId: null,
    };
  }

  if (cartSeller.sellerId && targetSeller.sellerId) {
    const isDifferent = String(cartSeller.sellerId) !== String(targetSeller.sellerId);
    return {
      isDifferent,
      cartSellerName: cartSeller.sellerName || `Seller #${cartSeller.sellerId}`,
      cartSellerId: cartSeller.sellerId || null,
      targetSellerName: targetSeller.sellerName || `Seller #${targetSeller.sellerId}`,
      targetSellerId: targetSeller.sellerId,
    };
  }

  if (cartSeller.sellerName && targetSeller.sellerName) {
    const isDifferent = cartSeller.sellerName.toLowerCase() !== targetSeller.sellerName.toLowerCase();
    return {
      isDifferent,
      cartSellerName: cartSeller.sellerName,
      cartSellerId: cartSeller.sellerId || null,
      targetSellerName: targetSeller.sellerName,
      targetSellerId: targetSeller.sellerId,
    };
  }

  return {
    isDifferent: false,
    cartSellerName: cartSeller.sellerName || '',
    cartSellerId: cartSeller.sellerId || null,
    targetSellerName: targetSeller.sellerName || '',
    targetSellerId: targetSeller.sellerId,
  };
*/
};

export default {
  extractSellerInfo,
  resolveSellerInfo,
  saveActiveCartSeller,
  getActiveCartSeller,
  clearActiveCartSeller,
  checkDifferentSeller,
};
