import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { collection, doc, getDocs, getFirestore,getDoc, updateDoc, setDoc} from 'firebase/firestore';
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
  const [userRoles, setUserRoles] = useState([]);
  const firestore = getFirestore(app);
  const auth = getAuth(app);

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const fetchGroups = async () => {
      const db = getFirestore();
      const groupsCollection = collection(db, "groups");
      const groupsSnapshot = await getDocs(groupsCollection);
      let loadedGroups = [];
      
      for (const groupDoc of groupsSnapshot.docs) {
        let groupData = groupDoc.data();
        let chairmanName = "Неизвестен";
        let isUserMember = false;
        let isGuest = false;
  
        const membersCollection = collection(db, `groups/${groupDoc.id}/members`);
        const membersSnapshot = await getDocs(membersCollection);
  
        for (const memberDoc of membersSnapshot.docs) {
          const memberData = memberDoc.data();
          if (Array.isArray(memberData.roles) && memberData.roles.includes("chairman")) {
            chairmanName = `${memberData.firstName} ${memberData.lastName}`;
          }
          if (memberDoc.id === userId) {
            if (memberData.roles.includes("member")) {
              isUserMember = true;
            } else if (memberData.roles.some(role => role.startsWith("guest("))) {
              isGuest = true;
            }
          }
        }
  
        loadedGroups.push({
          id: groupDoc.id,
          ...groupData,
          chairman: chairmanName,
          isMember: isUserMember,
          isGuest: isGuest
        });
      }
      setGroups(loadedGroups);
      setFilteredGroups(loadedGroups);
    };
  
    const fetchUserRoles = async () => {
      if (!userId) return;
      const userRef = doc(firestore, `users/${userId}`);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserRoles(userData.roles || []);
      }
  };
  
    fetchGroups();
    fetchUserRoles();
  }, [userId, route.params?.refresh]);  // ✅ Автоматично обновяване при refresh!
  
  
  const handleJoinGroup = async (groupId, groupName) => {
    try {
        if (!userId) {
            Alert.alert("Грешка", "Няма идентификатор на потребителя.");
            return;
        }

        const userRef = doc(firestore, `users/${userId}`);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            Alert.alert("Грешка", "Потребителят не съществува.");
            return;
        }

        const userData = userSnap.data();
        let currentRoles = userData.roles || [];
        let userGroups = userData.groups || [];

        const isAlreadyMember = userGroups.length > 0; // Вече е член на поне една група?
        const isAlreadyGuest = currentRoles.includes(`guest{${groupName}}`);
        const isAlreadyMemberInThisGroup = userGroups.includes(groupId);

        // ❌ Ако вече е член на тази група → директно го пращаме в главния чат
        if (isAlreadyMemberInThisGroup) {
            navigation.replace('ChatScreen', { groupId, groupName });
            return;
        }

        // ❌ Ако вече е гост в тази група → директно го пращаме в чата за гости
        if (isAlreadyGuest) {
            navigation.replace('GuestChatScreen', { groupId, groupName });
            return;
        }

        let updatedRoles = [...currentRoles];
        let updatedGroups = [...userGroups];

        if (!isAlreadyMember) {
            // 🟢 **Потребителят няма група → става член (member)**
            if (!updatedRoles.includes("hunter")) {
                updatedRoles.push("hunter"); // Добавяме само ако още го няма
            }
            updatedRoles.push("member");
            updatedGroups.push(groupId);
        } else {
            // 🟡 **Потребителят вече има група → присъединява се като гост**
            updatedRoles.push(`guest{${groupName}}`);
        }

        // 🔹 Обновяваме `users/{userId}`
        await updateDoc(userRef, {
            roles: updatedRoles,
            groups: updatedGroups,
        });

        // 🔹 Добавяме потребителя в `groups/{groupId}/members/{userId}`
        const memberRef = doc(firestore, `groups/${groupId}/members/${userId}`);
        await setDoc(memberRef, {
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            roles: isAlreadyMember ? [`guest{${groupName}}`] : ["member"],
        }, { merge: true });

        // 🟢 Обновяваме UI и навигираме потребителя
        Alert.alert("Успех", `Присъединихте се успешно към ${groupName} като ${isAlreadyMember ? "гост" : "член"}.`);

        if (!isAlreadyMember) {
            navigation.replace('ChatScreen', { groupId, groupName });
        } else {
            navigation.replace('GuestChatScreen', { groupId, groupName });
        }

    } catch (error) {
        console.error("❌ Грешка при присъединяване:", error);
        Alert.alert("Грешка", "Неуспешно присъединяване към групата.");
    }
};


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
        {filteredGroups.map(group => {
          const isGuest = userRoles.some(role => role === `guest{${group.name}}`);

          return (
            <View key={group.id} style={styles.groupItem}>
              <View style={styles.groupDetails}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupChairman}>Председател: {group.chairman || 'Неизвестен'}</Text>
              </View>
              
              {group.isMember ? (
                <TouchableOpacity 
                  style={[styles.joinButton, { backgroundColor: '#2A7221' }]} 
                  onPress={() => navigation.replace('ChatScreen', { groupId: group.id, groupName: group.name, userEmail })}
                >
                  <Text style={styles.joinButtonText}>Влизане</Text>
                </TouchableOpacity>
              ) : isGuest ? (
                <TouchableOpacity 
                  style={[styles.joinButton, { backgroundColor: '#555' }]} 
                  onPress={() => navigation.replace('GuestChatScreen', { groupId: group.id, groupName: group.name, userEmail })}
                >
                  <Text style={styles.joinButtonText}>Влизане като гост</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.joinButton, { backgroundColor: '#007BFF' }]} 
                  onPress={() => handleJoinGroup(group.id, group.name)}
                >
                  <Text style={styles.joinButtonText}>Присъедини се</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
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
    replace: PropTypes.func.isRequired,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      userEmail: PropTypes.string,
      refresh: PropTypes.bool,
    }),
  }).isRequired,
};

export default MainView;
