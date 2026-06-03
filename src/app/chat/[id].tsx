import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, View } from '@/components/ui';
import { getChat, markRead } from '@/services/chats.api';
import { getMessages, sendMessageHttp } from '@/services/messages.api';
import { connectChatWS, disconnectWS, sendWSMessage } from '@/services/ws.service';
import { useAuthStore } from '@/stores/auth.store';
import type { Chat, ChatMessage } from '@/types';

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

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function DateSeparator({ label }: { label: string }) {
  return (
    <View style={styles.sepContainer}>
      <View style={styles.sepPill}>
        <Text style={styles.sepText}>{label}</Text>
      </View>
    </View>
  );
}

function MessageBubble({
  message,
  isMe,
  showAvatar,
  showSenderName,
  isDark,
}: {
  message: ChatMessage;
  isMe: boolean;
  showAvatar: boolean;
  showSenderName: boolean;
  isDark: boolean;
}) {
  const bubbleBg = isMe
    ? isDark
      ? '#2B5278'
      : '#DCFDBE'
    : isDark
      ? '#182533'
      : '#FFFFFF';

  const textColor = isDark ? '#e8e8e8' : '#000';
  const timeColor = isMe
    ? isDark
      ? '#A0BDD8'
      : '#5C8C5C'
    : isDark
      ? '#6D828F'
      : '#8d8d93';
  const senderColor = getAvatarColor(message.senderId);

  return (
    <View style={[styles.bubbleRow, isMe ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
      {/* Avatar for others */}
      {!isMe && (
        <View style={styles.avatarSlot}>
          {showAvatar ? (
            <View style={[styles.miniAvatar, { backgroundColor: getAvatarColor(message.senderId) }]}>
              <Text style={styles.miniAvatarText}>{getInitials(message.senderUsername)}</Text>
            </View>
          ) : null}
        </View>
      )}

      <View style={[styles.bubbleWrapper, isMe ? styles.bubbleWrapperRight : styles.bubbleWrapperLeft]}>
        {showSenderName && !isMe && (
          <Text style={[styles.senderName, { color: senderColor }]}>
            {message.senderUsername}
          </Text>
        )}
        <View
          style={[
            styles.bubble,
            isMe ? styles.bubbleMe : styles.bubbleOther,
            { backgroundColor: bubbleBg },
          ]}
        >
          <Text style={[styles.bubbleText, { color: textColor }]}>{message.content}</Text>
          <Text style={[styles.bubbleTime, { color: timeColor }]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatId = Number(id);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const wsConnected = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const [chatData, msgData] = await Promise.all([
          getChat(chatId),
          getMessages(chatId, 0),
        ]);
        markRead(chatId).catch(() => null);
        if (cancelled) return;
        setChat(chatData);
        setMessages(msgData.messages);
        setHasMore(msgData.hasMore);
        setPage(0);
      } catch (err: any) {
        if (!cancelled) {
          showMessage({ message: err?.message ?? 'Failed to load chat', type: 'danger' });
          router.back();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [chatId, router]);

  useEffect(() => {
    let active = true;
    connectChatWS(chatId, (msg: ChatMessage) => {
      if (!active) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    }).catch(() => {});
    wsConnected.current = true;
    return () => {
      active = false;
      disconnectWS();
      wsConnected.current = false;
    };
  }, [chatId]);

  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const data = await getMessages(chatId, nextPage);
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false);
    }
  }, [chatId, hasMore, loadingMore, page]);

  const sendMessage = useCallback(async () => {
    const content = text.trim();
    if (!content || sending) return;
    setText('');
    setSending(true);
    try {
      if (wsConnected.current) {
        sendWSMessage({ chatId, content });
      } else {
        const msg = await sendMessageHttp(chatId, content);
        setMessages((prev) => [...prev, msg]);
      }
    } catch (err: any) {
      setText(content);
      showMessage({ message: err?.message ?? 'Failed to send', type: 'danger' });
    } finally {
      setSending(false);
    }
  }, [chatId, text, sending]);

  const getChatTitle = useCallback(() => {
    if (!chat) return '';
    if (chat.name) return chat.name;
    if (chat.type === 'SINGLE') {
      const other = chat.participants.find((p) => p.id !== user?.id);
      return other?.username ?? '';
    }
    return `Group · ${chat.participants.length}`;
  }, [chat, user?.id]);

  const invertedMessages = [...messages].reverse();

  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const isMe = item.senderId === user?.id;
      const nextItem = invertedMessages[index + 1]; // older → appears above
      const prevItem = invertedMessages[index - 1]; // newer → appears below
      const showAvatar = !nextItem || nextItem.senderId !== item.senderId;
      const showSenderName = !prevItem || prevItem.senderId !== item.senderId;
      const showDateSep =
        !nextItem ||
        new Date(item.timestamp).toDateString() !== new Date(nextItem.timestamp).toDateString();

      return (
        <View>
          {/* Separator at top of container = visually above this item (correct for inverted list) */}
          {showDateSep && <DateSeparator label={formatDateLabel(item.timestamp)} />}
          <MessageBubble
            message={item}
            isMe={isMe}
            showAvatar={showAvatar}
            showSenderName={showSenderName && chat?.type === 'GROUP'}
            isDark={isDark}
          />
        </View>
      );
    },
    [user?.id, invertedMessages, chat?.type, isDark]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={TG_BLUE} />
      </View>
    );
  }

  const title = getChatTitle();
  const chatBg = isDark ? '#0E1621' : '#DAE2E8';

  return (
    <View style={{ flex: 1, backgroundColor: chatBg }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={styles.backBtn}
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>

        <View style={[styles.headerAvatar, { backgroundColor: chat ? getAvatarColor(chat.id) : '#ccc' }]}>
          {chat?.type === 'GROUP' ? (
            <Text style={styles.headerAvatarEmoji}>👥</Text>
          ) : (
            <Text style={styles.headerAvatarText}>{getInitials(title)}</Text>
          )}
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.headerSubtitle}>
            {chat?.type === 'GROUP'
              ? `${chat.participants.length} members`
              : 'online'}
          </Text>
        </View>
      </View>

      {/* Messages + Input */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlashList
          inverted
          data={invertedMessages}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          estimatedItemSize={60}
          onEndReached={loadMoreMessages}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 12 }}>
                <ActivityIndicator size="small" color={TG_BLUE} />
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 8 }}
        />

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            {
              paddingBottom: Math.max(insets.bottom, 8),
              backgroundColor: isDark ? '#1C2733' : '#F0F0F0',
              borderTopColor: isDark ? '#2B3D4F' : '#C8C8CC',
            },
          ]}
        >
          <View
            style={[
              styles.inputWrap,
              {
                backgroundColor: isDark ? '#273340' : '#fff',
                borderColor: isDark ? '#2B3D4F' : '#E0E0E0',
              },
            ]}
          >
            <TextInput
              style={[styles.textInput, { color: isDark ? '#fff' : '#000' }]}
              placeholder="Message"
              placeholderTextColor={isDark ? '#4D6475' : '#C7C7CD'}
              value={text}
              onChangeText={setText}
              multiline
              returnKeyType="default"
            />
          </View>
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!text.trim() || sending}
            activeOpacity={0.8}
            style={[
              styles.sendBtn,
              { backgroundColor: text.trim() && !sending ? TG_BLUE : '#C7C7CD' },
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendIcon}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TG_BLUE,
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  backBtn: { padding: 8, marginRight: 2 },
  backArrow: { fontSize: 28, color: '#fff', lineHeight: 30 },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerAvatarEmoji: { fontSize: 18 },
  headerAvatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  sepContainer: { alignItems: 'center', paddingVertical: 10 },
  sepPill: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  sepText: { fontSize: 12, color: '#fff', fontWeight: '500' },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 2,
    paddingHorizontal: 8,
  },
  bubbleRowLeft: { justifyContent: 'flex-start' },
  bubbleRowRight: { justifyContent: 'flex-end' },
  avatarSlot: { width: 28, marginRight: 4, alignItems: 'center' },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  bubbleWrapper: { maxWidth: '78%' },
  bubbleWrapperLeft: { alignItems: 'flex-start' },
  bubbleWrapperRight: { alignItems: 'flex-end' },
  senderName: { fontSize: 12, fontWeight: '600', marginBottom: 2, marginLeft: 12 },
  bubble: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  bubbleMe: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTime: { fontSize: 11, textAlign: 'right', marginTop: 3 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    minHeight: 42,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
    padding: 0,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { fontSize: 20, color: '#fff', fontWeight: '700' },
});
