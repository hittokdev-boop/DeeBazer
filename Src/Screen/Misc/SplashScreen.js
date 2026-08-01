import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AllColors from '../../Constants/Color';

const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  // Animation References
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Background Pulsing Circle Animation
  const pulseCircleScale = useRef(new Animated.Value(1)).current;

  // Inner-to-Outer Expanding Ripple Animation
  const rippleScale = useRef(new Animated.Value(0.95)).current;
  const rippleOpacity = useRef(new Animated.Value(0.75)).current;

  // Background Sparkles Twinkle Animations
  const star1Scale = useRef(new Animated.Value(0.7)).current;
  const star1Opacity = useRef(new Animated.Value(0.4)).current;
  const star2Scale = useRef(new Animated.Value(1)).current;
  const star2Opacity = useRef(new Animated.Value(1)).current;
  const star3Scale = useRef(new Animated.Value(0.8)).current;
  const star3Opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // 1. Entrance Animations
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulsing background circles animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseCircleScale, { toValue: 1.15, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseCircleScale, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ]),
    ).start();

    // 2. Continuous Inner-to-Outer Ripple Wave Loop
    Animated.loop(
      Animated.parallel([
        Animated.timing(rippleScale, {
          toValue: 1.2,
          duration: 1800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rippleOpacity, {
          toValue: 0,
          duration: 1800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // 3. Staggered Twinkle Animation for Background Stars
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(star1Scale, { toValue: 1.35, duration: 900, useNativeDriver: true }),
          Animated.timing(star1Opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(star1Scale, { toValue: 0.7, duration: 900, useNativeDriver: true }),
          Animated.timing(star1Opacity, { toValue: 0.3, duration: 900, useNativeDriver: true }),
        ]),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(star2Scale, { toValue: 0.6, duration: 1100, useNativeDriver: true }),
          Animated.timing(star2Opacity, { toValue: 0.3, duration: 1100, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(star2Scale, { toValue: 1.4, duration: 1100, useNativeDriver: true }),
          Animated.timing(star2Opacity, { toValue: 1, duration: 1100, useNativeDriver: true }),
        ]),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(star3Scale, { toValue: 1.45, duration: 1300, useNativeDriver: true }),
          Animated.timing(star3Opacity, { toValue: 1, duration: 1300, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(star3Scale, { toValue: 0.7, duration: 1300, useNativeDriver: true }),
          Animated.timing(star3Opacity, { toValue: 0.35, duration: 1300, useNativeDriver: true }),
        ]),
      ]),
    ).start();

    // 4. Progress Bar Loading Animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start();

    // 5. Navigation Delay
    const timer = setTimeout(() => {
      navigation.replace('AppTab');
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const translateYAnim = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });


  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={AllColors.white}
        translucent={false}
      />

      {/* Decorative Background Pulsing Circles */}
      <Animated.View
        style={[
          styles.topLeftCircle,
          { transform: [{ scale: pulseCircleScale }] },
        ]}
      />
      <Animated.View
        style={[
          styles.bottomRightCircle,
          { transform: [{ scale: pulseCircleScale }] },
        ]}
      />

      {/* Main Center Content */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateYAnim }],
          },
        ]}>
        {/* Top Quality Badge Pill */}
        <View style={styles.topBadge}>
          <Text style={styles.topBadgeText}>PREMIUM SHOPPING</Text>
        </View>

        {/* Center Animated Logo Section */}
        <View style={styles.centerIconWrapper}>
          {/* Animated Twinkling Stars */}
          <Animated.Text
            style={[
              styles.sparkle,
              styles.sparkleLeft,
              {
                opacity: star1Opacity,
                transform: [{ scale: star1Scale }],
              },
            ]}>
            ✦
          </Animated.Text>
          <Animated.Text
            style={[
              styles.sparkle,
              styles.sparkleTopRight,
              {
                opacity: star2Opacity,
                transform: [{ scale: star2Scale }],
              },
            ]}>
            ★
          </Animated.Text>
          <Animated.Text
            style={[
              styles.sparkle,
              styles.sparkleBottomRight,
              {
                opacity: star3Opacity,
                transform: [{ scale: star3Scale }],
              },
            ]}>
            ✦
          </Animated.Text>

          {/* Outward Pulsing Waves */}
          <Animated.View
            style={[
              styles.innerToOuterRipple,
              {
                opacity: rippleOpacity,
                transform: [{ scale: rippleScale }],
              },
            ]}
          />

          {/* Concentric Layered Glow Rings */}
          <View style={styles.ringOuterLight} />
          <View style={styles.ringMiddleVibrant} />
          <View style={styles.ringInnerDeep} />

          {/* Icon Badge Overlay */}
          <Animated.View
            style={[
              styles.innerWhiteCircleOverlay,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}>
            <Image
              source={require('../../Assets/AppIcon.png')}
              style={styles.appIconImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* Brand Name Typography */}
        <View style={styles.brandTitleRow}>
          <Text style={styles.brandDee}>Dee</Text>
          <Text style={styles.brandBazer}>Bazer</Text>
        </View>

        {/* Tagline */}
        <Text style={styles.taglineText}>
          Shop Smart  •  Live Better  •  Save Big
        </Text>

        {/* Features Capsule Badge */}
        <View style={styles.featureCapsule}>
          <Text style={styles.featureItem}>⚡ Fast Delivery</Text>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.featureItem}>🛡️ 100% Secure</Text>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.featureItem}>🏷️ Best Prices</Text>
        </View>
      </Animated.View>

      {/* Bottom Loading Progress Section */}
      <Animated.View style={[styles.footerContainer, { opacity: fadeAnim }]}>
        <Text style={styles.loadingStatusText}>Curating Best Deals...</Text>

        {/* Animated Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { width: progressWidth }]}
          />
        </View>

        {/* App Version Info */}
        <Text style={styles.versionText}>DeeBazer Mobile  •  v1.0.1</Text>
      </Animated.View>
    </Animated.View>
  );
};

