import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Animated,
  Platform,
} from 'react-native';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../src/styles/LoginStyles';
import NetInfo from '@react-native-community/netinfo';

const LoginView = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
      toValue: -e.endCoordinates.height / 1.4,
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

  const handleLogin = async () => {
    if (email === '' || password === '') {
      Alert.alert('Моля, попълнете всички полета.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      Alert.alert('Моля, въведете валиден имейл.');
      return;
    }

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      Alert.alert(
        'Няма връзка',
        'Проверете интернет връзката си и опитайте отново.'
      );
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
          Alert.alert(
            'Грешка в мрежата',
            'Проверете интернет връзката си и опитайте отново.'
          );
          break;
        default:
          Alert.alert('Грешка при вход', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View style={{ transform: [{ translateY: containerPosition }] }}>
        <Image source={require('../images/Дружинар.png')} style={styles.logo} />
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
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

export default LoginView;
