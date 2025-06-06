import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#3A3F32',
    paddingBottom: 80,
    paddingHorizontal: 15,
  },
  /* -------------- HEADER -------------- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A3B1F',
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 10,
    elevation: 6,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#76A325',
    padding: 8,
    borderRadius: 20,
  },

  /* -------------- SORT -------------- */
  sortContainer: {
    backgroundColor: '#2A3B1F',
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButtonText: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 5,
  },
  sortMenuContainer: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 10,
  },
  sortMenuTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sortMenuItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#555',
    borderRadius: 8,
    marginBottom: 8,
  },
  sortMenuItemSelected: {
    backgroundColor: '#76A325',
  },
  sortMenuItemText: {
    color: '#FFF',
    fontSize: 16,
  },

  /* -------------- MODAL -------------- */
  modalCenteredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    backgroundColor: '#1E1E1E',
    padding: 25,
    borderRadius: 12,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },

  /* -------------- FORM -------------- */
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#555',
    borderRadius: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#76A325',
  },
  categoryText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  label: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#555',
    color: '#FFF',
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#333',
  },
  imagePickerButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  imagePickerText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  uploadedImage: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 15,
    borderRadius: 10,
  },
  submitButton: {
    backgroundColor: '#27ae60',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#D9534F',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  /* -------------- ADS LIST -------------- */
  noAdsText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
  },

  /* -------------- SINGLE AD (CARD) -------------- */
  adCard: {
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    marginHorizontal: 15,
    marginVertical: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  adFooterRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    maxWidth: 150,
  },
  adEditButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 5,
    flexShrink: 1,
  },
  adEditButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    flexShrink: 1,
  },
  adHeader: {
    backgroundColor: '#A1A251',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  adHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  adHeaderDate: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
  adImageContainer: {
    backgroundColor: '#CED095',
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
  },
  adImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  /* Ред за описание + детайли */
  adDetailsRow: {
    flexDirection: 'row',
  },
  adDescriptionBox: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 10,
  },
  adDescriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000',
  },
  adDescriptionText: {
    fontSize: 14,
    color: '#333',
  },
  adInfoBox: {
    flex: 1,
    backgroundColor: '#CED095',
    padding: 10,
    justifyContent: 'center',
  },
  adInfoLine: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  adPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#76A325',
    marginTop: 10,
  },

  /* Footer: потребител, телефон, бутон */
  adFooter: {
    backgroundColor: '#D9D9D9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  adUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adUserProfilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  adUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    flexShrink: 1,
  },
  adUserGroup: {
    fontSize: 14,
    color: '#333',
    flexShrink: 1,
  },
  adUserPhone: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  adMessageButton: {
    backgroundColor: '#76A325',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 5,
  },
  adMessageButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },

  /* Чат модал */
  chatListModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    justifyContent: 'center',
  },
  chatListModalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  chatListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A3B1F',
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
  },
  chatListItemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatListProfilePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  chatListTextContainer: {
    flex: 1,
  },
  chatListAdTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatListSellerName: {
    color: '#ccc',
    fontSize: 14,
  },
  chatListOpenButton: {
    backgroundColor: '#76A325',
    padding: 10,
    borderRadius: 10,
  },
  chatListCloseButton: {
    backgroundColor: '#D9534F',
    padding: 10,
    borderRadius: 10,
    marginTop: 15,
    alignSelf: 'center',
  },
  chatListCloseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatListDeleteButton: {
    backgroundColor: '#D9534F',
    padding: 10,
    borderRadius: 10,
    marginLeft: 10,
  },

  /* Плаващ бутон за създаване */
  createAdButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#27ae60',
    borderRadius: 30,
    padding: 15,
    zIndex: 100,
  },

  /* -------------- TOGGLE (Изгубено / Намерено) -------------- */
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 14,
    marginHorizontal: 5,
    backgroundColor: '#555',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#76A325',
  },
  toggleText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});
