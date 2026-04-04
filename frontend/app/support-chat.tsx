import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, COLORS, SPACING } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_BACKEND_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL || '';

const CHAT_STORAGE_KEY = '@frestivia_support_chat';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
  status?: 'sending' | 'sent' | 'error';
}

const QUICK_QUESTIONS = [
  'How do I create a checklist?',
  'How do I upgrade to Premium?',
  'My reminders aren\'t working',
  'How do I share a list?',
];

function TypingIndicator({ colors, isDark }: { colors: any; isDark: boolean }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    };
    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  return (
    <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]}>
      <View style={styles.typingDots}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.typingDot,
              { backgroundColor: COLORS.primary, opacity: dot, transform: [{ scale: Animated.add(0.6, Animated.multiply(dot, 0.4)) }] },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export default function SupportChatScreen() {
  const router = useRouter();
  const { isDark, colors } = useTheme();
  const { token } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Load saved messages
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const saved = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setMessages(parsed.messages || []);
        setSessionId(parsed.sessionId || '');
      }
      if (!saved || JSON.parse(saved).messages?.length === 0) {
        // Show welcome message
        const welcome: Message = {
          id: 'welcome',
          text: 'Hi there! I\'m Frestivia\'s AI assistant. How can I help you today? You can ask me about checklists, premium features, reminders, shared lists, or anything else!',
          isUser: false,
          timestamp: Date.now(),
          status: 'sent',
        };
        setMessages([welcome]);
        await saveMessages([welcome], '');
      }
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  };

  const saveMessages = async (msgs: Message[], sid: string) => {
    try {
      await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ messages: msgs.slice(-100), sessionId: sid }));
    } catch (e) {
      console.error('Failed to save messages:', e);
    }
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;
    
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      text: text.trim(),
      isUser: true,
      timestamp: Date.now(),
      status: 'sending',
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsTyping(true);

    // Scroll to bottom
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await fetch(`${API_URL}/api/support/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text.trim(),
          session_id: sessionId || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          text: data.response,
          isUser: false,
          timestamp: Date.now(),
          status: 'sent',
        };

        userMsg.status = 'sent';
        const updatedMessages = [...newMessages, aiMsg];
        setMessages(updatedMessages);
        setSessionId(data.session_id);
        await saveMessages(updatedMessages, data.session_id);
      } else {
        throw new Error(data.detail || 'Failed');
      }
    } catch (error: any) {
      userMsg.status = 'error';
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        text: 'Sorry, I couldn\'t process that. Please try again.',
        isUser: false,
        timestamp: Date.now(),
        status: 'error',
      };
      const updatedMessages = [...newMessages, errorMsg];
      setMessages(updatedMessages);
      await saveMessages(updatedMessages, sessionId);
    } finally {
      setIsTyping(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [messages, isTyping, sessionId, token]);

  const handleRetry = (msg: Message) => {
    // Remove the error message and retry
    const filtered = messages.filter(m => m.id !== msg.id && m.status !== 'error');
    setMessages(filtered);
    sendMessage(msg.text);
  };

  const clearChat = async () => {
    const welcome: Message = {
      id: 'welcome-new',
      text: 'Chat cleared! How can I help you?',
      isUser: false,
      timestamp: Date.now(),
      status: 'sent',
    };
    setMessages([welcome]);
    setSessionId('');
    await saveMessages([welcome], '');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.isUser;
    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && (
          <View style={[styles.avatarCircle, { backgroundColor: COLORS.primary + '20' }]}>
            <Ionicons name="sparkles" size={14} color={COLORS.primary} />
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.aiBubble,
          isUser
            ? { backgroundColor: COLORS.primary }
            : { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' },
          item.status === 'error' && !isUser && { borderColor: COLORS.error + '40', borderWidth: 1 },
        ]}>
          <Text style={[
            styles.messageText,
            { color: isUser ? '#fff' : colors.text },
          ]}>
            {item.text}
          </Text>
          {item.status === 'error' && isUser && (
            <Pressable
              onPress={() => handleRetry(item)}
              style={styles.retryBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="refresh" size={14} color="#fff" />
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          )}
        </View>
        {item.status === 'sending' && (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 6 }} />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.card }]}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>AI Support</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={[styles.onlineText, { color: COLORS.success }]}>Online</Text>
          </View>
        </View>
        <Pressable
          style={[styles.clearBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.card }]}
          onPress={clearChat}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListFooterComponent={isTyping ? <TypingIndicator colors={colors} isDark={isDark} /> : null}
      />

      {/* Quick Questions (show when few messages) */}
      {messages.length <= 2 && !isTyping && (
        <View style={styles.quickQuestions}>
          {QUICK_QUESTIONS.map((q, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [
                styles.quickBtn,
                {
                  backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : COLORS.primary + '08',
                  borderColor: isDark ? 'rgba(99,102,241,0.2)' : COLORS.primary + '20',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={() => sendMessage(q)}
            >
              <Text style={[styles.quickText, { color: COLORS.primary }]}>{q}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputArea, {
          backgroundColor: colors.background,
          borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
        }]}>
          <View style={[styles.inputContainer, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.card,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
          }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Type your message..."
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isTyping}
              onSubmitEditing={() => sendMessage(inputText)}
              blurOnSubmit={false}
            />
          </View>
          <Pressable
            style={[
              styles.sendBtn,
              {
                backgroundColor: inputText.trim() && !isTyping ? COLORS.primary : (isDark ? 'rgba(255,255,255,0.1)' : colors.border),
              },
            ]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isTyping}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="send"
              size={18}
              color={inputText.trim() && !isTyping ? '#fff' : colors.textSecondary}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '500',
  },
  clearBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: SPACING.md,
    paddingBottom: 16,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    maxWidth: '85%',
    gap: 8,
  },
  messageRowUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '100%',
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    opacity: 0.8,
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  typingDots: {
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickQuestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    paddingBottom: 8,
    gap: 8,
  },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickText: {
    fontSize: 13,
    fontWeight: '500',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  inputContainer: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    maxHeight: 100,
  },
  input: {
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 80,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
