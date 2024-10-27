import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../src/styles/SlideMenuStyles';

const SlideMenu = ({ navigation }) => (
  <View style={styles.menuContainer}>
    <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
      <Text style={styles.menuItem}>Профил</Text>
    </TouchableOpacity>
    {/* Добавете бъдещи елементи на менюто тук */}
  </View>
);

export default SlideMenu;