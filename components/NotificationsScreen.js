import React, { useState, useEffect } from 'react';
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
  Platform 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, addDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firestore } from '../firebaseConfig';
import styles from '../src/styles/NotificationsScreenStyles';
import PropTypes from 'prop-types';

const NotificationsScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;
  const [notifications, setNotifications] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expirationDate, setExpirationDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [userRole, setUserRole] = useState('');
  const userId = getAuth().currentUser.uid;

  // Зареждаме ролята на потребителя – само председателят може да създава известия
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

  // Зареждаме известията за групата и автоматично изтриваме изтеклите
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, 'groups', groupId, 'notifications'),
      (snapshot) => {
        const currentTime = new Date();
        const validNotifications = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (
            data.expirationDate &&
            new Date(data.expirationDate.toDate ? data.expirationDate.toDate() : data.expirationDate) < currentTime
          ) {
            deleteDoc(doc(firestore, 'groups', groupId, 'notifications', docSnap.id));
          } else {
            validNotifications.push({ id: docSnap.id, ...data });
          }
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

  // Опростен обработчик за DateTimePicker – избира само крайна дата
  const handleDateChange = (_, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExpirationDate(selectedDate);
    }
  };

  // Функция за създаване на ново известие с валидация
  const createNotification = async () => {
    if (!title.trim() || !description.trim() || !expirationDate) {
      Alert.alert("Грешка", "Моля, попълнете всички полета.");
      return;
    }
    if (expirationDate <= new Date()) {
      Alert.alert("Грешка", "Крайна дата трябва да бъде в бъдещето.");
      return;
    }
    const newNotification = {
      title: title.trim(),
      description: description.trim(),
      createdAt: new Date(),
      expirationDate,
      createdBy: userId,
    };
    try {
      await addDoc(collection(firestore, 'groups', groupId, 'notifications'), newNotification);
      setModalVisible(false);
      setTitle('');
      setDescription('');
      setExpirationDate(new Date());
    } catch (error) {
      Alert.alert("Грешка", "Неуспешно създаване на известието.");
      console.error("Грешка при създаване на известие:", error);
    }
  };

  // Потвърждение и функция за изтриване на известие
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

  // Рендериране на един елемент от списъка с известия
  const renderNotificationItem = ({ item }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationDescription}>{item.description}</Text>
        <Text style={styles.notificationDate}>
          Създадено: {item.createdAt ? new Date(item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt).toLocaleString() : ""}
        </Text>
        <Text style={styles.notificationExpiration}>
          Валидно до: {item.expirationDate ? new Date(item.expirationDate.toDate ? item.expirationDate.toDate() : item.expirationDate).toLocaleString() : "Без срок"}
        </Text>
      </View>
      {userRole === "chairman" && (
        <TouchableOpacity onPress={() => confirmDeleteNotification(item.id)} style={styles.deleteButton}>
          <Ionicons name="trash" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
                <Text style={styles.datePickerButtonText}>Изберете крайна дата за валидност</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                mode="date"
                display="default"
                value={expirationDate}
                onChange={handleDateChange}
                />
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
