import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#334603', // Тъмно зелено като основен фон
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
    color: '#D9D9D9', // Светъл текст за контраст
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#D9D9D9',
    padding: 8,
    borderWidth: 1,
    borderColor: '#ffffff',
    borderRadius: 8,
  },
  listContainer: {
    backgroundColor: '#8FBA1D', // Светло зелено за панела
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 10,
    padding: 10,
    position: 'relative',
  },
  regionLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6F8F20', // Тъмнозелено за регионите
    padding: 12,
    borderRadius: 10,
    marginBottom: 5,
  },
  regionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff', // Бял текст за по-добър контраст
  },
  groupsContainer: {
    paddingLeft: 15,
  },
  groupLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#A2C42C', // По-светъл нюанс за групите
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#242c0f', // Тъмен текст за четимост
  },
  membersContainer: {
    backgroundColor: '#D9E88A', // Светло зелено за потребителския списък
    padding: 10,
    borderRadius: 10,
    marginTop: 5,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#242c0f',
    marginBottom: 5,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#6F8F20', // Линия за разделяне
  },
  memberEmail: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334603',
  },
  memberRole: {
    fontSize: 14,
    color: '#242c0f',
  },
  noMembersText: {
    fontSize: 14,
    color: 'red',
    textAlign: 'center',
  },
  resetButton: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 8,
    elevation: 2,
  },
});
