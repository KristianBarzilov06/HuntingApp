import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginView from './src/components/Login';
import RegisterView from './src/components/Register';
import MainView from './src/components/Main';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginView} />
        <Stack.Screen name="Register" component={RegisterView} />
        <Stack.Screen name="Main" component={MainView} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;