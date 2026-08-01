import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true); 
  const [isForgotPassword, setIsForgotPassword] = useState(false); 
  const [isResetPhase, setIsResetPhase] = useState(false); 
  
  const [name, setName] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  // AUTO-LOGIN HOOK: Checks for token when app opens
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          console.log("Token found! Auto-logging in...");
          router.replace('/(tabs)/dashboard'); 
        }
      } catch (error) {
        console.log("Error checking for token:", error);
      }
    };
    checkToken();
  }, []);

  const API_BASE_URL = 'http://192.168.1.6:5000/api/auth'; 

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      const endpoint = isLogin ? `${API_BASE_URL}/login` : `${API_BASE_URL}/register`;
      const payload = isLogin ? { email, password } : { name, email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token) {
          await AsyncStorage.setItem('userToken', data.token);
          
          // ==========================================
          // CRITICAL FIX: GRAB ONLY THE FIRST NAME
          // ==========================================
          let fullNameToSave = '';

          // 1. Check where the backend sent the name
          if (data.name) {
            fullNameToSave = data.name;
          } else if (data.user && data.user.name) {
            fullNameToSave = data.user.name;
          } else if (!isLogin) {
            fullNameToSave = name; // Fallback to what they typed during registration
          }

          // 2. Split the string by space and take the first item
          if (fullNameToSave) {
            const firstName = fullNameToSave.split(' ')[0];
            await AsyncStorage.setItem('userName', firstName);
          } else {
            await AsyncStorage.setItem('userName', 'User'); // Ultimate fallback
          }
          // ==========================================

          console.log("Token and Name saved successfully to device!");
        }
        
        // ROUTING ADDED: Pushes user to dashboard after clicking OK
        Alert.alert(
          "Success!", 
          isLogin ? "Logged in successfully!" : "Account created successfully!",
          [{ text: "OK", onPress: () => router.replace('/(tabs)/dashboard') }] 
        );
      } else {
        Alert.alert("Error", data.message || "Authentication failed.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Network Error", "Could not connect to the server.");
    }
  };

  const handleRequestToken = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address first.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/forgotpassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Link Sent!", 
          "Check your terminal console to see the generated reset token!",
          [{ 
            text: "OK", 
            onPress: () => {
              setIsForgotPassword(false);
              setIsResetPhase(true);
            } 
          }] 
        );
      } else {
        Alert.alert("Error", data.message || "Could not process request.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Network Error", "Could not connect to the server.");
    }
  };

  const handleSubmitNewPassword = async () => {
    if (!resetToken || !newPassword) {
      Alert.alert("Error", "Please provide both the token and your new password.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/resetpassword/${resetToken}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Success!", 
          "Your password has been changed. You can now log in.",
          [{ 
            text: "OK", 
            onPress: () => {
              setIsResetPhase(false);
              setResetToken('');
              setNewPassword('');
              setPassword(''); 
            } 
          }] 
        );
      } else {
        Alert.alert("Error", data.message || "Could not reset password.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Network Error", "Could not connect to the server.");
    }
  };

  // ==========================================
  // VIEW 1: ENTER TOKEN & NEW PASSWORD SCREEN
  // ==========================================
  if (isResetPhase) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a101f" />
        <TouchableOpacity style={styles.backButton} onPress={() => setIsResetPhase(false)}>
          <Ionicons name="arrow-back" size={24} color="#64ffda" />
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Update Password</Text>
        <Text style={styles.subtitle}>Enter the token you received and your new secure password.</Text>

        <TextInput
          style={[styles.input, focusedInput === 'token' && styles.inputActive]}
          placeholder="Paste Reset Token Here"
          placeholderTextColor="#8a9ab3"
          value={resetToken}
          onChangeText={setResetToken}
          autoCapitalize="none"
          onFocus={() => setFocusedInput('token')}
          onBlur={() => setFocusedInput(null)} 
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput, focusedInput === 'newPassword' && styles.inputActive]}
            placeholder="New Password"
            placeholderTextColor="#8a9ab3"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword} 
            onFocus={() => setFocusedInput('newPassword')} 
            onBlur={() => setFocusedInput(null)}        
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#8a9ab3" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmitNewPassword}>
          <Text style={styles.buttonText}>Change Password</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ==========================================
  // VIEW 2: FORGOT PASSWORD REQUEST SCREEN
  // ==========================================
  if (isForgotPassword) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a101f" />
        <TouchableOpacity style={styles.backButton} onPress={() => setIsForgotPassword(false)}>
          <Ionicons name="arrow-back" size={24} color="#64ffda" />
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your email address and we will send you a link to reset your password.</Text>

        <TextInput
          style={[styles.input, focusedInput === 'email' && styles.inputActive]}
          placeholder="Email"
          placeholderTextColor="#8a9ab3"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          onFocus={() => setFocusedInput('email')}
          onBlur={() => setFocusedInput(null)} 
        />

        <TouchableOpacity style={styles.button} onPress={handleRequestToken}>
          <Text style={styles.buttonText}>Send Reset Link</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ==========================================
  // VIEW 3: LOGIN / SIGNUP SCREEN
  // ==========================================
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a101f" />
      <Text style={styles.title}>Finance Tracker</Text>

      {!isLogin && (
        <TextInput
          style={[styles.input, focusedInput === 'name' && styles.inputActive]}
          placeholder="Full Name"
          placeholderTextColor="#8a9ab3"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          onFocus={() => setFocusedInput('name')}
          onBlur={() => setFocusedInput(null)}
        />
      )}

      <TextInput
        style={[styles.input, focusedInput === 'email' && styles.inputActive]}
        placeholder="Email"
        placeholderTextColor="#8a9ab3"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        onFocus={() => setFocusedInput('email')}
        onBlur={() => setFocusedInput(null)} 
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, styles.passwordInput, focusedInput === 'password' && styles.inputActive]}
          placeholder="Password"
          placeholderTextColor="#8a9ab3"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword} 
          onFocus={() => setFocusedInput('password')} 
          onBlur={() => setFocusedInput(null)}        
        />
        
        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#8a9ab3" />
        </TouchableOpacity>
      </View>

      {isLogin && (
        <TouchableOpacity style={styles.forgotPassword} onPress={() => setIsForgotPassword(true)}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>{isLogin ? "Login" : "Sign Up"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.toggleContainer} onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.toggleText}>
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#0a101f' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 40, color: '#ffffff' },
  subtitle: { color: '#8a9ab3', textAlign: 'center', marginBottom: 30, fontSize: 16, lineHeight: 22 }, 
  backButton: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 60, left: 20 }, 
  backText: { color: '#64ffda', fontSize: 16, marginLeft: 5 }, 
  input: { backgroundColor: '#16233d', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#2d3e60', fontSize: 16, color: '#ffffff' },
  inputActive: { borderColor: '#64ffda', borderWidth: 1 },
  passwordContainer: { position: 'relative', marginBottom: 5 },
  passwordInput: { marginBottom: 0, paddingRight: 50 },
  eyeIcon: { position: 'absolute', right: 15, top: 15 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { color: '#64ffda', fontSize: 14 },
  button: { backgroundColor: '#0056b3', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, elevation: 5, shadowColor: '#64ffda', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 5 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  toggleContainer: { marginTop: 25, alignItems: 'center' },
  toggleText: { color: '#8a9ab3', fontSize: 15 }
});