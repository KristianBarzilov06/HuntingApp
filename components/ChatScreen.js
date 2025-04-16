import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PropTypes } from 'prop-types';
import styles from '../src/styles/ChatStyles';
import { firestore } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDoc, arrayRemove } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { Audio, Video } from 'expo-av';
import ProfileModal from '../components/ProfileModal';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

const ChatScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;
  const stringGroupId = String(groupId);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [profilePictures, setProfilePictures] = useState({});
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuRotation, setMenuRotation] = useState(0);
  const [recording, setRecording] = useState(null);
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const [userRoles, setUserRoles] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [timestampsVisible, setTimestampsVisible] = useState({});
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [fullScreenMedia, setFullScreenMedia] = useState({ url: null, type: null });
  const [scrollOffset, setScrollOffset] = useState(0);
  const [disableAutoScroll, setDisableAutoScroll] = useState(false);
  const flatListRef = useRef(null);
  const userId = getAuth().currentUser.uid;

  // Състояния за модалното меню с опции при задържане на собствено съобщение
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);

  useEffect(() => {
    if (route.params?.joined) {
      const sendJoinMessage = async () => {
        const displayName = getAuth().currentUser.displayName || "Потребител";
        const joinText = `${displayName} се присъедини в групата`;
        const messageData = {
          text: joinText,
          timestamp: new Date(),
          userId,
          systemMessage: true,
        };

        // Ако потребителят е гост – използваме колекцията guest_chat_messages, иначе messages
        const targetCollection = userRoles.includes(`guest{${groupName}}`)
          ? 'guest_chat_messages'
          : 'messages';

        await addDoc(collection(firestore, 'groups', stringGroupId, targetCollection), messageData);
      };

      sendJoinMessage();
    }
  }, [route.params?.joined, groupName, userRoles]);


  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!userId) return;
      const userRef = doc(firestore, `users/${userId}`);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUserRoles(userData.roles || []);
      }
    };
    fetchUserRoles();
  }, [userId]);

  // Зареждане на съобщенията в реално време
  useEffect(() => {
    const unsubscribeMessages = onSnapshot(
      collection(firestore, 'groups', stringGroupId, 'messages'),
      (snapshot) => {
        const loadedMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        })).sort((a, b) => a.timestamp - b.timestamp);
        setMessages(loadedMessages);
      },
      (error) => console.error("Error fetching messages:", error)
    );
    return () => unsubscribeMessages();
  }, [stringGroupId]);

  const toggleTimestamp = (messageId) => {
    setShouldAutoScroll(false);
    setTimestampsVisible(prev => ({
      ...prev,
      [messageId]: true
    }));
    setTimeout(() => {
      setTimestampsVisible(prev => ({
        ...prev,
        [messageId]: false
      }));
    }, 2000);
  };

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(firestore, 'users'), (snapshot) => {
      const updatedPictures = { ...profilePictures };
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

  const sendMessage = async () => {
    if (newMessage.trim() === '') return;
    setShouldAutoScroll(true);
    const messageData = {
      text: newMessage,
      timestamp: new Date(),
      userId: userId,
    };

    if (editingMessageId) {
      await updateDoc(doc(firestore, 'groups', stringGroupId, 'messages', editingMessageId), messageData);
      setEditingMessageId(null);
    } else {
      await addDoc(collection(firestore, 'groups', stringGroupId, 'messages'), messageData);
    }
    setNewMessage('');
  };

  const uploadMediaFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log("Permission granted:", permissionResult.granted);
    if (!permissionResult.granted) {
      Alert.alert('Нужно е разрешение', 'Моля, дайте разрешение за достъп до галерията.');
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.7,
    });
    console.log("Picker result:", pickerResult);
    if (!pickerResult.canceled) {
      const selectedMedia = pickerResult.assets && pickerResult.assets[0];
      if (selectedMedia?.uri) {
        console.log('Selected media URI:', selectedMedia.uri);
        const mediaType = selectedMedia.type === 'video' ? 'videos' : 'images';
        uploadToFirebaseStorage(selectedMedia.uri, mediaType);
      }
    } else {
      console.log('Media selection was cancelled.');
    }
  };

  const takeMediaWithCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Нужно е разрешение', 'Моля, дайте разрешение за използване на камерата.');
      return;
    }
    const cameraResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
      mediaTypes: ImagePicker.MediaTypeOptions.All,
    });
    if (!cameraResult.canceled) {
      const capturedMedia = cameraResult.assets && cameraResult.assets[0];
      if (capturedMedia?.uri) {
        const mediaType = capturedMedia.type === 'video' ? 'videos' : 'images';
        uploadToFirebaseStorage(capturedMedia.uri, mediaType);
      }
    }
  };

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
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setRecording(null);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    uploadToFirebaseStorage(uri, "audio");
  };

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
      console.error("Error playing audio:", error);
    }
  };

  const uploadToFirebaseStorage = async (uri, folder) => {
    try {
      console.log("📤 Uploading URI:", uri);
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileRef = ref(getStorage(), `${folder}/${Date.now()}.${folder === 'videos' ? 'mp4' : 'jpg'}`);
      const uploadRes = await uploadBytes(fileRef, blob);
      let downloadUrl = await getDownloadURL(fileRef);
      if (!downloadUrl || typeof downloadUrl !== "string") {
        console.error("❌ Invalid download URL from Firebase!");
        Alert.alert("Грешка", "Неуспешно качване, няма URL.");
        return;
      }
      await addDoc(collection(firestore, 'groups', stringGroupId, 'messages'), {
        text: '',
        mediaUrl: downloadUrl,
        mediaType: folder,
        filePath: uploadRes.metadata.fullPath,
        storagePath: uploadRes.metadata.fullPath,
        timestamp: new Date(),
        userId: userId,
      });
    } catch (error) {
      console.error("❌ Error uploading file:", error);
      Alert.alert("Грешка", "Неуспешно качване на файла.");
    }
  };

  // Функция за изтриване на съобщение и свързан файл (ако има такъв)
  const handleDelete = async (messageId) => {
    try {
      const messageDocRef = doc(firestore, 'groups', stringGroupId, 'messages', messageId);
      const messageDoc = await getDoc(messageDocRef);
      if (!messageDoc.exists()) {
        console.error("Message not found!");
        Alert.alert('Грешка', 'Съобщението не съществува.');
        return;
      }
      const messageData = messageDoc.data();
      await deleteDoc(messageDocRef);
      console.log("Message deleted from Firestore");
      if (messageData.storagePath && typeof messageData.storagePath === 'string') {
        const storageRef = ref(getStorage(), messageData.storagePath);
        console.log("Deleting file at:", messageData.storagePath);
        await deleteObject(storageRef);
        console.log("File deleted successfully from Firebase Storage");
      } else {
        console.log("No file attached to this message, skipping file deletion.");
      }
    } catch (error) {
      console.error("Error deleting message or file:", error.message);
      Alert.alert('Грешка', `Неуспешно изтриване: ${error.message}`);
    }
  };

  // Функция за копиране на текст
  const handleCopy = async (text) => {
    await Clipboard.setString(text);
  };

  // Функция за редакция
  const handleEdit = (message) => {
    setEditingMessageId(message.id);
    setNewMessage(message.text);
  };

  const handleDownload = async (url) => {
    try {
      const decodedUrl = decodeURIComponent(url);
      const filePart = decodedUrl.split('/').pop().split('?')[0];
      const dir = FileSystem.documentDirectory + 'images';
      const fileUri = `${dir}/${filePart}`;

      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }

      const { uri } = await FileSystem.downloadAsync(url, fileUri);

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Разрешение необходимо', 'Приложението се нуждае от достъп до галерията.');
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync("Дружинар", asset, false);
      Alert.alert("Изтегляне успешно", "Медията е запазена във вашата галерия.");
    } catch (error) {
      console.error("Error downloading media:", error);
      Alert.alert("Грешка", "Неуспешно изтегляне на медията.");
    }
  };

  // Функция за показване на персонализираното меню при задържане
  const handleLongPress = (message) => {
    setSelectedMessage(message);
    setOptionsModalVisible(true);
  };

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
                    <TouchableOpacity style={styles.optionButton} onPress={() => { handleEdit(message); onClose(); }}>
                      <Text style={styles.optionText}>Редакция</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.optionButton} onPress={() => { handleCopy(message.text); onClose(); }}>
                      <Text style={styles.optionText}>Копиране</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.optionButton} onPress={() => { handleDelete(message.id); onClose(); }}>
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
                <TouchableOpacity style={styles.optionButton} onPress={() => { handleDownload(message.mediaUrl); onClose(); }}>
                  <Text style={styles.optionText}>Изтегляне</Text>
                </TouchableOpacity>
                {isOwn && (
                  <TouchableOpacity style={styles.optionButton} onPress={() => { handleDelete(message.id); onClose(); }}>
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

  const openFullScreenMedia = (url, type) => {
    setFullScreenMedia({ url, type });
    setFullScreenVisible(true);
  };

  const closeFullScreenMedia = () => {
    setDisableAutoScroll(true);
    setFullScreenVisible(false);
    setFullScreenMedia({ url: null, type: null });
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: scrollOffset, animated: false });
      setDisableAutoScroll(false);
    }, 200);
  };

  const renderMessage = ({ item, index }) => {
    if (item.systemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }
    const isMyMessage = item.userId === userId;
    const profilePicture = profilePictures[item.userId];
    const isLastMessageOfBlock =
      index === messages.length - 1 || messages[index + 1]?.userId !== item.userId;

    if (fullScreenVisible && fullScreenMedia.url) {
      return (
        <Modal visible={true} transparent={true} onRequestClose={closeFullScreenMedia}>
          <View style={styles.fullScreenContainer}>
            {fullScreenMedia.type === 'videos' ? (
              <Video
                source={{ uri: fullScreenMedia.url }}
                style={styles.fullScreenVideo}
                useNativeControls
                resizeMode="contain"
                shouldPlay
              />
            ) : (
              <Image
                source={{ uri: fullScreenMedia.url }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity onPress={closeFullScreenMedia} style={styles.closeButton}>
              <Ionicons name="close" size={36} color="#fff" />
            </TouchableOpacity>
          </View>
        </Modal>
      );
    }

    return (
      <>
        <View
          style={[
            styles.messageContainer,
            isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
          ]}
        >
          {isLastMessageOfBlock && !isMyMessage && item.userId && (
            <TouchableOpacity
              onPress={() => {
                if (selectedUserId !== item.userId) {
                  setSelectedUserId(item.userId);
                  setModalVisible(true);
                }
              }}
              style={styles.profileIconContainer}
              activeOpacity={0.7}
            >
              {profilePicture ? (
                <Image source={{ uri: profilePicture }} style={styles.profileIcon} />
              ) : (
                <Ionicons name="person-circle-outline" size={30} color="black" />
              )}
            </TouchableOpacity>
          )}

          {item.mediaType === 'audio' && item.mediaUrl ? (
            <TouchableOpacity
              onLongPress={() => handleLongPress(item)}
              style={[styles.messageContent, isMyMessage ? styles.myMessage : styles.otherMessage]}
            >
              <TouchableOpacity onPress={() => playAudio(item.mediaUrl, item.id)}>
                <Ionicons
                  name={playingMessageId === item.id ? 'pause-circle' : 'play-circle'}
                  size={40}
                  color="black"
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ) : item.mediaType === 'videos' && item.mediaUrl ? (
            <TouchableOpacity
              onPress={() => openFullScreenMedia(item.mediaUrl, 'videos')}
              onLongPress={() => handleLongPress(item)}
              style={[styles.messageMediaContainer, !isMyMessage && { marginLeft: 40 }]}
            >
              <Video
                source={{ uri: item.mediaUrl }}
                style={styles.messageVideo}
                resizeMode="contain"
                useNativeControls
              />
            </TouchableOpacity>
          ) : item.mediaUrl ? (
            <TouchableOpacity
              onPress={() => openFullScreenMedia(item.mediaUrl, 'image')}
              onLongPress={() => handleLongPress(item)}
              style={[styles.messageMediaContainer, !isMyMessage && { marginLeft: 40 }]}
            >
              <Image
                source={{ uri: item.mediaUrl }}
                style={styles.messageImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => toggleTimestamp(item.id)}
              onLongPress={() => handleLongPress(item)}
              style={[styles.messageContent, isMyMessage ? styles.myMessage : styles.otherMessage]}
            >
              {timestampsVisible[item.id] && (
                <Text style={styles.timestamp}>
                  {new Date(item.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              )}
              <Text style={styles.messageText}>{item.text}</Text>
            </TouchableOpacity>
          )}
        </View>

        {modalVisible && selectedUserId && selectedUserId !== userId && (
          <ProfileModal
            userId={selectedUserId}
            visible={modalVisible}
            onClose={() => {
              setModalVisible(false);
              setSelectedUserId(null);
            }}
          />
        )}
      </>
    );
  };

  const toggleMenu = () => {
    setMenuVisible(prev => !prev);
    setMenuRotation(prev => (prev === 0 ? 90 : 0));
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const leaveGroup = async () => {
    try {
      if (!groupId || typeof groupId !== "string") {
        console.error("❌ Грешка: groupId не е валиден", groupId);
        return;
      }
      const userRef = doc(firestore, `users/${userId}`);
      const memberRef = doc(firestore, `groups/${groupId}/members/${userId}`);
      const groupRef = doc(firestore, `groups/${groupId}`);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentRoles = userData.roles || [];
        let updatedRoles = [...currentRoles];
        const isMember = currentRoles.includes("member");
        const isGuestInGroup = currentRoles.includes(`guest{${groupName}}`);
        if (isGuestInGroup) {
          updatedRoles = currentRoles.filter(role => role !== `guest{${groupName}}`);
        } else if (isMember) {
          updatedRoles = currentRoles.filter(role => role.startsWith("guest{"));
          updatedRoles.push("hunter");
        }
        const updatedGroups = userData.groups ? userData.groups.filter(group => group !== groupId) : [];
        const groupSnap = await getDoc(groupRef);
        if (!groupSnap.exists()) {
          return;
        }
        try {
          await updateDoc(groupRef, {
            members: arrayRemove(userId),
          });
          const leaveMessageData = {
            text: `${userData.firstName || 'Потребител'} ${userData.lastName || ''} напусна групата`,
            timestamp: new Date(),
            userId,
            systemMessage: true,
          };
          const targetCollection = isGuestInGroup ? 'guest_chat_messages' : 'messages';
          await addDoc(collection(firestore, 'groups', groupId, targetCollection), leaveMessageData);
        } catch (error) {
          console.error("Грешка при обработката на напускането на групата:", error);
        }
        await deleteDoc(memberRef);
        await updateDoc(userRef, {
          roles: updatedRoles,
          groups: updatedGroups,
        });
        setUserRoles(updatedRoles);
      } else {
        console.error("UserSnapshot не съществува");
      }
      navigation.replace('Main', { refresh: true });
    } catch (error) {
      console.error("❌ Грешка при напускане на групата:", error);
    }
  };

  const { hideHeader } = route.params || {};

  return (
    <View style={styles.container}>
      {!hideHeader && (
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleMenu} style={styles.headerIcon}>
            <Ionicons
              name="menu"
              size={28}
              color="white"
              style={{ transform: [{ rotate: `${menuRotation}deg` }] }}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("GroupOverview", { groupId, groupName })}
            style={styles.headerTitleContainer}
          >
            <Text style={styles.headerTitle}>{groupName}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.headerIcon}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {menuVisible && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile', { groupId })}
            style={styles.menuItem}
          >
            <Ionicons name="person-circle-outline" size={24} color="white" />
            <Text style={styles.menuText}>Профил</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('GuestChatScreen', { groupId, groupName })} style={styles.menuItem}>
            <Ionicons name="people" size={24} color="white" />
            <Text style={styles.menuText}>Чат с гости</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('NotificationsScreen', { groupId, groupName })} style={styles.menuItem}>
            <Ionicons name="notifications" size={24} color="white" />
            <Text style={styles.menuText}>Новини и известия</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Marketplace', { groupId, groupName })} style={styles.menuItem}>
            <Ionicons name="cart" size={24} color="white" />
            <Text style={styles.menuText}>Канал за покупко-продажба</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('LostDogsScreen')}>
            <Text style={styles.menuItem}>Загубени/Намерени кучета</Text>
          </TouchableOpacity>
          {userRoles.includes("chairman") && (
            <TouchableOpacity onPress={() => navigation.navigate('JoinRequestsScreen', { groupId, groupName })} style={styles.menuItem}>
              <Ionicons name="clipboard" size={24} color="white" />
              <Text style={styles.menuText}>Заявки</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigation.navigate('EventsScreen', { groupId, groupName })} style={styles.menuItem}>
            <Ionicons name="calendar" size={24} color="white" />
            <Text style={styles.menuText}>Канал за събития</Text>
          </TouchableOpacity>
          {userRoles.includes("admin") && (
            <>
              <TouchableOpacity onPress={() => navigation.navigate('AdminPanel')} style={styles.menuItem}>
                <Ionicons name="shield-checkmark" size={24} color="white" />
                <Text style={styles.menuText}>Admin Panel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.menuItem}>
                <Ionicons name="home" size={24} color="white" />
                <Text style={styles.menuText}>Обратно към Main</Text>
              </TouchableOpacity>
            </>
          )}
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
        style={styles.messageList}
        onContentSizeChange={() => {
          if (shouldAutoScroll && !disableAutoScroll) {
            scrollToBottom();
          }
        }}
        onScroll={(event) => {
          const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
          setScrollOffset(contentOffset.y);
          if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 50) {
            setShouldAutoScroll(true);
          } else {
            setShouldAutoScroll(false);
          }
        }}
        scrollEventThrottle={16}
      />

      {/* Модал за избор на опции при задържане */}
      <OptionsModal
        visible={optionsModalVisible}
        message={selectedMessage}
        onClose={() => { setOptionsModalVisible(false); setSelectedMessage(null); }}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={uploadMediaFromGallery}>
          <Ionicons name="image" size={30} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={takeMediaWithCamera}>
          <Ionicons name="camera" size={30} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={recording ? stopRecording : startRecording}>
          <Ionicons name={recording ? "stop-circle" : "mic"} size={30} color="black" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message"
          value={newMessage}
          onChangeText={setNewMessage}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity onPress={sendMessage}>
          <Ionicons name="send" size={30} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

ChatScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      groupId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      groupName: PropTypes.string.isRequired,
      hideHeader: PropTypes.bool,
      joined: PropTypes.bool,
    }).isRequired,
  }).isRequired,
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    replace: PropTypes.func.isRequired,
  }).isRequired,
};

export default ChatScreen;
