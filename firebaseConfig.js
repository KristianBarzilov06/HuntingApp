import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
// import { getAnalytics, isSupported } from "firebase/analytics"; // Премахни или коментирай

const firebaseConfig = {
  apiKey: "AIzaSyDR9KZhydET4e0PJ7vv_0t9r09rONX6wdg",
  authDomain: "huntingappchat-88aa7.firebaseapp.com",
  projectId: "huntingappchat-88aa7",
  storageBucket: "huntingappchat-88aa7.appspot.com",
  messagingSenderId: "1076822400965",
  appId: "1:1076822400965:web:324bf8cd4aabbb128f75ac",
  measurementId: "G-HF3N0M89VS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});


// Можеш да премахнеш инициализацията на Analytics
/*
isSupported().then((supported) => {
  if (supported) {
    const analytics = getAnalytics(app);
  } else {
    console.warn("Firebase Analytics is not supported in this environment.");
  }
});
*/

export { app, auth };