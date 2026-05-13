import { AppIcon } from "@/components/common/AppIcon";
import { AppText } from "@/components/common/AppText";
import { Gradients, Radii } from "@/constants/colors";
import {
  ELDERLY_FONT_SCALE,
  ELDERLY_ICON_SCALE,
  fs,
  s,
  vs,
} from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { ChatMessage, sendChatMessage } from "@/services/chatService";
import { addDocumentToFirestore } from "@/services/documentService";
import { transcribeAudio } from "@/services/transcribeService";
import { showChoice } from "@/utils/webAlert";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
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
  FadeInDown,
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
  transferTo?: string; // agent id to transfer to (shows confirm UI)
  agentId?: string; // which persona produced this bot reply (for avatar)
}

const DEFAULT_AVATAR = require("@/assets/images/logo_small.png");
const portraitFor = (agentId?: string) =>
  (agentId && AGENT_THEME[agentId]?.portrait) || DEFAULT_AVATAR;

const SCREEN_HEIGHT = Dimensions.get("window").height;

type AgentDef = {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  greeting: string;
  // Hidden persona injected as first model message in chatHistory.
  persona: string;
};

// Six agents shown on the picker. Each runs through the same backend `chat`
// callable; the persona prompt is injected via history so the model stays
// in character. Transfers are negotiated via [[TRANSFER:<id>]] tags the
// model emits when a user asks about something outside its scope.
const AGENTS: AgentDef[] = [
  {
    id: "general",
    name: "Aisha",
    tagline: "General helper · gov info & getting started",
    icon: "person.fill",
    greeting:
      "Hi, I'm Aisha — your general helper. Ask me anything about government services, queues, or how to get started.",
    persona:
      `You are the General Helper agent for OurDigitalID (a Malaysian government super-app). ` +
      `Answer general questions about Malaysian government services, queues, opening hours, and ` +
      `basic guidance. Always answer substantively — never refuse or punt to "another part of the app" ` +
      `without first giving the best answer you can. Keep replies under 6 short sentences. ` +
      `You may respond in English, Bahasa Melayu, or Chinese to match the user's language.`,
  },
  {
    id: "document",
    name: "Daniel",
    tagline: "Scan & extract document fields",
    icon: "person.fill",
    greeting:
      "Hi, I'm Daniel — your document assistant. Send me a photo of any MyKad, passport, tax form, or bill and I'll extract the fields for you.",
    persona:
      `You are the Document Assistant agent. Help users scan, extract, and verify document fields ` +
      `(MyKad, passport, BE/EA forms, medical claims, etc.). Encourage attaching a photo when relevant.`,
  },
  {
    id: "forms",
    name: "Farah",
    tagline: "Autofill forms from your profile",
    icon: "person.fill",
    greeting:
      "Hi, I'm Farah — your forms autofill helper. Tell me which form you need filled (BE form, EA form, medical claim, license app…) and I'll prefill it from your profile.",
    persona:
      `You are the Forms Autofill agent for OurDigitalID. When the user names a Malaysian government ` +
      `form (e.g. BE form, EA form, medical claim, driving license application, EPF withdrawal), ` +
      `respond with: (1) a short list of the typical fields on that form, (2) which fields can be ` +
      `auto-filled from a stored profile (full name, IC number, address, date of birth), and (3) ` +
      `which fields the user still needs to provide. Be concrete: give example field labels in plain ` +
      `English. Never just say "open the form" — produce the field list every time.`,
  },
  {
    id: "recommender",
    name: "Mei Ling",
    tagline: "Recommend the right gov service",
    icon: "person.fill",
    greeting:
      "Hi, I'm Mei Ling — your service recommender. Tell me what you're trying to do (renew a license, claim tax relief, register a child…) and I'll recommend the right service.",
    persona:
      `You are the Service Recommender agent for OurDigitalID. Given the user's goal, recommend 2-3 ` +
      `relevant Malaysian government services. For each, give: service name, the agency (JPN, JPJ, ` +
      `LHDN, KWSP, PERKESO, KKM, etc.), and a one-line reason it fits. Always recommend something ` +
      `concrete — even if you have to make reasonable assumptions, state them. Avoid generic "visit ` +
      `the official website" answers.`,
  },
  {
    id: "renewals",
    name: "Ravi",
    tagline: "Renewals & expiry reminders",
    icon: "person.fill",
    greeting:
      "Hi, I'm Ravi — your renewals helper. Tell me what expires when (MyKad, license, road tax, passport) and I'll help you plan renewals.",
    persona:
      `You are the Renewals & Reminders agent. Help the user plan Malaysian document renewals ` +
      `(MyKad, driving license, road tax, passport). For each, share: typical renewal window before ` +
      `expiry, where to renew (JPN counter / JPJ counter / Pos Malaysia / MyJPJ app / MyEG / etc.), ` +
      `and typical fee in MYR. If the user gives an expiry date, calculate the renewal window for ` +
      `them. Keep replies short and actionable.`,
  },
  {
    id: "locations",
    name: "Lokman",
    tagline: "Nearby offices & queue status",
    icon: "person.fill",
    greeting:
      "Hi, I'm Lokman — your locations helper. Ask me where the nearest JPN, JPJ, LHDN, or hospital is, and I'll guide you.",
    persona:
      `You are the Locations & Queues agent for OurDigitalID. Help users find Malaysian government ` +
      `offices (JPN, JPJ, LHDN, KWSP, PERKESO, public clinics/hospitals). If the user's city or ` +
      `state is unknown, ASK for it first in one short sentence. Once you know the area, list 2-3 ` +
      `well-known branches in or near that area with: branch name, full address, and typical ` +
      `weekday peak hours (e.g. 10am-12pm and 2pm-4pm are usually busiest). State clearly that ` +
      `real-time queue numbers come from the in-app GIS map. Never refuse — always answer with ` +
      `concrete examples even if you must estimate.`,
  },
];

