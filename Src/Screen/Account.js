import React, { useEffect, useState } from 'react';
import {

  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AllColors from '../Constants/Color';
import CustomLoader from '../Common/Loader';
import { BASE_URL, getToken, removemobile, removeToken, removeuserId } from '../Api/Api';
import CustomAlert from '../Common/Alert';
import SuccessScreen from './../Common/SuccessScreen'
import SuccessModal from './../Common/SuccessScreen';
export default function Account() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [errorText,setErrorText]=useState('')
  const [isSuccess,setIsSuccess]=useState(false)
  // You have already logged out
  const Navigation = useNavigation();

  useEffect(() => {

    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);

  }, []);
useEffect(() => {
  checkLogin();
}, []);
const goToWishList=()=>{
  Navigation.navigate("Wishlist")
}
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

  if (loading) {
    return <CustomLoader visible={loading} />;
  }

  const gotoEditProfile = () => {
    Navigation.navigate("editProfile");
  };

  const gotoSaveAddress = () => {
    Navigation.navigate('AllAddress');
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

    console.log('Logout Response:', data);
if(response.ok){
setIsSuccess(true);

   
  await removeToken();
  await removemobile();
  await removeuserId();

  setIsLoggedIn(false);
}

      // Navigation.navigate('AppTab')
   
  } catch (error) {
      setErrorText("Something went wrong. Please try again.")
      setShowAlert(true)
  }
  // finally{
  //    setIsSuccess(false)
  // }
};
if (loading) {
  return <CustomLoader visible={loading} />;
}

