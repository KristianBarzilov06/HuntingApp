import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { collection, doc, getDocs, getFirestore, getDoc, setDoc } from 'firebase/firestore';
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
  const [joinRequestModalVisible, setJoinRequestModalVisible] = useState(false);
  const [joinRequestSent, setJoinRequestSent] = useState(false);
  const [joinRequestData, setJoinRequestData] = useState({});
  
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
  }, [userId, route.params?.refresh]);
  
  const handleJoinGroup = async (groupId, groupName) => {
    const userRef = doc(firestore, `users/${userId}`);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      Alert.alert("Грешка", "Потребителят не съществува.");
      return;
    }
    const userData = userSnap.data();
    // Проверяваме дали groups е масив и дали има поне един запис,
    // или дали roles включва "member"
    const groupsArray = Array.isArray(userData.groups) ? userData.groups : [];
    const isMember = groupsArray.length > 0 || (userData.roles && userData.roles.includes("member"));
    const applicationType = isMember ? 'guest' : 'member';
    console.log("applicationType:", applicationType, "groups:", groupsArray);
    setJoinRequestData({ groupId, groupName, applicationType });
    setJoinRequestModalVisible(true);
  };
  

  const handleSendJoinRequest = async () => {
    try {
      const userRef = doc(firestore, `users/${userId}`);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        Alert.alert("Грешка", "Потребителят не съществува.");
        return;
      }
      // Използваме вече определеното applicationType от joinRequestData
      const applicationType = joinRequestData.applicationType;
      
      const requestData = {
        userId,
        groupId: joinRequestData.groupId,
        groupName: joinRequestData.groupName,
        applicationType,
        status: 'pending',
        submittedAt: new Date(),
        ...(applicationType === 'member' && {
          phone: joinRequestData.phone || '',
          motivation: joinRequestData.motivation || '',
        }),
        ...(applicationType === 'guest' && {
          reason: joinRequestData.reason || '',
        }),
      };
  
      await setDoc(
        doc(collection(firestore, 'groups', joinRequestData.groupId, 'joinRequests')),
        requestData
      );
  
      setJoinRequestSent(true);
      setJoinRequestModalVisible(false);
      Alert.alert("Успех", "Заявката е изпратена успешно.");
    } catch (error) {
      console.error("Грешка при изпращане на заявката:", error);
      Alert.alert("Грешка", "Неуспешно изпращане на заявката.");
    }
  };  
  
  
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredGroups(groups);
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
                    style={[styles.joinButton, { backgroundColor: joinRequestSent ? 'gray' : '#007BFF' }]} 
                    onPress={() => handleJoinGroup(group.id, group.name)}
                    disabled={joinRequestSent}
                  >
                    <Text style={styles.joinButtonText}>
                      {joinRequestSent ? "Изпратена е заявка" : "Присъедини се"}
                    </Text>
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
  
      {joinRequestModalVisible && (
      <View style={{ width: '80%', backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
        <Text style={{ fontSize: 18, marginBottom: 10 }}>
          {joinRequestData.applicationType === 'member'
            ? 'Заявка за членство'
            : 'Заявка за гостуване'}
        </Text>
        
        {joinRequestData.applicationType === 'member' ? (
          <>
            <TextInput
              placeholder="Телефонен номер"
              value={joinRequestData.phone || ''}
              onChangeText={(text) => setJoinRequestData(prev => ({ ...prev, phone: text }))}
              style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10 }}
            />
            <TextInput
              placeholder="Мотивация за кандидатстване"
              value={joinRequestData.motivation || ''}
              onChangeText={(text) => setJoinRequestData(prev => ({ ...prev, motivation: text }))}
              style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20 }}
            />
          </>
        ) : (
          <>
            <TextInput
              placeholder="Кратка причина за гостуване"
              value={joinRequestData.reason || ''}
              onChangeText={(text) => setJoinRequestData(prev => ({ ...prev, reason: text }))}
              style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20 }}
            />
          </>
        )}
        
        <TouchableOpacity
          onPress={handleSendJoinRequest}
          disabled={joinRequestSent}
          style={{ backgroundColor: joinRequestSent ? 'gray' : '#007BFF', padding: 10, borderRadius: 5 }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>
            {joinRequestSent ? "Изпратена е заявка" : "Изпрати заявка"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setJoinRequestModalVisible(false)} style={{ marginTop: 10 }}>
          <Text style={{ color: '#007BFF', textAlign: 'center' }}>Отказ</Text>
        </TouchableOpacity>
      </View>
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
