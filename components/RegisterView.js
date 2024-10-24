import React, { useState } from 'react';
import { View, TextInput, Button, Alert, TouchableOpacity, Text  } from 'react-native';
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
            
            <View style={{ marginTop: 20 }}>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={{ color: 'blue', textAlign: 'center' }}>
                        Вече имате акаунт? Вход
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default RegisterView;