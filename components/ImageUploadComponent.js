import React from 'react';
import { View, Button, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig'; // Коректен път до файла с Firebase конфигурацията

const ImageUploadComponent = () => {

    const uploadImage = async (uri) => {
        // Увери се, че URI-то е валидно
        if (!uri) {
            console.error('Invalid URI');
            throw new Error('Invalid URI');
        }

        try {
            // Взимане на blob от изображението
            const response = await fetch(uri);
            const blob = await response.blob();

            // Създаване на референция за качване
            const imageRef = ref(storage, `images/${Date.now()}.jpg`);  // Добавяне на разширение
            await uploadBytes(imageRef, blob);  // Качване на изображението

            // Взимане на URL адреса за каченото изображение
            const imageUrl = await getDownloadURL(imageRef);
            return imageUrl;  // Връща URL адреса
        } catch (error) {
            console.error('Error uploading image:', error); // Логване на грешка
            throw error;  // Хвърляне на грешката, за да може да се обработи по-нататък
        }
    };

    const handleImagePick = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            const imageUri = result.assets[0].uri;  // Получаване на URI
            try {
                const imageUrl = await uploadImage(imageUri);  // Качване на изображението
                console.log('Image uploaded successfully:', imageUrl);
                Alert.alert("Изображението е качено успешно!", imageUrl);
            } catch (error) {
                console.error('Error uploading image:', error);
                Alert.alert("Грешка при качване на изображение", error.message);
            }
        } else {
            Alert.alert("Изборът на изображение е отменен.");
        }
    };

    return (
        <View>
            <Button title="Избери изображение" onPress={handleImagePick} />
        </View>
    );
};

export default ImageUploadComponent;