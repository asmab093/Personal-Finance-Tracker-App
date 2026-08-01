import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext'; // <-- Path uses two sets of dots '../../'

export default function TabLayout() {
  const { theme } = useTheme(); 

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.subtext,
      }}
    >
      <Tabs.Screen 
        name="dashboard" 
        options={{ tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />, tabBarLabel: 'Home' }} 
      />
      <Tabs.Screen 
        name="analytics" 
        options={{ tabBarIcon: ({ color }) => <Ionicons name="pie-chart" size={24} color={color} />, tabBarLabel: 'Analytics' }} 
      />
      <Tabs.Screen 
        name="wallet" 
        options={{ tabBarIcon: ({ color }) => <Ionicons name="wallet" size={24} color={color} />, tabBarLabel: 'Wallet' }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />, tabBarLabel: 'Profile' }} 
      />
    </Tabs>
  );
}