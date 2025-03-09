import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  TextInput 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import roleColors from '../src/styles/roleColors'; 
import styles from '../src/styles/GroupOverviewStyles';
import ProfileModal from '../components/ProfileModal';

// Преводи на ролите
const roleTranslations = {
  admin: "Админ",
  chairman: "Председател",
  secretary: "Секретар",
  member: "Член",
  guest: "Гост",
  hunter: "Ловец",
};

const GroupOverview = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;

  const [groupPicture, setGroupPicture] = useState(null);
  const [members, setMembers] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  // метод на сортиране ('rank' или 'alphabet') и ред ('asc' или 'desc')
  const [sortMode, setSortMode] = useState({ method: 'rank', order: 'asc' });

  // За търсене:
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // За профилния модал (при натискане на снимка)
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const auth = getAuth();
  const db = getFirestore();

  // Зареждаме информацията за групата
  const fetchGroupData = async () => {
    try {
      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists()) {
        const data = groupSnap.data();
        setGroupPicture(data.groupPicture || null);
      }
    } catch (error) {
      console.error("Грешка при зареждане на данните за групата:", error);
    }
  };

  // Зареждаме членовете на групата и профилните снимки
  const fetchMembers = async () => {
    try {
      const membersRef = collection(db, `groups/${groupId}/members`);
      const membersSnap = await getDocs(membersRef);

      let loadedMembers = [];
      for (const docSnap of membersSnap.docs) {
        const memberData = docSnap.data();
        const userId = docSnap.id; 

        // Търсим документа от "users"
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        let profilePictureUrl = null;
        if (userSnap.exists()) {
          const userData = userSnap.data();
          profilePictureUrl = userData.profilePicture || null;
        }

        loadedMembers.push({
          id: userId,
          ...memberData,
          profilePicture: profilePictureUrl,
        });
      }
      setMembers(loadedMembers);
    } catch (error) {
      console.error("Грешка при зареждане на членовете:", error);
    }
  };

  // Зареждаме ролите на текущия потребител
  const fetchUserRoles = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        // Ако roles е масив, взимаме го, иначе правим масив от data.role
        setUserRoles(Array.isArray(data.roles) ? data.roles : [data.role]);
      }
    } catch (error) {
      console.error("Грешка при зареждане на ролите:", error);
    }
  };

  useEffect(() => {
    fetchGroupData();
    fetchMembers();
    fetchUserRoles();
  }, []);

  // Сортиране
  const sortMembers = (list) => {
    // "hunter" най-вдясно -> най-ниска роля
    const rankOrder = ["admin", "chairman", "secretary", "member", "guest", "hunter"];
    let sorted = [...list];

    if (sortMode.method === 'alphabet') {
      sorted.sort((a, b) => {
        const nameA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
        const nameB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else {
      // Сортиране по ранг
      sorted.sort((a, b) => {
        const aRoles = Array.isArray(a.roles) ? a.roles : [];
        const bRoles = Array.isArray(b.roles) ? b.roles : [];
        // Нормализираме "guest{...}" → "guest" (ако го ползвате и тук)
        const aNorm = aRoles.map(r => r.startsWith("guest{") ? "guest" : r);
        const bNorm = bRoles.map(r => r.startsWith("guest{") ? "guest" : r);

        const aRankIndex = rankOrder.findIndex(r => aNorm.includes(r));
        const bRankIndex = rankOrder.findIndex(r => bNorm.includes(r));
        return aRankIndex - bRankIndex;
      });
    }

    if (sortMode.order === 'desc') {
      sorted.reverse();
    }
    return sorted;
  };

  // Филтриране по searchQuery
  const filterMembers = (list) => {
    if (!searchQuery.trim()) return list;
    return list.filter(m => {
      const fullName = `${m.firstName || ''} ${m.lastName || ''}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });
  };

  const sortedMembers = sortMembers(members);
  const visibleMembers = filterMembers(sortedMembers);

  // Функция за смяна на снимката на групата
  const changeGroupPicture = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Нужно е разрешение", "Моля, дайте разрешение за достъп до галерията.");
        return;
      }
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      if (!pickerResult.canceled) {
        const selectedImage = pickerResult.assets[0].uri;
        const storage = getStorage();
        const fileRef = ref(storage, `groupPictures/${groupId}`);
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        await uploadBytes(fileRef, blob);
        const downloadUrl = await getDownloadURL(fileRef);
        await updateDoc(doc(db, "groups", groupId), {
          groupPicture: downloadUrl,
        });
        setGroupPicture(downloadUrl);
        Alert.alert("Успешно!", "Снимката на групата е сменена.");
      }
    } catch (error) {
      console.error("Грешка при смяна на снимката:", error);
      Alert.alert("Грешка", "Неуспешна смяна на снимката.");
    }
  };

  // Дали текущият потребител е председател или админ
  const isChairman = userRoles.includes("chairman") || userRoles.includes("admin");

  // Превключване на метод
  const handleSortMethod = (method) => {
    setSortMode(prev => ({ ...prev, method }));
    setSortMenuVisible(false);
  };

  // Превключване на ред
  const handleSortOrder = (order) => {
    setSortMode(prev => ({ ...prev, order }));
    setSortMenuVisible(false);
  };

  // Проверка за маркиране на селекция
  const isSelectedMethod = (method) => sortMode.method === method;
  const isSelectedOrder = (order) => sortMode.order === order;

  // Клик на профилна снимка -> отваряме ProfileModal
  const handleProfilePress = (userId) => {
    setSelectedUserId(userId);
    setProfileModalVisible(true);
  };

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        {/* Бутон за връщане назад */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {/* Няма groupName тук - само sort button */}
        <TouchableOpacity
          onPress={() => setSortMenuVisible(!sortMenuVisible)}
          style={styles.sortButton}
        >
          <Ionicons name="options" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {sortMenuVisible && (
        <View style={styles.sortMenuContainer}>
          <Text style={styles.sortMenuTitle}>Метод:</Text>
          <TouchableOpacity 
            onPress={() => handleSortMethod('rank')} 
            style={[
              styles.sortMenuItem,
              isSelectedMethod('rank') && styles.sortMenuItemSelected
            ]}
          >
            <Text style={styles.sortMenuItemText}>По ранг</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleSortMethod('alphabet')} 
            style={[
              styles.sortMenuItem,
              isSelectedMethod('alphabet') && styles.sortMenuItemSelected
            ]}
          >
            <Text style={styles.sortMenuItemText}>По азбучен ред</Text>
          </TouchableOpacity>

          <Text style={styles.sortMenuTitle}>Ред:</Text>
          <TouchableOpacity 
            onPress={() => handleSortOrder('asc')} 
            style={[
              styles.sortMenuItem,
              isSelectedOrder('asc') && styles.sortMenuItemSelected
            ]}
          >
            <Text style={styles.sortMenuItemText}>Възходящо</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleSortOrder('desc')} 
            style={[
              styles.sortMenuItem,
              isSelectedOrder('desc') && styles.sortMenuItemSelected
            ]}
          >
            <Text style={styles.sortMenuItemText}>Низходящо</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Профилна снимка на групата */}
      <View style={styles.groupImageContainer}>
        {groupPicture ? (
          <Image source={{ uri: groupPicture }} style={styles.groupImage} />
        ) : (
          <Ionicons name="image-outline" size={100} color="#ccc" />
        )}
        {isChairman && (
          <TouchableOpacity onPress={changeGroupPicture} style={styles.changePictureButton}>
            <Ionicons name="image" size={20} color="#fff" />
            <Text style={styles.changePictureButtonText}>Смени снимката</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* membersHeader с името на групата вляво и иконка за търсене вдясно */}
      <View style={styles.membersHeader}>
        <Text style={styles.groupNameText}>{groupName}</Text>
        <TouchableOpacity onPress={() => setSearchVisible(!searchVisible)}>
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Лейбъл "Членове" вътре в контейнера */}
      <View style={styles.membersContainer}>

        <Text style={styles.membersTitle}>Членове</Text>

        {/* Поле за търсене (ако е видимо) */}
        {searchVisible && (
          <TextInput
            style={styles.searchInput}
            placeholder="Търсене на потребител..."
            placeholderTextColor="#ccc"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        )}

        <FlatList
          data={visibleMembers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            // Нормализация "guest{...}" -> "guest"
            let userRolesArray = Array.isArray(item.roles) ? item.roles : [];
            userRolesArray = userRolesArray.map(r => r.startsWith("guest{") ? "guest" : r);

            // rankOrder с "hunter" най-вдясно
            const rankOrder = ["admin", "chairman", "secretary", "member", "guest", "hunter"];
            let highestRole = "guest";
            for (const r of rankOrder) {
              if (userRolesArray.includes(r)) {
                highestRole = r;
                break;
              }
            }

            const roleLabel = roleTranslations[highestRole] || "Гост";
            const backgroundColor = roleColors[highestRole] || "#BDBDBD";

            return (
              <View style={[styles.memberItem, { backgroundColor }]}>
                {/* Профилна снимка (натискаща се -> ProfileModal) */}
                <TouchableOpacity onPress={() => handleProfilePress(item.id)}>
                  {item.profilePicture ? (
                    <Image
                      source={{ uri: item.profilePicture }}
                      style={styles.memberProfileImage}
                    />
                  ) : (
                    <Ionicons
                      name="person-circle-outline"
                      size={50}
                      color="#fff"
                      style={styles.defaultProfileIcon}
                    />
                  )}
                </TouchableOpacity>

                <View style={styles.memberTextContainer}>
                  <Text style={styles.memberName}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <Text style={styles.memberRole}>{roleLabel}</Text>
                </View>
              </View>
            );
          }}
          style={styles.membersList}
        />
      </View>

      {/* ProfileModal при клик на снимка */}
      {profileModalVisible && selectedUserId && (
        <ProfileModal
          userId={selectedUserId}
          visible={profileModalVisible}
          onClose={() => {
            setProfileModalVisible(false);
            setSelectedUserId(null);
          }}
        />
      )}
    </View>
  );
};

GroupOverview.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      groupId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      groupName: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

export default GroupOverview;
