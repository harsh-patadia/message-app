import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ChatListScreen from './screens/ChatListScreen';
import ChatScreen from './screens/ChatScreen';
import GroupListScreen from './screens/GroutListScreen';
import GroupChatScreen from './screens/GroutChatScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Chats" component={ChatListScreen} options={{ title: 'Chats' }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
        <Stack.Screen name="GroupList" component={GroupListScreen} options={{ title: 'Group Chats' }} />
        <Stack.Screen name="GroupChat" component={GroupChatScreen} options={{ title: 'Group Chat' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
