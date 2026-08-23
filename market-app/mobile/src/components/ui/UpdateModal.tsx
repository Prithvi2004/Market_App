/**
 * UpdateModal — Seamless In-App OTA Update System.
 *
 * On launch, silently checks for EAS OTA updates. If found, downloads the update
 * and prompts the user to restart the app to apply it — all without leaving the app.
 *
 * Also checks /api/version for version-based update notifications with release notes.
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ActivityIndicator,
  Platform,
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

type UpdatePhase =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'ready'       // OTA downloaded, waiting for user to restart
  | 'no-ota';     // No OTA available, fallback to version-based prompt

export function UpdateModal() {
  const currentVersion = Constants.expoConfig?.version ?? '1.0.0';

  const [phase, setPhase] = useState<UpdatePhase>('idle');
  const [isRestarting, setIsRestarting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const didCheck = useRef(false);

  const { data: versionData } = useQuery<VersionResponse>({
    queryKey: ['app-version'],
    queryFn: () => apiFetch('/api/version'),
    staleTime: 60_000,
  });

  // Eagerly check and pre-download OTA update on mount
  useEffect(() => {
    if (didCheck.current) return;
    didCheck.current = true;

    async function autoCheckOta() {
      if (__DEV__ || Platform.OS === 'web') {
        setPhase('no-ota');
        return;
      }

      try {
        setPhase('checking');
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          setPhase('downloading');
          await Updates.fetchUpdateAsync();
          setPhase('ready');
        } else {
          setPhase('no-ota');
        }
      } catch (error) {
        console.warn('OTA check error:', error);
        setPhase('no-ota');
      }
    }

    autoCheckOta();
  }, []);

  const handleRestart = async () => {
    try {
      setIsRestarting(true);
      await Updates.reloadAsync();
    } catch (error) {
      console.warn('Restart failed:', error);
      setIsRestarting(false);
      setPhase('no-ota');
    }
  };

  if (dismissed) return null;

  // Phase: OTA downloaded and ready — show "Restart to Apply"
  if (phase === 'ready') {
    return (
      <Modal transparent animationType="fade" visible>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>✅</Text>
            </View>

            <Text style={styles.title}>Update Downloaded!</Text>
            <Text style={styles.subtitle}>
              The latest update has been downloaded. Restart the app to apply it.
            </Text>

            {versionData?.release_notes ? (
              <View style={styles.notesBox}>
                <Text style={styles.notesTitle}>What's New:</Text>
                <Text style={styles.notesText}>{versionData.release_notes}</Text>
              </View>
            ) : null}

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.laterBtn}
                activeOpacity={0.8}
                onPress={() => setDismissed(true)}
              >
                <Text style={styles.laterText}>Later</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.updateBtn}
                activeOpacity={0.85}
                disabled={isRestarting}
                onPress={handleRestart}
              >
                {isRestarting ? (
                  <ActivityIndicator color="#000000" size="small" />
                ) : (
                  <Text style={styles.updateText}>Restart Now</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Phase: Actively checking or downloading — show progress
  if (phase === 'checking' || phase === 'downloading') {
    return (
      <Modal transparent animationType="fade" visible>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.statusText}>
              {phase === 'checking' ? 'Checking for updates...' : 'Downloading update...'}
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  // Phase: No OTA available — fallback to version-based check via /api/version
  const hasNewVersion = versionData
    ? isVersionGreater(versionData.latest_version, currentVersion)
    : false;

  if (!hasNewVersion || phase === 'idle') return null;

  // If we reach here, there's a version mismatch but no OTA was available.
  // This means a new native build (APK) is required.
  const isForceUpdate = versionData?.force_update;

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🚀</Text>
          </View>

          <Text style={styles.title}>New Version Available!</Text>
          <Text style={styles.subtitle}>
            Version {versionData?.latest_version} requires a new app install (you have {currentVersion}).
          </Text>

          {versionData?.release_notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>What's New:</Text>
              <Text style={styles.notesText}>{versionData.release_notes}</Text>
            </View>
          ) : null}

          <View style={styles.btnRow}>
            {!isForceUpdate && (
              <TouchableOpacity
                style={styles.laterBtn}
                activeOpacity={0.8}
                onPress={() => setDismissed(true)}
              >
                <Text style={styles.laterText}>Later</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.updateBtn}
              activeOpacity={0.85}
              onPress={() => Linking.openURL(versionData?.update_url || '')}
            >
              <Text style={styles.updateText}>Download Update</Text>
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
    fontSize: 12,
    fontFamily: typography.sansBold,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
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
