import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
  StatusBar,
  ToastAndroid,
  Platform,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import AllColors from '../../Constants/Color';
import { useTheme } from '../../Context/ThemeContext';

const COUPONS_DATA = [
  {
    id: '1',
    code: 'DEEBAZER50',
    discount: '50% OFF',
    title: 'Flat 50% Off on First Purchase',
    description: 'Use code DEEBAZER50 on orders above ₹499.',
    minSpend: 499,
    validTill: '31 Aug 2026',
    bgGradient: ['#F71670', '#E11D48'],
  },
  {
    id: '2',
    code: 'FESTIVE200',
    discount: '₹200 OFF',
    title: 'Festival Season Discount',
    description: 'Save flat ₹200 on all ethnic wear items.',
    minSpend: 999,
    validTill: '15 Aug 2026',
    bgGradient: ['#8B5CF6', '#6D28D9'],
  },
  {
    id: '3',
    code: 'FREESHIP',
    discount: 'FREE SHIPPING',
    title: 'Free Shipping Voucher',
    description: 'Get free delivery on any order with no minimum spend.',
    minSpend: 0,
    validTill: '30 Sep 2026',
    bgGradient: ['#10B981', '#059669'],
  },
  {
    id: '4',
    code: 'MEGA100',
    discount: '₹100 OFF',
    title: 'Super Saver Coupon',
    description: 'Enjoy ₹100 instant cashback on orders above ₹799.',
    minSpend: 799,
    validTill: '10 Aug 2026',
    bgGradient: ['#F59E0B', '#D97706'],
  },
];

export default function Coupons() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const [promoCode, setPromoCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  const copyCode = (code) => {
    Clipboard.setString(code);
    setCopiedCode(code);
    
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);

    const msg = `Copied coupon code: ${code}`;
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert('Copied!', msg);
    }
  };

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('Please enter a valid coupon code', ToastAndroid.SHORT);
      } else {
        Alert.alert('Invalid Code', 'Please enter a valid coupon code');
      }
      return;
    }

    const matched = COUPONS_DATA.find(
      (c) => c.code.toLowerCase() === promoCode.trim().toLowerCase()
    );

    if (matched) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(`🎉 Coupon ${matched.code} Applied Successfully!`, ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', `Coupon ${matched.code} Applied Successfully!`);
      }
    } else {
      if (Platform.OS === 'android') {
        ToastAndroid.show('❌ Invalid or expired coupon code', ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', 'Invalid or expired coupon code');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar backgroundColor={isDarkMode ? theme.cardBg : AllColors.white} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDarkMode ? '#334155' : undefined }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Apply Coupon</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={COUPONS_DATA}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.inputCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor, borderWidth: isDarkMode ? 1 : 0 }]}>
            <Text style={[styles.inputTitle, { color: theme.textPrimary }]}>Have a Promo Code?</Text>
            <View style={styles.inputRow}>
              <TextInput
                placeholder="Enter Promo Code"
                placeholderTextColor={isDarkMode ? '#94A3B8' : AllColors.slateLight}
                style={[styles.input, { backgroundColor: isDarkMode ? '#334155' : AllColors.screenBg, color: theme.textPrimary, borderColor: isDarkMode ? '#475569' : AllColors.lightGrey }]}
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={handleApplyPromo}
                activeOpacity={0.85}>
                <Text style={styles.applyBtnText}>APPLY</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const isCopied = copiedCode === item.code;
          return (
            <View style={[styles.couponCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor, borderWidth: isDarkMode ? 1 : 0 }]}>
              {/* Left Tag */}
              <View style={styles.leftTag}>
                <MaterialCommunityIcons name="ticket-percent-outline" size={26} color={AllColors.white} />
                <Text style={styles.discountText}>{item.discount}</Text>
              </View>

              {/* Right Details */}
              <View style={styles.rightContent}>
                <Text style={[styles.couponTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.couponDesc, { color: theme.textSecondary }]}>{item.description}</Text>

                <View style={styles.codeRow}>
                  <View style={[styles.codeBox, { backgroundColor: isDarkMode ? 'rgba(247, 22, 112, 0.2)' : AllColors.lightPink }]}>
                    <Text style={styles.codeText}>{item.code}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={() => copyCode(item.code)}
                    activeOpacity={0.8}>
                    <Feather 
                      name={isCopied ? "check" : "copy"} 
                      size={14} 
                      color={isCopied ? AllColors.greenLight : AllColors.primary} 
                      style={styles.iconMarginRight} 
                    />
                    <Text style={[styles.copyBtnText, isCopied && styles.copiedText]}>
                      {isCopied ? "COPIED" : "COPY"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.expiryText, { color: theme.textSecondary }]}>Valid till {item.validTill}</Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AllColors.screenBg,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AllColors.white,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AllColors.slateDark,
  },

  listContainer: {
    padding: 16,
  },

  inputCard: {
    backgroundColor: AllColors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  inputTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AllColors.slateHeader,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 46,
    backgroundColor: AllColors.screenBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AllColors.lightGrey,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    color: AllColors.slateDark,
  },
  applyBtn: {
    height: 46,
    paddingHorizontal: 20,
    backgroundColor: AllColors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: AllColors.white,
  },

  couponCard: {
    flexDirection: 'row',
    backgroundColor: AllColors.white,
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  leftTag: {
    width: 90,
    backgroundColor: AllColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '800',
    color: AllColors.white,
    marginTop: 6,
    textAlign: 'center',
  },

  rightContent: {
    flex: 1,
    padding: 14,
  },
  couponTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AllColors.slateDark,
  },
  couponDesc: {
    fontSize: 12,
    color: AllColors.slateSub,
    marginTop: 3,
    lineHeight: 16,
  },

  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  codeBox: {
    backgroundColor: AllColors.lightPink,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: AllColors.primary,
  },
  codeText: {
    fontSize: 13,
    fontWeight: '800',
    color: AllColors.primary,
    letterSpacing: 0.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: AllColors.primary,
  },

  expiryText: {
    fontSize: 11,
    color: AllColors.slateLight,
    marginTop: 8,
  },
  headerSpacer: {
    width: 40,
  },
  iconMarginRight: {
    marginRight: 4,
  },
  copiedText: {
    color: AllColors.greenLight,
  },
});
