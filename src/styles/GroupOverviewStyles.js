import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3e4c2f',
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 35,
    zIndex: 9,
    backgroundColor: 'transparent',
  },
  backButton: {
    marginRight: 10,
  },
  sortButton: {
    backgroundColor: '#6b9b3b',
    padding: 6,
    borderRadius: 20,
    marginLeft: 'auto',
  },
  sortMenuContainer: {
    position: 'absolute',
    top: 70,
    right: 10,
    backgroundColor: '#4e6830',
    borderRadius: 8,
    padding: 10,
    zIndex: 99,
    width: 160,
  },
  sortMenuTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginVertical: 5,
  },
  sortMenuItem: {
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRadius: 5,
  },
  sortMenuItemSelected: {
    backgroundColor: '#6b9b3b',
  },
  sortMenuItemText: {
    color: '#fff',
    fontSize: 14,
  },
  groupImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250, // височината на груповата снимка – можеш да я регулираш
    zIndex: 0,
  },
  groupImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changePictureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6b9b3b',
    padding: 8,
    borderRadius: 20,
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  changePictureButtonText: {
    color: '#fff',
    marginLeft: 5,
  },
 groupNameText: {
   fontSize: 22,
   color: '#fff',
   fontWeight: 'bold',
 },
  membersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    marginBottom: 5,
  },
  membersTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  searchInput: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#5b6e44',
    borderRadius: 10,
    color: '#fff',
  },
  membersContainer: {
    flex: 1,
    backgroundColor: '#5b6e44',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  membersList: {
    marginTop: 5,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    borderRadius: 20, // Заобляме всички ъгли
  },
  memberProfileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#aaa',
    marginRight: 10,
  },
  defaultProfileIcon: {
    marginRight: 10,
  },
  memberTextContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  memberName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberRole: {
    color: '#fff',
    fontSize: 14,
  },
  groupProfileContainer: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 200, // или височината, която желаеш
  zIndex: 0,
},
groupProfileImage: {
  width: '100%',
  height: '100%',
  resizeMode: 'cover',
},
});
