import react from 'react'
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import DashBoard from './Screen/app/ProductsDashboard/DashBoard';
import Home from './Screen/app/ProductsDashboard/Home';
import AllCategories from './Screen/app/ProductsDashboard/AllCategories';
import Account from './Screen/app/AuthProfile/Account';
import CartPage from './Screen/app/CartCheckout/CartPage';
import AllColors from './Constants/Color';
import VerifyOTP from './Screen/auth/VerifyOTP';
import { useTheme } from './Context/ThemeContext';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import CommonLoginModal from './Screen/auth/Login';
import TextView from './Screen/app/Misc/Text';
import EditProfileScreen from './Screen/app/AuthProfile/EditProfile';
import SaveAddress from './Screen/app/Address/SaveAddress';
import ProductDetails from './Screen/app/ProductsDashboard/ProductDetails';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MapScreen from './Screen/app/Address/MapScreen';
import AllAddress from './Screen/app/Address/AllAdress';
import ViewAllProducts from './Screen/app/ProductsDashboard/ViewAllProducts';
import Wishlist from './Screen/app/Misc/Wishlist';
import RazorpayScreen from './Screen/app/CartCheckout/RazorpayScreen';
import Orders from './Screen/app/Orders/Orders';
import Coupons from './Screen/app/CartCheckout/Coupons';
import HelpCenter from './Screen/app/Misc/HelpCenter';
import SplashScreen from './Screen/auth/SplashScreen';
import OrderDetails from './Screen/app/Orders/OrderDetails';
import Register from './Screen/auth/Register';
import TermsCondition from './Screen/app/Misc/TermsCondition';
import OrderSuccess from './Screen/app/CartCheckout/OrderSuccess';
// const Tab = createMaterialTopTabNavigator();
const Tab = createBottomTabNavigator()
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';


export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

const linking = {
  prefixes: ['https://deebazar.com', 'http://deebazar.com', 'deebazar://'],
  config: {
    screens: {
      ProductDetails: 'product/:id',
      CartPage: 'cart',
      Wishlist: 'wishlist',
    },
  },
};

export default function Navigation() {
  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <AppStack />
    </NavigationContainer>
  )
}

const Stack = createStackNavigator()

const AppStack = () => {
  return (
    <Stack.Navigator initialRouteName='Splash' screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: '#FFFFFF' },
      cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
      transitionSpec: {
        open: { animation: 'timing', config: { duration: 350 } },
        close: { animation: 'timing', config: { duration: 300 } },
      },
    }}>
      <Stack.Screen name='Splash' component={SplashScreen} />
      <Stack.Screen name='AppTab' component={AppTab} />
      <Stack.Screen name='VerifyOTP' component={VerifyOTP} />
      <Stack.Screen name='Login' component={CommonLoginModal} />
      <Stack.Screen name='Register' component={Register} />
      <Stack.Screen name='TermsCondition' component={TermsCondition} />
      <Stack.Screen name='TextView' component={TextView} />
      <Stack.Screen name='editProfile' component={EditProfileScreen} />
      <Stack.Screen name='SaveAddress' component={SaveAddress} />
      <Stack.Screen name='ProductDetails' component={ProductDetails} />
      <Stack.Screen name='MapScreen' component={MapScreen} />
      <Stack.Screen name='AllAddress' component={AllAddress} />
      <Stack.Screen name="ViewAllProducts" component={ViewAllProducts} />
      <Stack.Screen name="Wishlist" component={Wishlist} />
      <Stack.Screen name="RazorpayScreen" component={RazorpayScreen} />
      <Stack.Screen name="CartPage" component={CartPage} />
      <Stack.Screen name="Orders" component={Orders} />
      <Stack.Screen name="Coupons" component={Coupons} />
      <Stack.Screen name="HelpCenter" component={HelpCenter} />
      <Stack.Screen name="OrderDetails" component={OrderDetails} />
      <Stack.Screen name="OrderSuccess" component={OrderSuccess} />
      <Stack.Screen name="AllCategories" component={AllCategories} />
    </Stack.Navigator>
  )
}
const AppTab = () => {
  const { theme, isDarkMode } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.bottomTabBg,
          borderTopColor: theme.divider,
        },
        tabBarActiveTintColor: AllColors.primary,
        tabBarInactiveTintColor: isDarkMode ? '#64748B' : AllColors.grey,
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
        component={AllCategories}
        options={{
          tabBarIcon: ({ color }) => (
            <Entypo
              name="grid"
              size={24}
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