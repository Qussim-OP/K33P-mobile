import { AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

import Button from '@/components/Button';
import TopLeft from '../../assets/images/back.png';
import CloseIcon from '../../assets/images/close.png';
import EditIcon from '../../assets/images/edit.png';
import TopRight from '../../assets/images/searchcircle.png';
import User from '../../assets/images/userprofile.png';

interface ProfileItems {
  id: number;
  title: string;
  route: string;
}

const profileItems: ProfileItems[] = [
  {
    id: 1,
    title: 'Manage Keeplock',
    route: '/profile/manage-keeplock'
  },
  {
    id: 2,
    title: 'Manage Subscription',
    route: '/profile/manage-subscription'
  },
  {
    id: 3,
    title: 'NOK Setup',
    route: '/profile/nok-setup'
  },
  {
    id: 4,
    title: 'Notifications',
    route: '/profile/notifications'
  }
];

export default function Profile() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<ProfileItems[]>([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [userImage, setUserImage] = useState<string | { uri: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

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

  const filterItems = (query: string) => {
    if (!query) {
      return [];
    }
    return profileItems.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase())
    );
  };

  useEffect(() => {
    setFilteredItems(filterItems(searchQuery));
  }, [searchQuery]);

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    setSearchQuery('');
    setFilteredItems([]);
  };

  const navigateToEditProfile = () => {
    router.push('/profile/edit');
  };

  return (
    <TouchableWithoutFeedback onPress={() => {
      if (isKeyboardVisible) {
        Keyboard.dismiss();
      }
    }}>
      <View className="flex-1 bg-neutral800">
        {/* Header - Fixed Position */}
        <View className="my-4 pb-4">
          <TouchableOpacity onPress={() => router.back()} className="absolute top-6 left-4 z-10">
            <Image source={TopLeft} className="w-10 h-10" resizeMode="contain" />
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleSearch} className="absolute top-6 right-4 mt-1">
            <Image 
              source={isSearching ? CloseIcon : TopRight} 
              className="w-10 h-10" 
              resizeMode="contain" 
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar - Only shown when searching */}
        {isSearching && (
          <View className="px-4 mb-4 mt-16">
            <View className="flex-row items-center bg-mainBlack rounded-xl px-3 py-1">
              <AntDesign name="search" size={16} color="#B0B0B0" />
              <TextInput
                className="flex-1 ml-2 text-white font-sora text-sm"
                placeholder="Search settings..."
                placeholderTextColor="#B0B0B0"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
            </View>
          </View>
        )}

        {/* Profile Section - Hidden when searching */}
        {!isSearching && (
          <>
            <View className="items-center mt-14">
              <View className="relative">
                <TouchableOpacity onPress={navigateToEditProfile} className="rounded-full overflow-hidden w-32 h-32">
                  {userImage ? (
                    <Image 
                      source={userImage} 
                      className="w-full h-full" 
                      resizeMode="cover" 
                    />
                  ) : (
                    <View className="bg-[#484848] w-full h-full items-center justify-center">
                      <Image 
                        source={User} 
                        className="" 
                        resizeMode="contain" 
                      />
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={navigateToEditProfile} className="absolute bottom-3 right-2">
                  <Image source={EditIcon} className="w-6 h-6" resizeMode="contain" />
                </TouchableOpacity>
              </View>
              
              <Text className="text-white font-sora text-sm my-5">John Doe</Text>
              <View className='px-20 w-full'>
                <Button
                  onPress={() => router.push('/profile/manage-subscription')}
                  text="Upgrade to Premium" 
                />
              </View>
            </View>

            {/* Settings Title */}
            <View className="px-6 mt-10 mb-2">
              <Text className="text-neutral100 font-sora text-sm">Settings</Text>
            </View>

            {/* Profile Items - Only shown when not searching */}
            <View className="mt-2 px-2 flex-1">
              {profileItems.map((item) => (
                <TouchableOpacity 
                  key={item.id}
                  onPress={() => router.push(item.route)}
                  className="flex-row justify-between items-center py-3 px-4 bg-neutral700 rounded-lg mb-4"
                >
                  <Text className="text-white font-sora-bold text-sm">
                    {item.title}
                  </Text>
                  <AntDesign 
                    name="arrow-right" 
                    size={12} 
                    color="#ffffff" 
                  />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Search Results - Only shown when searching and has query */}
        {isSearching && searchQuery && (
          <View className="mt-2 px-2 flex-1">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <TouchableOpacity 
                  key={item.id}
                  onPress={() => router.push(item.route)}
                  className="flex-row justify-between items-center py-3 px-4 bg-neutral700 rounded-lg mb-4"
                >
                  <Text className="text-white font-sora-bold text-sm">
                    {item.title}
                  </Text>
                  <AntDesign 
                    name="arrowright" 
                    size={20} 
                    color="#ffffff" 
                  />
                </TouchableOpacity>
              ))
            ) : (
              <Text className="text-neutral400 text-center mt-4">
                No results found
              </Text>
            )}
          </View>
        )}

        {/* Bottom Buttons - Hidden when searching */}
        {!isSearching && (
          <View className="items-center pb-8">
            <TouchableOpacity 
              className="flex-row items-center justify-center py-3 px-6 rounded-lg mb-2"
              onPress={() => console.log('Logout')}
            >
              <Feather name="log-out" size={20} color="#ffffff" />
              <Text className="text-white font-sora text-sm ml-2">Log Out</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-row items-center justify-center py-3 px-6 rounded-lg"
              onPress={() => console.log('Delete Account')}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color="#F44336" />
              <Text className="text-[#F44336] font-sora text-sm ml-2">Delete Account</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}