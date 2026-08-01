import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Platform, StatusBar as RNStatusBar, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';

import { useTheme } from '../../context/ThemeContext';

export default function ProfileScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('User');
  
  // Modals and toggles
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const [isCurrencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [isResetModalVisible, setResetModalVisible] = useState(false);
  
  // Password Modal States
  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // NEW: Password Visibility Toggle States
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Biometric State
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  
  const { isDarkMode, toggleTheme, theme, currency, changeCurrency } = useTheme();

  const BASE_URL = 'http://192.168.1.6:5000/api';

  const availableCurrencies = ['Rs.', '$', '€', '£', '¥'];

  useEffect(() => {
    fetchUser();
    checkBiometrics();
  }, []);

  const fetchUser = async () => {
    try {
      const storedName = await AsyncStorage.getItem('userName');
      if (storedName) setUserName(storedName);
    } catch (error) {
      console.error(error);
    }
  };

  const checkBiometrics = async () => {
    const status = await AsyncStorage.getItem('biometricLock');
    if (status === 'true') setIsBiometricEnabled(true);
  };

  const handleSaveName = async () => {
    if (!editNameInput.trim()) return;
    try {
      await AsyncStorage.setItem('userName', editNameInput.trim());
      setUserName(editNameInput.trim());
      setEditModalVisible(false);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleBiometricLock = async () => {
    const newValue = !isBiometricEnabled;

    if (newValue) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert("Unsupported", "Your device does not have biometrics configured.");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable App Lock',
      });

      if (result.success) {
        setIsBiometricEnabled(true);
        await AsyncStorage.setItem('biometricLock', 'true');
      }
    } else {
      setIsBiometricEnabled(false);
      await AsyncStorage.setItem('biometricLock', 'false');
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill out all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Your password has been updated securely.");
        setPasswordModalVisible(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert("Error", data.message || "Failed to change password.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Network Error", "Could not connect to the server.");
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userName'); 
    router.replace('/');
  };

  const handleResetAccount = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${BASE_URL}/transactions/all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      });

      if (response.ok) {
        await AsyncStorage.removeItem('monthlyBudget');
        setResetModalVisible(false);
        Alert.alert("Success", "All transactions have been permanently deleted.");
      } else {
        const data = await response.json();
        Alert.alert("Error", data.message || "Could not reset account.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Network Error", "Could not connect to the server.");
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} /> 
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
        </View>

        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.avatarContainer, { backgroundColor: theme.primary }]}>
            <Text style={[styles.avatarText, { color: isDarkMode ? '#0a101f' : '#ffffff' }]}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <TouchableOpacity 
              style={styles.userNameContainer}
              activeOpacity={0.7}
              onPress={() => {
                setEditNameInput(userName);
                setEditModalVisible(true);
              }}
            >
              <Text style={[styles.userName, { color: theme.text }]}>@{userName}</Text>
              <Ionicons name="pencil" size={16} color={theme.primary} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
            <Text style={[styles.userSubtext, { color: theme.subtext }]}>Personal Finance Tracker</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.subtext }]}>Preferences</Text>

        <View style={[styles.settingsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
                <Ionicons name={isDarkMode ? "moon" : "sunny"} size={20} color={theme.primary} />
              </View>
              <Text style={[styles.settingText, { color: theme.text }]}>Dark Mode</Text>
            </View>
            <Switch
              trackColor={{ false: '#cbd5e1', true: 'rgba(100, 255, 218, 0.5)' }}
              thumbColor={isDarkMode ? theme.primary : '#ffffff'}
              onValueChange={toggleTheme} 
              value={isDarkMode}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
                <Ionicons name="finger-print" size={20} color={theme.primary} />
              </View>
              <Text style={[styles.settingText, { color: theme.text }]}>Require Biometrics</Text>
            </View>
            <Switch
              trackColor={{ false: '#cbd5e1', true: 'rgba(100, 255, 218, 0.5)' }}
              thumbColor={isBiometricEnabled ? theme.primary : '#ffffff'}
              onValueChange={toggleBiometricLock} 
              value={isBiometricEnabled}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity style={styles.settingRow} onPress={() => setCurrencyModalVisible(true)}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
                <Ionicons name="cash" size={20} color={theme.primary} />
              </View>
              <Text style={[styles.settingText, { color: theme.text }]}>Currency</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: theme.subtext, fontSize: 16, marginRight: 8, fontWeight: 'bold' }}>{currency}</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
            </View>
          </TouchableOpacity>

        </View>

        <Text style={[styles.sectionTitle, { color: theme.subtext, marginTop: 25 }]}>Account Security</Text>
        
        <View style={[styles.settingsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          
          <TouchableOpacity style={styles.settingRow} onPress={() => setPasswordModalVisible(true)}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
                <Ionicons name="key" size={20} color={theme.primary} />
              </View>
              <Text style={[styles.settingText, { color: theme.text }]}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <TouchableOpacity style={styles.settingRow} onPress={handleLogout}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.dangerBg }]}>
                <Ionicons name="log-out" size={20} color={theme.danger} />
              </View>
              <Text style={[styles.settingText, { color: theme.danger }]}>Log Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </TouchableOpacity>

        </View>

        <Text style={[styles.sectionTitle, { color: theme.danger, marginTop: 25 }]}>Danger Zone</Text>

        <TouchableOpacity 
          style={[styles.settingsCard, { backgroundColor: theme.dangerBg, borderColor: theme.danger, marginBottom: 40 }]} 
          onPress={() => setResetModalVisible(true)}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.danger }]}>
                <Ionicons name="trash" size={20} color={theme.background} />
              </View>
              <Text style={[styles.settingText, { color: theme.danger }]}>Reset Account</Text>
            </View>
            <Ionicons name="warning" size={20} color={theme.danger} />
          </View>
        </TouchableOpacity>

      </ScrollView>

      {/* EDIT USERNAME MODAL */}
      <Modal visible={isEditModalVisible} transparent={true} animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Username</Text>
            <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>Choose a new display name.</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              placeholder="New username"
              placeholderTextColor={theme.subtext}
              value={editNameInput}
              onChangeText={setEditNameInput}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton, { backgroundColor: theme.background, borderColor: theme.border }]} onPress={() => setEditModalVisible(false)}>
                <Text style={[styles.cancelButtonText, { color: theme.subtext }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleSaveName}>
                <Text style={[styles.saveButtonText, { color: theme.background }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CHANGE PASSWORD MODAL */}
      <Modal visible={isPasswordModalVisible} transparent={true} animationType="fade" onRequestClose={() => setPasswordModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Change Password</Text>
            <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>Ensure your account stays secure.</Text>
            
            {/* CURRENT PASSWORD FIELD */}
            <View style={[styles.passwordInputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.text }]}
                placeholder="Current Password"
                placeholderTextColor={theme.subtext}
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry={!showOldPassword}
              />
              <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)} style={styles.eyeIcon}>
                <Ionicons name={showOldPassword ? "eye-off" : "eye"} size={22} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            {/* NEW PASSWORD FIELD */}
            <View style={[styles.passwordInputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.text }]}
                placeholder="New Password"
                placeholderTextColor={theme.subtext}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
                <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={22} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            {/* CONFIRM NEW PASSWORD FIELD */}
            <View style={[styles.passwordInputContainer, { backgroundColor: theme.background, borderColor: theme.border, marginBottom: 25 }]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.text }]}
                placeholder="Confirm New Password"
                placeholderTextColor={theme.subtext}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={22} color={theme.subtext} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton, { backgroundColor: theme.background, borderColor: theme.border }]} 
                onPress={() => {
                  setPasswordModalVisible(false);
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setShowOldPassword(false);
                  setShowNewPassword(false);
                  setShowConfirmPassword(false);
                }}
              >
                <Text style={[styles.cancelButtonText, { color: theme.subtext }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleChangePassword}>
                <Text style={[styles.saveButtonText, { color: theme.background }]}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CURRENCY SELECTOR MODAL */}
      <Modal visible={isCurrencyModalVisible} transparent={true} animationType="fade" onRequestClose={() => setCurrencyModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Currency</Text>
            <Text style={[styles.modalSubtitle, { color: theme.subtext, marginBottom: 15 }]}>Choose your preferred symbol.</Text>
            
            <View style={styles.currencyGrid}>
              {availableCurrencies.map((sym) => (
                <TouchableOpacity 
                  key={sym} 
                  style={[styles.currencyOption, { 
                    backgroundColor: currency === sym ? theme.primary : theme.background,
                    borderColor: currency === sym ? theme.primary : theme.border 
                  }]}
                  onPress={() => {
                    changeCurrency(sym);
                    setCurrencyModalVisible(false);
                  }}
                >
                  <Text style={[styles.currencyText, { color: currency === sym ? theme.background : theme.text }]}>
                    {sym}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[
                styles.button, 
                styles.cancelButton, 
                { 
                  flex: 0, 
                  width: '100%', 
                  backgroundColor: theme.background, 
                  borderColor: theme.border, 
                  marginTop: 20 
                }
              ]} 
              onPress={() => setCurrencyModalVisible(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.subtext }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* RESET ACCOUNT CONFIRMATION MODAL */}
      <Modal visible={isResetModalVisible} transparent={true} animationType="fade" onRequestClose={() => setResetModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="warning" size={40} color={theme.danger} style={{ marginBottom: 15 }} />
            <Text style={[styles.modalTitle, { color: theme.text, textAlign: 'center' }]}>Reset Account?</Text>
            <Text style={[styles.modalSubtitle, { color: theme.subtext, textAlign: 'center', marginBottom: 25 }]}>
              This will permanently delete all of your transactions and reset your budget. This action cannot be undone.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton, { backgroundColor: theme.background, borderColor: theme.border }]} 
                onPress={() => setResetModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.subtext }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton, { backgroundColor: theme.danger }]} 
                onPress={handleResetAccount}
              >
                <Text style={[styles.saveButtonText, { color: theme.background }]}>Delete All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { marginTop: 10, marginBottom: 30 },
  title: { fontSize: 32, fontWeight: 'bold' },
  
  profileCard: { flexDirection: 'row', borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 35, borderWidth: 1, elevation: 5 },
  avatarContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 28, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  userNameContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  userName: { fontSize: 22, fontWeight: 'bold' },
  userSubtext: { fontSize: 14 },
  
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginLeft: 5 },
  
  settingsCard: { borderRadius: 20, padding: 10, borderWidth: 1, elevation: 5 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10 },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  settingText: { fontSize: 16, fontWeight: 'bold' },
  
  divider: { height: 1, marginHorizontal: 10 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 25, width: '100%', maxWidth: 350, borderWidth: 1, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, width: '100%' },
  modalSubtitle: { fontSize: 15, marginBottom: 20, width: '100%' },
  
  input: { padding: 15, borderRadius: 10, marginBottom: 25, borderWidth: 1, fontSize: 18, width: '100%' },
  
  // NEW: Styles for the password inputs with eye icons
  passwordInputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, marginBottom: 15, width: '100%' },
  passwordInput: { flex: 1, padding: 15, fontSize: 18 },
  eyeIcon: { padding: 15 },
  
  currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, width: '100%' },
  currencyOption: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 1, margin: 5 },
  currencyText: { fontSize: 22, fontWeight: 'bold' },

  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  button: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  cancelButton: { marginRight: 4, borderWidth: 1 },
  saveButton: { marginLeft: 4 },
  cancelButtonText: { fontSize: 16, fontWeight: 'bold' },
  saveButtonText: { fontSize: 16, fontWeight: 'bold' }
});