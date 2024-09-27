import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';

const LoginView = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        if (email === '' || password === '') {
            Alert.alert("Моля, попълнете всички полета.");
            return;
        }

        navigation.navigate('Main');
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