import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#9db23a', // Светло зелено
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileText: {
    fontSize: 18,
    marginLeft: 5,
    color: '#242c0f', // тъмно зелено
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    padding: 5,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 5,
    color: 'black',
  },
  groupList: {
    marginTop: 10,
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#D3D3D3',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  groupDetails: {
    flexDirection: 'column',
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  groupChairman: {
    fontSize: 14,
    color: 'black',
  },
  joinButton: {
    backgroundColor: '#242c0f', // Тъмно зелено, за да съответства на твоята тема
    padding: 10,
    borderRadius: 10,
  },
  joinButtonText: {
    color: '#ffb400', // Оранжев текст на бутона, както е в твоя оригинален стил
    fontSize: 16,
  },
});