if (!isLoggedIn) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}>

        {/* Login Card */}
        <View
          style={{
            backgroundColor: AllColors.primary,
            borderRadius: 24,
            padding: 24,
            marginBottom: 20,
          }}>

          <View
            style={{
              width: 70,
              height: 70,
              borderRadius: 35,
              backgroundColor: 'rgba(255,255,255,0.2)',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <AntDesign
              name="user"
              size={34}
              color="#fff"
            />
          </View>

          <Text
            style={{
              color: '#fff',
              fontSize: 24,
              fontWeight: '700',
              marginTop: 15,
            }}>
            Welcome
          </Text>

          <Text
            style={{
              color: 'rgba(255,255,255,0.85)',
              marginTop: 6,
              fontSize: 15,
            }}>
            Login to manage orders, wishlist and account settings.
          </Text>

          <TouchableOpacity
            onPress={() => Navigation.navigate('Login')}
            style={{
              backgroundColor: '#fff',
              height: 50,
              borderRadius: 14,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 20,
            }}>
            <Text
              style={{
                color: AllColors.primary,
                fontSize: 16,
                fontWeight: '700',
              }}>
              Login / Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            overflow: 'hidden',
          }}>

          {[
            {
              icon: (
                <Feather
                  name="headphones"
                  size={22}
                  color={AllColors.primary}
                />
              ),
              title: 'Help Center',
            },
            {
              icon: (
                <Ionicons
                  name="language-outline"
                  size={22}
                  color={AllColors.primary}
                />
              ),
              title: 'Change Language',
            },
            {
              icon: (
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color={AllColors.primary}
                />
              ),
              title: 'Notifications',
            },
            {
              icon: (
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={22}
                  color={AllColors.primary}
                />
              ),
              title: 'Terms & Policies',
            },
            {
              icon: (
                <AntDesign
                  name="questioncircleo"
                  size={22}
                  color={AllColors.primary}
                />
              ),
              title: 'FAQs',
            },
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 18,
                paddingVertical: 18,
                borderBottomWidth: index === 4 ? 0 : 0.5,
                borderBottomColor: '#E5E5E5',
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                {item.icon}

                <Text
                  style={{
                    marginLeft: 15,
                    fontSize: 16,
                    color: '#222',
                    fontWeight: '500',
                  }}>
                  {item.title}
                </Text>
              </View>

              <AntDesign
                name="right"
                size={16}
                color="#999"
              />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>
        <Text style={styles.headerText}>
          My Account
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}>

        {/* USER INFO */}
         
        <View style={styles.content}>

          <Text style={styles.userName}>
            Hey! Hittok
          </Text>

          {/* TOP BUTTONS */}

          <View style={styles.gridContainer}>

            <TouchableOpacity style={styles.box}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={28}
                color={AllColors.primary}
              />

              <Text style={styles.boxText}>
                Orders
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.box} onPress={goToWishList}>
              <AntDesign
                name="hearto"
                size={26}
                color={AllColors.primary}
              />

              <Text style={styles.boxText}>
                Wishlist
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.box}>
              <MaterialCommunityIcons
                name="ticket-percent-outline"
                size={28}
                color={AllColors.primary}
              />

              <Text style={styles.boxText}>
                Coupons
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.box}>
              <Feather
                name="headphones"
                size={26}
                color={AllColors.primary}
              />

              <Text style={styles.boxText}>
                Help Center
              </Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* ACCOUNT SETTINGS */}

        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            Account Setting
          </Text>

          <TouchableOpacity style={styles.row} onPress={gotoEditProfile}>

            <View style={styles.rowLeft}>

              <AntDesign
                name="user"
                size={24}
                color={AllColors.primary}
              />

              <Text style={styles.rowText}>
                Edit Profile
              </Text>

            </View>

            <AntDesign
              name="right"
              size={20}
              color="#777"
            />

          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={gotoSaveAddress}>

            <View style={styles.rowLeft}>

              <Ionicons
                name="location-outline"
                size={24}
                color={AllColors.primary}
              />

              <Text style={styles.rowText}>
                Saved Address
              </Text>

            </View>

            <AntDesign
              name="right"
              size={20}
              color="#777"
            />

          </TouchableOpacity>

        </View>

        {/* FEEDBACK */}

        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            Feedback and Information
          </Text>

          <TouchableOpacity style={styles.row}>

            <View style={styles.rowLeft}>

              <MaterialCommunityIcons
                name="file-document-outline"
                size={24}
                color={AllColors.primary}
              />

              <Text style={styles.rowText}>
                Terms, Policies and Licenses
              </Text>

            </View>

            <AntDesign
              name="right"
              size={20}
              color="#777"
            />

          </TouchableOpacity>

          <TouchableOpacity style={styles.row}>

            <View style={styles.rowLeft}>

              <AntDesign
                name="questioncircleo"
                size={24}
                color={AllColors.primary}
              />

              <Text style={styles.rowText}>
                Browse FAQs
              </Text>

            </View>

            <AntDesign
              name="right"
              size={20}
              color="#777"
            />

          </TouchableOpacity>

        </View>

        {/* INPUT */}

       

        {/* LOGOUT */}

        <View style={styles.logoutContainer}>

          <TouchableOpacity style={styles.logoutBtn} onPress={requestForLogout}>

            <Text style={styles.logoutText}>
              Log Out
            </Text>

          </TouchableOpacity>
   <CustomAlert
          visible={showAlert}
          message={errorText}
          onClose={() => setShowAlert(false)}
        />
    <SuccessModal 
      visible={isSuccess}
       title="Logout Successful"
       message="You have been logged out successfully."
       onClose={() =>
       setIsSuccess(false)} />
         </View>
             <View style={{height:50,backgroundColor:AllColors.white}}/>
      </ScrollView>
         
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
menuRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 18,
  borderBottomWidth: 0.5,
  borderBottomColor: '#EAEAEA',
},

leftRow: {
  flexDirection: 'row',
  alignItems: 'center',
},

menuText: {
  marginLeft: 15,
  fontSize: 16,
  color: '#222',
  fontWeight: '500',
},
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',

  },

  header: {
    backgroundColor: AllColors.primary,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },

  headerText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '600',
  },

  content: {
    backgroundColor: '#fff',
    padding: 16,
  },

  userName: {
    fontSize: 20,
    color: '#000',
    marginBottom: 20,
    fontWeight: '600',
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  box: {
    width: '47%',
    height: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },

  boxText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#555',
    fontWeight: '500',
  },

  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },

  sectionTitle: {
    fontSize: 18,
    color: '#000',
    marginBottom: 14,
    fontWeight: '600',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
  },

  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 14,
  },

  inputContainer: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 16,
  },

  input: {
    height: 55,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
  },

  logoutContainer: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 18,
    marginBottom: 40,
  },

  logoutBtn: {
    height: 40,
    borderWidth: 1,
    borderColor: AllColors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
   
  },

  logoutText: {
    fontSize: 20,
    color: AllColors.primary,
    fontWeight: '600',
  },

});