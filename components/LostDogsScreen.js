import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import PropTypes from 'prop-types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAuth } from 'firebase/auth';
import { firestore } from '../firebaseConfig';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Ionicons } from '@expo/vector-icons';
import styles from '../src/styles/LostDogsStyles';

const LostDogsScreen = ({ navigation }) => {
  const auth = getAuth();
  const currentUserId = auth.currentUser.uid;

  // Списък с обяви и pull-to-refresh
  const [ads, setAds] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Модал за създаване/редакция
  const [modalVisible, setModalVisible] = useState(false);

  // Полета за формуляра
  const [adType, setAdType] = useState('lost'); // "lost" или "found"
  const [description, setDescription] = useState('');
  const [breed, setBreed] = useState('Не е избрана порода');
  const [gender, setGender] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Функционалност за редакция
  const [isEditing, setIsEditing] = useState(false);
  const [editingAd, setEditingAd] = useState(null);

  const dogOptions = [
    'Не е избрана порода',
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

  // Зареждане на обявите от Firebase
  const fetchAds = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, 'lostFoundDogs'));
      const loadedAds = [];
      querySnapshot.forEach((docSnap) => {
        if (docSnap.exists()) {
          loadedAds.push({ id: docSnap.id, ...docSnap.data() });
        }
      });
      setAds(loadedAds);
    } catch (error) {
      console.error('Грешка при зареждането на обявите:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAds();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAds();
  }, []);

  // Функция за избор и качване на снимка
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Грешка", "Необходимо е разрешение за достъп до галерията.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setUploadedImage(result.assets[0].uri);
    }
  };

  const uploadImageToFirebase = async (imageUri) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const storage = getStorage();
      const timestamp = new Date().getTime();
      const imageRef = ref(storage, `lostDogs/${currentUserId}_${timestamp}`);
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error("Грешка при качване на снимка:", error);
      Alert.alert("Грешка", "Неуспешно качване на снимка.");
      return null;
    }
  };

  // Функция за създаване на нова обява
  const handleCreateAd = async () => {
    if (!description.trim() || !breed.trim() || !gender.trim() || !location.trim()) {
      Alert.alert('Грешка', 'Моля попълнете всички полета.');
      return;
    }
    setIsSaving(true);
    let finalImageURL = null;
    if (uploadedImage) {
      finalImageURL = await uploadImageToFirebase(uploadedImage);
    }
    const newAd = {
      adType,
      description,
      breed,
      gender,
      date: date.toISOString(),
      location,
      userId: currentUserId,
      creationDate: new Date().toISOString(),
      uploadedImage: finalImageURL,
    };
    try {
      const docRef = await addDoc(collection(firestore, 'lostFoundDogs'), newAd);
      newAd.id = docRef.id;
      setAds(prevAds => [newAd, ...prevAds]);
      Alert.alert('Успешно', 'Обявата е публикувана.');
      resetForm();
    } catch (error) {
      console.error("Грешка при публикуване:", error);
      Alert.alert('Грешка', 'Неуспешно публикуване на обявата.');
    }
    setIsSaving(false);
  };

  // Функция за редакция – попълване на формата със стойностите на обявата
  const handleEditAd = (ad) => {
    setEditingAd(ad);
    setAdType(ad.adType);
    setDescription(ad.description);
    setBreed(ad.breed);
    setGender(ad.gender);
    setDate(new Date(ad.date));
    setLocation(ad.location);
    setUploadedImage(ad.uploadedImage);
    setIsEditing(true);
    setModalVisible(true);
  };

  // Запазване на промените в редактирания запис
  const handleSaveChanges = async () => {
    if (!editingAd) return;
    if (!description.trim() || !breed.trim() || !gender.trim() || !location.trim()) {
      Alert.alert('Грешка', 'Моля попълнете всички полета.');
      return;
    }
    setIsSaving(true);
    let finalImageURL = uploadedImage;
    if (uploadedImage && uploadedImage.startsWith('file://')) {
      finalImageURL = await uploadImageToFirebase(uploadedImage);
    }
    const updatedAd = {
      adType,
      description,
      breed,
      gender,
      date: date.toISOString(),
      location,
      uploadedImage: finalImageURL,
    };
    try {
      const docRef = doc(firestore, 'lostFoundDogs', editingAd.id);
      await updateDoc(docRef, updatedAd);
      const newAds = ads.map((ad) =>
        ad.id === editingAd.id ? { ...ad, ...updatedAd } : ad
      );
      setAds(newAds);
      Alert.alert('Успешно', 'Обявата е обновена.');
      resetForm();
    } catch (error) {
      console.error('Error updating ad:', error);
      Alert.alert('Грешка', 'Неуспешна редакция на обявата.');
    }
    setIsSaving(false);
    setIsEditing(false);
    setEditingAd(null);
  };

  // Функция за нулиране на формата
  const resetForm = () => {
    setModalVisible(false);
    setAdType('lost');
    setDescription('');
    setBreed('Не е избрана порода');
    setGender('');
    setDate(new Date());
    setLocation('');
    setUploadedImage(null);
    setIsEditing(false);
    setEditingAd(null);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Заглавна част */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Загубени/Намерени Кучета</Text>
      </View>

      {/* Списък с обяви */}
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {ads.length > 0 ? (
          ads.map((ad) => (
            <View key={ad.id} style={styles.adCard}>
              <Text style={styles.adTitle}>
                {ad.breed} ({ad.adType === 'lost' ? 'Изгубено' : 'Намерено'})
              </Text>
              {ad.uploadedImage && (
                <Image source={{ uri: ad.uploadedImage }} style={styles.uploadedImage} />
              )}
              <Text style={styles.adInfo}>Описание: {ad.description}</Text>
              <Text style={styles.adInfo}>Пол: {ad.gender}</Text>
              <Text style={styles.adInfo}>
                Дата: {new Date(ad.date).toLocaleDateString('bg-BG')}
              </Text>
              <Text style={styles.adInfo}>Намерено на тази локация: {ad.location}</Text>
              {/* Footer с данни и бутон за редакция */}
              <View style={styles.adFooter}>
                <View style={styles.adUserInfo}>
                  {/* Можете да добавите потребителска снимка, ако има такава */}
                  <Ionicons name="person-circle-outline" size={40} color="#999" style={{ marginRight: 8 }} />
                  <Text style={styles.adUserName}>Вие</Text>
                </View>
                <View style={styles.adFooterRight}>
                  {ad.userId === currentUserId && (
                    <TouchableOpacity
                      style={styles.adEditButton}
                      onPress={() => handleEditAd(ad)}
                    >
                      <Text style={styles.adEditButtonText}>Редактирай обявата</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noAdsText}>Няма публикувани обяви.</Text>
        )}
      </ScrollView>

      {/* Плаващ бутон за създаване на нова обява */}
      <TouchableOpacity style={styles.createAdButton} onPress={() => resetForm()}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Модал за създаване/редакция */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalCenteredView}>
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>
                {isEditing ? 'Редакция на обява' : 'Нова обява'}
              </Text>

              {/* Избор между "Изгубено" и "Намерено" */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  onPress={() => setAdType('lost')}
                  style={[styles.toggleButton, adType === 'lost' && styles.toggleButtonActive]}>
                  <Text style={styles.toggleText}>
                    Изгубено {adType === 'lost' && <Ionicons name="checkmark" size={16} color="white" />}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setAdType('found')}
                  style={[styles.toggleButton, adType === 'found' && styles.toggleButtonActive]}>
                  <Text style={styles.toggleText}>
                    Намерено {adType === 'found' && <Ionicons name="checkmark" size={16} color="white" />}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Описание:</Text>
              <TextInput
                style={styles.input}
                placeholder="Въведете описание"
                placeholderTextColor="#aaa"
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <Text style={styles.label}>Порода:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={breed}
                  onValueChange={(itemValue) => setBreed(itemValue)}
                  style={{ color: '#FFF' }}
                >
                  {dogOptions.map((option, index) => (
                    <Picker.Item key={index} label={option} value={option} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Пол:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={gender}
                  onValueChange={(itemValue) => setGender(itemValue)}
                  style={{ color: '#FFF' }}
                >
                  <Picker.Item label="Мъжко" value="male" />
                  <Picker.Item label="Женско" value="female" />
                </Picker>
              </View>

              <Text style={styles.label}>Дата на която е загубено кучето:</Text>
              <View>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
                  <Text style={styles.input}>
                    {date.toLocaleDateString('bg-BG')}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setDate(selectedDate);
                      }
                    }}
                  />
                )}
              </View>

              <Text style={styles.label}>Намерено на тази локация:</Text>
              <TextInput
                style={styles.input}
                placeholder="Въведете локация"
                placeholderTextColor="#aaa"
                value={location}
                onChangeText={setLocation}
              />

              {/* Бутон за избор на снимка */}
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                <Text style={styles.imagePickerText}>
                  {uploadedImage ? 'Промени снимка' : 'Избери снимка'}
                </Text>
              </TouchableOpacity>
              {uploadedImage && (
                <Image source={{ uri: uploadedImage }} style={styles.uploadedImage} />
              )}

              <TouchableOpacity
                style={[styles.submitButton, isSaving && { opacity: 0.6 }]}
                onPress={isEditing ? handleSaveChanges : handleCreateAd}
                disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isEditing ? 'Запази промените' : 'Публикувай обявата'}
                  </Text>
                )}
              </TouchableOpacity>

              {isEditing && (
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: '#B22222' }]}
                  onPress={async () => {
                    try {
                      await deleteDoc(doc(firestore, 'lostFoundDogs', editingAd.id));
                      setAds(ads.filter((ad) => ad.id !== editingAd.id));
                      Alert.alert('Успешно', 'Обявата е изтрита.');
                      resetForm();
                    } catch {
                      Alert.alert('Грешка', 'Неуспешно изтриване на обявата.');
                    }
                  }}>
                  <Text style={styles.cancelButtonText}>Изтрий обявата</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                <Text style={styles.cancelButtonText}>Отказ</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

LostDogsScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};

export default LostDogsScreen;
