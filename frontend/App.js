import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import Dashboard from './src/screens/Dashboard';
import Settings from './src/screens/Settings';

const Stack = createStackNavigator();

// Tema personalizado para la aplicación
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3498db',
    accent: '#9b59b6',
    surface: '#ffffff',
    background: '#f8f9fa',
  },
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#2c3e50" />
        <Stack.Navigator
          initialRouteName="Dashboard"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#f8f9fa' },
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        >
          <Stack.Screen 
            name="Dashboard" 
            component={Dashboard}
            options={{
              title: 'NaviStick Monitor'
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={Settings}
            options={{
              title: 'Configuración',
              presentation: 'modal',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
