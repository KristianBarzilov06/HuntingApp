import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3A3F32', // Тъмно зелено-сив фон
    paddingLeft: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A3B1F', // Тъмно-зеленикаво-кафяв
    paddingBottom: 20,
    padding: 15,
    zIndex: 9,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    marginLeft: 10,
    marginTop: 30,
  },
  messageList: {
    flex: 1,
    padding: 0,
    marginBottom:10,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10, // Увеличено разстояние между съобщенията и inputContainer
  },
  myMessageContainer: {
    flexDirection: 'row-reverse', // Моите съобщения отдясно
    alignItems: 'flex-end',
    marginBottom: 1,
    marginRight: 10, // Разстояние от ръба на екрана
  },
  otherMessageContainer: {
    flexDirection: 'row', // Съобщенията на другите отляво
    alignItems: 'flex-end',
    marginBottom: 1,
    marginLeft: 10, // Разстояние от ръба на екрана спрямо профилната снимка
  },
  spacedMessages: {
    marginBottom: 10, // 10px разстояние между различни потребители
  },
  messageContent: {
    padding: 10,
    borderRadius: 15,
    backgroundColor: 'transparent',
    flexShrink: 1, // Ограничаваме ширината според съдържанието
  },
  messageItem: {
    padding: 8,
    borderRadius: 15,
    marginLeft: -10, // Намаляване на разстоянието между съобщението и профилната снимка
  },
  myMessage: {
    backgroundColor: '#5A773F', // Тъмно зелено
    alignSelf: 'flex-end',
    color: 'white',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 5,
    padding: 10,
    maxWidth: '70%',
  },
  otherMessage: {
    backgroundColor: '#857550', // Кафяво-зелен оттенък
    alignSelf: 'flex-start',
    color: 'white',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 15,
    padding: 10,
    maxWidth: '70%',
    marginLeft: 40, // Намаляване на разстоянието, за да се доближи до профилната снимка
  },
  messageWithProfile: {
    marginLeft: 40, // Подравняване на съобщенията с профилна снимка
  },
  profileIconContainer: {
    width: 0,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -10, // Намаляване на разстоянието от съобщението
    marginLeft: 10,
  },
  profileIcon: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },
  messageText: {
    fontSize: 15,
    color: 'white',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  messageVideo: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8, // Добавяне на вертикален padding
    backgroundColor: '#2A3B1F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 15, // Добавяне на хоризонтално разстояние
    justifyContent: 'space-evenly', // Равномерно разпределение на елементите
  },
  input: {
    flex: 1,
    padding: 10,
    borderColor: '#5A773F',
    borderWidth: 2,
    borderRadius: 20,
    marginHorizontal: 8,
    maxWidth: '65%',
    color: 'white',
    fontSize: 14, // Намаляване на размера на текста
  },
  icon: {
    marginHorizontal: 8,
    fontSize: 22, // Намаляване на размера на иконите
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 92,
    left: 0,
    right: 0,
    backgroundColor: '#5A773F',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 8,
  },
  menuItem: {
    padding: 15,
    fontSize: 16,
    color: 'white',
  },
  voiceMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#857550',
    padding: 8,
    borderRadius: 15,
    marginVertical: 2,
    width: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  playButton: {
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12.5,
    backgroundColor: '#334603',
    marginRight: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    marginHorizontal: 4,
  },
  progressIndicator: {
    height: '100%',
    backgroundColor: '#334603',
    width: '50%',
  },
  durationText: {
    fontSize: 12,
    color: 'white',
    marginLeft: 4,
  },
});
