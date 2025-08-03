import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import HomeScreen from '../screens/HomeScreen';
import FavScreen from '../screens/FavScreen';

const Tab = createMaterialTopTabNavigator();

const SwipeNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        swipeEnabled: true,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Favorites" component={FavScreen} />
      {/* add new tabs */}
    </Tab.Navigator>
  );
};

export default SwipeNavigator;
