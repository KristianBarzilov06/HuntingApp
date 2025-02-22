import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { collection, doc, setDoc, getDocs, getFirestore,getDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { getAuth } from '@firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { PropTypes } from 'prop-types';
import styles from '../src/styles/MainStyles';

const MainView = ({ navigation, route }) => {
  const { userEmail } = route.params || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [groupMemberships, setGroupMemberships] = useState({});
  
  const firestore = getFirestore(app);
  const auth = getAuth(app);
  
  useEffect(() => {
    const fetchGroups = async () => {
      const db = getFirestore();
      const groupsCollection = collection(db, "groups");
      const groupsSnapshot = await getDocs(groupsCollection);
  
      let loadedGroups = [];
  
      for (const groupDoc of groupsSnapshot.docs) {
        let groupData = groupDoc.data();
        let chairmanName = "Неизвестен";
  
        // Взимаме само председателя
        const membersCollection = collection(db, `groups/${groupDoc.id}/members`);
        const membersSnapshot = await getDocs(membersCollection);
  
        for (const memberDoc of membersSnapshot.docs) {
          const memberData = memberDoc.data();
          if (memberData.role === "chairman") {
            chairmanName = `${memberData.firstName} ${memberData.lastName}`;
            break; // ✅ Излизаме, веднага щом намерим председателя
          }
        }
  
        loadedGroups.push({
          id: groupDoc.id,
          ...groupData,
          chairman: chairmanName, // ✅ Винаги ще има само един председател
        });
      }
  
      setGroups(loadedGroups);
      setFilteredGroups(loadedGroups);
    };
  
    fetchGroups();
  }, []);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredGroups(groups); // ✅ Връщаме всички групи при празно търсене
      return;
    }
  
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

  const checkUserGroupMembership = async (groupId) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    const membersRef = collection(firestore, `groups/${groupId}/members`);
    const memberQuery = await getDocs(membersRef);

    let isMember = false;
    memberQuery.forEach(doc => {
      if (doc.id === userId) isMember = true;
    });

    setGroupMemberships(prevState => ({
      ...prevState,
      [groupId]: isMember ? 'Влизане' : 'Присъедини се'
    }));
  };

  useEffect(() => {
    groups.forEach(group => checkUserGroupMembership(group.id));
  }, [groups, userEmail]);

  const joinOrEnterGroup = async (group) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
  
    const userEmail = auth.currentUser.email;
    const userRef = doc(firestore, `users/${userId}`);
    const userSnap = await getDoc(userRef);
    const userRole = userSnap.exists() ? userSnap.data().role : "hunter"; // Вземаме ролята от Firestore
  
    const memberDocRef = doc(firestore, `groups/${group.id}/members/${userId}`);
  
    // Проверяваме дали потребителят е вече член на групата
    const memberSnap = await getDoc(memberDocRef);
    
    if (!memberSnap.exists()) {
      // Ако потребителят не е част от групата, добавяме го
      try {
        await setDoc(memberDocRef, { email: userEmail, role: userRole }, { merge: true });
        setGroupMemberships(prev => ({
          ...prev,
          [group.id]: "Влизане"
        }));
        navigation.navigate('ChatScreen', { groupId: group.id, groupName: group.name, userEmail });
      } catch (error) {
        console.error('Error joining group:', error);
      }
    } else {
      // Ако потребителят вече е част от групата, преминаваме директно към чат
      setGroupMemberships(prev => ({
        ...prev,
        [group.id]: "Влизане"
      }));
      navigation.navigate('ChatScreen', { groupId: group.id, groupName: group.name, userEmail });
    }
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
        <ScrollView style={styles.groupList}>
          {filteredGroups.map(group => (
            <View key={group.id} style={styles.groupItem}>
              <View style={styles.groupDetails}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupChairman}>Председател: {group.chairman || 'Неизвестен'}</Text>
              </View>
              <TouchableOpacity style={styles.joinButton} onPress={() => joinOrEnterGroup(group)}>
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
