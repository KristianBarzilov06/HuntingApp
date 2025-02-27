import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';  
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, addDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firestore } from '../firebaseConfig';
import styles from '../src/styles/EventsScreenStyles';
import PropTypes from 'prop-types';

const EventsScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;
  const [events, setEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [eventDetailsModalVisible, setEventDetailsModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDescription, setEventDescription] = useState('');
  const [eventDates, setEventDates] = useState([]);
  const [eventType, setEventType] = useState('event');
  const [huntType, setHuntType] = useState('bigGame');
  const [location, setLocation] = useState('');
  const [timeRangeStart, setTimeRangeStart] = useState(new Date());
  const [timeRangeEnd, setTimeRangeEnd] = useState(new Date());
  const [participants, setParticipants] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [members, setMembers] = useState([]);
  const [dateError, setDateError] = useState("");
  const userId = getAuth().currentUser.uid;

  const roleTranslations = {
    chairman: "Председател",
    secretary: "Секретар",
    member: "Член",
    hunter: "Ловец",
    guest: "Гост",
  }; 
  const roleColors = {
    chairman: "#2E7D32",
    secretary: "#558B2F",
    member: "#6D4C41",
    hunter: "#EF6C00",
    guest: "#BDBDBD",
  };
  const getHighestRoleTranslation = (roles) => {
    if (!Array.isArray(roles) || roles.length === 0) return roleTranslations["hunter"];
  
    const roleHierarchy = ["admin", "chairman", "secretary", "member", "hunter", "guest"];
    
    const highestRole = roleHierarchy.find(role => roles.includes(role)) || "guest";
    
    return roleTranslations[highestRole];
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserRole(getHighestRoleTranslation(userSnap.data().roles || ["hunter"]));
      }
    };
    fetchUserRole();
  }, [userId]);

  useEffect(() => {
    const unsubscribeMembers = onSnapshot(
      collection(firestore, 'groups', groupId, 'members'),
      (snapshot) => {
        const loadedMembers = snapshot.docs.map(doc => ({
          id: doc.id,
          firstName: doc.data().firstName || '',
          lastName: doc.data().lastName || '',
          roles: doc.data().roles || ["hunter"],
        }));
        setMembers(loadedMembers);
      },
      (error) => console.error('❌ Грешка при извличане на членовете:', error)
    );
    return () => unsubscribeMembers();
  }, [groupId]);

  // Fetch events for the group
  useEffect(() => {
    const unsubscribeEvents = onSnapshot(
      collection(firestore, 'groups', groupId, 'events'),
      (snapshot) => {
        const loadedEvents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEvents(loadedEvents);
      },
      (error) => console.error('Error fetching events:', error)
    );
    return () => unsubscribeEvents();
  }, [groupId]);

  const createEvent = async () => {
    if (!eventDescription.trim() || eventDates.length === 0 || !location.trim()) {
      Alert.alert('Грешка', 'Моля, попълнете всички полета.');
      return;
    }
    const newEvent = {
      eventDescription,
      eventDates,
      eventType,
      location,
      createdBy: userId,
      timeRange: eventType === 'hunt' ? { start: timeRangeStart, end: timeRangeEnd } : null,
      participants,  // Add selected participants to the event
    };
    await addDoc(collection(firestore, 'groups', groupId, 'events'), newEvent);
    setModalVisible(false);
    setEventDescription('');
    setEventDates([]);
    setLocation('');
    setTimeRangeStart(new Date());
    setTimeRangeEnd(new Date());
    setParticipants([]);
  };

  const confirmDeleteEvent = (eventId) => {
    Alert.alert(
      "Потвърждение", 
      "Сигурни ли сте, че искате да изтриете това събитие? Това действие не може да бъде отменено!",
      [
        { text: "Отказ", style: "cancel" },
        { text: "Изтрий", onPress: () => deleteEvent(eventId), style: "destructive" }
      ]
    );
  };

  const deleteEvent = async (eventId) => {
    await deleteDoc(doc(firestore, 'groups', groupId, 'events', eventId));
    Alert.alert('Събитие изтрито', 'Събитието беше успешно изтрито.');
  };

  const openEventDetails = (event) => {
    setSelectedEvent(event);
    setEventDetailsModalVisible(true);
  };

  // Handle participant selection
  const toggleParticipant = (memberId) => {
    setParticipants(prevState => {
      if (prevState.includes(memberId)) {
        return prevState.filter(id => id !== memberId);  // Deselect participant
      } else {
        return [...prevState, memberId];  // Select participant
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{groupName} - Събития</Text>
      </View>

      {userRole === getHighestRoleTranslation(["chairman"]) && (
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.createButton}>
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.createButtonText}>Създай събитие</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openEventDetails(item)}>
            <View style={styles.eventItem}>
              <Text style={styles.eventTitle}>
                {item.eventDescription.length > 50 ? `${item.eventDescription.substring(0, 50)}...` : item.eventDescription}
              </Text>

              {/* Проверяваме дали потребителят има право да изтрива събития */}
              {userRole === getHighestRoleTranslation(["chairman"]) && (
                <TouchableOpacity 
                  onPress={() => confirmDeleteEvent(item.id)} 
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash" size={24} color="white" />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Modal for creating a new event */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={styles.centeredView} // ✅ Използваме стил от stylesheet
        >
          <View style={styles.modalContainer}>
            <ScrollView 
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>Създай ново събитие</Text>

              <View style={styles.pickerContainer}>
                <Picker selectedValue={eventType} onValueChange={(itemValue) => setEventType(itemValue)} style={styles.picker}>
                  <Picker.Item label="Събитие" value="event" />
                  <Picker.Item label="Ловна хайка" value="hunt" />
                </Picker>
              </View>

              <TextInput 
                style={styles.input} 
                placeholder="Описание" 
                placeholderTextColor="#AAA"
                value={eventDescription} 
                onChangeText={setEventDescription} 
              />

              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
                <Text style={styles.datePickerButtonText}>📅 Изберете дати</Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  mode="date"
                  value={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      const newDate = selectedDate.toISOString().split('T')[0];
                      if (eventDates.includes(newDate)) {
                        setDateError("Вече има такава избрана дата!");
                        setTimeout(() => setDateError(""), 3000);
                      } else {
                        setEventDates([...eventDates, newDate]);
                        setDateError("");
                      }
                    }
                  }}
                />
              )}

              {eventDates.length > 0 && (
                <View style={styles.selectedDatesContainer}>
                  <Text style={styles.selectedDatesTitle}>Избрани дати:</Text>
                  {eventDates.map((date, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.selectedDateItem}
                      onPress={() => setEventDates(eventDates.filter(d => d !== date))}
                    >
                      <Text>{date} ❌</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}

              <TextInput 
                style={[styles.input, styles.locationInput]} 
                placeholder="Локация" 
                placeholderTextColor="#AAA"
                value={location} 
                onChangeText={setLocation} 
              />

              {eventType === 'hunt' && (
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={huntType} onValueChange={(itemValue) => setHuntType(itemValue)} style={styles.picker}>
                    <Picker.Item label="Лов на едър дивеч" value="bigGame" />
                    <Picker.Item label="Лов на пернат дивеч" value="birdHunt" />
                  </Picker>
                </View>
              )}

              {members.map((member) => {
                const highestRole = getHighestRoleTranslation(member.roles);
                const roleKey = Object.keys(roleTranslations).find(key => roleTranslations[key] === highestRole) || "guest";

                return (
                  <View key={member.id} style={[styles.participantItem, { backgroundColor: roleColors[roleKey] || "#444" }]}>
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>{member.firstName || 'Unknown'} {member.lastName || 'Unknown'}</Text>
                      <Text style={styles.participantRole}>{highestRole}</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => toggleParticipant(member.id)} 
                      style={[styles.checkbox, participants.includes(member.id) && styles.checkboxChecked]}
                    >
                      {participants.includes(member.id) && <Ionicons name="checkmark" size={18} color="white" />}
                    </TouchableOpacity>
                  </View>
                );
              })}

              <TouchableOpacity onPress={createEvent} style={styles.createButton}>
                <Text style={styles.createButtonText}>Запази</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Отказ</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Modal for event details */}
      <Modal visible={eventDetailsModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Детайли на събитие</Text>
            {selectedEvent && (
              <ScrollView>
                <Text style={styles.modalDescription}>Описание: {selectedEvent.eventDescription}</Text>
                <Text style={styles.modalDescription}>Локация: {selectedEvent.location}</Text>
                <Text style={styles.modalDescription}>
                  Дати: {selectedEvent.eventDates.map(date => {
                    if (date?.seconds) {
                      return new Date(date.seconds * 1000).toLocaleDateString();
                    }
                    return new Date(date).toLocaleDateString();
                  }).join(', ')}
                </Text>

                {selectedEvent.eventType === 'hunt' && (
                  <Text style={styles.modalDescription}>Тип лов: {selectedEvent.huntType}</Text>
                )}

                {selectedEvent.timeRange && (
                  <Text style={styles.modalDescription}>
                    Времеви диапазон: 
                    {new Date(selectedEvent.timeRange.start.seconds * 1000).toLocaleString()} - 
                    {new Date(selectedEvent.timeRange.end.seconds * 1000).toLocaleString()}
                  </Text>
                )}

                <Text style={styles.modalDescription}>Избрани участници:</Text>
                {selectedEvent.participants && selectedEvent.participants.length > 0 ? (
                  selectedEvent.participants.map((participantId) => {
                    const participant = members.find(member => member.id === participantId);
                    return participant ? (
                      <View 
                        key={participant.id} 
                        style={[styles.participantItem, { backgroundColor: roleColors[getHighestRoleTranslation(participant.roles)] || "#444" }]}
                      >
                        <Text style={styles.participantName}>
                          {participant.firstName} {participant.lastName}
                        </Text>
                        <Text style={styles.participantRole}>
                          {getHighestRoleTranslation(participant.roles)}
                        </Text>
                      </View>
                    ) : null;
                  })
                ) : (
                  <Text style={styles.modalDescription}>Няма избрани участници</Text>
                )}
              </ScrollView>
            )}
            <TouchableOpacity onPress={() => setEventDetailsModalVisible(false)} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Затвори</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
  </View>
  );
};

EventsScreen.propTypes = {
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

export default EventsScreen;
