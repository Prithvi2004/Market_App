/**
 * AuthTerminalCard — Email / Password Sign In & Sign Up + Demo Trader
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

interface AuthTerminalCardProps {
  onSuccess?: () => void;
}

export const AuthTerminalCard: React.FC<AuthTerminalCardProps> = ({ onSuccess }) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { signIn, signUp, signInGuestDemo, resetPassword, error: storeError, clearError } =
    useAuthStore();

  const activeError = localError || storeError;

  const resetErrors = () => { setLocalError(null); clearError(); };

  const handleEmailAuth = async () => {
    resetErrors();
    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter your email and password.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    try {
      setIsSubmitting(true);
      if (tab === 'signin') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, displayName.trim());
      }
      onSuccess?.();
    } catch (err: any) {
      setLocalError(err?.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestDemo = async () => {
    resetErrors();
    try {
      setIsSubmitting(true);
      await signInGuestDemo();
      onSuccess?.();
    } catch {
      setLocalError('Failed to launch guest session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Reset Password', 'Enter your email above first.');
      return;
    }
    Alert.alert('Reset Password', `Send reset link to ${email.trim()}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send',
        onPress: async () => {
          try {
            await resetPassword(email.trim());
            Alert.alert('Sent', 'Check your inbox for the reset link.');
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Could not send reset email.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.card}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['signin', 'signup'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            activeOpacity={0.8}
            onPress={() => { setTab(t); resetErrors(); }}
            style={[styles.tabButton, tab === t && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'signin' ? 'Sign In' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Error */}
      {activeError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{activeError}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        {tab === 'signup' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Arjun Sharma"
              placeholderTextColor={colors.textDim}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
            placeholder="trader@marketpulse.com"
            placeholderTextColor={colors.textDim}
            value={email}
            onChangeText={(t) => { setEmail(t); resetErrors(); }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>PASSWORD</Text>
            {tab === 'signin' && (
              <TouchableOpacity activeOpacity={0.7} onPress={handleForgotPassword}>
                <Text style={styles.forgotLink}>Forgot?</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[styles.input, { paddingRight: 55 }]}
              placeholder="••••••••••••"
              placeholderTextColor={colors.textDim}
              value={password}
              onChangeText={(t) => { setPassword(t); resetErrors(); }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              <Text style={styles.eyeText}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Primary CTA */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleEmailAuth}
          disabled={isSubmitting}
          style={styles.primaryBtn}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#0b0b09" size="small" />
          ) : (
            <Text style={styles.primaryBtnText}>
              {tab === 'signin' ? 'Sign In to Terminal' : 'Create Account'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Demo Trader */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleGuestDemo}
          disabled={isSubmitting}
          style={styles.guestLink}
        >
          <Text style={styles.guestLinkText}>
            ⚡ Explore as{' '}
            <Text style={styles.guestLinkHighlight}>Demo Trader Sandbox</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#0e0f14',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 58, 0.22)',
    padding: spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm + 2,
  },
  tabButtonActive: { backgroundColor: colors.accent },
  tabText: { fontFamily: typography.sansMedium, fontSize: 13, color: colors.textMuted },
  tabTextActive: { color: '#0b0b09', fontFamily: typography.sansBold },
  errorBox: {
    backgroundColor: 'rgba(244,63,94,0.10)',
    borderColor: 'rgba(244,63,94,0.3)',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    marginBottom: spacing.sm,
  },
  errorText: { fontFamily: typography.sans, fontSize: 12, color: colors.bear },
  form: { gap: spacing.sm + 2 },
  inputGroup: { gap: 4 },
  label: {
    fontFamily: typography.monoMedium,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgotLink: { fontFamily: typography.sans, fontSize: 11, color: colors.accentLight },
  input: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(212,150,58,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontFamily: typography.sans,
    fontSize: 14,
    color: colors.textPrimary,
  },
  passwordWrapper: { position: 'relative', justifyContent: 'center' },
  eyeBtn: { position: 'absolute', right: 12, padding: 4 },
  eyeText: { fontFamily: typography.monoMedium, fontSize: 10, color: colors.accent },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryBtnText: { fontFamily: typography.sansBold, fontSize: 14, color: '#0b0b09' },
  guestLink: { alignItems: 'center', paddingVertical: spacing.xs },
  guestLinkText: { fontFamily: typography.sans, fontSize: 12, color: colors.textMuted },
  guestLinkHighlight: { color: colors.accentLight, fontFamily: typography.sansBold },
});
