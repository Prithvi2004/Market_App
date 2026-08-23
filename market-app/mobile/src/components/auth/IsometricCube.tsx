/**
 * Isometric 3D Faceted Block Component
 * Renders high-tech 3D cubes with depth shading, neon edges, specular highlights,
 * and animated float/glow effects.
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Polygon, Defs, LinearGradient, Stop, Path } from 'react-native-svg';

export interface IsometricCubeProps {
  size?: number; // Base width/height of the isometric bounding box
  baseColor?: 'gold' | 'emerald' | 'cyan' | 'purple' | 'rose';
  delay?: number;
  duration?: number;
  elevateAmount?: number;
  glow?: boolean;
  style?: any;
}

const COLOR_MAP = {
  gold: {
    top: '#f0c56a',
    topEnd: '#d4963a',
    left: '#b07826',
    leftEnd: '#7a5015',
    right: '#8a5c18',
    rightEnd: '#4d330c',
    edge: '#ffe299',
    glow: 'rgba(212, 150, 58, 0.45)',
  },
  emerald: {
    top: '#34d399',
    topEnd: '#10b981',
    left: '#059669',
    leftEnd: '#047857',
    right: '#065f46',
    rightEnd: '#064e3b',
    edge: '#6ee7b7',
    glow: 'rgba(16, 185, 129, 0.45)',
  },
  cyan: {
    top: '#38bdf8',
    topEnd: '#0284c7',
    left: '#0369a1',
    leftEnd: '#075985',
    right: '#0c4a6e',
    rightEnd: '#082f49',
    edge: '#7dd3fc',
    glow: 'rgba(56, 189, 248, 0.45)',
  },
  purple: {
    top: '#c084fc',
    topEnd: '#9333ea',
    left: '#7e22ce',
    leftEnd: '#6b21a8',
    right: '#581c87',
    rightEnd: '#3b0764',
    edge: '#e9d5ff',
    glow: 'rgba(168, 85, 247, 0.45)',
  },
  rose: {
    top: '#fb7185',
    topEnd: '#f43f5e',
    left: '#e11d48',
    leftEnd: '#be123c',
    right: '#9f1239',
    rightEnd: '#881337',
    edge: '#fecdd3',
    glow: 'rgba(244, 63, 94, 0.45)',
  },
};

export const IsometricCube: React.FC<IsometricCubeProps> = ({
  size = 64,
  baseColor = 'gold',
  delay = 0,
  duration = 3200,
  elevateAmount = 14,
  glow = true,
  style,
}) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    let isMounted = true;
    const timeout = setTimeout(() => {
      if (!isMounted) return;
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -elevateAmount,
            duration: duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.95,
            duration: duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, delay);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [delay, duration, elevateAmount]);

  const palette = COLOR_MAP[baseColor] || COLOR_MAP.gold;
  const idPrefix = `cube_${baseColor}_${Math.floor(Math.random() * 10000)}`;

  // Normalized isometric coordinates for width=100, height=100
  // Top Face: (50, 4) -> (96, 28) -> (50, 52) -> (4, 28)
  // Left Face: (4, 28) -> (50, 52) -> (50, 96) -> (4, 72)
  // Right Face: (50, 52) -> (96, 28) -> (96, 72) -> (50, 96)

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [{ translateY: floatAnim }, { scale: pulseAnim }],
        },
        style,
      ]}
    >
      {glow && (
        <View
          style={[
            styles.glowRing,
            {
              width: size * 0.8,
              height: size * 0.4,
              backgroundColor: palette.glow,
              bottom: size * 0.05,
              left: size * 0.1,
            },
          ]}
        />
      )}
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={`${idPrefix}_top`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={palette.top} stopOpacity="1" />
            <Stop offset="100%" stopColor={palette.topEnd} stopOpacity="0.9" />
          </LinearGradient>
          <LinearGradient id={`${idPrefix}_left`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={palette.left} stopOpacity="1" />
            <Stop offset="100%" stopColor={palette.leftEnd} stopOpacity="0.9" />
          </LinearGradient>
          <LinearGradient id={`${idPrefix}_right`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={palette.right} stopOpacity="1" />
            <Stop offset="100%" stopColor={palette.rightEnd} stopOpacity="0.9" />
          </LinearGradient>
        </Defs>

        {/* Left Face */}
        <Polygon
          points="4,28 50,52 50,96 4,72"
          fill={`url(#${idPrefix}_left)`}
          stroke={palette.edge}
          strokeWidth="0.8"
          strokeOpacity="0.35"
        />

        {/* Right Face */}
        <Polygon
          points="50,52 96,28 96,72 50,96"
          fill={`url(#${idPrefix}_right)`}
          stroke={palette.edge}
          strokeWidth="0.8"
          strokeOpacity="0.25"
        />

        {/* Top Face */}
        <Polygon
          points="50,4 96,28 50,52 4,28"
          fill={`url(#${idPrefix}_top)`}
          stroke={palette.edge}
          strokeWidth="1.2"
          strokeOpacity="0.75"
        />

        {/* Highlight Crest on Top Face */}
        <Path
          d="M 50 8 L 90 29 L 50 50 L 10 29 Z"
          fill="none"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="0.75"
        />

        {/* Center Vertical Edge Highlight */}
        <Path
          d="M 50 52 L 50 96"
          stroke={palette.edge}
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.5,
    filter: 'blur(12px)',
  },
});
