import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { collection, doc, setDoc, getDocs, getFirestore } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { getAuth } from '@firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { PropTypes } from 'prop-types';
import styles from '../src/styles/MainStyles';

const MainView = ({ navigation, route }) => {
  const { userEmail } = route.params || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [groupMemberships, setGroupMemberships] = useState({}); // Това ще държи информация за членството по групи

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

  // Проверка дали потребителят вече е член на групата
  const checkUserGroupMembership = async (groupId) => {
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error("No authenticated user found");
      return;
    }

    const groupRef = doc(firestore, 'groups', String(groupId));
    const membersRef = collection(groupRef, 'members');
    const memberQuery = await getDocs(membersRef);

    let isMember = false;
    memberQuery.forEach(doc => {
      if (doc.id === userId) {
        isMember = true;
      }
    });

    // Обновяваме състоянието за конкретната група
    setGroupMemberships(prevState => ({
      ...prevState,
      [groupId]: isMember ? 'Влизане' : 'Присъедини се'
    }));
  };

  const joinOrEnterGroup = async (group) => {
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error("No authenticated user found");
      return;
    }

    const userEmail = auth.currentUser.email;
    const groupRef = doc(firestore, 'groups', String(group.id));
    const membersRef = collection(groupRef, 'members');
    const memberDocRef = doc(membersRef, userId);

    if (groupMemberships[group.id] === 'Присъедини се') {
      try {
        await setDoc(memberDocRef, { email: userEmail, role: 'ловец' }, { merge: true });
        console.log(`User ${userEmail} added to group ${group.name}`);

        // Пренасочване към чата
        navigation.navigate('ChatScreen', {
          groupId: group.id,
          groupName: group.name,
          userEmail,
        });
      } catch (error) {
        console.error("Error joining group:", error);
      }
    } else if (groupMemberships[group.id] === 'Влизане') {
      // Пренасочване към чата без да се добавя отново
      navigation.navigate('ChatScreen', {
        groupId: group.id,
        groupName: group.name,
        userEmail,
      });
    }
  };

  // Това ще се изпълни всеки път, когато се променя състоянието на потребителския акаунт или когато преминем обратно в MainView
  useEffect(() => {
    groups.forEach(group => checkUserGroupMembership(group.id));
  }, [userEmail]); // След като потребителят влезе, актуализирайте членството

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
        <ScrollView style={styles.groupList}>
          {(filteredGroups && filteredGroups.length > 0 ? filteredGroups : groups).map(group => (
            <View key={group.id} style={styles.groupItem}>
              <View style={styles.groupDetails}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupChairman}>Председател: {group.chairman}</Text>
              </View>
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => joinOrEnterGroup(group)}
              >
                <Text style={styles.joinButtonText}>{groupMemberships[group.id] || 'Присъедини се'}</Text>
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

MainView.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      userEmail: PropTypes.string,
    }),
  }).isRequired,
};

export default MainView;
