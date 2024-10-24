import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import MainView from './components/MainView';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Register">
        <Stack.Screen name="Login" component={LoginView} />
        <Stack.Screen name="Register" component={RegisterView} />
        <Stack.Screen name="Main" component={MainView} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;