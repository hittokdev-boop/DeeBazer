import react from 'react'
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import DashBoard from './Screen/DashBoard';
import Home from './Screen/Home';
import Account from './Screen/Account';
import CartPage from './Screen/CartPage';
import AllColors from './Constants/Color';
import VerifyOTP from './Common/VerifyOTP'
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import CommonLoginModal from './Common/Login';
import TextView from './Screen/Text';
import EditProfileScreen from './Screen/EditProfile'
import SaveAddress from './Screen/SaveAddress'
import ProductDetails from './Screen/ProductDetails'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MapScreen from './Screen/MapScreen'
import AllAddress from './Screen/AllAdress'
import ViewAllProducts from  './Screen/ViewAllProducts'
import Wishlist from './Screen/wishlist '
import RazorpayScreen from './Screen/RazorpayScreen'
import Orders from './Screen/Orders';
import Coupons from './Screen/Coupons';
import HelpCenter from './Screen/HelpCenter';
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
      <Stack.Navigator  screenOptions={{
        headerShown:false
      }}>
        <Stack.Screen name='AppTab' component={AppTab}/>
        <Stack.Screen name='VerifyOTP' component={VerifyOTP} />
        <Stack.Screen name='Login' component={CommonLoginModal}/>
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