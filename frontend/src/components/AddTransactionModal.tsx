import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface AddTransactionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: any; // NEW: Optional prop to hold the transaction being edited
}

export default function AddTransactionModal({ isVisible, onClose, onSuccess, editData }: AddTransactionModalProps) {
  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense'); 
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = 'http://192.168.1.6:5000/api/transactions';

  // NEW: When the modal opens, check if we are editing. If yes, fill the inputs.
  useEffect(() => {
    if (editData && isVisible) {
      setText(editData.text);
      setAmount(Math.abs(editData.amount).toString()); // Ensure it shows as a positive number
      setType(editData.type);
      setCategory(editData.category);
    } else if (!isVisible) {
      // Clear inputs when closed
      setText('');
      setAmount('');
      setCategory('');
      setType('expense');
    }
  }, [editData, isVisible]);

  const handleAddTransaction = async () => {
    if (!text || !amount || !category) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (isNaN(Number(amount))) {
      Alert.alert("Error", "Amount must be a valid number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // NEW: Determine if we are updating (PUT) or creating (POST)
      const isEditing = !!editData;
      const endpoint = isEditing ? `${API_URL}/${editData._id}` : API_URL;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          text,
          amount: Number(amount),
          type,
          category
        })
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        Alert.alert("Error", data.message || "Could not save transaction.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Network Error", "Could not submit transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            {/* CHANGED: Dynamic Title */}
            <Text style={styles.modalTitle}>{editData ? "Edit Transaction" : "New Transaction"}</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={28} color="#8a9ab3" />
            </TouchableOpacity>
          </View>

          <View style={styles.typeSelector}>
            <TouchableOpacity 
              style={[styles.typeButton, type === 'expense' && styles.typeExpenseActive]}
              onPress={() => setType('expense')}
            >
              <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeButton, type === 'income' && styles.typeIncomeActive]}
              onPress={() => setType('income')}
            >
              <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>Income</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Description (e.g. Groceries)"
            placeholderTextColor="#8a9ab3"
            value={text}
            onChangeText={setText}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Amount (e.g. 50.00)"
            placeholderTextColor="#8a9ab3"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <TextInput
            style={styles.input}
            placeholder="Category (e.g. Food, Salary)"
            placeholderTextColor="#8a9ab3"
            value={category}
            onChangeText={setCategory}
          />

          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleAddTransaction}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#0a101f" />
            ) : (
              <Text style={styles.submitButtonText}>{editData ? "Save Changes" : "Add Transaction"}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.7)' },
  modalContent: { backgroundColor: '#16233d', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, minHeight: 400, borderWidth: 1, borderColor: '#2d3e60' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  typeSelector: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#0a101f', borderRadius: 10, padding: 4 },
  typeButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  typeExpenseActive: { backgroundColor: 'rgba(255, 76, 76, 0.2)' },
  typeIncomeActive: { backgroundColor: 'rgba(100, 255, 218, 0.2)' },
  typeText: { color: '#8a9ab3', fontWeight: 'bold' },
  typeTextActive: { color: '#ffffff' },
  input: { backgroundColor: '#0a101f', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#2d3e60', color: '#ffffff', fontSize: 16 },
  submitButton: { backgroundColor: '#64ffda', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#0a101f', fontSize: 18, fontWeight: 'bold' }
});