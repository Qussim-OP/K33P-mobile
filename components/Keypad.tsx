import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import BackspaceIcon from '../assets/images/backspace_new.png';

interface NumericKeypadProps {
  onKeyPress: (value: string) => void;
  onBackspace: () => void;
  isVisible: boolean;
}

const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onKeyPress,
  onBackspace,
  isVisible,
}) => {
  if (!isVisible) return null;

  const KeyButton = ({ value }: { value: string }) => (
    <TouchableOpacity
      className="flex-1 items-center justify-center h-16 mx font-sora-semibold"
      onPress={() => onKeyPress(value)}
    >
      <Text className="text-3xl text-white font-sora-semibold">{value}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="absolute bottom-0 left-0 right-0 pb-4 bg-neutral800">
      <View className="w-full">
        {/* Row 1 */}
        <View className="flex-row mb-4">
          {['1', '2', '3'].map((num) => (
            <KeyButton key={num} value={num} />
          ))}
        </View>

        {/* Row 2 */}
        <View className="flex-row mb-4">
          {['4', '5', '6'].map((num) => (
            <KeyButton key={num} value={num} />
          ))}
        </View>

        {/* Row 3 */}
        <View className="flex-row mb-4">
          {['7', '8', '9'].map((num) => (
            <KeyButton key={num} value={num} />
          ))}
        </View>

        {/* Bottom Row */}
        <View className="flex-row">
          <View className="flex-1" /> {/* Spacer */}
          <KeyButton value="0" />
          <TouchableOpacity
            className="flex-1 items-center justify-center h-16 mx-1"
            onPress={onBackspace}
          >
            <Image source={BackspaceIcon} className="w-6 h-5" resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default NumericKeypad;
