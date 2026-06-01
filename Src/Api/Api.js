import AsyncStorage from "@react-native-async-storage/async-storage";

export const BASE_URL = "https://deebazar.com/admin/api/";

// STORAGE KEYS
const USER_ID_KEY = "USER_ID";
const MOBILE_KEY = "MOBILE";
const TOKEN_KEY = "TOKEN";


// ================= USER ID =================

// Save userId
export const setuserId = async (user_id) => {
  try {
    await AsyncStorage.setItem(USER_ID_KEY, String(user_id));
  } catch (e) {
    console.log("userId save error", e);
  }
};

// Get userId
export const getuserId = async () => {
  try {
    return await AsyncStorage.getItem(USER_ID_KEY);
  } catch (e) {
    console.log("userId get error", e);
    return null;
  }
};

// Remove userId
export const removeuserId = async () => {
  try {
    await AsyncStorage.removeItem(USER_ID_KEY);
  } catch (e) {
    console.log("userId remove error", e);
  }
};


// ================= MOBILE =================

// Save mobile
export const setMobile = async (mobile) => {
  try {
    await AsyncStorage.setItem(MOBILE_KEY, String(mobile));
  } catch (e) {
    console.log("mobile save error", e);
  }
};

// Get mobile
export const getMobile = async () => {
  try {
    return await AsyncStorage.getItem(MOBILE_KEY);
  } catch (e) {
    console.log("mobile get error", e);
    return null;
  }
};

// Remove mobile
export const removemobile = async () => {
  try {
    await AsyncStorage.removeItem(MOBILE_KEY);
  } catch (e) {
    console.log("mobile remove error", e);
  }
};


// ================= TOKEN =================

// Save token
export const setToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.log("token save error", e);
  }
};

// Get token
export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (e) {
    console.log("token get error", e);
    return null;
  }
};

// Remove token
export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.log("token remove error", e);
  }
};