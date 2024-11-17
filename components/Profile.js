import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Checkbox } from 'react-native-paper'; // Импортиране на Checkbox от react-native-paper
import styles from '../src/styles/ProfileStyles.js'; // Вашият стил, ако е необходимо

const Profile = ({ route, navigation }) => {
    const { userEmail } = route.params || {};

    const [user, setUser] = useState({
        name: 'Кристиян Бързилов',
        email: userEmail,
        profilePicture: require('../images/IMG_20230701_185012_979.jpg'),
    });

    const [bio, setBio] = useState('');
    const [licenseType, setLicenseType] = useState('');
    const [huntingLicense, setHuntingLicense] = useState('');
    const [huntingNotes, setHuntingNotes] = useState('');
    const [equipment, setEquipment] = useState([{ name: '', model: '', caliber: '' }]);
    const [dogBreed, setDogBreed] = useState('');
    const [gallery, setGallery] = useState([]);
    const [isEditing, setIsEditing] = useState(false);

    // Състояние за чекбоксовете
    const [isGroupHunting, setIsGroupHunting] = useState(false);
    const [isSelectiveHunting, setIsSelectiveHunting] = useState(false);

    const handleLogOut = async () => {
        try {
            // Логика за излизане от профила
            setUser({
                name: '',
                email: '',
                profilePicture: require('../images/IMG_20230701_185012_979.jpg'),
            });
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (error) {
            console.error("Error logging out:", error);
            Alert.alert("Грешка при изход", error.message);
        }
    };

    const handleSaveChanges = () => {
        setIsEditing(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={34} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Профил</Text>
                <TouchableOpacity onPress={handleLogOut}>
                    <Ionicons name="settings-outline" size={34} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.scrollView}>
                <View style={styles.profileInfo}>
                    <Image source={user.profilePicture} style={styles.profilePicture} />
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                </View>

                <View style={styles.profileDetailsContainer}>
                    <Text style={styles.sectionTitle}>Биография</Text>
                    {isEditing ? (
                        <TextInput
                            style={styles.input}
                            placeholder="Напишете кратка биография за себе си по желание"
                            value={bio}
                            onChangeText={setBio}
                            multiline
                        />
                    ) : (
                        <Text>{bio || 'Няма въведена биография'}</Text>
                    )}

                    <Text style={styles.sectionTitle}>Лиценз</Text>
                    {isEditing ? (
                        <View style={styles.checkboxContainer}>
                            <View style={styles.checkboxItem}>
                                <Checkbox
                                    status={isGroupHunting ? 'checked' : 'unchecked'}
                                    onPress={() => setIsGroupHunting(!isGroupHunting)}
                                />
                                <Text>Групов лов</Text>
                            </View>

                            <View style={styles.checkboxItem}>
                                <Checkbox
                                    status={isSelectiveHunting ? 'checked' : 'unchecked'}
                                    onPress={() => {
                                        if (isGroupHunting) {
                                            setIsSelectiveHunting(!isSelectiveHunting);
                                        } else {
                                            Alert.alert('Трябва да изберете "Групов лов", за да изберете "Подборен лов"');
                                        }
                                    }}
                                    disabled={!isGroupHunting} // Деактивиране на "Подборен лов", ако не е избран "Групов лов"
                                />
                                <Text>Подборен лов</Text>
                            </View>
                        </View>
                    ) : (
                        <Text>{isGroupHunting && isSelectiveHunting ? 'Групов лов, Подборен лов' : (isGroupHunting ? 'Групов лов' : '')}</Text>
                    )}

                    <Text style={styles.sectionTitle}>Ловен билет</Text>
                    {isEditing ? (
                        <TextInput
                            style={styles.input}
                            placeholder="От кога е валиден ловния билет и до кога изтича"
                            value={huntingLicense}
                            onChangeText={setHuntingLicense}
                        />
                    ) : (
                        <Text>{huntingLicense || 'Няма въведен ловен билет'}</Text>
                    )}

                    <Text style={styles.sectionTitle}>Ловна бележка</Text>
                    {isEditing ? (
                        <TextInput
                            style={styles.input}
                            placeholder="От кога до кога е ловната бележка"
                            value={huntingNotes}
                            onChangeText={setHuntingNotes}
                        />
                    ) : (
                        <Text>{huntingNotes || 'Няма въведена ловна бележка'}</Text>
                    )}
                    <Text style={styles.sectionTitle}>Оръжия</Text>
                        <View style={styles.profileDetailsContainer}>
                            {equipment.map((eq, index) => (
                                <View key={index} style={styles.equipmentContainer}>
                                    {isEditing ? (
                                        <>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Име на оръжието"
                                                value={eq.name}
                                                onChangeText={(text) => {
                                                    const updatedEquipment = [...equipment];
                                                    updatedEquipment[index].name = text;
                                                    setEquipment(updatedEquipment);
                                                }}
                                            />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Модел на оръжието"
                                                value={eq.model}
                                                onChangeText={(text) => {
                                                    const updatedEquipment = [...equipment];
                                                    updatedEquipment[index].model = text;
                                                    setEquipment(updatedEquipment);
                                                }}
                                            />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Калибър на оръжието"
                                                value={eq.caliber}
                                                onChangeText={(text) => {
                                                    const updatedEquipment = [...equipment];
                                                    updatedEquipment[index].caliber = text;
                                                    setEquipment(updatedEquipment);
                                                }}
                                            />
                                        </>
                                    ) : (
                                        <View>
                                            {/* При изглед показваме всички данни за всяко оръжие */}
                                            {eq.name && <Text>Име: {eq.name}</Text>}
                                            {eq.model && <Text>Модел: {eq.model}</Text>}
                                            {eq.caliber && <Text>Калибър: {eq.caliber}</Text>}
                                        </View>
                                    )}
                                </View>
                            ))}
                            {isEditing && (
                                <TouchableOpacity onPress={() => setEquipment([...equipment, { name: '', model: '', caliber: '' }])}>
                                    <Text style={styles.addButtonText}>Добави още оръжие</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                    <Text style={styles.sectionTitle}>Куче</Text>
                    {isEditing ? (
                        <TextInput
                            style={styles.input}
                            placeholder="Порода куче"
                            value={dogBreed}
                            onChangeText={setDogBreed}
                        />
                    ) : (
                        <Text>{dogBreed || 'Няма въведена порода куче'}</Text>
                    )}

                    <Text style={styles.sectionTitle}>Галерия</Text>
                    {gallery.length > 0 ? (
                        <FlatList
                            data={gallery}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <Image source={{ uri: item }} style={styles.galleryImage} />
                            )}
                        />
                    ) : (
                        <Text>Все още нямате снимки в галерията.</Text>
                    )}
                </View>

                {!isEditing && (
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setIsEditing(true)}
                    >
                        <Text style={styles.editButtonText}>Редактирай профила</Text>
                    </TouchableOpacity>
                )}

                {isEditing && (
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={handleSaveChanges}
                    >
                        <Text style={styles.editButtonText}>Запази промените</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
};

export default Profile;
