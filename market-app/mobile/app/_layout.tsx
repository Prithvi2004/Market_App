/**
 * Root layout — sets up QueryClient, SafeAreaProvider, fonts, Toast notifications, UpdateModal, and global styles.
 */
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
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

  // Vercel-like Automatic OTA Update & Reload Effect
  useEffect(() => {
    async function checkForOTAUpdates() {
      if (__DEV__) return;
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
