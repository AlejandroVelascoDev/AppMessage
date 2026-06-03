import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, View } from '@/components/ui';
import { createChat } from '@/services/chats.api';
import { searchUsers } from '@/services/users.api';
import { useAuthStore } from '@/stores/auth.store';
import type { User } from '@/types';

const TG_BLUE = '#2AABEE';

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
  return name.slice(0, 2).toUpperCase();
}

function UserRow({
  item,
  isLoading,
  onPress,
}: {
  item: User;
  isLoading: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.65}
      disabled={isLoading}
      style={styles.userRow}
    >
      <View
        style={[
          styles.userAvatar,
          { backgroundColor: getAvatarColor(item.id) },
        ]}
      >
        <Text style={styles.userAvatarText}>{getInitials(item.username)}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.username}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      {isLoading && <ActivityIndicator size="small" color={TG_BLUE} />}
    </TouchableOpacity>
  );
}

export default function NewChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((s) => s.user);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState<number | null>(null);

  const onSearch = useCallback(
    async (text: string) => {
      setQuery(text);
      if (text.trim().length < 2) {
        setResults([]);
        return;
      }
      try {
        setSearching(true);
        const users = await searchUsers(text.trim());
        setResults(users.filter((u) => u.id !== currentUser?.id));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [currentUser?.id]
  );

  const startChat = useCallback(
    async (user: User) => {
      if (!currentUser) return;
      try {
        setStarting(user.id);
        const chat = await createChat([currentUser.id, user.id], 'SINGLE');
        router.replace(`/chat/${chat.id}`);
      } catch (err: any) {
        showMessage({
          message: err?.message ?? 'Could not start chat',
          type: 'danger',
        });
      } finally {
        setStarting(null);
      }
    },
    [currentUser, router]
  );

  const renderItem = useCallback(
    ({ item }: { item: User }) => (
      <UserRow
        item={item}
        isLoading={starting === item.id}
        onPress={() => startChat(item)}
      />
    ),
    [startChat, starting]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View className="px-4 pb-3" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between p-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-xs text-white/80">Cancel</Text>
          </TouchableOpacity>

          <Text className="text-xs font-semibold text-white">New Message</Text>
        </View>

        {/* Search */}
        <View className="mt-3 flex-row items-center rounded-2xl bg-white/10 px-3 py-2">
          <TextInput
            placeholder="Search by username"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={query}
            onChangeText={onSearch}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            className="flex-1 text-sm text-white"
            underlineColorAndroid="transparent"
            style={{ outlineStyle: 'none' } as any}
          />

          {query.length > 0 && (
            <TouchableOpacity onPress={() => onSearch('')}>
              <Text className="text-xs text-white/60">Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* New Group option (always visible) */}
      <TouchableOpacity
        onPress={() => router.push('/chat/new-group')}
        activeOpacity={0.7}
        className="mx-4 mt-3 flex-row items-center rounded-2xl bg-[#17212B] px-4 py-3"
      >
        <View className="mr-3 size-11 items-center justify-center rounded-full bg-[#2AABEE]/20">
          <View className="size-4 rounded-sm bg-[#2AABEE]" />
        </View>

        <View className="flex-1">
          <Text className="text-base font-medium text-white">New Group</Text>
          <Text className="text-xs text-[#9AA4AE]">
            Create a group or channel
          </Text>
        </View>
      </TouchableOpacity>
      {/* 
      <TouchableOpacity
        onPress={onPress}
        disabled={isLoading}
        className="mx-4 mt-2 flex-row items-center rounded-2xl bg-[#17212B] px-4 py-3"
      >
        <View
          className="mr-3 size-11 items-center justify-center rounded-full"
          style={{ backgroundColor: getAvatarColor(item.id) }}
        >
          <Text className="text-sm font-semibold text-white">
            {getInitials(item.username)}
          </Text>
        </View>

        <View className="flex-1">
          <Text className="text-base font-medium text-white">
            {item.username}
          </Text>
          <Text className="mt-0.5 text-xs text-[#9AA4AE]">{item.email}</Text>
        </View>

        {isLoading && <ActivityIndicator size="small" color="#2AABEE" />}
      </TouchableOpacity>
      <View className="mb-2 mt-6 px-4">
        <Text className="text-xs font-semibold tracking-widest text-[#9AA4AE]">
          PEOPLE
        </Text>
      </View> */}

      {searching ? (
        <View style={styles.center}>
          <ActivityIndicator color={TG_BLUE} />
        </View>
      ) : (
        <FlashList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          estimatedItemSize={64}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View className="mt-10 items-center px-6">
              <Text className="text-center text-sm text-[#9AA4AE]">
                {query.length >= 2
                  ? `No users found for "${query}"`
                  : 'Type at least 2 characters to search'}
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { backgroundColor: TG_BLUE },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelBtn: { width: 60 },
  cancelText: { fontSize: 16, color: '#fff' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchIcon: { fontSize: 13, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 15, color: '#fff', padding: 0 },
  clearBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: { fontSize: 10, color: '#fff' },
  newGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
  },
  newGroupIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TG_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  newGroupIconText: { fontSize: 20 },
  newGroupInfo: { flex: 1 },
  newGroupTitle: { fontSize: 16, fontWeight: '600', color: '#000' },
  newGroupSubtitle: { fontSize: 13, color: '#8d8d93', marginTop: 2 },
  chevron: { fontSize: 20, color: '#C7C7CC', marginLeft: 8 },
  dividerRow: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 6,
  },
  dividerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8d8d93',
    letterSpacing: 0.5,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', color: '#000' },
  userEmail: { fontSize: 13, color: '#8d8d93', marginTop: 2 },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5ea',
    marginLeft: 74,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyText: {
    fontSize: 15,
    color: '#8d8d93',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
