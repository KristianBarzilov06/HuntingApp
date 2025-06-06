import { StyleSheet, Platform } from 'react-native';

export default StyleSheet.create({
  dogCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 10,
    padding: 10,
    // Сенки
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dogCardTouchArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dogPicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
  },
  dogHeaderInfo: {
    flex: 1,
  },
  dogActions: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  /* Детайлен модал */
  dogDetailsModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dogDetailsModalContent: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  dogPictureModal: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  editDogButton: {
    marginTop: 15,
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  editDogButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dogSection: {
    marginVertical: 15,
    paddingHorizontal: 15,
  },
  dogContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  dogInfo: {
    flex: 1,
  },
  dogNameText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dogBreedText: {
    fontSize: 14,
    color: '#555',
  },
  dogCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dogCardBody: {
    marginLeft: 10,
  },
  addDogButton: {
    backgroundColor: '#8FBA1D',
    padding: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },
  addDogButtonText: {
    color: 'white',
    fontSize: 16,
  },
  // Модал за куче
  dogModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dogModalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  dogModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dogModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dogPictureContainer: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dogInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  dogPicker: {
    marginBottom: 20,
  },
  dogModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dogCancelButton: {
    backgroundColor: '#c0392b',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
  },
  dogCancelButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  dogSaveButton: {
    backgroundColor: '#8FBA1D',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
  },
  dogSaveButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B5E20',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  profileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B5E20',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileDetailsContainer: {
    backgroundColor: '#16321c',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1B5E20',
  },
  
  datePickerButton: {
    backgroundColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  sectionContainer: {
    backgroundColor: '#2E7D32',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    paddingBottom: 5,
  },
  sectionText: {
    fontSize: 16,
    color: '#f5f5f5',
    marginBottom: 10,
  },
  // Галерия в компактния изглед
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  openGalleryButton: {
    backgroundColor: '#8FBA1D',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  openGalleryButtonText: {
    color: 'white',
    fontSize: 14,
  },
  galleryMediaItem: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginRight: 15,
  },
  // Модал за пълноекранната галерия
  fullScreenGalleryContainer: {
    flex: 1,
    backgroundColor: '#4B5320', // Камуфлажно зелено
  },
  fullScreenModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  fullScreenModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  fullScreenGalleryCloseButton: {
  },
  sortButtonContainer: {
    padding: 10,
    backgroundColor: '#3E522C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sortButton: {
    backgroundColor: '#8FBA1D',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  sortButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  sortMenuContainer: {
    backgroundColor: '#6B8E23',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
    alignSelf: 'center',
    width: '80%',
  },
  sortMenuTitle: {
    fontSize: 12,
    color: '#fff',
    marginBottom: 5,
  },
  sortMenuItem: {
    padding: 5,
    borderRadius: 3,
    marginBottom: 5,
  },
  sortMenuItemSelected: {
    backgroundColor: '#8FBA1D',
  },
  sortMenuItemText: {
    fontSize: 12,
    color: '#fff',
  },
  fullScreenGalleryContent: {
    padding: 10,
    paddingTop: 10,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  galleryGridItem: {
    width: '48%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 5,
    backgroundColor: '#3E522C', // По-тъмен зелен фон за контраст
  },
  galleryGridMedia: {
    width: '100%',
    height: 150,
    borderRadius: 5,
  },
  gridItemInfoText: {
    fontSize: 10,
    color: '#fff',
    textAlign: 'center',
    marginTop: 5,
  },
  // Модал за пълноекранно преглеждане на избраната медия
  fullScreenMediaViewContainer: {
    flex: 1,
    backgroundColor: '#4B5320',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenMediaCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  fullScreenMediaView: {
    width: '100%',
    height: '80%',
  },
  mediaInfoText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 10,
    textAlign: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  scrollContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  userDetails: {
    flex: 1,
    marginLeft: 15,
  },
  nameInput: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff',
    marginBottom: 5,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#cccccc',
    marginLeft: 5,
  },
  input: {
    fontSize: 16,
    color: '#444',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  licenseContainer: {
    marginBottom: 15,
  },
  equipmentContainer: {
    backgroundColor: '#e0e0d1',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  equipmentIcon: {
    marginRight: 8,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#c0392b',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginLeft: 'auto',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8FBA1D',
    padding: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: '#334603',
    marginBottom: 15,
  },
  editButton: {
    backgroundColor: '#8FBA1D',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  editButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    width: '80%',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#334603',
    marginBottom: 15,
    textAlign: 'center',
  },
  weaponItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  galleryImage: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 8,
  },
  galleryContainer: {
    marginVertical: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
  fullScreenMediaContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenMedia: {
    width: '100%',
    height: '100%',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  checkboxLabel: {
    marginLeft: 5,
    fontSize: 16,
    color: '#333',
  },
  dogLabel: {
    fontSize: 16,
    color: '#000',
    marginVertical: 5,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  userPhone: {
    fontSize: 16,
    color: '#ccc',
    marginLeft: 5,
  },
});
