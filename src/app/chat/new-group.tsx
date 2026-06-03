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

function MemberChip({ user, onRemove }: { user: User; onRemove: () => void }) {
  return (
    <View style={styles.chip}>
      <View
        style={[
          styles.chipAvatar,
          { backgroundColor: getAvatarColor(user.id) },
        ]}
      >
        <Text style={styles.chipAvatarText}>{getInitials(user.username)}</Text>
      </View>
      <Text style={styles.chipName}>{user.username}</Text>
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View style={styles.chipRemove}>
          <Text style={styles.chipRemoveText}>✕</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function UserRow({
  item,
  selected,
  onToggle,
}: {
  item: User;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.65}
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
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default function NewGroupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((s) => s.user);

  const [groupName, setGroupName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<User[]>([]);
  const [creating, setCreating] = useState(false);

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

  const toggleUser = useCallback((user: User) => {
    setSelected((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      return exists ? prev.filter((u) => u.id !== user.id) : [...prev, user];
    });
  }, []);

  const createGroup = useCallback(async () => {
    if (!currentUser || !groupName.trim()) return;
    try {
      setCreating(true);
      const memberIds = [currentUser.id, ...selected.map((u) => u.id)];
      const chat = await createChat(memberIds, 'GROUP', groupName.trim());
      router.replace(`/chat/${chat.id}`);
    } catch (err: any) {
      showMessage({
        message: err?.message ?? 'Could not create group',
        type: 'danger',
      });
    } finally {
      setCreating(false);
    }
  }, [currentUser, groupName, selected, router]);

  const renderItem = useCallback(
    ({ item }: { item: User }) => (
      <UserRow
        item={item}
        selected={selected.some((u) => u.id === item.id)}
        onToggle={() => toggleUser(item)}
      />
    ),
    [selected, toggleUser]
  );

  const canCreate = groupName.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={styles.cancelBtn}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Group</Text>
          <TouchableOpacity
            onPress={createGroup}
            disabled={!canCreate || creating}
            activeOpacity={0.7}
            style={styles.createBtn}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                style={[
                  styles.createText,
                  !canCreate && styles.createTextDisabled,
                ]}
              >
                Create
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Group name + icon section */}
      <View style={styles.groupSection}>
        <View style={styles.groupIconWrap}>
          <View style={styles.groupIcon}>
            <Text style={styles.groupIconEmoji}>👥</Text>
          </View>
        </View>
        <View style={styles.groupNameWrap}>
          <TextInput
            placeholder="Group Name (required)"
            placeholderTextColor="#C7C7CD"
            value={groupName}
            onChangeText={setGroupName}
            style={styles.groupNameInput}
            maxLength={64}
            returnKeyType="done"
          />
        </View>
      </View>

      <Text style={styles.sectionLabel}>
        You can create a group without adding members.
      </Text>

      {/* Selected members chips */}
      {selected.length > 0 && (
        <View style={styles.chipsContainer}>
          {selected.map((u) => (
            <MemberChip key={u.id} user={u} onRemove={() => toggleUser(u)} />
          ))}
        </View>
      )}

      {/* Member search */}
      <View style={styles.searchSection}>
        <Text style={styles.searchSectionLabel}>ADD MEMBERS (OPTIONAL)</Text>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search by username…"
            placeholderTextColor="#C7C7CD"
            value={query}
            onChangeText={onSearch}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => onSearch('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.clearX}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

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
            query.length >= 2 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No users found for "{query}"
                </Text>
              </View>
            ) : query.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  Search for people to add to your group
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  Type at least 2 characters to search
                </Text>
              </View>
            )
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { backgroundColor: TG_BLUE },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cancelBtn: { width: 64 },
  cancelText: { fontSize: 16, color: '#fff' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  createBtn: { width: 64, alignItems: 'flex-end' },
  createText: { fontSize: 16, color: '#fff', fontWeight: '600' },
  createTextDisabled: { opacity: 0.4 },
  groupSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  groupIconWrap: { marginRight: 14 },
  groupIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: TG_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupIconEmoji: { fontSize: 26 },
  groupNameWrap: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
    paddingBottom: 4,
  },
  groupNameInput: { fontSize: 17, color: '#000', padding: 0, paddingBottom: 4 },
  sectionLabel: {
    fontSize: 13,
    color: '#8d8d93',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF5FB',
    borderRadius: 16,
    paddingLeft: 4,
    paddingRight: 6,
    paddingVertical: 4,
    gap: 4,
  },
  chipAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipAvatarText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  chipName: { fontSize: 13, color: '#2AABEE', fontWeight: '500' },
  chipRemove: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRemoveText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  searchSection: { marginTop: 20 },
  searchSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8d8d93',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchIcon: { fontSize: 14, marginRight: 8, color: '#8d8d93' },
  searchInput: { flex: 1, fontSize: 16, color: '#000', padding: 0 },
  clearX: { fontSize: 14, color: '#8d8d93' },
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
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: TG_BLUE, borderColor: TG_BLUE },
  checkmark: { fontSize: 13, color: '#fff', fontWeight: '700' },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5ea',
    marginLeft: 74,
  },
  center: { alignItems: 'center', paddingTop: 40 },
  emptyState: { alignItems: 'center', paddingTop: 32 },
  emptyText: {
    fontSize: 15,
    color: '#8d8d93',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
