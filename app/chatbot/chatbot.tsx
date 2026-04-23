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
import { addDocumentToFirestore } from "@/services/documentService";
import { transcribeAudio } from "@/services/transcribeService";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import * as ImagePicker from "expo-image-picker";
import React, { useRef, useState, useCallback } from "react";
import {
  Alert,
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
import { showChoice } from "@/utils/webAlert";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  agent?: "general" | "document";
  action?: { type: string; documentType?: string };
  imageUri?: string;
  formData?: Record<string, string>;
  detectedDocumentType?: string;
}

const SCREEN_HEIGHT = Dimensions.get("window").height;

const QUICK_ACTIONS = [
  { id: "1", label: "Scan & extract a document", icon: "doc.viewfinder" },
  { id: "2", label: "Help me fill a form", icon: "pencil.line" },
  { id: "3", label: "Check my queue status", icon: "list.bullet" },
  { id: "4", label: "Renew MyKad or license", icon: "doc.text" },
];


const ANIM_DURATION = 500;
const EASE = Easing.bezier(0.4, 0, 0.2, 1);

/** Strip common markdown formatting so bot responses render as clean plain text. */
function stripMarkdown(text: string): string {
  return text
    // Remove bold/italic markers: **text**, *text*, __text__, _text_
    .replace(/\*{1,3}(.*?)\*{1,3}/g, "$1")
    .replace(/_{1,3}(.*?)_{1,3}/g, "$1")
    // Remove heading markers: ### heading
    .replace(/^#{1,6}\s+/gm, "")
    // Remove inline code backticks: `code`
    .replace(/`([^`]+)`/g, "$1")
    // Remove link syntax: [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Clean up excess whitespace
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function ChatbotScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, elderlyMode, addSavedDocument, userProfile, language } = useAppContext();
  const flatListRef = useRef<FlatList>(null);

  // Elderly mode scaling
  const eScale = elderlyMode ? ELDERLY_FONT_SCALE : 1;
  const eIconScale = elderlyMode ? ELDERLY_ICON_SCALE : 1;
  const eFontSize = (size: number) => fs(size) * eScale;
  const eLineHeight = (size: number) => Math.round(fs(size) * eScale * 1.5);
  const avatarSize = Math.round(30 * eIconScale);
  const avatarImgSize = Math.round(22 * eIconScale);
  const sendBtnSize = elderlyMode ? 46 : 36;
  const inputMinHeight = elderlyMode ? 58 : 46;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ uri: string; base64: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const chatHistory = useRef<ChatMessage[]>([]);

  const voiceRecorder = useVoiceRecorder();

  const toggleVoiceInput = useCallback(async () => {
    if (isTranscribing) return;

    if (isListening) {
      setIsListening(false);
      const recorded = await voiceRecorder.stop();
      if (!recorded) return;

      setIsTranscribing(true);
      try {
        const text = await transcribeAudio(
          recorded.base64,
          recorded.mimeType,
          language,
        );
        if (text) {
          setInputText((prev) => (prev ? `${prev} ${text}` : text));
        } else {
          Alert.alert(
            "No Speech Detected",
            "Try speaking a bit louder and closer to the mic.",
          );
        }
      } catch (err: any) {
        console.error("Transcription failed:", err);
        Alert.alert(
          "Transcription Failed",
          err?.message ??
            "Could not transcribe audio. Check your connection and try again.",
        );
      } finally {
        setIsTranscribing(false);
      }
      return;
    }

    const granted = await voiceRecorder.requestPermission();
    if (!granted) {
      Alert.alert(
        "Permission Required",
        "Microphone access is needed for voice input.",
      );
      return;
    }

    try {
      await voiceRecorder.start();
      setIsListening(true);
    } catch (err: any) {
      console.error("Failed to start recording:", err);
      Alert.alert(
        "Recording Error",
        err?.message ?? "Could not start recording.",
      );
    }
  }, [isListening, isTranscribing, voiceRecorder, language]);

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

  const DOC_TYPE_MAP: Record<string, { category: string; document: string }> = {
    be_form: { category: "tax_finance", document: "be_form" },
    ea_form: { category: "tax_finance", document: "ea_form" },
    tax_return: { category: "tax_finance", document: "tax_return" },
    medical_claim: { category: "healthcare", document: "medical_claim" },
    employment_cert: { category: "employment", document: "employment_cert" },
    license_app: { category: "transport", document: "license_app" },
    mykad: { category: "identity", document: "mykad" },
    passport: { category: "identity", document: "passport" },
    driving_license: { category: "transport", document: "driving_license" },
  };

  const handleSaveDocument = useCallback(async (item: Message) => {
    if (!item.formData || Object.keys(item.formData).length === 0) return;

    const docType = item.detectedDocumentType || item.action?.documentType || "other";
    const mapping = DOC_TYPE_MAP[docType];
    const now = new Date().toISOString();
    const docName = docType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    const newDoc = {
      name: docName,
      category: mapping?.category || "other",
      document: mapping?.document || docType,
      data: item.formData,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const userId = userProfile?.uid;
      if (userId) {
        const firestoreId = await addDocumentToFirestore(userId, newDoc);
        addSavedDocument({ ...newDoc, id: firestoreId });
      } else {
        addSavedDocument({ ...newDoc, id: Date.now().toString() });
      }
      showChoice("Saved", "Document has been saved to your profile.", [
        { text: "View Documents", onPress: () => router.push("/profile" as any) },
        { text: "OK" },
      ]);
    } catch (err) {
      console.error("Failed to save document:", err);
      addSavedDocument({ ...newDoc, id: Date.now().toString() });
      Alert.alert("Saved", "Document saved locally.");
    }
  }, [userProfile, addSavedDocument, router]);

  const pickImage = useCallback(async (useCamera: boolean) => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
    };
    const result = useCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        setPendingImage({ uri: asset.uri, base64: asset.base64 });
      }
    }
  }, []);

  const pickImageWeb = useCallback(() => {
    if (typeof document === "undefined") return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    // capture hints mobile browsers to open the camera directly; desktop ignores it.
    input.setAttribute("capture", "environment");
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.includes(",")
          ? dataUrl.slice(dataUrl.indexOf(",") + 1)
          : dataUrl;
        setPendingImage({ uri: dataUrl, base64 });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, []);

  const handleAttachImage = useCallback(() => {
    if (Platform.OS === "web") {
      pickImageWeb();
      return;
    }
    Alert.alert("Attach Photo", "Choose a source", [
      { text: "Camera", onPress: () => pickImage(true) },
      { text: "Photo Library", onPress: () => pickImage(false) },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [pickImage, pickImageWeb]);

  const addBotResponse = useCallback(async (userText: string, imageBase64?: string) => {
    setIsTyping(true);
    chatHistory.current.push({ role: "user", content: userText });
    try {
      const context = imageBase64
        ? { mode: "ocr" as const, imageBase64 }
        : undefined;
      const response = await sendChatMessage(userText, chatHistory.current, context);
      const cleanReply = stripMarkdown(response.reply);
      chatHistory.current.push({ role: "model", content: cleanReply });
      // Small delay before showing response for a natural feel
      await new Promise((r) => setTimeout(r, 800));
      setMessages((prev) => [...prev, {
        id: `bot-${Date.now()}`,
        text: cleanReply,
        sender: "bot",
        agent: response.agent,
        action: response.action,
        formData: response.formData,
        detectedDocumentType: response.detectedDocumentType,
      }]);
    } catch (err: any) {
      console.error("[chatbot] sendChatMessage failed:", {
        code: err?.code,
        message: err?.message,
        details: err?.details,
        raw: err,
      });
      const errorMsg = `Sorry, I'm having trouble connecting right now. (${err?.code || "unknown"}: ${err?.message || "no message"})`;
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
      const image = pendingImage;
      if ((!msg && !image) || isTyping) return;
      const displayText = msg || "";
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          text: displayText,
          sender: "user",
          imageUri: image?.uri,
        },
      ]);
      setInputText("");
      setPendingImage(null);
      addBotResponse(
        msg || "Extract all information from this document and show me the fields.",
        image?.base64,
      );
      if (!firstSend.current) {
        firstSend.current = true;
        triggerTransition();
      }
    },
    [inputText, pendingImage, isTyping, addBotResponse, triggerTransition],
  );

  // ─── Shared sub-components ───

  const renderMessage = ({ item }: { item: Message }) => {
    const isBot = item.sender === "bot";
    const isDocAgent = isBot && item.agent === "document";
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
        <View style={{ flexShrink: 1, maxWidth: elderlyMode ? "90%" : "78%" }}>
          <View
            style={[
              styles.bubble,
              {
                paddingHorizontal: s(elderlyMode ? 20 : 18),
                paddingVertical: vs(elderlyMode ? 18 : 14),
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
            {item.imageUri && (
              <Image
                source={{ uri: item.imageUri }}
                style={{
                  width: elderlyMode ? s(220) : s(200),
                  height: elderlyMode ? vs(165) : vs(150),
                  borderRadius: s(10),
                  marginBottom: item.text ? vs(8) : 0,
                }}
                resizeMode="cover"
              />
            )}
            {item.text ? (
              <AppText
                size={14}
                style={{
                  color: isBot ? colors.textPrimary : "#FFF",
                  lineHeight: eLineHeight(15),
                }}
              >
                {item.text}
              </AppText>
            ) : null}
          </View>
          {isDocAgent && (
            <AppText
              size={11}
              style={{
                color: colors.textSecondary,
                marginTop: vs(4),
                marginLeft: s(4),
                fontStyle: "italic",
              }}
            >
              Document Assistant
            </AppText>
          )}
          {/* Extracted fields card */}
          {item.formData && Object.keys(item.formData).length > 0 && (
            <View
              style={[
                styles.extractedFieldsCard,
                { backgroundColor: colors.backgroundGrouped, borderColor: colors.border },
              ]}
            >
              <AppText
                size={11}
                style={{ fontWeight: "600", color: colors.textSecondary, marginBottom: vs(6) }}
              >
                EXTRACTED FIELDS
              </AppText>
              {Object.entries(item.formData).map(([key, value]) => (
                <View key={key} style={styles.extractedFieldRow}>
                  <AppText
                    size={12}
                    style={{ color: colors.textSecondary, flex: 0.4 }}
                  >
                    {key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
                  </AppText>
                  <AppText
                    size={13}
                    style={{ color: colors.textPrimary, flex: 0.6, fontWeight: "500" }}
                  >
                    {value || "—"}
                  </AppText>
                </View>
              ))}
            </View>
          )}
          {/* Save to documents action */}
          {item.formData && Object.keys(item.formData).length > 0 && (
            <TouchableOpacity
              style={[styles.saveActionBtn, { backgroundColor: "#B8A2FF" }]}
              onPress={() => handleSaveDocument(item)}
              activeOpacity={0.7}
            >
              <AppIcon name="square.and.arrow.down" size={16} color="#FFF" />
              <AppText
                size={13}
                style={{ color: "#FFF", fontWeight: "600", marginLeft: s(6) }}
              >
                Save to Documents
              </AppText>
            </TouchableOpacity>
          )}
          {item.action?.type === "scan" && !item.formData && (
            <TouchableOpacity
              style={[
                styles.scanActionBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={() =>
                router.push(
                  `/service/scan?documentType=${item.action?.documentType || "other"}` as any
                )
              }
              activeOpacity={0.7}
            >
              <AppIcon name="doc.viewfinder" size={16} color="#FFF" />
              <AppText
                size={13}
                style={{ color: "#FFF", fontWeight: "600", marginLeft: s(6) }}
              >
                Scan Document
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Pulsing opacity for "Thinking..." text
  const thinkingOpacity = useSharedValue(1);
  React.useEffect(() => {
    if (isTyping) {
      thinkingOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 800, easing: EASE }),
          withTiming(1, { duration: 800, easing: EASE })
        ),
        -1
      );
    } else {
      thinkingOpacity.value = 1;
    }
  }, [isTyping, thinkingOpacity]);
  const thinkingStyle = useAnimatedStyle(() => ({
    opacity: thinkingOpacity.value,
  }));

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
        <Animated.View style={thinkingStyle}>
          <AppText
            size={14}
            style={{
              color: colors.textSecondary,
              fontStyle: "italic",
            }}
          >
            Thinking...
          </AppText>
        </Animated.View>
      </View>
    </View>
  );

  const renderInputBar = (animated: boolean) => {
    const canSend = (inputText.trim() || pendingImage) && !isTyping;
    const inner = (
      <View>
        {pendingImage && (
          <View style={styles.pendingImageRow}>
            <Image
              source={{ uri: pendingImage.uri }}
              style={styles.pendingImageThumb}
            />
            <TouchableOpacity
              onPress={() => setPendingImage(null)}
              style={styles.pendingImageRemove}
              activeOpacity={0.7}
            >
              <AppIcon name="xmark.circle.fill" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
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
          <TouchableOpacity
            onPress={handleAttachImage}
            disabled={isTyping}
            style={styles.attachBtn}
            activeOpacity={0.7}
          >
            <AppIcon name="camera.fill" size={18} color={isTyping ? colors.textPlaceholder : colors.primary} />
          </TouchableOpacity>
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
            onPress={toggleVoiceInput}
            disabled={isTyping || isTranscribing}
            style={({ pressed }) => [
              styles.voiceBtn,
              {
                width: sendBtnSize,
                height: sendBtnSize,
                borderRadius: sendBtnSize / 2,
                backgroundColor: isListening
                  ? colors.error
                  : isTranscribing
                    ? colors.primary + "22"
                    : colors.primary + "12",
                transform: [{ scale: pressed ? 0.9 : 1 }],
              },
            ]}
          >
            <AppIcon
              name={isListening ? "waveform" : isTranscribing ? "ellipsis" : "mic.fill"}
              size={20}
              color={isListening ? "#FFF" : colors.primary}
            />
          </Pressable>
          <Pressable
            onPress={() => sendMessage()}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                width: sendBtnSize,
                height: sendBtnSize,
                borderRadius: sendBtnSize / 2,
                backgroundColor: canSend
                  ? colors.primary
                  : colors.primary + "30",
                transform: [{ scale: pressed ? 0.9 : 1 }],
              },
            ]}
          >
            <AppIcon name="arrow.up" size={16} color="#FFF" />
          </Pressable>
        </View>
      </View>
    );

    const barStyle = {
      paddingHorizontal: s(14),
      paddingTop: vs(10),
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
              paddingHorizontal: s(elderlyMode ? 16 : 11),
              paddingVertical: vs(elderlyMode ? 12 : 7),
            },
            elderlyMode && { width: "100%" },
          ]}
          onPress={() => sendMessage(action.label)}
          activeOpacity={0.7}
        >
          <AppIcon name={action.icon} size={13} color={colors.primary} />
          <AppText
            size={12}
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
        enabled={chatStarted}
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
    paddingHorizontal: s(12),
  },
  chipsContainerElderly: { flexDirection: "column", gap: vs(10) },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(6),
    borderRadius: s(18),
    borderWidth: 1,
  },

  // Messages
  messagesList: { paddingHorizontal: s(18), paddingBottom: vs(24) },
  messageRow: {
    flexDirection: "row",
    marginBottom: vs(24),
    alignItems: "flex-start",
  },
  botRow: { justifyContent: "flex-start" },
  userRow: { justifyContent: "flex-end" },
  avatar: {
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: s(10),
    marginTop: vs(2),
    overflow: "hidden",
  },
  bubble: { borderRadius: s(18) },
  extractedFieldsCard: {
    marginTop: vs(8),
    borderRadius: s(10),
    borderWidth: 1,
    padding: s(12),
  },
  extractedFieldRow: {
    flexDirection: "row",
    paddingVertical: vs(3),
    alignItems: "flex-start",
  },
  saveActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
    borderRadius: s(12),
    marginTop: vs(8),
  },
  scanActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
    borderRadius: s(12),
    marginTop: vs(8),
  },

  // Input
  pendingImageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(10),
    paddingLeft: s(6),
  },
  pendingImageThumb: {
    width: s(72),
    height: vs(54),
    borderRadius: s(10),
  },
  pendingImageRemove: {
    marginLeft: s(8),
    padding: s(4),
  },
  attachBtn: {
    justifyContent: "center",
    alignItems: "center",
    height: 34,
    width: 34,
    marginRight: s(2),
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingLeft: s(12),
    paddingRight: s(4),
    paddingVertical: Platform.OS === "ios" ? vs(4) : vs(2),
    gap: s(4),
  },
  textInput: {
    flex: 1,
    maxHeight: 110,
    paddingVertical: Platform.OS === "ios" ? vs(6) : vs(6),
  },
  voiceBtn: {
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
    marginBottom: Platform.OS === "ios" ? vs(4) : vs(6),
  },
  sendBtn: {
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
    marginBottom: Platform.OS === "ios" ? vs(4) : vs(6),
  },
});
