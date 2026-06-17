import react,{useEffect, useState} from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import AllColors from '../Constants/Color';
import CustomAlert from './Alert';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL, getMobile, getNumber, getToken, setToken, setuserId } from '../Api/Api';




export default function VerifyOTP({visible, onClose}) {

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);    
  const [Mobile, setMobile] = useState('');
  const Navigation=useNavigation()
   useEffect(() => {
    const checkToken = async () => {
      const token = await getMobile();
    
      if (token) {
        setMobile(token);
      }

   
    };

    checkToken();
  }, []);
     const handleLogin = async () => {

  setLoading(true);

   
  try {

    const formData = new FormData();
    formData.append('otp', otp);
    formData.append('mobile', Mobile);

    const response = await fetch(`${BASE_URL}verify-otp`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    console.log(data)  
    if(data.token){
       await setToken(data.token)
     Navigation.replace('AppTab')

    }
  } catch (e) {
   
    console.log(e, 'change');

  } finally {

    setLoading(false);

  }
};
   return (
       <Modal
      visible={visible}
      transparent>
        <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.5)'}}>
          <Text style={{color:AllColors.white, fontSize:18, marginBottom:20}}>Enter OTP</Text>
            <TextInput
             value={otp}
                onChangeText={setOtp}
                style={{borderRadius:10,backgroundColor:AllColors.white,padding:10,borderWidth:1}}
            />
             <TouchableOpacity onPress={handleLogin} style={{backgroundColor:AllColors.primary, padding:10, borderRadius:5, marginTop:20}}>
              {
                loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{color:AllColors.white}}>
                    Verify OTP
                  </Text>
                )
              }
            </TouchableOpacity>
        </View>
      </Modal>

   )

}