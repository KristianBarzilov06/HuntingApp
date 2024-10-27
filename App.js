import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import MainView from './components/MainView';
import ChatScreen from './components/ChatScreen';
import ImageUploadComponent from './components/ImageUploadComponent';
import CameraScreen from './components/CameraScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginView} options={{ headerShown: false }}/>
        <Stack.Screen name="Register" component={RegisterView} options={{ headerShown: false }}/>
        <Stack.Screen name="Main" component={MainView} options={{ headerShown: false }}/>
        <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="ImageUpload" component={ImageUploadComponent} />
        <Stack.Screen name="CameraScreen" component={ImageUploadComponent} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;