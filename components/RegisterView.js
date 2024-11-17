import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert, Image, KeyboardAvoidingView, Keyboard, Animated, Platform } from 'react-native';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import styles from '../src/styles/RegisterStyles';

const RegisterView = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [containerPosition] = useState(new Animated.Value(0));

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      keyboardDidShow
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      keyboardDidHide
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const keyboardDidShow = (e) => {
    Animated.timing(containerPosition, {
      toValue: -e.endCoordinates.height / 1.1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const keyboardDidHide = () => {
    Animated.timing(containerPosition, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleRegister = async () => {
    if (email === '' || password === '' || confirmPassword === '') {
      Alert.alert('Моля, попълнете всички полета.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Паролите не съвпадат. Моля, опитайте отново.');
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert('Успешна регистрация!');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Грешка при регистрация: ' + error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View style={{ transform: [{ translateY: containerPosition }] }}>
        <Image source={require('../images/Дружинар.png')} style={styles.logo} />
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
          <TextInput
            style={styles.input}
            placeholder="Въведете паролата отново"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholderTextColor="#242c0f"
          />
          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Регистрация</Text>
          </TouchableOpacity>
          <View style={styles.linkContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Вече имате акаунт?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

export default RegisterView;
