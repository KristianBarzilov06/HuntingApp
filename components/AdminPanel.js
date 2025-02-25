import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Alert, Image, KeyboardAvoidingView} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, getDocs, getDoc, doc, setDoc, deleteDoc, updateDoc} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Picker } from '@react-native-picker/picker';
import { Checkbox } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedNewRegion, setSelectedNewRegion] = useState(null);
  const [selectedGroupForMenu, setSelectedGroupForMenu] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [filteredRegions, setFilteredRegions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // Държавна променлива за избрания потребител
  const [isModalVisible, setIsModalVisible] = useState(false); // Държавна променлива за показване на модала
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [showLicenseDatePicker, setShowLicenseDatePicker] = useState(false);
  const [showNotesDatePicker, setShowNotesDatePicker] = useState(false);


  // Зарежда всички региони и групи от Firebase
  const fetchRegionsAndGroups = async () => {
    const db = getFirestore();
    const groupsCollection = collection(db, "groups");
    const querySnapshot = await getDocs(groupsCollection);
    const data = {};
  
    for (const groupDoc of querySnapshot.docs) {
      const groupData = groupDoc.data();
      if (!groupData.region) continue;
  
      // Взимаме членовете на групата
      const membersCollection = collection(db, "groups", groupDoc.id, "members");
      const membersSnapshot = await getDocs(membersCollection);
  
      let chairmanName = "Неизвестен";
      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data();
        if (memberData.role === "chairman") {
          chairmanName = `${memberData.firstName} ${memberData.lastName}`;
          break;
        }
      }
  
      if (!data[groupData.region]) {
        data[groupData.region] = [];
      }
  
      data[groupData.region].push({
        id: groupDoc.id,
        ...groupData,
        chairman: chairmanName, // ✅ Добавяме председателя в групата
      });
    }
  
    setGroups(data);
  };

  const fetchGroupMembers = async (groupId) => {
    if (!groupId) {
      console.error("❌ Грешка: Няма избрана група!");
      return;
    }
  
    console.log(`🔍 Зареждам потребителите от група ${groupId}`);
  
    const db = getFirestore();
    const groupRef = collection(db, "groups", groupId, "members");
  
    try {
      const querySnapshot = await getDocs(groupRef);
      const members = [];
  
      querySnapshot.forEach((doc) => {
        members.push({ id: doc.id, ...doc.data() });
      });
  
      setGroupMembers(members);
      setSelectedGroup(groupId);
      console.log(`✅ Успешно заредени ${members.length} членове за група ${groupId}`);
    } catch (error) {
      console.error("❌ Грешка при зареждане на членовете:", error);
    }
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
    setIsModalVisible(false);
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

              if (!subDocs.empty) {  // ✅ Проверка дали има документи преди изтриване
                subDocs.forEach(async (doc) => {
                  await deleteDoc(doc.ref);
                });
              }
            };

            await deleteSubcollection("members");
            await deleteSubcollection("messages");

            await deleteDoc(groupRef);
            Alert.alert("Успех!", "Групата беше изтрита успешно.");
            setSelectedGroupForMenu(null);
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

    // Проверяваме дали BULGARIAN_REGIONS е дефиниран и е масив
    if (!Array.isArray(BULGARIAN_REGIONS)) {
        console.error("BULGARIAN_REGIONS is not an array or is undefined");
        return;
    }

    // Филтрираме регионите според въведения текст
    const newFilteredRegions = BULGARIAN_REGIONS.filter(region =>
        typeof region === "string" && region.toLowerCase().includes(text.toLowerCase())
    );

    setFilteredRegions(newFilteredRegions); // Запазваме филтрираните региони в state

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
      console.log(`📂 Отваряне на група: ${group.name} (${group.id})`);
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

  const fetchUserProfile = async (userId, groupId) => {
    if (!userId || !groupId) {
      console.error("❌ Грешка: Липсва група или потребител!");
      Alert.alert("Грешка", "Не може да се зареди потребител без група!");
      return;
    }
  
    console.log(`🔍 Зареждам профила на потребител ${userId} от група ${groupId}`);
  
    const db = getFirestore();
    
    // 1. Вземаме информацията от `users` колекцията
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
  
    // 2. Вземаме допълнителни данни от `members`
    const groupUserRef = doc(db, "groups", groupId, "members", userId);
    const groupUserSnap = await getDoc(groupUserRef);
  
    if (userSnap.exists()) {
      const userData = userSnap.data();
      setEditedUser({
        id: userId,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        bio: userData.bio || '',
        role: groupUserSnap.exists() ? (groupUserSnap.data().role || 'hunter') : 'hunter',
        profilePicture: userData.profilePicture || null,
        huntingLicense: userData.huntingLicense || {},
        huntingNotes: userData.huntingNotes || {},
        equipment: userData.equipment || [],
        isGroupHunting: userData.isGroupHunting || false,
        isSelectiveHunting: userData.isSelectiveHunting || false,
        dogBreed: userData.dogBreed || '',
      });
  
      console.log(`✅ Успешно зареден потребител: ${userData.firstName} ${userData.lastName}`);
    } else {
      console.error("❌ Грешка: Потребителят не беше намерен в базата.");
      Alert.alert("Грешка", "Потребителят не беше намерен.");
    }
  };

  const handleUserOptions = async (user) => {
    if (!user || !selectedGroup) {
      console.error("❌ Грешка: Липсва потребител или група!");
      Alert.alert("Грешка", "Няма избран потребител или група!");
      return;
    }
  
    console.log(`👤 Зареждам профила на ${user.email} от група ${selectedGroup}`);
  
    setSelectedUser(user);
    await fetchUserProfile(user.id, selectedGroup);
    setIsEditModalVisible(true);
  };

