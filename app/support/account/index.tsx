import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { JSX, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import SearchIcon from '../../../assets/images/search.png';

import { BackIcon, PHONE } from '@/assets/images/svg';
import helpContent from '@/constants/support.json';

interface SearchResult {
  id: number;
  section: string;
  title: string;
  route: string;
  highlightedContent: JSX.Element[];
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const ITEM_WIDTH = screenWidth * 0.91;
const ITEM_SPACING = screenWidth * 0.02;

const highlightText = (text: string, query: string): JSX.Element => {
  if (!query) return <Text className="text-white">{text}</Text>;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <Text className="text-white">
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <Text key={i} className="text-main">{part}</Text>
        ) : (
          part
        )
      )}
    </Text>
  );
};

export default function AccountHelpScreen() {
  const [searchCurrent, setSearchCurrent] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const router = useRouter();
  const searchFlatListRef = useRef<FlatList>(null);
  const searchInputRef = useRef<TextInput>(null);
  
  const accountContent = helpContent.helpSections.find(section => section.section === 'Account');
  const supportPhoneNumber = helpContent.support.phoneNumber;

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

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  const handleCallSupport = async () => {
    setIsCalling(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const phoneUrl = `tel:${supportPhoneNumber}`;
      const supported = await Linking.canOpenURL(phoneUrl);
      if (supported) {
        await Linking.openURL(phoneUrl);
      }
    } catch (error) {
      console.error('Failed to open phone dialer:', error);
    } finally {
      setIsCalling(false);
      closeModal();
    }
  };

  // Search through all help content and group by section
  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    helpContent.helpSections.forEach(section => {
      // Check if any content in this section contains the search query
      const hasMatchingContent = section.content.some(contentItem => {
        const fullText = (contentItem.heading || '') + ' ' + contentItem.text;
        return fullText.toLowerCase().includes(lowerQuery);
      });

      if (hasMatchingContent) {
        // Create highlighted content for all items in this section
        const highlightedContent = section.content.map((contentItem, index) => {
          const fullText = (contentItem.heading || '') + ' ' + contentItem.text;
          return (
            <View key={index} className="mb-4">
              {contentItem.heading && (
                <Text className="text-main font-sora-bold text-sm mb-2" style={{textDecorationLine: 'underline'}}>
                  {highlightText(contentItem.heading, query)}
                </Text>
              )}
              <Text className="text-white font-sora text-sm leading-relaxed">
                {contentItem.id === 1 ? (
                  <>
                    <Text className="text-main">
                      {highlightText('K33P', query)}
                    </Text>
                    {highlightText(contentItem.text.substring(4), query)}
                  </>
                ) : (
                  highlightText(contentItem.text, query)
                )}
              </Text>
            </View>
          );
        });

        results.push({
          id: helpContent.helpSections.findIndex(s => s.section === section.section) + 1,
          section: section.section,
          title: section.title,
          route: `/support/${section.section.toLowerCase().replace(' ', '-')}`,
          highlightedContent
        });
      }
    });

    // Sort results to show current section first
    const sortedResults = results.sort((a, b) => {
      if (a.section === 'Account') return -1;
      if (b.section === 'Account') return 1;
      return 0;
    });

    setSearchResults(sortedResults);
  };

  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const onSearchViewRef = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems.length > 0) {
      setSearchCurrent(viewableItems[0].index);
    }
  });

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const prevSearchSlide = useCallback(() => {
    const prevIndex = searchCurrent === 0 ? searchResults.length - 1 : searchCurrent - 1;
    searchFlatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
  }, [searchCurrent, searchResults.length]);

  const nextSearchSlide = useCallback(() => {
    const nextIndex = searchCurrent === searchResults.length - 1 ? 0 : searchCurrent + 1;
    searchFlatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  }, [searchCurrent, searchResults.length]);

  const navigateToSearchResult = (route: string) => {
    router.push(route);
  };

  const renderSearchResultItem = useCallback(({ item, index }: { item: SearchResult; index: number }) => {
    // Calculate dynamic height based on content
    const itemHeight = screenHeight * 0.66; // Fixed height for consistency
    
    return (
      <View
        style={{
          width: ITEM_WIDTH,
          marginRight: ITEM_SPACING,
          backgroundColor: '#222222',
          borderRadius: 12,
          opacity: index === searchCurrent ? 1 : 0.6,
          height: itemHeight, // Fixed height
        }}
      >
        {/* Header - Always visible */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigateToSearchResult(item.route)}
          className="p-4"
        >
          <Text className="text-neutral100 font-space-mono text-xs mb-2">
            About K33P {item.title}
          </Text>
        </TouchableOpacity>
        
        {/* Scrollable Content Area */}
        <View style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={true}
            indicatorStyle="white" // iOS only
            className="flex-1 px-4"
            contentContainerStyle={{ 
              paddingBottom: 40, // Extra padding at bottom
              paddingTop: 8,
            }}
            nestedScrollEnabled={true} // Important for nested scrolling
            scrollEventThrottle={16}
            bounces={true}
            overScrollMode="always"
          >
            {item.highlightedContent}
          </ScrollView>
        </View>
      </View>
    );
  }, [searchCurrent, navigateToSearchResult]);

  if (!accountContent) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-white">Content not found</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={() => {
      if (isKeyboardVisible) {
        Keyboard.dismiss();
      }
    }}>
      <View className="flex-1">
        <View className="mb-4 pb-4">
          <TouchableOpacity onPress={() => router.back()} className="absolute left-4 z-10">
            <BackIcon
              style={{
                left: '50%',
                transform: [{ translateX: '-50%' }],
              }}
            />
          </TouchableOpacity>

          <View className="items-center justify-center">
            <Text className="text-sm text-white font-sora-bold mt-3">
              {accountContent.title}
            </Text>
          </View>

          <TouchableOpacity onPress={openModal} className="absolute right-4 mt-2">
            <PHONE
              style={{
                left: '50%',
                transform: [{ translateX: '-50%' }],
              }}
            />
          </TouchableOpacity>
        </View>

        <View className="flex-1">
          <View className="px-4 mb-4">
            <View className="flex-row items-center bg-searchBg rounded-xl px-3 py-1">
              <Image source={SearchIcon} className="w-5 h-5 mr-2" resizeMode="contain" />
              <TextInput
                ref={searchInputRef}
                className="flex-1 ml-1 text-white font-sora text-sm"
                placeholder="Search.."
                placeholderTextColor="#B0B0B0"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsKeyboardVisible(true)}
                returnKeyType="search"
              />
            </View>
          </View>

          {/* Search Results Carousel */}
          {searchQuery && searchResults.length > 0 && (
            <View className="flex-1">
              <FlatList
                ref={searchFlatListRef}
                data={searchResults}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => `${item.section}-${item.id}`}
                renderItem={renderSearchResultItem}
                snapToInterval={ITEM_WIDTH + ITEM_SPACING}
                decelerationRate="fast"
                snapToAlignment="start"
                initialScrollIndex={0}
                getItemLayout={(data, index) => ({
                  length: ITEM_WIDTH + ITEM_SPACING,
                  offset: (ITEM_WIDTH + ITEM_SPACING) * index,
                  index,
                })}
                contentContainerStyle={{ 
                  paddingLeft: 20, 
                  paddingRight: ITEM_SPACING,
                  paddingBottom: 20, // Extra padding for bottom
                }}
                onViewableItemsChanged={onSearchViewRef.current}
                viewabilityConfig={viewConfigRef.current}
                pagingEnabled={false}
                style={{ flex: 1 }}
              />

              <View className="flex-row items-center justify-between px-4 mt-4 mb-4">
                <TouchableOpacity
                  onPress={prevSearchSlide}
                  activeOpacity={0.7}
                  disabled={searchCurrent === 0}
                >
                  <Ionicons
                    name="chevron-back-outline"
                    size={24}
                    color={searchCurrent === 0 ? '#555' : '#fff'}
                  />
                </TouchableOpacity>

                <View className="flex-row gap-3 items-center bg-neutral700 rounded-full px-4 py-2">
                  {searchResults.map((_, index) => (
                    <Animated.View
                      key={index}
                      style={{
                        width: index === searchCurrent ? 16 : 8,
                        height: 8,
                        borderRadius: 8,
                        backgroundColor: '#B0B0B0',
                        transition: 'width 0.25s ease-in-out',
                      }}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  onPress={nextSearchSlide}
                  activeOpacity={0.7}
                  disabled={searchCurrent === searchResults.length - 1}
                >
                  <Ionicons
                    name="chevron-forward-outline"
                    size={24}
                    color={searchCurrent === searchResults.length - 1 ? '#555' : '#fff'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* No Search Results Message */}
          {searchQuery && searchResults.length === 0 && (
            <View className="flex-1 justify-center items-center">
              <Text className="text-neutral200 font-sora text-sm text-center">
                No results found for "{searchQuery}"
              </Text>
            </View>
          )}

          {/* Regular Account Content (only shown when not searching) */}
          {!searchQuery && (
            <ScrollView
              contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="interactive"
              decelerationRate="fast"
              overScrollMode="never"
              scrollEventThrottle={16}
            >
              <View className="p-4 rounded-lg mt-4 bg-[#222222]">
                <Text className="text-neutral100 text-xs font-space-mono mb-2">
                  About K33P Account
                </Text>
                {accountContent.content.map((section) => (
                  <View key={section.id} className="mb-6">
                    {section.heading && (
                      <Text
                        className="text-main font-sora-bold text-sm mb-4"
                        style={{ textDecorationLine: 'underline' }}
                      >
                        {section.heading}
                      </Text>
                    )}
                    <Text className="text-white font-sora text-sm leading-relaxed">
                      {section.id === 1 ? (
                        <>
                          <Text className="text-main">
                            K33P
                          </Text>
                          {section.text.substring(4)}
                        </>
                      ) : (
                        section.text
                      )}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={closeModal}>
          <Pressable onPress={closeModal} className="absolute inset-0 bg-black/60" />
          <View className="flex-1 justify-center items-center">
            <View className="bg-mainBlack rounded-3xl p-6 w-4/5">
              <Text className="text-white font-sora text-sm text-center mb-6">
                {supportPhoneNumber}
              </Text>

              {isCalling ? (
                <View className="py-3 rounded-xl items-center justify-center bg-main">
                  <ActivityIndicator size="small" color="#000000" />
                </View>
              ) : (
                <Button text="Call Support" onPress={handleCallSupport} />
              )}
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}