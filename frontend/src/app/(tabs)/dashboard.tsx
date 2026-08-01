import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform, StatusBar as RNStatusBar, Alert, ActivityIndicator, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router'; // <-- Added useFocusEffect
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import AddTransactionModal from '../../components/AddTransactionModal';

export default function DashboardScreen() {
  const router = useRouter();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('user'); 
  const [isModalVisible, setModalVisible] = useState(false);
  
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [sort, setSort] = useState<'date' | 'amount'>('date');
  const { theme, isDarkMode, currency } = useTheme();
  
  const API_URL = 'http://192.168.1.6:5000/api/transactions';

  // NEW: useFocusEffect triggers every time the Dashboard tab is opened
  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
      fetchUser(); // This will fetch the latest saved name every time you view the dashboard
    }, [])
  );

  const fetchUser = async () => {
    try {
      const storedName = await AsyncStorage.getItem('userName');
      if (storedName) {
        setUserName(storedName);
      }
    } catch (error) {
      console.error("Error fetching username:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/');
        return;
      }

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
      } else {
        Alert.alert("Error", data.message || "Could not fetch transactions.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Network Error", "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: string) => {
    setTransactionToDelete(id);
    setDeleteModalVisible(true);
  };

  const deleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/${transactionToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      });

      if (response.ok) {
        setDeleteModalVisible(false); 
        setTransactionToDelete(null); 
        fetchTransactions();          
      } else {
        const data = await response.json();
        Alert.alert("Error", data.message || "Could not delete transaction.");
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

  const calculateBalance = () => {
    return transactions.reduce((acc, current) => {
      const amountValue = current.type === 'expense' ? -Math.abs(current.amount) : Math.abs(current.amount);
      return acc + amountValue;
    }, 0).toFixed(2);
  };

  const getProcessedTransactions = () => {
    return [...transactions]
      .filter(item => {
        if (filter === 'all') return true;
        return item.type === filter;
      })
      .sort((a, b) => {
        if (sort === 'amount') {
          return Math.abs(b.amount) - Math.abs(a.amount); 
        } else {
          if (b.createdAt && a.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return b._id > a._id ? 1 : -1; 
        }
      });
  };

  const renderTransaction = ({ item }: { item: any }) => {
    const isIncome = item.type === 'income';
    
    return (
      <TouchableOpacity 
        style={[styles.transactionCard, { backgroundColor: theme.card, borderColor: theme.border }]} 
        activeOpacity={0.7}
        onPress={() => {
          setEditingTransaction(item);
          setModalVisible(true);
        }}
        onLongPress={() => confirmDelete(item._id)}
      >
        <View style={styles.transactionLeft}>
          <View style={[styles.iconContainer, { backgroundColor: isIncome ? theme.iconBg : theme.dangerBg }]}>
            <Ionicons 
              name={isIncome ? "arrow-down" : "arrow-up"} 
              size={20} 
              color={isIncome ? theme.primary : theme.danger} 
            />
          </View>
          <View>
            <Text style={[styles.transactionText, { color: theme.text }]}>{item.text}</Text>
            <Text style={[styles.transactionCategory, { color: theme.subtext }]}>{item.category}</Text>
          </View>
        </View>
        <Text style={[styles.transactionAmount, { color: isIncome ? theme.primary : theme.text }]}>
          {isIncome ? '+' : '-'}{currency} {Math.abs(item.amount).toFixed(2)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View style={styles.container}>
        
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.subtext }]}>Welcome back,</Text>
            <Text style={[styles.username, { color: theme.text }]}>@{userName} 👋</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={[styles.logoutButton, { backgroundColor: theme.dangerBg }]}>
            <Ionicons name="log-out-outline" size={28} color={theme.danger} />
          </TouchableOpacity>
        </View>

        <View style={[styles.balanceCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.balanceLabel, { color: theme.subtext }]}>Total Balance</Text>
          <Text style={[styles.balanceAmount, { color: theme.text }]}>
            {loading ? "..." : `${currency} ${calculateBalance()}`}
          </Text>
        </View>

        <View style={styles.listHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Transactions</Text>
        </View>

        <View style={styles.controlsContainer}>
          <View style={[styles.filterTabs, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity 
              style={[styles.tab, filter === 'all' && { backgroundColor: theme.background }]} 
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.tabText, { color: theme.subtext }, filter === 'all' && { color: theme.primary }]}>All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, filter === 'income' && { backgroundColor: theme.background }]} 
              onPress={() => setFilter('income')}
            >
              <Text style={[styles.tabText, { color: theme.subtext }, filter === 'income' && { color: theme.primary }]}>In</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, filter === 'expense' && { backgroundColor: theme.background }]} 
              onPress={() => setFilter('expense')}
            >
              <Text style={[styles.tabText, { color: theme.subtext }, filter === 'expense' && { color: theme.primary }]}>Out</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.sortButton, { backgroundColor: theme.card, borderColor: theme.border }]} 
            onPress={() => setSort(sort === 'date' ? 'amount' : 'date')}
          >
            <Ionicons name={sort === 'date' ? 'calendar-outline' : 'cash-outline'} size={18} color={theme.primary} />
            <Text style={[styles.sortText, { color: theme.primary }]}>{sort === 'date' ? 'Date' : 'Amount'}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={getProcessedTransactions()}
            keyExtractor={(item) => item._id} 
            renderItem={renderTransaction}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: theme.subtext }]}>
                {transactions.length === 0 
                  ? "No financial records found. Tap + to begin!" 
                  : "No records match this filter."}
              </Text>
            }
          />
        )}

        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: theme.primary }]} 
          onPress={() => {
            setEditingTransaction(null); 
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={32} color={theme.background} />
        </TouchableOpacity>

      </View>

      <AddTransactionModal 
        isVisible={isModalVisible} 
        onClose={() => {
          setModalVisible(false);
          setEditingTransaction(null); 
        }} 
        onSuccess={fetchTransactions} 
        editData={editingTransaction} 
      />

      <Modal
        visible={isDeleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setDeleteModalVisible(false);
          setTransactionToDelete(null);
        }}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={[styles.deleteModalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.deleteIconContainer, { backgroundColor: theme.dangerBg }]}>
              <Ionicons name="trash-outline" size={32} color={theme.danger} />
            </View>
            <Text style={[styles.deleteModalTitle, { color: theme.text }]}>Delete Transaction</Text>
            <Text style={[styles.deleteModalText, { color: theme.subtext }]}>
              Are you sure you want to delete this record? This action cannot be undone.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity 
                style={[styles.deleteButton, styles.cancelDeleteButton, { backgroundColor: theme.background, borderColor: theme.border }]} 
                onPress={() => {
                  setDeleteModalVisible(false);
                  setTransactionToDelete(null);
                }}
              >
                <Text style={[styles.cancelDeleteButtonText, { color: theme.subtext }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.deleteButton, styles.confirmDeleteButton, { backgroundColor: theme.danger }]} onPress={deleteTransaction}>
                <Text style={styles.confirmDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0a101f', paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5, marginBottom: 25 },
  greeting: { fontSize: 16 },
  username: { fontSize: 24, fontWeight: 'bold' },
  logoutButton: { padding: 8, borderRadius: 12 },
  balanceCard: { borderRadius: 20, padding: 25, marginBottom: 25, borderWidth: 1, alignItems: 'center', elevation: 5 },
  balanceLabel: { fontSize: 16, marginBottom: 10 },
  balanceAmount: { fontSize: 40, fontWeight: 'bold' },
  
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold' },
  
  controlsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  filterTabs: { flexDirection: 'row', borderRadius: 8, padding: 4, borderWidth: 1 },
  tab: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  tabText: { fontSize: 14, fontWeight: 'bold' },
  sortButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  sortText: { fontSize: 14, fontWeight: 'bold', marginLeft: 6 },

  listContainer: { paddingBottom: 100 },
  transactionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: 'transparent' },
  transactionLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  transactionText: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  transactionCategory: { fontSize: 12 },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, zIndex: 999 },
  
  deleteModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  deleteModalContent: { borderRadius: 20, padding: 25, width: '100%', maxWidth: 350, alignItems: 'center', borderWidth: 1, elevation: 10 },
  deleteIconContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  deleteModalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  deleteModalText: { fontSize: 15, textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  deleteModalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  deleteButton: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  cancelDeleteButton: { marginRight: 8, borderWidth: 1 },
  confirmDeleteButton: { marginLeft: 8 },
  cancelDeleteButtonText: { fontSize: 16, fontWeight: 'bold' },
  confirmDeleteButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});