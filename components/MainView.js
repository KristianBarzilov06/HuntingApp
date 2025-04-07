import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Alert,
  Modal,
  RefreshControl
} from 'react-native';
import { collection, doc, getDocs, getFirestore, getDoc, setDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { getAuth } from '@firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import styles from '../src/styles/MainStyles';

const MainView = ({ navigation, route }) => {
  const { userEmail } = route.params || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [joinRequestModalVisible, setJoinRequestModalVisible] = useState(false);
  const [joinRequestSent, setJoinRequestSent] = useState({});
  const [joinRequestData, setJoinRequestData] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const firestore = getFirestore(app);
  const auth = getAuth(app);
  const userId = auth.currentUser?.uid;

  // Изнесете функцията fetchGroups, за да може да я извиквате от onRefresh
  const fetchGroups = async () => {
    try {
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
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchUserRoles = async () => {
    if (!userId) return;
    try {
      const userRef = doc(firestore, `users/${userId}`);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUserRoles(userData.roles || []);
      }
    } catch (error) {
      console.error("Error fetching user roles:", error);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchUserRoles();
  }, [userId, route.params?.refresh]);

  // Функция за pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  }, []);

  const handleJoinGroup = async (groupId, groupName) => {
    try {
      const userRef = doc(firestore, `users/${userId}`);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        Alert.alert("Грешка", "Потребителят не съществува.");
        return;
      }
      const userData = userSnap.data();
      const groupsArray = Array.isArray(userData.groups) ? userData.groups : [];
      const isMember = groupsArray.length > 0 || (userData.roles && userData.roles.includes("member"));
      const applicationType = isMember ? 'guest' : 'member';
      console.log("applicationType:", applicationType, "groups:", groupsArray);
      setJoinRequestData({ groupId, groupName, applicationType });
      setJoinRequestModalVisible(true);
    } catch (error) {
      console.error("Error in handleJoinGroup:", error);
    }
  };

  const handleSendJoinRequest = async () => {
    try {
      const userRef = doc(firestore, `users/${userId}`);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        Alert.alert("Грешка", "Потребителят не съществува.");
        return;
      }
      const userData = userSnap.data();
      const applicationType = joinRequestData.applicationType;
      const phoneNumber = joinRequestData.phone || userData.phone || '';
  
      const requestData = {
        userId,
        groupId: joinRequestData.groupId,
        groupName: joinRequestData.groupName,
        applicationType,
        status: 'pending',
        submittedAt: new Date(),
        motivation: joinRequestData.motivation || '',
        ...(applicationType === 'guest' && {
          reason: joinRequestData.reason || '',
        }),
        phone: phoneNumber,
      };
  
      await setDoc(
        doc(firestore, 'groups', joinRequestData.groupId, 'joinRequests', userId),
        requestData
      );
  
      setJoinRequestSent(prevState => ({
        ...prevState,
        [joinRequestData.groupId]: true,
      }));
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
        <TouchableOpacity 
          style={styles.profileButton} 
          onPress={() => navigation.navigate('Profile', { userEmail })}
        >
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
        <ScrollView
          style={styles.groupList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredGroups.map(group => {
            const isGuest = userRoles.some(role => role === `guest{${group.name}}`);
            return (
              <View key={group.id} style={styles.groupItem}>
                <View style={styles.groupDetails}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupChairman}>
                    Председател: {group.chairman || 'Неизвестен'}
                  </Text>
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
                    onPress={() => handleJoinGroup(group.id, group.name)}
                    disabled={!!joinRequestSent[group.id]}
                    style={{
                      backgroundColor: joinRequestSent[group.id] ? 'gray' : '#007BFF',
                      padding: 10,
                      borderRadius: 5
                    }}
                  >
                    <Text style={{ color: 'white', textAlign: 'center' }}>
                      {joinRequestSent[group.id] ? "Изпратена е заявка" : "Присъедини се"}
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

      <Modal
        visible={joinRequestModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setJoinRequestModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ width: '80%', backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>
              {joinRequestData.applicationType === 'member'
                ? 'Заявка за членство'
                : 'Заявка за гостуване'}
            </Text>

            {joinRequestData.applicationType === 'member' ? (
              <>
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
              disabled={!!joinRequestSent[joinRequestData.groupId]}
              style={{
                backgroundColor: joinRequestSent[joinRequestData.groupId] ? 'gray' : '#007BFF',
                padding: 10,
                borderRadius: 5
              }}
            >
              <Text style={{ color: 'white', textAlign: 'center' }}>
                {joinRequestSent[joinRequestData.groupId] ? "Изпратена е заявка" : "Изпрати заявка"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setJoinRequestModalVisible(false)} style={{ marginTop: 10 }}>
              <Text style={{ color: '#007BFF', textAlign: 'center' }}>Отказ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