const AGENTS_BY_ID: Record<string, AgentDef> = AGENTS.reduce(
  (acc, a) => ((acc[a.id] = a), acc),
  {} as Record<string, AgentDef>,
);

// Per-persona color story (Malaysian batik tones) + bundled illustrated
// portrait. Portraits live in assets/images/agents/ and are loaded via
// require() so they ship with the app — no network call at render time.
type AgentTheme = {
  accent: string;
  soft: string;
  border: string;
  portrait: any; // require() ImageSourcePropType
};

const AGENT_THEME: Record<string, AgentTheme> = {
  general: {
    accent: "#C97B63",
    soft: "#FBEDE7",
    border: "#E8B89F",
    portrait: require("@/assets/images/agents/aisha.png"),
  },
  document: {
    accent: "#2F6B6B",
    soft: "#E1EEED",
    border: "#9AC5C3",
    portrait: require("@/assets/images/agents/daniel.png"),
  },
  forms: {
    accent: "#C9892C",
    soft: "#FBF1DC",
    border: "#E6C68A",
    portrait: require("@/assets/images/agents/farah.png"),
  },
  recommender: {
    accent: "#5B8F73",
    soft: "#E6EFE8",
    border: "#A8C8B4",
    portrait: require("@/assets/images/agents/meiling.png"),
  },
  renewals: {
    accent: "#B84A3B",
    soft: "#F8E0DA",
    border: "#E2A498",
    portrait: require("@/assets/images/agents/ravi.png"),
  },
  locations: {
    accent: "#3D5A98",
    soft: "#E5EAF5",
    border: "#A4B4D6",
    portrait: require("@/assets/images/agents/lokman.png"),
  },
};

// Tag the model emits to suggest a handoff. Stripped from visible reply.
const TRANSFER_TAG_RE = /\[\[TRANSFER:([a-z_]+)\]\]/i;

