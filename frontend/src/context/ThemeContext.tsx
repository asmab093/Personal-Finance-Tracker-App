import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const themePalettes = {
  dark: {
    background: '#0a101f', card: '#16233d', text: '#ffffff', subtext: '#8a9ab3',
    border: '#2d3e60', primary: '#64ffda', danger: '#ff4c4c', 
    iconBg: 'rgba(100, 255, 218, 0.1)', dangerBg: 'rgba(255, 76, 76, 0.1)'
  },
  light: {
    background: '#f1f5f9', card: '#ffffff', text: '#0f172a', subtext: '#64748b',
    border: '#e2e8f0', primary: '#0d9488', danger: '#ef4444', 
    iconBg: '#ccfbf1', dangerBg: '#fee2e2'
  }
};

const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currency, setCurrency] = useState('Rs.'); // <-- NEW: Global currency state

  useEffect(() => {
    const loadPreferences = async () => {
      const savedTheme = await AsyncStorage.getItem('appTheme');
      if (savedTheme !== null) setIsDarkMode(savedTheme === 'dark');

      const savedCurrency = await AsyncStorage.getItem('appCurrency');
      if (savedCurrency !== null) setCurrency(savedCurrency); // <-- Load saved currency
    };
    loadPreferences();
  }, []);

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    await AsyncStorage.setItem('appTheme', newTheme ? 'dark' : 'light');
  };

  // <-- NEW: Function to change and save the currency
  const changeCurrency = async (newCurrency: string) => {
    setCurrency(newCurrency);
    await AsyncStorage.setItem('appCurrency', newCurrency);
  };

  const theme = isDarkMode ? themePalettes.dark : themePalettes.light;

  return (
    // <-- NEW: Broadcast the currency variables to the rest of the app
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme, currency, changeCurrency }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);