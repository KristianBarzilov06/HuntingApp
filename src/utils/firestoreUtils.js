import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig';

export const saveProfileData = async (userId, profileData) => {
  try {
    await setDoc(doc(firestore, 'users', userId), profileData, { merge: true });
    console.log('Данните са успешно записани в Firestore');
  } catch (error) {
    console.error('Грешка при записване в Firestore:', error.message);
    throw new Error('Записът не бе успешен. Проверете мрежата си или настройките.');
  }
};

export const loadProfileData = async (userId) => {
  try {
    const docRef = doc(firestore, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Грешка при зареждане на профила:", error);
    Alert.alert("Грешка при зареждане на профила:", error.message);
    return null;
  }
};