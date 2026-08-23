/**
 * UpdateModal — Automatic In-App Update Notification & Direct In-App OTA Installer.
 *
 * Automatically fetches the new update over-the-air via `expo-updates` and reloads
 * the app instantly without redirecting to a browser or needing a new APK install.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../api/client';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

interface VersionResponse {
  latest_version: string;
  min_required_version: string;
  update_url: string;
  release_notes?: string;
  force_update?: boolean;
}

export function UpdateModal() {
  const currentVersion = Constants.expoConfig?.version ?? '1.0.0';

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const { data: versionData } = useQuery<VersionResponse>({
    queryKey: ['app-version'],
    queryFn: () => apiFetch('/api/version'),
    staleTime: 60_000,
  });

  if (dismissed) return null;

  const hasNewVersion = isVersionGreater(versionData?.latest_version || '1.0.0', currentVersion);

  if (!hasNewVersion) return null;

  const isForceUpdate = versionData?.force_update;

  const handleApplyUpdate = async () => {
    setIsUpdating(true);
    setUpdateStatus('Checking for in-app update...');

    try {
      if (!__DEV__) {
        setUpdateStatus('Downloading update...');
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          setUpdateStatus('Applying update & restarting...');
          await Updates.reloadAsync();
          return;
        }
      }
      // If no OTA or in dev mode / failed, fallback to link
      if (versionData?.update_url) {
        setUpdateStatus('Opening download page...');
        await Linking.openURL(versionData.update_url);
      }
    } catch (error) {
      console.warn('In-app update error:', error);
      // If OTA fetch fails, open update URL as fallback
      if (versionData?.update_url) {
        await Linking.openURL(versionData.update_url);
      }
    } finally {
      setIsUpdating(false);
      setUpdateStatus(null);
    }
  };

  return (
    <Modal transparent animationType="fade" visible={hasNewVersion && !dismissed}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🚀</Text>
          </View>

          <Text style={styles.title}>Update Available!</Text>

          <Text style={styles.subtitle}>
            New version {versionData?.latest_version} is available. Tap below to update in-app.
          </Text>

          {versionData?.release_notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>What's New:</Text>
              <Text style={styles.notesText}>{versionData.release_notes}</Text>
            </View>
          ) : null}

          {updateStatus ? (
            <Text style={styles.statusText}>{updateStatus}</Text>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            {!isForceUpdate && (
              <TouchableOpacity
                style={styles.laterBtn}
                activeOpacity={0.8}
                disabled={isUpdating}
                onPress={() => setDismissed(true)}
              >
                <Text style={styles.laterText}>Later</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.updateBtn}
              activeOpacity={0.85}
              disabled={isUpdating}
              onPress={handleApplyUpdate}
            >
              {isUpdating ? (
                <ActivityIndicator color="#000000" size="small" />
              ) : (
                <Text style={styles.updateText}>Update In-App</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function isVersionGreater(latest: string, current: string): boolean {
  try {
    const lParts = latest.split('.').map(Number);
    const cParts = current.split('.').map(Number);
    for (let i = 0; i < Math.max(lParts.length, cParts.length); i++) {
      const l = lParts[i] || 0;
      const c = cParts[i] || 0;
      if (l > c) return true;
      if (l < c) return false;
    }
  } catch {}
  return false;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#12131A',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  iconText: {
    fontSize: 26,
  },
  title: {
    fontSize: typography.size.md,
    fontFamily: typography.sansBold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.size.xs,
    fontFamily: typography.sans,
    color: colors.textMuted,
    textAlign: 'center',
  },
  notesBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 4,
    marginVertical: spacing.xs,
  },
  notesTitle: {
    fontSize: 10,
    fontFamily: typography.sansBold,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 11,
    fontFamily: typography.sans,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  statusText: {
    fontSize: 11,
    fontFamily: typography.sansBold,
    color: colors.accent,
    textAlign: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.xs,
  },
  laterBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  laterText: {
    fontSize: 12,
    fontFamily: typography.sansBold,
    color: colors.textMuted,
  },
  updateBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateText: {
    fontSize: 12,
    fontFamily: typography.sansBold,
    color: '#000000',
  },
});
