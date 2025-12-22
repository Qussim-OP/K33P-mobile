// components/Carousel.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Import your images
import SlideImg1 from '../assets/images/carouselImage.png';
import SlideImg3 from '../assets/images/carouselImage2.png';
import SlideImg2 from '../assets/images/carouselImage3.png';
import slideImage2 from '../assets/images/slide1.png';
import slideImage1 from '../assets/images/slide2.png';
import slideImage3 from '../assets/images/slide3.png';

const { width: screenWidth } = Dimensions.get('window');

export interface Slide {
  id: number;
  image: any;
  label: string;
  headline: string;
  description: string;
  modalImage: any;
}

export interface CarouselProps {
  slides?: Slide[];
  onSlidePress?: (slide: Slide) => void;
}

const defaultSlides: Slide[] = [
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

const Carousel: React.FC<CarouselProps> = ({ 
  slides = defaultSlides, 
  onSlidePress 
}) => {
  const [current, setCurrent] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewRef = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrent(viewableItems[0].index);
    }
  });

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const prevSlide = useCallback(() => {
    const prevIndex = current === 0 ? slides.length - 1 : current - 1;
    flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
  }, [current, slides.length]);

  const nextSlide = useCallback(() => {
    const nextIndex = current === slides.length - 1 ? 0 : current + 1;
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  }, [current, slides.length]);

  const handleSlidePress = useCallback((item: Slide) => {
    if (onSlidePress) {
      onSlidePress(item);
    }
  }, [onSlidePress]);

  const renderItem = useCallback(({ item, index }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handleSlidePress(item)}
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
  ), [current, handleSlidePress]);

  return (
    <View style={{ marginTop: 5 }}>
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
  );
};

export default Carousel;