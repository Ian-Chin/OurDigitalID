import { AppIcon } from "@/components/common/AppIcon";
import { AppText } from "@/components/common/AppText";
import {
  ELDERLY_FONT_SCALE,
  ELDERLY_ICON_SCALE,
  fs,
  s,
  vs,
} from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { sendChatMessage, ChatMessage } from "@/services/chatService";
import React, { useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}

const SCREEN_HEIGHT = Dimensions.get("window").height;

const QUICK_ACTIONS = [
  { id: "1", label: "Check queue status", icon: "list.bullet" },
  { id: "2", label: "Renew MyKad", icon: "doc.text" },
  { id: "3", label: "Find nearest office", icon: "map" },
  { id: "4", label: "Help with tax", icon: "dollarsign.circle" },
];


const ANIM_DURATION = 500;
const EASE = Easing.bezier(0.4, 0, 0.2, 1);

export default function ChatbotScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, elderlyMode } = useAppContext();
  const flatListRef = useRef<FlatList>(null);

  // Elderly mode scaling
  const eScale = elderlyMode ? ELDERLY_FONT_SCALE : 1;
  const eIconScale = elderlyMode ? ELDERLY_ICON_SCALE : 1;
  const eFontSize = (size: number) => fs(size) * eScale;
  const eLineHeight = (size: number) => Math.round(fs(size) * eScale * 1.5);
  const avatarSize = Math.round(30 * eIconScale);
  const avatarImgSize = Math.round(22 * eIconScale);
  const sendBtnSize = elderlyMode ? 46 : 36;
  const inputMinHeight = elderlyMode ? 60 : 48;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const chatHistory = useRef<ChatMessage[]>([]);

  // Animations — input slides from center to bottom (normal mode only)
  const inputOffset = elderlyMode ? 0 : -(SCREEN_HEIGHT * 0.22);
  const welcomeFade = useSharedValue(1);
  const cleanHeaderOpacity = useSharedValue(1);
  const gradientSlide = useSharedValue(-200);
  const gradientOpacity = useSharedValue(0);
  const chatFade = useSharedValue(0);
  const inputTranslateY = useSharedValue(inputOffset);

  const welcomeStyle = useAnimatedStyle(() => ({
    opacity: welcomeFade.value,
    pointerEvents:
      welcomeFade.value < 0.1 ? ("none" as const) : ("auto" as const),
  }));
  const cleanHeaderAnimStyle = useAnimatedStyle(() => ({
    opacity: cleanHeaderOpacity.value,
    pointerEvents:
      cleanHeaderOpacity.value < 0.1 ? ("none" as const) : ("auto" as const),
  }));
  const gradientHeaderAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: gradientSlide.value }],
    opacity: gradientOpacity.value,
  }));
  const chatAnimStyle = useAnimatedStyle(() => ({
    opacity: chatFade.value,
  }));
  const inputAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: inputTranslateY.value }],
  }));

  const triggerTransition = useCallback(() => {
    setChatStarted(true);
    welcomeFade.value = withTiming(0, {
      duration: ANIM_DURATION * 0.55,
      easing: EASE,
    });
    cleanHeaderOpacity.value = withTiming(0, {
      duration: ANIM_DURATION * 0.5,
      easing: EASE,
    });
    inputTranslateY.value = withTiming(0, {
      duration: ANIM_DURATION * 0.7,
      easing: EASE,
    });
    gradientOpacity.value = withDelay(
      ANIM_DURATION * 0.25,
      withTiming(1, { duration: ANIM_DURATION * 0.6, easing: EASE }),
    );
    gradientSlide.value = withDelay(
      ANIM_DURATION * 0.25,
      withTiming(0, { duration: ANIM_DURATION * 0.6, easing: EASE }),
    );
    chatFade.value = withDelay(
      ANIM_DURATION * 0.45,
      withTiming(1, { duration: ANIM_DURATION * 0.55, easing: EASE }),
    );
  }, [
    welcomeFade,
    cleanHeaderOpacity,
    inputTranslateY,
    gradientOpacity,
    gradientSlide,
    chatFade,
  ]);

  const addBotResponse = useCallback(async (userText: string) => {
    setIsTyping(true);
    chatHistory.current.push({ role: "user", content: userText });
    try {
      const reply = await sendChatMessage(userText, chatHistory.current);
      chatHistory.current.push({ role: "model", content: reply });
      setMessages((prev) => [...prev, { id: `bot-${Date.now()}`, text: reply, sender: "bot" }]);
    } catch {
      const errorMsg = "Sorry, I'm having trouble connecting right now. Please try again in a moment.";
      setMessages((prev) => [...prev, { id: `bot-${Date.now()}`, text: errorMsg, sender: "bot" }]);
      chatHistory.current.pop();
    } finally {
      setIsTyping(false);
    }
  }, []);

  const firstSend = useRef(false);
  const sendMessage = useCallback(
    (text?: string) => {
      const msg = (text ?? inputText).trim();
      if (!msg || isTyping) return;
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, text: msg, sender: "user" },
      ]);
      setInputText("");
      addBotResponse(msg);
      if (!firstSend.current) {
        firstSend.current = true;
        triggerTransition();
      }
    },
    [inputText, isTyping, addBotResponse, triggerTransition],
  );

  // ─── Shared sub-components ───

  const renderMessage = ({ item }: { item: Message }) => {
    const isBot = item.sender === "bot";
    return (
      <View style={[styles.messageRow, isBot ? styles.botRow : styles.userRow]}>
        {isBot && (
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: "#FFF",
                borderColor: colors.border,
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
              },
            ]}
          >
            <Image
              source={require("@/assets/images/logo_small.png")}
              style={{
                width: avatarImgSize,
                height: avatarImgSize,
                resizeMode: "cover",
              }}
            />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            {
              maxWidth: elderlyMode ? "90%" : "78%",
              paddingHorizontal: s(elderlyMode ? 16 : 14),
              paddingVertical: vs(elderlyMode ? 14 : 10),
            },
            isBot
              ? {
                  backgroundColor: colors.backgroundGrouped,
                  borderBottomLeftRadius: s(4),
                }
              : {
                  backgroundColor: colors.primary,
                  borderBottomRightRadius: s(4),
                },
          ]}
        >
          <AppText
            size={14}
            style={{
              color: isBot ? colors.textPrimary : "#FFF",
              lineHeight: eLineHeight(14),
            }}
          >
            {item.text}
          </AppText>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => (
    <View style={[styles.messageRow, styles.botRow]}>
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: "#FFF",
            borderColor: colors.border,
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
          },
        ]}
      >
        <Image
          source={require("@/assets/images/logo_small.png")}
          style={{
            width: avatarImgSize,
            height: avatarImgSize,
            resizeMode: "cover",
          }}
        />
      </View>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: colors.backgroundGrouped,
            borderBottomLeftRadius: s(4),
            paddingHorizontal: s(20),
            paddingVertical: vs(elderlyMode ? 18 : 14),
          },
        ]}
      >
        <ActivityIndicator
          size={elderlyMode ? "large" : "small"}
          color={colors.textSecondary}
        />
      </View>
    </View>
  );

  const renderInputBar = (animated: boolean) => {
    const inner = (
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.backgroundGrouped,
            borderColor: colors.border,
            minHeight: inputMinHeight,
            borderRadius: s(elderlyMode ? 28 : 24),
          },
        ]}
      >
        <TextInput
          style={[
            styles.textInput,
            {
              color: colors.textPrimary,
              fontSize: eFontSize(15),
              lineHeight: eLineHeight(15),
            },
          ]}
          placeholder="Message Digital Assistant..."
          placeholderTextColor={colors.textPlaceholder}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          onSubmitEditing={() => sendMessage()}
          returnKeyType="send"
          editable={!isTyping}
        />
        <Pressable
          onPress={() => sendMessage()}
          disabled={!inputText.trim() || isTyping}
          style={({ pressed }) => [
            styles.sendBtn,
            {
              width: sendBtnSize,
              height: sendBtnSize,
              borderRadius: sendBtnSize / 2,
              backgroundColor:
                inputText.trim() && !isTyping
                  ? colors.primary
                  : colors.primary + "30",
              transform: [{ scale: pressed ? 0.9 : 1 }],
            },
          ]}
        >
          <AppIcon name="arrow.up" size={16} color="#FFF" />
        </Pressable>
      </View>
    );

    const barStyle = {
      paddingHorizontal: s(12),
      paddingTop: vs(8),
      backgroundColor: colors.background,
      borderTopColor: chatStarted ? colors.border : "transparent",
      borderTopWidth: chatStarted ? StyleSheet.hairlineWidth : 0,
      paddingBottom: insets.bottom > 0 ? insets.bottom : vs(12),
    };

    if (animated) {
      return (
        <Animated.View style={[barStyle, inputAnimStyle]}>
          {inner}
        </Animated.View>
      );
    }
    return <View style={barStyle}>{inner}</View>;
  };

  const renderChips = () => (
    <View
      style={[
        styles.chipsContainer,
        elderlyMode && styles.chipsContainerElderly,
      ]}
    >
      {QUICK_ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={[
            styles.chip,
            {
              borderColor: colors.border,
              backgroundColor: colors.backgroundGrouped,
              paddingHorizontal: s(elderlyMode ? 20 : 14),
              paddingVertical: vs(elderlyMode ? 14 : 10),
            },
            elderlyMode && { width: "100%" },
          ]}
          onPress={() => sendMessage(action.label)}
          activeOpacity={0.7}
        >
          <AppIcon name={action.icon} size={15} color={colors.primary} />
          <AppText
            size={13}
            style={{ color: colors.textPrimary, fontWeight: "500" }}
          >
            {action.label}
          </AppText>
        </TouchableOpacity>
      ))}
    </View>
  );

  const welcomeHeader = () => (
    <View style={styles.welcomeTop}>
      <View
        style={[
          styles.welcomeLogo,
          {
            backgroundColor: colors.primary + "12",
            width: elderlyMode ? 80 : 72,
            height: elderlyMode ? 80 : 72,
            borderRadius: elderlyMode ? 40 : 36,
          },
        ]}
      >
        <Image
          source={require("@/assets/images/logo_small.png")}
          style={{
            width: elderlyMode ? 50 : 44,
            height: elderlyMode ? 50 : 44,
            resizeMode: "cover",
          }}
        />
      </View>
      <AppText
        size={elderlyMode ? 20 : 22}
        style={{
          fontWeight: "700",
          color: colors.textPrimary,
          textAlign: "center",
        }}
      >
        How can I help you?
      </AppText>
      <AppText
        size={elderlyMode ? 13 : 14}
        style={{
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: eLineHeight(elderlyMode ? 13 : 14),
          marginTop: vs(8),
          paddingHorizontal: s(8),
        }}
      >
        Ask about government services, documents, queues, or try a suggestion
        below.
      </AppText>
    </View>
  );

  // ─── Render ───

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ===== Clean Header (welcome) ===== */}
      <Animated.View
        style={[
          styles.cleanHeader,
          { paddingTop: insets.top + vs(8), borderBottomColor: colors.border },
          cleanHeaderAnimStyle,
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
          activeOpacity={0.7}
        >
          <AppIcon name="chevron.left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.cleanHeaderTitle}>
          <Image
            source={require("@/assets/images/logo_small.png")}
            style={styles.cleanHeaderLogo}
          />
          <AppText
            size={17}
            style={{ fontWeight: "700", color: colors.textPrimary }}
          >
            Digital Assistant
          </AppText>
        </View>
        <View style={styles.headerBtn} />
      </Animated.View>

      {/* ===== Gradient Header (chat) — slides down ===== */}
      <Animated.View
        style={[styles.gradientHeaderOuter, gradientHeaderAnimStyle]}
        pointerEvents={chatStarted ? "auto" : "none"}
      >
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
        <View style={styles.gradientHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <AppIcon name="chevron.left" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.gradientHeaderCenter}>
            <View style={styles.gradientHeaderAvatar}>
              <Image
                source={require("@/assets/images/logo_small.png")}
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

      {/* ===== Main content ===== */}
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {elderlyMode ? (
          // ── ELDERLY MODE: simple flex layout, scrollable welcome, input always at bottom ──
          <>
            <View style={styles.flex1}>
              {!chatStarted ? (
                <Animated.View style={[styles.flex1, welcomeStyle]}>
                  <ScrollView
                    contentContainerStyle={styles.elderlyWelcomeContent}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                  >
                    {welcomeHeader()}
                    <View style={{ height: vs(20) }} />
                    {renderChips()}
                  </ScrollView>
                </Animated.View>
              ) : (
                <Animated.View style={[styles.flex1, chatAnimStyle]}>
                  <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={[
                      styles.messagesList,
                      { paddingTop: vs(80) },
                    ]}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() =>
                      flatListRef.current?.scrollToEnd({ animated: true })
                    }
                    ListFooterComponent={
                      isTyping ? renderTypingIndicator() : null
                    }
                  />
                </Animated.View>
              )}
            </View>
            {renderInputBar(false)}
          </>
        ) : (
          // ── NORMAL MODE: centered welcome with translateY input animation ──
          <>
            <View style={styles.flex1}>
              {/* Welcome — absolute centered, fades out */}
              <Animated.View style={[styles.welcomeCentered, welcomeStyle]}>
                {welcomeHeader()}
                <View style={{ height: vs(24) }} />
                {renderChips()}
              </Animated.View>

              {/* Chat messages — fades in */}
              {chatStarted && (
                <Animated.View style={[StyleSheet.absoluteFill, chatAnimStyle]}>
                  <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={[
                      styles.messagesList,
                      { paddingTop: vs(80) },
                    ]}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() =>
                      flatListRef.current?.scrollToEnd({ animated: true })
                    }
                    ListFooterComponent={
                      isTyping ? renderTypingIndicator() : null
                    }
                  />
                </Animated.View>
              )}
            </View>
            {renderInputBar(true)}
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },

  // Clean Header
  cleanHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(4),
    paddingBottom: vs(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 5,
  },
  headerBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  cleanHeaderTitle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(8),
  },
  cleanHeaderLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    resizeMode: "cover",
  },

  // Gradient Header
  gradientHeaderOuter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: "visible",
    paddingBottom: vs(40),
  },
  gradientHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(16),
    paddingBottom: vs(4),
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  gradientHeaderCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: s(8),
    gap: s(10),
  },
  gradientHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    overflow: "hidden",
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

  // Welcome — normal mode (absolute centered)
  welcomeCentered: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: s(20),
    paddingBottom: vs(80),
  },
  welcomeTop: { alignItems: "center", marginBottom: vs(8) },
  welcomeLogo: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(16),
  },

  // Welcome — elderly mode (scrollable flex)
  elderlyWelcomeContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: s(20),
    paddingVertical: vs(24),
  },

  // Chips
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: s(8),
  },
  chipsContainerElderly: { flexDirection: "column", gap: vs(10) },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
    borderRadius: s(20),
    borderWidth: 1,
  },

  // Messages
  messagesList: { paddingHorizontal: s(16), paddingBottom: vs(8) },
  messageRow: {
    flexDirection: "row",
    marginBottom: vs(16),
    alignItems: "flex-start",
  },
  botRow: { justifyContent: "flex-start" },
  userRow: { justifyContent: "flex-end" },
  avatar: {
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: s(8),
    marginTop: vs(2),
    overflow: "hidden",
  },
  bubble: { borderRadius: s(18) },

  // Input
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderWidth: 1,
    paddingLeft: s(16),
    paddingRight: s(4),
    paddingVertical: Platform.OS === "ios" ? vs(6) : vs(2),
  },
  textInput: {
    flex: 1,
    maxHeight: 120,
    paddingVertical: Platform.OS === "ios" ? vs(6) : vs(8),
  },
  sendBtn: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Platform.OS === "ios" ? vs(2) : vs(4),
  },
});
