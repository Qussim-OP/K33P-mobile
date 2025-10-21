import { BackIcon, OVER18_2, OVER18_3 } from '@/assets/images/svg';
import Button from '@/components/Button';
import { Feather, Fontisto, Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

// Define the ID types
type IdType = 'drivers-license' | 'national-id' | 'passport' | 'voters-card' | '';

export default function Upload() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<IdType>('');
  const [isValid, setIsValid] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  // ID options data
  const idOptions = [
    { id: 'national-id' as IdType, label: 'National ID' },
    { id: 'international-passport' as IdType, label: 'International\nPassport' },
    { id: 'voters-card' as IdType, label: "Voter's Card" },
    { id: 'drivers-license' as IdType, label: "Driver's License" },
  ];

  const handleIdSelect = (idType: IdType) => {
    setSelectedId(idType);
    // Only increase opacity of upload card, don't set isValid to true
  };

  const handleProceed = () => {
    console.log('Selected ID type:', selectedId);
    console.log('Selected file:', selectedFile);
    router.push('/(auth)/sign-up-nok/over18/secret-question');
  };

  const handleUpload = () => {
    // Show upload modal when upload card is clicked
/**
 * Handle scan with camera button click.
 * Logs the selected ID type to the console,
 * hides the upload modal, and navigates to the camera screen.
 */
    setShowUploadModal(true);
  };

  const handleScanWithCamera = async () => {
    console.log('Scan with camera for:', selectedId);
    setShowUploadModal(false);
    
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera permissions to make this work!');
      return;
    }
    
    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedFile(result.assets[0]);
      setIsValid(true);
      console.log('Image captured:', result.assets[0]);
    }
  };

  const handleUploadFromGallery = async () => {
    console.log('Upload from gallery for:', selectedId);
    setShowUploadModal(false);
    
    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need media library permissions to make this work!');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedFile(result.assets[0]);
      setIsValid(true);
      console.log('Image selected:', result.assets[0]);
    }
  };

  const handleFilePicker = async () => {
    // Open document picker for other file types
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        // Check file size (2MB limit)
        if (result.size && result.size > 2 * 1024 * 1024) {
          Alert.alert('File too large', 'Please select a file smaller than 2MB');
          return;
        }

        setSelectedFile(result);
        setIsValid(true);
        console.log('File selected:', result);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select file');
    }
  };

  // Render radio button with Fontisto icons
  const RadioButton = ({ selected, onPress, label }: { selected: boolean; onPress: () => void; label: string }) => (
    <TouchableOpacity 
      className="flex-row items-center mb-4 flex-1 mx-2"
      onPress={onPress}
    >
      {selected ? (
        <Fontisto name="radio-btn-active" size={20} color="#FFE161" />
      ) : (
        <Fontisto name="radio-btn-passive" size={20} color="#FFFFFF" />
      )}
      <Text className="text-white font-sora text-sm ml-3 whitespace-pre-line">{label}</Text>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback>
      <View className="flex-1 px-5">
        {/* Header */}
        <View className="relative flex-row items-center justify-start mb-12">
          <TouchableOpacity className="z-10" onPress={() => router.back()}>
            <BackIcon width={40} height={40} />
          </TouchableOpacity>
          {isValid ? (
            <OVER18_3 
              style={{
                position: 'absolute',
                left: '50%',
                transform: [{ translateX: '-50%' }]
              }}
            />
          ) : (
            <OVER18_2 
              style={{
                position: 'absolute',
                left: '50%',
                transform: [{ translateX: '-50%' }]
              }}
            />
          )}
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text className="text-white font-sora-bold text-sm mb-6">
            Upload a Valid I.D
          </Text>
          
          {/* Radio Buttons - 2 per row */}
          <View className="mb-8">
            {/* First Row */}
            <View className="flex-row mb-4">
              {idOptions.slice(0, 2).map((option) => (
                <RadioButton
                  key={option.id}
                  selected={selectedId === option.id}
                  onPress={() => handleIdSelect(option.id)}
                  label={option.label}
                />
              ))}
            </View>
            
            {/* Second Row */}
            <View className="flex-row">
              {idOptions.slice(2, 4).map((option) => (
                <RadioButton
                  key={option.id}
                  selected={selectedId === option.id}
                  onPress={() => handleIdSelect(option.id)}
                  label={option.label}
                />
              ))}
            </View>
          </View>

          {/* Upload Card */}
          <TouchableOpacity 
            className={`rounded-xl border-2 border-dashed ${
              selectedId ? 'border-neutral200 opacity-100' : 'border-neutral200 opacity-40'
            } p-6 items-center justify-center`}
            onPress={handleUpload}
            disabled={!selectedId}
          >
           
              <View className="items-center">
                <Feather 
                  name="upload" 
                  size={80} 
                  color="#FFD939"
                  style={{ marginBottom: 12 }}
                />
                <Text className={`font-sora text-sm text-center ${
                  selectedId ? 'text-white' : 'text-neutral200'
                }`}>
                  Upload your files here 
                </Text>
                <Text className={`font-sora text-xs text-center mt-1 ${
                  selectedId ? 'text-neutral200' : 'text-neutral400'
                }`}>
                  {selectedId 
                    ? '.pdf, .jpg, .png, .docx- Max 2MB'
                    : 'Select an ID type to upload'
                  }
                </Text>
                <Text className="text-main font-sora-bold text-sm mt-4">Browse</Text>
              </View>
            
          </TouchableOpacity>

          {/* Selected file info */}
          {selectedFile && (
            <View className="mt-4 p-3 bg-neutral700 rounded-lg">
              <Text className="text-white font-sora text-sm">
                Selected: {selectedFile.name || 'Image'}
              </Text>
              <Text className="text-neutral200 font-sora text-xs mt-1">
                Tap the upload card to change file
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View className="pb-16">
          <Button
            text="Proceed"
            onPress={handleProceed}
            isDisabled={!isValid}
          />
        </View>

        {/* Upload Method Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showUploadModal}
          onRequestClose={() => setShowUploadModal(false)}
        >
          <Pressable 
            onPress={() => setShowUploadModal(false)} 
            className="absolute inset-0 bg-black/60"
          />
          <View className="absolute bottom-0 w-full bg-mainBlack rounded-t-3xl">
            {/* Top white line */}
            <View className="w-16 h-1 bg-white rounded-full self-center mt-2 mb-6" />
            
            {/* Modal Title */}
            <Text className="text-white font-sora-bold text-sm text-center mb-6">
              Choose an Upload Method
            </Text>

            {/* Scan Option */}
            <TouchableOpacity 
              className="flex-row items-center justify-between px-6 py-4 border-neutral700"
              onPress={handleScanWithCamera}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="scan-outline" size={20} color="#FFD939" />
                <Text className="text-neutral100 font-sora-bold text-sm ml-4">
                  Scan with Camera
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#B0B0B0" />
            </TouchableOpacity>

            {/* Upload Option */}
            <TouchableOpacity 
              className="flex-row items-center justify-between px-6 py-4"
              onPress={handleUploadFromGallery}
            >
              <View className="flex-row items-center flex-1">
                <Feather name="folder" size={20} color="#FFD939" />
                <Text className="text-neutral100 font-sora-bold text-sm ml-4">
                  Choose from Files
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#B0B0B0" />
            </TouchableOpacity>

            {/* Bottom spacing */}
            <View className="pb-16" />
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}