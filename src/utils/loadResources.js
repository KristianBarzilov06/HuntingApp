import * as Font from 'expo-font';
import AliceFont from '../../assets/fonts/Alice-Regular.ttf';

export const loadFonts = async () => {
  await Font.loadAsync({
    Alice: AliceFont,
  });
};