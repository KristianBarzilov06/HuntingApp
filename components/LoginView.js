import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert, Image, ActivityIndicator } from 'react-native';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../src/styles/LoginStyles';
import NetInfo from "@react-native-community/netinfo";

const LoginView = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        const loadRememberedData = async () => {
            const savedEmail = await AsyncStorage.getItem('rememberedEmail');
            const savedPassword = await AsyncStorage.getItem('rememberedPassword');
            if (savedEmail && savedPassword) {
                setEmail(savedEmail);
                setPassword(savedPassword);
                setRememberMe(true);
            }
        };
        loadRememberedData();
    }, []);

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

        const networkState = await NetInfo.fetch();
        if (!networkState.isConnected) {
            Alert.alert("Няма връзка", "Проверете интернет връзката си и опитайте отново.");
            return;
        }

        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);

            if (rememberMe) {
                await AsyncStorage.setItem('rememberedEmail', email);
                await AsyncStorage.setItem('rememberedPassword', password);
            } else {
                await AsyncStorage.removeItem('rememberedEmail');
                await AsyncStorage.removeItem('rememberedPassword');
            }

            navigation.navigate('Main', { userEmail: email });
        } catch (error) {
            switch (error.code) {
                case 'auth/network-request-failed':
                    Alert.alert("Грешка в мрежата", "Проверете интернет връзката си и опитайте отново.");
                    break;
                default:
                    Alert.alert("Грешка при вход", error.message);
            }
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
                <View style={styles.linkContainer}>
                    <TouchableOpacity
                        style={styles.rememberMeContainer}
                        onPress={() => setRememberMe(!rememberMe)}
                    >
                        <View style={[styles.checkbox, rememberMe && styles.checked]}>
                            {rememberMe && <Text style={{ color: 'white' }}>✔️</Text>}
                        </View>
                        <Text style={styles.rememberMeText}>Запомни ме</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.linkText}>Нямате акаунт?</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <Image source={require('../images/boar.png')} style={styles.image} resizeMode="cover" />
        </View>
    );
};

export default LoginView;