const handleProfilePictureChange = async () => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResult.granted) {
    Alert.alert('Нужно е разрешение', 'Моля, дайте разрешение за достъп до галерията.');
    return;
  }

  try {
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!pickerResult.canceled) {
      const selectedImage = pickerResult.assets[0].uri;

      // ✅ Качваме снимката в Firebase Storage
      const storage = getStorage();
      const fileRef = ref(storage, `profilePictures/${selectedUser.id}`);
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      await uploadBytes(fileRef, blob);
      const downloadUrl = await getDownloadURL(fileRef);

      // ✅ Обновяване на профилната снимка в Firestore
      const db = getFirestore();
      const userRef = doc(db, "users", selectedUser.id);
      await updateDoc(userRef, { profilePicture: downloadUrl });

      // ✅ Обновяване на UI
      setEditedUser({ ...editedUser, profilePicture: downloadUrl });
      Alert.alert("Успешно!", "Профилната снимка беше сменена.");
    }
  } catch (error) {
    console.error("Грешка при заявката:", error);
  }
};

const handleLicenseDateChange = (event, selectedDate) => {
  if (selectedDate) {
    setEditedUser(prevState => ({
      ...prevState,
      huntingLicense: { 
        ...prevState.huntingLicense,
        start: selectedDate.toISOString().split('T')[0]
      }
    }));
  }
  setShowLicenseDatePicker(false); // ✅ Скрии DatePicker-а след избора
};

const handleNotesDateChange = (event, selectedDate) => {
  if (selectedDate) {
    setEditedUser(prevState => ({
      ...prevState,
      huntingNotes: { 
        ...prevState.huntingNotes,
        start: selectedDate.toISOString().split('T')[0]
      }
    }));
  }
  setShowNotesDatePicker(false); // ✅ Скрии DatePicker-а след избора
};

