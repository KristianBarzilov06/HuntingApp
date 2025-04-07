import React, { useState, useEffect, useCallback } from 'react';
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
    RefreshControl
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import PropTypes from 'prop-types';
import styles from '../src/styles/MarketplaceStyles';
import { getAuth } from 'firebase/auth';
import { firestore } from '../firebaseConfig';
import { doc, getDoc, collection, addDoc, getDocs, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

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
    const [category, setCategory] = useState('dogs');
    const [dogs, setDogs] = useState([]);
    const [weapons, setWeapons] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
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
    const [uploadedImage, setUploadedImage] = useState(null);
    // State за списък с разговори
    const [chatListVisible, setChatListVisible] = useState(false);
    const [conversations, setConversations] = useState([]);
    // State за pull-to-refresh
    const [refreshing, setRefreshing] = useState(false);

    // Зареждане на обявите
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

    // Функция за pull-to-refresh – презарежда обявите
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

    // Зареждане на разговорите от Firestore
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
            Alert.alert('Permission needed', 'Please grant access to your gallery.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });
        if (!result.canceled) {
            setUploadedImage(result.assets[0].uri);
        }
    };

    const parsePriceInput = (input) => {
        const trimmed = input.trim();
        if (!trimmed) {
            return 0;
        }
        if (trimmed.includes('.') || trimmed.includes(',')) {
            return Math.round(parseFloat(trimmed.replace(',', '.')) * 100);
        } else {
            const leva = parseInt(trimmed, 10);
            if (isNaN(leva)) {
                return 0;
            }
            return leva * 100;
        }
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
        setUploadedImage(ad.uploadedImage || null);
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
            uploadedImage,
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
                {
                    text: 'Отказ',
                    style: 'cancel',
                },
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
                    },
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
        const priceInCents = parsePriceInput(priceInput);
        const newAd = {
            id: new Date().toISOString(),
            category,
            adTitle,
            description,
            price: priceInCents,
            selectedItem,
            uploadedImage,
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

    const formatPrice = (priceInCents) => {
        const num = priceInCents / 100;
        return num.toFixed(2).replace('.', ',') + ' лв.';
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
                    if (data.participants && data.participants.includes(userId) && data.participants.includes(ad.userId)) {
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
                        buyerId: userId,
                        createdAt: new Date(),
                        adImage: ad.uploadedImage 
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
                    adImage: conversation.adImage || ad.uploadedImage,
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

    // Функция за отваряне на модал със списък от разговори
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
            sellerName: conversation.sellerFirstName,
        });
        setChatListVisible(false);
    };

    // Функция за отваряне на модал за цял екран със снимката
    const openFullScreen = (uri) => {
        setSelectedImage(uri);
        setFullScreenVisible(true);
    };

    const closeFullScreen = () => {
        setFullScreenVisible(false);
        setSelectedImage(null);
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
                        {conversations.map((conv) => (
                            <View key={conv.id} style={styles.chatListItem}>
                                <View style={styles.chatListItemInfo}>
                                    {conv.sellerProfilePhoto ? (
                                        <Image source={{ uri: conv.sellerProfilePhoto }} style={styles.chatListProfilePhoto} />
                                    ) : (
                                        <Ionicons name="person-circle-outline" size={40} color="#999" />
                                    )}
                                    <View style={styles.chatListTextContainer}>
                                        <Text style={styles.chatListAdTitle} numberOfLines={1}>
                                            {conv.adTitle}
                                        </Text>
                                        <Text style={styles.chatListSellerName}>
                                            {conv.sellerFirstName} {conv.sellerLastName}
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
                        ))}
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

            {/* Списък с обяви с pull-to-refresh */}
            <ScrollView
                contentContainerStyle={styles.container}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {sortedAds.length > 0 ? (
                    sortedAds.map((ad) => {
                        const formattedDate = new Date(ad.creationDate).toLocaleDateString('bg-BG');
                        const imageUri = ad.uploadedImage || ad.selectedItem?.dogPicture || ad.selectedItem?.image;
                        return (
                            <View key={ad.id} style={styles.adCard}>
                                {/* Горна лента */}
                                <View style={styles.adHeader}>
                                    <Text style={styles.adHeaderTitle}>{ad.adTitle}</Text>
                                    <Text style={styles.adHeaderDate}>{formattedDate}</Text>
                                </View>

                                {/* Снимка – натиснете за отваряне в модал за цял екран */}
                                <TouchableOpacity onPress={() => openFullScreen(imageUri)}>
                                    <View style={styles.adImageContainer}>
                                        {imageUri ? (
                                            <Image source={{ uri: imageUri }} style={styles.adImage} />
                                        ) : (
                                            <Text style={{ color: '#555' }}>Без снимка</Text>
                                        )}
                                    </View>
                                </TouchableOpacity>

                                {/* Модал за показване на снимката на цял екран */}
                                <Modal
                                    visible={fullScreenVisible}
                                    transparent
                                    animationType="fade"
                                    onRequestClose={closeFullScreen}
                                >
                                    <View style={styles.fullScreenContainer}>
                                        {selectedImage && (
                                            <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} resizeMode="contain" />
                                        )}
                                        <TouchableOpacity onPress={closeFullScreen} style={styles.closeButton}>
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
                                        {ad.category === 'dogs' && (
                                            <>
                                                {ad.selectedItem?.dogName ? <Text style={styles.adInfoLine}>Име: {ad.selectedItem.dogName}</Text> : null}
                                                {ad.selectedItem?.dogAge ? <Text style={styles.adInfoLine}>Години: {ad.selectedItem.dogAge}</Text> : null}
                                                {ad.selectedItem?.dogBreed ? <Text style={styles.adInfoLine}>Порода: {ad.selectedItem.dogBreed}</Text> : null}
                                            </>
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
                                        <Text style={styles.adPrice}>{formatPrice(ad.price)}</Text>
                                    </View>
                                </View>

                                {/* Footer с данни за потребителя и бутон за чат или редакция */}
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
                                        </View>
                                    </View>
                                    <View style={styles.adFooterRight}>
                                        {ad.userPhone ? (
                                            <Text style={styles.adUserPhone}>Тел.номер: {ad.userPhone}</Text>
                                        ) : null}
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

            {/* Modal за Създаване/Редакция на обява */}
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
                                                        ? selectedItem.id !== undefined
                                                            ? selectedItem.id
                                                            : dogs.indexOf(selectedItem)
                                                        : ''
                                                }
                                                onValueChange={(itemValue) => {
                                                    const dog = dogs.find((d, index) =>
                                                        d.id !== undefined ? d.id === itemValue : index === itemValue
                                                    );
                                                    setSelectedItem(dog);
                                                }}
                                            >
                                                <Picker.Item label="Избери куче" value="" />
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
                                                selectedValue={
                                                    selectedItem
                                                        ? selectedItem.id !== undefined
                                                            ? selectedItem.id
                                                            : weapons.indexOf(selectedItem)
                                                        : ''
                                                }
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

                            <Text style={styles.label}>Цена:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Въведете цена"
                                placeholderTextColor="#aaa"
                                value={priceInput}
                                onChangeText={setPriceInput}
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>Качете снимка:</Text>
                            <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
                                <Text style={styles.imagePickerText}>{uploadedImage ? 'Промени снимка' : 'Избери снимка'}</Text>
                            </TouchableOpacity>
                            {uploadedImage && <Image source={{ uri: uploadedImage }} style={styles.uploadedImage} />}

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
