import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { auth } from '../firebaseConfig'; // Импортирай auth
import { createUserWithEmailAndPassword } from 'firebase/auth';

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
            <Button title="Регистрация" onPress={handleRegister} />
        </View>
    );
};

export default RegisterView;