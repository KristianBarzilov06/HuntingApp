import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import ChatScreen from './ChatScreen'; // Използваме съществуващия ChatScreen без промени
import styles from '../src/styles/ChatStyles';

const MarketplaceChatScreenWrapper = ({ navigation, route }) => {
    const { groupName, adImage, sellerName } = route.params;
    const [groupInfoModalVisible, setGroupInfoModalVisible] = useState(false);

    const openGroupInfoModal = () => setGroupInfoModalVisible(true);
    const closeGroupInfoModal = () => setGroupInfoModalVisible(false);

    // Подаваме hideHeader: true към ChatScreen, за да не се показва неговият хедър
    const modifiedRoute = {
        ...route,
        params: {
            ...route.params,
            hideHeader: true,
        },
    };

    return (
        <View style={{ flex: 1 }}>
            {/* Специализиран header за marketplace чатове (без профилна снимка) */}
            <View style={styles.marketplaceHeader}>
                <TouchableOpacity onPress={() => navigation.navigate('Marketplace')} style={styles.marketplaceBackButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={openGroupInfoModal} style={styles.marketplaceHeaderTitleContainer}>
                    <Text style={styles.marketplaceHeaderTitle} numberOfLines={1}>
                        {groupName}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Използваме съществуващия ChatScreen, като подаваме hideHeader: true */}
            <ChatScreen {...{ navigation }} route={modifiedRoute} />

            {/* Модал със списък от участници – над участниците се показва снимката на обявата */}
            <Modal
                visible={groupInfoModalVisible}
                transparent
                animationType="slide"
                onRequestClose={closeGroupInfoModal}
            >
                <View style={styles.groupInfoModalContainer}>
                    <View style={styles.groupInfoModalContent}>
                        {adImage ? (
                            <Image source={{ uri: adImage }} style={styles.groupInfoImage} />
                        ) : (
                            <Ionicons name="image" size={60} color="gray" />
                        )}
                        <Text style={styles.groupInfoTitle}>{groupName}</Text>
                        <View style={styles.groupMembersContainer}>
                            <View style={styles.groupMember}>
                                <Text style={styles.groupMemberRole}>Продавач</Text>
                                <Text style={styles.groupMemberName}>{sellerName || "Продавач"}</Text>
                            </View>
                            <View style={styles.groupMember}>
                                <Text style={styles.groupMemberRole}>Куповач</Text>
                                <Text style={styles.groupMemberName}>Вие</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={closeGroupInfoModal} style={styles.groupInfoCloseButton}>
                            <Text style={styles.groupInfoCloseButtonText}>Затвори</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

MarketplaceChatScreenWrapper.propTypes = {
    navigation: PropTypes.object.isRequired,
    route: PropTypes.shape({
        params: PropTypes.shape({
            groupName: PropTypes.string.isRequired,
            adImage: PropTypes.string,
            sellerName: PropTypes.string.isRequired,
            // Другите параметри, които се използват от ChatScreen
        }).isRequired,
    }).isRequired,
};

export default MarketplaceChatScreenWrapper;
