import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AllColors from '../Constants/Color';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('APP_DARK_MODE');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (e) {
      console.log('Error loading theme preference:', e);
    }
  };

  const toggleDarkMode = async (value) => {
    setIsDarkMode(value);
    try {
      await AsyncStorage.setItem('APP_DARK_MODE', JSON.stringify(value));
    } catch (e) {
      console.log('Error saving theme preference:', e);
    }
  };

  const theme = {
    isDarkMode,
    bg: isDarkMode ? '#0F172A' : '#F4F5F9',
    cardBg: isDarkMode ? '#1E293B' : AllColors.white,
    headerBg: isDarkMode ? '#1E293B' : AllColors.primary,
    headerText: isDarkMode ? '#F8FAFC' : '#FFFFFF',
    textPrimary: isDarkMode ? '#F8FAFC' : AllColors.slateDark,
    textSecondary: isDarkMode ? '#CBD5E1' : AllColors.slateText,
    divider: isDarkMode ? '#334155' : AllColors.divider,
    borderColor: isDarkMode ? '#334155' : AllColors.lightGrey,
    iconPrimary: isDarkMode ? '#F43F5E' : AllColors.primary,
    bannerBg: isDarkMode ? '#1E1B4B' : AllColors.primary,
    modalBg: isDarkMode ? '#1E293B' : AllColors.white,
    modalSubText: isDarkMode ? '#94A3B8' : AllColors.slateSub,
    searchBg: isDarkMode ? '#334155' : '#F1F5F9',
    bottomTabBg: isDarkMode ? '#1E293B' : '#FFFFFF',
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
