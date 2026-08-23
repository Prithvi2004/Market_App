/**
 * DiagnosticsOverlay — Live App Metadata & OTA Channel Diagnostic System.
 * Displays app version, runtime version, active EAS channel, update ID, and API URL.
 * Automatically posts runtime metadata logs to backend /api/client-log.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { API_BASE_URL } from '../../api/client';
import { colors } from '../../theme/colors';

export function DiagnosticsOverlay() {
  const [expanded, setExpanded] = useState(false);
  const [meta, setMeta] = useState({
    version: Constants.expoConfig?.version ?? '1.0.0',
    runtimeVersion: String(Updates.runtimeVersion ?? '1.0.0'),
    channel: Updates.channel ?? 'none',
    updateId: Updates.updateId ?? 'embedded',
    isEmbedded: Updates.isEmbeddedLaunch,
    apiUrl: API_BASE_URL,
  });

  useEffect(() => {
    // Send runtime metadata log to backend /api/client-logs
    try {
      fetch(`${API_BASE_URL}/api/client-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'INFO',
          message: 'APP_LAUNCH_DIAGNOSTICS',
          details: meta,
        }),
      }).catch(() => {});
    } catch {}
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.pill}
        activeOpacity={0.8}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.pillText}>
          ⚙️ v{meta.version} | Ch: {meta.channel} | Upd: {meta.updateId ? meta.updateId.slice(0, 6) : 'embed'}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.detailsCard}>
          <Text style={styles.title}>📱 App Metadata & OTA Status</Text>
          <Text style={styles.row}>App Version: <Text style={styles.val}>{meta.version}</Text></Text>
          <Text style={styles.row}>Runtime Version: <Text style={styles.val}>{meta.runtimeVersion}</Text></Text>
          <Text style={styles.row}>EAS Channel: <Text style={styles.val}>{meta.channel}</Text></Text>
          <Text style={styles.row}>Update ID: <Text style={styles.val}>{meta.updateId}</Text></Text>
          <Text style={styles.row}>Is Embedded Launch: <Text style={styles.val}>{String(meta.isEmbedded)}</Text></Text>
          <Text style={styles.row}>API Base URL: <Text style={styles.val}>{meta.apiUrl}</Text></Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 70,
    right: 12,
    zIndex: 9999,
  },
  pill: {
    backgroundColor: '#161922',
    borderColor: '#D4963A60',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillText: {
    fontSize: 9,
    fontFamily: 'DMMono_500Medium',
    color: colors.accent,
  },
  detailsCard: {
    position: 'absolute',
    bottom: 30,
    right: 0,
    width: 280,
    backgroundColor: '#0e0f14',
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  title: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  row: {
    fontSize: 10,
    color: colors.textMuted,
  },
  val: {
    color: colors.accent,
    fontWeight: 'bold',
  },
});
