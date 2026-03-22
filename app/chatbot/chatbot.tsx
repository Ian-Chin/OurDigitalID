import { AppIcon } from "@/components/common/AppIcon";
import { AppText } from "@/components/common/AppText";
import { useAppContext } from "@/context/AppContext";
import { s, vs } from "@/constants/layout";
import { useFadeInUp, useFadeIn, useScaleIn, stagger } from "@/hooks/useAnimations";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
}

const QUICK_ACTIONS = [
  { id: "1", label: "Check queue status", icon: "list.bullet" },
  { id: "2", label: "Renew MyKad", icon: "doc.text" },
  { id: "3", label: "Find nearest office", icon: "map" },
  { id: "4", label: "Help with tax", icon: "dollarsign.circle" },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "bot-1",
    text: "Hello! I'm your OurDigitalID assistant. How can I help you today?",
    sender: "bot",
    timestamp: "Now",
  },
  {
    id: "bot-2",
    text: "You can ask me about government services, document renewals, queue status, or tap a quick action below.",
    sender: "bot",
    timestamp: "Now",
  },
];

export default function ChatbotScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppContext();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");

  // Animations
  const headerAnim = useFadeIn(0, 300);
  const quickActionsAnim = useFadeInUp(200);
  const inputAnim = useFadeInUp(300);

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      text: inputText.trim(),
      sender: "user",
      timestamp: "Now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    // Simulate bot typing response
    setTimeout(() => {
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        text: "Thank you for your message. This feature is coming soon! Our team is working on integrating AI assistance for all government services.",
        sender: "bot",
        timestamp: "Now",
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 1200);
  };

  const handleQuickAction = (label: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      text: label,
      sender: "user",
      timestamp: "Now",
    };

    setMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        text: `I'd be happy to help you with "${label}". This feature will be available soon. In the meantime, you can access this through the Services tab.`,
        sender: "bot",
        timestamp: "Now",
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 1000);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isBot = item.sender === "bot";

    return (
      <View
        style={[
          styles.messageBubbleRow,
          isBot ? styles.botRow : styles.userRow,
        ]}
      >
        {isBot && (
          <View style={[styles.avatarCircle, { 
            backgroundColor: '#FFF', 
            borderWidth: 1, 
            borderColor: colors.border,
            overflow: 'hidden'
          }]}>
            <Image
              source={require('@/assets/images/logo_small.png')}
              style={{ width: 24, height: 24, resizeMode: "cover" }}
            />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isBot
              ? [styles.botBubble, { backgroundColor: colors.backgroundGrouped }]
              : [styles.userBubble, { backgroundColor: colors.primary }],
          ]}
        >
          <AppText
            size={14}
            style={{
              color: isBot ? colors.textPrimary : "#FFFFFF",
              lineHeight: 20,
            }}
          >
            {item.text}
          </AppText>
          <AppText
            size={11}
            style={{
              color: isBot ? colors.textPlaceholder : "rgba(255,255,255,0.7)",
              marginTop: vs(4),
              alignSelf: isBot ? "flex-start" : "flex-end",
            }}
          >
            {item.timestamp}
          </AppText>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with glow spotlight */}
      <Animated.View style={[styles.headerOuter, headerAnim]}>
        <LinearGradient
          colors={[
            colors.primary,
            colors.primary + "CC",
            colors.primary + "44",
            "transparent",
          ]}
          locations={[0, 0.45, 0.78, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ height: insets.top + vs(16) }} />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <AppIcon name="chevron.left" size={22} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={[styles.headerAvatar, { 
              backgroundColor: '#FFF',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.8)',
              overflow: 'hidden'
            }]}>
              <Image
                source={require('@/assets/images/logo_small.png')}
                style={{ width: 30, height: 30, resizeMode: "cover" }}
              />
            </View>
            <View>
              <AppText size={16} style={{ fontWeight: "700", color: "#FFF" }}>
                Digital Assistant
              </AppText>
              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <AppText size={11} style={{ color: "rgba(255,255,255,0.8)" }}>
                  Online
                </AppText>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.headerAction} activeOpacity={0.7}>
            <AppIcon name="ellipsis" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={[
            styles.messagesList,
            { paddingBottom: vs(8) },
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListFooterComponent={
            messages.length <= 2 ? (
              <Animated.View style={[styles.quickActionsWrap, quickActionsAnim]}>
                <AppText
                  size={12}
                  style={{
                    color: colors.textSecondary,
                    marginBottom: vs(10),
                    fontWeight: "600",
                  }}
                >
                  QUICK ACTIONS
                </AppText>
                <View style={styles.quickActionsGrid}>
                  {QUICK_ACTIONS.map((action) => (
                    <TouchableOpacity
                      key={action.id}
                      style={[
                        styles.quickActionBtn,
                        {
                          backgroundColor: colors.backgroundGrouped,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => handleQuickAction(action.label)}
                      activeOpacity={0.7}
                    >
                      <AppIcon
                        name={action.icon}
                        size={18}
                        color={colors.primary}
                      />
                      <AppText
                        size={12}
                        style={{
                          color: colors.textPrimary,
                          marginTop: vs(6),
                          textAlign: "center",
                          fontWeight: "500",
                        }}
                      >
                        {action.label}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            ) : null
          }
        />

        {/* Input Bar */}
        <Animated.View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom > 0 ? insets.bottom : vs(12),
            },
            inputAnim,
          ]}
        >
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: colors.backgroundGrouped },
            ]}
          >
            <TextInput
              style={[styles.textInput, { color: colors.textPrimary }]}
              placeholder="Type a message..."
              placeholderTextColor={colors.textPlaceholder}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={styles.attachBtn}
              activeOpacity={0.7}
            >
              <AppIcon name="paperclip" size={20} color={colors.textPlaceholder} />
            </TouchableOpacity>
          </View>

          <Pressable
            onPress={sendMessage}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: inputText.trim()
                  ? colors.primary
                  : colors.primary + "40",
                transform: [{ scale: pressed ? 0.92 : 1 }],
              },
            ]}
          >
            <AppIcon name="arrow.up" size={18} color="#FFF" />
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  // Header
  headerOuter: {
    overflow: "visible",
    paddingBottom: vs(40),
    marginBottom: vs(-20),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(16),
    paddingBottom: vs(4),
    zIndex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: s(8),
    gap: s(10),
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
  },
  headerAction: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  // Messages
  messagesList: {
    paddingHorizontal: s(16),
    paddingTop: vs(16),
  },
  messageBubbleRow: {
    flexDirection: "row",
    marginBottom: vs(12),
    alignItems: "flex-end",
  },
  botRow: {
    justifyContent: "flex-start",
  },
  userRow: {
    justifyContent: "flex-end",
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: s(8),
    marginBottom: vs(2),
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
    borderRadius: s(16),
  },
  botBubble: {
    borderBottomLeftRadius: s(4),
  },
  userBubble: {
    borderBottomRightRadius: s(4),
  },
  // Quick Actions
  quickActionsWrap: {
    paddingHorizontal: s(4),
    paddingTop: vs(16),
    paddingBottom: vs(8),
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s(10),
  },
  quickActionBtn: {
    width: "47%",
    paddingVertical: vs(14),
    paddingHorizontal: s(12),
    borderRadius: s(12),
    borderWidth: 1,
    alignItems: "center",
  },
  // Input Bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: s(12),
    paddingTop: vs(10),
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: s(8),
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: s(22),
    paddingHorizontal: s(14),
    paddingVertical: Platform.OS === "ios" ? vs(10) : vs(4),
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    lineHeight: 20,
  },
  attachBtn: {
    paddingLeft: s(8),
    paddingBottom: Platform.OS === "ios" ? 0 : vs(6),
    justifyContent: "flex-end",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Platform.OS === "ios" ? 0 : vs(2),
  },
});
