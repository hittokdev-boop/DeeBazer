import React from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AllColors from '../Constants/Color';
import { useTheme } from '../Context/ThemeContext';

const { width } = Dimensions.get('window');

export default function DifferentSellerModal({
  visible = false,
  cartSellerName = '',
  cartSellerId = null,
  targetSellerName = '',
  targetSellerId = null,
  targetProduct = null,
  onClose,
  onViewSellerProducts,
}) {
  let theme = { modalBg: '#FFFFFF', textPrimary: '#0F172A', textSecondary: '#64748B', borderColor: '#E2E8F0' };
  let isDarkMode = false;
  try {
    const themeContext = useTheme();
    if (themeContext) {
      theme = themeContext.theme || theme;
      isDarkMode = themeContext.isDarkMode || false;
    }
  } catch (e) {
    // fallback if outside context
  }

  if (!visible) return null;

  const displayCartSeller = cartSellerName || 'Current Seller';
  const displayTargetSeller = targetSellerName || 'This Seller';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.card,
            {
              backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              borderColor: isDarkMode ? '#334155' : '#F1F5F9',
            },
          ]}
        >
          {/* Header Icon Container */}
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: isDarkMode ? 'rgba(234, 88, 12, 0.18)' : '#FFF7ED',
                borderColor: isDarkMode ? '#EA580C' : '#FFEDD5',
              },
            ]}
          >
            <Ionicons name="storefront" size={32} color="#EA580C" />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>
            Different Seller Alert
          </Text>

          {/* Subtitle Badge */}
          <View style={[styles.policyBadge, { backgroundColor: isDarkMode ? '#334155' : '#F8FAFC' }]}>
            <Ionicons name="information-circle-outline" size={14} color="#EA580C" style={{ marginRight: 4 }} />
            <Text style={[styles.policyBadgeText, { color: isDarkMode ? '#CBD5E1' : '#64748B' }]}>
              Single Seller Order Policy
            </Text>
          </View>

          {/* Description Card */}
          <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#0F172A' : '#FAFAFA', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
            <View style={styles.sellerRow}>
              <View style={[styles.sellerDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={[styles.sellerLabel, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>Cart Items From:</Text>
              <Text style={[styles.sellerValue, { color: '#3B82F6', fontWeight: '700' }]} numberOfLines={1}>
                {displayCartSeller}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]} />

            <View style={styles.sellerRow}>
              <View style={[styles.sellerDot, { backgroundColor: '#EA580C' }]} />
              <Text style={[styles.sellerLabel, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>New Item Seller:</Text>
              <Text style={[styles.sellerValue, { color: '#EA580C', fontWeight: '700' }]} numberOfLines={1}>
                {displayTargetSeller}
              </Text>
            </View>
          </View>

          {/* Message Text */}
          <Text style={[styles.message, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
            You can only order items from one seller at a time. Clear your cart to order from {displayTargetSeller}, or explore more products from{' '}
            <Text style={{ fontWeight: '700', color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>{displayCartSeller}</Text>.
          </Text>

          {/* Buttons Stack */}
          <View style={styles.buttonStack}>
            {/* View Current/Old Seller Products Button */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: AllColors.primary || '#EA580C' }]}
              activeOpacity={0.85}
              onPress={() => {
                if (onViewSellerProducts) onViewSellerProducts();
              }}
            >
              <MaterialCommunityIcons name="store-search-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText} numberOfLines={1}>
                View {displayCartSeller}'s Products
              </Text>
            </TouchableOpacity>

            {/* Cancel / Dismiss Button */}
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: isDarkMode ? '#334155' : '#F1F5F9',
                  borderColor: isDarkMode ? '#475569' : '#E2E8F0',
                },
              ]}
              activeOpacity={0.8}
              onPress={onClose}
            >
              <Text style={[styles.secondaryButtonText, { color: isDarkMode ? '#CBD5E1' : '#475569' }]}>
                Got It, Keep Cart
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: width * 0.9,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  policyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  policyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoBox: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  sellerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  sellerLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginRight: 6,
  },
  sellerValue: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  message: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonStack: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
