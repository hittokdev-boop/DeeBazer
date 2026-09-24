import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  ToastAndroid,
  StatusBar,
  DeviceEventEmitter,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL, getToken, setMobile as setStoredMobile } from '../../../Api/Api';
import AllColors from '../../../Constants/Color';
import { useTheme } from '../../../Context/ThemeContext';

const DEFAULT_AVATAR =
  'https://www.vhv.rs/dpng/d/409-4090121_transparent-background-user-icon-hd-png-download.png';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();

  // Basic Info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Contact Info
  const [mobile, setMobileState] = useState('');
  const [alternativePhone, setAlternativePhone] = useState('');


  // Avatar & Image Picker
  const [profileImage, setProfileImage] = useState(DEFAULT_AVATAR);
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${BASE_URL}me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await response.json();
      if ((data?.status === 200 || data?.success || response.ok) && data.user) {
        const u = data.user;
        setName(u.name || '');
        setEmail(u.email || '');
        setMobileState(u.mobile || u.phone || '');
        setAlternativePhone(
          u.alternativePhone || u.alternative_phone || u.alt_phone || ''
        );
        const avatarUrl =
          u.avatar || u.logo || u.image || u.profile_photo;
        if (avatarUrl) {
          setProfileImage(avatarUrl);
        }
      }
    } catch (error) {
      console.log('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.85,
        maxWidth: 1000,
        maxHeight: 1000,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          Alert.alert(
            'Image Error',
            response.errorMessage || 'Unable to pick image'
          );
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setSelectedImageFile(asset);
          setProfileImage(asset.uri);
        }
      }
    );
  };

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter your full name.');
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Please log in to update your profile.');
        setSaving(false);
        return;
      }

      // Prepare FormData according to API documentation
      // POST {{base_url}}api/user/profile
      // Header: Authorization: Bearer {token}
      const formData = new FormData();
      formData.append('name', name.trim());

      if (email.trim()) {
        formData.append('email', email.trim());
      }
      if (mobile.trim()) {
        formData.append('mobile', mobile.trim());
      }
      if (alternativePhone.trim()) {
        formData.append('alternativePhone', alternativePhone.trim());
      }
      // Append image file if picked
      if (selectedImageFile && selectedImageFile.uri) {
        const fileUri =
          Platform.OS === 'android'
            ? selectedImageFile.uri
            : selectedImageFile.uri.replace('file://', '');

        const fileName =
          selectedImageFile.fileName ||
          `avatar_${Date.now()}.${selectedImageFile.type?.split('/')[1] || 'jpg'}`;

        const fileType = selectedImageFile.type || 'image/jpeg';

        formData.append('logo', {
          uri: fileUri,
          name: fileName,
          type: fileType,
        });
      }

      console.log('Sending Profile Update FormData...');

      const response = await fetch(`${BASE_URL}user/profile`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          // Do NOT explicitly set 'Content-Type', fetch sets multipart/form-data with boundary
        },
        body: formData,
      });

      const responseText = await response.text();
      let data = {};
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.log('JSON parse error from user/profile:', responseText);
      }

      console.log('Profile Update Response:', data);

      if (response.ok || data?.status === 200 || data?.success) {
        // Update stored mobile in AsyncStorage if returned or changed
        const updatedMobile = data?.user?.mobile || mobile.trim();
        if (updatedMobile) {
          await setStoredMobile(updatedMobile);
        }

        // Update local avatar state if updated URL returned
        if (data?.user?.avatar || data?.user?.logo) {
          setProfileImage(data.user.avatar || data.user.logo);
        }

        // Notify other screens of profile update
        DeviceEventEmitter.emit('USER_PROFILE_UPDATED', data?.user);

        if (Platform.OS === 'android') {
          ToastAndroid.show(
            data?.message || 'Profile updated successfully! 🎉',
            ToastAndroid.SHORT
          );
        }

        Alert.alert(
          'Success',
          data?.message || 'Profile updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', data?.message || 'Failed to update profile.');
      }
    } catch (error) {
      console.log('Update Profile Error:', error);
      Alert.alert('Error', 'Network error. Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
            borderBottomColor: theme.divider,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backBtn,
            { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' },
          ]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Edit Profile
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AllColors.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading profile...
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: profileImage }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.cameraBtn}
                onPress={handlePickImage}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="camera"
                  size={18}
                  color={AllColors.white}
                />
              </TouchableOpacity>
            </View>
            <Text
              style={[styles.changePhotoText, { color: theme.textSecondary }]}
            >
              Tap camera icon to change profile photo
            </Text>
          </View>

          {/* Section 1: Basic Information */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor,
                borderWidth: isDarkMode ? 1 : 0,
              },
            ]}
          >
            <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
              Basic Information
            </Text>

            {/* FULL NAME */}
            <View style={styles.inputBox}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                Full Name *
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDarkMode
                      ? '#334155'
                      : AllColors.screenBg,
                    borderColor: isDarkMode
                      ? '#475569'
                      : AllColors.lightGrey,
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={isDarkMode ? '#94A3B8' : AllColors.slateSub}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor={
                    isDarkMode ? '#94A3B8' : AllColors.slateLight
                  }
                  style={[styles.input, { color: theme.textPrimary }]}
                />
              </View>
            </View>

            {/* EMAIL */}
            <View style={styles.inputBox}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                Email Address
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDarkMode
                      ? '#334155'
                      : AllColors.screenBg,
                    borderColor: isDarkMode
                      ? '#475569'
                      : AllColors.lightGrey,
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={isDarkMode ? '#94A3B8' : AllColors.slateSub}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email address"
                  placeholderTextColor={
                    isDarkMode ? '#94A3B8' : AllColors.slateLight
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.input, { color: theme.textPrimary }]}
                />
              </View>
            </View>
          </View>

          {/* Section 2: Contact Numbers */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor,
                borderWidth: isDarkMode ? 1 : 0,
                marginTop: 16,
              },
            ]}
          >
            <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
              Contact Details
            </Text>

            {/* PRIMARY MOBILE */}
            <View style={styles.inputBox}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                Mobile Number
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDarkMode
                      ? '#334155'
                      : AllColors.screenBg,
                    borderColor: isDarkMode
                      ? '#475569'
                      : AllColors.lightGrey,
                  },
                ]}
              >
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={isDarkMode ? '#94A3B8' : AllColors.slateSub}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={mobile}
                  onChangeText={(text) =>
                    setMobileState(text.replace(/[^0-9]/g, '').slice(0, 10))
                  }
                  placeholder="Enter 10-digit mobile number"
                  placeholderTextColor={
                    isDarkMode ? '#94A3B8' : AllColors.slateLight
                  }
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={[styles.input, { color: theme.textPrimary }]}
                />
              </View>
            </View>

            {/* ALTERNATIVE PHONE */}
            <View style={styles.inputBox}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                Alternative Phone Number
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDarkMode
                      ? '#334155'
                      : AllColors.screenBg,
                    borderColor: isDarkMode
                      ? '#475569'
                      : AllColors.lightGrey,
                  },
                ]}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={18}
                  color={isDarkMode ? '#94A3B8' : AllColors.slateSub}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={alternativePhone}
                  onChangeText={(text) =>
                    setAlternativePhone(
                      text.replace(/[^0-9]/g, '').slice(0, 10)
                    )
                  }
                  placeholder="Enter alternative mobile number"
                  placeholderTextColor={
                    isDarkMode ? '#94A3B8' : AllColors.slateLight
                  }
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={[styles.input, { color: theme.textPrimary }]}
                />
              </View>
            </View>
          </View>

          {/* SAVE BUTTON */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={onSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <View style={styles.savingRow}>
                <ActivityIndicator size="small" color={AllColors.white} />
                <Text style={styles.saveText}>Saving...</Text>
              </View>
            ) : (
              <Text style={styles.saveText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 38,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    width: 104,
    height: 104,
  },
  avatarImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: AllColors.primary,
    backgroundColor: AllColors.lightGrey,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: AllColors.primary,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: AllColors.white,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  formCard: {
    borderRadius: 16,
    padding: 18,
    elevation: 2,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  inputBox: {
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  saveBtn: {
    height: 52,
    backgroundColor: AllColors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    elevation: 3,
    shadowColor: AllColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveText: {
    color: AllColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});