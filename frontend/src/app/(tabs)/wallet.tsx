import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator, Platform, StatusBar as RNStatusBar, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

// IMPORT THE GLOBAL THEME HOOK
import { useTheme } from '../../context/ThemeContext';

export default function WalletScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [budgetGoal, setBudgetGoal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  // TUNE INTO THE THEME & CURRENCY CONTEXT
  const { theme, isDarkMode, currency } = useTheme();

  const API_URL = 'http://192.168.1.6:5000/api/transactions';

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const savedBudget = await AsyncStorage.getItem('monthlyBudget');
      if (savedBudget) {
        setBudgetGoal(Number(savedBudget));
      }

      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const response = await fetch(API_URL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          }
        });
        const data = await response.json();
        if (response.ok) {
          setTransactions(data);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async () => {
    if (!budgetInput || isNaN(Number(budgetInput))) return;
    
    try {
      await AsyncStorage.setItem('monthlyBudget', budgetInput);
      setBudgetGoal(Number(budgetInput));
      setModalVisible(false);
      setBudgetInput('');
    } catch (error) {
      console.error("Error saving budget:", error);
    }
  };

  const currentMonthDate = new Date();
  const currentMonthName = currentMonthDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentMonthDate.getFullYear();

  const currentMonthTransactions = transactions.filter(t => {
    const tDate = t.createdAt ? new Date(t.createdAt) : new Date(); 
    return tDate.getMonth() === currentMonthDate.getMonth() && tDate.getFullYear() === currentYear;
  });

  const totalExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

  const remaining = budgetGoal - totalExpenses;
  const progressPercentage = budgetGoal > 0 ? (totalExpenses / budgetGoal) * 100 : 0;
  
  let progressColor = theme.primary; 
  if (progressPercentage >= 80 && progressPercentage < 100) {
    progressColor = '#FFB703'; 
  } else if (progressPercentage >= 100) {
    progressColor = theme.danger; 
  }

  const barWidth = `${Math.min(progressPercentage, 100)}%`;

  const generatePDFReport = async () => {
    setIsGeneratingPDF(true);
    try {
      const totalIncome = currentMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
        
      const netBalance = totalIncome - totalExpenses;

      const tableRows = currentMonthTransactions.map(t => {
        const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
        const typeColor = t.type === 'income' ? '#00CC66' : '#ff4c4c';
        return `
          <tr>
            <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0;">${dateStr}</td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0;">${t.text}</td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0;">${t.category}</td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: ${typeColor}; font-weight: bold;">${t.type.toUpperCase()}</td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0;">${currency} ${Math.abs(t.amount).toFixed(2)}</td>
          </tr>
        `;
      }).join('');

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; }
              h1 { color: #0f172a; text-align: center; margin-bottom: 5px; fontSize: 32px; }
              .subtitle { text-align: center; font-size: 18px; color: #64748b; margin-bottom: 40px; }
              .summary-box { display: flex; justify-content: space-between; background-color: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 40px; border: 1px solid #e2e8f0; }
              .summary-item { text-align: center; width: 30%; }
              .summary-title { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
              .summary-value { font-size: 24px; font-weight: bold; margin-top: 8px; }
              .val-income { color: #00CC66; }
              .val-expense { color: #ff4c4c; }
              .val-net { color: #0f172a; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
              th { background-color: #0f172a; color: white; text-align: left; padding: 14px 8px; font-weight: 500; }
              .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #94a3b8; }
            </style>
          </head>
          <body>
            <h1>Monthly Financial Report</h1>
            <div class="subtitle">${currentMonthName} ${currentYear}</div>

            <div class="summary-box">
              <div class="summary-item">
                <div class="summary-title">Total Income</div>
                <div class="summary-value val-income">${currency} ${totalIncome.toFixed(2)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-title">Total Expenses</div>
                <div class="summary-value val-expense">${currency} ${totalExpenses.toFixed(2)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-title">Net Balance</div>
                <div class="summary-value val-net">${currency} ${netBalance.toFixed(2)}</div>
              </div>
            </div>

            <h2 style="color: #0f172a; margin-bottom: 15px; font-size: 20px;">Transaction History</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows || '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #64748b;">No transactions recorded this month.</td></tr>'}
              </tbody>
            </table>
            
            <div class="footer">Generated securely by your Personal Finance Tracker App</div>
          </body>
        </html>
      `;

      const { base64 } = await Print.printToFileAsync({ html, base64: true });
      const safePath = `${FileSystem.documentDirectory}Monthly_Finance_Report.pdf`;
      
      if (base64) {
        await FileSystem.writeAsStringAsync(safePath, base64, { encoding: FileSystem.EncodingType.Base64 });
      }
      
      await Sharing.shareAsync(safePath, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Export Monthly Report' });

    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Could not generate the PDF report.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View style={styles.container}>
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Budget Goals</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>{currentMonthName} Overview</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            <View style={[styles.budgetCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.budgetHeader}>
                <View>
                  <Text style={[styles.budgetLabel, { color: theme.subtext }]}>Monthly Budget Limit</Text>
                  <Text style={[styles.budgetAmount, { color: theme.text }]}>
                    {budgetGoal > 0 ? `${currency} ${budgetGoal.toFixed(2)}` : "Not Set"}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.editButton, { backgroundColor: theme.iconBg }]}>
                  <Ionicons name="pencil" size={20} color={theme.primary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.progressBarBackground, { backgroundColor: theme.background }]}>
                <View style={[styles.progressBarFill, { width: barWidth as any, backgroundColor: progressColor }]} />
              </View> 
              {/* ^^^ RESTORED MISSING CLOSING TAG ABOVE ^^^ */}

              <View style={styles.budgetFooter}>
                <Text style={[styles.spentText, { color: theme.text }]}>Spent: {currency} {totalExpenses.toFixed(2)}</Text>
                <Text style={[styles.remainingText, { color: remaining < 0 ? theme.danger : theme.subtext }]}>
                  {remaining < 0 ? `Overspent: ${currency} ${Math.abs(remaining).toFixed(2)}` : `Remaining: ${currency} ${remaining.toFixed(2)}`}
                </Text>
              </View>
            </View>

            <View style={[styles.messageCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name={progressPercentage >= 100 ? "warning" : "checkmark-circle"} size={32} color={progressColor} />
              <Text style={[styles.messageText, { color: theme.text }]}>
                {budgetGoal === 0 ? "Set a budget above to start tracking your financial goals!"
                  : progressPercentage >= 100 ? "You have exceeded your monthly budget. Time to cut back!"
                  : progressPercentage >= 80 ? "You are nearing your budget limit. Spend carefully!"
                  : "You are doing great! Keep your spending on track."}
              </Text>
            </View>

            <TouchableOpacity style={[styles.exportButton, { backgroundColor: theme.primary }]} onPress={generatePDFReport} disabled={isGeneratingPDF}>
              {isGeneratingPDF ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <>
                  <Ionicons name="document-text" size={20} color={theme.background} style={{ marginRight: 8 }} />
                  <Text style={[styles.exportButtonText, { color: theme.background }]}>Generate PDF Report</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        <Modal visible={isModalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Set Monthly Budget</Text>
              <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>How much do you want to spend in {currentMonthName}?</Text>
              
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                placeholder="e.g. 50000"
                placeholderTextColor={theme.subtext}
                keyboardType="numeric"
                value={budgetInput}
                onChangeText={setBudgetInput}
                autoFocus
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.button, styles.cancelButton, { backgroundColor: theme.background, borderColor: theme.border }]} onPress={() => { setModalVisible(false); setBudgetInput(''); }}>
                  <Text style={[styles.cancelButtonText, { color: theme.subtext }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleSaveBudget}>
                  <Text style={[styles.saveButtonText, { color: theme.background }]}>Save Goal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { marginTop: 10, marginBottom: 30 },
  title: { fontSize: 32, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginTop: 5 },
  
  budgetCard: { borderRadius: 20, padding: 25, borderWidth: 1, elevation: 5, marginBottom: 20 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  budgetLabel: { fontSize: 14, marginBottom: 5 },
  budgetAmount: { fontSize: 32, fontWeight: 'bold' },
  editButton: { padding: 10, borderRadius: 12 },
  
  progressBarBackground: { height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 15 },
  progressBarFill: { height: '100%', borderRadius: 6 },
  
  budgetFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  spentText: { fontSize: 14, fontWeight: 'bold' },
  remainingText: { fontSize: 14 },
  
  messageCard: { flexDirection: 'row', padding: 20, borderRadius: 15, alignItems: 'center', borderWidth: 1, marginBottom: 30 },
  messageText: { flex: 1, marginLeft: 15, fontSize: 15, lineHeight: 22 },
  exportButton: { flexDirection: 'row', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  exportButtonText: { fontSize: 16, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 25, width: '100%', maxWidth: 350, borderWidth: 1 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  modalSubtitle: { fontSize: 15, marginBottom: 20 },
  input: { padding: 15, borderRadius: 10, marginBottom: 25, borderWidth: 1, fontSize: 18, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  button: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  cancelButton: { marginRight: 8, borderWidth: 1 },
  saveButton: { marginLeft: 8 },
  cancelButtonText: { fontSize: 16, fontWeight: 'bold' },
  saveButtonText: { fontSize: 16, fontWeight: 'bold' }
});