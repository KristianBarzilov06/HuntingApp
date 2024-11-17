import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Checkbox } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import styles from '../src/styles/ProfileStyles.js';
import { saveProfileData, loadProfileData } from '../src/utils/firestoreUtils';
import { auth } from '../firebaseConfig';

const Profile = ({ route, navigation }) => {
  const userEmail = route.params?.userEmail || auth.currentUser?.email || '';
  const userId = auth.currentUser?.uid || '';

  const [user, setUser] = useState({
    name: 'Кристиян Бързилов',
    email: userEmail,
    profilePicture: require('../images/IMG_20230701_185012_979.jpg'),
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

  const [showLicenseDatePicker, setShowLicenseDatePicker] = useState(false);
  const [showNotesDatePicker, setShowNotesDatePicker] = useState(false);

  const dogOptions = ['Дратхаар', 'Гонче', 'Кокершпаньол'];

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
        }
      } catch (error) {
        console.error('Грешка при зареждане на данни:', error.message);
      }
    };

    fetchProfileData();
  }, [userId]);

  const handleSaveChanges = async () => {
    const profileData = {
      bio,
      licenseType,
      huntingLicense,
      huntingNotes,
      equipment,
      dogBreed,
      gallery,
      isGroupHunting,
      isSelectiveHunting,
    };

    try {
      await saveProfileData(userId, profileData);
      console.log('Профилът е успешно запазен!');
      setIsEditing(false);
    } catch (error) {
      console.error('Грешка при записването на профила:', error.message);
    }
  };

  const handleLogOut = async () => {
    try {
      setUser({
        name: '',
        email: '',
        profilePicture: require('../images/IMG_20230701_185012_979.jpg'),
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

  const handleAddEquipment = () => {
    setEquipment([...equipment, { name: '', model: '', caliber: '' }]);
  };

  const handleUpdateEquipment = (index, field, value) => {
    const updatedEquipment = [...equipment];
    updatedEquipment[index][field] = value;
    setEquipment(updatedEquipment);
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
        <View style={styles.profileInfo}>
          <Image source={user.profilePicture} style={styles.profilePicture} />
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>

        <View style={styles.profileDetailsContainer}>
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
            <Text>{bio || 'Няма въведена биография'}</Text>
          )}

            <Text style={styles.sectionTitle}>Ловен лиценз</Text>
            {isEditing ? (
            <View>
                <View style={styles.checkboxContainer}>
                <Checkbox
                    status={isGroupHunting ? 'checked' : 'unchecked'}
                    onPress={() => setIsGroupHunting(!isGroupHunting)}
                />
                <Text>Групов лов</Text>
                </View>
                <View style={styles.checkboxContainer}>
                <Checkbox
                    status={isSelectiveHunting ? 'checked' : 'unchecked'}
                    onPress={() => setIsSelectiveHunting(!isSelectiveHunting)}
                    disabled={!isGroupHunting}
                />
                <Text>Подборен лов</Text>
                </View>
            </View>
            ) : (
            <Text>
                {isGroupHunting && isSelectiveHunting
                ? 'Групов лов, Подборен лов'
                : isGroupHunting
                ? 'Групов лов'
                : 'Няма избран лиценз'}
            </Text>
            )}

          <Text style={styles.sectionTitle}>Ловен билет</Text>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowLicenseDatePicker(true)}
              >
                <Text>Изберете начална дата</Text>
              </TouchableOpacity>
              {showLicenseDatePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  display="default"
                  onChange={handleLicenseDateChange}
                />
              )}
              <Text>
                Начална дата: {huntingLicense.start || 'Не е избрано'}
              </Text>
              <Text>
                Крайна дата: {huntingLicense.end || 'Не е изчислено'}
              </Text>
            </>
          ) : (
            <Text>
              {huntingLicense.start
                ? `${huntingLicense.start} - ${huntingLicense.end}`
                : 'Няма въведен ловен билет'}
            </Text>
          )}

          <Text style={styles.sectionTitle}>Ловна бележка</Text>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowNotesDatePicker(true)}
              >
                <Text>Изберете начална дата</Text>
              </TouchableOpacity>
              {showNotesDatePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  display="default"
                  onChange={handleNotesDateChange}
                />
              )}
              <Text>
                Начална дата: {huntingNotes.start || 'Не е избрано'}
              </Text>
              <Text>
                Крайна дата: {huntingNotes.end || 'Не е изчислено'}
              </Text>
            </>
          ) : (
            <Text>
              {huntingNotes.start
                ? `${huntingNotes.start} - ${huntingNotes.end}`
                : 'Няма въведена ловна бележка'}
            </Text>
          )}

          <Text style={styles.sectionTitle}>Оръжия</Text>
          {equipment.map((eq, index) => (
            <View key={index}>
              {isEditing ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Име"
                    value={eq.name}
                    onChangeText={(text) => handleUpdateEquipment(index, 'name', text)}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Модел"
                    value={eq.model}
                    onChangeText={(text) => handleUpdateEquipment(index, 'model', text)}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Калибър"
                    value={eq.caliber}
                    onChangeText={(text) => handleUpdateEquipment(index, 'caliber', text)}
                  />
                </>
              ) : (
                <Text>{`Име: ${eq.name}\nМодел: ${eq.model}\nКалибър: ${eq.caliber}`}</Text>
              )}
            </View>
          ))}
          {isEditing && (
            <TouchableOpacity onPress={handleAddEquipment}>
              <Text style={styles.addButtonText}>Добави оръжие</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.sectionTitle}>Куче</Text>
          {isEditing ? (
            <Picker
              selectedValue={dogBreed}
              onValueChange={(itemValue) => setDogBreed(itemValue)}
              style={styles.input}
            >
              {dogOptions.map((dog, index) => (
                <Picker.Item key={index} label={dog} value={dog} />
              ))}
            </Picker>
          ) : (
            <Text>{dogBreed || 'Няма въведена порода куче'}</Text>
          )}

          <Text style={styles.sectionTitle}>Галерия</Text>
          <Text>Галерията е в разработка</Text>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => (isEditing ? handleSaveChanges() : setIsEditing(true))}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? 'Запази промените' : 'Редактирай профила'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default Profile;
