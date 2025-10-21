const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Enable VisionCamera requirements
config.transformer.unstable_allowRequireContext = true;
config.resolver.sourceExts.push('cjs');
config.resolver.assetExts.push(
  'db', // For VisionCamera frame processors
  'mlmodel' // For ML models
);

// Add SVG transformer
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

// Update resolver for SVG support
config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter(ext => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
};

module.exports = withNativeWind(config, { 
  input: './app/global.css',
  // Additional NativeWind config if needed
});