import Button from '@/components/Button';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { usePhoneStore } from '@/store/usePhoneStore';
import { usePinStore } from '@/store/usePinStore';
import { getStoredWallets } from '@/utils/storage';

import { INFO, PROFILE } from '@/assets/images/svg';
import { useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import SlideImg1 from '../../assets/images/carouselImage.png';
import SlideImg3 from '../../assets/images/carouselImage2.png';
import SlideImg2 from '../../assets/images/carouselImage3.png';
import slideImage2 from '../../assets/images/slide1.png';
import slideImage1 from '../../assets/images/slide2.png';
import slideImage3 from '../../assets/images/slide3.png';

const { width: screenWidth } = Dimensions.get('window');

const slides = [
  {
    id: 1,
    image: SlideImg1,
    label: 'What is K33P?',
    headline: 'Decentralized digital safe for your Key-phrases.',
    description: 'A decentralized digital vault designed to securely store and protect your key-phrases. No central authority, no single point of failure. Your sensitive recovery phrases stay private, encrypted, and accessible only to you. Built for privacy-focused users who value full control over their digital identity and crypto security.',
    modalImage: slideImage1
  },
  {
    id: 2,
    image: SlideImg2,
    label: 'Why K33P?',
    headline: 'Lifetime access to key phrases + NOK Setup.',
    description: 'Secure lifetime access to your key phrases with optional Next of Kin (NOK) setup. Ensure your digital assets are protected and accessible when needed  by you or someone you trust. A privacy-first solution built for security, continuity, and peace of mind.',
    modalImage: slideImage2

  },
  {
    id: 3,
    image: SlideImg3,
    label: 'How to get started with K33P?',
    headline: 'Deposit 2ADA, Create DID, Take back your 2ADA.',
    description: 'Deposit 2 ADA to create your Decentralized Identifier (DID). Once your DID is successfully created, you can retrieve your 2 ADA  no fees, no strings attached. A secure, trustless way to establish your digital identity on-chain.',
    modalImage: slideImage3

  },
];

const ITEM_WIDTH = screenWidth * 0.91;
const ITEM_SPACING = screenWidth * 0.02;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};
export default function Index() {
  const [current, setCurrent] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [carouselModalVisible, setCarouselModalVisible] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState(null);
  const [isStoreHydrated, setIsStoreHydrated] = useState(false);
  const router = useRouter();
  const flatListRef = useRef(null);
  const name = useUserStore((state) => state.name);

  const { phoneNumber } = usePhoneStore();
  const { pin, hasPin } = usePinStore();

  useEffect(() => {
    const unsubscribePin = usePinStore.persist.onFinishHydration(() => {
      setIsStoreHydrated(true);
    });

    if (usePinStore.persist.hasHydrated()) {
      setIsStoreHydrated(true);
    }

    return () => {
      unsubscribePin();
    };
  }, []);

  useEffect(() => {
    const checkUserSessionAndWallets = async () => {
      if (!isStoreHydrated) {
        return;
      }

      if (!phoneNumber) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please sign in again.',
          [{ text: 'OK', onPress: () => router.replace('/sign-in') }]
        );
        return;
      }

      if (hasPin && (pin === null || pin === undefined || pin === '')) {
        Alert.alert(
          'PIN Required',
          'Your PIN is missing or invalid. Please set your PIN again.',
          [{ text: 'OK', onPress: () => router.replace('/sign-in') }]
        );
        return;
      }

      const pinToUse = hasPin ? pin || '' : '';

      if (phoneNumber && (pinToUse !== null || !hasPin)) {
        try {
          const storedWallets = await getStoredWallets(phoneNumber, pinToUse);
          if (storedWallets.length > 0) {
            router.replace('/(home)/add-to-wallet');
          }
        } catch (error) {
          Alert.alert('Error', 'Failed to retrieve wallet data. Please try again.');
          router.replace('/sign-in');
        }
      }
    };

    checkUserSessionAndWallets();
  }, [isStoreHydrated, phoneNumber, pin, hasPin, router]);

  const onViewRef = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrent(viewableItems[0].index);
    }
  });

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const prevSlide = useCallback(() => {
    const prevIndex = current === 0 ? slides.length - 1 : current - 1;
    flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
  }, [current]);

  const nextSlide = useCallback(() => {
    const nextIndex = current === slides.length - 1 ? 0 : current + 1;
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  }, [current]);

  const openModal = useCallback(() => setModalVisible(true), []);
  const closeModal = useCallback(() => setModalVisible(false), []);

  const openCarouselModal = useCallback((item) => {
    setSelectedSlide(item);
    setCarouselModalVisible(true);
  }, []);

  const closeCarouselModal = useCallback(() => {
    setCarouselModalVisible(false);
    setSelectedSlide(null);
  }, []);

  const renderItem = useCallback(({ item, index }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => openCarouselModal(item)}
      style={{
        width: ITEM_WIDTH,
        marginRight: ITEM_SPACING,
        backgroundColor: '#222222',
        borderRadius: 12,
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
        opacity: index === current ? 1 : 0.6,
      }}
    >
      <Image
        source={item.image}
        style={{ width: 80, height: 80, marginRight: 20 }}
        resizeMode="contain"
      />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: '#B0B0B0',
            fontSize: 12,
            marginBottom: 4,
            fontFamily: 'Sora-Regular',
          }}
        >
          {item.label}
        </Text>
        <Text
          style={{
            color: 'white',
            fontSize: 14,
            fontFamily: 'Sora-Bold',
          }}
        >
          {item.headline}
        </Text>
      </View>
    </TouchableOpacity>
  ), [current, openCarouselModal]);

  return (
    <View className="flex-1 justify-between pt-6 pb-12 relative">
      <TouchableOpacity onPress={() => router.push('/support')} className="absolute left-4">
      <INFO
              style={{
                left: '50%',
                transform: [{ translateX: '-50%' }],
              }}
            />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push('/profile')} className="absolute right-4">
      <PROFILE
              style={{
                left: '50%',
                transform: [{ translateX: '-50%' }],
              }}
            />      
        </TouchableOpacity>

      <View style={{ marginTop: 40 }}>
        <View className='px-6 mb-4'>
          <Text className='text-white font-sora mb-2'>Hello {name || 'User'}!</Text>
          <Text className='text-[#B8B8B8] font-space-mono text-xs'>
            {getGreeting()}, and welcome to K33P.
          </Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={slides}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          snapToInterval={ITEM_WIDTH + ITEM_SPACING}
          decelerationRate="fast"
          snapToAlignment="start"
          initialScrollIndex={0}
          getItemLayout={(data, index) => ({
            length: ITEM_WIDTH + ITEM_SPACING,
            offset: (ITEM_WIDTH + ITEM_SPACING) * index,
            index,
          })}
          contentContainerStyle={{ paddingLeft: 20, paddingRight: ITEM_SPACING }}
          onViewableItemsChanged={onViewRef.current}
          viewabilityConfig={viewConfigRef.current}
          pagingEnabled={false}
        />

        <View className="flex-row items-center justify-between px-6 mt-6">
          <TouchableOpacity
            onPress={prevSlide}
            activeOpacity={0.7}
            disabled={current === 0}
          >
            <Ionicons
              name="chevron-back-outline"
              size={24}
              color={current === 0 ? '#555' : '#fff'}
            />
          </TouchableOpacity>

          <View className="flex-row gap-3 items-center">
            {slides.map((_, index) => (
              <Animated.View
                key={index}
                style={{
                  width: index === current ? 16 : 8,
                  height: 8,
                  borderRadius: 8,
                  backgroundColor: index === current ? '#FFD939' : '#666',
                  transition: 'width 0.25s ease-in-out',
                }}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={nextSlide}
            activeOpacity={0.7}
            disabled={current === slides.length - 1}
          >
            <Ionicons
              name="chevron-forward-outline"
              size={24}
              color={current === slides.length - 1 ? '#555' : '#fff'}
            />
          </TouchableOpacity>
        </View>

      </View>

      <View className="bg-[#222222] px-4 py-8 rounded-3xl space-y-4 mt-10 mx-3">
        <View className="items-center mb-4">
          <Text className="text-neutral200 font-sora-semibold text-sm">Connect</Text>
        </View>
        <Button text="Add New Wallet" onPress={openModal} />
      </View>

      {/* Add Wallet Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <Pressable onPress={closeModal} className="absolute inset-0 bg-black/60" />
        <View className="flex-1 justify-center items-center">
          <View className="bg-mainBlack rounded-3xl p-6 w-4/5">
            <Text className="text-white font-sora text-sm text-center mb-6">
              How do you want to add wallet
            </Text>
            <View className="space-y-4 gap-4">
              <Button
                text="Scan Device"
                onPress={() => {
                  closeModal();
                  router.push('/search');
                }}
              />
              <Button
                text="Add Manually"
                onPress={() => {
                  closeModal();
                  router.push('/add-manually');
                }}
                outline
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Carousel Item Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={carouselModalVisible}
        onRequestClose={closeCarouselModal}
      >
        <Pressable 
          onPress={closeCarouselModal} 
          className="absolute inset-0 bg-black/80"
        />
        <View className="absolute bottom-0 w-full bg-mainBlack rounded-t-3xl" style={{ height: '70%' }}>
          {selectedSlide && (
            <>
              <Image
                source={selectedSlide.modalImage}
                className="w-full object-cover rounded-t-3xl"
              />
              <View className="px-4 py-6">
                <Text className="text-neutral100 font-space-mono text-sm mb-2">
                  {selectedSlide.label}
                </Text>
               
                <Text className="text-white font-sora text-sm">
                  {selectedSlide.description}
                </Text>
              </View>
              <View className="absolute bottom-12 left-0 right-0 px-4">
                <Button 
                  text="Close" 
                  onPress={closeCarouselModal}
                  outline
                />
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}