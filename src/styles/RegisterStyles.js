import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#9db23a', // Светло зелено
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    color: '#242c0f', // Тъмно зелено
    marginBottom: 20,
  },
  input: {
    width: '80%',
    height: 50,
    backgroundColor: '#ffb400', // Жълто
    borderRadius: 10,
    paddingHorizontal: 15,
    marginVertical: 10,
    color: '#242c0f',
  },
  button: {
    width: '80%',
    backgroundColor: '#242c0f',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffb400',
    fontSize: 18,
  },
});