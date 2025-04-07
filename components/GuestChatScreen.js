import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDoc, arrayRemove } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { Audio, Video } from 'expo-av';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore } from '../firebaseConfig';
import styles from '../src/styles/ChatStyles';
import PropTypes from 'prop-types';
import * as Clipboard from 'expo-clipboard';

const GuestChatScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;
  const userId = getAuth().currentUser.uid;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [profilePictures, setProfilePictures] = useState({});
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuRotation, setMenuRotation] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [recording, setRecording] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const flatListRef = useRef(null);

  // Зареждане на съобщенията от guest чат
  useEffect(() => {
    const messagesRef = collection(firestore, `groups/${groupId}/guest_chat_messages`);
    const unsubscribeMessages = onSnapshot(messagesRef, { source: 'server' }, (snapshot) => {
      const loadedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })).sort((a, b) => a.timestamp - b.timestamp);
      setMessages(loadedMessages);
    });
    return () => unsubscribeMessages();
  }, [groupId]);

  // Зареждане на профилните снимки (ако са необходими)
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(firestore, 'users'), (snapshot) => {
      const updatedPictures = {};
      snapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.profilePicture) {
          updatedPictures[doc.id] = userData.profilePicture;
        }
      });
      setProfilePictures(updatedPictures);
    });
    return () => unsubscribeUsers();
  }, []);

  // Зареждане на данните на потребителя, за да определим дали е гост или член
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRef = doc(firestore, `users/${userId}`);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const isGuest = userData.roles?.includes(`guest{${groupName}}`);
          setIsMember(!isGuest);
        }
      } catch (error) {
        console.error("Грешка при зареждане на данните на потребителя:", error);
      }
    };
    fetchUserData();
  }, [userId, groupName]);

  // Функция за изпращане на текстово съобщение
  const sendMessage = async () => {
    if (newMessage.trim() === '') return;
    const messageData = {
      text: newMessage,
      timestamp: new Date(),
      userId: userId,
    };
    try {
      await addDoc(collection(firestore, `groups/${groupId}/guest_chat_messages`), messageData);
      setNewMessage('');
    } catch (error) {
      console.error("Грешка при изпращане на съобщението:", error);
      Alert.alert("Грешка", "Неуспешно изпращане на съобщението.");
    }
  };

  // Функция за качване на медия (снимка или видео)
  const uploadMedia = async (fromGallery) => {
    const permissionResult = fromGallery
      ? await ImagePicker.requestMediaLibraryPermissionsAsync()
      : await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Нужно е разрешение', 'Моля, дайте разрешение за достъп.');
      return;
    }
    const pickerResult = fromGallery
      ? await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, allowsEditing: true, quality: 0.7 })
      : await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.All });
    if (!pickerResult.canceled) {
      const selectedMedia = pickerResult.assets && pickerResult.assets[0];
      if (selectedMedia?.uri) {
        const mediaType = selectedMedia.type === 'video' ? 'videos' : 'images';
        uploadToFirebaseStorage(selectedMedia.uri, mediaType);
      }
    }
  };

  // Функция за качване във Firebase Storage
  const uploadToFirebaseStorage = async (uri, folder) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileRef = ref(getStorage(), `${folder}/${Date.now()}.${folder === 'videos' ? 'mp4' : 'jpg'}`);
      await uploadBytes(fileRef, blob);
      let downloadUrl = await getDownloadURL(fileRef);
      if (!downloadUrl) {
        Alert.alert("Грешка", "Неуспешно качване, няма URL.");
        return;
      }
      await addDoc(collection(firestore, `groups/${groupId}/guest_chat_messages`), {
        text: '',
        mediaUrl: downloadUrl,
        mediaType: folder,
        timestamp: new Date(),
        userId: userId,
      });
    } catch {
      Alert.alert("Грешка", "Неуспешно качване на файла.");
    }
  };

  // Функция за възпроизвеждане на аудио
  const playAudio = async (audioUrl, messageId) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      setPlayingMessageId(messageId);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) {
          setPlayingMessageId(null);
        }
      });
    } catch (error) {
      console.error("Грешка при възпроизвеждане на аудио:", error);
    }
  };

  // Функции за гласово съобщение
  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Нужно е разрешение", "Моля, разрешете достъп до микрофона.");
        return;
      }
      const { recording } = await Audio.Recording.createAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      setRecording(recording);
    } catch (error) {
      console.error("Грешка при стартиране на записа:", error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setRecording(null);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    uploadVoiceMessage(uri);
  };

  const uploadVoiceMessage = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileRef = ref(getStorage(), `audio/${Date.now()}.m4a`);
      await uploadBytes(fileRef, blob);
      let downloadUrl = await getDownloadURL(fileRef);
      if (!downloadUrl) {
        Alert.alert("Грешка", "Неуспешно качване, няма URL.");
        return;
      }
      await addDoc(collection(firestore, `groups/${groupId}/guest_chat_messages`), {
        text: '',
        mediaUrl: downloadUrl,
        mediaType: "audio",
        timestamp: new Date(),
        userId: userId,
      });
    } catch (error) {
      console.error("Грешка при качване на аудио:", error);
      Alert.alert("Грешка", "Неуспешно качване на аудиото.");
    }
  };

  // Функция за превключване на менюто (ако има такова)
  const toggleMenu = () => {
    setMenuVisible(prev => !prev);
    setMenuRotation(prev => (prev === 0 ? 90 : 0));
  };

  // Функция за напускане на групата
  const leaveGroup = async () => {
    Alert.alert(
      "Напускане на групата",
      "Сигурни ли сте, че искате да напуснете тази група?",
      [
        {
          text: "Отказ",
          style: "cancel",
        },
        {
          text: "Напусни",
          style: "destructive",
          onPress: async () => {
            try {
              const userRef = doc(firestore, `users/${userId}`);
              const memberRef = doc(firestore, `groups/${groupId}/members/${userId}`);
              const groupRef = doc(firestore, `groups/${groupId}`);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const userData = userSnap.data();
                let updatedRoles = [...userData.roles];
                const isGuestInGroup = updatedRoles.includes(`guest{${groupName}}`);
                if (isGuestInGroup) {
                  updatedRoles = updatedRoles.filter(role => role !== `guest{${groupName}}`);
                } else {
                  updatedRoles = updatedRoles.filter(role => role.startsWith("guest{"));
                  updatedRoles.push("hunter");
                }
                const updatedGroups = userData.groups ? userData.groups.filter(g => g !== groupId) : [];

                // Ако потребителят е гост, изпращаме системно съобщение в guest_chat_messages
                if (isGuestInGroup) {
                  const leaveMessageData = {
                    text: `${userData.firstName || 'Потребител'} ${userData.lastName || ''} напусна групата`,
                    timestamp: new Date(),
                    userId,
                    systemMessage: true,
                  };
                  await addDoc(collection(firestore, 'groups', groupId, 'guest_chat_messages'), leaveMessageData);
                }

                await updateDoc(userRef, {
                  roles: updatedRoles,
                  groups: updatedGroups,
                });
                await deleteDoc(memberRef);
                await updateDoc(groupRef, { members: arrayRemove(userId) });
                navigation.replace('Main', { refresh: true });
              }
            } catch (error) {
              console.error("GuestChatScreen.leaveGroup: Грешка при напускане на групата:", error);
              Alert.alert("Грешка", "Неуспешно напускане на групата.");
            }
          },
        },
      ]
    );
  };



  // Функция за копиране на текст
  const handleCopy = async (text) => {
    await Clipboard.setString(text);
  };

  // Функция за показване на OptionsModal при задържане на съобщение
  const handleLongPress = (message) => {
    setSelectedMessage(message);
    setOptionsModalVisible(true);
  };

  // Компонент OptionsModal, използван както в ChatScreen
  const OptionsModal = ({ visible, message, onClose }) => {
    if (!message) return null;
    const messageType = message.mediaType ? message.mediaType : 'text';
    const isOwn = message.userId === userId;
    return (
      <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
        <TouchableOpacity style={styles.modalOverlay} onPress={onClose}>
          <View style={styles.optionsModalContainer}>
            {messageType === 'text' && (
              <>
                {isOwn ? (
                  <>
                    <TouchableOpacity style={styles.optionButton} onPress={() => { /* Ако желаете да добавите редакция */ onClose(); }}>
                      <Text style={styles.optionText}>Редакция</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.optionButton} onPress={() => { handleCopy(message.text); onClose(); }}>
                      <Text style={styles.optionText}>Копиране</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.optionButton} onPress={() => { /* Ако желаете да добавите изтриване за свои съобщения */ onClose(); }}>
                      <Text style={styles.optionText}>Изтриване</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity style={styles.optionButton} onPress={() => { handleCopy(message.text); onClose(); }}>
                    <Text style={styles.optionText}>Копиране</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.optionButtonLast} onPress={onClose}>
                  <Text style={styles.optionText}>Отказ</Text>
                </TouchableOpacity>
              </>
            )}
            {(messageType === 'images' || messageType === 'videos' || messageType === 'audio') && (
              <>
                <TouchableOpacity style={styles.optionButton} onPress={() => { /* Ако имате функция за изтегляне, поставете я тук */ onClose(); }}>
                  <Text style={styles.optionText}>Изтегляне</Text>
                </TouchableOpacity>
                {isOwn && (
                  <TouchableOpacity style={styles.optionButton} onPress={() => { /* Ако желаете да добавите изтриване за свои медийни съобщения */ onClose(); }}>
                    <Text style={styles.optionText}>Изтриване</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.optionButtonLast} onPress={onClose}>
                  <Text style={styles.optionText}>Отказ</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  OptionsModal.propTypes = {
    visible: PropTypes.bool.isRequired,
    message: PropTypes.oneOfType([
      PropTypes.shape({
        mediaType: PropTypes.string,
        text: PropTypes.string,
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        mediaUrl: PropTypes.string,
        userId: PropTypes.string.isRequired,
      }),
      PropTypes.oneOf([null])
    ]),
    onClose: PropTypes.func.isRequired,
  };

  const renderMessage = ({ item }) => {

    if (item.systemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }

    const isMyMessage = item.userId === userId;
    const profilePicture = profilePictures[item.userId];


    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
        {!isMyMessage && (
          <TouchableOpacity style={styles.profileIconContainer} activeOpacity={0.7}>
            {profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.profileIcon} />
            ) : (
              <Ionicons name="person-circle-outline" size={30} color="black" />
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onLongPress={() => handleLongPress(item)}
          style={[styles.messageContent, isMyMessage ? styles.myMessage : styles.otherMessage]}
        >
          {item.mediaUrl ? (
            item.mediaType === "audio" ? (
              <TouchableOpacity onPress={() => playAudio(item.mediaUrl, item.id)}>
                <Ionicons
                  name={playingMessageId === item.id ? "pause-circle" : "play-circle"}
                  size={40}
                  color="black"
                />
              </TouchableOpacity>
            ) : item.mediaType === "videos" ? (
              <Video source={{ uri: item.mediaUrl }} style={styles.messageVideo} useNativeControls />
            ) : (
              <Image source={{ uri: item.mediaUrl }} style={styles.messageImage} />
            )
          ) : (
            <Text style={styles.messageText}>{item.text}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };


  return (
    <View style={styles.container}>
      {/* Хедър – бутоните са позиционирани по-горе */}
      <View style={[styles.header, { paddingTop: 40 }]}>
        <TouchableOpacity onPress={toggleMenu} style={{ marginLeft: 10 }}>
          <Ionicons
            name="menu"
            size={24}
            color="white"
            style={{ transform: [{ rotate: `${menuRotation}deg` }] }}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: 20 }]} numberOfLines={1}>
          Guest Chat - {groupName}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Main')} style={{ marginRight: 15 }}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {menuVisible && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.menuItem}>
            <Ionicons name="person-circle-outline" size={24} color="white" />
            <Text style={styles.menuText}>Профил</Text>
          </TouchableOpacity>
          {isMember && (
            <TouchableOpacity onPress={() => navigation.navigate('ChatScreen', { groupId, groupName })} style={styles.menuItem}>
              <Ionicons name="chatbubble" size={24} color="white" />
              <Text style={styles.menuText}>Главен чат</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => Alert.alert('Новини и известия ще бъдат добавени скоро!')} style={styles.menuItem}>
            <Ionicons name="notifications" size={24} color="white" />
            <Text style={styles.menuText}>Новини и известия</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Каналът за покупко-продажба ще бъде добавен скоро!')} style={styles.menuItem}>
            <Ionicons name="cart" size={24} color="white" />
            <Text style={styles.menuText}>Канал за покупко-продажба</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Каналът за загубени/намерени кучета ще бъде добавен скоро!')} style={styles.menuItem}>
            <Ionicons name="search" size={24} color="white" />
            <Text style={styles.menuText}>Канал за загубени/намерени кучета</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('EventsScreen', { groupId, groupName })} style={styles.menuItem}>
            <Ionicons name="calendar" size={24} color="white" />
            <Text style={styles.menuText}>Канал за събития</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={leaveGroup} style={[styles.menuItem, { backgroundColor: 'red' }]}>
            <Ionicons name="log-out" size={24} color="white" />
            <Text style={styles.menuText}>Напусни групата</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
      />

      {/* Показване на OptionsModal при задържане на съобщение */}
      {optionsModalVisible && (
        <OptionsModal
          visible={optionsModalVisible}
          message={selectedMessage}
          onClose={() => {
            setOptionsModalVisible(false);
            setSelectedMessage(null);
          }}
        />
      )}

      {/* Input контейнер – включва и функционалност за гласово съобщение */}
      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={() => uploadMedia(true)}>
          <Ionicons name="image" size={30} color="black" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => uploadMedia(false)}>
          <Ionicons name="camera" size={30} color="black" />
        </TouchableOpacity>

        <TouchableOpacity onPress={recording ? stopRecording : startRecording}>
          <Ionicons name={recording ? "stop-circle" : "mic"} size={30} color="black" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Напишете съобщение..."
          value={newMessage}
          onChangeText={setNewMessage}
        />

        <TouchableOpacity onPress={sendMessage}>
          <Ionicons name="send" size={30} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

GuestChatScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      groupId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      groupName: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    replace: PropTypes.func.isRequired,
  }).isRequired,
};

export default GuestChatScreen;
