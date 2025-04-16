import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import PropTypes from 'prop-types';
import styles from '../src/styles/MarketplaceStyles';
import { getAuth } from 'firebase/auth';
import { firestore } from '../firebaseConfig';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Ionicons } from '@expo/vector-icons';

// Помощна функция – гарантира, че работим с масив
const getUploadedImages = (images) => {
  if (Array.isArray(images)) {
    return images;
  } else if (typeof images === 'string' && images.length > 0) {
    return [images];
  }
  return [];
};

// Функция за извличане на разговорите от Firestore
const fetchConversations = async (userId) => {
  try {
    const convosRef = collection(firestore, 'marketplaceConversations');
    const q = query(convosRef, where('participants', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    const convos = [];
    querySnapshot.forEach((docSnap) => {
      convos.push({ ...docSnap.data(), id: docSnap.id });
    });
    return convos;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
};

const Marketplace = ({ navigation }) => {
  // Основни state
  const [category, setCategory] = useState('dogs');
  const [dogs, setDogs] = useState([]);
  const [weapons, setWeapons] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [adTitle, setAdTitle] = useState('');
  const [articleName, setArticleName] = useState('');
  const [description, setDescription] = useState('');
  const [ads, setAds] = useState([]);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortMode, setSortMode] = useState({ method: 'date', order: 'asc' });
  const [userData, setUserData] = useState({});
  const auth = getAuth();
  const userId = auth.currentUser.uid;
  const [isEditing, setIsEditing] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [priceInput, setPriceInput] = useState('');
  const [priceType, setPriceType] = useState('fixed');
  // uploadedImages – поддържа множество снимки като масив
  const [uploadedImages, setUploadedImages] = useState([]);
  const [chatListVisible, setChatListVisible] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Нови state‑променливи за пълноекранната галерия
  const [galleryImages, setGalleryImages] = useState([]);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const scrollViewRef = useRef();

  // Функция за зареждане на обявите
  const fetchAds = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, 'marketplace'));
      const loadedAds = [];
      querySnapshot.forEach((docSnap) => {
        if (docSnap.exists()) {
          loadedAds.push({ ...docSnap.data(), id: docSnap.id });
        }
      });
      setAds(loadedAds);
    } catch (error) {
      console.error('Error fetching ads:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAds();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAds();
  }, []);

  // Зареждане на потребителските данни
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRef = doc(firestore, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          let groupName = '';
          if (Array.isArray(data.groups) && data.groups.length > 0) {
            const groupId = data.groups[0];
            const groupRef = doc(firestore, 'groups', groupId);
            const groupSnap = await getDoc(groupRef);
            if (groupSnap.exists()) {
              const groupData = groupSnap.data();
              groupName = groupData.name || '';
            }
          }
          data.groupName = groupName;
          setDogs(data.dogs || []);
          setWeapons(data.equipment || []);
          setUserData(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, [userId]);

  useEffect(() => {
    if (selectedItem && (category === 'dogs' || category === 'weapons')) {
      setArticleName(selectedItem.dogName || selectedItem.name || '');
    }
  }, [selectedItem, category]);

  // Зареждане на разговорите
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const convos = await fetchConversations(userId);
        setConversations(convos);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };
    loadConversations();
  }, [userId]);

  // Функция за качване на снимка
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Необходим достъп', 'Моля, дайте достъп до галерията.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      const firebaseURL = await uploadAdImage(imageUri, userId);
      if (firebaseURL) {
        setUploadedImages(prev => [...prev, firebaseURL]);
      } else {
        Alert.alert('Грешка', 'Неуспешно качване на изображението. Моля, опитайте отново.');
      }
    }
  };

  const uploadAdImage = async (imageUri, userId) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const storage = getStorage();
      const timestamp = new Date().getTime();
      const imageRef = ref(storage, `marketplaceAds/${userId}_${timestamp}`);
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const parsePriceInput = (input) => {
    const trimmed = input.trim();
    if (!trimmed) return 0;
    if (trimmed.includes('.') || trimmed.includes(',')) {
      return Math.round(parseFloat(trimmed.replace(',', '.')) * 100);
    } else {
      const leva = parseInt(trimmed, 10);
      return isNaN(leva) ? 0 : leva * 100;
    }
  };

  // Функция за премахване на снимка
  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((img, i) => i !== index));
  };

  const handleEditAd = (ad) => {
    setEditingAd(ad);
    setIsEditing(true);
    setCategory(ad.category || 'dogs');
    setAdTitle(ad.adTitle || '');
    setDescription(ad.description || '');
    setArticleName(ad.articleName || '');
    const priceLeva = (ad.price || 0) / 100;
    const priceStr = priceLeva.toString().replace('.', ',');
    setPriceInput(priceStr);
    setPriceType(ad.priceType || 'fixed');
    setUploadedImages(getUploadedImages(ad.uploadedImages));
    if (ad.selectedItem) {
      setSelectedItem(ad.selectedItem);
    } else {
      setSelectedItem(null);
    }
    setModalVisible(true);
  };

  const handleSaveChanges = async () => {
    if (!editingAd) return;
    const docRef = doc(firestore, 'marketplace', editingAd.id);
    const priceInCents = parsePriceInput(priceInput);
    const updatedAd = {
      ...editingAd,
      category,
      adTitle,
      description,
      articleName,
      price: priceInCents,
      uploadedImages,
      selectedItem,
    };
    try {
      await updateDoc(docRef, updatedAd);
      const newAds = ads.map((item) =>
        item.id === editingAd.id ? { ...updatedAd } : item
      );
      setAds(newAds);
      Alert.alert('Успешно', 'Обявата е обновена.');
    } catch (error) {
      Alert.alert('Грешка', 'Неуспешна редакция на обявата.');
      console.error('Error updating ad:', error);
    }
    setModalVisible(false);
    setIsEditing(false);
    setEditingAd(null);
  };

  const handleDeleteAd = async () => {
    if (!editingAd) return;
    Alert.alert(
      'Изтриване',
      'Сигурни ли сте, че искате да изтриете обявата?',
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Да, изтрий',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(firestore, 'marketplace', editingAd.id));
              setAds(ads.filter((item) => item.id !== editingAd.id));
              Alert.alert('Успешно', 'Обявата е изтрита.');
              setModalVisible(false);
              setIsEditing(false);
              setEditingAd(null);
            } catch (error) {
              Alert.alert('Грешка', 'Неуспешно изтриване на обявата.');
              console.error('Error deleting ad:', error);
            }
          }
        },
      ]
    );
  };

  const handleCreateAd = async () => {
    if (!adTitle.trim()) {
      Alert.alert('Грешка', 'Моля въведете заглавие на обявата.');
      return;
    }
    if ((category === 'dogs' || category === 'weapons') && !selectedItem) {
      Alert.alert('Грешка', 'Моля изберете обект от профила си.');
      return;
    }
    if (!articleName.trim() || !priceInput.trim() || !description.trim()) {
      Alert.alert('Грешка', 'Моля попълнете всички полета.');
      return;
    }
    if (category === 'dogs' && selectedItem && selectedItem !== 'other') {
        const duplicateAd = ads.find((ad) =>
          ad.category === 'dogs' &&
          ad.selectedItem &&
          ad.selectedItem.id === selectedItem.id &&
          ad.userId === userId
        );
        if (duplicateAd) {
          Alert.alert('Грешка', 'Вие вече имате обява за това куче. Моля, изберете друго куче.');
          return;
        }
      }
    const priceInCents = parsePriceInput(priceInput);
    const newAd = {
      id: new Date().toISOString(),
      category,
      adTitle,
      description,
      price: priceInCents,
      selectedItem,
      uploadedImages, // Записваме масива от снимки
      userId,
      userName: userData.firstName && userData.lastName
        ? `${userData.firstName} ${userData.lastName}`
        : 'Потребител',
      userPhone: userData.phone || '',
      userOrganization: userData.groupName || '',
      userProfilePhoto: userData.profilePicture || null,
      articleName,
      creationDate: new Date().toISOString(),
    };
    try {
      const docRef = await addDoc(collection(firestore, 'marketplace'), newAd);
      newAd.id = docRef.id;
      setAds([...ads, newAd]);
      Alert.alert('Успешно', 'Обявата е публикувана.');
    } catch (error) {
      Alert.alert('Грешка', 'Неуспешно публикуване на обявата.');
      console.error('Error publishing ad:', error);
    }
    setModalVisible(false);
  };

  const handleSubmit = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (isEditing) {
        await handleSaveChanges();
      } else {
        await handleCreateAd();
      }
    } catch (error) {
      console.error("Грешка при запис:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const sortedAds = [...ads].sort((a, b) => {
    if (sortMode.method === 'date') {
      return sortMode.order === 'asc'
        ? new Date(a.creationDate) - new Date(b.creationDate)
        : new Date(b.creationDate) - new Date(a.creationDate);
    } else if (sortMode.method === 'price') {
      return sortMode.order === 'asc' ? a.price - b.price : b.price - a.price;
    }
    return 0;
  });

  const handleSortMethod = (method) => {
    setSortMode((prev) => ({ ...prev, method }));
    setSortMenuVisible(false);
  };

  const handleSortOrder = (order) => {
    setSortMode((prev) => ({ ...prev, order }));
    setSortMenuVisible(false);
  };

  const isSelectedMethod = (method) => sortMode.method === method;
  const isSelectedOrder = (order) => sortMode.order === order;

  const formatPrice = (priceInCents, priceType) => {
    if (priceType === 'free') return 'Безплатно';
    if (priceType === 'negotiable') return 'По договаряне';
    const num = priceInCents / 100;
    return num.toFixed(2).replace('.', ',') + ' лв.';
  };

  const openGallery = (images, index) => {
    setGalleryImages(images);
    setCurrentGalleryIndex(index);
    setFullScreenVisible(true);
  };

  const onGalleryScrollEnd = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const width = Dimensions.get('window').width;
    const index = Math.floor(offsetX / width);
    setCurrentGalleryIndex(index);
  };

  const closeGallery = () => {
    setFullScreenVisible(false);
    setGalleryImages([]);
    setCurrentGalleryIndex(0);
  };

  // Функция за отваряне на чат между потребителя и продавача
  const openChatForAd = async (ad) => {
    if (ad.userId !== userId) {
      try {
        const convosRef = collection(firestore, 'marketplaceConversations');
        const q = query(convosRef, where('adId', '==', ad.id));
        const querySnapshot = await getDocs(q);
        let conversation = null;
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (
            data.participants &&
            data.participants.includes(userId) &&
            data.participants.includes(ad.userId)
          ) {
            conversation = { id: docSnap.id, ...data };
          }
        });
        if (!conversation) {
          const newConversation = {
            adId: ad.id,
            adTitle: ad.adTitle,
            participants: [userId, ad.userId],
            sellerId: ad.userId,
            sellerFirstName: ad.sellerFirstName || (ad.userName ? ad.userName.split(' ')[0] : "Без"),
            sellerLastName: ad.sellerLastName || (ad.userName ? ad.userName.split(' ').slice(1).join(' ') : "име"),
            sellerProfilePhoto: ad.userProfilePhoto,
            buyerId: userId,
            buyerFirstName: userData?.firstName || "Без",
            buyerLastName: userData?.lastName || "",
            buyerProfilePhoto: userData?.profilePicture || null,
            createdAt: new Date(),
            adImage: (ad.uploadedImages && getUploadedImages(ad.uploadedImages).length > 0)
              ? getUploadedImages(ad.uploadedImages)[0]
              : null
          };
          const docRef = await addDoc(convosRef, newConversation);
          conversation = { id: docRef.id, ...newConversation };
        }
        navigation.navigate('MarketplaceChatScreenWrapper', {
          groupId: conversation.id,
          groupName: ad.adTitle,
          chatType: 'marketplace',
          adId: ad.id,
          sellerId: ad.userId,
          sellerFirstName: ad.sellerFirstName || (ad.userName ? ad.userName.split(' ')[0] : "Без"),
          sellerLastName: ad.sellerLastName || (ad.userName ? ad.userName.split(' ').slice(1).join(' ') : "име"),
          buyerId: conversation.buyerId || userId,
          buyerFirstName: conversation.buyerFirstName || userData?.firstName || "Без",
          adImage: conversation.adImage || ((ad.uploadedImages && getUploadedImages(ad.uploadedImages).length > 0)
            ? getUploadedImages(ad.uploadedImages)[0]
            : null),
          conversationId: conversation.id,
        });
      } catch (error) {
        console.error("Error creating or retrieving conversation:", error);
        Alert.alert("Грешка", "Неуспешно създаване на чат.");
      }
    } else {
      navigation.navigate('EditAdScreen', { adId: ad.id });
    }
  };

  const openChatListModal = () => {
    setChatListVisible(true);
  };

  const closeChatListModal = () => {
    setChatListVisible(false);
  };

  const deleteConversation = async (conversationId) => {
    try {
      await deleteDoc(doc(firestore, 'marketplaceConversations', conversationId));
      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
    } catch (error) {
      console.error("Error deleting conversation:", error);
      Alert.alert("Грешка", "Неуспешно изтриване на разговора.");
    }
  };

  const openChatFromList = (conversation) => {
    navigation.navigate('MarketplaceChatScreenWrapper', {
      groupId: conversation.id,
      groupName: conversation.adTitle,
      chatType: 'marketplace',
      conversationId: conversation.id,
      sellerId: conversation.sellerId,
      sellerFirstName: conversation.sellerFirstName,
      sellerLastName: conversation.sellerLastName,
      sellerProfilePhoto: conversation.sellerProfilePhoto,
      buyerId: conversation.buyerId,
      buyerFirstName: conversation.buyerFirstName,
      buyerLastName: conversation.buyerLastName,
      buyerProfilePhoto: conversation.buyerProfilePhoto,
      adImage: conversation.adImage
    });
    setChatListVisible(false);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 10 }}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Покупко-продажба</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={openChatListModal} style={{ marginRight: 10 }}>
            <Ionicons name="paper-plane" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSortMenuVisible(!sortMenuVisible)} style={{ marginRight: 10 }}>
            <Ionicons name="options" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Модал със списък от разговори */}
      <Modal
        visible={chatListVisible}
        transparent
        animationType="slide"
        onRequestClose={closeChatListModal}
      >
        <View style={styles.chatListModalContainer}>
          <Text style={styles.chatListModalTitle}>Вашите разговори</Text>
          <ScrollView>
            {conversations.map((conv) => {
              const isSellerUser = String(userId) === String(conv.sellerId);
              const displayPhoto = isSellerUser ? conv.buyerProfilePhoto : conv.sellerProfilePhoto;
              const displayName = isSellerUser
                ? `Купувач: ${conv.buyerFirstName || ""} ${conv.buyerLastName || ""}`.trim()
                : `Продавач: ${conv.sellerFirstName || ""} ${conv.sellerLastName || ""}`.trim();
              return (
                <View key={conv.id} style={styles.chatListItem}>
                  <View style={styles.chatListItemInfo}>
                    {displayPhoto ? (
                      <Image source={{ uri: displayPhoto }} style={styles.chatListProfilePhoto} />
                    ) : (
                      <Ionicons name="person-circle-outline" size={40} color="#999" />
                    )}
                    <View style={styles.chatListTextContainer}>
                      <Text style={styles.chatListAdTitle} numberOfLines={1}>
                        {conv.adTitle}
                      </Text>
                      <Text style={styles.chatListSellerName}>
                        {displayName}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity onPress={() => openChatFromList(conv)} style={styles.chatListOpenButton}>
                      <Ionicons name="chatbubbles" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteConversation(conv.id)} style={styles.chatListDeleteButton}>
                      <Ionicons name="trash" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
          <TouchableOpacity onPress={closeChatListModal} style={styles.chatListCloseButton}>
            <Text style={styles.chatListCloseButtonText}>Затвори</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Модал за сортиране */}
      {sortMenuVisible && (
        <View style={styles.sortMenuContainer}>
          <Text style={styles.sortMenuTitle}>Метод:</Text>
          <TouchableOpacity
            onPress={() => handleSortMethod('date')}
            style={[styles.sortMenuItem, isSelectedMethod('date') && styles.sortMenuItemSelected]}
          >
            <Text style={styles.sortMenuItemText}>По дата</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSortMethod('price')}
            style={[styles.sortMenuItem, isSelectedMethod('price') && styles.sortMenuItemSelected]}
          >
            <Text style={styles.sortMenuItemText}>По цена</Text>
          </TouchableOpacity>
          <Text style={styles.sortMenuTitle}>Ред:</Text>
          <TouchableOpacity
            onPress={() => handleSortOrder('asc')}
            style={[styles.sortMenuItem, isSelectedOrder('asc') && styles.sortMenuItemSelected]}
          >
            <Text style={styles.sortMenuItemText}>Възходящо</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSortOrder('desc')}
            style={[styles.sortMenuItem, isSelectedOrder('desc') && styles.sortMenuItemSelected]}
          >
            <Text style={styles.sortMenuItemText}>Низходящо</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Списък с обяви */}
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {sortedAds.length > 0 ? (
          sortedAds.map((ad) => {
            const formattedDate = new Date(ad.creationDate).toLocaleDateString('bg-BG');
            // Определяме масив с изображения за колажа
            let collage = getUploadedImages(ad.uploadedImages);
            if (collage.length === 0 && (ad.selectedItem?.dogPicture || ad.selectedItem?.image)) {
              collage = [ad.selectedItem.dogPicture || ad.selectedItem.image];
            }
            return (
              <View key={ad.id} style={styles.adCard}>
                {/* Горна лента */}
                <View style={styles.adHeader}>
                  <Text style={styles.adHeaderTitle}>{ad.adTitle}</Text>
                  <Text style={styles.adHeaderDate}>{formattedDate}</Text>
                </View>

                {/* Колаж за снимки:
                    Ако има повече от една снимка, се показва колаж, като главната снимка (collage[0]) не се повтаря в слайдъра */}
                {collage.length > 1 ? (
                  <View style={styles.collageContainer}>
                    <View style={styles.collageLeft}>
                      <TouchableOpacity onPress={() => openGallery(collage, 0)}>
                        <Image source={{ uri: collage[0] }} style={styles.collageBigImage} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.collageRight}>
                      <TouchableOpacity onPress={() => openGallery(collage, 1)} style={styles.collageSmallWrapper}>
                        <Image source={{ uri: collage[1] }} style={styles.collageSmallImage} />
                      </TouchableOpacity>
                      {collage.length > 2 && (
                        <TouchableOpacity onPress={() => openGallery(collage, 2)} style={styles.collageSmallWrapper}>
                          <Image source={{ uri: collage[2] }} style={styles.collageSmallImage} />
                          {collage.length > 3 && (
                            <View style={styles.collageOverlay}>
                              <Text style={styles.collageOverlayText}>+{collage.length - 3}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ) : collage.length === 1 ? (
                  <TouchableOpacity onPress={() => openGallery(collage, 0)}>
                    <View style={styles.collageContainerSingle}>
                      <Image source={{ uri: collage[0] }} style={styles.collageSingleImage} />
                    </View>
                  </TouchableOpacity>
                ) : null}

                {/* Пълноекранна галерия */}
                <Modal
                  visible={fullScreenVisible}
                  transparent
                  animationType="fade"
                  onRequestClose={closeGallery}
                >
                  <View style={styles.fullScreenContainer}>
                    <ScrollView
                      ref={scrollViewRef}
                      horizontal
                      pagingEnabled
                      onMomentumScrollEnd={onGalleryScrollEnd}
                      contentOffset={{ x: Dimensions.get('window').width * currentGalleryIndex, y: 0 }}
                      style={styles.fullScreenScroll}
                    >
                      {galleryImages.map((img, idx) => (
                        <Image key={idx} source={{ uri: img }} style={styles.fullScreenImage} resizeMode="contain" />
                      ))}
                    </ScrollView>
                    <TouchableOpacity onPress={closeGallery} style={styles.closeButton}>
                      <Ionicons name="close" size={36} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </Modal>

                {/* Детайли за обявата */}
                <View style={styles.adDetailsRow}>
                  <View style={styles.adDescriptionBox}>
                    <Text style={styles.adDescriptionTitle}>Описание:</Text>
                    <Text style={styles.adDescriptionText}>{ad.description}</Text>
                  </View>
                  <View style={styles.adInfoBox}>
                    {ad.category === 'dogs' && ad.selectedItem && (
                      <View style={styles.dogDetailsWrapper}>
                        <Text style={styles.detailTitle}>Данни за кучето:</Text>
                        <ScrollView style={styles.scrollableInfoContainer} nestedScrollEnabled={true} bounces={false}>
                          <Text style={styles.detailLabel}>Име: {ad.selectedItem.dogName}</Text>
                          <Text style={styles.detailLabel}>Порода: {ad.selectedItem.dogBreed}</Text>
                          <Text style={styles.detailLabel}>Цвят: {ad.selectedItem.dogColor}</Text>
                          <Text style={styles.detailLabel}>Пол: {ad.selectedItem.dogSex}</Text>
                          <Text style={styles.detailLabel}>
                            Дата на раждане: {new Date(ad.selectedItem.dogBirthDate).toLocaleDateString('bg-BG')}
                          </Text>
                          <Text style={styles.detailLabel}>
                            Паспорт: {ad.selectedItem.hasPassport ? 'Да' : 'Не'}
                          </Text>
                          <Text style={styles.detailLabel}>
                            Ваксинация: {ad.selectedItem.hasVaccination ? 'Да' : 'Не'}
                          </Text>
                          {ad.selectedItem.skills && (
                            <>
                              <Text style={styles.detailLabel}>Умения:</Text>
                              <Text style={styles.detailLabel}>
                                Лов на пернат дивеч: {ad.selectedItem.skills.birdHunting ? 'Да' : 'Не'}
                              </Text>
                              <Text style={styles.detailLabel}>
                                Лов на едър дивеч: {ad.selectedItem.skills.boarTracking ? 'Да' : 'Не'}
                              </Text>
                              <Text style={styles.detailLabel}>
                                Лов на дребен дивеч: {ad.selectedItem.skills.hareHunting ? 'Да' : 'Не'}
                              </Text>
                              <Text style={styles.detailLabel}>
                                Апортиране: {ad.selectedItem.skills.retrieving ? 'Да' : 'Не'}
                              </Text>
                            </>
                          )}
                        </ScrollView>
                      </View>
                    )}
                    {ad.category === 'weapons' && (
                      <>
                        {ad.selectedItem?.name ? <Text style={styles.adInfoLine}>Име: {ad.selectedItem.name}</Text> : null}
                        {ad.selectedItem?.model ? <Text style={styles.adInfoLine}>Модел: {ad.selectedItem.model}</Text> : null}
                      </>
                    )}
                    {ad.category === 'equipment' && ad.articleName && (
                      <Text style={styles.adInfoLine}>Артикул: {ad.articleName}</Text>
                    )}
                    <View style={styles.priceDisplayContainer}>
                      <Text style={styles.adPrice}>{formatPrice(ad.price, ad.priceType)}</Text>
                    </View>
                  </View>
                </View>

                {/* Footer – информация за потребителя и бутони */}
                <View style={styles.adFooter}>
                  <View style={styles.adUserInfo}>
                    {ad.userProfilePhoto ? (
                      <Image source={{ uri: ad.userProfilePhoto }} style={styles.adUserProfilePic} />
                    ) : (
                      <Ionicons name="person-circle-outline" size={40} color="#999" style={{ marginRight: 8 }} />
                    )}
                    <View style={styles.userNameContainer}>
                      <Text style={styles.adUserName} numberOfLines={1}>{ad.userName}</Text>
                      {ad.userOrganization ? (
                        <Text style={styles.adUserGroup} numberOfLines={1}>{ad.userOrganization}</Text>
                      ) : null}
                      {ad.userPhone ? (
                        <Text style={styles.adUserPhone}>Тел.номер: {ad.userPhone}</Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.adFooterRight}>
                    {ad.userId === userId ? (
                      <TouchableOpacity style={styles.adEditButton} onPress={() => handleEditAd(ad)}>
                        <Text style={styles.adEditButtonText} numberOfLines={1} ellipsizeMode="tail">
                          Редактирай обявата
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.adMessageButton} onPress={() => openChatForAd(ad)}>
                        <Text style={styles.adMessageButtonText} numberOfLines={1} ellipsizeMode="tail">
                          Изпращане на съобщение
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.noAdsText}>Няма публикувани обяви.</Text>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.createAdButton}
        onPress={() => {
          setAdTitle('');
          setDescription('');
          setPriceInput('');
          setArticleName('');
          setSelectedItem(null);
          setUploadedImages([]); // Ресет uploadedImages към празен масив
          setModalVisible(true);
          setIsEditing(false);
          setEditingAd(null);
        }}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Модал за създаване/редакция */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalCenteredView}>
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
              {isEditing ? (
                <Text style={styles.modalTitle}>Редакция на обява</Text>
              ) : (
                <Text style={styles.modalTitle}>Нова обява</Text>
              )}

              {/* Полета за попълване */}
              <View style={styles.categoryContainer}>
                <TouchableOpacity
                  onPress={() => setCategory('dogs')}
                  style={[styles.categoryButton, category === 'dogs' && styles.categoryButtonActive]}
                >
                  <Text style={styles.categoryText}>Кучета</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setCategory('weapons')}
                  style={[styles.categoryButton, category === 'weapons' && styles.categoryButtonActive]}
                >
                  <Text style={styles.categoryText}>Оръжия</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setCategory('equipment')}
                  style={[styles.categoryButton, category === 'equipment' && styles.categoryButtonActive]}
                >
                  <Text style={styles.categoryText}>Екипировка</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Заглавие на обявата:</Text>
              <TextInput
                style={styles.input}
                placeholder="Въведете заглавие на обявата"
                placeholderTextColor="#aaa"
                value={adTitle}
                onChangeText={setAdTitle}
              />

              {category === 'dogs' && (
                <>
                  <Text style={styles.label}>Избери куче от профила си:</Text>
                  {dogs.length > 0 ? (
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={
                          selectedItem
                            ? (selectedItem === 'other'
                                ? 'other'
                                : (selectedItem.id !== undefined ? selectedItem.id : dogs.indexOf(selectedItem)))
                            : ''
                        }
                        onValueChange={(itemValue) => {
                          if (itemValue === 'other') {
                            setSelectedItem('other');
                            setUploadedImages([]);
                          } else {
                            const dog = dogs.find((d, index) =>
                              d.id !== undefined ? d.id === itemValue : index === itemValue
                            );
                            setSelectedItem(dog);
                            if (dog && dog.dogPicture) {
                              setUploadedImages([dog.dogPicture]);
                            }
                          }
                        }}
                      >
                        <Picker.Item label="Избери куче" value="" />
                        <Picker.Item label="Друго куче" value="other" />
                        {dogs.map((dog, index) => (
                          <Picker.Item
                            key={dog.id !== undefined ? dog.id : index}
                            label={`${dog.dogName} (${dog.dogBreed})`}
                            value={dog.id !== undefined ? dog.id : index}
                          />
                        ))}
                      </Picker>
                    </View>
                  ) : (
                    <Text>Нямате добавени кучета в профила си.</Text>
                  )}
                </>
              )}

              {category === 'weapons' && (
                <>
                  <Text style={styles.label}>Избери оръжие от профила си:</Text>
                  {weapons.length > 0 ? (
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={selectedItem ? (selectedItem.id !== undefined ? selectedItem.id : weapons.indexOf(selectedItem)) : ''}
                        onValueChange={(itemValue) => {
                          const weapon = weapons.find((w, index) =>
                            w.id !== undefined ? w.id === itemValue : index === itemValue
                          );
                          setSelectedItem(weapon);
                        }}
                      >
                        <Picker.Item label="Избери оръжие" value="" />
                        {weapons.map((weapon, index) => (
                          <Picker.Item
                            key={weapon.id !== undefined ? weapon.id : index}
                            label={`${weapon.name} - ${weapon.model}`}
                            value={weapon.id !== undefined ? weapon.id : index}
                          />
                        ))}
                      </Picker>
                    </View>
                  ) : (
                    <Text>Нямате добавени оръжия в профила си.</Text>
                  )}
                </>
              )}

              {category === 'equipment' && (
                <Text style={styles.label}>
                  Въведете данни за екипировка/облекло (име, описание, цена и снимка).
                </Text>
              )}

              <Text style={styles.label}>Име на артикула:</Text>
              <TextInput
                style={styles.input}
                placeholder="Въведете име на артикула"
                placeholderTextColor="#aaa"
                value={articleName}
                onChangeText={setArticleName}
              />

              <Text style={styles.label}>Описание:</Text>
              <TextInput
                style={styles.input}
                placeholder="Въведете описание"
                placeholderTextColor="#aaa"
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <View style={styles.priceOptionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.priceOptionButton,
                    priceType === 'fixed' && styles.priceOptionButtonSelected,
                  ]}
                  onPress={() => setPriceType('fixed')}
                >
                  <Text style={styles.priceOptionText}>Фиксирана цена</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.priceOptionButton,
                    priceType === 'free' && styles.priceOptionButtonSelected,
                  ]}
                  onPress={() => {
                    setPriceType('free');
                    setPriceInput('');
                  }}
                >
                  <Text style={styles.priceOptionText}>Безплатно</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.priceOptionButton,
                    priceType === 'negotiable' && styles.priceOptionButtonSelected,
                  ]}
                  onPress={() => {
                    setPriceType('negotiable');
                    setPriceInput('');
                  }}
                >
                  <Text style={styles.priceOptionText}>По договаряне</Text>
                </TouchableOpacity>
              </View>

              {priceType === 'fixed' && (
                <View style={styles.priceContainer}>
                  <Text style={styles.label}>Цена:</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Въведете цена"
                    placeholderTextColor="#aaa"
                    value={priceInput}
                    onChangeText={setPriceInput}
                    keyboardType="numeric"
                  />
                </View>
              )}

              {/* Секция за визуализация на снимките в модала */}
              {uploadedImages.length > 0 && (
                <>
                  {/* Ако има само една снимка, тя се показва отделно */}
                  {uploadedImages.length === 1 && (
                    <View style={styles.mainImageContainer}>
                      <Image source={{ uri: uploadedImages[0] }} style={styles.mainImagePreview} />
                      <TouchableOpacity style={styles.removeButton} onPress={() => removeImage(0)}>
                        <Ionicons name="close-circle" size={24} color="red" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {/* Ако има повече от една, главната снимка се показва, а останалите в слайдър */}
                  {uploadedImages.length > 1 && (
                    <>
                      <View style={styles.mainImageContainer}>
                        <Image source={{ uri: uploadedImages[0] }} style={styles.mainImagePreview} />
                        <TouchableOpacity style={styles.removeButton} onPress={() => removeImage(0)}>
                          <Ionicons name="close-circle" size={24} color="red" />
                        </TouchableOpacity>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.uploadedImagesSlider}>
                        {uploadedImages.slice(1).map((imgURL, idx) => (
                          <View key={idx} style={styles.extraImageContainer}>
                            <TouchableOpacity onPress={() => openGallery(uploadedImages, idx + 1)}>
                              <Image source={{ uri: imgURL }} style={styles.extraImagePreview} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.removeButtonExtra} onPress={() => removeImage(idx + 1)}>
                              <Ionicons name="close-circle" size={20} color="red" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                    </>
                  )}
                </>
              )}

              <Text style={styles.label}>Качете снимка:</Text>
              <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
                <Text style={styles.imagePickerText}>
                  {uploadedImages.length > 0 ? 'Промени/Добави снимки' : 'Избери снимка'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                style={[styles.submitButton, isSaving && { opacity: 0.6 }]}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isEditing ? "Запази промените" : "Публикувай обявата"}
                  </Text>
                )}
              </TouchableOpacity>

              {isEditing && (
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: '#B22222' }]}
                  onPress={handleDeleteAd}
                >
                  <Text style={styles.cancelButtonText}>Изтрий обявата</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setIsEditing(false);
                  setEditingAd(null);
                }}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Отказ</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

Marketplace.propTypes = {
  navigation: PropTypes.object.isRequired,
};

export default Marketplace;
