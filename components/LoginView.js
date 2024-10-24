import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import { auth } from '../firebaseConfig'; // Импортирай auth
import { signInWithEmailAndPassword } from 'firebase/auth';

const LoginView = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (email === '' || password === '') {
            Alert.alert("Моля, попълнете всички полета.");
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigation.navigate('Main');
        } catch (error) {
            Alert.alert("Грешка при вход: " + error.message);
        }
    };

    return (
        <View>
            <TextInput 
                placeholder="Имейл" 
                value={email} 
                onChangeText={setEmail} 
            />
            <TextInput 
                placeholder="Парола" 
                secureTextEntry 
                value={password} 
                onChangeText={setPassword} 
            />
            <Button title="Вход" onPress={handleLogin} />
        </View>
    );
};

export default LoginView;