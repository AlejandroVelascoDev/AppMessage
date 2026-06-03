import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { showMessage } from 'react-native-flash-message';
import * as z from 'zod';

import {
  Button,
  ControlledInput,
  FocusAwareStatusBar,
  Pressable,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { signIn } from '@/lib';
import { login, register } from '@/services/auth.api';
import { useAuthStore } from '@/stores/auth.store';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'At least 6 characters'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'At least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'At least 6 characters'),
});

type LoginFields = z.infer<typeof loginSchema>;
type RegisterFields = z.infer<typeof registerSchema>;

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const hydrate = useAuthStore((s) => s.hydrate);
  const isLogin = mode === 'login';

  const { handleSubmit, control, reset } = useForm<LoginFields & RegisterFields>({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
  });

  const onSubmit = async (data: LoginFields & RegisterFields) => {
    try {
      setLoading(true);
      const token = isLogin
        ? await login(data.email, data.password)
        : await register(data.email, data.username, data.password);

      // Sync MMKV auth gate so the tab layout redirects correctly
      signIn({ access: token, refresh: token });
      await hydrate();
      router.replace('/');
    } catch (err: any) {
      showMessage({
        message: err?.message ?? 'Something went wrong. Please try again.',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    reset();
  };

  return (
    <>
      <FocusAwareStatusBar />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={10}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Title */}
          <View className="mb-8 items-center">
            <View className="mb-4 size-16 items-center justify-center rounded-2xl bg-black dark:bg-white">
              <Text className="text-2xl font-bold text-white dark:text-black">💬</Text>
            </View>
            <Text className="text-3xl font-bold">
              {isLogin ? 'Welcome back' : 'Create account'}
            </Text>
            <Text className="mt-2 text-center text-neutral-500 dark:text-neutral-400">
              {isLogin
                ? 'Sign in to continue chatting'
                : 'Join and start a conversation'}
            </Text>
          </View>

          {/* Form */}
          <View className="gap-1">
            {!isLogin && (
              <ControlledInput
                control={control}
                name="username"
                label="Username"
                placeholder="yourname"
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
            <ControlledInput
              control={control}
              name="email"
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <ControlledInput
              control={control}
              name="password"
              label="Password"
              placeholder="••••••••"
              secureTextEntry
            />
          </View>

          <Button
            label={isLogin ? 'Sign In' : 'Create Account'}
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            size="lg"
            className="mt-4"
          />

          <Pressable onPress={toggleMode} className="mt-6 items-center py-2">
            <Text className="text-neutral-500 dark:text-neutral-400">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Text className="font-semibold text-black dark:text-white">
                {isLogin ? 'Sign up' : 'Sign in'}
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
