import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // За иконки
import styles from '../src/styles/MainStyles'; // Импортираме стиловете

const MainView = ({ navigation }) => {
  // Примерен списък с групи
  const groups = [
    { id: 1, name: 'ЛРД-Дюлево', chairman: 'Някой Няков' },
    { id: 2, name: 'ЛРД-Светлина', chairman: 'Някой Няков' },
    { id: 3, name: 'ЛРД-Гранитец', chairman: 'Някой Няков' },
    { id: 4, name: 'ЛРД-Средец', chairman: 'Някой Няков' },
    { id: 5, name: 'ЛРД-Дебелт', chairman: 'Някой Няков' },
    { id: 6, name: 'ЛРД-Буково', chairman: 'Някой Няков' },
    { id: 7, name: 'ЛРД-Момина Поляна', chairman: 'Някой Няков' },
    { id: 8, name: 'ЛРД-Факия', chairman: 'Някой Няков' },
    { id: 9, name: 'ЛРД-Маринка', chairman: 'Някой Няков' },
    { id: 10, name: 'ЛРД-Крушевец', chairman: 'Някой Няков' },
  ];

  return (
    <View style={styles.container}>
      {/* Горна част с бутон за профил и търсене */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-circle-outline" size={40} color="black" />
          <Text style={styles.profileText}>Профил</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Търсене..."
          placeholderTextColor="black"
        />
        <TouchableOpacity>
          <Ionicons name="search" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Списък с групи */}
      <ScrollView style={styles.groupList}>
        {groups.map(group => (
          <View key={group.id} style={styles.groupItem}>
            <View style={styles.groupDetails}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupChairman}>Председател: {group.chairman}</Text>
            </View>
            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Присъедини се</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default MainView;