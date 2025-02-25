import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, Alert, ScrollView } from 'react-native';  
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Checkbox } from 'react-native-paper';  // Correct import for CheckBox from 'react-native-paper'
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
  const [participants, setParticipants] = useState([]);  // Holds selected participants
  const [userRole, setUserRole] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [members, setMembers] = useState([]);  // Holds list of group members

  const userId = getAuth().currentUser.uid;

  useEffect(() => {
    const fetchUserRole = async () => {
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserRole(userSnap.data().role || 'hunter');
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
          firstName: doc.data().firstName,
          lastName: doc.data().lastName,
          role: doc.data().role,
        }));
        setMembers(loadedMembers);
      },
      (error) => console.error('Error fetching members:', error)
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

      {userRole === 'chairman' && (
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
              {userRole === 'chairman' && (
                <TouchableOpacity onPress={() => deleteEvent(item.id)} style={styles.deleteButton}>
                  <Ionicons name="trash" size={24} color="white" />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Modal for creating a new event */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Създай ново събитие</Text>
            <TextInput style={styles.input} placeholder="Описание" value={eventDescription} onChangeText={setEventDescription} />
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
              <Text>Изберете дати</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                mode="date"
                value={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setEventDates([...eventDates, selectedDate.toISOString().split('T')[0]]);
                  }
                }}
              />
            )}
            <TextInput style={styles.input} placeholder="Локация" value={location} onChangeText={setLocation} />
            <Picker selectedValue={eventType} onValueChange={(itemValue) => setEventType(itemValue)}>
              <Picker.Item label="Събитие" value="event" />
              <Picker.Item label="Ловна хайка" value="hunt" />
            </Picker>
            {eventType === 'hunt' && (
              <Picker selectedValue={huntType} onValueChange={(itemValue) => setHuntType(itemValue)}>
                <Picker.Item label="Лов на едър дивеч" value="bigGame" />
                <Picker.Item label="Лов на пернат дивеч" value="birdHunt" />
              </Picker>
            )}
            
            {/* Participants list */}
            {members.map((member) => (
            <View key={member.id} style={styles.participantItem}>
                {/* Ensure both name and role are strings */}
                <Text>{member.firstName || 'Unknown'} {member.lastName || 'Unknown'} ({member.role || 'No role'})</Text>
                <Checkbox
                status={participants.includes(member.id) ? 'checked' : 'unchecked'}
                onPress={() => toggleParticipant(member.id)}
                />
            </View>
            ))}
            
            <TouchableOpacity onPress={createEvent} style={styles.createButton}>
              <Text style={styles.createButtonText}>Запази</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Отказ</Text>
            </TouchableOpacity>
          </View>
        </View>
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
                Дати: {selectedEvent.eventDates.map(date => new Date(date.seconds * 1000).toLocaleDateString()).join(', ')}
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

                {/* Показваме участниците, които са били избрани за събитието */}
                <Text style={styles.modalDescription}>Избрани участници:</Text>
                {selectedEvent.participants && selectedEvent.participants.length > 0 ? (
                selectedEvent.participants.map((participantId) => {
                    const participant = members.find(member => member.id === participantId);
                    return participant ? (
                    <Text key={participant.id} style={styles.modalDescription}>
                        {participant.firstName} {participant.lastName} ({participant.role})
                    </Text>
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
