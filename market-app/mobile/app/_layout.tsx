/**
 * Root layout — sets up QueryClient, SafeAreaProvider, fonts, Toast notifications, UpdateModal, and global styles.
 */
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  DMMono_400Regular,
  DMMono_500Medium,
} from '@expo-google-fonts/dm-mono';
import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import { useLivePricesWS } from '../src/hooks/useWebSocket';
import { ToastContainer } from '../src/components/ui/Toast';
import { UpdateModal } from '../src/components/ui/UpdateModal';
import { DiagnosticsOverlay } from '../src/components/ui/DiagnosticsOverlay';
import { colors } from '../src/theme/colors';

import * as Updates from 'expo-updates';

import { useAuthStore } from '../src/store/useAuthStore';
import { useRouter, useSegments } from 'expo-router';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
      staleTime: 30_000,
    },
  },
});

function WSProvider() {
  useLivePricesWS();
  return null;
}

function AuthGuard() {
  const { isAuthenticated, isInitializing, initializeAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (isInitializing) return;

    const inAuthGroup = segments[0] === 'login';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to the 3D storytelling login gateway
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect into main tab terminal
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isInitializing, segments]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    DMMono_400Regular,
    DMMono_500Medium,
    DMSerifDisplay_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Automatic OTA Update & Reload Effect (Native iOS/Android only)
  useEffect(() => {
    async function checkForOTAUpdates() {
      if (__DEV__ || Platform.OS === 'web') return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (e) {
        // Quiet fallback if offline or no network
      }
    }
    checkForOTAUpdates();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <View style={styles.root}>
          <StatusBar style="light" />
          <ToastContainer />
          <UpdateModal />
          <DiagnosticsOverlay />
          <WSProvider />
          <AuthGuard />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.textPrimary,
              headerTitleStyle: {
                fontFamily: 'DMSans_700Bold',
                fontSize: 16,
              },
              contentStyle: { backgroundColor: colors.ink },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="stock/[symbol]"
              options={{ title: 'Stock Detail', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="stock-screener/[symbol]"
              options={{ title: 'Screener & Forecast Terminal', animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="analysis/[symbol]"
              options={{ title: 'Deep Analysis', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="search"
              options={{
                title: 'Search',
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="impact"
              options={{
                title: '⚡ AI Impact Analyzer',
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="earnings/index"
              options={{
                title: '⚡ Q-Results & Corporate Action Hub',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="earnings/[symbol]"
              options={{
                title: 'Institutional Q-Result Playbook',
                animation: 'slide_from_bottom',
              }}
            />
          </Stack>
        </View>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
  },
});