const primaryColor = AllColors.primary || '#F71670';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AllColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLeftCircle: {
    position: 'absolute',
    top: -width * 0.45,
    left: -width * 0.25,
    width: width * 1.15,
    height: width * 1.15,
    borderRadius: (width * 1.15) / 2,
    backgroundColor: AllColors.softPinkBg,
    opacity: 0.85,
  },
  bottomRightCircle: {
    position: 'absolute',
    bottom: -width * 0.45,
    right: -width * 0.25,
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: (width * 1.2) / 2,
    backgroundColor: AllColors.softPinkBg,
    opacity: 0.85,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: -40,
  },
  topBadge: {
    backgroundColor: AllColors.softPinkBg,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: AllColors.lightPink,
    marginBottom: 36,
  },
  topBadgeText: {
    color: primaryColor,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  centerIconWrapper: {
    position: 'relative',
    width: 210,
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  sparkle: {
    position: 'absolute',
    color: primaryColor,
    fontWeight: 'bold',
    zIndex: 10,
  },
  sparkleLeft: {
    left: -20,
    top: 60,
    fontSize: 16,
    opacity: 0.7,
  },
  sparkleTopRight: {
    right: -16,
    top: 20,
    fontSize: 18,
    opacity: 0.8,
  },
  sparkleBottomRight: {
    right: -12,
    bottom: 26,
    fontSize: 15,
    opacity: 0.75,
  },
  innerToOuterRipple: {
    position: 'absolute',
    width: 196,
    height: 196,
    borderRadius: 98,
    borderWidth: 3,
    borderColor: primaryColor,
    backgroundColor: 'rgba(247, 22, 112, 0.12)',
  },
  ringOuterLight: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFD6E8',
    shadowColor: primaryColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  ringMiddleVibrant: {
    position: 'absolute',
    width: 188,
    height: 188,
    borderRadius: 94,
    backgroundColor: '#FF6EA7',
  },
  ringInnerDeep: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: AllColors.primary,
  },
  innerWhiteCircleOverlay: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: AllColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 5,
  },
  appIconImage: {
    width: '100%',
    height: '100%',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  brandDee: {
    fontSize: 42,
    fontWeight: '900',
    color: AllColors.slateDark,
    letterSpacing: 0.5,
  },
  brandBazer: {
    fontSize: 42,
    fontWeight: '900',
    color: primaryColor,
    letterSpacing: 0.5,
  },
  taglineText: {
    fontSize: 14,
    fontWeight: '600',
    color: AllColors.slateMuted,
    letterSpacing: 0.5,
    marginBottom: 24,
  },
  featureCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AllColors.softPinkBg,
    borderWidth: 1,
    borderColor: AllColors.lightPink,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  featureItem: {
    fontSize: 12,
    fontWeight: '700',
    color: AllColors.slateText,
  },
  bulletDot: {
    color: primaryColor,
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 45,
    alignItems: 'center',
    width: '100%',
  },
  loadingStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: AllColors.slateSub,
    marginBottom: 10,
  },
  progressTrack: {
    width: width * 0.72,
    height: 5,
    backgroundColor: AllColors.softPinkBg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: primaryColor,
    borderRadius: 3,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '500',
    color: AllColors.slateLight,
    marginTop: 14,
  },
});

export default SplashScreen;
