import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)', // Още по-прозрачен фон зад модала
    },
    modalContent: {
        width: '90%',
        backgroundColor: '#5D6B33', // Камуфлажно кафеникаво-зелен фон
        padding: 20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 8,
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 10,
        borderRadius: 50,
        backgroundColor: '#B71C1C', // По-контрастен червен цвят за видимост
        zIndex: 10, // Уверява се, че бутонът е най-отгоре
    },
    closeIcon: {
        color: '#FFF',
        fontSize: 22,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3B4721', // По-тъмен нюанс на зелено за контраст
        padding: 10,
        borderRadius: 10,
        width: '100%',
    },
    profilePicture: {
        width: 80,
        height: 80,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#FFD700', // Златен бордър
    },
    nameContainer: {
        marginLeft: 15,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFD700', // Златен текст за контраст
    },
    userEmail: {
        fontSize: 14,
        color: '#CCC',
        marginTop: 3,
    },
    detailsContainer: {
        marginTop: 10,
    },
    infoCard: {
        backgroundColor: '#6B8E23', // Зеленикаво-кафяв цвят за контраст с текста
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#3E4D1C',
        elevation: 3,
    },
    infoLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF', // Бял текст за контраст
    },
    infoText: {
        fontSize: 16,
        color: '#EEE',
    },
      bioCard: {
        backgroundColor: '#FFCC80',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        width: '100%',
      },
      bioLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#5D4037',
      },
      bioText: {
        fontSize: 16,
        color: '#4E342E',
      },
    
      /** DOG INFO */
      dogCard: {
        backgroundColor: '#C5E1A5', // Зелен нюанс
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        width: '100%',
      },
      dogLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2E7D32',
      },
      dogText: {
        fontSize: 16,
        color: '#1B5E20',
      },
    
      /** HUNTING LICENSE */
      licenseCard: {
        backgroundColor: '#80DEEA', // Светлосин нюанс
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        width: '100%',
      },
      licenseLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#006064',
      },
      licenseText: {
        fontSize: 16,
        color: '#004D40',
      },
    
      /** HUNTING NOTES */
      notesCard: {
        backgroundColor: '#FFAB91', // Червен нюанс
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        width: '100%',
      },
      notesLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#D84315',
      },
      notesText: {
        fontSize: 16,
        color: '#BF360C',
      },
    
      /** EQUIPMENT */
      equipmentCard: {
        backgroundColor: '#A1887F', // Кафяв нюанс за оръжие
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        width: '100%',
      },
      equipmentLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4E342E',
      },
      equipmentText: {
        fontSize: 16,
        color: '#3E2723',
      },
      emailCard: {
        backgroundColor: '#2E7D32', // Тъмен зелен фон за контраст
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
        width: '100%',
      },
      emailLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff', // Бял цвят за контраст
      },
      emailText: {
        fontSize: 18,
        color: '#FFEB3B', // Жълтеникав текст за по-добра видимост
        fontWeight: 'bold',
        marginTop: 4,
      },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6B8E23', // Тъмнозелен фон
        padding: 10,
        borderRadius: 10,
        width: '100%',
        justifyContent: 'center',
        marginBottom: 15,
    },
    modalProfilePicture: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#FFD700', // Златен бордър
        marginRight: 10,
    },
    modalUserName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFD700', // Златен текст
    },
    sectionContainer: {
        width: '100%',
        backgroundColor: '#556B2F', // Тъмнозелен фон за секциите
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 5,
    },
    sectionText: {
        fontSize: 16,
        color: '#EEE',
    },
    bioContainer: {
        width: '100%',
        backgroundColor: '#808000', // Маслинен фон
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
    },
    equipmentItem: {
        backgroundColor: '#8F9779', // Камуфлажен сивкав фон
        padding: 8,
        borderRadius: 8,
        marginBottom: 5,
    },
});