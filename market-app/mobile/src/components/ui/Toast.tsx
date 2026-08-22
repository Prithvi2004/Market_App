/**
 * Toast Notification Component & Global Toast Emitter.
 * Renders sleek toast alerts at the top of the mobile screen.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  title: string;
  message?: string;
}

type ToastListener = (toast: ToastMessage) => void;
const listeners = new Set<ToastListener>();

export const toast = {
  show(title: string, message?: string, type: ToastMessage['type'] = 'info') {
    const toastObj: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      message,
    };
    listeners.forEach((fn) => fn(toastObj));
  },
  error(title: string, message?: string) {
    this.show(title, message, 'error');
  },
  success(title: string, message?: string) {
    this.show(title, message, 'success');
  },
  info(title: string, message?: string) {
    this.show(title, message, 'info');
  },
};

export function ToastContainer() {
  const [current, setCurrent] = useState<ToastMessage | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const handler: ToastListener = (t) => {
      setCurrent(t);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => setCurrent(null));
      }, 4000);
    };

    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  if (!current) return null;

  const bg =
    current.type === 'error'
      ? 'rgba(244,63,94,0.95)'
      : current.type === 'success'
      ? 'rgba(16,185,129,0.95)'
      : current.type === 'warning'
      ? 'rgba(245,158,11,0.95)'
      : 'rgba(14,15,20,0.95)';

  return (
    <Animated.View style={[styles.toast, { backgroundColor: bg, opacity: fadeAnim }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setCurrent(null)}
        style={styles.content}
      >
        <Text style={styles.title}>{current.title}</Text>
        {current.message && <Text style={styles.message}>{current.message}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 50,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  content: {
    gap: 2,
  },
  title: {
    fontSize: typography.size.sm,
    fontFamily: typography.sansBold,
    color: '#ffffff',
  },
  message: {
    fontSize: typography.size.xs,
    fontFamily: typography.sans,
    color: 'rgba(255,255,255,0.85)',
  },
});
