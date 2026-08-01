import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert as RNAlert,
  Modal,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AllColors from '../../Constants/Color';
import CustomLoader from '../../Common/Loader';
import { BASE_URL, getToken, removemobile, removeToken, removeuserId, getPassword, removePassword } from '../../Api/Api';
import CustomAlert from '../../Common/Alert';
import SuccessModal from '../../Common/SuccessScreen';
import { useTheme } from '../../Context/ThemeContext';

export default function Account() {
  const { isDarkMode, toggleDarkMode, theme } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);

  const deleteReasons = [
    "I don't use this app anymore",
    "I have another account",
    "Privacy concerns",
    "Meri Marzi",
    "Other"
  ];

  const Navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);


  useFocusEffect(
    React.useCallback(() => {
      checkLogin();
    }, [])
  );

  const handleNavigate = (screenName) => {
    try {
      const parent = Navigation.getParent ? Navigation.getParent() : null;
      if (parent && parent.navigate) {
        parent.navigate(screenName);
      } else {
        Navigation.navigate(screenName);
      }
    } catch (e) {
      console.log('Nav error:', e);
      try {
        Navigation.navigate(screenName);
      } catch (err) {
        console.log('Direct nav error:', err);
      }
    }
  };

  const goToWishList = () => handleNavigate('Wishlist');
  const goToOrders = () => handleNavigate('Orders');
  const goToCoupons = () => handleNavigate('Coupons');
  const goToHelpCenter = () => handleNavigate('HelpCenter');
  const gotoEditProfile = () => handleNavigate('editProfile');
  const gotoSaveAddress = () => handleNavigate('AllAddress');

  const checkLogin = async () => {
    try {
      const token = await getToken();
      if (token) {
        setIsLoggedIn(true);
        const response = await fetch(`${BASE_URL}me`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.status === 200 && data.user) {
          setUserName(data.user.name || 'User');
          setUserEmail(data.user.email || '');
        }
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const requestForLogout = async () => {
    const token = await getToken();
    if (!token || token === null) {
      setErrorText('You are already logged out.');
      setShowAlert(true);
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setIsSuccess(true);
        await removeToken();
        await removemobile();
        await removeuserId();
        await removePassword();
        setIsLoggedIn(false);
      }
    } catch (error) {
      setErrorText('Something went wrong. Please try again.');
      setShowAlert(true);
    }
  };

  const requestForDeleteAccount = async () => {
    const token = await getToken();
    if (!token || token === null) {
      setErrorText('You are not logged in.');
      setShowAlert(true);
      return;
    }

    const savedPassword = await getPassword();

    try {
      const formData = new FormData();
      formData.append('email', userEmail);
      formData.append('password', savedPassword || '');

      const response = await fetch(`${BASE_URL}destroy-account`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        await removeToken();
        await removemobile();
        await removeuserId();
        await removePassword();
        setIsLoggedIn(false);

        setErrorText('Account deleted successfully. You have been signed out.');
        setShowAlert(true);

        setTimeout(() => {
          setShowAlert(false);
          Navigation.reset({
            index: 0,
            routes: [{ name: 'AppTab' }],
          });
        }, 1500);

      } else {
        let errorMsg = data.message || 'Failed to delete account.';
        if (data.errors) {
          const firstErrorKey = Object.keys(data.errors)[0];
          if (firstErrorKey) {
            errorMsg = data.errors[firstErrorKey][0] || errorMsg;
          }
        }
        setErrorText(errorMsg);
        setShowAlert(true);
      }
    } catch (error) {
      setErrorText('Something went wrong. Please try again.');
      setShowAlert(true);
    }
  };

  const confirmDeleteAccount = () => {
    setSelectedReason(null);
    setIsDeleteModalVisible(true);
  };

  if (loading) {
    return <CustomLoader visible={loading} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <Text style={[styles.headerText, { color: theme.headerText }]}>My Account</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {!isLoggedIn ? (
          /* LOGGED OUT BANNER */
          <View style={[styles.loginBanner, { backgroundColor: theme.bannerBg }]}>
            <View style={styles.avatarCircle}>
              <AntDesign name="user" size={34} color={AllColors.white} />
            </View>
            <Text style={styles.loginTitle}>Welcome to DeeBazer</Text>
            <Text style={styles.loginSubtitle}>
              Login to manage orders, wishlist and account settings.
            </Text>
            <TouchableOpacity
              style={styles.loginBtn}
              activeOpacity={0.8}
              onPress={() => Navigation.navigate('Login')}>
              <Text style={styles.loginBtnText}>Login / Sign Up</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* LOGGED IN USER INFO HEADER */
          <View style={[styles.content, { backgroundColor: theme.cardBg, borderBottomColor: theme.divider }]}>
            <Text style={[styles.userName, { color: theme.textPrimary }]}>Hey! {userName}</Text>
          </View>
        )}

        {/* QUICK MENU GRID / BUTTONS */}
        <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Quick Access</Text>
          <View style={styles.gridContainer}>
            <TouchableOpacity
              style={[styles.box, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}
              activeOpacity={0.7}
              onPress={goToOrders}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={28}
                color={theme.iconPrimary}
              />
              <Text style={[styles.boxText, { color: theme.textSecondary }]}>Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.box, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}
              activeOpacity={0.7}
              onPress={goToWishList}>
              <AntDesign
                name="hearto"
                size={26}
                color={theme.iconPrimary}
              />
              <Text style={[styles.boxText, { color: theme.textSecondary }]}>Wishlist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.box, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}
              activeOpacity={0.7}
              onPress={goToCoupons}>
              <MaterialCommunityIcons
                name="ticket-percent-outline"
                size={28}
                color={theme.iconPrimary}
              />
              <Text style={[styles.boxText, { color: theme.textSecondary }]}>Coupons</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.box, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}
              activeOpacity={0.7}
              onPress={goToHelpCenter}>
              <Feather
                name="headphones"
                size={26}
                color={theme.iconPrimary}
              />
              <Text style={[styles.boxText, { color: theme.textSecondary }]}>Help Center</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PREFERENCES & THEME */}
        <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>App Theme</Text>

          {/* Light/Dark mode buttons removed */}

          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={styles.rowLeft}>
              <Ionicons
                name={isDarkMode ? "moon" : "sunny"}
                size={22}
                color={theme.iconPrimary}
              />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.rowText, { color: theme.textSecondary, marginLeft: 0 }]}>Theme Preference</Text>
                <Text style={{ fontSize: 12, color: theme.modalSubText, marginTop: 2 }}>
                  {isDarkMode ? 'Dark theme active' : 'Light theme active'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#CBD5E1', true: AllColors.primary }}
              thumbColor={isDarkMode ? '#FFFFFF' : '#F1F5F9'}
            />
          </View>
        </View>


        {/* ACCOUNT SETTINGS (Only if logged in) */}
        {isLoggedIn && (
          <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Account Settings</Text>
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: theme.divider }]}
              activeOpacity={0.7}
              onPress={gotoEditProfile}>
              <View style={styles.rowLeft}>
                <AntDesign name="user" size={22} color={theme.iconPrimary} />
                <Text style={[styles.rowText, { color: theme.textSecondary }]}>Edit Profile</Text>
              </View>
              <AntDesign name="right" size={18} color={theme.modalSubText} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.row, { borderBottomColor: theme.divider }]}
              activeOpacity={0.7}
              onPress={gotoSaveAddress}>
              <View style={styles.rowLeft}>
                <Ionicons name="location-outline" size={22} color={theme.iconPrimary} />
                <Text style={[styles.rowText, { color: theme.textSecondary }]}>Saved Address</Text>
              </View>
              <AntDesign name="right" size={18} color={theme.modalSubText} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.row, { borderBottomColor: theme.divider }]}
              activeOpacity={0.7}
              onPress={confirmDeleteAccount}>
              <View style={styles.rowLeft}>
                <AntDesign name="delete" size={22} color={theme.iconPrimary} />
                <Text style={[styles.rowText, { color: theme.textSecondary }]}>Delete Account</Text>
              </View>
              <AntDesign name="right" size={18} color={theme.modalSubText} />
            </TouchableOpacity>
          </View>
        )}

        {/* FEEDBACK & SUPPORT */}
        <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Feedback & Support</Text>

          <TouchableOpacity
            style={[styles.row, { borderBottomColor: theme.divider }]}
            activeOpacity={0.7}
            onPress={goToCoupons}>
            <View style={styles.rowLeft}>
              <MaterialCommunityIcons name="ticket-percent-outline" size={22} color={theme.iconPrimary} />
              <Text style={[styles.rowText, { color: theme.textSecondary }]}>Coupons & Offers</Text>
            </View>
            <AntDesign name="right" size={18} color={theme.modalSubText} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { borderBottomColor: theme.divider }]}
            activeOpacity={0.7}
            onPress={goToHelpCenter}>
            <View style={styles.rowLeft}>
              <AntDesign name="questioncircleo" size={22} color={theme.iconPrimary} />
              <Text style={[styles.rowText, { color: theme.textSecondary }]}>Browse FAQs</Text>
            </View>
            <AntDesign name="right" size={18} color={theme.modalSubText} />
          </TouchableOpacity>
        </View>

        {/* LOGOUT BUTTON (Only if logged in) */}
        {isLoggedIn && (
          <View style={styles.logoutContainer}>
            <TouchableOpacity
              style={[styles.logoutBtn, { backgroundColor: theme.cardBg, borderColor: theme.iconPrimary }]}
              activeOpacity={0.7}
              onPress={requestForLogout}>
              <Text style={[styles.logoutText, { color: theme.iconPrimary }]}>Log Out</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <CustomAlert
        visible={showAlert}
        message={errorText}
        onClose={() => setShowAlert(false)}
      />
      <SuccessModal
        visible={isSuccess}
        title="Logout Successful"
        message="You have been logged out successfully."
        onClose={() => setIsSuccess(false)}
      />

      <Modal
        visible={isDeleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.modalBg }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Delete Account</Text>
            <Text style={[styles.modalSub, { color: theme.modalSubText }]}>Please select a reason for deleting your account:</Text>
            {deleteReasons.map((reason, index) => (
              <TouchableOpacity
                key={index}
                style={styles.radioRow}
                onPress={() => setSelectedReason(reason)}
                activeOpacity={0.7}
              >
                <View style={[styles.radioCircle, { borderColor: theme.iconPrimary }]}>
                  {selectedReason === reason && <View style={[styles.radioInner, { backgroundColor: theme.iconPrimary }]} />}
                </View>
                <Text style={[styles.radioText, { color: theme.textSecondary }]}>{reason}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: theme.modalSubText }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalDeleteBtn, !selectedReason && { opacity: 0.5 }]}
                disabled={!selectedReason}
                onPress={() => {
                  setIsDeleteModalVisible(false);
                  requestForDeleteAccount();
                }}
              >
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F9',
  },
  header: {
    backgroundColor: AllColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  headerText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
  },

  loginBanner: {
    backgroundColor: AllColors.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 10,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginTitle: {
    color: AllColors.white,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
  },
  loginSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
    fontSize: 14,
  },
  loginBtn: {
    backgroundColor: AllColors.white,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  loginBtnText: {
    color: AllColors.primary,
    fontSize: 16,
    fontWeight: '700',
  },

  content: {
    backgroundColor: AllColors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: AllColors.divider,
  },
  userName: {
    fontSize: 20,
    color: AllColors.slateDark,
    fontWeight: '700',
  },

  section: {
    backgroundColor: AllColors.white,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    color: AllColors.slateDark,
    marginBottom: 14,
    fontWeight: '700',
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  box: {
    width: '48%',
    height: 64,
    borderWidth: 1,
    borderColor: AllColors.lightGrey,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    backgroundColor: AllColors.white,
    elevation: 1,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  boxText: {
    fontSize: 15,
    marginLeft: 10,
    color: AllColors.slateText,
    fontWeight: '600',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AllColors.divider,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowText: {
    fontSize: 15,
    color: AllColors.slateText,
    marginLeft: 12,
    fontWeight: '500',
  },

  logoutContainer: {
    marginTop: 14,
    paddingHorizontal: 16,
  },
  logoutBtn: {
    height: 48,
    borderWidth: 1.5,
    borderColor: AllColors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AllColors.white,
  },
  logoutText: {
    fontSize: 16,
    color: AllColors.primary,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: AllColors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: AllColors.white,
    width: '85%',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: AllColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AllColors.slateDark,
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 14,
    color: AllColors.slateSub,
    marginBottom: 20,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  radioCircle: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: AllColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: AllColors.primary,
  },
  radioText: {
    fontSize: 15,
    color: AllColors.slateText,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  modalCancelText: {
    color: AllColors.slateSub,
    fontSize: 15,
    fontWeight: '600',
  },
  modalDeleteBtn: {
    backgroundColor: AllColors.redLight,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  modalDeleteText: {
    color: AllColors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
  themeToggleContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginTop: 4,
    marginBottom: 10,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});