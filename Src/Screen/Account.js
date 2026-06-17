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
import { BASE_URL, getToken, removeToken } from '../Api/Api';
import CustomAlert from '../Common/Alert';
import SuccessScreen from './../Common/SuccessScreen'
import SuccessModal from './../Common/SuccessScreen';
export default function Account() {
  
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

  if (loading) {
    return <CustomLoader visible={loading} />;
  }

  const gotoEditProfile = () => {
    Navigation.navigate("editProfile");
  };

  const gotoSaveAddress = () => {
    Navigation.navigate('SaveAddress');
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

   
      await removeToken();
      setIsSuccess(true)
      Navigation.navigate('AppTab')
   
    
  } catch (error) {
      setErrorText("Something went wrong. Please try again.")
      setShowAlert(true)
  }
  // finally{
  //    setIsSuccess(false)
  // }
};
  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>
        <Text style={styles.headerText}>
          My Account
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
      >

        {/* USER INFO */}
          <TouchableOpacity style={{height:20,backgroundColor:"red"}}>
            <Text>hello</Text>
          </TouchableOpacity>
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

            <TouchableOpacity style={styles.box}>
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

        <View style={styles.inputContainer}>

          <TextInput
            value={data}
            onChangeText={(value) => setData(value)}
            placeholder="Type here..."
            placeholderTextColor="#999"
            style={styles.input}
          />

        </View>

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