const handleEditUser = async () => {
  if (!selectedUser || !selectedGroup) {
    Alert.alert("Грешка", "Няма избран потребител или група!");
    return;
  }

  if (!editedUser.id) {
    Alert.alert("Грешка", "Потребителят няма ID!");
    return;
  }

  const db = getFirestore();
  const userRef = doc(db, "users", editedUser.id);
  const membersCollection = collection(db, `groups/${selectedGroup}/members`);

  try {
    // ✅ Ако потребителят става председател, махаме текущия председател
    if (editedUser.role === "chairman") {
      console.log("🔍 Проверяваме за текущ председател...");

      const membersSnapshot = await getDocs(membersCollection);
      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data();
        if (memberData.role === "chairman" && memberDoc.id !== editedUser.id) {
          console.log(`❌ Премахване на стар председател: ${memberData.firstName} ${memberData.lastName}`);
          await updateDoc(doc(db, `groups/${selectedGroup}/members/${memberDoc.id}`), { role: "hunter" });
        }
      }
    }

    // ✅ Обновяване на потребителя в `users` (основната колекция)
    await updateDoc(userRef, editedUser);

    // ✅ Обновяване на потребителя в `members` на групата
    const userGroupRef = doc(db, `groups/${selectedGroup}/members/${editedUser.id}`);
    await updateDoc(userGroupRef, { role: editedUser.role });

    // ✅ Ако е председател, обновяваме и информацията на групата
    if (editedUser.role === "chairman") {
      await updateChairmanInGroup(editedUser);
    }

    Alert.alert("Успешно!", "Данните на потребителя бяха актуализирани.");
    setIsEditModalVisible(false);

    // ✅ Обновяваме списъка с членове и групи
    fetchGroupMembers(selectedGroup);
    fetchRegionsAndGroups();
  } catch (error) {
    console.error("❌ Грешка при обновяване на потребителя:", error);
    Alert.alert("Грешка", "Неуспешно обновяване на потребителя.");
  }
};


