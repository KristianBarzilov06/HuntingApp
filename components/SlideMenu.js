import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import styles from '../src/styles/SlideMenuStyles';

const SlideMenu = ({ role, userEmail }) => { // Приемете userEmail като пропс
  const navigation = useNavigation();

  const menuOptions = [
    { label: 'Профил', navigateTo: 'Profile' },
    { label: 'Групов чат', navigateTo: 'ChatScreen' },
    { label: 'Галерия', alert: 'Gallery feature coming soon!' },
    { label: 'Новини и известия', alert: 'News feature coming soon!' },
    { label: 'Канал за покупко-продажба', alert: 'Marketplace feature coming soon!' },
    { label: 'Канал за загубени/намерени кучета', navigateTo: 'LostAndFoundChat' },
    { label: 'Форум', alert: 'Forum feature coming soon!' },
    { label: 'Членове и гости', navigateTo: 'MembersChat' },
    { label: 'Обратно към Main', navigateTo: 'Main' }
  ];

  // Филтрираме опциите за менюто спрямо ролята на потребителя
  const getAccessibleMenuOptions = () => {
    if (role === 'Председател') {
      return menuOptions;
    } else if (role === 'Член на групата') {
      return menuOptions.filter(option => option.label !== 'Новини и известия');
    } else if (role === 'Гост') {
      return menuOptions.filter(
        option => option.label === 'Профил' || option.label === 'Групов чат' || option.label === 'Обратно към Main'
      );
    }
  };

  const accessibleOptions = getAccessibleMenuOptions();

  return (
    <View style={styles.menuContainer}>
      {accessibleOptions.map((option, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => {
            if (option.navigateTo) {
              navigation.navigate(option.navigateTo, { userEmail: userEmail });
            } else if (option.alert) {
              Alert.alert(option.label, option.alert);
            }
          }}
          style={styles.menuItemContainer}
        >
          <Text style={styles.menuItem}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default SlideMenu;
