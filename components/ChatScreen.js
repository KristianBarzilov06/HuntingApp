import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../src/styles/ChatStyles';
import { firestore, storage } from '../firebaseConfig';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const ChatScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;
  const stringGroupId = String(groupId);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuRotation, setMenuRotation] = useState(0);
  const cameraRef = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    const requestPermissions = async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted' && galleryStatus.status === 'granted');
    };
    requestPermissions();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, 'groups', stringGroupId, 'messages'),
      (snapshot) => {
        const loadedMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })).sort((a, b) => a.timestamp - b.timestamp);
        setMessages(loadedMessages);
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      },
      (error) => {
        console.error("Error fetching messages:", error.code, error.message);
        Alert.alert("Error", "Failed to fetch messages: " + error.message);
      }
    );
    return () => unsubscribe();
  }, [stringGroupId]);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Function to send a message
  const sendMessage = async () => {
    if (newMessage.trim() === '' && !imageUri) return;

    try {
      const userId = getAuth().currentUser.uid;

      const messageData = {
        text: newMessage,
        timestamp: new Date(),
        userId: userId,
      };

      if (imageUri) {
        const imageUrl = await uploadImage(imageUri);
        messageData.imageUrl = imageUrl; // Добавяне на URL за изображение
        setImageUri(null); // Нулиране на imageUri след качването
      }

      await addDoc(collection(firestore, 'groups', stringGroupId, 'messages'), messageData);
      setNewMessage(''); // Нулиране на текста на съобщението
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    }
  };

  // Uploading image to Firebase storage
  const uploadImage = async (uri) => {
    if (!uri) {
      console.error('Invalid URI');
      throw new Error('Invalid URI');
    }

    try {
      const response = await fetch(uri);
      if (!response.ok) {
        console.error('Network response was not ok');
        throw new Error('Network response was not ok');
      }

      const blob = await response.blob();
      const imageRef = ref(storage, `images/${Date.now()}`);
      await uploadBytes(imageRef, blob);
      const imageUrl = await getDownloadURL(imageRef);
      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Picking an image from the gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri); // Запазване на URI на изображението
    }
  };

  // Taking a picture with the camera
  const takePicture = async () => {
    if (cameraRef.current && hasCameraPermission) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setImageUri(photo.uri);
        setCameraVisible(false);
      } catch (error) {
        console.error("Error taking picture:", error);
      }
    }
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.userId === getAuth().currentUser.uid;
    return (
      <View style={styles.messageContainer}>
        {!isMyMessage && (
          <View style={styles.iconContainer}>
            <Ionicons 
              name="person-circle-outline"
              size={30}
              color="black"
              style={styles.profileIcon}
            />
          </View>
        )}

        <View style={[styles.messageItem, isMyMessage ? styles.myMessage : styles.otherMessage]}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
          ) : (
            <Text style={styles.messageText}>{item.text}</Text>
          )}
        </View>

        {isMyMessage && (
          <View style={styles.iconContainer}>
            <Ionicons 
              name="person-circle-outline"
              size={30}
              color="black"
              style={styles.profileIcon}
            />
          </View>
        )}
      </View>
    );
  };

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
    setMenuRotation(prevRotation => (prevRotation === 0 ? 90 : 0));
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
          <TouchableOpacity onPress={() => Alert.alert('Group chat functionality coming soon!')}>
            <Text style={styles.menuItem}>Групов чат</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Gallery feature coming soon!')}>
            <Text style={styles.menuItem}>Галерия</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Notifications feature coming soon!')}>
            <Text style={styles.menuItem}>Известия</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Marketplace feature coming soon!')}>
            <Text style={styles.menuItem}>Канал за покупко-продажба</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Lost & Found feature coming soon!')}>
            <Text style={styles.menuItem}>Канал за загубени/намерени кучета</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Main')}>
            <Text style={styles.menuItem}>Обратно към Main</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messageList}
      />

      {cameraVisible && hasCameraPermission && (
        <Camera style={styles.camera} ref={cameraRef}>
          <View style={styles.cameraControls}>
            <TouchableOpacity onPress={() => setCameraVisible(false)}>
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={takePicture}>
              <Ionicons name="camera" size={30} color="white" />
            </TouchableOpacity>
          </View>
        </Camera>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={() => setCameraVisible(true)}>
          <Ionicons name="camera" size={30} color="black" />
        </TouchableOpacity>

        <TouchableOpacity onPress={pickImage}>
          <Ionicons name="image" size={30} color="black" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => Alert.alert('Voice message feature coming soon!')}>
          <Ionicons name="mic" size={30} color="black" />
        </TouchableOpacity>

        {imageUri && (
          <View style={styles.selectedImageContainer}>
            <Image source={{ uri: imageUri }} style={styles.selectedImage} />
            <TouchableOpacity onPress={() => setImageUri(null)}>
              <Ionicons name="close-circle" size={20} color="red" />
            </TouchableOpacity>
          </View>
        )}

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

export default ChatScreen;
