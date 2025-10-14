import Button from '@/components/Button';
import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import SearchIcon from '../../assets/images/search.png'; // Import your search icon image

import TopLeft from '../../assets/images/back.png';
import SlideImg1 from '../../assets/images/carouselImage.png';
import SlideImg3 from '../../assets/images/carouselImage2.png';
import SlideImg2 from '../../assets/images/carouselImage3.png';
import ArrowLeft from '../../assets/images/left.png';
import TopRight from '../../assets/images/Phone.png';
import ArrowRight from '../../assets/images/right.png';
import slideImage2 from '../../assets/images/slide1.png';
import slideImage1 from '../../assets/images/slide2.png';
import slideImage3 from '../../assets/images/slide3.png';

interface Slide {
  id: number;
  image: any;
  label: string;
  headline: string;
  description: string;
  modalImage: any;
}

interface SupportItem {
  id: number;
  title: string;
  expanded: boolean;
  route: string;
  content: {
    firstWord: string;
    heading: string;
    text: string;
  };
}

const { width: screenWidth } = Dimensions.get('window');

const slides: Slide[] = [
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
    description: 'Secure lifetime access to your key phrases with optional Next of Kin (NOK) setup. Ensure your digital assets are protected and accessible when needed by you or someone you trust. A privacy-first solution built for security, continuity, and peace of mind.',
    modalImage: slideImage2
  },
  {
    id: 3,
    image: SlideImg3,
    label: 'How to get started with K33P?',
    headline: 'Deposit 2ADA, Create DID, Take back your 2ADA.',
    description: 'Deposit 2 ADA to create your Decentralized Identifier (DID). Once your DID is successfully created, you can retrieve your 2 ADA - no fees, no strings attached. A secure, trustless way to establish your digital identity on-chain.',
    modalImage: slideImage3
  },
];

const supportItems: SupportItem[] = [
  {
    id: 1,
    title: 'Account',
    expanded: false,
    route: '/support/account',
    content: {
      firstWord: 'K33P',
      heading: 'About K33P Account',
      text: 'is a self-custodial digital vault that... '
    }
  },
  {
    id: 2,
    title: 'Authentication',
    expanded: false,
    route: '/support/authentication',
    content: {
      firstWord: 'K33P',
      heading: 'About K33P Authentication',
      text: 'is a self-custodial digital vault that helps you securely store and recover your...'
    }
  },
  {
    id: 3,
    title: 'Payment',
    expanded: false,
    route: '/support/payment',
    content: {
      firstWord: 'K33P',
      heading: 'About K33P Payment',
      text: 'monetizes through a tiered, modular...'
    }
  },
  {
    id: 4,
    title: 'Lite Paper',
    expanded: false,
    route: '/support/litepaper',
    content: {
      firstWord: 'K33P',
      heading: 'About K33P Lightpaper',
      text: 'is a cutting-edge digital safe designed for securely managing cryptocurrency wallet...'
    }
  },
  {
    id: 5,
    title: 'Vault Access & Recovery',
    expanded: false,
    route: '/support/vault-access',
    content: {
      firstWord: 'Loss of device - ',
      heading: 'About K33P Vault access & Recovery',
      text: 'You can reinstall K33P on a new device and recover your vault by... '
    }
  }
];

const ITEM_WIDTH = screenWidth * 0.91;
const ITEM_SPACING = screenWidth * 0.02;

