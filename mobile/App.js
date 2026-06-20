import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'

import { AuthProvider, useAuth } from './src/contexts/AuthContext'
import api from './src/lib/api'

import LoginScreen from './src/screens/LoginScreen'
import RegisterScreen from './src/screens/RegisterScreen'
import MyOrdersScreen from './src/screens/MyOrdersScreen'
import CreateOrderScreen from './src/screens/CreateOrderScreen'
import OpenOrdersScreen from './src/screens/OpenOrdersScreen'
import OrderDetailScreen from './src/screens/OrderDetailScreen'
import NotificationsScreen from './src/screens/NotificationsScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import DriverRegisterScreen from './src/screens/DriverRegisterScreen'
import DriverOrdersScreen from './src/screens/DriverOrdersScreen'
import TrackOrderScreen from './src/screens/TrackOrderScreen'
import PublicTrackingScreen from './src/screens/PublicTrackingScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function TabIcon({ name, focused, unread }) {
  const icons = {
    MyOrders: focused ? '📦' : '📦',
    OpenOrders: focused ? '🔍' : '🔍',
    Notifications: focused ? '🔔' : '🔔',
    Profile: focused ? '👤' : '👤',
  }
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>{icons[name]}</Text>
      {unread > 0 && (
        <View style={{
          position: 'absolute', top: -4, right: -8,
          minWidth: 16, height: 16, borderRadius: 8,
          backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: 3,
        }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>
            {unread > 99 ? '99+' : unread}
          </Text>
        </View>
      )}
    </View>
  )
}

function MainTabs() {
  const [unread, setUnread] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    const fetch = () => {
      api.get('/notifications/unread-count')
        .then(r => setUnread(r.data.count ?? 0))
        .catch(() => {})
    }
    fetch()
    intervalRef.current = setInterval(fetch, 30000)
    return () => clearInterval(intervalRef.current)
  }, [])

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarActiveTintColor: '#1d4ed8', tabBarInactiveTintColor: '#9ca3af' }}
    >
      <Tab.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{
          title: 'Đơn của tôi',
          tabBarIcon: ({ focused }) => <TabIcon name="MyOrders" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="OpenOrders"
        component={OpenOrdersScreen}
        options={{
          title: 'Nhận đơn',
          tabBarIcon: ({ focused }) => <TabIcon name="OpenOrders" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ focused }) => <TabIcon name="Notifications" focused={focused} unread={unread} />,
          tabBarBadge: unread > 0 ? unread : undefined,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Tôi',
          tabBarIcon: ({ focused }) => <TabIcon name="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  )
}

function AppNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    )
  }

  return (
    <Stack.Navigator>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Đăng ký' }} />
          <Stack.Screen name="TrackOrder" component={TrackOrderScreen} options={{ title: 'Theo dõi đơn hàng' }} />
          <Stack.Screen name="PublicTracking" component={PublicTrackingScreen} options={{ title: 'Trạng thái đơn hàng' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
            options={{ title: 'Chi tiết đơn hàng' }}
          />
          <Stack.Screen
            name="CreateOrder"
            component={CreateOrderScreen}
            options={{ title: 'Tạo đơn hàng' }}
          />
          <Stack.Screen
            name="DriverRegister"
            component={DriverRegisterScreen}
            options={{ title: 'Đăng ký tài xế' }}
          />
          <Stack.Screen
            name="DriverOrders"
            component={DriverOrdersScreen}
            options={{ title: 'Lịch sử đơn hàng' }}
          />
        </>
      )}
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
