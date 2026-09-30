jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCartSkuId,
  isCartItemMatching,
  syncCartItemsWithServer,
  updateLocalCartDetails,
} from '../sellerUtils';

describe('SKU cart identity', () => {
  it('does not treat a product ID as a SKU', () => {
    expect(getCartSkuId({ product_id: 55, id: 55 })).toBeNull();
    expect(getCartSkuId({ product_sku_id: 8 })).toBe('8');
    expect(getCartSkuId({ sku: { id: 9 } })).toBe('9');
  });

  it('matches cart entries by SKU, using seller IDs when both are available', () => {
    const firstSeller = { product_sku_id: 12, seller_id: 1 };
    expect(isCartItemMatching(firstSeller, { product_sku_id: 12, seller_id: 2 })).toBe(false);
    expect(isCartItemMatching(firstSeller, { product_sku_id: 12, seller_id: 1 })).toBe(true);
    expect(isCartItemMatching(firstSeller, { product_sku_id: 12 })).toBe(true);
    expect(isCartItemMatching(firstSeller, { product_sku_id: 13, seller_id: 1 })).toBe(false);
  });

  it('preserves locally known seller info when cart API omits seller ID', () => {
    const merged = syncCartItemsWithServer(
      [{ product_sku_id: 41, qty: 1 }],
      [{ product_sku_id: 41, seller_id: 3, name: 'SKU 41' }]
    );

    expect(merged).toEqual([
      { product_sku_id: 41, qty: 1, seller_id: 3, name: 'SKU 41' },
    ]);
  });

  it('keeps separate SKU details while syncing the cart', () => {
    const merged = syncCartItemsWithServer(
      [
        { product_sku_id: 21, qty: 1 },
        { product_sku_id: 22, qty: 1 },
      ],
      [
        { product_sku_id: 21, name: 'SKU 21' },
        { product_sku_id: 22, name: 'SKU 22' },
      ]
    );

    expect(merged.map((item) => item.name)).toEqual(['SKU 21', 'SKU 22']);
  });

  it('serializes concurrent local-cart additions without overwriting another SKU', async () => {
    let storedItems = '[]';
    AsyncStorage.getItem.mockImplementation(async () => storedItems);
    AsyncStorage.setItem.mockImplementation(async (_key, value) => {
      storedItems = value;
    });

    await Promise.all([
      updateLocalCartDetails((items) => [...items, { product_sku_id: 31 }]),
      updateLocalCartDetails((items) => [...items, { product_sku_id: 32 }]),
    ]);

    expect(JSON.parse(storedItems).map((item) => item.product_sku_id).sort()).toEqual([31, 32]);
  });
});