function buildTransferInstruction(currentAgentId: string): string {
  const others = AGENTS.filter((a) => a.id !== currentAgentId)
    .map((a) => `${a.id} (${a.tagline})`)
    .join("; ");
  return (
    `If the user asks about something clearly outside your scope, do NOT try to answer. ` +
    `Instead, reply with a one-line suggestion to switch agents and end your message ` +
    `with the literal tag [[TRANSFER:<id>]] where <id> is one of: ${others}. ` +
    `Otherwise, never include such a tag.`
  );
}


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
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const chatHistory = useRef<ChatMessage[]>([]);

  const selectedAgent = selectedAgentId ? AGENTS_BY_ID[selectedAgentId] : null;

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
      const agent = selectedAgentId ? AGENTS_BY_ID[selectedAgentId] : null;
      const personaWithTransfer = agent
        ? `${agent.persona}\n\n${buildTransferInstruction(agent.id)}`
        : undefined;
      const context = imageBase64
        ? {
          mode: "ocr" as const,
          imageBase64,
          agentId: agent?.id,
          agentPersona: personaWithTransfer,
        }
        : agent
          ? { agentId: agent.id, agentPersona: personaWithTransfer }
          : undefined;
      const response = await sendChatMessage(userText, chatHistory.current, context);
      const rawReply = stripMarkdown(response.reply);

      // Detect [[TRANSFER:<id>]] tag emitted by the model when it judges the
      // user is asking about something outside its scope.
      let transferTo: string | undefined;
      let cleanReply = rawReply;
      const match = rawReply.match(TRANSFER_TAG_RE);
      if (match) {
        const id = match[1].toLowerCase();
        if (AGENTS_BY_ID[id] && id !== selectedAgentId) {
          transferTo = id;
        }
        cleanReply = rawReply.replace(TRANSFER_TAG_RE, "").trim();
      }

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
        transferTo,
        agentId: selectedAgentId ?? undefined,
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
  }, [selectedAgentId]);

  // Prime the chat with an agent's persona + visible greeting. Used both for
  // initial agent selection and for accepted transfers (which reset history).
  const primeAgent = useCallback(
    (agentId: string, opts?: { resetHistory?: boolean }) => {
      const agent = AGENTS_BY_ID[agentId];
      if (!agent) return;
      if (opts?.resetHistory) {
        chatHistory.current = [];
      }
      // Persona is now sent on every turn via context.agentPersona, so we
      // don't need to inject it into history. Just record the greeting so
      // the model has continuity from turn 2 onwards.
      chatHistory.current.push({ role: "model", content: agent.greeting });
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-greet-${agent.id}-${Date.now()}`,
          text: agent.greeting,
          sender: "bot",
          agentId: agent.id,
        },
      ]);
      setSelectedAgentId(agent.id);
    },
    [],
  );

  const handlePickAgent = useCallback(
    (agentId: string) => {
      primeAgent(agentId, { resetHistory: true });
      if (!firstSend.current) {
        firstSend.current = true;
        triggerTransition();
      }
    },
    [primeAgent],
  );

  const handleConfirmTransfer = useCallback(
    (agentId: string, messageId: string) => {
      // Drop the confirm card from the original bot message so it can't be
      // re-tapped.
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, transferTo: undefined } : m,
        ),
      );
      primeAgent(agentId, { resetHistory: true });
    },
    [primeAgent],
  );

  const handleSwitchAgent = useCallback(
    (agentId: string) => {
      setShowSwitcher(false);
      if (agentId === selectedAgentId) return;
      // Reset the model context so the new agent isn't biased by the prior
      // agent's transcript. Visible bubbles stay (each tagged with its own
      // agentId), and the new agent greets.
      primeAgent(agentId, { resetHistory: true });
    },
    [primeAgent, selectedAgentId],
  );

  const handleDeclineTransfer = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, transferTo: undefined } : m,
      ),
    );
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
      <Animated.View
        entering={FadeInDown.duration(260).springify().damping(16)}
        style={[styles.messageRow, isBot ? styles.botRow : styles.userRow]}
      >
        {isBot && (
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: "#FFF",
                borderColor: item.agentId
                  ? AGENT_THEME[item.agentId]?.accent ?? colors.border
                  : colors.border,
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
              },
            ]}
          >
            <Image
              source={portraitFor(item.agentId)}
              style={{
                width: avatarImgSize + 4,
                height: avatarImgSize + 4,
                resizeMode: "cover",
                borderRadius: (avatarImgSize + 4) / 2,
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
              style={[styles.saveActionBtn, { backgroundColor: colors.accent }]}
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
          {/* Transfer confirm card */}
          {item.transferTo && AGENTS_BY_ID[item.transferTo] && (
            <View
              style={[
                styles.transferCard,
                { backgroundColor: colors.backgroundGrouped, borderColor: colors.border },
              ]}
            >
              <AppText
                size={11}
                style={{
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginBottom: vs(6),
                }}
              >
                TRANSFER SUGGESTED
              </AppText>
              <AppText
                size={13}
                style={{ color: colors.textPrimary, marginBottom: vs(10) }}
              >
                Switch to{" "}
                <AppText size={13} style={{ fontWeight: "700", color: colors.primary }}>
                  {AGENTS_BY_ID[item.transferTo].name}
                </AppText>
                ?
              </AppText>
              <View style={styles.transferActions}>
                <TouchableOpacity
                  style={[
                    styles.transferBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => handleConfirmTransfer(item.transferTo!, item.id)}
                  activeOpacity={0.7}
                >
                  <AppText size={13} style={{ color: "#FFF", fontWeight: "600" }}>
                    Yes, transfer
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.transferBtn,
                    {
                      backgroundColor: "transparent",
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleDeclineTransfer(item.id)}
                  activeOpacity={0.7}
                >
                  <AppText
                    size={13}
                    style={{ color: colors.textPrimary, fontWeight: "600" }}
                  >
                    Stay here
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
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
      </Animated.View>
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
    <Animated.View
      entering={FadeInDown.duration(220)}
      style={[styles.messageRow, styles.botRow]}
    >
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: "#FFF",
            borderColor: selectedAgentId
              ? AGENT_THEME[selectedAgentId]?.accent ?? colors.border
              : colors.border,
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
          },
        ]}
      >
        <Image
          source={portraitFor(selectedAgentId ?? undefined)}
          style={{
            width: avatarImgSize + 4,
            height: avatarImgSize + 4,
            resizeMode: "cover",
            borderRadius: (avatarImgSize + 4) / 2,
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
    </Animated.View>
  );

  const renderInputBar = (animated: boolean) => {
    const agentReady = !!selectedAgentId;
    const canSend = agentReady && (inputText.trim() || pendingImage) && !isTyping;
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
                // Drop forced lineHeight so single-line text vertically
                // centers against the buttons; reanimated multiline still
                // grows naturally as the user types more.
              },
            ]}
            textAlignVertical="center"
            placeholder={
              agentReady
                ? `Message ${selectedAgent?.name ?? "Assistant"}...`
                : "Pick an agent above to start chatting"
            }
            placeholderTextColor={colors.textPlaceholder}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
            editable={agentReady && !isTyping}
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

  const renderAgentPicker = () => (
    <View style={styles.agentGrid}>
      {AGENTS.map((agent) => {
        const theme = AGENT_THEME[agent.id] ?? {
          accent: colors.primary,
          soft: colors.backgroundGrouped,
          border: colors.border,
          portrait: null,
        };
        return (
          <TouchableOpacity
            key={agent.id}
            style={[
              styles.agentCard,
              { backgroundColor: theme.soft, borderColor: theme.border },
              elderlyMode && { width: "100%" },
            ]}
            onPress={() => handlePickAgent(agent.id)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.agentPortraitRing,
                { borderColor: theme.accent, backgroundColor: "#FFFFFF" },
              ]}
            >
              {theme.portrait ? (
                <Image
                  source={theme.portrait}
                  style={styles.agentPortraitImg}
                />
              ) : (
                <AppIcon name={agent.icon} size={18} color={theme.accent} />
              )}
            </View>
            <AppText
              size={13}
              style={{
                fontWeight: "700",
                color: colors.textPrimary,
                marginTop: vs(6),
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              {agent.name}
            </AppText>
            <AppText
              size={10}
              style={{
                color: colors.textSecondary,
                textAlign: "center",
                marginTop: vs(2),
                lineHeight: eLineHeight(10),
              }}
              numberOfLines={2}
            >
              {agent.tagline}
            </AppText>
          </TouchableOpacity>
        );
      })}
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
        size={elderlyMode ? 18 : 20}
        style={{
          fontWeight: "700",
          color: colors.textPrimary,
          textAlign: "center",
        }}
      >
        Choose an AI agent for today
      </AppText>
      <AppText
        size={elderlyMode ? 12 : 12}
        style={{
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: eLineHeight(12),
          marginTop: vs(6),
          paddingHorizontal: s(20),
        }}
      >
        Tap any specialist. You can switch any time mid-chat.
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
          colors={Gradients.hero as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerOrb} pointerEvents="none" />
        <View style={{ height: insets.top + vs(16) }} />
        <View style={styles.gradientHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <AppIcon name="chevron.left" size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.gradientHeaderCenter}
            activeOpacity={0.7}
            onPress={() => setShowSwitcher(true)}
          >
            <View
              style={[
                styles.gradientHeaderAvatar,
                selectedAgentId
                  ? {
                    borderColor:
                      AGENT_THEME[selectedAgentId]?.accent ?? "#FFF",
                    borderWidth: 2,
                  }
                  : null,
              ]}
            >
              <Image
                source={portraitFor(selectedAgentId ?? undefined)}
                style={{
                  width: 32,
                  height: 32,
                  resizeMode: "cover",
                  borderRadius: 16,
                }}
              />
            </View>
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <AppText size={16} style={{ fontWeight: "700", color: "#FFF" }}>
                  {selectedAgent?.name ?? "Digital Assistant"}
                </AppText>
                <AppIcon name="chevron.down" size={14} color="rgba(255,255,255,0.85)" />
              </View>
              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <AppText size={11} style={{ color: "rgba(255,255,255,0.8)" }}>
                  Tap to switch agent
                </AppText>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerAction}
            activeOpacity={0.7}
            onPress={() => setShowSwitcher(true)}
          >
            <AppIcon name="person.2.fill" size={20} color="#FFF" />
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
                    {renderAgentPicker()}
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
            {selectedAgentId ? renderInputBar(false) : null}
          </>
        ) : (
          // ── NORMAL MODE: centered welcome with translateY input animation ──
          <>
            <View style={styles.flex1}>
              {/* Welcome — absolute centered, fades out */}
              <Animated.View style={[styles.welcomeCentered, welcomeStyle]}>
                {welcomeHeader()}
                <View style={{ height: vs(24) }} />
                {renderAgentPicker()}
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
            {selectedAgentId ? renderInputBar(true) : null}
          </>
        )}
      </KeyboardAvoidingView>

      {/* ===== Agent switcher modal (mid-chat) ===== */}
      <Modal
        visible={showSwitcher}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSwitcher(false)}
      >
        <Pressable
          style={styles.switcherBackdrop}
          onPress={() => setShowSwitcher(false)}
        >
          <Pressable
            style={[
              styles.switcherSheet,
              { backgroundColor: colors.background },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.switcherHandle} />
            <View style={styles.switcherHeader}>
              <AppText
                size={16}
                style={{ fontWeight: "700", color: colors.textPrimary }}
              >
                Switch agent
              </AppText>
              <TouchableOpacity
                onPress={() => setShowSwitcher(false)}
                hitSlop={8}
              >
                <AppIcon name="xmark" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <AppText
              size={12}
              style={{
                color: colors.textSecondary,
                marginBottom: vs(14),
                lineHeight: eLineHeight(12),
              }}
            >
              Switching keeps your chat visible but starts a fresh context with the new agent.
            </AppText>
            <View style={styles.switcherList}>
              {AGENTS.map((agent) => {
                const theme = AGENT_THEME[agent.id] ?? {
                  accent: colors.primary,
                  soft: colors.backgroundGrouped,
                  border: colors.border,
                  portrait: DEFAULT_AVATAR,
                };
                const isActive = agent.id === selectedAgentId;
                return (
                  <TouchableOpacity
                    key={agent.id}
                    style={[
                      styles.switcherRow,
                      {
                        backgroundColor: isActive ? theme.soft : "transparent",
                        borderColor: isActive ? theme.border : "transparent",
                      },
                    ]}
                    onPress={() => handleSwitchAgent(agent.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.switcherAvatar,
                        { borderColor: theme.accent, backgroundColor: theme.soft },
                      ]}
                    >
                      <Image
                        source={theme.portrait}
                        style={styles.switcherAvatarImg}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText
                        size={14}
                        style={{
                          fontWeight: "700",
                          color: colors.textPrimary,
                        }}
                      >
                        {agent.name}
                      </AppText>
                      <AppText
                        size={11}
                        style={{
                          color: colors.textSecondary,
                          marginTop: 2,
                        }}
                        numberOfLines={1}
                      >
                        {agent.tagline}
                      </AppText>
                    </View>
                    {isActive ? (
                      <View
                        style={[
                          styles.switcherActiveBadge,
                          { backgroundColor: theme.accent },
                        ]}
                      >
                        <AppText
                          size={10}
                          style={{ color: "#FFF", fontWeight: "700" }}
                        >
                          ACTIVE
                        </AppText>
                      </View>
                    ) : (
                      <AppIcon
                        name="chevron.right"
                        size={16}
                        color={colors.textSecondary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    overflow: "hidden",
    paddingBottom: vs(28),
    borderBottomLeftRadius: Radii.xl,
    borderBottomRightRadius: Radii.xl,
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

  // Agent picker — compact, tinted-per-persona card grid
  agentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: s(8),
    paddingHorizontal: s(10),
  },
  agentCard: {
    width: "30%",
    minHeight: 118,
    borderRadius: s(12),
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: vs(10),
    paddingHorizontal: s(6),
    alignItems: "center",
    justifyContent: "flex-start",
  },
  switcherBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-end",
  },
  switcherSheet: {
    paddingHorizontal: s(20),
    paddingTop: vs(8),
    paddingBottom: vs(28),
    borderTopLeftRadius: s(20),
    borderTopRightRadius: s(20),
  },
  switcherHandle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.18)",
    marginBottom: vs(10),
  },
  switcherHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: vs(4),
  },
  switcherList: {
    gap: vs(8),
  },
  switcherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(12),
    padding: s(10),
    borderRadius: s(12),
    borderWidth: 1,
  },
  switcherAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  switcherAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: "cover",
  },
  switcherActiveBadge: {
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: s(8),
  },
  agentPortraitRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  agentPortraitImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: "cover",
  },

  // Transfer suggestion card
  transferCard: {
    marginTop: vs(8),
    borderRadius: s(12),
    borderWidth: 1,
    padding: s(12),
  },
  transferActions: {
    flexDirection: "row",
    gap: s(8),
  },
  transferBtn: {
    flex: 1,
    paddingVertical: vs(8),
    borderRadius: s(10),
    alignItems: "center",
    justifyContent: "center",
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
  bubble: { borderRadius: s(20) },
  headerOrb: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -80,
    right: -50,
    backgroundColor: "rgba(6,182,212,0.18)",
  },
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
    paddingVertical: Platform.OS === "ios" ? vs(2) : 0,
    gap: s(4),
  },
  textInput: {
    flex: 1,
    maxHeight: 110,
    // Zero vertical padding so single-line text sits vertically centered;
    // when multiline content grows, the wrapper expands via minHeight + the
    // TextInput's own intrinsic line height.
    paddingTop: 0,
    paddingBottom: 0,
    paddingVertical: 0,
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
