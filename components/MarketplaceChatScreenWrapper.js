import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import ChatScreen from './ChatScreen';
import { getAuth } from 'firebase/auth';
import { firestore } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import styles from '../src/styles/ChatStyles';

const MarketplaceChatScreenWrapper = ({ navigation, route }) => {
    const auth = getAuth();
    const currentUserId = auth.currentUser.uid;

    // Вземаме от route параметрите: име на групата, снимка, Id-та и предварително предаденото buyerFirstName (ако има)
    const { groupName, adImage, sellerId, buyerId, buyerFirstName } = route.params;

    const [sellerData, setSellerData] = useState(null);
    const [buyerData, setBuyerData] = useState(null);
    const [groupInfoModalVisible, setGroupInfoModalVisible] = useState(false);

    // Зареждаме данните на продавача
    useEffect(() => {
        const fetchSellerData = async () => {
            try {
                const sellerDoc = await getDoc(doc(firestore, 'users', sellerId));
                if (sellerDoc.exists()) {
                    setSellerData(sellerDoc.data());
                }
            } catch (error) {
                console.error('Error fetching seller data:', error);
            }
        };
        fetchSellerData();
    }, [sellerId]);

    // Зареждаме данните на купувача (ако buyerId е наличен)
    useEffect(() => {
        if (buyerId) {
            const fetchBuyerData = async () => {
                try {
                    const buyerDoc = await getDoc(doc(firestore, 'users', buyerId));
                    if (buyerDoc.exists()) {
                        setBuyerData(buyerDoc.data());
                    }
                } catch (error) {
                    console.error('Error fetching buyer data:', error);
                }
            };
            fetchBuyerData();
        }
    }, [buyerId]);

    console.log("currentUserId", currentUserId);
    console.log("sellerId", sellerId);
    console.log("buyerId", buyerId);

    const sellerDisplayName = (String(currentUserId) === String(sellerId))
        ? "Вие"
        : (sellerData?.firstName || "Продавач");

    const buyerDisplayName = (String(currentUserId) === String(buyerId))
        ? "Вие"
        : (buyerData?.firstName || buyerFirstName || "Купувач");

    const openGroupInfoModal = () => setGroupInfoModalVisible(true);
    const closeGroupInfoModal = () => setGroupInfoModalVisible(false);

    // Подаваме hideHeader: true към ChatScreen, така че неговият header да не се показва
    const modifiedRoute = {
        ...route,
        params: {
            ...route.params,
            hideHeader: true,
        },
    };

    return (
        <View style={{ flex: 1 }}>
            {/* Header за marketplace чатове */}
            <View style={styles.marketplaceHeader}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Marketplace')}
                    style={styles.marketplaceBackButton}
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={openGroupInfoModal}
                    style={styles.marketplaceHeaderTitleContainer}
                >
                    <Text style={styles.marketplaceHeaderTitle} numberOfLines={1}>
                        {groupName}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ChatScreen с модифицираните параметри */}
            <ChatScreen navigation={navigation} route={modifiedRoute} />

            {/* Модал със списък от участници */}
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
                                <Text style={styles.groupMemberName}>{sellerDisplayName}</Text>
                            </View>
                            <View style={styles.groupMember}>
                                <Text style={styles.groupMemberRole}>Купувач</Text>
                                <Text style={styles.groupMemberName}>{buyerDisplayName}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={closeGroupInfoModal}
                            style={styles.groupInfoCloseButton}
                        >
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
            sellerId: PropTypes.string.isRequired,
            buyerId: PropTypes.string,
            buyerFirstName: PropTypes.string,
        }).isRequired,
    }).isRequired,
};

export default MarketplaceChatScreenWrapper;
