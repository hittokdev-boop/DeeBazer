import react from 'react'
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import DashBoard from './Screen/ProductsDashboard/DashBoard';
import Home from './Screen/ProductsDashboard/Home';
import Account from './Screen/AuthProfile/Account';
import CartPage from './Screen/CartCheckout/CartPage';
import AllColors from './Constants/Color';
import VerifyOTP from './Common/VerifyOTP'
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import CommonLoginModal from './Common/Login';
import TextView from './Screen/Misc/Text';
import EditProfileScreen from './Screen/AuthProfile/EditProfile'
import SaveAddress from './Screen/Address/SaveAddress'
import ProductDetails from './Screen/ProductsDashboard/ProductDetails'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MapScreen from './Screen/Address/MapScreen'
import AllAddress from './Screen/Address/AllAdress'
import ViewAllProducts from  './Screen/ProductsDashboard/ViewAllProducts'
import Wishlist from './Screen/Misc/wishlist '
import RazorpayScreen from './Screen/CartCheckout/RazorpayScreen'
import Orders from './Screen/Orders/Orders';
import Coupons from './Screen/CartCheckout/Coupons';
import HelpCenter from './Screen/Misc/HelpCenter';
import SplashScreen from './Screen/Misc/SplashScreen';
import OrderDetails from './Screen/Orders/OrderDetails';
import Register from './Common/Register';
import TermsCondition from './Screen/Misc/TermsCondition';
// const Tab = createMaterialTopTabNavigator();
const Tab=createBottomTabNavigator()
export default function Navigation(){
    return(
         <NavigationContainer>
        <AppStack/>
    </NavigationContainer>
    )
}

const Stack=createStackNavigator()

const AppStack=()=>{
    return(
      <Stack.Navigator  initialRouteName='Splash' screenOptions={{
        headerShown:false
      }}>
        <Stack.Screen name='Splash' component={SplashScreen}/>
        <Stack.Screen name='AppTab' component={AppTab}/>
        <Stack.Screen name='VerifyOTP' component={VerifyOTP} />
        <Stack.Screen name='Login' component={CommonLoginModal}/>
        <Stack.Screen name='Register' component={Register}/>
        <Stack.Screen name='TermsCondition' component={TermsCondition}/>
        <Stack.Screen name='TextView' component={TextView}/>
        <Stack.Screen name='editProfile' component={EditProfileScreen}/>
        <Stack.Screen name='SaveAddress' component={SaveAddress} />
        <Stack.Screen name='ProductDetails' component={ProductDetails} />
          <Stack.Screen name='MapScreen' component={MapScreen} />
          <Stack.Screen name='AllAddress' component={AllAddress}/>
          <Stack.Screen name="ViewAllProducts"  component={ViewAllProducts}/>
             <Stack.Screen name="Wishlist"  component={Wishlist}/>
          <Stack.Screen name="RazorpayScreen"  component={RazorpayScreen}/>
          <Stack.Screen name="CartPage"  component={CartPage}/>
          <Stack.Screen name="Orders"  component={Orders}/>
          <Stack.Screen name="Coupons"  component={Coupons}/>
          <Stack.Screen name="HelpCenter"  component={HelpCenter}/>
          <Stack.Screen name="OrderDetails" component={OrderDetails} />
      </Stack.Navigator>
    )
}
const AppTab=()=>{
    return(
<Tab.Navigator
  screenOptions={{
    headerShown: false,
    tabBarShowLabel: false,
    tabBarActiveTintColor:AllColors.primary,
    tabBarInactiveTintColor:AllColors.grey,
    // tabBarStyle: {
    //   position: 'absolute',
    //   bottom: 15,
    //   alignSelf: 'center',
    //   width: '85%',
    //   height: 65,
    //   borderRadius: 20,
    //   backgroundColor: '#fff',
    //   elevation: 10,
    // },
  }}>

  
        <Tab.Screen
          name="Profile"
          component={DashBoard}
          options={{
            tabBarIcon: ({ color }) => (
              <Entypo name="home" size={24} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Home"
          component={Home}
          options={{
            tabBarIcon: ({ color }) => (
              <FontAwesome6
                name="hand-holding-dollar"
                size={22}
                color={color}
              />
            ),
          }}
        />

        <Tab.Screen
          name="Account"
          component={Account}
          options={{
            tabBarIcon: ({ color }) => (
              <Entypo name="user" size={24} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="CartPage"
          component={CartPage}
          options={{
            tabBarIcon: ({ color }) => (
              <Entypo name="shopping-cart" size={24} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    )
}