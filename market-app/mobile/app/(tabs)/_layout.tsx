import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { UserProfileModal } from '../../src/components/profile/UserProfileModal';
import { useAuthStore } from '../../src/store/useAuthStore';
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

function BrandHeaderTitle() {
  return (
    <View style={styles.brandTitleContainer}>
      <View style={styles.logoBadge}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logoImage}
          resizeMode="cover"
        />
      </View>
      <View>
        <Text style={styles.brandTitleText}>MarketPulse</Text>
      </View>
    </View>
  );
}

function HeaderProfileButton({ onPress }: { onPress: () => void }) {
  const user = useAuthStore((s) => s.user);
  const initial = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : '⚡';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.profileBtn}
    >
      <View style={styles.profileAvatar}>
        <Text style={styles.profileInitial}>{initial}</Text>
      </View>
      <View style={styles.onlineDot} />
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <UserProfileModal visible={profileOpen} onClose={() => setProfileOpen(false)} />
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
          headerRight: () => <HeaderProfileButton onPress={() => setProfileOpen(true)} />,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Markets',
            headerTitle: () => <BrandHeaderTitle />,
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
    </>
  );
}

const styles = StyleSheet.create({
  brandTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(212, 150, 58, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 58, 0.35)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 24,
    height: 24,
    borderRadius: 5,
  },
  brandTitleText: {
    fontFamily: typography.serif,
    fontSize: 19,
    color: colors.textPrimary,
    letterSpacing: 0.8,
  },
  profileBtn: {
    marginRight: 16,
    position: 'relative',
    padding: 2,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 150, 58, 0.15)',
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontFamily: typography.sansBold,
    fontSize: 13,
    color: colors.accentLight,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bull,
    borderWidth: 1.5,
    borderColor: '#0e0f14',
  },
});
