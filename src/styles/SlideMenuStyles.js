// SlideMenuStyles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8bc34a',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  profileContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  profileText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  menuContainer: {
    marginTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
  },
  menuText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  notificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  notificationText: {
    fontSize: 12,
    color: '#FF4500',
    marginRight: 5,
  },
  badge: {
    backgroundColor: '#FF4500',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