const handleDeleteUser = async () => {
  if (!selectedUser) return;
  Alert.alert(
    "Изтриване на потребител",
    "Сигурни ли сте, че искате да изтриете този потребител? Тази операция ще изтрие всички данни, свързани с него!",
    [
      { text: "Отказ", style: "cancel" },
      {
        text: "Изтрий",
        style: "destructive",
        onPress: async () => {
          const db = getFirestore();
          const auth = getAuth();
          const user = auth.currentUser;

          try {
            await deleteDoc(doc(db, "users", selectedUser.id));

            const membersRef = collection(db, `groups/${selectedGroup}/members`);
            const memberRef = doc(membersRef, selectedUser.id);
            await deleteDoc(memberRef);

            if (user && user.uid === selectedUser.id) {
              await user.delete();
              console.log("✅ Акаунтът беше изтрит успешно от Firebase Authentication");
            }

            Alert.alert("Изтрито!", "Потребителят беше успешно изтрит.");
            setIsEditModalVisible(false);
            fetchGroupMembers(selectedGroup);
          } catch (error) {
            console.error("❌ Грешка при изтриване на потребителя:", error);
            Alert.alert("Грешка", "Неуспешно изтриване на потребителя.");
          }
        },
      },
    ]
  );
};

  const updateChairmanInGroup = async (user) => {
    if (!selectedGroup || !user.id) {
      console.error("❌ Грешка: Няма избрана група или потребителят няма ID!");
      return;
    }
  
    const db = getFirestore();
    const groupRef = doc(db, "groups", selectedGroup);
    const membersRef = doc(db, `groups/${selectedGroup}/members/${user.id}`);
  
    try {
      // ✅ Запазваме новия председател в `members`
      await setDoc(membersRef, {
        role: "chairman",
        firstName: user.firstName,
        lastName: user.lastName,
      }, { merge: true });
  
      // ✅ Запазваме председателя и в основната информация за групата
      await updateDoc(groupRef, {
        chairman: `${user.firstName} ${user.lastName}`
      });
  
      console.log(`🎉 Председателят на групата ${selectedGroup} беше обновен.`);
    } catch (error) {
      console.error("❌ Грешка при обновяване на председателя:", error);
    }
  };

  const handleDeleteEquipment = (index) => {
    setEditedUser((prevState) => {
      const newEquipment = [...prevState.equipment];
      newEquipment.splice(index, 1); // Премахваме елемента по индекс
      return { ...prevState, equipment: newEquipment };
    });
  };
  
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
        <TouchableOpacity style={styles.addButton} onPress={() => setIsModalVisible(true)}>
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

            <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.closeButtonText}>Затвори</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isEditModalVisible} animationType="slide" transparent={true}>
  <View style={styles.modalContainer}>
    <KeyboardAvoidingView behavior="padding" style={styles.keyboardAvoidingContainer}>
      <View style={styles.modalContent}>

        <ScrollView 
          style={styles.modalScroll} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.modalTitle}>Редактиране на потребител</Text>

          {/* Профилна снимка */}
          <TouchableOpacity onPress={handleProfilePictureChange} style={styles.profilePictureContainer}>
            {editedUser.profilePicture ? (
              <Image source={{ uri: editedUser.profilePicture }} style={styles.profilePicture} />
            ) : (
              <Ionicons name="person-circle" size={100} color="gray" />
            )}
          </TouchableOpacity>

          {/* Полета за редакция */}
          <View style={styles.inputRow}>
            <TextInput 
              style={styles.input} 
              placeholder="Име" 
              value={editedUser.firstName} 
              onChangeText={(text) => setEditedUser({...editedUser, firstName: text})} 
            />
            <TextInput 
              style={styles.input} 
              placeholder="Фамилия" 
              value={editedUser.lastName} 
              onChangeText={(text) => setEditedUser({...editedUser, lastName: text})} 
            />
          </View>

          <TextInput 
            style={styles.input} 
            placeholder="Имейл" 
            value={editedUser.email} 
            onChangeText={(text) => setEditedUser({...editedUser, email: text})} 
          />

          {/* Биография */}
          <TextInput
            style={styles.bioInput}
            placeholder="Биография"
            value={editedUser.bio}
            onChangeText={(text) => setEditedUser({...editedUser, bio: text})}
            multiline
            numberOfLines={4}
          />

          {/* Роля */}
          <Text style={styles.modalLabel}>Роля:</Text>
          <Picker 
            selectedValue={editedUser.role} 
            onValueChange={(value) => setEditedUser({ ...editedUser, role: value })} 
            style={styles.picker}
          >
            <Picker.Item label="Ловец" value="hunter" />
            <Picker.Item label="Админ" value="admin" />
            <Picker.Item label="Председател" value="chairman" />
          </Picker>

          {/* Ловен лиценз и ловна бележка */}
          <View style={styles.dateRow}>
            <View style={styles.dateContainer}>
              <Text>Лиценз: {editedUser.huntingLicense?.start || 'Няма избран срок'}</Text>
              <TouchableOpacity onPress={() => setShowLicenseDatePicker(true)} style={styles.datePickerButton}>
                <Text>Промени</Text>
              </TouchableOpacity>
            </View>
            {showLicenseDatePicker && (
              <DateTimePicker
                value={editedUser.huntingLicense?.start ? new Date(editedUser.huntingLicense.start) : new Date()}
                mode="date"
                display="default"
                onChange={handleLicenseDateChange}
              />
            )}
            <View style={styles.dateContainer}>
              <Text>Бележка: {editedUser.huntingNotes?.start || 'Няма избран срок'}</Text>
              <TouchableOpacity onPress={() => setShowNotesDatePicker(true)} style={styles.datePickerButton}>
                <Text>Промени</Text>
              </TouchableOpacity>
            </View>
            {showNotesDatePicker && (
              <DateTimePicker
                value={editedUser.huntingNotes?.start ? new Date(editedUser.huntingNotes.start) : new Date()}
                mode="date"
                display="default"
                onChange={handleNotesDateChange}
              />
            )}
          </View>

          {/* Избор на куче */}
          <Text style={styles.modalLabel}>Куче:</Text>
          <Picker selectedValue={editedUser.dogBreed} onValueChange={(value) => setEditedUser({...editedUser, dogBreed: value})} 
            style={styles.picker}
          >
            <Picker.Item label="Дратхаар" value="Дратхаар" />
            <Picker.Item label="Гонче" value="Гонче" />
            <Picker.Item label="Кокершпаньол" value="Кокершпаньол" />
          </Picker>

          {/* Чекбокси */}
          <View style={styles.checkboxContainer}>
            <Checkbox 
              status={editedUser.isGroupHunting ? 'checked' : 'unchecked'} 
              onPress={() => setEditedUser({...editedUser, isGroupHunting: !editedUser.isGroupHunting})} 
            />
            <Text>Групов лов</Text>
          </View>

          <View style={styles.checkboxContainer}>
            <Checkbox 
              status={editedUser.isSelectiveHunting ? 'checked' : 'unchecked'} 
              onPress={() => setEditedUser({...editedUser, isSelectiveHunting: !editedUser.isSelectiveHunting})} 
            />
            <Text>Подборен лов</Text>
          </View>

          {/* Оборудване */}
          <Text style={styles.modalLabel}>Оборудване:</Text>
          {editedUser.equipment?.map((eq, index) => (
            <View key={index} style={styles.equipmentContainer}>
              <TextInput 
                style={styles.input} 
                placeholder="Име" 
                value={eq.name} 
                onChangeText={(text) => {
                  const newEquipment = [...editedUser.equipment];
                  newEquipment[index].name = text;
                  setEditedUser({...editedUser, equipment: newEquipment});
                }} 
              />
              <TextInput 
                style={styles.input} 
                placeholder="Модел" 
                value={eq.model} 
                onChangeText={(text) => {
                  const newEquipment = [...editedUser.equipment];
                  newEquipment[index].model = text;
                  setEditedUser({...editedUser, equipment: newEquipment});
                }} 
              />
              <TextInput 
                style={styles.input} 
                placeholder="Калибър" 
                value={eq.caliber} 
                onChangeText={(text) => {
                  const newEquipment = [...editedUser.equipment];
                  newEquipment[index].caliber = text;
                  setEditedUser({...editedUser, equipment: newEquipment});
                }} 
              />
              {/* Бутон за изтриване */}
              <TouchableOpacity onPress={() => handleDeleteEquipment(index)} style={styles.deleteEquipmentButton}>
                <Ionicons name="trash-outline" size={20} color="red" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Бутон за добавяне на оборудване */}
          <TouchableOpacity 
            style={styles.addEquipmentButton} 
            onPress={() => setEditedUser({...editedUser, equipment: [...editedUser.equipment, { name: '', model: '', caliber: '' }]})}
          >
            <Ionicons name="add-circle-outline" size={20} color="white" />
            <Text style={styles.addEquipmentButtonText}>Добави оборудване</Text>
          </TouchableOpacity>

          {/* Бутон за изтриване на потребителя */}
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteUser}>
            <Text style={styles.deleteButtonText}>Изтриване на акаунт?</Text>
          </TouchableOpacity>

        </ScrollView>

        {/* Бутоните за потвърждение и отказ */}
        <View style={styles.modalButtonsContainer}>
          <TouchableOpacity style={styles.confirmButton} onPress={handleEditUser}>
            <Text style={styles.confirmButtonText}>Запази</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.closeButton} onPress={() => setIsEditModalVisible(false)}>
            <Text style={styles.closeButtonText}>Отказ</Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  </View>
</Modal>

<ScrollView style={styles.listContainer}>
  {(searchQuery.length > 0 ? filteredRegions : BULGARIAN_REGIONS).map(region => (
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
                    {selectedGroup === group.id && groupMembers.map((member, index) => (
                      <TouchableOpacity key={index} style={styles.memberItem} onPress={() => handleUserOptions(member)}>
                        <Text style={styles.memberEmail}>{member.email}</Text>
                        <Text style={styles.memberRole}>{member.role}</Text>
                      </TouchableOpacity>
                    ))}
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
