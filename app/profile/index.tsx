import { AntDesign, Feather, Fontisto, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

import {
  BackIcon,
  CLOSE,
  P_ONE,
  P_ONE_SELECTED,
  P_THREE,
  P_THREE_SELECTED,
  P_TWO,
  P_TWO_SELECTED,
  SearchIcon
} from '@/assets/images/svg';
import Button from '@/components/Button';
import Toast from '@/components/Toast';
import { useAuthStore } from '@/store/useAuthMethod';
import { usePhoneStore } from '@/store/usePhoneStore';
import { deleteUserWithWallets } from '@/utils/api';
import { getCurrentImageNumber } from '@/utils/image-number-api';
import EditIcon from '../../assets/images/edit.png';

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
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1); // 1: Warning, 2: Confirmation, 3: Processing
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const router = useRouter();
  const { username, token, clearAllData } = useAuthStore();
  const { clearNumbers } = usePhoneStore();

  const avatars = [
    { 
      id: 1, 
      image: P_ONE, 
      selectedImage: P_ONE_SELECTED 
    },
    { 
      id: 2, 
      image: P_TWO, 
      selectedImage: P_TWO_SELECTED 
    },
    { 
      id: 3, 
      image: P_THREE, 
      selectedImage: P_THREE_SELECTED 
    }
  ];

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

  useEffect(() => {
    fetchUserAvatar();
  }, [token]);

  const fetchUserAvatar = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await getCurrentImageNumber();
      
      if (response.success && response.data) {
        setSelectedAvatar(response.data.imageNumber);
      } else {
        console.log('Failed to fetch avatar:', response.message);
        setSelectedAvatar(1);
      }
    } catch (error) {
      console.error('Error fetching avatar:', error);
      setSelectedAvatar(1);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = (query: string) => {
    if (!query) return [];
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

  // Handle logout modal open
  const handleLogoutPress = () => {
    setLogoutModalVisible(true);
  };

  // Handle logout with confirmation modal
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await clearAllData();
      await clearNumbers();
      console.log('User logged out successfully');
      router.replace('/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
      setLogoutModalVisible(false);
    }
  };

  const handleCancelLogout = () => {
    setLogoutModalVisible(false);
  };

  // Handle Delete Account
  const handleDeleteAccountPress = () => {
    setDeleteModalVisible(true);
    setDeleteStep(1);
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setDeleteStep(1);
    setIsDeletingAccount(false);
  };

  const handleProceedToConfirmation = () => {
    setDeleteStep(2);
  };

  const handleConfirmDelete = async () => {
    setDeleteStep(3);
    setIsDeletingAccount(true);
  
    const success = await deleteUserWithWallets();
  
    if (!success) {
      Alert.alert(
        'Error',
        'Failed to delete account after multiple attempts. Please try again.',
        [{ 
          text: 'OK', 
          onPress: () => {
            setDeleteModalVisible(false);
            setDeleteStep(1);
            setIsDeletingAccount(false);
          }
        }]
      );
      return; // stop here
    }
  
    // Only proceed if deletion succeeded
    await clearAllData();
    await clearNumbers();
  
    Alert.alert(
      'Account Deleted',
      'Your account has been successfully deleted. All your data has been cleared.',
      [{ 
        text: 'OK', 
        onPress: () => {
          setDeleteModalVisible(false);
          setDeleteStep(1);
          setIsDeletingAccount(false);
          router.replace('/');
        }
      }]
    );
  };
  

  // Handle Manage Keeplock click
  const handleManageKeeplock = () => {
    router.push('/profile/manage-keeplock/confirm-pin');
  };

  // Handle other profile item clicks
  const handleProfileItemClick = (item: ProfileItems) => {
    if (item.id === 1) {
      handleManageKeeplock();
    } else {
      router.push(item.route);
    }
  };

  // Get the current avatar based on selectedAvatar
  const getCurrentAvatar = () => {
    const avatar = avatars.find(a => a.id === selectedAvatar);
    return avatar || avatars[0];
  };

  // Render delete account modal
  const renderDeleteModal = () => {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={handleCancelDelete}
      >
        <View className="flex-1 justify-center items-center bg-black/70">
          <View className="bg-mainBlack rounded-3xl p-6 w-[90%]">
            {deleteStep === 1 && (
              <>
                <Text className="text-white font-sora-semibold text-sm text-center mb-4">
                Are you sure you want to delete your K33P account
                </Text>
                
                
                
                <View className="gap-5">
                  
                  <Button
                    text="Cancel"
                    onPress={handleCancelDelete}
                  />
                   <TouchableOpacity 
              className="flex-row items-center justify-center py-1 px-6 rounded-lg"
              onPress={handleProceedToConfirmation}
              disabled={isDeletingAccount}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color="#F44336" />
              <Text className="text-[#F44336] font-sora text-sm ml-2">
                Delete Account
              </Text>
            </TouchableOpacity>
                 
                </View>
              </>
            )}
            
            {deleteStep === 2 && (
              <>
                <Text className="text-white font-sora-bold text-sm text-center mb-4">
                Are you sure you want to delete your K33P account
                </Text>
                
                
                <View className="gap-5">
                  <Button
                    text="I Understand, Delete Permanently"
                    onPress={handleConfirmDelete}
                    outline
                  />
                  <Button
                    text="Go Back, Keep My Account"
                    onPress={handleCancelDelete}
                  />
                </View>
              </>
            )}
            
            {deleteStep === 3 && (
              <>
                <Text className="text-white font-sora-bold text-lg text-center mb-4">
                  Deleting Account...
                </Text>
                
                <View className="items-center justify-center py-8">
                  <ActivityIndicator size="large" color="#ffffff" className="mb-4" />
                  <Text className="text-neutral200 font-sora text-sm text-center">
                    {isDeletingAccount 
                      ? 'Processing your request...' 
                      : 'Account deleted successfully'
                    }
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  // Render logout confirmation modal
  const renderLogoutModal = () => {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={handleCancelLogout}
      >
        <View className="flex-1 justify-center items-center bg-black/70">
          <View className="bg-mainBlack rounded-3xl p-6 w-[90%]">
            {/* Modal Title */}
            <Text className="text-white font-sora-bold text-sm text-center mb-6">
            Are you sure you want to Log out of K33P?
            </Text>
            
            {/* Cancel Button (Filled) */}
            <TouchableOpacity
              onPress={handleCancelLogout}
              className="bg-main py-4 rounded-xl mb-4"
              activeOpacity={0.7}
            >
              <Text className="text-mainBlack font-sora-semibold text-sm text-center">
              Stay in App
              </Text>
            </TouchableOpacity>
            
            {/* Logout Button with icon */}
            <TouchableOpacity
              onPress={handleLogout}
              disabled={isLoggingOut}
              className="py-2 rounded-xl flex-row items-center justify-center"
              activeOpacity={0.7}
            >
              {isLoggingOut ? (
                <ActivityIndicator size="small" color="#B8B8B8" />
              ) : (
                <Feather name="log-out" size={20} color="#B8B8B8" />
              )}
              <Text className="text-neutral100 font-sora-semibold text-sm ml-3">
                {isLoggingOut ? 'Logging out...' : 'Log out'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={() => {
      if (isKeyboardVisible) {
        Keyboard.dismiss();
      }
    }}>
      <View className="flex-1 ">
        {/* Header */}
        <View className="mb-4 pb-4 ">
          <TouchableOpacity onPress={() => router.back()} className="absolute left-4 z-10">
            <BackIcon
              style={{
                left: '50%',
                transform: [{ translateX: '-50%' }],
              }}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={toggleSearch}
            className="absolute right-4"
          >
            {
              isSearching ? 
              <CLOSE
                style={{
                  left: '50%',
                  transform: [{ translateX: '-50%' }],
                }}
              /> : 
              <SearchIcon
                style={{
                  left: '50%',
                  transform: [{ translateX: '-50%' }],
                }}
              />
            }
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        {isSearching && (
          <View className="px-4 mb-4 mt-12">
            <View className="flex-row items-center bg-searchBg rounded-xl px-3 py-1">
              <Fontisto name="search" size={16} color="#B0B0B0" />
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

        {/* Profile Section */}
        {!isSearching && (
          <>
            <View className="items-center mt-14">
              <View className="relative">
                <TouchableOpacity onPress={navigateToEditProfile} className="rounded-full overflow-hidden w-32 h-32">
                  {loading ? (
                    <View className="bg-[#484848] w-full h-full items-center justify-center">
                      <Text className="text-white text-sm font-sora">Loading...</Text>
                    </View>
                  ) : (
                    <View className="bg-[#484848] w-full h-full items-center justify-center">
                     {(() => {
                        const currentAvatar = getCurrentAvatar();
                        return currentAvatar.selectedImage ? (
                          <currentAvatar.selectedImage 
                            width={50} 
                            height={50} 
                          />
                        ) : (
                          <currentAvatar.image 
                            width={80} 
                            height={80} 
                          />
                        );
                      })()}
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={navigateToEditProfile} className="absolute bottom-3 right-2">
                  <Image source={EditIcon} className="w-6 h-6" resizeMode="contain" />
                </TouchableOpacity>
              </View>
              
              <Text className="text-white font-sora text-sm my-5">{username}</Text>
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

            {/* Profile Items */}
            <View className="mt-2 px-2 flex-1">
              {profileItems.map((item) => (
                <TouchableOpacity 
                  key={item.id}
                  onPress={() => handleProfileItemClick(item)}
                  className="flex-row justify-between items-center py-3 px-4 bg-neutral700 rounded-lg mb-4"
                >
                  <Text className="text-white font-sora-bold text-sm">
                    {item.title}
                  </Text>
                  <AntDesign 
                    name="arrow-right" 
                    size={16} 
                    color="#ffffff" 
                  />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Search Results */}
        {isSearching && searchQuery && (
          <View className="px-2 flex-1">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <TouchableOpacity 
                  key={item.id}
                  onPress={() => handleProfileItemClick(item)}
                  className="flex-row justify-between items-center py-3 px-4 bg-neutral700 rounded-lg mb-4"
                >
                  <Text className="text-white font-sora-bold text-sm">
                    {item.title}
                  </Text>
                  <AntDesign 
                    name="arrow-right" 
                    size={16} 
                    color="#ffffff" 
                  />
                </TouchableOpacity>
              ))
            ) : (
              <Text className="text-neutral200 text-center mt-4">
                No results found
              </Text>
            )}
          </View>
        )}

        {/* Bottom Buttons */}
        {!isSearching && (
          <View className="items-center pb-8">
            <TouchableOpacity 
              className="flex-row items-center justify-center py-3 px-6 rounded-lg mb-2"
              onPress={handleLogoutPress}
              disabled={isLoggingOut}
            >
              <Feather name="log-out" size={20} color="#ffffff" />
              <Text className="text-white font-sora text-sm ml-2">
                Log Out
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-row items-center justify-center py-3 px-6 rounded-lg"
              onPress={handleDeleteAccountPress}
              disabled={isDeletingAccount}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color="#F44336" />
              <Text className="text-[#F44336] font-sora text-sm ml-2">
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Toast Notification */}
        <Toast 
          visible={showToast}
          onHide={() => setShowToast(false)}
          message="This feature is currently not available"
          duration={3000}
        />

        {/* Delete Account Modal */}
        {renderDeleteModal()}

        {/* Logout Confirmation Modal */}
        {renderLogoutModal()}
      </View>
    </TouchableWithoutFeedback>
  );
}