import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import ChatListScreen from './ChatListScreen';
import GroupListScreen from './GroutListScreen';

const Tab = createMaterialTopTabNavigator();

export default function ChatTabs({ route }) {
  const { user } = route.params;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold' },
        tabBarIndicatorStyle: { backgroundColor: '#005fa3', height: 3 },
        tabBarStyle: { backgroundColor: '#fff', elevation: 4 },
      }}
    >
      <Tab.Screen name="Users" component={ChatListScreen} initialParams={{ user }} />
      <Tab.Screen name="Groups" component={GroupListScreen} initialParams={{ user }} />
    </Tab.Navigator>
  );
}
