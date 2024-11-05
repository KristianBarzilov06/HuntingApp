import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert, Image, ActivityIndicator } from 'react-native';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import styles from '../src/styles/LoginStyles';

const LoginView = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (email === '' || password === '') {
            Alert.alert("Моля, попълнете всички полета.");
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            Alert.alert("Моля, въведете валиден имейл.");
            return;
        }

        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigation.navigate('Main', { userEmail: email });
        } catch (error) {
            Alert.alert("Грешка при вход: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Вход</Text>
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
                {loading ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                ) : (
                    <TouchableOpacity style={styles.button} onPress={handleLogin}>
                        <Text style={styles.buttonText}>Вход</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.linkTouchable} onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.linkText}>Нямате акаунт?</Text>
                </TouchableOpacity>
            </View>
            <Image source={require('../images/boar.png')} style={styles.image} resizeMode="cover" />
        </View>
    );
};

export default LoginView;