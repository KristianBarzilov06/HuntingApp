/* global require */
import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  Image,
  KeyboardAvoidingView,
  Keyboard,
  Animated,
  Platform,
  ScrollView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { doc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import PropTypes from 'prop-types';
import styles from '../src/styles/RegisterStyles';

const RegisterView = ({ navigation }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const [containerPosition] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
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

  const handleRegister = async (data) => {
    try {
      // Създаване на потребител в Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const { uid, email } = userCredential.user;

      // Създаване на документ във Firestore със също така новото поле "phone"
      await setDoc(doc(firestore, 'users', uid), {
        email: email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || '', // новото поле за телефонен номер
        roles: ["hunter"],
        bio: '',
        dogBreed: '',
        equipment: [],
        gallery: [],
        huntingLicense: { start: '', end: '' },
        huntingNotes: { start: '', end: '' },
        isGroupHunting: false,
        isSelectiveHunting: false,
        licenseType: '',
        profilePicture: '',
      });

      Alert.alert('Успешна регистрация!');
      reset();
      // След регистрацията пренасочваме към Profile, в режим "editing", за да се попълнят останалите данни.
      navigation.navigate('Profile', { firstTime: true, userEmail: email });
    } catch (error) {
      Alert.alert('Грешка при регистрация: ' + error.message);
      console.error(error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ transform: [{ translateY: containerPosition }] }}>
          <Image source={require('../images/Дружинар.png')} style={styles.logo} />
          <Text style={styles.title}>Регистрация</Text>
          <View style={styles.inputContainer}>
            {/* Име */}
            <Controller
              control={control}
              name="firstName"
              rules={{
                required: 'Името е задължително.',
                minLength: { value: 2, message: 'Името трябва да бъде поне 2 символа.' },
              }}
              render={({ field: { onChange, value } }) => (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Име"
                    value={value}
                    onChangeText={onChange}
                    placeholderTextColor="#242c0f"
                  />
                  {errors.firstName && <Text style={styles.errorText}>{errors.firstName.message}</Text>}
                </>
              )}
            />

            {/* Фамилия */}
            <Controller
              control={control}
              name="lastName"
              rules={{
                required: 'Фамилията е задължителна.',
                minLength: { value: 2, message: 'Фамилията трябва да бъде поне 2 символа.' },
              }}
              render={({ field: { onChange, value } }) => (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Фамилия"
                    value={value}
                    onChangeText={onChange}
                    placeholderTextColor="#242c0f"
                  />
                  {errors.lastName && <Text style={styles.errorText}>{errors.lastName.message}</Text>}
                </>
              )}
            />

            {/* Имейл */}
            <Controller
              control={control}
              name="email"
              rules={{
                required: 'Имейлът е задължителен.',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Моля, въведете валиден имейл адрес.' },
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

            {/* Телефонен номер */}
            <Controller
              control={control}
              name="phone"
              rules={{
                required: 'Телефонният номер е задължителен.',
                pattern: { value: /^[0-9]+$/, message: 'Моля, въведете валиден телефонен номер.' },
              }}
              render={({ field: { onChange, value } }) => (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Телефонен номер"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="phone-pad"
                    placeholderTextColor="#242c0f"
                  />
                  {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
                </>
              )}
            />

            {/* Парола */}
            <Controller
              control={control}
              name="password"
              rules={{
                required: 'Паролата е задължителна.',
                minLength: { value: 6, message: 'Паролата трябва да бъде поне 6 символа.' },
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

            {/* Потвърждение на парола */}
            <Controller
              control={control}
              name="confirmPassword"
              rules={{
                required: 'Моля, потвърдете паролата.',
                validate: (value) =>
                  value === control._formValues.password || 'Паролите не съвпадат.',
              }}
              render={({ field: { onChange, value } }) => (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Потвърдете паролата"
                    secureTextEntry
                    value={value}
                    onChangeText={onChange}
                    placeholderTextColor="#242c0f"
                  />
                  {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}
                </>
              )}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
                <Text style={styles.linkText}>Вече имате акаунт?</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleSubmit(handleRegister)}>
                <Text style={styles.buttonText}>Регистрация</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

RegisterView.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

export default RegisterView;
