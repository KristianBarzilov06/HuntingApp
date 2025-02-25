import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import MainView from './components/MainView';
import Profile from './components/Profile';
import ChatScreen from './components/ChatScreen';
import LoadingScreen from './components/LoadingScreen';
import AdminPanel from './components/AdminPanel';
import EventsScreen from './components/EventsScreen';

const Stack = createNativeStackNavigator();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f7f7f7',
  },
};

const App = () => {
  return (
    <NavigationContainer theme={MyTheme}>
      <Stack.Navigator initialRouteName="Loading">
        <Stack.Screen name="Loading" component={LoadingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginView} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterView} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainView} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AdminPanel" component={AdminPanel} options={{ headerShown: false }} />
        <Stack.Screen name="EventsScreen" component={EventsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
