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
import { useForm, Controller } from 'react-hook-form';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth,firestore } from '../firebaseConfig';
import {getDocs, doc, collection, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import PropTypes from 'prop-types';
import styles from '../src/styles/LoginStyles';

const LoginView = ({ navigation }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [containerPosition] = useState(new Animated.Value(0));

  // Handle keyboard animation
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

  const handleLogin = async (data) => {
    const { email, password } = data;
    setLoading(true);
  
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userId = user.uid;
  
      console.log(`🔹 Успешен вход: ${email}, ID: ${userId}`);
  
      const userRef = doc(firestore, `users/${userId}`);
      const userSnap = await getDoc(userRef);
  
      if (!userSnap.exists()) {
        Alert.alert('Грешка', 'Потребителят не е намерен в базата данни.');
        return;
      }
  
      const userData = userSnap.data();
      const userRole = userData.role || "hunter";
  
      let userGroupId = null;
      let groupName = '';
  
      // Търсене на групата на потребителя
      const groupsRef = collection(firestore, "groups");
      const groupsSnapshot = await getDocs(groupsRef);
  
      for (const groupDoc of groupsSnapshot.docs) {
        const membersRef = collection(firestore, `groups/${groupDoc.id}/members`);
        const memberSnap = await getDoc(doc(membersRef, userId));
  
        if (memberSnap.exists()) {
          userGroupId = groupDoc.id;
          groupName = groupDoc.data().name; // Вземи името на групата
          break;
        }
      }
  
      console.log(`🔹 Намерена група ID: ${userGroupId}, Име на групата: ${groupName}`);
  
      await AsyncStorage.setItem('user', JSON.stringify({
        id: userId,
        role: userRole,
        groupId: userGroupId,
      }));
  
      if (userRole === 'admin') {
        navigation.replace('Main');
      } else if (userGroupId) {
        navigation.replace('ChatScreen', { groupId: userGroupId, groupName: groupName }); // Подаване на groupName
      } else {
        navigation.replace('Main');
      }
    } catch (error) {
      console.error('❌ Грешка при вход:', error);
      Alert.alert('Грешка', 'Грешен имейл или парола.');
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
        {/* eslint-disable-next-line no-undef */}
        <Image source={require('../images/Дружинар.png')} style={styles.logo} />
        <Text style={styles.title}>Вход</Text>
        <View style={styles.inputContainer}>
          {/* Имейл */}
          <Controller
            control={control}
            name="email"
            rules={{
              required: 'Имейлът е задължителен.',
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: 'Моля, въведете валиден имейл.',
              },
            }}
            render={({ field: { onChange, value } }) => (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Имейл"
                  value={value}
                  onChangeText={onChange}
                  placeholderTextColor="#242c0f"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
              </>
            )}
          />

          {/* Парола */}
          <Controller
            control={control}
            name="password"
            rules={{
              required: 'Паролата е задължителна.',
            }}
            render={({ field: { onChange, value } }) => (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Парола"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  placeholderTextColor="#242c0f"
                />
                {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
              </>
            )}
          />

          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit(handleLogin)}
            >
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

LoginView.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    replace: PropTypes.func.isRequired,
  }).isRequired,
};

export default LoginView;
