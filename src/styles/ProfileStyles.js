import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#334603',
    paddingBottom: 20,
    marginLeft: -20,
    marginRight: -20,
    marginTop: -20,
    paddingTop: 15,
    paddingLeft: 10,
    zIndex: 9,
},
  headerTitle: {
    color: 'white',
    fontSize: 20,
    marginLeft: 10,
    marginTop:30,
  },
  profileInfo: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#242c0f',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  editButton: {
    backgroundColor: '#8FBA1D',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
  },
});
