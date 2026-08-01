import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions, Platform, StatusBar as RNStatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-chart-kit';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; 

import { useTheme } from '../../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { theme, isDarkMode, currency } = useTheme();

  const API_URL = 'http://192.168.1.6:5000/api/transactions';

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [])
  );

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = () => {
    const expenses = transactions.filter(t => t.type === 'expense');

    if (expenses.length === 0) return [];

    const categoryTotals: { [key: string]: number } = {};
    expenses.forEach(t => {
      const cat = t.category.trim().charAt(0).toUpperCase() + t.category.trim().slice(1).toLowerCase();
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(t.amount);
    });

    const colors = [
      '#00bbe0', '#6400e6', '#eba903', '#e7018b', '#01e481', '#0158e4'
    ];

    return Object.keys(categoryTotals).map((key, index) => ({
      name: key,
      amount: categoryTotals[key],
      color: colors[index % colors.length], 
      legendFontColor: theme.subtext,
      legendFontSize: 14,
    })).sort((a, b) => b.amount - a.amount); 
  };

  const chartData = processChartData();
  const totalExpenses = chartData.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Analytics</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>Your Expense Breakdown</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 60 }} />
        ) : chartData.length > 0 ? (
          <>
            <View style={[styles.chartContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <PieChart
                data={chartData}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                }}
                accessor={"amount"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                center={[10, 0]}
                absolute 
              />
            </View>

            <View style={[styles.summaryCard, { backgroundColor: theme.dangerBg, borderColor: theme.danger }]}>
              <Text style={[styles.summaryLabel, { color: theme.danger }]}>Total Spent</Text>
              <Text style={[styles.summaryAmount, { color: theme.text }]}>{currency} {totalExpenses.toFixed(2)}</Text>
            </View>

            <View style={styles.listHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Category Details</Text>
            </View>

            {chartData.map((item, index) => {
              const percentage = ((item.amount / totalExpenses) * 100).toFixed(1);
              
              return (
                <View key={index} style={[styles.categoryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                    <View>
                      <Text style={[styles.categoryName, { color: theme.text }]}>{item.name}</Text>
                      <Text style={[styles.categoryPercentage, { color: theme.subtext }]}>{percentage}% of total</Text>
                    </View>
                  </View>
                 <Text style={[styles.categoryAmount, { color: theme.danger }]}>{currency} {item.amount.toFixed(2)}</Text>
                </View>
              );
            })}
          </>
        ) : (
          /* UPDATED: ACTION-ORIENTED EMPTY STATE */
          <View style={[styles.emptyStateCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.emptyIconBackground, { backgroundColor: theme.background }]}>
              <Ionicons name="bar-chart" size={72} color={theme.subtext} style={{ opacity: 0.6 }} />
            </View>
            <Text style={[styles.emptyStateTitle, { color: theme.text }]}>Time to Track! 🚀</Text>
            <Text style={[styles.emptyStateDesc, { color: theme.subtext }]}>
              It's a little quiet in here. Tap the '+' button on your dashboard to log an expense and watch your charts instantly come to life!
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { marginTop: 10, marginBottom: 30 },
  title: { fontSize: 32, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginTop: 5 },
  
  chartContainer: { borderRadius: 20, paddingVertical: 20, alignItems: 'center', borderWidth: 1, marginBottom: 20, elevation: 5 },
  
  summaryCard: { borderRadius: 15, padding: 20, alignItems: 'center', marginBottom: 30, borderWidth: 1 },
  summaryLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  summaryAmount: { fontSize: 28, fontWeight: 'bold' },
  
  listHeader: { marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold' },
  
  categoryCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
  categoryLeft: { flexDirection: 'row', alignItems: 'center' },
  colorDot: { width: 16, height: 16, borderRadius: 8, marginRight: 15 },
  categoryName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  categoryPercentage: { fontSize: 12 },
  categoryAmount: { fontSize: 16, fontWeight: 'bold' },
  
  emptyStateCard: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 20,
  },
  emptyIconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateDesc: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  }
});