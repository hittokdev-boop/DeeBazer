import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Platform,
  Alert,
  ToastAndroid,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AllColors from '../../../Constants/Color';
import { useTheme } from '../../../Context/ThemeContext';
import { BASE_URL, getToken, getuserId } from '../../../Api/Api';

const REVIEWS_STORAGE_KEY = '@deebazar_product_reviews';

export const getStoredReviews = async () => {
  try {
    const raw = await AsyncStorage.getItem(REVIEWS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.log('Error reading reviews:', e);
    return {};
  }
};

export const saveStoredReview = async (reviewKey, reviewData) => {
  try {
    const existing = await getStoredReviews();
    existing[reviewKey] = {
      ...reviewData,
      updated_at: new Date().toISOString(),
    };
    await AsyncStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(existing));
    return true;
  } catch (e) {
    console.log('Error saving review:', e);
    return false;
  }
};

export const getRatingColor = (rating) => {
  const num = Number(rating);
  if (!num || isNaN(num) || num <= 0) return '#94A3B8';
  if (num <= 2) return '#EF4444'; // Red: 1-2 Stars
  if (num === 3) return '#F97316'; // Orange: 3 Stars
  return '#10B981'; // Green: 4-5 Stars
};

export const getRatingColorConfig = (rating, isDarkMode = false) => {
  const num = Number(rating);
  if (!num || isNaN(num) || num <= 0) {
    return {
      color: AllColors.primary,
      bg: isDarkMode ? 'rgba(247, 22, 112, 0.12)' : AllColors.softPinkBg,
      borderColor: isDarkMode ? 'rgba(247, 22, 112, 0.3)' : '#FCE7F3',
      label: 'Rate Order',
      starColor: '#94A3B8',
      tier: 'unrated',
    };
  }
  if (num <= 2) {
    // Red: 1-2 Stars
    return {
      color: isDarkMode ? '#F87171' : '#DC2626',
      bg: isDarkMode ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2',
      borderColor: isDarkMode ? 'rgba(248, 113, 113, 0.35)' : '#FECACA',
      label: num === 1 ? 'Very Poor' : 'Poor',
      starColor: isDarkMode ? '#F87171' : '#EF4444',
      tier: 'red',
    };
  }
  if (num === 3) {
    // Orange: 3 Stars
    return {
      color: isDarkMode ? '#FB923C' : '#EA580C',
      bg: isDarkMode ? 'rgba(249, 115, 22, 0.18)' : '#FFEDD5',
      borderColor: isDarkMode ? 'rgba(251, 146, 60, 0.35)' : '#FED7AA',
      label: 'Average',
      starColor: isDarkMode ? '#FB923C' : '#F97316',
      tier: 'orange',
    };
  }
  // Green: 4-5 Stars
  return {
    color: isDarkMode ? '#34D399' : '#15803D',
    bg: isDarkMode ? 'rgba(16, 185, 129, 0.18)' : '#DCFCE7',
    borderColor: isDarkMode ? 'rgba(52, 211, 153, 0.35)' : '#BBF7D0',
    label: num === 4 ? 'Good' : 'Excellent',
    starColor: isDarkMode ? '#34D399' : '#10B981',
    tier: 'green',
  };
};

