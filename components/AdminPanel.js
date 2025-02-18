import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { getFirestore, collection, getDocs, getDoc, doc, setDoc, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import styles from '../src/styles/AdminPanelStyles';

const BULGARIAN_REGIONS = [
  "Благоевград", "Бургас", "Варна", "Велико Търново", "Видин", "Враца",
  "Габрово", "Добрич", "Кърджали", "Кюстендил", "Ловеч", "Монтана",
  "Пазарджик", "Перник", "Плевен", "Пловдив", "Разград", "Русе",
  "Силистра", "Сливен", "Смолян", "Софийска област", "София-град",
  "Стара Загора", "Търговище", "Хасково", "Шумен", "Ямбол"
];

const AdminPanel = ({ navigation, route }) => {
  const { userEmail } = route.params || {}; 
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedNewRegion, setSelectedNewRegion] = useState(null);
  const [selectedGroupForMenu, setSelectedGroupForMenu] = useState(null);
  const [userRole, setUserRole] = useState('');
  

  // Зарежда всички региони и групи от Firebase
  const fetchRegionsAndGroups = async () => {
    const db = getFirestore();
    const groupsCollection = collection(db, "groups");
    const querySnapshot = await getDocs(groupsCollection);
  
    const data = {};
    
    querySnapshot.forEach((doc) => {
      const groupData = doc.data();
      if (!groupData.region) return; // Предпазваме се от грешни данни
      if (!data[groupData.region]) {
        data[groupData.region] = [];
      }
      data[groupData.region].push({ id: doc.id, ...groupData });
    });
  
    if (!data || Object.keys(data).length === 0) {
      console.warn("Групите не са заредени правилно!");
      return;
    }
  
    setGroups(data);
  };

  // Зарежда потребителите в дадена група
  const fetchGroupMembers = async (groupId) => {
    const db = getFirestore();
    const groupRef = collection(db, "groups", groupId, "members");
    const querySnapshot = await getDocs(groupRef);
  
    const members = [];
    querySnapshot.forEach((doc) => {
      const memberData = doc.data();
      members.push({ id: doc.id, email: memberData.email, role: memberData.role });
    });
  
    // Определяме приоритетите на ранговете
    const rolePriority = { admin: 1, chairman: 2, hunter: 3, guest: 4 };
  
    // Сортиране по ранг
    members.sort((a, b) => (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99));
  
    setGroupMembers(members);
  };
  const fetchUserRole = async () => {
    const db = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;
  
    if (!user) {
      console.log("⚠️ Няма влезнал потребител.");
      return;
    }
  
    const userID = user.uid;
    const userRef = doc(db, "users", userID);
  
    try {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserRole(userSnap.data().role || "hunter");
      } else {
        console.log("⚠️ Потребителят няма записана роля в базата данни.");
      }
    } catch (error) {
      console.error("❌ Грешка при зареждане на ролята:", error);
    }
  };

const addNewGroup = async () => {
  if (!newGroupName.trim() || !selectedNewRegion) {
    Alert.alert('Грешка', 'Моля, изберете регион и въведете име на групата.');
    return;
  }

  try {
    const db = getFirestore();

    // Добавяме "ЛРД-" към името на групата, ако не е добавено от потребителя
    const formattedGroupName = newGroupName.startsWith("ЛРД-") ? newGroupName : `ЛРД-${newGroupName}`;

    // Генерираме нов документ без ID (Firebase ще генерира уникално ID)
    const newGroupRef = doc(collection(db, "groups"));

    // Записваме данните в този документ
    await setDoc(newGroupRef, {
      name: formattedGroupName,
      region: selectedNewRegion
    });

    // Просто оставяме Firebase да създаде подколекциите без да добавяме документи
    console.log('Подколекциите members и messages са създадени за групата:', newGroupRef.id);

    Alert.alert('Успех', `Групата ${formattedGroupName} беше добавена успешно в ${selectedNewRegion}!`);
    
    fetchRegionsAndGroups(); // Обновяваме списъка с групи
    setModalVisible(false);
    setNewGroupName('');
    setSelectedNewRegion(null);
  } catch (error) {
    console.error('Грешка при добавяне на група:', error);
    Alert.alert('Грешка', 'Неуспешно създаване на групата.');
  }
};


