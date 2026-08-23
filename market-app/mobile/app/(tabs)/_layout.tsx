/**
 * Tab bar layout — Markets, News, Sectors, Screener, Portfolio.
 */
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused }: { name: TabIconName; focused: boolean }) {
  return (
    <Ionicons
      name={name}
      size={22}
      color={focused ? colors.accent : colors.textMuted}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#0e0f14',
          borderTopColor: 'rgba(212,150,58,0.12)',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: typography.sansMedium,
          fontSize: typography.size['2xs'],
          letterSpacing: 0.3,
        },
        headerStyle: { backgroundColor: '#0e0f14' },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontFamily: typography.sansBold,
          fontSize: 16,
          color: colors.textPrimary,
        },
        headerShadowVisible: false,
        headerTitleAlign: 'left',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Markets',
          headerTitle: 'MarketPulse',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'trending-up' : 'trending-up-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'News',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'newspaper' : 'newspaper-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ipo"
        options={{
          title: 'IPO Hub',
          headerTitle: 'IPO Deep Research',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'rocket' : 'rocket-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="sectors"
        options={{
          title: 'Sectors',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="screener"
        options={{
          title: 'Screener',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'search' : 'search-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'briefcase' : 'briefcase-outline'} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
