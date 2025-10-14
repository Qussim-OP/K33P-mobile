import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import Button from '@/components/Button';
import { default as Avatar2, default as Avatar2Selected } from '../../../assets/images/avartar2.png';
import { default as Avatar3, default as Avatar3Selected } from '../../../assets/images/avartar3.png';
import BackIcon from '../../../assets/images/back.png';
import { default as Avatar1, default as Avatar1Selected } from '../../../assets/images/userprofile.png';

export default function EditProfile() {
  const router = useRouter();
  const [selectedAvatar, setSelectedAvatar] = useState(1); 
  const [username, setUsername] = useState('John Doe');

  const avatars = [
    { id: 1, image: Avatar1, selectedImage: Avatar1Selected },
    { id: 2, image: Avatar2, selectedImage: Avatar2Selected },
    { id: 3, image: Avatar3, selectedImage: Avatar3Selected }
  ];

  const handleSave = () => {
    console.log('Saved:', { avatar: selectedAvatar, username });
    router.back();
  };

  return (
    <View className="flex-1 bg-neutral800 p-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-10 mt-6">
        <TouchableOpacity onPress={() => router.back()}>
          <Image source={BackIcon} className="w-10 h-10" resizeMode="contain" />
        </TouchableOpacity>
        <Text className="text-white font-sora-bold text-sm">Edit Profile</Text>
        <View className="w-10" />
      </View>

      {/* Avatar Selection */}
      <Text className="text-neutral100 font-sora text-sm mb-6">Choose Avatar</Text>
      <View className="flex-row justify-between mb-8">
        {avatars.map((avatar) => (
          <TouchableOpacity 
            key={avatar.id}
            onPress={() => setSelectedAvatar(avatar.id)}
            className={`rounded-full overflow-hidden p-7 ${selectedAvatar === avatar.id ? 'bg-[#484848] ' : ''}`}
          >
            <Image
              source={selectedAvatar === avatar.id ? avatar.selectedImage : avatar.image}
              className=""
              resizeMode="contain"
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Username Input */}
      <Text className="text-white font-sora text-sm mb-4">What would you want to be called?</Text>
      <TextInput
        className="rounded-lg px-5 py-3 mb-2 border border-neutral200 font-sora text-sm text-white"
        placeholder="Enter your name"
        placeholderTextColor="#FFFFFF"
        value={username}
        onChangeText={setUsername}
      />

      {/* Save Button */}
      <View className="mt-auto bottom-10">
        <Button 
          text="Apply & Save" 
          onPress={handleSave}
        />
      </View>
    </View>
  );
}