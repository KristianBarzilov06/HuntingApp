import { useRef, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function CameraScreen() {
  const cameraRef = useRef(null);
  const [cameraVisible, setCameraVisible] = useState(true);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      console.log('Photo taken:', photo.uri);

      try {
        const downloadURL = await uploadImage(photo.uri);
        console.log('Image uploaded successfully:', downloadURL);
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  const uploadImage = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const storageRef = ref(storage, `images/${Date.now()}.jpg`);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  return (
    cameraVisible && hasCameraPermission && (
      <Camera style={{ flex: 1 }} ref={cameraRef}>
        <View style={{ flex: 1, justifyContent: 'flex-end', marginBottom: 36 }}>
          <TouchableOpacity onPress={() => setCameraVisible(false)}>
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={takePicture}>
            <Ionicons name="camera" size={30} color="white" />
          </TouchableOpacity>
        </View>
      </Camera>
    )
  );
}