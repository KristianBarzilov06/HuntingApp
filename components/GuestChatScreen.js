import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDoc, arrayRemove } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { Audio, Video } from 'expo-av';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore } from '../firebaseConfig';
import styles from '../src/styles/ChatStyles';
import PropTypes from 'prop-types';

const GuestChatScreen = ({ route, navigation  }) => {
    const { groupId, groupName } = route.params;
    const userId = getAuth().currentUser.uid;
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [profilePictures, setProfilePictures] = useState({});
    const [playingMessageId, setPlayingMessageId] = useState(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuRotation, setMenuRotation] = useState(0);
    const [isMember, setIsMember] = useState(false); // Нов state за определяне дали потребителят е член
    const flatListRef = useRef(null);

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

    // Извличаме данните на потребителя, за да определим дали е гост или член
    useEffect(() => {
      const fetchUserData = async () => {
        try {
          const userRef = doc(firestore, `users/${userId}`);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            // Ако в ролите има "guest{groupName}", потребителят е гост, в противен случай – член
            const isGuest = userData.roles?.includes(`guest{${groupName}}`);
            setIsMember(!isGuest);
          }
        } catch (error) {
          console.error("Грешка при зареждане на данните на потребителя:", error);
        }
      };

      fetchUserData();
    }, [userId, groupName]);

    const sendMessage = async () => {
      if (newMessage.trim() === '') return;
      const messageData = {
        text: newMessage,
        timestamp: new Date(),
        userId: userId,
      };
      try {
          await addDoc(collection(firestore, `groups/${groupId}/guest_chat_messages`), messageData);
          console.log("✅ Съобщението е записано успешно!");
          setNewMessage('');
      } catch (error) {
          console.error("❌ Грешка при изпращане на съобщението:", error);
          Alert.alert("Грешка", "Неуспешно изпращане на съобщението.");
      }
    };

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
        console.error("❌ Грешка при възпроизвеждане на аудио:", error);
      }
    };

    const toggleMenu = () => {
      setMenuVisible(prev => !prev);
      setMenuRotation(prev => (prev === 0 ? 90 : 0));
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
                const userRef = doc(firestore, `users/${userId}`);
                const memberRef = doc(firestore, `groups/${groupId}/members/${userId}`);
                const groupRef = doc(firestore, `groups/${groupId}`);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                  const userData = userSnap.data();
                  let updatedRoles = [...userData.roles];
                  let isGuestInGroup = updatedRoles.includes(`guest{${groupName}}`);
                  if (isGuestInGroup) {
                    updatedRoles = updatedRoles.filter(role => role !== `guest{${groupName}}`);
                  } else {
                    updatedRoles = updatedRoles.filter(role => role.startsWith("guest{"));
                    updatedRoles.push("hunter");
                  }
                  const updatedGroups = userData.groups ? userData.groups.filter(g => g !== groupId) : [];
                  await updateDoc(userRef, {
                    roles: updatedRoles,
                    groups: updatedGroups,
                  });
                  await deleteDoc(memberRef);
                  await updateDoc(groupRef, { members: arrayRemove(userId) });
                  navigation.replace('Main', { refresh: true });
                }
              } catch (error) {
                console.error("❌ Грешка при напускане на групата:", error);
                Alert.alert("Грешка", "Неуспешно напускане на групата.");
              }
            },
          },
        ]
      );
    };

    const renderMessage = ({ item }) => {
      const isMyMessage = item.userId === userId;
      const profilePicture = profilePictures[item.userId];
      return (
          <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
            <TouchableOpacity style={styles.profileIconContainer} activeOpacity={0.7}>
              {profilePicture ? (
                <Image source={{ uri: profilePicture }} style={styles.profileIcon} />
              ) : (
                <Ionicons name="person-circle-outline" size={30} color="black" />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.messageContent, isMyMessage ? styles.myMessage : styles.otherMessage]}>
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
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleMenu} style={{ marginTop: 30 }}>
            <Ionicons 
              name="menu" 
              size={24} 
              color="white" 
              style={{ transform: [{ rotate: `${menuRotation}deg` }] }} 
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Чат с гости - {groupName}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Main')} style={{ marginLeft: 'auto', marginRight: 15, marginTop: 30 }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {menuVisible && (
          <View style={styles.dropdownMenu}>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.menuItem}>
                <Ionicons name="person-circle-outline" size={24} color="white" />
                <Text style={styles.menuText}>Профил</Text>
              </TouchableOpacity>

              {/* Нов канал за главния чат, който се показва само ако потребителят е член */}
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

        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={() => uploadMedia(true)}>
            <Ionicons name="image" size={30} color="black" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => uploadMedia(false)}>
            <Ionicons name="camera" size={30} color="black" />
          </TouchableOpacity>

          <TextInput style={styles.input} placeholder="Напишете съобщение..." value={newMessage} onChangeText={setNewMessage} />

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
