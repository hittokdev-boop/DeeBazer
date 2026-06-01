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
const Tab = createMaterialTopTabNavigator();
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
      </Stack.Navigator>
    )
}
const AppTab=()=>{
    return(
<Tab.Navigator
  tabBarPosition="bottom"
  screenOptions={{
    swipeEnabled: true,
    animationEnabled: true,
    lazy: true,

    tabBarShowLabel: false,

    tabBarActiveTintColor: AllColors.primary,
    tabBarInactiveTintColor: AllColors.grey,

    tabBarStyle: {
      position: 'absolute',

      bottom: 20,
      left: 20,
      right: 20,

      backgroundColor: '#fff',

      height: 70,
      borderRadius: 40,

      elevation: 10,

      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 10,
      shadowOffset: {
        width: 0,
        height: 5,
      },

      overflow: 'hidden',
    },

    tabBarIndicatorStyle: {
      display: 'none',
    },

    tabBarItemStyle: {
      justifyContent: 'center',
      alignItems: 'center',
    },
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