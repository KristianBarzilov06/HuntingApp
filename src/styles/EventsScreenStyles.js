import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3A3F32', // Тъмно зелено-сив фон
    paddingLeft: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A3B1F', // Тъмно-зеленикаво-кафяв
    paddingBottom: 20,
    padding: 15,
    zIndex: 9,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    marginLeft: 10,
    marginTop: 30,
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  
  participantRoleText: {
    fontSize: 14,
    fontWeight: 'bold',
  }, // Цветът ще бъде задаван динамично
  
  weaponContainer: {
    marginTop: 8,
  },
  
  weaponTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  
  weaponText: {
    fontSize: 14,
    color: '#666',
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  
  eventTypeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  
  eventInfo: {
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  eventDescription: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  
  eventLocation: {
    fontSize: 16,
    color: '#757575',
    marginLeft: 10,
  },
  
  eventDate: {
    fontSize: 16,
    color: '#757575',
    marginLeft: 10,
  },
  
  eventHuntType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    marginLeft: 10,
  },
  
  participantsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  
  participantItem: {
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  participantRoleBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  }, 
  noParticipants: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#757575',
    textAlign: 'center',
    marginTop: 10,
  },
  
  cancelButton: {
    backgroundColor: '#D9534F',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  
  cancelButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#76A325',  // Ярък зелено-жълт цвят
    padding: 14,
    borderRadius: 12,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  eventItem: {
    backgroundColor: '#FFF',
    padding: 15,
    marginVertical: 10,
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#E8F5E9',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D4A0D',
  },
  eventDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  deleteButton: {
    backgroundColor: '#FF5C5C',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 12,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: '#1E1E1E',
    padding: 25,
    borderRadius: 12,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  participantInfo: {
    flexDirection: 'column',
    flex: 1,
  },
  participantRole: {
    fontSize: 14,
    color: '#EEE', // По-светъл текст за контраст
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#76A325',
    borderColor: '#76A325',
  },
  datePickerButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  datePickerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedDatesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  locationInput: {
    marginTop: 20,
  },
  input: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#555',
    color: '#FFF',
  },
  pickerContainer: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#555',
  },
  picker: {
    color: '#FFF',
  },
  selectedDatesContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#292929',
    borderRadius: 8,
  },
  selectedDateItem: {
    fontSize: 14,
    marginBottom: 5,
    padding: 8,
    backgroundColor: '#444',
    borderRadius: 5,
    textAlign: 'center',
    color: '#FFF',
  },
});
