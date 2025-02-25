import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { checkAuth } from '../src/utils/auth';
import { loadFonts } from '../src/utils/loadResources';

const LoadingScreen = ({ navigation }) => {
  useEffect(() => {
    const loadResourcesAndNavigate = async () => {
      try {
        await loadFonts();
        const user = await checkAuth();

        if (user) {
          if (user.role === 'admin') {
            navigation.replace('Main'); // ✅ Админите винаги влизат в MainView
          } else if (user.groupId) {
            navigation.replace('ChatScreen', { groupId: user.groupId }); // ✅ Членовете на група влизат в ChatScreen
          } else {
            navigation.replace('Main'); // ✅ Ако няма група, отива в MainView
          }
        } else {
          navigation.replace('Login'); // ✅ Ако не е логнат, отива в Login
        }
      } catch (error) {
        console.error('Грешка при зареждане на ресурси:', error);
        navigation.replace('Login');
      }
    };

    loadResourcesAndNavigate();
  }, [navigation]);

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#6A7845" />
    </View>
  );
};

LoadingScreen.propTypes = {
  navigation: PropTypes.shape({
    replace: PropTypes.func.isRequired, // ✅ Поправихме PropTypes валидацията
  }).isRequired,
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
  },
});

export default LoadingScreen;
