import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  StatusBar,
  Linking,
  ToastAndroid,
  Platform,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import AllColors from '../../Constants/Color';
import { useTheme } from '../../Context/ThemeContext';

const FAQS = [
  {
    question: 'How do I track my order status?',
    answer: 'Go to your Account -> Orders page and click on the "Track Order" button next to your active order to see real-time updates.',
  },
  {
    question: 'What payment methods are supported?',
    answer: 'We support UPI, Razorpay, Debit/Credit Cards, Net Banking, Paytm, PhonePe, and Cash on Delivery (COD).',
  },
  {
    question: 'How can I return or exchange a product?',
    answer: 'You can request a return or exchange within 7 days of delivery through the Orders section or by contacting our support team.',
  },
  {
    question: 'When will I receive my refund?',
    answer: 'Once a returned item is inspected at our warehouse, your refund will be processed within 3-5 business days to your original payment method.',
  },
  {
    question: 'How to apply a promo coupon code?',
    answer: 'Enter your valid promo code in the "Have a Coupon Code" section during checkout or on the Coupons page before making payment.',
  },
];

export default function HelpCenter() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleFaq = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const filteredFaqs = FAQS.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContact = (type) => {
    if (type === 'call') {
      Linking.openURL('tel:+919876543210');
    } else if (type === 'whatsapp') {
      Linking.openURL('https://wa.me/919876543210');
    } else if (type === 'email') {
      Linking.openURL('mailto:support@deebazer.com');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={AllColors.slateDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Section */}
        <View style={styles.bannerCard}>
          <Text style={styles.bannerTitle}>How can we help you?</Text>
          <Text style={styles.bannerSubtitle}>
            Search our help center or select a topic below to get quick assistance.
          </Text>

          <View style={styles.searchBox}>
            <Feather name="search" size={18} color={AllColors.slateSub} />
            <TextInput
              placeholder="Search help topics..."
              placeholderTextColor={AllColors.slateLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* Contact Options */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactCard} onPress={handleCallSupport} activeOpacity={0.8}>
            <View style={[styles.iconCircle, { backgroundColor: AllColors.blueSoftBg }]}>
              <Ionicons name="call-outline" size={22} color={AllColors.blueSoftText} />
            </View>
            <Text style={styles.contactTitle}>Call Us</Text>
            <Text style={styles.contactSub}>24x7 Support</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleChatSupport} activeOpacity={0.8}>
            <View style={[styles.iconCircle, { backgroundColor: AllColors.greenSoftBg }]}>
              <Ionicons name="chatbubbles-outline" size={22} color={AllColors.greenLight} />
            </View>
            <Text style={styles.contactTitle}>Live Chat</Text>
            <Text style={styles.contactSub}>Instant help</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleEmailSupport} activeOpacity={0.8}>
            <View style={[styles.iconCircle, { backgroundColor: AllColors.softPinkBg }]}>
              <MaterialCommunityIcons name="email-outline" size={22} color={AllColors.primary} />
            </View>
            <Text style={styles.contactTitle}>Email Us</Text>
            <Text style={styles.contactSub}>Reply in 24h</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <View key={index} style={styles.faqCard}>
                  <TouchableOpacity
                    style={styles.faqHeader}
                    onPress={() => toggleFaq(index)}
                    activeOpacity={0.8}>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <AntDesign
                      name={isExpanded ? 'up' : 'down'}
                      size={14}
                      color={AllColors.slateSub}
                    />
                  </TouchableOpacity>
                  {isExpanded ? (
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  ) : null}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyFaq}>
              <Text style={styles.emptyText}>No matching questions found.</Text>
            </View>
          )}
        </View>
      </ScrollView>
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

  scrollContent: {
    padding: 16,
  },

  bannerCard: {
    backgroundColor: AllColors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: AllColors.white,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 6,
    lineHeight: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AllColors.white,
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
    marginTop: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: AllColors.slateDark,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AllColors.slateDark,
    marginBottom: 12,
  },

  contactRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  contactCard: {
    flex: 1,
    backgroundColor: AllColors.white,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    elevation: 2,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AllColors.slateHeader,
  },
  contactSub: {
    fontSize: 11,
    color: AllColors.slateLight,
    marginTop: 2,
  },

  faqList: {
    gap: 10,
  },
  faqCard: {
    backgroundColor: AllColors.white,
    borderRadius: 14,
    padding: 14,
    elevation: 1,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: AllColors.slateHeader,
    paddingRight: 10,
  },
  faqAnswer: {
    fontSize: 13,
    color: AllColors.slateSub,
    marginTop: 10,
    lineHeight: 19,
    borderTopWidth: 1,
    borderTopColor: AllColors.divider,
    paddingTop: 10,
  },

  emptyFaq: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: AllColors.slateLight,
  },
  headerSpacer: {
    width: 40,
  },
});
