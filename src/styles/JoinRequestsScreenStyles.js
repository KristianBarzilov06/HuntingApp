import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3A3F32',
    padding: 15,
  },
  header: {
    width: '120%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A3B1F',
    paddingVertical: 10,
    paddingTop: 40,
    marginHorizontal: -15,
    marginTop: -15,
    paddingHorizontal: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E272E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    color: '#FFF',
    fontSize: 24,
  },
  headerTitle: {
    flex: 1,
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  noRequestsText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#757575',
    textAlign: 'center',
    marginTop: 20,
  },
  requestsList: {
    paddingBottom: 20,
  },
  requestItem: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginVertical: 10,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  requestText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 0.48,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ── Модален стил ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  userInfo: {
    marginBottom: 15,
    alignItems: 'center',
  },
  // Стилове за полетата в модала – зеленикаво камуфлажен контейнер
  modalFieldContainer: {
    backgroundColor: '#556B2F',
    padding: 8,
    borderRadius: 8,
    marginVertical: 5,
    width: '100%',
  },
  modalFieldText: {
    color: '#FFF',
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalButton: {
    flex: 0.45,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalClose: {
    marginTop: 15,
  },
  modalCloseText: {
    color: '#007BFF',
    fontSize: 16,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
});
