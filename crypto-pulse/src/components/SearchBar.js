// components/SearchBar.js
import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SearchBar = ({ value, onChangeText, placeholder = "Search..." }) => {
  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#9E9E9E" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#9E9E9E"
          value={value}
          onChangeText={onChangeText}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 3,
    backgroundColor: '#F3F4F6',
    marginTop: 15,
    marginHorizontal: 20,
    borderRadius: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
    color: '#ADAEBC',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ADAEBC',
  },
});

export default SearchBar;
