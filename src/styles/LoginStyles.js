import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#9db23a', // Светло зелено
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 40,
    color: '#242c0f',
    marginBottom: 30,
    width: '100%',
    textAlign: 'left',
    paddingLeft: 10,
  },
  inputContainer: {
    width: '100%',
    backgroundColor: '#d4e157', // Светло зелено за фона на input полетата
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 15,
    marginBottom: 250,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#6A7845',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginVertical: 10,
    color: '#242c0f',
    fontSize: 16,
  },
  button: {
    width: '100%',
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
  linkText: {
    color: 'blue',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'right',
    paddingLeft: 150,
  },
  linkTouchable: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  image: {
    position: 'absolute',
    bottom: -50,
    left: 10,
    width: 200,
    height: 300,
    zIndex: 1,
  },
});