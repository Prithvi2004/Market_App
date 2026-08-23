/**
 * Streamlined 3D Blocks Storytelling Canvas
 * Focused, balanced, and responsive 3D block hero with storytelling chapters.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { IsometricCube } from './IsometricCube';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const { width } = Dimensions.get('window');

export interface StoryChapter {
  id: number;
  badge: string;
  headline: string;
  subhead: string;
  metric: string;
}

const CHAPTERS: StoryChapter[] = [
  {
    id: 0,
    badge: 'STAGE 01 · MARKET VELOCITY',
    headline: 'Real-Time Order Flow & Ticks',
    subhead: 'Sub-millisecond volumetric liquidity across NSE & BSE 50.',
    metric: 'NIFTY 50 +1.84%',
  },
  {
    id: 1,
    badge: 'STAGE 02 · AI ALPHA COGNITION',
    headline: 'Neural Sentiment & Ripples',
    subhead: 'Instant LLM news analysis and sector price impact models.',
    metric: '94.2% AI Confidence',
  },
  {
    id: 2,
    badge: 'STAGE 03 · INSTITUTIONAL ALPHA',
    headline: 'Forensic Screener & Guardrails',
    subhead: 'Real-time technical breakout radar and verified corporate filings.',
    metric: 'Zero-Lag Execution',
  },
];

interface StoryCanvas3DProps {
  onChapterChange?: (chapterIndex: number) => void;
  activeChapterIndex?: number;
}

export const StoryCanvas3D: React.FC<StoryCanvas3DProps> = ({
  onChapterChange,
  activeChapterIndex: controlledChapter,
}) => {
  const [internalChapter, setInternalChapter] = useState(0);
  const currentChapterIndex = controlledChapter !== undefined ? controlledChapter : internalChapter;

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Auto-progress chapter
  useEffect(() => {
    const timer = setInterval(() => {
      handleChapterSelect((currentChapterIndex + 1) % CHAPTERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [currentChapterIndex]);

  const handleChapterSelect = (index: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      if (controlledChapter === undefined) {
        setInternalChapter(index);
      }
      onChapterChange?.(index);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
    });
  };

  const currentChapter = CHAPTERS[currentChapterIndex];

  return (
    <View style={styles.container}>
      {/* 3D Isometric Centerpiece */}
      <Animated.View
        style={[
          styles.hero3DBox,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {currentChapterIndex === 0 && (
          <View style={styles.cubeCluster}>
            <IsometricCube size={74} baseColor="gold" elevateAmount={10} duration={2600} style={styles.centerCube} />
            <IsometricCube size={48} baseColor="emerald" delay={200} elevateAmount={8} duration={2800} style={styles.leftCube} />
            <IsometricCube size={48} baseColor="cyan" delay={400} elevateAmount={8} duration={3000} style={styles.rightCube} />
          </View>
        )}

        {currentChapterIndex === 1 && (
          <View style={styles.cubeCluster}>
            <IsometricCube size={78} baseColor="gold" elevateAmount={8} duration={2400} style={styles.centerCube} />
            <IsometricCube size={44} baseColor="purple" delay={150} elevateAmount={9} duration={2800} style={styles.leftCube} />
            <IsometricCube size={44} baseColor="cyan" delay={300} elevateAmount={9} duration={2800} style={styles.rightCube} />
          </View>
        )}

        {currentChapterIndex === 2 && (
          <View style={styles.cubeCluster}>
            <IsometricCube size={76} baseColor="emerald" elevateAmount={10} duration={2600} style={styles.centerCube} />
            <IsometricCube size={50} baseColor="gold" delay={200} elevateAmount={8} duration={2900} style={styles.leftCube} />
            <IsometricCube size={50} baseColor="gold" delay={350} elevateAmount={8} duration={2900} style={styles.rightCube} />
          </View>
        )}

        {/* Live HUD Metric Pill */}
        <View style={styles.hudPill}>
          <View style={styles.hudDot} />
          <Text style={styles.hudText}>{currentChapter.metric}</Text>
        </View>
      </Animated.View>

      {/* Story Narrative Text */}
      <Animated.View style={[styles.narrativeBox, { opacity: fadeAnim }]}>
        <Text style={styles.badgeText}>{currentChapter.badge}</Text>
        <Text style={styles.headlineText}>{currentChapter.headline}</Text>
        <Text style={styles.subheadText}>{currentChapter.subhead}</Text>
      </Animated.View>

      {/* Progress Bars */}
      <View style={styles.progressRow}>
        {CHAPTERS.map((_, idx) => {
          const isActive = idx === currentChapterIndex;
          return (
            <TouchableOpacity
              key={`prog_${idx}`}
              activeOpacity={0.7}
              onPress={() => handleChapterSelect(idx)}
              style={styles.progressTouch}
            >
              <View style={[styles.progressBar, isActive && styles.progressBarActive]} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  hero3DBox: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cubeCluster: {
    width: 220,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerCube: {
    position: 'absolute',
    zIndex: 10,
  },
  leftCube: {
    position: 'absolute',
    left: 20,
    top: 30,
    zIndex: 8,
  },
  rightCube: {
    position: 'absolute',
    right: 20,
    top: 30,
    zIndex: 8,
  },
  hudPill: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 15, 20, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 58, 0.35)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    gap: 6,
  },
  hudDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.bull,
  },
  hudText: {
    fontFamily: typography.monoMedium,
    fontSize: 10,
    color: colors.textPrimary,
  },
  narrativeBox: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    gap: 3,
  },
  badgeText: {
    fontFamily: typography.monoMedium,
    fontSize: 9,
    color: colors.accent,
    letterSpacing: 1,
  },
  headlineText: {
    fontFamily: typography.sansBold,
    fontSize: 17,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subheadText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  progressTouch: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  progressBar: {
    width: 24,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  progressBarActive: {
    width: 36,
    backgroundColor: colors.accent,
  },
});
