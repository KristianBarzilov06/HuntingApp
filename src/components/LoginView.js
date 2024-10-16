import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import styles from '../styles/LoginStyles'; // Импортираме стиловете

const LoginView = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Вход</Text>
      <TextInput
        style={styles.input}
        placeholder="Име"
        value={username}
        onChangeText={setUsername}
        placeholderTextColor="#242c0f"
      />
      <TextInput
        style={styles.input}
        placeholder="Парола"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#242c0f"
      />
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Влез</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginView;