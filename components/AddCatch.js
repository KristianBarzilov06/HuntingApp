import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { firestore, storage } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const AddCatch = () => {
    const [catchTitle, setCatchTitle] = useState('');
    const [catchDescription, setCatchDescription] = useState('');
    const [catchImage, setCatchImage] = useState(null);

    const handleAddCatch = async () => {
        if (!catchTitle || !catchDescription) {
            Alert.alert("Моля, попълнете всички полета.");
            return;
        }

        const userId = auth.currentUser.uid;
        let catchImageUrl = null;

        if (catchImage) {
            const imageRef = ref(storage, 'catches/' + Date.now());
            const uploadTask = uploadBytesResumable(imageRef, catchImage);
            await uploadTask;
            catchImageUrl = await getDownloadURL(uploadTask.snapshot.ref);
        }

        const catchData = {
            hunterId: userId,
            title: catchTitle,
            description: catchDescription,
            imageUrl: catchImageUrl,
            createdAt: new Date(),
        };

        await setDoc(doc(firestore, 'catches', Date.now().toString()), catchData);
        Alert.alert("Трофеят е добавен!");
    };

    return (
        <View>
            <TextInput
                placeholder="Заглавие на улова"
                value={catchTitle}
                onChangeText={setCatchTitle}
            />
            <TextInput
                placeholder="Описание на улова"
                value={catchDescription}
                onChangeText={setCatchDescription}
                multiline
            />
            <TouchableOpacity onPress={handleAddCatch}>
                <Text>Добави улов</Text>
            </TouchableOpacity>
        </View>
    );
};

export default AddCatch;