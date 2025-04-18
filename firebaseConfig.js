import { initializeApp, setLogLevel } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { API_KEY } from '@env';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: "huntingappchat-88aa7.firebaseapp.com",
  projectId: "huntingappchat-88aa7",
  storageBucket: "huntingappchat-88aa7.firebasestorage.app",
  messagingSenderId: "1076822400965",
  appId: "1:1076822400965:web:0ce06099265e057c8f75ac",
  measurementId: "G-RTN1DP6WQ8"
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
setLogLevel('debug');
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, auth, firestore, storage };