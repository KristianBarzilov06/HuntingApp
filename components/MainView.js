import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../src/styles/MainStyles'; 

const MainView = ({ navigation, route }) => {
  const { userEmail } = route.params || {}; 

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

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGroups, setFilteredGroups] = useState(groups);

  const handleSearch = (text) => {
    setSearchQuery(text);

    const filtered = groups.filter(group => {
      const groupName = group.name.toLowerCase().replace(/лрд-?/g, '');
      const query = text.toLowerCase().replace(/лрд-?/g, '').trim();

      return groupName.includes(query);
    });

    setFilteredGroups(filtered);
  };

  const resetSearch = () => {
    setSearchQuery('');
    setFilteredGroups(groups);
  };

  const joinGroup = (group) => {
    navigation.navigate('ChatScreen', { groupId: group.id, groupName: group.name, userEmail });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile', { userEmail })}>
          <Ionicons name="person-circle-outline" size={40} color="black" />
          <Text style={styles.profileText}>Профил</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Търсене..."
          placeholderTextColor="black"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity>
          <Ionicons name="search" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {/* Списък с групи */}
        <ScrollView style={styles.groupList}>
          {(filteredGroups.length > 0 ? filteredGroups : groups).map(group => (
            <View key={group.id} style={styles.groupItem}>
              <View style={styles.groupDetails}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupChairman}>Председател: {group.chairman}</Text>
              </View>
              <TouchableOpacity style={styles.joinButton} onPress={() => joinGroup(group)}>
                <Text style={styles.joinButtonText}>Присъедини се</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {searchQuery.length > 0 && (
        <TouchableOpacity style={styles.resetButton} onPress={resetSearch}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default MainView;
