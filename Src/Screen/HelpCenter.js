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
import AllColors from '../Constants/Color';

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
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Support Banner */}
        <View style={styles.bannerCard}>
          <Text style={styles.bannerTitle}>How can we help you today?</Text>
          <Text style={styles.bannerSubtitle}>
            Find quick answers to your questions or get in touch with our customer service team.
          </Text>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#94A3B8" />
            <TextInput
              placeholder="Search help topics..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Quick Contact Options */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <View style={styles.contactRow}>
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => handleContact('call')}
            activeOpacity={0.8}>
            <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
              <Feather name="phone-call" size={20} color="#2563EB" />
            </View>
            <Text style={styles.contactTitle}>Call Us</Text>
            <Text style={styles.contactSub}>24x7 Assistance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => handleContact('whatsapp')}
            activeOpacity={0.8}>
            <View style={[styles.iconCircle, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="logo-whatsapp" size={22} color="#059669" />
            </View>
            <Text style={styles.contactTitle}>WhatsApp</Text>
            <Text style={styles.contactSub}>Instant Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => handleContact('email')}
            activeOpacity={0.8}>
            <View style={[styles.iconCircle, { backgroundColor: AllColors.lightPink || '#FCEBF5' }]}>
              <Feather name="mail" size={20} color={AllColors.primary} />
            </View>
            <Text style={styles.contactTitle}>Email Us</Text>
            <Text style={styles.contactSub}>Get Response</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs Accordion */}
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
                      color="#64748B"
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
    backgroundColor: '#F4F5F9',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
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
    color: '#0F172A',
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
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
    marginTop: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#0F172A',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },

  contactRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
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
    color: '#1E293B',
  },
  contactSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  faqList: {
    gap: 10,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
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
    color: '#1E293B',
    paddingRight: 10,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
    lineHeight: 19,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },

  emptyFaq: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
  },
});
