import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert, Image } from 'react-native';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import styles from '../src/styles/RegisterStyles';

const RegisterView = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async () => {
        if (email === '' || password === '') {
            Alert.alert("Моля, попълнете всички полета.");
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            Alert.alert("Успешна регистрация!");
            navigation.navigate('Login');
        } catch (error) {
            Alert.alert("Грешка при регистрация: " + error.message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Регистрация</Text>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Имейл"
                    value={email}
                    onChangeText={setEmail}
                    placeholderTextColor="#242c0f"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Парола"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    placeholderTextColor="#242c0f"
                />

                <TouchableOpacity style={styles.button} onPress={handleRegister}>
                    <Text style={styles.buttonText}>Регистрация</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkTouchable} onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.linkText}>Вече имате акаунт?</Text>
                </TouchableOpacity>
            </View>
            <Image source={require('../images/boar1.png')} style={styles.image}resizeMode="contain"/>
        </View>
    );
};

export default RegisterView;