export default function SupportScreen() {
  const [current, setCurrent] = useState(0);
  const [carouselModalVisible, setCarouselModalVisible] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState<Slide | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<SupportItem[]>(supportItems);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const searchInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const [modalVisible, setModalVisible] = useState(false);
  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);
  const supportPhoneNumber = '+2348135005000';
  const [isCalling, setIsCalling] = useState(false);

  const handleCallSupport = async () => {
    setIsCalling(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const phoneUrl = `tel:${supportPhoneNumber}`;
      const supported = await Linking.canOpenURL(phoneUrl);
      
      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        console.error("Phone calls are not supported on this device");
      }
    } catch (error) {
      console.error('Failed to open phone dialer:', error);
    } finally {
      setIsCalling(false);
      closeModal();
    }
  };

  const toggleItem = (id: number) => {
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, expanded: !item.expanded } // Toggle the clicked item
        : { ...item, expanded: false } // Close all other items
    ));
  };

  const navigateToItem = (route: string) => {
    router.push(route);
  };

  const filterItems = (query: string) => {
    if (!query) {
      return supportItems.map(item => ({ ...item, expanded: false }));
    }
    return supportItems.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase())
    ).map(item => ({ ...item, expanded: false }));
  };

  useEffect(() => {
    setItems(filterItems(searchQuery));
  }, [searchQuery]);

  const onViewRef = useRef(({ viewableItems }: { viewableItems: any[] }) => {
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

  const openCarouselModal = useCallback((item: Slide) => {
    setSelectedSlide(item);
    setCarouselModalVisible(true);
  }, []);

  const closeCarouselModal = useCallback(() => {
    setCarouselModalVisible(false);
    setSelectedSlide(null);
  }, []);

  const renderItem = useCallback(({ item, index }: { item: Slide; index: number }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => openCarouselModal(item)}
      style={{
        width: ITEM_WIDTH,
        marginRight: ITEM_SPACING,
        backgroundColor: '#121212',
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
    <TouchableWithoutFeedback onPress={() => {
      if (isKeyboardVisible) {
        Keyboard.dismiss();
      }
    }}>
      <View className="flex-1 bg-neutral800">
        {/* Header - Fixed Position */}
        <View className="my-4 pb-4 ">
          <TouchableOpacity onPress={() => router.back()} className="absolute top-6 left-4 z-10">
            <Image source={TopLeft} className="w-10 h-10" resizeMode="contain" />
          </TouchableOpacity>

          <View className="items-center justify-center mt-8">
            <Text className='text-sm text-white font-sora-bold '>
              Support Center
            </Text>
          </View>

          <TouchableOpacity 
            onPress={openModal}
            className="absolute top-6 right-4 mt-1"
          >
            <Image source={TopRight} className="w-6 h-6" resizeMode="contain" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          style={{ marginVertical: 1 }} 
        >
          <View className="px-4 mb-8">
            {/* Search Bar */}
            <View className="flex-row items-center bg-mainBlack rounded-xl px-3 py-1">
              <Image 
                source={SearchIcon} 
                className="w-5 h-5 mr-2" 
                resizeMode="contain" 
              />
              <TextInput
                ref={searchInputRef}
                className="flex-1 ml-1 text-white font-sora text-sm"
                placeholder="Search.."
                placeholderTextColor="#B0B0B0"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsKeyboardVisible(true)}
              />
            </View>
          </View>

          {/* Carousel */}
          <View >
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
              <TouchableOpacity onPress={prevSlide}>
                <Image 
                  source={ArrowLeft} 
                  style={{ opacity: current === 0 ? 0.5 : 1 }}
                />
              </TouchableOpacity>

              <View className="flex-row gap-3 items-center ">
                {slides.map((_, index) => (
                  <View
                    key={index}
                    className={`rounded-full ${
                      index === current ? 'bg-main w-4 h-2' : 'bg-neutral100 w-2 h-2'
                    }`}
                  />
                ))}
              </View>

              <TouchableOpacity onPress={nextSlide}>
                <Image 
                  source={ArrowRight} 
                  style={{ opacity: current === slides.length - 1 ? 0.5 : 1 }}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Support Items List */}
          <View className="mt-8 px-2">
            {items.map((item) => (
              <View key={item.id} className="mb-4">
                <TouchableOpacity 
                  onPress={() => toggleItem(item.id)}
                  className="flex-row justify-between items-center py-3 px-4 bg-neutral700 rounded-lg"
                >
                  <Text 
                    className={`font-sora-bold text-sm ${
                      item.expanded ? 'text-white' : 'text-white'
                    }`}
                  >
                    {item.title}
                  </Text>
                  <AntDesign 
                    name={item.expanded ? 'arrow-down' : 'arrow-right'} 
                    size={14} 
                    color={item.expanded ? '#ffffff' : ' #ffffff'}
                  />
                </TouchableOpacity>
                {item.expanded && (
                  <View className="mt-5 px-4">
                    <TouchableOpacity 
                      onPress={() => navigateToItem(item.route)}
                      className="py-3 px-3 bg-mainBlack rounded-lg"
                    >
                      <Text className="text-neutral100 font-space-mono text-xs mb-2">
                        {item.content.heading}
                      </Text>

                      <Text className="flex-wrap text-white font-sora text-sm leading-relaxed ">
                        <Text className="font-sora text-sm text-main">
                          {item.content.firstWord + ' '}
                        </Text>
                        {item.content.text}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

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
                  className="w-full h-[30%] object-cover rounded-t-3xl"
                />
                <View className="px-6 py-4">
                  <Text className="text-neutral100 font-space-mono text-sm mb-2">
                    {selectedSlide.label}
                  </Text>
                  <Text className="text-white font-sora-bold text-lg mb-2">
                    {selectedSlide.headline}
                  </Text>
                  <Text className="text-neutral200 font-sora text-sm">
                    {selectedSlide.description}
                  </Text>
                </View>
                <View className="absolute bottom-6 left-0 right-0 px-6">
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

        {/* Phone Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <Pressable 
            onPress={closeModal} 
            className="absolute inset-0 bg-black/60"
          />
          <View className="flex-1 justify-center items-center">
            <View className="bg-mainBlack rounded-3xl p-6 w-4/5">
              <Text className="text-white font-sora text-sm text-center mb-6">
                +234 813 500 5000
              </Text>
              {isCalling ? (
                <View className="py-3 rounded-xl items-center justify-center bg-main">
                  <ActivityIndicator size="small" color="#000000" />
                </View>
              ) : (
                <Button 
                  text="Call Support" 
                  onPress={handleCallSupport}
                />
              )}
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}