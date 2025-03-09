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
  const [userRoles, setUserRoles] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [timestampsVisible, setTimestampsVisible] = useState({});
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [fullScreenMedia, setFullScreenMedia] = useState({ url: null, type: null });
  const [scrollOffset, setScrollOffset] = useState(0);
  const [disableAutoScroll, setDisableAutoScroll] = useState(false);
  const flatListRef = useRef(null); // Референция за FlatList за автоматично скролване
  const userId = getAuth().currentUser.uid; // Получаване на текущия потребител от Firebase Authentication

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
    setShouldAutoScroll(false); // НЕ искаме да скролваме
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

    return () => unsubscribeUsers(); // Премахване на слушателя при напускане на компонента
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
    const isMyMessage = item.userId === userId;
    const profilePicture = profilePictures[item.userId];
    const isLastMessageOfBlock =
      index === messages.length - 1 || messages[index + 1]?.userId !== item.userId;
  
    // Ако имаме активен fullScreenVisible
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
        {/* Контейнерът на съобщението (с 5px разстояние) */}
        <View
          style={[
            styles.messageContainer,
            isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
          ]}
        >
          {/* Профилна снимка (ако е последното съобщение от този потребител и не е наше) */}
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
  
          {/* Съдържанието на съобщението */}
          {item.mediaType === 'audio' && item.mediaUrl ? (
            // --- АУДИО ---
            <TouchableOpacity
              onLongPress={() => handleLongPress(item.id)}
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
            // --- ВИДЕО ---
            <TouchableOpacity
              onPress={() => openFullScreenMedia(item.mediaUrl, 'videos')}
              onLongPress={() => handleLongPress(item.id)}
              style={[
                styles.messageMediaContainer,
                !isMyMessage && { marginLeft: 40 } // добавя отстояние за чужди съобщения
              ]}
            >
              <Video
                source={{ uri: item.mediaUrl }}
                style={styles.messageVideo}
                resizeMode="contain"
                useNativeControls
              />
            </TouchableOpacity>
          ) : item.mediaUrl ? (
            // --- ИЗОБРАЖЕНИЕ ---
            <TouchableOpacity
              onPress={() => openFullScreenMedia(item.mediaUrl, 'image')}
              onLongPress={() => handleLongPress(item.id)}
              style={[
                styles.messageMediaContainer,
                !isMyMessage && { marginLeft: 40 } // добавя отстояние за чужди съобщения
              ]}
            >
              <Image
                source={{ uri: item.mediaUrl }}
                style={styles.messageImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ) : (
            // --- ТЕКСТ ---
            <TouchableOpacity
              onPress={() => toggleTimestamp(item.id)}
              onLongPress={() => handleLongPress(item.id)}
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
  
        {/* Модал за профилната снимка при клик (ако не е наш userId) */}
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
              if (!groupId || typeof groupId !== "string") {
                console.error("❌ Грешка: groupId не е валиден", groupId);
                Alert.alert("Грешка", "Групата не може да бъде намерена.");
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
                let isMember = currentRoles.includes("member");
                let isGuestInGroup = currentRoles.includes(`guest{${groupName}}`);

                if (isGuestInGroup) {
                  // 🟢 Ако напуска като гост, премахваме само тази гост-роля
                  updatedRoles = currentRoles.filter(role => role !== `guest{${groupName}}`);
                } else if (isMember) {
                  // 🔴 Ако напуска като член, премахваме всички роли освен "hunter" и запазваме guest{} ролите
                  updatedRoles = currentRoles.filter(role => role.startsWith("guest{"));
                  updatedRoles.push("hunter"); // Винаги да има hunter
                }

                // Обновяваме списъка с групи, ако не е член на никоя друга
                const updatedGroups = userData.groups ? userData.groups.filter(group => group !== groupId) : [];

                // ✅ Обновяване на `users/{userId}`
                const groupSnap = await getDoc(groupRef);

                // ✅ Проверяваме дали `groupRef` съществува, преди да правим `updateDoc()`
                if (groupSnap.exists()) {
                  await updateDoc(groupRef, {
                    members: arrayRemove(userId)
                  });
                } else {
                  console.warn("⚠ Групата не съществува, пропускаме update");
                }
                // ❌ Изтриваме потребителя от `groups/{groupId}/members/{userId}`
                await deleteDoc(memberRef);

                await updateDoc(userRef, {
                  roles: updatedRoles,
                  groups: updatedGroups,
                });

                // Обновяваме UI
                setUserRoles(updatedRoles);
              }

              // 📌 Връщаме се към MainView
              navigation.replace('Main', { refresh: true });

            } catch (error) {
              console.error("❌ Грешка при напускане на групата:", error);
              Alert.alert("Грешка", "Неуспешно напускане на групата.");
            }
          },
        },
      ]
    );
};


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Бургер меню вляво */}
        <TouchableOpacity onPress={toggleMenu} style={styles.headerIcon}>
          <Ionicons 
            name="menu" 
            size={28} 
            color="white" 
            style={{ transform: [{ rotate: `${menuRotation}deg` }] }}
          />
        </TouchableOpacity>

        {/* Име на групата - центрирано и по-голямо */}
        <TouchableOpacity 
          onPress={() => navigation.navigate("GroupOverview", { groupId, groupName })}
          style={styles.headerTitleContainer}
        >
          <Text style={styles.headerTitle}>{groupName}</Text>
        </TouchableOpacity>

        {/* Бутон за връщане (arrow) вдясно */}
        <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {menuVisible && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.menuItem}>
            <Ionicons name="person-circle-outline" size={24} color="white" />
            <Text style={styles.menuText}>Профил</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('GuestChatScreen', { groupId, groupName })} style={styles.menuItem}>
            <Ionicons name="people" size={24} color="white" />
            <Text style={styles.menuText}>Чат с гости</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => Alert.alert('Notifications feature coming soon!')} style={styles.menuItem}>
            <Ionicons name="notifications" size={24} color="white" />
            <Text style={styles.menuText}>Новини и известия</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => Alert.alert('Marketplace feature coming soon!')} style={styles.menuItem}>
            <Ionicons name="cart" size={24} color="white" />
            <Text style={styles.menuText}>Канал за покупко-продажба</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => Alert.alert('Lost & Found feature coming soon!')} style={styles.menuItem}>
            <Ionicons name="search" size={24} color="white" />
            <Text style={styles.menuText}>Канал за загубени/намерени кучета</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('EventsScreen', { groupId, groupName })} style={styles.menuItem}>
            <Ionicons name="calendar" size={24} color="white" />
            <Text style={styles.menuText}>Канал за събития</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={uploadMediaFromGallery} style={styles.menuItem}>
            <Ionicons name="images" size={24} color="white" />
            <Text style={styles.menuText}>Галерия</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={takeMediaWithCamera} style={styles.menuItem}>
            <Ionicons name="camera" size={24} color="white" />
            <Text style={styles.menuText}>Камера</Text>
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
          // Запазване на текущия offset
          setScrollOffset(contentOffset.y);
          // Ако сме на 50px от дъното, активираме auto scroll
          if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 50) {
            setShouldAutoScroll(true);
          } else {
            setShouldAutoScroll(false);
          }
        }}
        scrollEventThrottle={16}
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
    replace: PropTypes.func.isRequired,
  }).isRequired,
};

export default ChatScreen;
