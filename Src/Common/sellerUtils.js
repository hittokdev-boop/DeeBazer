import AsyncStorage from '@react-native-async-storage/async-storage';

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
      sellerInfo = extractSellerInfo(itemOrSeller);
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
export const checkDifferentSeller = (cartItems = [], targetProduct = null, cachedSeller = null) => {
  const targetSeller = extractSellerInfo(targetProduct);

  if (!targetSeller.sellerId && !targetSeller.sellerName) {
    return {
      isDifferent: false,
      cartSellerName: '',
      targetSellerName: '',
      targetSellerId: null,
    };
  }

  let cartSeller = null;
  if (Array.isArray(cartItems) && cartItems.length > 0) {
    for (const item of cartItems) {
      const info = extractSellerInfo(item);
      if (info.sellerId || info.sellerName) {
        cartSeller = info;
        break;
      }
    }
  }

  if (!cartSeller && cachedSeller && Array.isArray(cartItems) && cartItems.length > 0) {
    cartSeller = {
      sellerId: cachedSeller.sellerId !== null && cachedSeller.sellerId !== undefined ? String(cachedSeller.sellerId) : null,
      sellerName: String(cachedSeller.sellerName || '').trim(),
    };
  }

  if (!cartSeller || (!cartSeller.sellerId && !cartSeller.sellerName)) {
    return {
      isDifferent: false,
      cartSellerName: '',
      targetSellerName: targetSeller.sellerName,
      targetSellerId: targetSeller.sellerId,
    };
  }

  if (cartSeller.sellerId && targetSeller.sellerId) {
    const isDifferent = String(cartSeller.sellerId) !== String(targetSeller.sellerId);
    return {
      isDifferent,
      cartSellerName: cartSeller.sellerName,
      targetSellerName: targetSeller.sellerName,
      targetSellerId: targetSeller.sellerId,
    };
  }

  if (cartSeller.sellerName && targetSeller.sellerName) {
    const isDifferent = cartSeller.sellerName.toLowerCase() !== targetSeller.sellerName.toLowerCase();
    return {
      isDifferent,
      cartSellerName: cartSeller.sellerName,
      targetSellerName: targetSeller.sellerName,
      targetSellerId: targetSeller.sellerId,
    };
  }

  return {
    isDifferent: false,
    cartSellerName: cartSeller.sellerName || '',
    targetSellerName: targetSeller.sellerName || '',
    targetSellerId: targetSeller.sellerId,
  };
};

export default {
  extractSellerInfo,
  saveActiveCartSeller,
  getActiveCartSeller,
  clearActiveCartSeller,
  checkDifferentSeller,
};
