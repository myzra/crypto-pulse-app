// components/SearchBar.js
import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../constants/theme';

const SearchBar = ({ value, onChangeText, placeholder = "Search..." }) => {
  const { theme } = useTheme();

  const themedStyles = StyleSheet.create({
    container: {
      paddingHorizontal: 0,
      paddingVertical: 3,
      backgroundColor: theme.surfaceElevated,
      marginTop: 15,
      marginHorizontal: 20,
      borderRadius: 15,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.inputBackground,
      borderRadius: 10,
      paddingHorizontal: 15,
      height: 45,
    },
    searchIcon: {
      marginRight: 10,
      color: theme.searchIconColor,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.inputText,
    },
  });

  return (
    <View style={themedStyles.container}>
      <View style={themedStyles.searchBar}>
        <Ionicons 
          name="search" 
          size={20} 
          color={theme.searchIconColor} 
          style={themedStyles.searchIcon} 
        />
        <TextInput
          style={themedStyles.searchInput}
          placeholder={placeholder}
          placeholderTextColor={theme.inputPlaceholder}
          value={value}
          onChangeText={onChangeText}
        />
      </View>
    </View>
  );
};

export default SearchBar;
