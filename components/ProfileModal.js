import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import PropTypes from 'prop-types';
import { getDoc, doc } from 'firebase/firestore';
import { firestore, auth } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import styles from '../src/styles/ProfileModalStyles';

const roleColors = {
  chairman: "#2E7D32",
  secretary: "#558B2F",
  member: "#6D4C41",
  hunter: "#EF6C00",
  guest: "#BDBDBD",
};

const ProfileModal = ({ userId, visible, onClose }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUserId = auth.currentUser?.uid;
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [modalVisible, setModalVisible] = useState(visible); // Дебоунс механизъм

  useEffect(() => {
    let timeout;
    if (visible) {
      timeout = setTimeout(() => setModalVisible(true), 150); // Малко забавяне за плавност
    } else {
      setModalVisible(false);
    }
    return () => clearTimeout(timeout);
  }, [visible]);

  useEffect(() => {
    if (!userId || !modalVisible) return;

    const fetchUserData = async () => {
      setLoading(true);
      try {
        const userRef = doc(firestore, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      } catch (error) {
        console.error('❌ Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, modalVisible]);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchCurrentUserRole = async () => {
      try {
        const currentUserRef = doc(firestore, 'users', currentUserId);
        const currentUserSnap = await getDoc(currentUserRef);

        if (currentUserSnap.exists()) {
          const userData = currentUserSnap.data();
          const userRoles = userData.roles || ["hunter"];

          const roleHierarchy = ["guest", "hunter", "member", "secretary", "chairman", "admin"];
          const highestRole = userRoles.reduce((highest, role) => {
            return roleHierarchy.indexOf(role) > roleHierarchy.indexOf(highest) ? role : highest;
          }, "guest");

          setCurrentUserRole(highestRole);
        }
      } catch (error) {
        console.error("❌ Грешка при извличане на ролята на текущия потребител:", error);
      }
    };
    fetchCurrentUserRole();
  }, [currentUserId]);

  const getFilteredData = () => {
    if (!userData || !currentUserRole) return {};

    if (currentUserRole === 'admin' || currentUserRole === 'chairman') {
      return userData;
    }

    const { firstName, lastName, bio, profilePicture, huntingLicense, huntingNotes, equipment, dogBreed, email, isGroupHunting, isSelectiveHunting } = userData;

    if (currentUserRole === 'secretary') {
      return { firstName, lastName, bio, profilePicture, huntingLicense, huntingNotes, dogBreed, email, equipment, isGroupHunting, isSelectiveHunting };
    }

    if (currentUserRole === 'member') {
      return { firstName, lastName, bio, profilePicture, dogBreed };
    }

    return { firstName, lastName, bio, profilePicture };
  };

  const filteredData = getFilteredData();
  const nameColor = roleColors[currentUserRole] || "#000";

  return (
    <Modal visible={modalVisible} transparent animationType="fade">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color="#FFD700" />
          ) : (
            <>
              <View style={styles.headerContainer}>
                {filteredData.profilePicture ? (
                  <Image source={{ uri: filteredData.profilePicture }} style={styles.profilePicture} />
                ) : (
                  <Ionicons name="person-circle" size={80} color="gray" />
                )}

                <View style={styles.nameContainer}>
                  <Text style={[styles.userName, { color: nameColor }]}>
                    {filteredData.firstName} {filteredData.lastName}
                  </Text>
                  {filteredData.email && (
                    <Text style={styles.userEmail}>{filteredData.email}</Text>
                  )}
                </View>
              </View>

              <View style={styles.detailsContainer}>
                {filteredData.bio && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>📜 Описание</Text>
                    <Text style={styles.infoText}>{filteredData.bio}</Text>
                  </View>
                )}

                {filteredData.dogBreed && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>🐕 Куче</Text>
                    <Text style={styles.infoText}>{filteredData.dogBreed}</Text>
                  </View>
                )}

                {/* ЛИЦЕНЗ - Групов лов и Подборен лов */}
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>🛡️ Лиценз</Text>
                  <Text style={styles.infoText}>
                    Групов лов - {filteredData.isGroupHunting ? "✅ Разрешен" : "❌ Не е разрешен"}
                  </Text>
                  <Text style={styles.infoText}>
                    Подборен лов - {filteredData.isSelectiveHunting ? "✅ Разрешен" : "❌ Не е разрешен"}
                  </Text>
                </View>

                {/* Ловен билет */}
                {filteredData.huntingLicense && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>🎯 Ловен билет</Text>
                    <Text style={styles.infoText}>
                      {filteredData.huntingLicense.start} - {filteredData.huntingLicense.end}
                    </Text>
                  </View>
                )}

                {/* Ловна бележка */}
                {filteredData.huntingNotes && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>📖 Ловна бележка</Text>
                    <Text style={styles.infoText}>
                      {filteredData.huntingNotes.start} - {filteredData.huntingNotes.end}
                    </Text>
                  </View>
                )}

                {filteredData.equipment && filteredData.equipment.length > 0 && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>🔫 Снаряжение</Text>
                    {filteredData.equipment.map((item, index) => (
                      <Text key={index} style={styles.infoText}>
                        {item.name} {item.model} ({item.caliber}) - {item.type}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

ProfileModal.propTypes = {
  userId: PropTypes.string.isRequired,
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ProfileModal;
