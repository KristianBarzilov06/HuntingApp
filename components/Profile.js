import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../src/styles/ProfileStyles.js';

const Profile = ({ route, navigation }) => {
    const { userEmail } = route.params || {};
    const [user, setUser] = useState({
        name: 'Кристиян Бързилов',
        email: userEmail,
        profilePicture: require('../images/IMG_20230701_185012_979.jpg'),
    });

    const editProfile = () => {
        Alert.alert('Редактиране на профила', 'Тази функция скоро ще бъде налична!');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={34} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Профил</Text>
            </View>

            <View style={styles.profileInfo}>
                {/* Използваме profilePicture от user */}
                <Image source={user.profilePicture} style={styles.profilePicture} />
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
            </View>

            <TouchableOpacity style={styles.editButton} onPress={editProfile}>
                <Text style={styles.editButtonText}>Редактирай профила</Text>
            </TouchableOpacity>
        </View>
    );
};

export default Profile;
