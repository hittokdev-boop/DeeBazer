import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AllColors from '../Constants/Color';
import CustomLoader from '../Common/Loader';
import { BASE_URL, getToken, removemobile, removeToken, removeuserId } from '../Api/Api';
import CustomAlert from '../Common/Alert';
import SuccessModal from './../Common/SuccessScreen';

export default function Account() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

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
        setIsLoggedIn(false);
      }
    } catch (error) {
      setErrorText('Something went wrong. Please try again.');
      setShowAlert(true);
    }
  };

  if (loading) {
    return <CustomLoader visible={loading} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerText}>My Account</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {!isLoggedIn ? (
          /* LOGGED OUT BANNER */
          <View style={styles.loginBanner}>
            <View style={styles.avatarCircle}>
              <AntDesign name="user" size={34} color="#fff" />
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
          <View style={styles.content}>
            <Text style={styles.userName}>Hey! Hittok</Text>
          </View>
        )}

        {/* QUICK MENU GRID / BUTTONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.gridContainer}>
            <TouchableOpacity
              style={styles.box}
              activeOpacity={0.7}
              onPress={goToOrders}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={28}
                color={AllColors.primary}
              />
              <Text style={styles.boxText}>Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.box}
              activeOpacity={0.7}
              onPress={goToWishList}>
              <AntDesign
                name="hearto"
                size={26}
                color={AllColors.primary}
              />
              <Text style={styles.boxText}>Wishlist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.box}
              activeOpacity={0.7}
              onPress={goToCoupons}>
              <MaterialCommunityIcons
                name="ticket-percent-outline"
                size={28}
                color={AllColors.primary}
              />
              <Text style={styles.boxText}>Coupons</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.box}
              activeOpacity={0.7}
              onPress={goToHelpCenter}>
              <Feather
                name="headphones"
                size={26}
                color={AllColors.primary}
              />
              <Text style={styles.boxText}>Help Center</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ACCOUNT SETTINGS (Only if logged in) */}
        {isLoggedIn && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={gotoEditProfile}>
              <View style={styles.rowLeft}>
                <AntDesign name="user" size={22} color={AllColors.primary} />
                <Text style={styles.rowText}>Edit Profile</Text>
              </View>
              <AntDesign name="right" size={18} color="#777" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={gotoSaveAddress}>
              <View style={styles.rowLeft}>
                <Ionicons name="location-outline" size={22} color={AllColors.primary} />
                <Text style={styles.rowText}>Saved Address</Text>
              </View>
              <AntDesign name="right" size={18} color="#777" />
            </TouchableOpacity>
          </View>
        )}

        {/* FEEDBACK & SUPPORT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feedback & Support</Text>



          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={goToCoupons}>
            <View style={styles.rowLeft}>
              <MaterialCommunityIcons name="ticket-percent-outline" size={22} color={AllColors.primary} />
              <Text style={styles.rowText}>Coupons & Offers</Text>
            </View>
            <AntDesign name="right" size={18} color="#777" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={goToHelpCenter}>
            <View style={styles.rowLeft}>
              <AntDesign name="questioncircleo" size={22} color={AllColors.primary} />
              <Text style={styles.rowText}>Browse FAQs</Text>
            </View>
            <AntDesign name="right" size={18} color="#777" />
          </TouchableOpacity>
        </View>

        {/* LOGOUT BUTTON (Only if logged in) */}
        {isLoggedIn && (
          <View style={styles.logoutContainer}>
            <TouchableOpacity
              style={styles.logoutBtn}
              activeOpacity={0.7}
              onPress={requestForLogout}>
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
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
    color: '#fff',
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
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  userName: {
    fontSize: 20,
    color: '#0F172A',
    fontWeight: '700',
  },

  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#0F172A',
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
    borderColor: '#E2E8F0',
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  boxText: {
    fontSize: 15,
    marginLeft: 10,
    color: '#334155',
    fontWeight: '600',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowText: {
    fontSize: 15,
    color: '#334155',
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
    backgroundColor: '#FFFFFF',
  },
  logoutText: {
    fontSize: 16,
    color: AllColors.primary,
    fontWeight: '700',
  },
});