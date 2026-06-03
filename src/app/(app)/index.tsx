import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, View } from '@/components/ui';
import { getChats } from '@/services/chats.api';
import { useAuthStore } from '@/stores/auth.store';
import type { Chat } from '@/types';

const AVATAR_COLORS = [
  '#6366f1',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ef4444',
  '#14b8a6',
];

function getAvatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatTimestamp(ts: string | null | undefined): string {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getChatDisplayName(chat: Chat, myUserId: number | undefined): string {
  if (chat.name) return chat.name;
  if (chat.type === 'SINGLE') {
    const other = chat.participants.find((p) => p.id !== myUserId);
    return other?.username ?? 'Unknown';
  }
  return `Group · ${chat.participants.length}`;
}

function ChatItem({
  chat,
  myUserId,
  onPress,
}: {
  chat: Chat;
  myUserId: number | undefined;
  onPress: () => void;
}) {
  const name = getChatDisplayName(chat, myUserId);
  const color = getAvatarColor(chat.id);
  const lastMsg = chat.lastMessage;
  const isGroup = chat.type === 'GROUP';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.65}
      className="flex-row items-center px-4 py-2"
    >
      {/* Avatar */}
      <View
        className="mr-3 size-[54px] items-center justify-center rounded-full"
        style={{ backgroundColor: color }}
      >
        {isGroup ? (
          <Text className="text-[22px]">👥</Text>
        ) : (
          <Text className="text-lg font-bold text-white">
            {getInitials(name)}
          </Text>
        )}
      </View>

      {/* Content */}
      <View
        className="flex-1 pb-2 pt-0.5"
        style={{
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: '#e5e5ea',
        }}
      >
        <View className="flex-row items-baseline justify-between">
          <Text
            className="flex-1 text-base font-semibold text-black"
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text className="ml-2 text-xs text-[#8d8d93]">
            {formatTimestamp(lastMsg?.timestamp ?? chat.createdAt)}
          </Text>
        </View>
        <Text className="mt-0.5 text-sm text-[#8d8d93]" numberOfLines={1}>
          {lastMsg
            ? lastMsg.senderId === myUserId
              ? `You: ${lastMsg.content}`
              : lastMsg.content
            : 'No messages yet'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ChatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [chats, setChats] = useState<Chat[]>([]);
  const [setLoading] = useState(true);
  const [setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadChats = useCallback(async () => {
    try {
      const data = await getChats();
      setChats(
        [...data].sort((a, b) => {
          const aTime = a.lastMessage?.timestamp ?? a.createdAt;
          const bTime = b.lastMessage?.timestamp ?? b.createdAt;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        })
      );
    } catch (err: any) {
      showMessage({
        message: err?.message ?? 'Failed to load chats',
        type: 'danger',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadChats();
  }, [loadChats]);

  const filtered =
    search.trim().length > 0
      ? chats.filter((c) =>
          getChatDisplayName(c, user?.id)
            .toLowerCase()
            .includes(search.toLowerCase())
        )
      : chats;

  const renderItem = useCallback(
    ({ item }: { item: Chat }) => (
      <ChatItem
        chat={item}
        myUserId={user?.id}
        onPress={() => router.push(`/chat/${item.id}`)}
      />
    ),
    [user?.id, router]
  );

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="absolute inset-x-0 top-0 z-50"
    >
      <BlurView intensity={60} tint="dark" className="rounded-b-3xl px-3 pb-2">
        {/* Row */}
        <View className="mt-2 flex-row items-center justify-center p-4">
          <TouchableOpacity
            onPress={() => router.push('/chat/new')}
            activeOpacity={0.7}
            className="absolute left-0 size-10 items-center justify-center rounded-full bg-white/20"
          >
            <Text className="text-xs text-white">Edit</Text>
          </TouchableOpacity>

          <Text className="text-sm text-white/10">Chats</Text>

          <TouchableOpacity className="absolute right-0 size-10 items-center justify-center rounded-full bg-white/20">
            <Text className="text-white">⋯</Text>
          </TouchableOpacity>
        </View>

        {/* Search glass */}
        <View className="mt-3 flex-row items-center rounded-2xl bg-white/10 px-4 py-2">
          <TextInput
            placeholder="Search"
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={search}
            onChangeText={setSearch}
            className="flex-1  text-sm text-white"
            underlineColorAndroid="transparent"
            style={{ outlineStyle: 'none' } as any}
          />

          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <View className="size-5 items-center justify-center rounded-full bg-white/30">
                <Text className="text-xs text-white">✕</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </BlurView>
    </View>
  );
}
