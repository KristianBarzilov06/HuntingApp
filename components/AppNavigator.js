import { createStackNavigator } from '@react-navigation/stack';
import ChatScreen from './ChatScreen';
import MainView from './MainView';

const Stack = createStackNavigator();

const AppNavigator = () => (
  <Stack.Navigator initialRouteName="MainView">
    <Stack.Screen name="MainView" component={MainView} />
    <Stack.Screen name="ChatScreen" component={ChatScreen} />
  </Stack.Navigator>
);

export default AppNavigator;