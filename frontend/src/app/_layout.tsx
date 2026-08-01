import React, { useEffect, useState, useRef } from 'react';
import { AppState, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider } from '../context/ThemeContext';

export default function RootLayout() {
  const appState = useRef(AppState.currentState);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    // 1. Check if the app should be locked on initial launch
    const checkInitialLock = async () => {
      const biometricEnabled = await AsyncStorage.getItem('biometricLock');
      if (biometricEnabled === 'true') {
        setIsLocked(true);
        handleUnlock();
      }
    };
    checkInitialLock();

    // 2. Listen for the app going to the background and returning
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const biometricEnabled = await AsyncStorage.getItem('biometricLock');
        if (biometricEnabled === 'true') {
          setIsLocked(true);
          handleUnlock();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleUnlock = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Verify your identity',
      fallbackLabel: 'Use Passcode',
    });
    
    if (result.success) {
      setIsLocked(false);
    }
  };

  return (
    <ThemeProvider>
      <StatusBar style="light" />
      {/* If locked, show the premium Lock Screen. Otherwise, show the normal app. */}
      {isLocked ? (
        <View style={styles.lockScreen}>
          
          <View style={styles.iconBackground}>
            <Ionicons name="finger-print" size={60} color="#00CC66" />
          </View>
          
          <Text style={styles.lockTitle}>Welcome Back</Text>
          <Text style={styles.lockSubtitle}>Verify your identity to access your tracker</Text>

          <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock} activeOpacity={0.8}>
            <Ionicons name="scan" size={20} color="#ffffff" style={{ marginRight: 10 }} />
            <Text style={styles.unlockButtonText}>Unlock Tracker</Text>
          </TouchableOpacity>
          
        </View>
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" /> 
        </Stack>
      )}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  lockScreen: { 
    flex: 1, 
    backgroundColor: '#0f172a', // Sleek dark slate background
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20
  },
  iconBackground: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(0, 204, 102, 0.1)', // Soft green transparent glow
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(0, 204, 102, 0.3)'
  },
  lockTitle: { 
    color: '#ffffff', 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 10,
    letterSpacing: 0.5
  },
  lockSubtitle: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 50,
    paddingHorizontal: 20,
    lineHeight: 24
  },
  unlockButton: { 
    flexDirection: 'row',
    backgroundColor: '#00CC66', 
    paddingHorizontal: 35, 
    paddingVertical: 16, 
    borderRadius: 30, // Sleek pill shape
    alignItems: 'center',
    shadowColor: '#00CC66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6
  },
  unlockButtonText: { 
    color: '#ffffff', 
    fontSize: 18, 
    fontWeight: 'bold',
    letterSpacing: 0.5
  }
});