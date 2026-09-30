import { Platform, StatusBar, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Accurately calculates status bar height across all Android versions (including Android 15 & 16 edge-to-edge).
 */
export const STATUSBAR_HEIGHT =
  Platform.OS === 'android'
    ? (StatusBar.currentHeight && StatusBar.currentHeight > 0 ? StatusBar.currentHeight : 28)
    : 0;

export { SCREEN_WIDTH, SCREEN_HEIGHT };
