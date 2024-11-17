import React, { useState, useEffect } from 'react';
import * as Font from 'expo-font';
import AppLoading from 'expo-app-loading';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import MainView from './components/MainView';
import Profile from './components/Profile';
import ChatScreen from './components/ChatScreen';
import ImageUploadComponent from './components/ImageUploadComponent';
import CameraScreen from './components/CameraScreen';
import HunterProfileSetup from './components/HunterProfileSetup';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

const Stack = createNativeStackNavigator();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f7f7f7',
  },
};

const App = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadFonts = async () => {
    await Font.loadAsync({
      Alice: require('./assets/fonts/Alice-Regular.ttf'),
    });
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await AsyncStorage.getItem('userToken');
        setIsLoggedIn(!!user);
      } catch (error) {
        console.error('Грешка при проверка на потребителя:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadResources = async () => {
      await loadFonts();
      await checkAuth();
    };

    loadResources().then(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A7845" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={MyTheme}>
      <Stack.Navigator initialRouteName={isLoggedIn ? 'Main' : 'Login'}>
        <Stack.Screen name="Login" component={LoginView} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterView} options={{ headerShown: false }} />
        <Stack.Screen name="HunterProfileSetup" component={HunterProfileSetup} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainView} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ImageUpload" component={ImageUploadComponent} options={{ headerShown: false }} />
        <Stack.Screen name="CameraScreen" component={CameraScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
  },
});

export default App;
