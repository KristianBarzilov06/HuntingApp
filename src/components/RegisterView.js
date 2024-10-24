import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import styles from '../styles/RegisterStyles'; // Импортираме стиловете

const RegisterView = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [identificationNumber, setIdentificationNumber] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Регистрация</Text>
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
      <TextInput
        style={styles.input}
        placeholder="Потвърди паролата"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholderTextColor="#242c0f"
      />
      <TextInput
        style={styles.input}
        placeholder="Идентификационен номер"
        value={identificationNumber}
        onChangeText={setIdentificationNumber}
        placeholderTextColor="#242c0f"
      />
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Регистрация</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RegisterView;