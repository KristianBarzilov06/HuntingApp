import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#9db23a',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 10,
    paddingTop: 20,
  },
  title: {
    fontSize: 50,
    color: '#242c0f',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Alice',
  },
  inputContainer: {
    width: '100%',
    backgroundColor: '#d4e157',
    padding: 20,
    marginBottom: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 15,
    marginTop: 10,
    alignItems: 'center',
  },
  input: {
    width: 300,
    height: 50,
    backgroundColor: '#6A7845',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginVertical: 10,
    color: '#242c0f',
    fontSize: 16,
    alignSelf: 'center',
  },
  buttonContainer: {
    flexDirection: 'row', // Подреждане на елементите в ред
    alignItems: 'center', // Подравняване по вертикала
    justifyContent: 'space-between', // Разстояние между линка и бутона
    width: '100%', // Ширина на контейнера
    marginTop: 20, // Разстояние от останалото съдържание
  },
  link: {
    flex: 1,
    marginRight: 10, // Разстояние между линка и бутона
  },
  linkText: {
    color: 'blue',
    fontSize: 16,
  },
  button: {
    flex: 1,
    backgroundColor: '#242c0f',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffb400',
    fontSize: 18,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
  },
});
