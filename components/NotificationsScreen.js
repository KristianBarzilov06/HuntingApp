import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, addDoc, doc, getDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firestore } from '../firebaseConfig';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import styles from '../src/styles/NotificationsScreenStyles';
import PropTypes from 'prop-types';

const NotificationsScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;
  const [notifications, setNotifications] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // За единична дата:
  const [expirationDate, setExpirationDate] = useState(new Date());
  // За диапазон:
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  // Режим – единична дата или диапазон:
  const [isRange, setIsRange] = useState(false);
  // Избраните документи (множество):
  const [documents, setDocuments] = useState([]);
  // Контрол за видимост на DateTimePicker:
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Режим на избраната дата – 'single', 'start' или 'end':
  const [pickerMode, setPickerMode] = useState('single');

  const [userRole, setUserRole] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const userId = getAuth().currentUser.uid;

  // Помощна функция за нормализиране на датата (без часовете)
  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Зареждане на потребителската роля – само председателят може да създава известия
  useEffect(() => {
    const fetchUserRole = async () => {
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const roles = userSnap.data().roles || ['hunter'];
        setUserRole(roles.includes('chairman') ? 'chairman' : 'other');
      }
    };
    fetchUserRole();
  }, [userId]);

  // Зареждане на известията за групата в реално време
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, 'groups', groupId, 'notifications'),
      (snapshot) => {
        const currentDate = normalizeDate(new Date());
        const validNotifications = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.endDate) {
            const end = normalizeDate(data.endDate.toDate ? data.endDate.toDate() : data.endDate);
            if (end < currentDate) return;
          } else if (data.expirationDate) {
            const exp = normalizeDate(data.expirationDate.toDate ? data.expirationDate.toDate() : data.expirationDate);
            if (exp < currentDate) return;
          }
          validNotifications.push({ id: docSnap.id, ...data });
        });
        validNotifications.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt.toDate ? a.createdAt.toDate() : a.createdAt) : 0;
          const dateB = b.createdAt ? new Date(b.createdAt.toDate ? b.createdAt.toDate() : b.createdAt) : 0;
          return dateB - dateA;
        });
        setNotifications(validNotifications);
      },
      (error) => console.error("Грешка при зареждане на известия:", error)
    );
    return () => unsubscribe();
  }, [groupId]);

  const refreshNotifications = useCallback(async () => {
    setRefreshing(true);
    try {
      const snapshot = await getDocs(collection(firestore, 'groups', groupId, 'notifications'));
      const currentDate = normalizeDate(new Date());
      const validNotifications = [];
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.endDate) {
          const end = normalizeDate(data.endDate.toDate ? data.endDate.toDate() : data.endDate);
          if (end < currentDate) return;
        } else if (data.expirationDate) {
          const exp = normalizeDate(data.expirationDate.toDate ? data.expirationDate.toDate() : data.expirationDate);
          if (exp < currentDate) return;
        }
        validNotifications.push({ id: docSnap.id, ...data });
      });
      validNotifications.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt.toDate ? a.createdAt.toDate() : a.createdAt) : 0;
        const dateB = b.createdAt ? new Date(b.createdAt.toDate ? b.createdAt.toDate() : b.createdAt) : 0;
        return dateB - dateA;
      });
      setNotifications(validNotifications);
    } catch (error) {
      console.error("Error refreshing notifications:", error);
    }
    setRefreshing(false);
  }, [groupId]);

  const handleDateChange = (_, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (pickerMode === 'single') {
        setExpirationDate(selectedDate);
      } else if (pickerMode === 'start') {
        setStartDate(selectedDate);
      } else if (pickerMode === 'end') {
        setEndDate(selectedDate);
      }
    }
  };

  // Избор на документ – използва result.canceled и result.assets
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
      console.log("Избран документ:", result);
      if (!result.canceled) {
        const docItem = result.assets && result.assets.length > 0 ? result.assets[0] : result;
        setDocuments(prevDocs => [...prevDocs, docItem]);
      }
    } catch (error) {
      console.error("Грешка при избора на документ:", error);
    }
  };

  const uploadDocument = async (docItem) => {
    try {
      console.log("Качване на документ:", docItem);
      const response = await fetch(docItem.uri);
      const blob = await response.blob();
      const storageRef = ref(getStorage(), `documents/${Date.now()}_${docItem.name}`);
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      console.log("Документ качен успешно. URL:", downloadUrl);
      return { downloadUrl, name: docItem.name };
    } catch (error) {
      console.error("Грешка при качване на документа:", error);
      Alert.alert("Грешка", "Неуспешно качване на документа.");
      return null;
    }
  };

  const createNotification = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Грешка", "Моля, попълнете всички полета.");
      return;
    }
    let newNotification = {
      title: title.trim(),
      description: description.trim(),
      createdAt: new Date(),
      createdBy: userId,
    };
    if (isRange) {
      if (normalizeDate(startDate) > normalizeDate(endDate)) {
        Alert.alert("Грешка", "Началната дата трябва да е по-рано от крайната дата.");
        return;
      }
      if (normalizeDate(endDate) < normalizeDate(new Date())) {
        Alert.alert("Грешка", "Крайната дата трябва да бъде в бъдещето.");
        return;
      }
      newNotification.startDate = startDate;
      newNotification.endDate = endDate;
    } else {
      if (normalizeDate(expirationDate) < normalizeDate(new Date())) {
        Alert.alert("Грешка", "Крайна дата трябва да бъде в бъдещето.");
        return;
      }
      newNotification.expirationDate = expirationDate;
    }
    if (documents.length > 0) {
      const uploadedDocs = [];
      for (let docItem of documents) {
        const docUpload = await uploadDocument(docItem);
        if (docUpload) {
          uploadedDocs.push(docUpload);
        }
      }
      if (uploadedDocs.length > 0) {
        newNotification.documents = uploadedDocs;
      }
    }
    console.log("Новото известие:", newNotification);
    
    try {
      await addDoc(collection(firestore, 'groups', groupId, 'notifications'), newNotification);
      setModalVisible(false);
      setTitle('');
      setDescription('');
      setExpirationDate(new Date());
      setStartDate(new Date());
      setEndDate(new Date());
      setIsRange(false);
      setDocuments([]);
    } catch (error) {
      Alert.alert("Грешка", "Неуспешно създаване на известието.");
      console.error("Грешка при създаване на известие:", error);
    }
  };

  const confirmDeleteNotification = (notificationId) => {
    Alert.alert(
      "Потвърждение",
      "Сигурни ли сте, че искате да изтриете това известие? Това действие не може да бъде отменено!",
      [
        { text: "Отказ", style: "cancel" },
        { text: "Изтрий", onPress: () => deleteNotification(notificationId), style: "destructive" }
      ]
    );
  };

  const deleteNotification = async (notificationId) => {
    try {
      await deleteDoc(doc(firestore, 'groups', groupId, 'notifications', notificationId));
      Alert.alert("Известие изтрито", "Известието беше успешно изтрито.");
    } catch (error) {
      Alert.alert("Грешка", "Неуспешно изтриване на известието.");
      console.error("Грешка при изтриване на известие:", error);
    }
  };

  const renderNotificationItem = ({ item }) => {
    let validUntilText = "Без срок";
    if (item.startDate && item.endDate) {
      validUntilText = `Валидно от: ${new Date(item.startDate.toDate ? item.startDate.toDate() : item.startDate).toLocaleDateString()} до: ${new Date(item.endDate.toDate ? item.endDate.toDate() : item.endDate).toLocaleDateString()}`;
    } else if (item.expirationDate) {
      validUntilText = `Валидно до: ${new Date(item.expirationDate.toDate ? item.expirationDate.toDate() : item.expirationDate).toLocaleDateString()}`;
    }
    return (
      <View style={styles.notificationItem}>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationDescription}>{item.description}</Text>
          <Text style={styles.notificationDate}>
            Създадено: {item.createdAt ? new Date(item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt).toLocaleDateString() : ""}
          </Text>
          <Text style={styles.notificationExpiration}>{validUntilText}</Text>
          {item.documents && item.documents.length > 0 && (
            <View style={{ marginTop: 10 }}>
              {item.documents.map((doc, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.documentButton}
                  onPress={() => {
                    console.log("Отваряне на документ:", doc);
                    Linking.openURL(doc.downloadUrl);
                  }}
                >
                  <Text style={styles.documentButtonText}>Прегледай документ ({doc.name})</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        {userRole === "chairman" && (
          <TouchableOpacity onPress={() => confirmDeleteNotification(item.id)} style={styles.deleteButton}>
            <Ionicons name="trash" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Хедър, подобен на ChatScreen */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
          <Ionicons name="arrow-back" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{groupName} - Известия</Text>
      </View>
      {userRole === "chairman" && (
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.createButton}>
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.createButtonText}>Създай известие</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        refreshing={refreshing}
        onRefresh={refreshNotifications}
      />
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.centeredView}>
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Създай ново известие</Text>
              <TextInput
                style={styles.input}
                placeholder="Заглавие"
                placeholderTextColor="#AAA"
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={[styles.input, { height: 100 }]}
                placeholder="Описание"
                placeholderTextColor="#AAA"
                value={description}
                onChangeText={setDescription}
                multiline
              />
              <View style={styles.dateTypeContainer}>
                <TouchableOpacity
                  style={[styles.dateTypeButton, !isRange && styles.dateTypeButtonActive]}
                  onPress={() => setIsRange(false)}
                >
                  <Text style={styles.dateTypeButtonText}>Единична дата</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dateTypeButton, isRange && styles.dateTypeButtonActive]}
                  onPress={() => setIsRange(true)}
                >
                  <Text style={styles.dateTypeButtonText}>Диапазон</Text>
                </TouchableOpacity>
              </View>
              {!isRange ? (
                <TouchableOpacity
                  onPress={() => { setPickerMode('single'); setShowDatePicker(true); }}
                  style={styles.datePickerButton}
                >
                  <Text style={styles.datePickerButtonText}>
                    Валидно до: {expirationDate ? expirationDate.toLocaleDateString() : "Изберете дата"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => { setPickerMode('start'); setShowDatePicker(true); }}
                    style={styles.datePickerButton}
                  >
                    <Text style={styles.datePickerButtonText}>
                      От дата: {startDate ? startDate.toLocaleDateString() : "Изберете начална дата"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setPickerMode('end'); setShowDatePicker(true); }}
                    style={styles.datePickerButton}
                  >
                    <Text style={styles.datePickerButtonText}>
                      До дата: {endDate ? endDate.toLocaleDateString() : "Изберете крайна дата"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              {showDatePicker && (
                <DateTimePicker
                  mode="date"
                  display="default"
                  value={
                    pickerMode === 'single'
                      ? expirationDate
                      : pickerMode === 'start'
                      ? startDate
                      : endDate
                  }
                  onChange={handleDateChange}
                />
              )}
              <TouchableOpacity onPress={pickDocument} style={[styles.datePickerButton, { backgroundColor: '#6c757d' }]}>
                <Text style={styles.datePickerButtonText}>
                  {documents.length > 0 ? "Добавени документи" : "Качи документ"}
                </Text>
              </TouchableOpacity>
              {documents.length > 0 && (
                <View style={styles.documentListContainer}>
                  {documents.map((doc, index) => (
                    <Text key={index} style={styles.documentListItem}>
                      {doc.name}
                    </Text>
                  ))}
                </View>
              )}
              <TouchableOpacity onPress={createNotification} style={styles.createButton}>
                <Text style={styles.createButtonText}>Запази</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Отказ</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

NotificationsScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      groupId: PropTypes.string.isRequired,
      groupName: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

export default NotificationsScreen;
