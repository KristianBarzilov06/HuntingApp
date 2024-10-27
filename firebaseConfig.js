import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Import Firebase Storage
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase конфигурация
const firebaseConfig = {
  apiKey: "AIzaSyDR9KZhydET4e0PJ7vv_0t9r09rONX6wdg",
  authDomain: "huntingappchat-88aa7.firebaseapp.com",
  projectId: "huntingappchat-88aa7",
  storageBucket: "huntingappchat-88aa7.appspot.com",
  messagingSenderId: "1076822400965",
  appId: "1:1076822400965:web:324bf8cd4aabbb128f75ac",
  measurementId: "G-HF3N0M89VS"
};

// Инициализация на Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
const firestore = getFirestore(app);
const storage = getStorage(app); // Initialize Firebase Storage

// Износ на инициализираните инстанции
export { app, auth, firestore, storage };