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
    padding: 15, // Увеличаваме padding за по-добро докосване
    borderRadius: 10,
    marginBottom: 5,
    borderWidth: 1, // Леко очертаване
    borderColor: '#5a7b10',
  },
  regionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff', // Бял текст за по-добър контраст
  },
  groupsContainer: {
    paddingLeft: 15,
    paddingTop: 5, // Леко разстояние преди групите
  },
  groupLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#A2C42C', // По-светъл нюанс за групите
    padding: 12, // Увеличен padding за по-добра интеракция
    borderRadius: 10,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#8BA726',
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#242c0f',
  },
  membersContainer: {
    backgroundColor: '#D9E88A',
    padding: 12,
    borderRadius: 10,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#a2c42c',
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
    borderBottomColor: '#6F8F20',
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
  noGroupsText: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
    padding: 10,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#558b2f',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  addButtonText: {
    fontSize: 18,
    color: 'white',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalLabel: {
    fontSize: 16,
    alignSelf: 'flex-start',
    marginBottom: 5,
    fontWeight: 'bold',
    color: '#5a7b10',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#ccc',
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  regionList: {
    maxHeight: 200,
    width: '100%',
  },
  regionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#f1f8e9',
    borderRadius: 5,
    marginBottom: 3,
  },
  regionText: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '500',
  },
  selectedRegion: {
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#1b5e20',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#145214',
  },
  groupContainer: {
    marginBottom: 10,
    backgroundColor: "#f8f8f8",
    padding: 10,
    borderRadius: 8,
  },
  
  groupRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  groupIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  
  menuContainer: {
    position: "absolute",
    top: 0,
    right: 10,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
    padding: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
},
menuText: {
    marginLeft: 5,
    fontSize: 16,
    color: "#333",
},
modalContainer: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},

picker: {
  width: '100%',
  backgroundColor: '#f1f1f1',
  borderRadius: 8,
  marginVertical: 5,
},

checkboxContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginVertical: 10,
},

modalButtonsContainer: {
  width: "100%",
  flexDirection: "row",
  justifyContent: "space-between",
  position: "absolute",
  bottom: 20,
  left: 0,
  right: 0,
  paddingHorizontal: 20,
},
confirmButton: {
  backgroundColor: "#2e7d32",
  padding: 12,
  borderRadius: 8,
  width: "48%",
  alignItems: "center",
  marginLeft:20,
},

closeButton: {
  backgroundColor: "gray",
  padding: 12,
  borderRadius: 8,
  width: "48%",
  alignItems: "center",
  marginLeft:20,
},

confirmButtonText: {
  color: "white",
  fontSize: 16,
  fontWeight: "bold",
  textAlign: "center",
},

closeButtonText: {
  color: "white",
  fontSize: 16,
  fontWeight: "bold",
  textAlign: "center",
},

profilePictureContainer: {
  alignSelf: "center",
  marginVertical: 10,
},

profilePicture: {
  width: 120,
  height: 120,
  borderRadius: 60,
  borderWidth: 2,
  borderColor: "#4CAF50",
},

deleteButton: {
  backgroundColor: "#d32f2f",
  paddingVertical: 10,
  paddingHorizontal: 15,
  borderRadius: 8,
  alignItems: "center",
  width: "80%",
  alignSelf: "center",
  marginTop: 10,
},

keyboardAvoidingContainer: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
},

modalScroll: {
  flex: 1, 
  width: "100%",
  maxHeight: "80%",
},

bioInput: {
  width: "100%",
  padding: 10,
  borderWidth: 1,
  borderRadius: 5,
  borderColor: "#ccc",
  backgroundColor: "#f9f9f9",
  textAlignVertical: "top",
  minHeight: 80,
  maxHeight: 150,
},

modalContent: {
  backgroundColor: "#fff",
  padding: 20,
  borderRadius: 10,
  width: "90%",
  maxHeight: "75%",
  flex: 1, 
  alignItems: "center",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.3,
  shadowRadius: 5,
  elevation: 5,
},

dateContainer: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  marginBottom: 10,
},

datePickerButton: {
  backgroundColor: "#4CAF50",
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 8,
  alignItems: "center",
},

datePickerButtonText: {
  color: "white",
  fontSize: 14,
  fontWeight: "bold",
},
addEquipmentButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#1976D2',
  padding: 12,
  borderRadius: 10,
  justifyContent: 'center',
  marginVertical: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 3,
  elevation: 3,
},

addEquipmentButtonText: {
  fontSize: 18,
  color: 'white',
  marginLeft: 5,
  fontWeight: 'bold',
},
});
