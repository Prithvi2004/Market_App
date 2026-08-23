/**
 * Clean & Refined MarketPulse Login & Gateway Screen
 * Streamlined 3D block storytelling hero, logo emblem, and balanced authentication card.
 */
import React from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StoryCanvas3D } from '../src/components/auth/StoryCanvas3D';
import { AuthTerminalCard } from '../src/components/auth/AuthTerminalCard';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();

  const handleAuthSuccess = () => {
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.ink} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoRow}>
            <View style={styles.logoBadge}>
              <Image
                source={require('../assets/icon.png')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            <View>
              <Text style={styles.brandTitle}>MarketPulse</Text>
              <Text style={styles.brandSubtitle}>INSTITUTIONAL AI TERMINAL</Text>
            </View>
          </View>
        </View>

        {/* 3D Storytelling Hero */}
        <View style={styles.storySection}>
          <StoryCanvas3D />
        </View>

        {/* Auth Terminal Card */}
        <View style={styles.authSection}>
          <AuthTerminalCard onSuccess={handleAuthSuccess} />
        </View>

        {/* Security Tagline */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Secured by Google Cloud & Firebase · SEBI Data Protocols
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: 'rgba(212, 150, 58, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 58, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 30,
    height: 30,
    borderRadius: 7,
  },
  brandTitle: {
    fontFamily: typography.serif,
    fontSize: 22,
    color: colors.textPrimary,
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    fontFamily: typography.monoMedium,
    fontSize: 8.5,
    color: colors.accent,
    letterSpacing: 1.2,
  },
  storySection: {
    width: '100%',
    marginVertical: spacing.xs,
  },
  authSection: {
    width: '100%',
    marginTop: spacing.xs,
  },
  footer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: typography.mono,
    fontSize: 9.5,
    color: colors.textDim,
    letterSpacing: 0.3,
  },
});