const deleteGroup = async (groupId) => {
  Alert.alert(
    "Потвърждение",
    "Сигурни ли сте, че искате да изтриете тази група? Това ще изтрие всички данни, свързани с нея!",
    [
      { text: "Отказ", style: "cancel" },
      {
        text: "Изтрий",
        style: "destructive",
        onPress: async () => {
          try {
            const db = getFirestore();
            const groupRef = doc(db, "groups", groupId);

            const deleteSubcollection = async (subcollection) => {
              const subColRef = collection(db, `groups/${groupId}/${subcollection}`);
              const subDocs = await getDocs(subColRef);
              subDocs.forEach(async (doc) => {
                await deleteDoc(doc.ref);
              });
            };

            await deleteSubcollection("members");
            await deleteSubcollection("messages");

            await deleteDoc(groupRef);

            Alert.alert("Успех!", "Групата беше изтрита успешно.");

            fetchRegionsAndGroups();
          } catch (error) {
            console.error("❌ Грешка при изтриване на група:", error);
            Alert.alert("Грешка", "Неуспешно изтриване на групата.");
          }
        },
      },
    ]
  );
};

  // Търсене на регион
  const handleSearch = (text) => {
    setSearchQuery(text);
  
    if (!groups || Object.keys(groups).length === 0) {
      return;
    }
  
    const BULGARIAN_REGIONS = BULGARIAN_REGIONS.filter(region =>
      typeof region === "string" && region.toLowerCase().includes(text.toLowerCase())
    );
  
    setSelectedRegion(null); // Нулираме селекцията, ако търсенето се промени
  };

  const resetSearch = () => {
    setSearchQuery('');
    fetchRegionsAndGroups();
  };

  // Отваряне/затваряне на регион
  const toggleRegion = (region) => {
    if (selectedRegion === region) {
      setSelectedRegion(null);
      setSelectedGroup(null);
      setGroupMembers([]);
    } else {
      setSelectedRegion(region);
      setSelectedGroup(null);
      setGroupMembers([]);
    }
  };

  // Отваряне/затваряне на група и зареждане на потребители
  const toggleGroup = async (group) => {
    if (selectedGroup === group.id) {
      setSelectedGroup(null);
      setGroupMembers([]);
    } else {
      setSelectedGroup(group.id);
      await fetchGroupMembers(group.id);
    }
  };

  const confirmDeleteGroup = (groupId, region) => {
    Alert.alert(
      "Потвърждение",
      "Сигурни ли сте, че искате да изтриете тази група?",
      [
        { text: "Отказ", style: "cancel" },
        { text: "Изтрий", onPress: () => deleteGroup(groupId, region), style: "destructive" }
      ]
    );
  };

  // Зарежда регионите и групите при стартиране
  React.useEffect(() => {
    fetchRegionsAndGroups();
    fetchUserRole();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile', { userEmail })}>
          <Ionicons name="person-circle-outline" size={40} color="black" />
          <Text style={styles.profileText}>Профил</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Търсене по регион..."
          placeholderTextColor="black"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity>
          <Ionicons name="search" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Бутон за добавяне на нова група */}
      {userRole === "admin" && (
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={40} color="white" />
          <Text style={styles.addButtonText}>Добави група</Text>
        </TouchableOpacity>
      )}

      {/* Модално меню за добавяне на група */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Създай нова група</Text>

            <Text style={styles.modalLabel}>Избери регион:</Text>
            <ScrollView style={styles.regionList}>
            {BULGARIAN_REGIONS.map(region => (
              <TouchableOpacity key={region} style={styles.regionItem} onPress={() => setSelectedNewRegion(region)}>
                <Text style={[styles.regionText, selectedNewRegion === region && styles.selectedRegion]}>
                  {region}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

            <Text style={styles.modalLabel}>Име на групата:</Text>
            <TextInput
              style={styles.input}
              placeholder="Въведете име..."
              value={newGroupName}
              onChangeText={setNewGroupName}
            />

            <TouchableOpacity style={styles.confirmButton} onPress={addNewGroup}>
              <Text style={styles.confirmButtonText}>Създай</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Затвори</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.listContainer}>
  {BULGARIAN_REGIONS.map(region => (
    <View key={region}>
      {/* Натискащ се елемент за областта */}
      <TouchableOpacity style={styles.regionLabel} onPress={() => toggleRegion(region)}>
        <Text style={styles.regionTitle}>{region}</Text>
        <Ionicons name={selectedRegion === region ? "arrow-up" : "arrow-down"} size={20} color="black" />
      </TouchableOpacity>

      {/* Ако тази област е избрана, показва групите ѝ */}
      {selectedRegion === region && (
        <View style={styles.groupsContainer}>
          {/* Проверява дали има групи в тази област */}
          {groups[region] && groups[region].length > 0 ? (
            groups[region].map(group => (
              <View key={group.id} style={styles.groupContainer}>
                {/* Ред на групата с име, стрелка и меню */}
                <View style={styles.groupRow}>
                  <TouchableOpacity style={styles.groupLabel} onPress={() => toggleGroup(group)}>
                    <Text style={styles.groupName}>{group.name}</Text>
                  </TouchableOpacity>

                  <View style={styles.groupIcons}>
                    <Ionicons 
                      name={selectedGroup === group.id ? "arrow-up" : "arrow-down"} 
                      size={20} 
                      color="black" 
                      onPress={() => toggleGroup(group)}
                    />

                    {/* Бутон с три точки за менюто */}
                    {userRole === "admin" && (
                      <TouchableOpacity onPress={() => setSelectedGroupForMenu(group.id)}>
                        <Ionicons name="ellipsis-vertical" size={24} color="black" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Покажи менюто само ако тази група е избрана */}
                {selectedGroupForMenu === group.id && (
                  <View style={styles.menuContainer}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => confirmDeleteGroup(group.id, region)}>
                      <Ionicons name="trash-outline" size={20} color="red" />
                      <Text style={styles.menuText}>Изтрий група</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => setSelectedGroupForMenu(null)}>
                      <Ionicons name="close-outline" size={20} color="gray" />
                      <Text style={styles.menuText}>Отказ</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Ако групата е избрана, показваме членовете ѝ */}
                {selectedGroup === group.id && (
                  <View style={styles.membersContainer}>
                    <Text style={styles.groupTitle}>Потребители:</Text>
                    {groupMembers.length > 0 ? (
                      groupMembers.map((member, index) => (
                        <View key={index} style={styles.memberItem}>
                          <Text style={styles.memberEmail}>{member.email}</Text>
                          <Text style={styles.memberRole}>{member.role}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noMembersText}>Няма потребители</Text>
                    )}
                  </View>
                )}
              </View>
            ))
          ) : (
            /* Ако няма групи, показваме съобщение */
            <Text style={styles.noGroupsText}>Няма налични групи в тази област.</Text>
          )}
        </View>
      )}
    </View>
  ))}
</ScrollView>
      {searchQuery.length > 0 && (
        <TouchableOpacity style={styles.resetButton} onPress={resetSearch}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      )}
    </View>
  );
};

AdminPanel.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      userEmail: PropTypes.string.isRequired,
    }),
  }).isRequired,
};

export default AdminPanel;
