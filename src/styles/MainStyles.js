import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#334603', // Тъмно зелено
    padding: 15,
    paddingTop: 35,
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
    color: '#242c0f', // Тъмно зелено
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#D9D9D9',
    padding: 5,
    borderWidth: 1,
    borderColor: '#ffffff',
    borderRadius: 5,
  },
  groupList: {
    marginTop: 10,
    paddingRight: 10,
  },
  listContainer: {
    backgroundColor: '#8FBA1D', 
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 10,
    padding: 10,
    position: 'relative', // For positioning the reset button
  },
  resetButton: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: '#fff', // Optional background for the button
    borderRadius: 10,
    padding: 5,
    elevation: 2, // Add some elevation for better visibility
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
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  groupChairman: {
    fontSize: 12,
    color: 'black',
  },
  joinButton: {
    backgroundColor: '#242c0f',
    padding: 10,
    borderRadius: 10,
  },
  joinButtonText: {
    color: '#ffb400',
    fontSize: 16,
  },
});