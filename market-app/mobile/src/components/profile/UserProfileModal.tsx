/**
 * User Profile Modal Component
 * Displays institutional clearance metadata, Firebase/Google Cloud status,
 * user alias, and session management actions.
 */
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to disconnect your trader session and return to the gateway?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            onClose();
            await signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const initial = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : '⚡';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header handle */}
          <View style={styles.handleBar} />

          {/* Title Row */}
          <View style={styles.headerRow}>
            <View style={styles.titleWithIcon}>
              <Text style={styles.headerTitle}>Trader Profile & Clearance</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* User Identity Card */}
            <View style={styles.identityCard}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>{initial}</Text>
              </View>
              <View style={styles.identityDetails}>
                <Text style={styles.userNameText} numberOfLines={1}>
                  {user?.displayName || 'Institutional Trader'}
                </Text>
                <Text style={styles.userEmailText} numberOfLines={1}>
                  {user?.email || 'authenticated.session@marketpulse.internal'}
                </Text>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.clearancePill,
                      {
                        backgroundColor: user?.isGuest
                          ? 'rgba(212, 150, 58, 0.15)'
                          : 'rgba(16, 185, 129, 0.15)',
                        borderColor: user?.isGuest
                          ? 'rgba(212, 150, 58, 0.35)'
                          : 'rgba(16, 185, 129, 0.35)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.clearancePillText,
                        { color: user?.isGuest ? colors.accent : colors.bull },
                      ]}
                    >
                      {user?.isGuest ? 'DEMO ALPHA SANDBOX' : 'VERIFIED INSTITUTIONAL ID'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Account Metadata Grid */}
            <View style={styles.metadataGrid}>
              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>REGISTERED EMAIL</Text>
                <Text style={[styles.metaValue, { color: colors.accentLight }]} numberOfLines={1}>
                  {user?.email || 'N/A'}
                </Text>
              </View>
              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>AUTH PROVIDER</Text>
                <Text style={styles.metaValue}>
                  {user?.isGuest ? 'Demo Sandbox' : user?.photoURL ? 'Google OAuth' : 'Email / Pass'}
                </Text>
              </View>
              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>TRADER UID</Text>
                <Text style={styles.metaValue} numberOfLines={1}>
                  {user?.uid ? `${user.uid.slice(0, 16)}…` : 'LIVE_SESSION'}
                </Text>
              </View>
              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>FIRESTORE CLOUD</Text>
                <Text style={[styles.metaValue, { color: colors.bull }]}>● SYNCED</Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  onClose();
                  router.push('/(tabs)/portfolio');
                }}
                style={styles.actionRow}
              >
                <View style={styles.actionLeft}>
                  <Ionicons name="wallet-outline" size={18} color={colors.accent} />
                  <Text style={styles.actionLabel}>View Portfolio & Holdings</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  onClose();
                  router.push('/earnings');
                }}
                style={styles.actionRow}
              >
                <View style={styles.actionLeft}>
                  <Ionicons name="stats-chart-outline" size={18} color={colors.accent} />
                  <Text style={styles.actionLabel}>Q-Results Terminal</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
              </TouchableOpacity>
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity activeOpacity={0.85} onPress={handleSignOut} style={styles.signOutButton}>
              <Ionicons name="log-out-outline" size={18} color={colors.bear} />
              <Text style={styles.signOutButtonText}>Disconnect & Sign Out</Text>
            </TouchableOpacity>

            <Text style={styles.versionFooter}>
              MarketPulse Core v1.1.0 · Protected by Google Identity
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0e0f14',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 58, 0.25)',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['2xl'],
    maxHeight: '85%',
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: typography.sansBold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  scrollBody: {
    gap: spacing.lg,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 58, 0.2)',
    padding: spacing.md,
    gap: spacing.md,
  },
  avatarLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    fontFamily: typography.sansBold,
    fontSize: 22,
    color: colors.accentLight,
  },
  identityDetails: {
    flex: 1,
    gap: 3,
  },
  userNameText: {
    fontFamily: typography.sansBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  userEmailText: {
    fontFamily: typography.mono,
    fontSize: 12,
    color: colors.textMuted,
  },
  badgeRow: {
    marginTop: 4,
    flexDirection: 'row',
  },
  clearancePill: {
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  clearancePillText: {
    fontFamily: typography.monoMedium,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: spacing.sm + 2,
    gap: 4,
  },
  metaLabel: {
    fontFamily: typography.mono,
    fontSize: 9,
    color: colors.textDim,
    letterSpacing: 0.6,
  },
  metaValue: {
    fontFamily: typography.monoMedium,
    fontSize: 12,
    color: colors.textPrimary,
  },
  actionSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionLabel: {
    fontFamily: typography.sansMedium,
    fontSize: 13,
    color: colors.textPrimary,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderRadius: radius.lg,
    paddingVertical: 13,
  },
  signOutButtonText: {
    fontFamily: typography.sansBold,
    fontSize: 13,
    color: colors.bear,
  },
  versionFooter: {
    fontFamily: typography.mono,
    fontSize: 10,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: 4,
  },
});
