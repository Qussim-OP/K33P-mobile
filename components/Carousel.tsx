import ArrowLeft from '@/assets/images/left.png';
import ArrowRight from '@/assets/images/right.png';
import Button from '@/components/Button';
import React, { useCallback, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    Modal,
    Pressable,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Slide {
  id: number;
  image: any;
  label: string;
  headline: string;
  description: string;
  modalImage: any;
}

interface SupportCarouselProps {
  slides: Slide[];
}

const { width: screenWidth } = Dimensions.get('window');
const ITEM_WIDTH = screenWidth * 0.91;
const ITEM_SPACING = screenWidth * 0.02;

const SupportCarousel: React.FC<SupportCarouselProps> = ({ slides }) => {
  const [current, setCurrent] = useState(0);
  const [carouselModalVisible, setCarouselModalVisible] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState<Slide | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const onViewRef = useRef(({ viewableItems }: { viewableItems: any[] }) => {
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
    <>
      <View>
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
    </>
  );
};

export default SupportCarousel;