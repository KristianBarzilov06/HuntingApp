import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PropTypes } from 'prop-types';
import styles from '../src/styles/ChatStyles';
import { firestore } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { Audio, Video } from 'expo-av';
import ProfileModal from '../components/ProfileModal';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const ChatScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params; // Получаване на ID и име на групата от параметрите на навигацията
  const stringGroupId = String(groupId); // Уверяваме се, че ID е стринг за съвместимост
  const [messages, setMessages] = useState([]); // Съхраняване на списъка със съобщения
  const [newMessage, setNewMessage] = useState(''); // Съхраняване на текущо въведеното съобщение
  const [profilePictures, setProfilePictures] = useState({});
  const [editingMessageId, setEditingMessageId] = useState(null); // ID на съобщението, което се редактира
  const [menuVisible, setMenuVisible] = useState(false); // Състояние за видимост на менюто
  const [menuRotation, setMenuRotation] = useState(0); // Ротация за анимация на менюто
  const [recording, setRecording] = useState(null);
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [timestampsVisible, setTimestampsVisible] = useState({});
  const flatListRef = useRef(null); // Референция за FlatList за автоматично скролване
  const userId = getAuth().currentUser.uid; // Получаване на текущия потребител от Firebase Authentication

  useEffect(() => {
    const fetchUserRole = async () => {
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserRole(userSnap.data().role || "hunter"); // Ако няма роля, по подразбиране е "hunter"
      }
    };
    fetchUserRole();
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
    setTimestampsVisible((prev) => ({
      ...prev,
      [messageId]: true
    }));
    setTimeout(() => {
      setTimestampsVisible((prev) => ({
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

    return () => unsubscribeUsers(); // Премахване на слушателя при напускане на компонента
  }, []);

  const sendMessage = async () => {
    if (newMessage.trim() === '') return;

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
      mediaTypes: ImagePicker.MediaTypeOptions.All, // Позволяваме избор на снимки и видеа
      allowsEditing: true,
      quality: 0.7,
    });
  
    console.log("Picker result:", pickerResult); 
    if (!pickerResult.canceled) {
      const selectedMedia = pickerResult.assets && pickerResult.assets[0];
      if (selectedMedia?.uri) {
        console.log('Selected media URI:', selectedMedia.uri);
        const mediaType = selectedMedia.type === 'video' ? 'videos' : 'images'; // Определяме дали е снимка или видео
        uploadToFirebaseStorage(selectedMedia.uri, mediaType); // Качваме в Firebase
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
      mediaTypes: ImagePicker.MediaTypeOptions.All, // Позволяваме заснемане както на снимки, така и на видеа
    });
  
    if (!cameraResult.canceled) {
      const capturedMedia = cameraResult.assets && cameraResult.assets[0];
      if (capturedMedia?.uri) {
        const mediaType = capturedMedia.type === 'video' ? 'videos' : 'images'; // Определяме дали е снимка или видео
        uploadToFirebaseStorage(capturedMedia.uri, mediaType); // Качваме в Firebase
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
    uploadToFirebaseStorage(uri, "audio"); // Качваме аудиото във Firebase
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

  const handleLongPress = (messageId) => {
    const message = messages.find(msg => msg.id === messageId);
    if (message) {
      const options = [
        {
          text: "Copy",
          onPress: () => handleCopy(message.text),
        },
        { text: "Cancel", style: "cancel" },
      ];

      if (message.userId === userId) {
        options.splice(1, 0, {
          text: "Edit",
          onPress: () => handleEdit(message),
        });
        options.splice(2, 0, {
          text: "Delete",
          onPress: () => handleDelete(messageId),
        });
      }

      Alert.alert(
        "Select Action",
        "Choose an action",
        options
      );
    }
  };

  const handleCopy = async (text) => {
    await Clipboard.setString(text);
  };

  const handleEdit = (message) => {
    setEditingMessageId(message.id);
    setNewMessage(message.text);
  };

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

  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.userId === userId;
    const profilePicture = profilePictures[item.userId];
    const isLastMessageOfBlock = index === messages.length - 1 || messages[index + 1]?.userId !== item.userId;

    return (
      <>
        <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
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
          
          <TouchableOpacity 
            onLongPress={() => handleLongPress(item.id)}
            onPress={() => toggleTimestamp(item.id)}
            style={[styles.messageContent, isMyMessage ? styles.myMessage : styles.otherMessage]}
          >
            {timestampsVisible[item.id] && (
              <Text style={styles.timestamp}>
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
            {item.mediaType === "audio" && item.mediaUrl ? (
              <TouchableOpacity onPress={() => playAudio(item.mediaUrl, item.id)}>
                <Ionicons 
                  name={playingMessageId === item.id ? "pause-circle" : "play-circle"} 
                  size={40} 
                  color="black" 
                />
              </TouchableOpacity>
            ) : item.mediaType === "videos" && item.mediaUrl ? (
              <Video
                source={{ uri: item.mediaUrl }}
                style={styles.messageVideo}
                useNativeControls
                shouldPlay={false} 
                resizeMode="contain"
                isLooping={false}
              />
            ) : item.mediaUrl ? (
              <Image source={{ uri: item.mediaUrl }} style={styles.messageImage} />
            ) : (
              <Text style={styles.messageText}>{item.text}</Text>
            )}
          </TouchableOpacity>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={{ marginTop: 30 }}>
          <Ionicons 
            name="menu" 
            size={24} 
            color="white" 
            style={{ transform: [{ rotate: `${menuRotation}deg` }] }} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{groupName}</Text>
      </View>

      {menuVisible && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.menuItem}>Профил</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Guest group chat functionality coming soon!')}>
            <Text style={styles.menuItem}>Членове и гости</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Notifications feature coming soon!')}>
            <Text style={styles.menuItem}>Новини и известия</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Marketplace feature coming soon!')}>
            <Text style={styles.menuItem}>Канал за покупко-продажба</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Lost & Found feature coming soon!')}>
            <Text style={styles.menuItem}>Канал за загубени/намерени кучета</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('EventsScreen', { groupId, groupName })}>
            <Text style={styles.menuItem}>Канал за събития</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={uploadMediaFromGallery}>
            <Text style={styles.menuItem}>Галерия</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={takeMediaWithCamera}>
            <Text style={styles.menuItem}>Камера</Text>
          </TouchableOpacity>

          {userRole === "admin" && (
            <>
              <TouchableOpacity onPress={() => navigation.navigate('AdminPanel')}>
                <Text style={styles.menuItem}>AdminPanel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Main')}>
                <Text style={styles.menuItem}>Обратно към Main</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}


      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messageList}
        onContentSizeChange={scrollToBottom}
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
    }).isRequired,
  }).isRequired,
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

export default ChatScreen;
