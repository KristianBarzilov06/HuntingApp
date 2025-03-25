import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Alert,
    ScrollView,
    Image,
    Modal,
    Platform,
    KeyboardAvoidingView,
    ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import PropTypes from 'prop-types';
import styles from '../src/styles/MarketplaceStyles';
import { getAuth } from 'firebase/auth';
import { firestore } from '../firebaseConfig';
import { doc, getDoc, collection, addDoc, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const Marketplace = ({ navigation }) => {
    const [category, setCategory] = useState('dogs');
    const [dogs, setDogs] = useState([]);
    const [weapons, setWeapons] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Поле за цена (string, по-късно ще го конвертираме в handleSubmit)
    const [priceInput, setPriceInput] = useState('');

    // Поле за качена снимка на артикула
    const [uploadedImage, setUploadedImage] = useState(null);

    // Управление на модала
    const [modalVisible, setModalVisible] = useState(false);

    // Поле за заглавието на обявата
    const [adTitle, setAdTitle] = useState('');

    // Полета за име на артикула и описание
    const [articleName, setArticleName] = useState('');
    const [description, setDescription] = useState('');

    // Тук пазим обявите, извлечени от базата
    const [ads, setAds] = useState([]);

    // Сортиране
    const [sortMenuVisible, setSortMenuVisible] = useState(false);
    const [sortMode, setSortMode] = useState({ method: 'date', order: 'asc' });

    // Данни за текущия потребител
    const [userData, setUserData] = useState({});
    const auth = getAuth();
    const userId = auth.currentUser.uid;

    const [isEditing, setIsEditing] = useState(false);
    const [editingAd, setEditingAd] = useState(null); // Тук пазим цялата обява, която редактираме

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userRef = doc(firestore, 'users', userId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();

                    // Ако userData.groups е масив с ID-та на групи, вземаме първата група:
                    let groupName = '';
                    if (Array.isArray(data.groups) && data.groups.length > 0) {
                        const groupId = data.groups[0];
                        // Прочитаме документа за групата
                        const groupRef = doc(firestore, 'groups', groupId);
                        const groupSnap = await getDoc(groupRef);
                        if (groupSnap.exists()) {
                            const groupData = groupSnap.data();
                            // groupData.name примерно е "ЛРД-Дюлево"
                            groupName = groupData.name || '';
                        }
                    }

                    // Добавяме си groupName като поле в userData, за да го ползваме лесно нататък
                    data.groupName = groupName;

                    // Сетваме останалите данни
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

    // Зареждаме обявите при първо стартиране
    useEffect(() => {
        fetchAds();
    }, []);

    // Ако изберем куче/оръжие от профила, попълваме articleName
    useEffect(() => {
        if (selectedItem && (category === 'dogs' || category === 'weapons')) {
            setArticleName(selectedItem.dogName || selectedItem.name || '');
        }
    }, [selectedItem, category]);

    // Качване на снимка
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

    // Конвертиране на цена (string) в стотинки
    const parsePriceInput = (input) => {
        const trimmed = input.trim();
        if (!trimmed) {
            return 0;
        }
        // Ако има десетичен разделител, четем като левове.стотинки
        if (trimmed.includes('.') || trimmed.includes(',')) {
            return Math.round(parseFloat(trimmed.replace(',', '.')) * 100);
        } else {
            // Иначе приемаме, че е цяло число (лева)
            const leva = parseInt(trimmed, 10);
            if (isNaN(leva)) {
                return 0;
            }
            return leva * 100;
        }
    };

    /* 
     * Функция за "Редактирай обявата"
     * - Попълваме state с данните на обявата
     * - Отваряме модала с isEditing = true
     */
    const handleEditAd = (ad) => {
        // Запазваме цялата обява в state
        setEditingAd(ad);
        setIsEditing(true);

        // Попълваме полетата
        setCategory(ad.category || 'dogs');
        setAdTitle(ad.adTitle || '');
        setDescription(ad.description || '');
        setArticleName(ad.articleName || '');
        // Преобразуваме цената от стотинки към string
        const priceLeva = (ad.price || 0) / 100;
        const priceStr = priceLeva.toString().replace('.', ','); // "12.5" -> "12,5"
        setPriceInput(priceStr);

        setUploadedImage(ad.uploadedImage || null);

        // Ако има selectedItem, опитваме да го "селектираме"
        if (ad.selectedItem) {
            setSelectedItem(ad.selectedItem);
        } else {
            setSelectedItem(null);
        }

        // Отваряме модала
        setModalVisible(true);
    };

    /*
     * Функция за "Запази промените" при редакция
     */
    const handleSaveChanges = async () => {
        if (!editingAd) return;
        // Взимаме референтния документ
        const docRef = doc(firestore, 'marketplace', editingAd.id);

        // Конвертираме въведената цена в стотинки
        const priceInCents = parsePriceInput(priceInput);

        // Подготвяме обновените данни
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
            // Обновяваме локалния state
            const newAds = ads.map((item) =>
                item.id === editingAd.id ? { ...updatedAd } : item
            );
            setAds(newAds);

            Alert.alert('Успешно', 'Обявата е обновена.');
        } catch (error) {
            Alert.alert('Грешка', 'Неуспешна редакция на обявата.');
            console.error('Error updating ad:', error);
        }

        // Затваряме модала
        setModalVisible(false);
        setIsEditing(false);
        setEditingAd(null);
    };

    /*
     * Функция за изтриване на обява (бутона е в модала)
     */
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
                            // Махаме я и от локалния state
                            setAds(ads.filter((item) => item.id !== editingAd.id));

                            Alert.alert('Успешно', 'Обявата е изтрита.');
                            // Затваряме модала
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

    /*
     * Функция за създаване на НОВА обява
     */
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
        if (isSaving) return; // Предотвратява повторни кликове
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

    // Сортиране на обявите
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

    // Форматиране на цената (стотинки -> "0,00 лв.")
    const formatPrice = (priceInCents) => {
        const num = priceInCents / 100;
        return num.toFixed(2).replace('.', ',') + ' лв.';
    };

    // Примерна функция за „Изпращане на съобщение“ (не е задължителна)
    const handleSendMessage = (adId) => {
        Alert.alert('Съобщение', `Изпращане на съобщение до обява с ID: ${adId}`);
    };

    /*
     * JSX
     */
    return (
        <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Покупко-продажба</Text>
                <TouchableOpacity
                    onPress={() => {
                        // ВАЖНО: при натискане на "добавяне" -> да е нова обява
                        setIsEditing(false);
                        setEditingAd(null);
                        // Изчистваме полетата
                        setCategory('dogs');
                        setAdTitle('');
                        setDescription('');
                        setArticleName('');
                        setPriceInput('');
                        setUploadedImage(null);
                        setSelectedItem(null);
                        // Показваме модала
                        setModalVisible(true);
                    }}
                    style={styles.addButton}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Сортиране */}
            <View style={styles.sortContainer}>
                <TouchableOpacity
                    onPress={() => setSortMenuVisible(!sortMenuVisible)}
                    style={styles.sortButton}
                >
                    <Ionicons name="options" size={24} color="#fff" />
                    <Text style={styles.sortButtonText}>Сортирай</Text>
                </TouchableOpacity>
            </View>
            {sortMenuVisible && (
                <View style={styles.sortMenuContainer}>
                    <Text style={styles.sortMenuTitle}>Метод:</Text>
                    <TouchableOpacity
                        onPress={() => handleSortMethod('date')}
                        style={[
                            styles.sortMenuItem,
                            isSelectedMethod('date') && styles.sortMenuItemSelected,
                        ]}
                    >
                        <Text style={styles.sortMenuItemText}>По дата</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleSortMethod('price')}
                        style={[
                            styles.sortMenuItem,
                            isSelectedMethod('price') && styles.sortMenuItemSelected,
                        ]}
                    >
                        <Text style={styles.sortMenuItemText}>По цена</Text>
                    </TouchableOpacity>

                    <Text style={styles.sortMenuTitle}>Ред:</Text>
                    <TouchableOpacity
                        onPress={() => handleSortOrder('asc')}
                        style={[
                            styles.sortMenuItem,
                            isSelectedOrder('asc') && styles.sortMenuItemSelected,
                        ]}
                    >
                        <Text style={styles.sortMenuItemText}>Възходящо</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleSortOrder('desc')}
                        style={[
                            styles.sortMenuItem,
                            isSelectedOrder('desc') && styles.sortMenuItemSelected,
                        ]}
                    >
                        <Text style={styles.sortMenuItemText}>Низходящо</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Списък с обяви */}
            <ScrollView contentContainerStyle={styles.container}>
                {sortedAds.length > 0 ? (
                    sortedAds.map((ad) => {
                        const formattedDate = new Date(ad.creationDate).toLocaleDateString('bg-BG');
                        const imageUri =
                            ad.uploadedImage ||
                            ad.selectedItem?.dogPicture ||
                            ad.selectedItem?.image;

                        const dogName = ad.selectedItem?.dogName || '';
                        const dogBreed = ad.selectedItem?.dogBreed || '';
                        const dogAge = ad.selectedItem?.dogAge || '';

                        const weaponName = ad.selectedItem?.name || '';
                        const weaponModel = ad.selectedItem?.model || '';

                        const userPhoto = ad.userProfilePhoto;
                        const userOrg = ad.userOrganization;

                        return (
                            <View key={ad.id} style={styles.adCard}>
                                {/* Горна лента */}
                                <View style={styles.adHeader}>
                                    <Text style={styles.adHeaderTitle}>{ad.adTitle}</Text>
                                    <Text style={styles.adHeaderDate}>{formattedDate}</Text>
                                </View>

                                {/* Снимка */}
                                <View style={styles.adImageContainer}>
                                    {imageUri ? (
                                        <Image source={{ uri: imageUri }} style={styles.adImage} />
                                    ) : (
                                        <Text style={{ color: '#555' }}>Без снимка</Text>
                                    )}
                                </View>

                                {/* Описание + Детайли */}
                                <View style={styles.adDetailsRow}>
                                    <View style={styles.adDescriptionBox}>
                                        <Text style={styles.adDescriptionTitle}>Описание:</Text>
                                        <Text style={styles.adDescriptionText}>{ad.description}</Text>
                                    </View>
                                    <View style={styles.adInfoBox}>
                                        {ad.category === 'dogs' && (
                                            <>
                                                {dogName ? <Text style={styles.adInfoLine}>Име: {dogName}</Text> : null}
                                                {dogAge ? <Text style={styles.adInfoLine}>Години: {dogAge}</Text> : null}
                                                {dogBreed ? <Text style={styles.adInfoLine}>Порода: {dogBreed}</Text> : null}
                                            </>
                                        )}
                                        {ad.category === 'weapons' && (
                                            <>
                                                {weaponName ? (
                                                    <Text style={styles.adInfoLine}>Име: {weaponName}</Text>
                                                ) : null}
                                                {weaponModel ? (
                                                    <Text style={styles.adInfoLine}>Модел: {weaponModel}</Text>
                                                ) : null}
                                            </>
                                        )}
                                        {ad.category === 'equipment' && ad.articleName && (
                                            <Text style={styles.adInfoLine}>Артикул: {ad.articleName}</Text>
                                        )}

                                        <Text style={styles.adPrice}>{formatPrice(ad.price)}</Text>
                                    </View>
                                </View>

                                {/* Footer */}
                                <View style={styles.adFooter}>
                                    <View style={styles.adUserInfo}>
                                        {userPhoto ? (
                                            <Image source={{ uri: userPhoto }} style={styles.adUserProfilePic} />
                                        ) : (
                                            <Ionicons
                                                name="person-circle-outline"
                                                size={40}
                                                color="#999"
                                                style={{ marginRight: 8 }}
                                            />
                                        )}
                                        {/* Обвиваме името в контейнер, който може да заеме няколко реда */}
                                        <View style={styles.userNameContainer}>
                                            <Text style={styles.adUserName}>
                                                {ad.userName}
                                            </Text>
                                            {userOrg ? (
                                                <Text style={styles.adUserGroup}>
                                                    {userOrg}
                                                </Text>
                                            ) : null}
                                        </View>
                                    </View>

                                    <View style={styles.adFooterRight}>
                                        {ad.userPhone ? (
                                            <Text style={styles.adUserPhone}>Тел.номер: {ad.userPhone}</Text>
                                        ) : null}
                                        {ad.userId === userId ? (
                                            <TouchableOpacity
                                                style={styles.adEditButton}
                                                onPress={() => handleEditAd(ad)}
                                            >
                                                <Text
                                                    style={styles.adEditButtonText}
                                                    numberOfLines={1}
                                                    ellipsizeMode="tail"
                                                >
                                                    Редактирай обявата
                                                </Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.adMessageButton}
                                                onPress={() => handleSendMessage(ad.id)}
                                            >
                                                <Text
                                                    style={styles.adMessageButtonText}
                                                    numberOfLines={1}
                                                    ellipsizeMode="tail"
                                                >
                                                    Изпрати съобщение
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
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalCenteredView}
                >
                    <View style={styles.modalContainer}>
                        <ScrollView
                            contentContainerStyle={{ paddingBottom: 20 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Заглавие на модала */}
                            {isEditing ? (
                                <Text style={styles.modalTitle}>Редакция на обява</Text>
                            ) : (
                                <Text style={styles.modalTitle}>Нова обява</Text>
                            )}

                            {/* Избор на категория */}
                            <View style={styles.categoryContainer}>
                                <TouchableOpacity
                                    onPress={() => setCategory('dogs')}
                                    style={[styles.categoryButton, category === 'dogs' && styles.categoryButtonActive]}
                                >
                                    <Text style={styles.categoryText}>Кучета</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setCategory('weapons')}
                                    style={[
                                        styles.categoryButton,
                                        category === 'weapons' && styles.categoryButtonActive,
                                    ]}
                                >
                                    <Text style={styles.categoryText}>Оръжия</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setCategory('equipment')}
                                    style={[
                                        styles.categoryButton,
                                        category === 'equipment' && styles.categoryButtonActive,
                                    ]}
                                >
                                    <Text style={styles.categoryText}>Екипировка</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Заглавие на обявата */}
                            <Text style={styles.label}>Заглавие на обявата:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Въведете заглавие на обявата"
                                placeholderTextColor="#aaa"
                                value={adTitle}
                                onChangeText={setAdTitle}
                            />

                            {/* Ако е категория "Кучета" */}
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

                            {/* Ако е категория "Оръжия" */}
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

                            {/* Ако е "Екипировка" */}
                            {category === 'equipment' && (
                                <Text style={styles.label}>
                                    Въведете данни за екипировка/облекло (име, описание, цена и снимка).
                                </Text>
                            )}

                            {/* Име на артикула */}
                            <Text style={styles.label}>Име на артикула:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Въведете име на артикула"
                                placeholderTextColor="#aaa"
                                value={articleName}
                                onChangeText={setArticleName}
                            />

                            {/* Описание */}
                            <Text style={styles.label}>Описание:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Въведете описание"
                                placeholderTextColor="#aaa"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                            />

                            {/* Цена */}
                            <Text style={styles.label}>Цена:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Въведете цена"
                                placeholderTextColor="#aaa"
                                value={priceInput}
                                onChangeText={setPriceInput}
                                keyboardType="numeric"
                            />

                            {/* Бутон за качване на снимка */}
                            <Text style={styles.label}>Качете снимка:</Text>
                            <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
                                <Text style={styles.imagePickerText}>
                                    {uploadedImage ? 'Промени снимка' : 'Избери снимка'}
                                </Text>
                            </TouchableOpacity>
                            {uploadedImage && (
                                <Image source={{ uri: uploadedImage }} style={styles.uploadedImage} />
                            )}

                            {/* Основен бутон: ако еEditing -> "Запази промените", иначе "Публикувай обявата" */}
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

                            {/* Малък бутон за изтриване, ако сме в режим редакция */}
                            {isEditing && (
                                <TouchableOpacity
                                    style={[styles.cancelButton, { backgroundColor: '#B22222' }]}
                                    onPress={handleDeleteAd}
                                >
                                    <Text style={styles.cancelButtonText}>Изтрий обявата</Text>
                                </TouchableOpacity>
                            )}

                            {/* Бутон за отказ (затваряне на модала) */}
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
    navigation: PropTypes.object,
};

export default Marketplace;
