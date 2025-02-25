import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const checkAuth = async () => {
  try {
    const user = await AsyncStorage.getItem('user');
    if (!user) return null;

    const parsedUser = JSON.parse(user);
    const firestore = getFirestore();
    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    if (!userId) return null;

    const userDocRef = doc(firestore, `users/${userId}`);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return {
        id: userId,
        role: userData.role || parsedUser.role, // Ако няма роля, вземаме от AsyncStorage
        groupId: userData.groupId || null, // Взимаме групата на потребителя
      };
    }

    return {
      id: userId,
      role: parsedUser.role,
      groupId: null, // Ако няма запис в Firestore, няма група
    };

  } catch (error) {
    console.error('Грешка при проверка на автентикация:', error);
    return null;
  }
};
