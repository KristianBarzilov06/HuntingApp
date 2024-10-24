import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import styles from '../styles/MainStyles'; // Импортираме стиловете

const MainView = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Групи на ловните дружини</Text>
      <ScrollView>
        {/* Тук може да се рендират групи */}
        <TouchableOpacity style={styles.groupButton}>
          <Text style={styles.groupButtonText}>Присъедини се към група 1</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.groupButton}>
          <Text style={styles.groupButtonText}>Присъедини се към група 2</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.groupButton}>
          <Text style={styles.groupButtonText}>Присъедини се към група 3</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default MainView;