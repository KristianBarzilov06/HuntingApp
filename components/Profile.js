import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { PropTypes } from 'prop-types';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { saveProfileData, loadProfileData } from '../src/utils/firestoreUtils';
import { doc, updateDoc, arrayRemove, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, firestore } from '../firebaseConfig';
import styles from '../src/styles/ProfileStyles';

const Profile = ({ route, navigation, groupId }) => {
  const userEmail = route.params?.userEmail || auth.currentUser?.email || '';
  const userId = auth.currentUser?.uid || '';

  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: userEmail,
    profilePicture: null,
    phone: '',
  });

  // Полета за профила
  const [bio, setBio] = useState('');
  const [licenseType, setLicenseType] = useState('');
  const [huntingLicense, setHuntingLicense] = useState({ start: '', end: '' });
  const [huntingNotes, setHuntingNotes] = useState({ start: '', end: '' });
  const [equipment, setEquipment] = useState([{ name: '', model: '', caliber: '' }]);
  const [dogBreed, setDogBreed] = useState('');
  const [gallery, setGallery] = useState([]);
  const [isGroupHunting, setIsGroupHunting] = useState(false);
  const [isSelectiveHunting, setIsSelectiveHunting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newProfilePicture, setNewProfilePicture] = useState(null);
  const [showLicenseDatePicker, setShowLicenseDatePicker] = useState(false);
  const [showNotesDatePicker, setShowNotesDatePicker] = useState(false);
  const [isWeaponModalVisible, setWeaponModalVisible] = useState(false);
  const [galleryMedia, setGalleryMedia] = useState([]);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showFullScreenMedia, setShowFullScreenMedia] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortMode, setSortMode] = useState({ method: 'date', order: 'asc' });
  const [dogs, setDogs] = useState([]);
  const [dogForm, setDogForm] = useState({
    dogPicture: null,
    dogName: '',
    dogBreed: '',
    dogBirthDate: null,
    dogSex: 'male',
    dogColor: '',
    hasVaccination: false,
    hasPassport: false,
    skills: {
      retrieving: false,
      birdHunting: false,
      hareHunting: false,
      boarTracking: false,
    },
  });
  const [selectedDog, setSelectedDog] = useState(null);
  const [showDogDetailsModal, setShowDogDetailsModal] = useState(false);
  const [dogModalVisible, setDogModalVisible] = useState(false);
  const [showDogBirthDatePicker, setShowDogBirthDatePicker] = useState(false);
  const [isEditingDog, setIsEditingDog] = useState(false); // true ако редактираме, false ако добавяме
  const [editingDogIndex, setEditingDogIndex] = useState(null);
  const dogOptions = [
    'Българско гонче',
    'Барак',
    'Дратхаар',
    'Курцхаар',
    'Кокершпаньол',
    'Английски пойнтер',
    'Сетер (Ирландски, Английски, Гордон)',
    'Бигъл',
    'Бретонски шпаньол',
    'Английски спрингер шпаньол',
    'Фоксхаунд',
    'Териер (Джагдтериер, Фокстериер)',
    'Лайка (Руски Европейски, Западносибирски)',
    'Баварска планинска хрътка',
    'Хановерска хрътка',
    'Посавско гонче',
    'Балканско гонче',
    'Сръбско трицветно гонче',
  ];

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const profileData = await loadProfileData(userId);
        if (profileData) {
          setBio(profileData.bio || '');
          setLicenseType(profileData.licenseType || '');
          setHuntingLicense(profileData.huntingLicense || { start: '', end: '' });
          setHuntingNotes(profileData.huntingNotes || { start: '', end: '' });
          setEquipment(profileData.equipment || [{ name: '', model: '', caliber: '' }]);
          setDogBreed(profileData.dogBreed || '');
          setGallery(profileData.gallery || []);
          setIsGroupHunting(profileData.isGroupHunting || false);
          setIsSelectiveHunting(profileData.isSelectiveHunting || false);

          setUser({
            firstName: profileData.firstName || '',
            lastName: profileData.lastName || '',
            email: profileData.email || userEmail,
            profilePicture: profileData.profilePicture || null,
            phone: profileData.phone || '',
          });
          const loadedDogs = profileData.dogs || [];
          loadedDogs.forEach((d) => {
            if (typeof d.dogBirthDate === 'string') {
              d.dogBirthDate = new Date(d.dogBirthDate);
            }
          });
          setDogs(loadedDogs);
        }
      } catch (error) {
        console.error('Грешка при зареждане на данни:', error.message);
      }
    };

    fetchProfileData();
  }, [userId]);

  useEffect(() => {
    if (route.params?.firstTime) {
      setIsEditing(true);
    }
  }, [route.params?.firstTime]);

  const handleSaveChanges = async () => {
    const profileData = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email, // Добавяме имейла тук!
      phone: user.phone || '',
      bio,
      licenseType,
      huntingLicense,
      huntingNotes,
      equipment,
      dogBreed,
      gallery,
      isGroupHunting,
      isSelectiveHunting,
      profilePicture: newProfilePicture || user.profilePicture,
    };
  
    try {
      if (newProfilePicture) {
        const storage = getStorage();
        const response = await fetch(newProfilePicture);
        if (!response.ok) {
          throw new Error('URI е недостъпен. Проверете валидността на файла.');
        }
        const blob = await response.blob();
        const fileRef = ref(storage, `profilePictures/${userId}`);
        await uploadBytes(fileRef, blob);
        const downloadUrl = await getDownloadURL(fileRef);
        profileData.profilePicture = downloadUrl;
      }
  
      await saveProfileData(userId, profileData);
      setUser((prevUser) => ({ ...prevUser, profilePicture: profileData.profilePicture }));
  
      // Ако това е първото конфигуриране, уведомяваме потребителя и го пренасочваме към Login.
      if (route.params?.firstTime) {
        Alert.alert('Профилът е конфигуриран. Моля, влезте в акаунта си.');
        navigation.replace('Login');
      } else {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Грешка при запазването:', error.message);
      Alert.alert('Грешка', 'Неуспешно записване на профила.');
    }
  };
  

  useEffect(() => {
    const fetchGalleryMedia = async () => {
      try {
        const currentGroupId = route.params?.groupId || groupId;
        if (!currentGroupId) {
          setGalleryMedia([]);
          return;
        }
        const messagesRef = collection(firestore, 'groups', currentGroupId, 'messages');
        const profileUserId = route.params?.profileUserId || userId;
        const q = query(
          messagesRef,
          where('userId', '==', profileUserId),
          where('mediaUrl', '!=', '')
        );
        const querySnapshot = await getDocs(q);
        const galleryMessages = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.mediaType && (data.mediaType === 'images' || data.mediaType === 'videos')) {
            galleryMessages.push({ id: doc.id, ...data });
          }
        });
        galleryMessages.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
        setGalleryMedia(galleryMessages);
      } catch (error) {
        console.error('Error fetching gallery media: ', error);
      }
    };
    fetchGalleryMedia();
  }, [userId, route.params?.groupId, groupId]);  

  useEffect(() => {
    const sortedMedia = [...galleryMedia].sort((a, b) => {
      if (sortMode.method === 'date') {
        const aTime = a.timestamp?.toMillis() || 0;
        const bTime = b.timestamp?.toMillis() || 0;
        return sortMode.order === 'asc' ? aTime - bTime : bTime - aTime;
      } else if (sortMode.method === 'type') {
        return sortMode.order === 'asc'
          ? a.mediaType.localeCompare(b.mediaType)
          : b.mediaType.localeCompare(a.mediaType);
      } else if (sortMode.method === 'size') {
        const aSize = a.size || 0;
        const bSize = b.size || 0;
        return sortMode.order === 'asc' ? aSize - bSize : bSize - aSize;
      }
      return 0;
    });
    setGalleryMedia(sortedMedia);
  }, [sortMode]);

  const handleSortMethod = (method) => {
    setSortMode(prev => ({ ...prev, method }));
    setSortMenuVisible(false);
  };

  const handleSortOrder = (order) => {
    setSortMode(prev => ({ ...prev, order }));
    setSortMenuVisible(false);
  };

  const isSelectedMethod = (method) => sortMode.method === method;
  const isSelectedOrder = (order) => sortMode.order === order;

  const handleOpenMedia = (item) => {
    setSelectedMedia(item);
    setShowFullScreenMedia(true);
  };

  const handleAddEquipment = () => {
    setWeaponModalVisible(true);
  };

  const handleSelectWeapon = (weapon) => {
    setEquipment((prevEquipment) => [
      ...prevEquipment,
      { name: weapon.name, model: weapon.model, caliber: weapon.caliber, type: weapon.type }
    ]);
    setWeaponModalVisible(false);
  };

  const handleRemoveEquipment = async (index) => {
    try {
      const updatedEquipment = [...equipment];
      const removedWeapon = updatedEquipment[index];
      updatedEquipment.splice(index, 1);
      setEquipment(updatedEquipment);
      const userDocRef = doc(firestore, 'users', userId);
      await updateDoc(userDocRef, {
        equipment: arrayRemove(removedWeapon),
      });
    } catch (error) {
      console.error('Грешка при премахване на оръжие от базата:', error);
    }
  };

  const handleProfilePictureChange = async () => {
    if (!isEditing) {
      console.log('Промяната на профилната снимка е неактивна извън режим на редактиране.');
      return;
    }
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
        const selectedImage = pickerResult.assets && pickerResult.assets[0];
        if (selectedImage?.uri) {
          setNewProfilePicture(selectedImage.uri);
        }
      }
    } catch (error) {
      console.error('Грешка при избора на изображение:', error.message);
      Alert.alert('Грешка', 'Неуспешно избиране на изображение. Опитайте отново.');
    }
  };

  const handleLogOut = async () => {
    try {
      setUser({
        name: '',
        email: '',
      });
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Грешка при изход:', error);
    }
  };

  const handleLicenseDateChange = (event, selectedDate) => {
    setShowLicenseDatePicker(false);
    if (selectedDate) {
      const startDate = selectedDate.toISOString().split('T')[0];
      const endDate = new Date(selectedDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
      const formattedEndDate = endDate.toISOString().split('T')[0];
      setHuntingLicense({ start: startDate, end: formattedEndDate });
    }
  };

  const handleNotesDateChange = (event, selectedDate) => {
    setShowNotesDatePicker(false);
    if (selectedDate) {
      const startDate = selectedDate.toISOString().split('T')[0];
      const endDate = new Date(selectedDate);
      endDate.setMonth(endDate.getMonth() + 1);
      const formattedEndDate = endDate.toISOString().split('T')[0];
      setHuntingNotes({ start: startDate, end: formattedEndDate });
    }
  };

  // Функции за работа с куче
  const uploadDogPicture = async (localUri) => {
    try {
      const response = await fetch(localUri);
      const blob = await response.blob();
      const storage = getStorage();
      // Използваме userId и текущото време за уникално наименование
      const fileRef = ref(storage, `dogPictures/${userId}_${Date.now()}`);
      await uploadBytes(fileRef, blob);
      const downloadUrl = await getDownloadURL(fileRef);
      return downloadUrl;
    } catch (error) {
      console.error('Грешка при качване на кучешката снимка:', error);
      return null;
    }
  };
  

  const openDogModal = (dog = null, index = null) => {
    if (dog) {
      setDogForm({
        dogPicture: dog.dogPicture || null,
        dogName: dog.dogName || '',
        dogBreed: dog.dogBreed || '',
        dogBirthDate: dog.dogBirthDate || null,
        dogSex: dog.dogSex || 'male',
        dogColor: dog.dogColor || '',
        hasVaccination: dog.hasVaccination || false,
        hasPassport: dog.hasPassport || false,
        skills: dog.skills || {
          retrieving: false,
          birdHunting: false,
          hareHunting: false,
          boarTracking: false,
        },
      });
      setIsEditingDog(true);
      setEditingDogIndex(index);
    } else {
      setDogForm({
        dogPicture: null,
        dogName: '',
        dogBreed: '',
        dogBirthDate: null,
        dogSex: 'male',
        dogColor: '',
        hasVaccination: false,
        hasPassport: false,
        skills: {
          retrieving: false,
          birdHunting: false,
          hareHunting: false,
          boarTracking: false,
        },
      });
      setIsEditingDog(false);
      setEditingDogIndex(null);
    }
    setDogModalVisible(true);
  };

  const weaponList = [
    { name: 'Blaser', model: 'R8', caliber: '.308 Winchester', type: 'carbine' },
    { name: 'Tikka', model: 'T3X', caliber: '.30-06 Springfield', type: 'carbine' },
    { name: 'Benelli', model: 'M2', caliber: '12/70', type: 'shotgun' },
    { name: 'Beretta', model: 'A400', caliber: '12/76', type: 'shotgun' },
  ];

  const handleDogBirthDateChange = (event, selectedDate) => {
    setShowDogBirthDatePicker(false);
    if (selectedDate) {
      setDogForm({
        ...dogForm,
        dogBirthDate: new Date(selectedDate),
      });
    }
  };

  const handleDogPictureChange = async () => {
    // Заявка за разрешение за достъп до галерията
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Нужно разрешение', 'Моля, дайте разрешение за достъп до галерията.');
      return;
    }
    
    try {
      // Отваряне на галерията за избора на изображение
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      // Ако потребителят не е откачил избора
      if (!pickerResult.canceled) {
        const selectedImage = pickerResult.assets && pickerResult.assets[0];
        if (selectedImage?.uri) {
          setDogForm({ ...dogForm, dogPicture: selectedImage.uri });
        }
      }
    } catch (error) {
      console.error('Грешка при избора на кучешка снимка:', error.message);
      Alert.alert('Грешка', 'Неуспешно избиране на кучешка снимка. Опитайте отново.');
    }
  };
  

  const handleSaveDog = async () => {
    let dogDataToSave = { ...dogForm };
  
    // Ако избраната снимка е локален URI, качваме я и обновяваме полето с URL
    if (dogForm.dogPicture && dogForm.dogPicture.startsWith('file://')) {
      const downloadUrl = await uploadDogPicture(dogForm.dogPicture);
      if (downloadUrl) {
        dogDataToSave.dogPicture = downloadUrl;
      }
    }
  
    // Ако датата на раждане е от тип Date, конвертираме я в ISO формат
    if (dogDataToSave.dogBirthDate instanceof Date) {
      dogDataToSave.dogBirthDate = dogDataToSave.dogBirthDate.toISOString();
    }
  
    let updatedDogs;
    if (isEditingDog && editingDogIndex !== null) {
      // Редакция
      updatedDogs = [...dogs];
      updatedDogs[editingDogIndex] = dogDataToSave;
    } else {
      // Добавяне
      updatedDogs = [...dogs, dogDataToSave];
    }
  
    setDogs(updatedDogs);
  
    try {
      const userDocRef = doc(firestore, 'users', userId);
      await updateDoc(userDocRef, { dogs: updatedDogs });
      setDogForm({
        dogPicture: null,
        dogName: '',
        dogBreed: '',
        dogBirthDate: null,
        dogSex: 'male',
        dogColor: '',
        hasVaccination: false,
        hasPassport: false,
        skills: {
          retrieving: false,
          birdHunting: false,
          hareHunting: false,
          boarTracking: false,
        },
      });
      setDogModalVisible(false);
      setIsEditingDog(false);
      setEditingDogIndex(null);
    } catch (error) {
      console.error('Грешка при запазване на кучето:', error);
      Alert.alert('Грешка', 'Неуспешно запазване на данните за кучето.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Профил</Text>
        <TouchableOpacity onPress={handleLogOut}>
          <Ionicons name="log-out-outline" size={30} color="white" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.scrollView}>
        {/* Профилна информация */}
        <View style={styles.profileInfoContainer}>
          <TouchableOpacity onPress={handleProfilePictureChange}>
            {isEditing ? (
              newProfilePicture ? (
                <Image source={{ uri: newProfilePicture }} style={styles.profilePicture} />
              ) : user.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={styles.profilePicture} />
              ) : (
                <Ionicons name="person-circle" size={100} color="gray" />
              )
            ) : user.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.profilePicture} />
            ) : (
              <Ionicons name="person-circle" size={100} color="gray" />
            )}
          </TouchableOpacity>
          <View style={styles.userDetails}>
            {isEditing ? (
              <>
                <TextInput
                  style={styles.nameInput}
                  placeholder="Име"
                  value={user.firstName}
                  onChangeText={(text) => setUser({ ...user, firstName: text })}
                />
                <TextInput
                  style={styles.nameInput}
                  placeholder="Фамилия"
                  value={user.lastName}
                  onChangeText={(text) => setUser({ ...user, lastName: text })}
                />
              </>
            ) : (
              <Text style={styles.userName}>{`${user.firstName} ${user.lastName}`}</Text>
            )}
            <View style={styles.emailContainer}>
              <Ionicons name="mail" size={16} color="#ccc" />
              {isEditing ? (
                <TextInput
                  style={styles.emailInput}
                  placeholder="Имейл"
                  value={user.email}
                  onChangeText={(text) => setUser(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                />
              ) : (
                <Text style={styles.userEmail}>{user.email}</Text>
              )}
            </View>
            {isEditing ? (
              <TextInput
                style={styles.input} // или нов стил за телефон
                placeholder="Телефонен номер"
                value={user.phone}
                onChangeText={(text) => setUser({ ...user, phone: text })}
                keyboardType="phone-pad"
              />
            ) : (
              <View style={styles.phoneContainer}>
                <Ionicons name="call" size={16} color="#ccc" />
                <Text style={styles.userPhone}>{user.phone}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.dogSection}>
          <Text style={styles.sectionTitle}>Кучета</Text>

          {dogs.length > 0 ? (
            dogs.map((dog, index) => {
              const dogSkills = dog.skills || {};

              return (
                <View key={index} style={styles.dogCard}>
                  {/* Горна част (Header): снимка, име, порода */}
                  {/* Ако НЕ сме в режим на редакция, цялото е кликваемо -> отваря детайлен модал */}
                  {!isEditing ? (
                    <TouchableOpacity
                      style={styles.dogCardHeader}
                      onPress={() => {
                        // Тук задавате selectedDog и отваряте новия модал showDogDetailsModal
                        setSelectedDog(dog);
                        setShowDogDetailsModal(true);
                      }}
                    >
                      {dog.dogPicture ? (
                        <Image source={{ uri: dog.dogPicture }} style={styles.dogPicture} />
                      ) : (
                        <Ionicons name="paw-outline" size={60} color="#ccc" />
                      )}

                      <View style={styles.dogHeaderInfo}>
                        <Text style={styles.dogNameText}>
                          {dog.dogName || 'Без име'}
                        </Text>
                        <Text style={styles.dogBreedText}>
                          {dog.dogBreed || 'Без порода'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.dogCardHeader}>
                      {dog.dogPicture ? (
                        <Image source={{ uri: dog.dogPicture }} style={styles.dogPicture} />
                      ) : (
                        <Ionicons name="paw-outline" size={60} color="#ccc" />
                      )}

                      <View style={styles.dogHeaderInfo}>
                        <Text style={styles.dogNameText}>
                          {dog.dogName || 'Без име'}
                        </Text>
                        <Text style={styles.dogBreedText}>
                          {dog.dogBreed || 'Без порода'}
                        </Text>
                      </View>

                      <View style={styles.dogActions}>
                        <TouchableOpacity onPress={() => openDogModal(dog, index)}>
                          <Ionicons name="create-outline" size={24} color="#8FBA1D" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            const updatedDogs = [...dogs];
                            updatedDogs.splice(index, 1);
                            setDogs(updatedDogs);
                            const userDocRef = doc(firestore, 'users', userId);
                            updateDoc(userDocRef, { dogs: updatedDogs }).catch((error) => {
                              console.error('Грешка при изтриване на куче от базата:', error);
                            });
                          }}
                        >
                          <Ionicons name="trash-outline" size={24} color="#c0392b" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Долна част (Body) с детайлите: показваме я САМО при isEditing */}
                  {isEditing && (
                    <View style={styles.dogCardBody}>
                      <Text>
                        Пол: {dog.dogSex === 'male' ? 'Мъжко' : 'Женско'}
                      </Text>
                      {dog.dogBirthDate && (
                        <Text>
                          Родено:{" "}
                          {new Date(dog.dogBirthDate).toLocaleDateString('bg-BG', {
                            year: 'numeric',
                            month: 'long',
                          })}
                        </Text>
                      )}
                      <Text>Цвят: {dog.dogColor || 'Не е посочен'}</Text>
                      <Text>Ваксиниран: {dog.hasVaccination ? 'Да' : 'Не'}</Text>
                      <Text>Паспорт: {dog.hasPassport ? 'Да' : 'Не'}</Text>

                      <Text>Умения:</Text>
                      {dogSkills.retrieving && <Text>- Апортиране</Text>}
                      {dogSkills.birdHunting && <Text>- Лов на пернат дивеч</Text>}
                      {dogSkills.hareHunting && <Text>- Лов на заек</Text>}
                      {dogSkills.boarTracking && <Text>- Проследяване на диви свине</Text>}
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <Text style={styles.sectionText}>Няма добавени кучета</Text>
          )}
          {isEditing && (
            <TouchableOpacity onPress={() => openDogModal()} style={styles.addDogButton}>
              <Text style={styles.addDogButtonText}>Добави куче</Text>
            </TouchableOpacity>
          )}
        </View>
        {/* Детайли на профила */}
        <View style={styles.profileDetailsContainer}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Биография</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                placeholder="Напишете кратка биография"
                value={bio}
                onChangeText={setBio}
                multiline
              />
            ) : (
              <Text style={styles.sectionText}>{bio || 'Няма въведена биография'}</Text>
            )}
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Ловен лиценз</Text>
            {isEditing ? (
              <>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowLicenseDatePicker(true)}
                >
                  <Text style={styles.datePickerText}>Изберете начална дата</Text>
                </TouchableOpacity>
                {showLicenseDatePicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="date"
                    display="default"
                    onChange={handleLicenseDateChange}
                  />
                )}
                <Text style={styles.sectionText}>
                  Начална дата: {huntingLicense.start || 'Не е избрано'}
                </Text>
                <Text style={styles.sectionText}>
                  Крайна дата: {huntingLicense.end || 'Не е изчислено'}
                </Text>
              </>
            ) : (
              <Text style={styles.sectionText}>
                {huntingLicense.start
                  ? `${huntingLicense.start} - ${huntingLicense.end}`
                  : 'Няма въведен ловен билет'}
              </Text>
            )}
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Ловна бележка</Text>
            {isEditing ? (
              <>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowNotesDatePicker(true)}
                >
                  <Text style={styles.datePickerText}>Изберете начална дата</Text>
                </TouchableOpacity>
                {showNotesDatePicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="date"
                    display="default"
                    onChange={handleNotesDateChange}
                  />
                )}
                <Text style={styles.sectionText}>
                  Начална дата: {huntingNotes.start || 'Не е избрано'}
                </Text>
                <Text style={styles.sectionText}>
                  Крайна дата: {huntingNotes.end || 'Не е изчислено'}
                </Text>
              </>
            ) : (
              <Text style={styles.sectionText}>
                {huntingNotes.start
                  ? `${huntingNotes.start} - ${huntingNotes.end}`
                  : 'Няма въведена ловна бележка'}
              </Text>
            )}
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Оръжия</Text>
            {equipment.length > 0 ? (
              equipment.map((eq, index) => (
                <View key={index} style={styles.equipmentContainer}>
                  <Text style={styles.weaponText}>
                    {eq.name} - {eq.model} ({eq.caliber})
                  </Text>
                  {isEditing && (
                    <TouchableOpacity
                      onPress={() => handleRemoveEquipment(index)}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeButtonText}>Премахни</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.sectionText}>Няма добавени оръжия</Text>
            )}
            {isEditing && (
              <TouchableOpacity onPress={handleAddEquipment} style={styles.addButton}>
                <Text style={styles.addButtonText}>Добави оръжие</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Секция за Галерия */}
          <View style={styles.sectionContainer}>
            <View style={styles.galleryHeader}>
              <Text style={styles.sectionTitle}>Галерия</Text>
              <TouchableOpacity
                onPress={() => setShowGalleryModal(true)}
                style={styles.openGalleryButton}
              >
                <Text style={styles.openGalleryButtonText}>Виж всички</Text>
              </TouchableOpacity>
            </View>
            {galleryMedia.length > 0 ? (
              <FlatList
                data={galleryMedia}
                horizontal
                pagingEnabled={true}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => handleOpenMedia(item)}>
                    {item.mediaType === 'videos' ? (
                      <Video
                        source={{ uri: item.mediaUrl }}
                        style={styles.galleryMediaItem}
                        useNativeControls
                        resizeMode="cover"
                      />
                    ) : (
                      <Image
                        source={{ uri: item.mediaUrl }}
                        style={styles.galleryMediaItem}
                        resizeMode="cover"
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            ) : (
              <Text style={styles.sectionText}>Няма намерени медии</Text>
            )}
          </View>

          {/* Модал за пълноекранна галерия */}
          <Modal
            visible={showGalleryModal}
            animationType="slide"
            onRequestClose={() => setShowGalleryModal(false)}
          >
            <View style={styles.fullScreenGalleryContainer}>
              <View style={styles.fullScreenModalHeader}>
                <Text style={styles.fullScreenModalTitle}>Галеря</Text>
                <TouchableOpacity
                  onPress={() => setShowGalleryModal(false)}
                  style={styles.fullScreenGalleryCloseButton}
                >
                  <Ionicons name="close" size={30} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.sortButtonContainer}>
                <TouchableOpacity
                  onPress={() => setSortMenuVisible(!sortMenuVisible)}
                  style={styles.sortButton}
                >
                  <Ionicons name="funnel-outline" size={24} color="#fff" />
                </TouchableOpacity>
                {sortMenuVisible && (
                  <View style={styles.sortMenuContainer}>
                    <Text style={styles.sortMenuTitle}>Метод:</Text>
                    <TouchableOpacity
                      onPress={() => handleSortMethod('date')}
                      style={[
                        styles.sortMenuItem,
                        isSelectedMethod('date') && styles.sortMenuItemSelected,
                      ]}
                    >
                      <Text style={styles.sortMenuItemText}>По дата</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleSortMethod('type')}
                      style={[
                        styles.sortMenuItem,
                        isSelectedMethod('type') && styles.sortMenuItemSelected,
                      ]}
                    >
                      <Text style={styles.sortMenuItemText}>По вид</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleSortMethod('size')}
                      style={[
                        styles.sortMenuItem,
                        isSelectedMethod('size') && styles.sortMenuItemSelected,
                      ]}
                    >
                      <Text style={styles.sortMenuItemText}>По размер</Text>
                    </TouchableOpacity>
                    <Text style={styles.sortMenuTitle}>Ред:</Text>
                    <TouchableOpacity
                      onPress={() => handleSortOrder('asc')}
                      style={[
                        styles.sortMenuItem,
                        isSelectedOrder('asc') && styles.sortMenuItemSelected,
                      ]}
                    >
                      <Text style={styles.sortMenuItemText}>Възходящо</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleSortOrder('desc')}
                      style={[
                        styles.sortMenuItem,
                        isSelectedOrder('desc') && styles.sortMenuItemSelected,
                      ]}
                    >
                      <Text style={styles.sortMenuItemText}>Низходящо</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <ScrollView contentContainerStyle={styles.fullScreenGalleryContent}>
                <View style={styles.galleryGrid}>
                  {galleryMedia.map((item) => (
                    <View key={item.id} style={styles.galleryGridItem}>
                      <TouchableOpacity onPress={() => handleOpenMedia(item)}>
                        {item.mediaType === 'videos' ? (
                          <Video
                            source={{ uri: item.mediaUrl }}
                            style={styles.galleryGridMedia}
                            useNativeControls={false}
                            resizeMode="cover"
                          />
                        ) : (
                          <Image
                            source={{ uri: item.mediaUrl }}
                            style={styles.galleryGridMedia}
                            resizeMode="cover"
                          />
                        )}
                      </TouchableOpacity>
                      <Text style={styles.gridItemInfoText}>
                        {new Date(item.timestamp?.toMillis() || Date.now()).toLocaleDateString()}
                        {item.location ? ` - ${item.location}` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </Modal>

          {/* Модал за пълноекранно преглеждане на избраната медия */}
          {selectedMedia && (
            <Modal
              visible={showFullScreenMedia}
              animationType="slide"
              onRequestClose={() => {
                setShowFullScreenMedia(false);
                setSelectedMedia(null);
              }}
            >
              <View style={styles.fullScreenMediaViewContainer}>
                <TouchableOpacity
                  style={styles.fullScreenMediaCloseButton}
                  onPress={() => {
                    setShowFullScreenMedia(false);
                    setSelectedMedia(null);
                  }}
                >
                  <Ionicons name="close" size={30} color="#fff" />
                </TouchableOpacity>
                {selectedMedia.mediaType === 'videos' ? (
                  <Video
                    source={{ uri: selectedMedia.mediaUrl }}
                    style={styles.fullScreenMediaView}
                    useNativeControls
                    resizeMode="contain"
                  />
                ) : (
                  <Image
                    source={{ uri: selectedMedia.mediaUrl }}
                    style={styles.fullScreenMediaView}
                    resizeMode="contain"
                  />
                )}
                <Text style={styles.mediaInfoText}>
                  {new Date(selectedMedia.timestamp?.toMillis() || Date.now()).toLocaleString()}
                  {selectedMedia.location ? ` - ${selectedMedia.location}` : ''}
                </Text>
              </View>
            </Modal>
          )}

          {/* Модал за избор на оръжие */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={isWeaponModalVisible}
            onRequestClose={() => setWeaponModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Избери оръжие</Text>
                <FlatList
                  data={weaponList}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.weaponItem}
                      onPress={() => handleSelectWeapon(item)}
                    >
                      <Text style={styles.weaponText}>
                        {item.name} - {item.model} ({item.caliber})
                      </Text>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity onPress={() => setWeaponModalVisible(false)} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>Затвори</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => (isEditing ? handleSaveChanges() : setIsEditing(true))}
          >
            <Text style={styles.editButtonText}>
              {isEditing ? 'Запази промените' : 'Редактирай профила'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Модал за добавяне на куче */}
        <Modal
          visible={dogModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setDogModalVisible(false)}
        >
          <View style={styles.dogModalContainer}>
            <View style={styles.dogModalContent}>
              <View style={styles.dogModalHeader}>
                <Text style={styles.dogModalTitle}>
                  {isEditingDog ? 'Редактирай куче' : 'Добави куче'}
                </Text>
                <TouchableOpacity onPress={() => setDogModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={handleDogPictureChange} style={styles.dogPictureContainer}>
                {dogForm.dogPicture ? (
                  <Image source={{ uri: dogForm.dogPicture }} style={styles.dogPictureModal} />
                ) : (
                  <Ionicons name="paw-outline" size={60} color="#ccc" />
                )}
              </TouchableOpacity>
              <TextInput
                style={styles.dogInput}
                placeholder="Име на кучето"
                value={dogForm.dogName}
                onChangeText={(text) => setDogForm({ ...dogForm, dogName: text })}
              />
              <Picker
                selectedValue={dogForm.dogBreed}
                onValueChange={(itemValue) => setDogForm({ ...dogForm, dogBreed: itemValue })}
                style={styles.dogPicker}
              >
                {dogOptions.map((dog, index) => (
                  <Picker.Item key={index} label={dog} value={dog} />
                ))}
              </Picker>

              <Text style={styles.dogLabel}>Дата на раждане</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDogBirthDatePicker(true)}
              >
                <Text style={styles.datePickerText}>
                  {dogForm.dogBirthDate instanceof Date
                    ? dogForm.dogBirthDate.toLocaleDateString('bg-BG', { year: 'numeric', month: 'long' })
                    : 'Изберете месец и година'}
                </Text>
              </TouchableOpacity>
              {showDogBirthDatePicker && (
                <DateTimePicker
                  value={dogForm.dogBirthDate instanceof Date ? dogForm.dogBirthDate : new Date()}
                  mode="date"
                  display="spinner"
                  onChange={handleDogBirthDateChange}
                />
              )}

              <Text style={styles.dogLabel}>Пол</Text>
              <Picker
                selectedValue={dogForm.dogSex}
                onValueChange={(value) => setDogForm({ ...dogForm, dogSex: value })}
                style={styles.dogPicker}
              >
                <Picker.Item label="Мъжко" value="male" />
                <Picker.Item label="Женско" value="female" />
              </Picker>

              <Text style={styles.dogLabel}>Цвят</Text>
              <TextInput
                style={styles.dogInput}
                placeholder="Напр. кафяв, черен, бяло-черно..."
                value={dogForm.dogColor}
                onChangeText={(text) => setDogForm({ ...dogForm, dogColor: text })}
              />

              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  onPress={() => setDogForm({ ...dogForm, hasVaccination: !dogForm.hasVaccination })}
                  style={styles.checkboxContainer}
                >
                  <Ionicons
                    name={dogForm.hasVaccination ? "checkbox" : "square-outline"}
                    size={24}
                    color="#555"
                  />
                  <Text style={styles.checkboxLabel}>Ваксиниран</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setDogForm({ ...dogForm, hasPassport: !dogForm.hasPassport })}
                  style={styles.checkboxContainer}
                >
                  <Ionicons
                    name={dogForm.hasPassport ? "checkbox" : "square-outline"}
                    size={24}
                    color="#555"
                  />
                  <Text style={styles.checkboxLabel}>Паспорт</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.dogLabel}>Умения</Text>
              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  onPress={() => setDogForm({
                    ...dogForm,
                    skills: { ...dogForm.skills, retrieving: !dogForm.skills.retrieving },
                  })}
                  style={styles.checkboxContainer}
                >
                  <Ionicons
                    name={dogForm.skills?.retrieving ? "checkbox" : "square-outline"}
                    size={24}
                    color="#555"
                  />
                  <Text style={styles.checkboxLabel}>Апортиране</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  onPress={() => setDogForm({
                    ...dogForm,
                    skills: { ...dogForm.skills, birdHunting: !dogForm.skills.birdHunting },
                  })}
                  style={styles.checkboxContainer}
                >
                  <Ionicons
                    name={dogForm.skills?.birdHunting ? "checkbox" : "square-outline"}
                    size={24}
                    color="#555"
                  />
                  <Text style={styles.checkboxLabel}>Лов на пернат дивеч</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  onPress={() => setDogForm({
                    ...dogForm,
                    skills: { ...dogForm.skills, hareHunting: !dogForm.skills.hareHunting },
                  })}
                  style={styles.checkboxContainer}
                >
                  <Ionicons
                    name={dogForm.skills?.hareHunting ? "checkbox" : "square-outline"}
                    size={24}
                    color="#555"
                  />
                  <Text style={styles.checkboxLabel}>Лов на заек</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  onPress={() => setDogForm({
                    ...dogForm,
                    skills: { ...dogForm.skills, boarTracking: !dogForm.skills.boarTracking },
                  })}
                  style={styles.checkboxContainer}
                >
                  <Ionicons
                    name={dogForm.skills?.boarTracking ? "checkbox" : "square-outline"}
                    size={24}
                    color="#555"
                  />
                  <Text style={styles.checkboxLabel}>Проследяване на диви свине</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dogModalButtons}>
                <TouchableOpacity onPress={() => setDogModalVisible(false)} style={styles.dogCancelButton}>
                  <Text style={styles.dogCancelButtonText}>Отказ</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveDog} style={styles.dogSaveButton}>
                  <Text style={styles.dogSaveButtonText}>Запази</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showDogDetailsModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDogDetailsModal(false)}
        >
          <View style={styles.dogDetailsModalContainer}>
            <View style={styles.dogDetailsModalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDogDetailsModal(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>

              {selectedDog && (
                <>
                  {selectedDog.dogPicture ? (
                    <Image
                      source={{ uri: selectedDog.dogPicture }}
                      style={styles.dogPictureModal}
                    />
                  ) : (
                    <Ionicons name="paw-outline" size={80} color="#ccc" />
                  )}

                  <Text style={styles.dogNameText}>
                    {selectedDog.dogName || 'Без име'}
                  </Text>
                  <Text style={styles.dogBreedText}>
                    {selectedDog.dogBreed || 'Без порода'}
                  </Text>

                  <Text>
                    Пол: {selectedDog.dogSex === 'male' ? 'Мъжко' : 'Женско'}
                  </Text>

                  {selectedDog.dogBirthDate && (
                    <Text>
                      Родено:{" "}
                      {new Date(selectedDog.dogBirthDate).toLocaleDateString('bg-BG', {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </Text>
                  )}

                  <Text>Цвят: {selectedDog.dogColor || 'Не е посочен'}</Text>
                  <Text>Ваксиниран: {selectedDog.hasVaccination ? 'Да' : 'Не'}</Text>
                  <Text>Паспорт: {selectedDog.hasPassport ? 'Да' : 'Не'}</Text>

                  <Text>Умения:</Text>
                  {selectedDog.skills?.retrieving && <Text>- Апортиране</Text>}
                  {selectedDog.skills?.birdHunting && <Text>- Лов на пернат дивеч</Text>}
                  {selectedDog.skills?.hareHunting && <Text>- Лов на заек</Text>}
                  {selectedDog.skills?.boarTracking && <Text>- Проследяване на диви свине</Text>}

                  {isEditing && (
                    <TouchableOpacity
                      style={styles.editDogButton}
                      onPress={() => {
                        setShowDogDetailsModal(false);
                        const idx = dogs.indexOf(selectedDog);
                        openDogModal(selectedDog, idx);
                      }}
                    >
                      <Text style={styles.editDogButtonText}>Редактирай кучето</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};

Profile.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      userEmail: PropTypes.string,
      firstTime: PropTypes.bool,
      profileUserId: PropTypes.string,
      groupId: PropTypes.string,
    }),
  }).isRequired,
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    reset: PropTypes.func.isRequired,
    replace: PropTypes.func.isRequired,
  }).isRequired,
  groupId: PropTypes.string,
};


export default Profile;
