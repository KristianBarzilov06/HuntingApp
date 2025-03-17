import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  Modal, 
  Image 
} from 'react-native';
import { collection, getDocs, getFirestore, getDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import styles from '../src/styles/JoinRequestsScreenStyles';

const JoinRequestsScreen = ({ navigation, route }) => {
  const { groupId, groupName } = route.params;
  const firestore = getFirestore(app);

  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Състояния за модала
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedUserData, setSelectedUserData] = useState(null);

  useEffect(() => {
    const fetchJoinRequests = async () => {
      try {
        const joinRequestsCollection = collection(firestore, 'groups', groupId, 'joinRequests');
        const joinRequestsSnapshot = await getDocs(joinRequestsCollection);
        const requestsPromises = joinRequestsSnapshot.docs
          .filter(docSnapshot => docSnapshot.data().status === 'pending')
          .map(async (docSnapshot) => {
            const data = docSnapshot.data();
            let userData = {};
            try {
              const userRef = doc(firestore, 'users', data.userId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                userData = userSnap.data();
              }
            } catch (err) {
              console.error("Error fetching user data:", err);
            }
            return { id: docSnapshot.id, ...data, ...userData };
          });
        const requests = await Promise.all(requestsPromises);
        setJoinRequests(requests);
      } catch (error) {
        console.error("Грешка при зареждане на заявките:", error);
        Alert.alert("Грешка", "Неуспешно зареждане на заявките.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchJoinRequests();
  }, [firestore, groupId]);
  

  // Отваряне на модала за конкретна заявка
  const openRequestModal = async (request) => {
    setSelectedRequest(request);
    try {
      const userRef = doc(firestore, 'users', request.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setSelectedUserData(userSnap.data());
      } else {
        setSelectedUserData(null);
      }
    } catch (error) {
      console.error("Грешка при извличане на данните за потребителя:", error);
      setSelectedUserData(null);
    }
    setModalVisible(true);
  };
  

  const closeModal = () => {
    setModalVisible(false);
    setSelectedRequest(null);
    setSelectedUserData(null);
  };

  // Функция за приемане на заявка
  const acceptJoinRequest = async (request) => {
    try {
      const { userId, applicationType } = request;
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        Alert.alert("Грешка", "Потребителят не съществува.");
        return;
      }
      const userData = userSnap.data();
      let updatedRoles = userData.roles || [];
      let updatedGroups = userData.groups || [];

      if (applicationType === 'member') {
        if (!updatedRoles.includes("hunter")) {
          updatedRoles.push("hunter");
        }
        if (!updatedRoles.includes("member")) {
          updatedRoles.push("member");
        }
        if (!updatedGroups.includes(groupId)) {
          updatedGroups.push(groupId);
        }
        await updateDoc(userRef, {
          roles: updatedRoles,
          groups: updatedGroups,
        });
        const memberRef = doc(firestore, 'groups', groupId, 'members', userId);
        await setDoc(memberRef, {
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          roles: ["member"],
        }, { merge: true });
      } else if (applicationType === 'guest') {
        const guestRole = `guest{${groupName}}`;
        if (!updatedRoles.includes(guestRole)) {
          updatedRoles.push(guestRole);
        }
        await updateDoc(userRef, {
          roles: updatedRoles,
        });
        const memberRef = doc(firestore, 'groups', groupId, 'members', userId);
        await setDoc(memberRef, {
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          roles: [guestRole],
        }, { merge: true });
      }

      const joinRequestRef = doc(firestore, 'groups', groupId, 'joinRequests', request.id);
      await updateDoc(joinRequestRef, {
        status: 'accepted',
        processedAt: new Date()
      });

      setJoinRequests(prev => prev.filter(r => r.id !== request.id));
      Alert.alert("Успех", "Заявката е приета.");
      closeModal();
    } catch (error) {
      console.error("Грешка при приемане на заявката:", error);
      Alert.alert("Грешка", "Неуспешно приемане на заявката.");
    }
  };

  // Функция за отхвърляне на заявка
  const rejectJoinRequest = async (request) => {
    try {
      const joinRequestRef = doc(firestore, 'groups', groupId, 'joinRequests', request.id);
      await updateDoc(joinRequestRef, {
        status: 'rejected',
        processedAt: new Date()
      });
      setJoinRequests(prev => prev.filter(r => r.id !== request.id));
      Alert.alert("Успех", "Заявката е отхвърлена.");
      closeModal();
    } catch (error) {
      console.error("Грешка при отхвърляне на заявката:", error);
      Alert.alert("Грешка", "Неуспешно отхвърляне на заявката.");
    }
  };

  // Рендериране на елемент от списъка – показваме профилна снимка и името на потребителя
  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => openRequestModal(item)}>
      <View style={styles.requestItem}>
        <View style={styles.requestHeader}>
          {item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={styles.profilePicture} />
          ) : (
            <Ionicons name="person-circle-outline" size={40} color="#2A3B1F" />
          )}
          <Text style={styles.requestText}>
            {item.firstName ? `${item.firstName} ${item.lastName}` : item.userId}
          </Text>
        </View>
        <Text style={styles.requestText}>
          Тип: {item.applicationType === 'member' ? 'Заявка за членство' : 'Заявка за гостуване'}
        </Text>
        {item.extraField && item.applicationType === 'member' ? (
          <Text style={styles.requestText}>Допълнителна инфо: {item.extraField}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" style={styles.arrowIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Заявки за групата {groupName}</Text>
        <View style={styles.headerSpacer} />
      </View>
      {joinRequests.length === 0 ? (
        <Text style={styles.noRequestsText}>Няма чакащи заявки.</Text>
      ) : (
        <FlatList
          data={joinRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.requestsList}
        />
      )}

        <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
        >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
                {selectedRequest?.applicationType === 'member'
                ? 'Заявка за членство'
                : 'Заявка за гостуване'}
            </Text>
            {selectedUserData ? (
                <View style={styles.userInfo}>
                <View style={styles.userHeader}>
                    {selectedUserData.profilePicture ? (
                    <Image source={{ uri: selectedUserData.profilePicture }} style={styles.profilePicture} />
                    ) : (
                    <Ionicons name="person-circle-outline" size={40} color="#2A3B1F" />
                    )}
                    <Text style={styles.userText}>
                    {selectedUserData.firstName} {selectedUserData.lastName}
                    </Text>
                </View>
                <View style={styles.modalFieldContainer}>
                    <Text style={styles.modalFieldText}>Email: {selectedUserData.email}</Text>
                </View>
                </View>
            ) : (
                <Text style={styles.userText}>Няма допълнителни данни</Text>
            )}
            {selectedRequest?.applicationType === 'member' && (
                <>
                {selectedRequest.phone && (
                    <View style={styles.modalFieldContainer}>
                    <Text style={styles.modalFieldText}>Телефон: {selectedRequest.phone}</Text>
                    </View>
                )}
                {selectedRequest.motivation && (
                    <View style={styles.modalFieldContainer}>
                    <Text style={styles.modalFieldText}>Мотивация: {selectedRequest.motivation}</Text>
                    </View>
                )}
                </>
            )}
            {selectedRequest?.applicationType === 'guest' && selectedRequest.reason && (
                <View style={styles.modalFieldContainer}>
                <Text style={styles.modalFieldText}>Причина: {selectedRequest.reason}</Text>
                </View>
            )}
            <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: 'green' }]} onPress={() => acceptJoinRequest(selectedRequest)}>
                <Text style={styles.modalButtonText}>Приеми</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: 'red' }]} onPress={() => rejectJoinRequest(selectedRequest)}>
                <Text style={styles.modalButtonText}>Откажи</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={closeModal} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>Затвори</Text>
            </TouchableOpacity>
            </View>
        </View>
        </Modal>
    </View>
  );
};

JoinRequestsScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    goBack: PropTypes.func.isRequired,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      groupId: PropTypes.string.isRequired,
      groupName: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default JoinRequestsScreen;
