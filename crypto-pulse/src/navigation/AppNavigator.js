import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import HomeScreen from '../screens/HomeScreen';
import FavScreen from '../screens/FavScreen';

const Tab = createMaterialTopTabNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          swipeEnabled: true,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Favorites" component={FavScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
