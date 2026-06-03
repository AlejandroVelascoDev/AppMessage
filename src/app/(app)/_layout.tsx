import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Redirect, SplashScreen, Tabs } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';

import { SlidingTabBar } from '@/components/SlidingTabBar';
import AnimatedIcon from '@/components/tab-bar-icon';
import {
  Messages as MessagesIcon,
  Settings as SettingsIcon,
} from '@/components/ui/icons';
import { useAuth, useIsFirstTime } from '@/lib';
import { useAuthStore } from '@/stores/auth.store';

export default function TabLayout() {
  const status = useAuth.use.status();
  const [isFirstTime] = useIsFirstTime();
  const [activeIndex, setActiveIndex] = useState(0);
  const hydrate = useAuthStore((s) => s.hydrate);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (status !== 'idle' && fontsLoaded) {
      setTimeout(hideSplash, 1000);
    }
  }, [hideSplash, status, fontsLoaded]);

  useEffect(() => {
    if (status === 'signIn') {
      hydrate();
    }
  }, [status, hydrate]);

  if (!fontsLoaded) return null;
  if (isFirstTime) return <Redirect href="/onboarding" />;
  if (status === 'signOut') return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          position: 'absolute',
          bottom: 24,
          left: 36,
          right: 36,
          height: 62,
          backgroundColor: 'transparent',
          borderRadius: 34,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.2,
          shadowRadius: 40,
          elevation: 20,
          borderTopWidth: 0,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#0d0d0d',
        tabBarInactiveTintColor: 'rgba(0,0,0,0.38)',
        tabBarLabelStyle: {
          marginTop: 2,
          fontSize: 10,
          fontFamily: 'Inter_600SemiBold',
          letterSpacing: 0.3,
        },
        tabBarBackground: () => <SlidingTabBar activeIndex={activeIndex} />,
      }}
      screenListeners={{
        tabPress: (e) => {
          const routes = ['index', 'settings'];
          const name = e.target?.split('-')[0];
          const idx = routes.indexOf(name ?? '');
          if (idx !== -1) setActiveIndex(idx);
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chats',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon focused={focused}>
              <MessagesIcon color={color} />
            </AnimatedIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon focused={focused}>
              <SettingsIcon color={color} />
            </AnimatedIcon>
          ),
        }}
      />
      <Tabs.Screen name="style" options={{ href: null }} />
    </Tabs>
  );
}
