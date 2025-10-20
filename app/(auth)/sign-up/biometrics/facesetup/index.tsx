import { Lock_3 } from '@/assets/images/svg';
import Button from '@/components/Button';
import { useAuthStore, useLogAuthStore } from '@/store/useAuthStore';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import FaceFailedImage from '../../../../../assets/images/facefailed.png';
import FaceScan0 from '../../../../../assets/images/facescan-0.png';
import FaceScan30 from '../../../../../assets/images/facescan-1.png';
import FaceScan70 from '../../../../../assets/images/facescan-2.png';
import FaceScan100 from '../../../../../assets/images/facescan-3.png';
import FaceSuccessImage from '../../../../../assets/images/facesuccess.png';
import LockSuccessIcon from '../../../../../assets/images/lock-4.png';

const FACE_API_KEY = 'NwacU0nJE5lABdk7_Fs3znyAbgeK3RyV';
const FACE_API_SECRET = 'Fok-9gwqg50knFVBcV9SBZ5uipRqoxwX';

const FaceSetupScreen = () => {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [currentFaceImage, setCurrentFaceImage] = useState(FaceScan0);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing] = useState<CameraType>('front');
  const [faceAuthSuccess, setFaceAuthSuccess] = useState(false);
  const [faceToken, setFaceToken] = useState<string | null>(null);
  const [faceAnalysis, setFaceAnalysis] = useState<any>(null);
  const cameraRef = useRef<CameraView>(null);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { setFaceData } = useAuthStore();
  const logAuthStore = useLogAuthStore();

  const progressSteps = [
    { percent: 0, image: FaceScan0, text: "Keep your face in the center until the registration is complete" },
    { percent: 30, image: FaceScan30, text: "Capturing your face for analysis" },
    { percent: 70, image: FaceScan70, text: "Analyzing facial features" },
    { percent: 100, image: FaceScan100, text: "Scan complete" }
  ];

  const currentStep = progressSteps.find(step => step.percent === progress) || progressSteps[0];

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  useEffect(() => {
    if (progress === 30 && !processing) {
      captureAndDetectFace();
    } else if (progress === 70 && faceToken && !processing) {
      analyzeFaceDetails();
    } else if (progress === 100) {
      if (faceAnalysis) {
        setFaceAuthSuccess(true);
        logAuthStore(); // Log store state when successful
      } else {
        console.error('Progress reached 100% but no face analysis available');
        setErrorMessage('Face analysis incomplete. Please try again.');
        setProgress(0);
      }
    }
  }, [progress, faceToken, processing, faceAnalysis]);

  const resetScan = () => {
    console.log('Resetting face scan');
    setProgress(0);
    setErrorMessage(null);
    setFaceToken(null);
    setFaceAnalysis(null);
    setProcessing(false);
  };

  const captureAndDetectFace = async () => {
    if (!cameraRef.current || processing) return;
    
    setProcessing(true);
    try {
      console.log('Capturing face image for detection');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });

      const formData = new FormData();
      formData.append('api_key', FACE_API_KEY);
      formData.append('api_secret', FACE_API_SECRET);
      formData.append('image_file', {
        uri: photo.uri,
        name: 'face.jpg',
        type: 'image/jpeg',
      } as any);
      formData.append('return_attributes', 'gender,age,emotion,beauty,skinstatus');

      console.log('Sending face detection request');
      const response = await fetch('https://api-us.faceplusplus.com/facepp/v3/detect', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      console.log('Face detection response:', JSON.stringify(data, null, 2));
      
      if (data.faces && data.faces.length === 1) {
        console.log('Face detected successfully');
        setFaceToken(data.faces[0].face_token);
        setErrorMessage(null);
      } else if (data.faces && data.faces.length > 1) {
        const errorMsg = 'Multiple faces detected. Please ensure only one face is visible.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      } else {
        const errorMsg = data.error_message || 'No faces detected. Please position your face in the frame.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('Face detection failed:', error);
      setErrorMessage(error.message || 'Face detection failed. Please try again.');
      setProgress(0);
    } finally {
      setProcessing(false);
    }
  };

  const analyzeFaceDetails = async () => {
    if (!faceToken || processing) return;
    
    setProcessing(true);
    try {
      console.log('Analyzing face details with token:', faceToken);
      const formData = new FormData();
      formData.append('api_key', FACE_API_KEY);
      formData.append('api_secret', FACE_API_SECRET);
      formData.append('face_tokens', faceToken);
      formData.append('return_attributes', 'gender,age,emotion,beauty,skinstatus,eyegaze,mouthstatus');

      console.log('Sending face analysis request');
      const response = await fetch('https://api-us.faceplusplus.com/facepp/v3/face/analyze', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      console.log('Face analysis response:', JSON.stringify(data, null, 2));
      
      if (data.faces && data.faces.length > 0 && data.faces[0].attributes) {
        const analysis = data.faces[0].attributes;
        console.log('Face analysis successful:', analysis);
        setFaceAnalysis(analysis);
        
        // Save to Zustand store
        setFaceData({
          token: faceToken,
          analysis: analysis
        });
        
        // Also save to SecureStore for persistence
        await SecureStore.setItemAsync('user_face_token', faceToken);
        await SecureStore.setItemAsync('user_face_analysis', JSON.stringify(analysis));
        
        setErrorMessage(null);
      } else {
        const errorMsg = data.error_message || 'Face analysis failed. No valid face data returned.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('Face analysis failed:', error);
      setErrorMessage(error.message || 'Face analysis failed. Please try again.');
      setProgress(0);
    } finally {
      setProcessing(false);
    }
  };

  const handleProceed = () => {
    if (!faceAnalysis) {
      console.error('Attempted to proceed without face analysis');
      setErrorMessage('Face analysis data missing. Please try again.');
      return;
    }
    
    console.log('Proceeding with face registration');
    router.push({
      pathname: '/sign-up/biometrics',
      params: { 
        faceScanCompleted: 'true',
        faceData: JSON.stringify(faceAnalysis)
      }
    });
  };

  useEffect(() => {
    if (isComplete || !permission?.granted || errorMessage) return;

    const timer = setInterval(() => {
      setProgress(prev => {
        const nextStep = progressSteps.find(step => step.percent > prev);
      
        if (!nextStep) {
          clearInterval(timer);
          setIsComplete(true);
          return 100;
        }
      
        setCurrentFaceImage(nextStep.image);
        return nextStep.percent;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [isComplete, permission, errorMessage]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} text="Grant Permission" />
      </View>
    );
  }

  if (isComplete && faceAuthSuccess && faceAnalysis) {
    return (
      <View className="flex-1 bg-mainBlack px-5 pt-16">
        <View className="relative flex-row items-center justify-start mb-16">
          <Image
            source={LockSuccessIcon}
            className="absolute left-1/2 transform -translate-x-1/2 w-[88px] h-[16px]"
            resizeMode="contain"
          />
        </View>

        <View className="items-center my-8">
          <Image
            source={FaceSuccessImage}
            className="mb-6"
            resizeMode="contain"
          />
        </View>

        <View className="items-center mb-2">
          <Text className="text-neutral100 font-sora text-sm text-center p-8">
            Your Face I.D has been successfully registered
          </Text>
        </View>

        <View className="items-center mb-8">
          <Text className="text-white font-sora-bold text-2xl">
            100%
          </Text>
        </View>

        <View className="flex-1 justify-end pb-16">
          <Button
            text="Proceed"
            onPress={handleProceed}
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 px-5 mt-5">
      <View className="relative flex-row items-center justify-start mb-4">
      <Lock_3 
style={{
  position: 'absolute',
  left: '50%',
  transform: [{ translateX: '-50%' }]
}} />
      </View>

      <View className="items-center my-8" style={styles.cameraContainer}>
        {errorMessage ? (
          <Image
            source={FaceFailedImage}
            style={styles.faceImage}
            resizeMode="contain"
          />
        ) : (
          <Image
            source={currentFaceImage}
            style={styles.faceImage}
            resizeMode="contain"
          />
        )}

        <View style={styles.cameraWrapper}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
          />
        </View>
      </View>

      <View className="items-center mb-2">
        {errorMessage ? (
          <Text className="text-red-500 font-sora text-sm text-center px-7">
            {errorMessage}
          </Text>
        ) : (
          <Text className="text-neutral100 font-sora text-sm text-center px-7">
            {currentStep.text}
          </Text>
        )}
      </View>

      {!errorMessage && (
        <View className="items-center mt-8">
          <Text className="text-white font-sora-bold text-2xl">
            {progress}%
          </Text>
        </View>
      )}

      {errorMessage && (
        <View className="flex-1 justify-end pb-16">
          <Button
            text="Try Again"
            onPress={resetScan}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
 container: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#1E1E1E',
 },
 message: {
  textAlign: 'center',
  paddingBottom: 10,
  color: 'white',
 },
 cameraContainer: {
  width: '100%',
  height: 300,
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
 },
 cameraWrapper: {
  width: 205,
  height: 205,
  borderRadius: 125,
  overflow: 'hidden',
  transform: [{ scale: 1.1 }],
  zIndex: 10,
 },
 camera: {
  width: '100%',
  height: '100%',
 },
 faceImage: {
  width: 250,
  height: 250,
  position: 'absolute',
  top: 25,
  left: '50%',
  marginLeft: -125,
  zIndex: 1,
 },
});

export default FaceSetupScreen;