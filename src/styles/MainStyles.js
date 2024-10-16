import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#9db23a', // Светло зелено
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    color: '#242c0f',
    marginBottom: 20,
  },
  groupButton: {
    width: '80%',
    backgroundColor: '#242c0f',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  groupButtonText: {
    color: '#ffb400',
    fontSize: 16,
  },
});