import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';

const RegisterView = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleRegister = () => {
        if (email === '' || password === '' || confirmPassword === '') {
            Alert.alert("Моля, попълнете всички полета.");
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert("Паролите не съвпадат.");
            return;
        }

        // Имплементирай логиката за регистрация (напр. API повикване)
        // При успешна регистрация
        navigation.navigate('Login');
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
            <TextInput 
                placeholder="Повтори паролата" 
                secureTextEntry 
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
            />
            <Button title="Регистрация" onPress={handleRegister} />
        </View>
    );
};

export default RegisterView;