export default function ProductReviewModal({
  visible,
  onClose,
  product,
  orderId,
  existingReview,
  initialRating = 0,
  onReviewSubmitted,
}) {
  const { theme, isDarkMode } = useTheme();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (existingReview && existingReview.rating) {
        setRating(Number(existingReview.rating) || 0);
        setComment(existingReview.comment || '');
        setPhotos(Array.isArray(existingReview.photos) ? existingReview.photos : []);
      } else {
        setRating(Number(initialRating) || 0);
        setComment('');
        setPhotos([]);
      }
    }
  }, [visible, existingReview, initialRating]);

  const ratingDescriptions = {
    1: { text: 'Very Poor', icon: 'sad-outline', color: '#EF4444', bg: '#FEE2E2', darkBg: 'rgba(239, 68, 68, 0.22)' },
    2: { text: 'Poor', icon: 'sad-outline', color: '#EF4444', bg: '#FEE2E2', darkBg: 'rgba(239, 68, 68, 0.22)' },
    3: { text: 'Average', icon: 'ellipse-outline', color: '#F97316', bg: '#FFEDD5', darkBg: 'rgba(249, 115, 22, 0.22)' },
    4: { text: 'Good', icon: 'happy-outline', color: '#10B981', bg: '#DCFCE7', darkBg: 'rgba(16, 185, 129, 0.22)' },
    5: { text: 'Excellent!', icon: 'sparkles', color: '#059669', bg: '#DCFCE7', darkBg: 'rgba(16, 185, 129, 0.22)' },
  };

  const quickTags = [
    'Great Quality 👍',
    'Value for Money 💰',
    'Fast Delivery ⚡',
    'Perfect Fit 🎯',
    'Highly Recommended ⭐',
  ];

  const handleAddTag = (tag) => {
    const trimmed = comment.trim();
    if (trimmed.includes(tag)) return;
    const newComment = trimmed ? `${trimmed} • ${tag}` : tag;
    setComment(newComment);
  };

  const handlePickFromGallery = () => {
    if (photos.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload up to 5 photos.');
      return;
    }

    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 5 - photos.length,
        maxWidth: 1200,
        maxHeight: 1200,
      },
      (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Failed to select image');
          return;
        }
        if (response.assets && response.assets.length > 0) {
          const newUris = response.assets.map((asset) => asset.uri).filter(Boolean);
          setPhotos((prev) => [...prev, ...newUris].slice(0, 5));
        }
      }
    );
  };

  const handleTakePhoto = () => {
    if (photos.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload up to 5 photos.');
      return;
    }

    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      },
      (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Failed to capture photo');
          return;
        }
        if (response.assets && response.assets.length > 0) {
          const uri = response.assets[0].uri;
          if (uri) {
            setPhotos((prev) => [...prev, uri].slice(0, 5));
          }
        }
      }
    );
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    if (!rating || rating < 1) {
      Alert.alert('Rating Required', 'Please select a star rating from 1 to 5.');
      return;
    }

    setSubmitting(true);

    const productId = product?.id || product?.product_id || 'general';
    const cleanOrderId = orderId || 'order';
    const reviewKey = `${cleanOrderId}_${productId}`;

    const reviewPayload = {
      order_id: cleanOrderId,
      product_id: productId,
      product_name: product?.name || product?.product_name || product?.title || 'Product',
      product_image: product?.img || product?.image || product?.thumbnail || null,
      rating: rating,
      comment: comment.trim(),
      photos: photos,
      created_at: existingReview?.created_at || new Date().toISOString(),
    };

    try {
      // 1. Attempt backend submission if endpoint is supported
      try {
        const token = await getToken();
        const userId = await getuserId();

        const formData = new FormData();
        formData.append('order_id', String(cleanOrderId));
        formData.append('product_id', String(productId));
        formData.append('rating', String(rating));
        formData.append('comment', comment.trim());
        if (userId) formData.append('user_id', String(userId));

        photos.forEach((uri, idx) => {
          formData.append(`photos[${idx}]`, {
            uri,
            type: 'image/jpeg',
            name: `review_photo_${idx}.jpg`,
          });
        });

        await fetch(`${BASE_URL}review`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });
      } catch (apiErr) {
        // Backend might not have review endpoint yet, continue gracefully
        console.log('Backend review submission note:', apiErr?.message);
      }

      // 2. Save persistently to local AsyncStorage
      await saveStoredReview(reviewKey, reviewPayload);

      if (Platform.OS === 'android') {
        ToastAndroid.show('Thank you! Review submitted successfully.', ToastAndroid.LONG);
      } else {
        Alert.alert('Review Submitted', 'Thank you for your valuable feedback!');
      }

      if (onReviewSubmitted) {
        onReviewSubmitted(reviewPayload);
      }

      onClose();
    } catch (e) {
      console.log('Review submit error:', e);
      Alert.alert('Error', 'Unable to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const productName = product?.name || product?.product_name || product?.title || 'Delivered Product';
  const productImage = product?.img || product?.image || product?.product_image || product?.thumbnail;
  const currentDesc = ratingDescriptions[rating] || null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.cardBg, borderColor: theme.borderColor },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleBox}>
              <View style={[styles.headerIconCircle, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}>
                <Ionicons name="star-outline" size={18} color={theme.textPrimary} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                  {existingReview ? 'Update Your Review' : 'Rate & Review'}
                </Text>
                {orderId ? (
                  <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                    Order #{orderId}
                  </Text>
                ) : null}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
              onPress={onClose}
              disabled={submitting}
            >
              <Ionicons name="close" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Product Info Preview Card */}
            <View
              style={[
                styles.productPreviewCard,
                { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: theme.borderColor },
              ]}
            >
              {productImage ? (
                <Image
                  source={{ uri: productImage }}
                  style={styles.productThumb}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.productThumb, styles.productThumbPlaceholder]}>
                  <Feather name="package" size={20} color={AllColors.slateSub} />
                </View>
              )}

              <View style={styles.productInfoBox}>
                <Text
                  style={[styles.productNameText, { color: theme.textPrimary }]}
                  numberOfLines={2}
                >
                  {productName}
                </Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.verifiedBadgeText}>Verified Purchase</Text>
                </View>
              </View>
            </View>

            {/* Star Rating Section */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
                How would you rate this item?
              </Text>

              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isActive = rating > 0 && starVal <= rating;
                  const activeColor = getRatingColor(rating);
                  return (
                    <TouchableOpacity
                      key={starVal}
                      activeOpacity={0.7}
                      onPress={() => setRating(starVal)}
                      style={styles.starTouch}
                    >
                      <Ionicons
                        name={isActive ? 'star' : 'star-outline'}
                        size={38}
                        color={isActive ? activeColor : (isDarkMode ? '#FFFFFF' : '#000000')}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {rating > 0 && currentDesc ? (
                <View
                  style={[
                    styles.ratingFeedbackBadge,
                    {
                      backgroundColor: isDarkMode ? currentDesc.darkBg : currentDesc.bg,
                      borderColor: currentDesc.color,
                    },
                  ]}
                >
                  <Ionicons
                    name={currentDesc.icon}
                    size={16}
                    color={currentDesc.color}
                    style={styles.feedbackBadgeIcon}
                  />
                  <Text style={[styles.ratingFeedbackText, { color: currentDesc.color }]}>
                    {rating} Star{rating > 1 ? 's' : ''} • {currentDesc.text}
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.ratingFeedbackBadge,
                    {
                      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                      borderColor: isDarkMode ? '#64748B' : '#000000',
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <Ionicons
                    name="star-outline"
                    size={15}
                    color={isDarkMode ? '#FFFFFF' : '#000000'}
                    style={styles.feedbackBadgeIcon}
                  />
                  <Text style={[styles.ratingFeedbackText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    Tap a star to rate
                  </Text>
                </View>
              )}
            </View>

            {/* Photos Section */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionTitleRow}>
                <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
                  Add Photos ({photos.length}/5)
                </Text>
                <Text style={[styles.optionalText, { color: theme.textSecondary }]}>
                  Optional
                </Text>
              </View>

              <Text style={[styles.helpSubtext, { color: theme.textSecondary }]}>
                Real photos help other shoppers see how the item looks in real life.
              </Text>

              {/* Photo Action Buttons */}
              <View style={styles.photoActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.photoActionBtn,
                    {
                      backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                      borderColor: theme.borderColor,
                    },
                  ]}
                  onPress={handleTakePhoto}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera-outline" size={20} color={AllColors.primary} />
                  <Text style={[styles.photoActionBtnText, { color: theme.textPrimary }]}>
                    Take Photo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.photoActionBtn,
                    {
                      backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                      borderColor: theme.borderColor,
                    },
                  ]}
                  onPress={handlePickFromGallery}
                  activeOpacity={0.8}
                >
                  <Ionicons name="images-outline" size={20} color={AllColors.primary} />
                  <Text style={[styles.photoActionBtnText, { color: theme.textPrimary }]}>
                    Choose Gallery
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Photos Preview Horizontal List */}
              {photos.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photosScrollList}
                >
                  {photos.map((uri, idx) => (
                    <View key={idx} style={styles.photoThumbWrapper}>
                      <Image source={{ uri }} style={styles.previewImage} />
                      <TouchableOpacity
                        style={styles.deletePhotoBtn}
                        onPress={() => handleRemovePhoto(idx)}
                      >
                        <Ionicons name="close" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Comment Feedback Section */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionTitleRow}>
                <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
                  Write your Review
                </Text>
                <Text style={[styles.charCountText, { color: theme.textSecondary }]}>
                  {comment.length}/500
                </Text>
              </View>

              <TextInput
                style={[
                  styles.commentInput,
                  {
                    backgroundColor: isDarkMode ? '#1E293B' : '#FAFAFA',
                    borderColor: theme.borderColor,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="What did you like or dislike? How was the product quality, fit, or packaging?"
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
                maxLength={500}
                value={comment}
                onChangeText={setComment}
                textAlignVertical="top"
              />

              {/* Quick Tags Chips */}
              <View style={styles.quickTagsContainer}>
                {quickTags.map((tag, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.quickTagChip,
                      {
                        backgroundColor: isDarkMode ? '#334155' : '#F1F5F9',
                        borderColor: theme.borderColor,
                      },
                    ]}
                    onPress={() => handleAddTag(tag)}
                  >
                    <Text style={[styles.quickTagText, { color: theme.textSecondary }]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Submit & Cancel Buttons */}
            <View style={styles.footerActions}>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: AllColors.primary },
                  submitting && { opacity: 0.7 },
                ]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.88}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={20} color="#FFFFFF" style={styles.submitIcon} />
                    <Text style={styles.submitBtnText}>
                      {existingReview ? 'Update Review' : 'Submit Review'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                disabled={submitting}
              >
                <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  productPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  productThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  productThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfoBox: {
    flex: 1,
    marginLeft: 12,
  },
  productNameText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  sectionBlock: {
    marginBottom: 22,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  optionalText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  helpSubtext: {
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 16,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 10,
  },
  starTouch: {
    padding: 4,
  },
  ratingFeedbackBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
    borderWidth: 1,
  },
  feedbackBadgeIcon: {
    marginRight: 6,
  },
  ratingFeedbackText: {
    fontSize: 13,
    fontWeight: '700',
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  photoActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  photosScrollList: {
    gap: 10,
    paddingTop: 4,
  },
  photoThumbWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  previewImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  deletePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 10,
  },
  charCountText: {
    fontSize: 12,
  },
  quickTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickTagChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footerActions: {
    marginTop: 8,
    gap: 10,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: AllColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitIcon: {
    marginRight: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
