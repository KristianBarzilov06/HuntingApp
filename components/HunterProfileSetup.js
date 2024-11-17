import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { firestore, auth } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import styles from '../src/styles/ProfileStyles';

const HunterProfileSetup = ({ navigation }) => {
    const [name, setName] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [licenseExpiry, setLicenseExpiry] = useState('');
    const [experience, setExperience] = useState('');
    const [preferredGame, setPreferredGame] = useState('');
    const [weapons, setWeapons] = useState('');
    const [dogs, setDogs] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');
    const [bio, setBio] = useState('');

    const handleProfileSetup = async () => {
        const user = auth.currentUser;

        if (!user) {
            Alert.alert("Моля, влезте в профила си!");
            return;
        }

        const userId = user.uid;
        const userRef = doc(firestore, 'users', userId);

        try {
            await setDoc(userRef, {
                name,
                licenseNumber,
                licenseExpiry,
                experience: parseInt(experience),
                preferredGame,
                equipment: {
                    weapons: weapons.split(',').map(w => w.trim()),
                    dogs: dogs.split(',').map(d => ({
                        name: d.split('-')[0].trim(),
                        breed: d.split('-')[1].trim(),
                    })),
                },
                phone,
                location,
                bio,
                trophiesCount: 0, // initially 0
                role: 'Member', // default role
            });
            Alert.alert("Профилът е създаден успешно!");
            navigation.navigate('Main');
        } catch (error) {
            Alert.alert("Грешка при запазване на профила: " + error.message);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Настройка на профила на ловеца</Text>
            {/* Входни полета за данни на профила */}
            <TextInput placeholder="Име" value={name} onChangeText={setName} style={styles.input} />
            <TextInput placeholder="Номер на лиценз" value={licenseNumber} onChangeText={setLicenseNumber} style={styles.input} />
            <TextInput placeholder="Валидност на лиценза (гггг-мм-дд)" value={licenseExpiry} onChangeText={setLicenseExpiry} style={styles.input} />
            <TextInput placeholder="Години опит" value={experience} onChangeText={setExperience} keyboardType="numeric" style={styles.input} />
            <TextInput placeholder="Предпочитан дивеч" value={preferredGame} onChangeText={setPreferredGame} style={styles.input} />
            <TextInput placeholder="Оръжия" value={weapons} onChangeText={setWeapons} style={styles.input} />
            <TextInput placeholder="Кучета (пример: Bulldog - Labrador)" value={dogs} onChangeText={setDogs} style={styles.input} />
            <TextInput placeholder="Телефон" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} />
            <TextInput placeholder="Локация" value={location} onChangeText={setLocation} style={styles.input} />
            <TextInput placeholder="Биография" value={bio} onChangeText={setBio} style={styles.input} multiline />

            <TouchableOpacity onPress={handleProfileSetup} style={styles.button}>
                <Text style={styles.buttonText}>Запази профила</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

export default HunterProfileSetup;
