import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { getFirestore, collection, getDocs } from "firebase/firestore";
import styles from '../src/styles/AdminPanelStyles'; 

const AdminPanel = ({ navigation, route }) => {
  const { userEmail } = route.params || {}; 
  const [searchQuery, setSearchQuery] = useState('');
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);

  // Зарежда всички региони и групи от Firebase
  const fetchRegionsAndGroups = async () => {
    const db = getFirestore();
    const groupsCollection = collection(db, "groups");
    const querySnapshot = await getDocs(groupsCollection);

    const data = {};
    
    querySnapshot.forEach((doc) => {
      const groupData = doc.data();
      if (!data[groupData.region]) {
        data[groupData.region] = [];
      }
      data[groupData.region].push({ id: doc.id, ...groupData });
    });

    setRegions(Object.keys(data));
    setGroups(data);
  };

  // Зарежда потребителите в дадена група
  const fetchGroupMembers = async (groupId) => {
    const db = getFirestore();
    const groupRef = collection(db, "groups", groupId, "members");
    const querySnapshot = await getDocs(groupRef);
  
    const members = [];
    querySnapshot.forEach((doc) => {
      const memberData = doc.data();
      members.push({ id: doc.id, email: memberData.email, role: memberData.role });
    });
  
    setGroupMembers(members);
  };

  // Търсене на регион
  const handleSearch = (text) => {
    setSearchQuery(text);
    const filteredRegions = Object.keys(groups).filter(region =>
      region.toLowerCase().includes(text.toLowerCase())
    );
    setRegions(filteredRegions);
  };

  const resetSearch = () => {
    setSearchQuery('');
    fetchRegionsAndGroups();
  };

  // Отваряне/затваряне на регион
  const toggleRegion = (region) => {
    if (selectedRegion === region) {
      setSelectedRegion(null);
      setSelectedGroup(null);
      setGroupMembers([]);
    } else {
      setSelectedRegion(region);
      setSelectedGroup(null);
      setGroupMembers([]);
    }
  };

  // Отваряне/затваряне на група и зареждане на потребители
  const toggleGroup = async (group) => {
    if (selectedGroup === group.id) {
      setSelectedGroup(null);
      setGroupMembers([]);
    } else {
      setSelectedGroup(group.id);
      await fetchGroupMembers(group.id);
    }
  };

  // Зарежда регионите и групите при стартиране
  React.useEffect(() => {
    fetchRegionsAndGroups();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile', { userEmail })}>
          <Ionicons name="person-circle-outline" size={40} color="black" />
          <Text style={styles.profileText}>Профил</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Търсене по регион..."
          placeholderTextColor="black"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity>
          <Ionicons name="search" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.listContainer}>
        {regions.map(region => (
          <View key={region}>
            <TouchableOpacity style={styles.regionLabel} onPress={() => toggleRegion(region)}>
              <Text style={styles.regionTitle}>{region}</Text>
              <Ionicons name={selectedRegion === region ? "arrow-up" : "arrow-down"} size={20} color="black" />
            </TouchableOpacity>

            {selectedRegion === region && (
              <View style={styles.groupsContainer}>
                {groups[region].map(group => (
                  <View key={group.id}>
                    <TouchableOpacity style={styles.groupLabel} onPress={() => toggleGroup(group)}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <Ionicons name={selectedGroup === group.id ? "arrow-up" : "arrow-down"} size={20} color="black" />
                    </TouchableOpacity>

                    {selectedGroup === group.id && (
                      <View style={styles.membersContainer}>
                        <Text style={styles.groupTitle}>Потребители:</Text>
                        {groupMembers.length > 0 ? (
                          groupMembers.map((member, index) => (
                            <View key={index} style={styles.memberItem}>
                              <Text style={styles.memberEmail}>{member.email}</Text>
                              <Text style={styles.memberRole}>{member.role}</Text>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.noMembersText}>Няма потребители</Text>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {searchQuery.length > 0 && (
        <TouchableOpacity style={styles.resetButton} onPress={resetSearch}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      )}
    </View>
  );
};

AdminPanel.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      userEmail: PropTypes.string.isRequired,
    }),
  }).isRequired,
};

export default AdminPanel;
