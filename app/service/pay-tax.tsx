import { AppText } from "@/components/common/AppText";
import { s, vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { stagger, useFadeInUp } from "@/hooks/useAnimations";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import {
  Linking,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const REDIRECT_URL =
  "https://byrhasil.hasil.gov.my/HITS_EP/PaymentOption?lang=EN";
const VIDEO_URL = "https://www.youtube.com/watch?v=uMYmyRX7xRU";

export default function PayTaxPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppContext();

  const titleAnim = useFadeInUp(stagger(0, 100));
  const descAnim = useFadeInUp(stagger(1, 100));
  const linkAnim = useFadeInUp(stagger(2, 100));
  const userGuideAnim = useFadeInUp(stagger(3, 100));
  const deptAnim = useFadeInUp(stagger(4, 100));
  const docsAnim = useFadeInUp(stagger(5, 100));
  const scanAnim = useFadeInUp(stagger(6, 100));

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      console.log("Unable to open URL");
    });
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      {/* Header with Back Button */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            paddingHorizontal: 16,
            paddingVertical: 12,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText
          size={18}
          style={{
            fontWeight: "700",
            color: colors.textPrimary,
            flex: 1,
            textAlign: "center",
            marginRight: 24,
          }}
        >
          Pay Tax
        </AppText>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ padding: s(16) }}>
          {/* Title Section */}
          <Animated.View style={[styles.titleSection, titleAnim]}>
            <AppText
              size={18}
              style={{
                fontWeight: "700",
                marginBottom: vs(4),
                color: colors.textPrimary,
              }}
            >
              Online Queue & Appointments
            </AppText>
          </Animated.View>

          {/* Pay Tax Online Section */}
          <Animated.View style={descAnim}>
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.backgroundGrouped },
              ]}
            >
              <AppText
                size={16}
                style={{
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginBottom: vs(4),
                }}
              >
                Pay Tax Online
              </AppText>
              <AppText
                size={12}
                style={{
                  color: colors.primary,
                  fontWeight: "600",
                  marginBottom: vs(8),
                }}
              >
                LHDN (Tax Services)
              </AppText>
              <AppText
                size={12}
                style={{
                  color: colors.textSecondary,
                  lineHeight: 18,
                  marginBottom: vs(12),
                }}
              >
                Make income tax payments or settle outstanding balances online
              </AppText>
            </View>
          </Animated.View>

          {/* Redirect Link Section */}
          <Animated.View style={linkAnim}>
            <View style={{ marginBottom: vs(16) }}>
              <AppText
                size={12}
                style={{
                  color: colors.textSecondary,
                  fontWeight: "500",
                  marginBottom: vs(6),
                }}
              >
                Redirect user to current LHDN online payment platform (this link
                will be pretty later)
              </AppText>
              <TextInput
                editable={false}
                style={[
                  styles.urlInput,
                  {
                    backgroundColor: colors.backgroundGrouped,
                    color: colors.textPrimary,
                    borderColor: colors.border || "#E0E0E0",
                  },
                ]}
                value={REDIRECT_URL}
              />
              <TouchableOpacity
                style={[styles.openButton, { backgroundColor: colors.primary }]}
                onPress={() => handleOpenLink(REDIRECT_URL)}
              >
                <AppText
                  size={12}
                  style={{
                    color: "#FFFFFF",
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  Open Payment Portal
                </AppText>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* User Guide with Video */}
          <Animated.View style={userGuideAnim}>
            <View style={{ marginBottom: vs(16) }}>
              <AppText
                size={14}
                style={{
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginBottom: vs(10),
                }}
              >
                User Guide
              </AppText>
              <View
                style={[
                  styles.videoContainer,
                  {
                    backgroundColor: colors.backgroundGrouped,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <WebView
                  source={{
                    html: `
                      <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <style>
                            body { margin: 0; padding: 0; }
                            .video-wrapper { position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; }
                            .video-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
                          </style>
                        </head>
                        <body>
                          <div class="video-wrapper">
                            <iframe src="https://www.youtube.com/embed/uMYmyRX7xRU" allowfullscreen="" allow="autoplay; encrypted-media"></iframe>
                          </div>
                        </body>
                      </html>
                    `,
                  }}
                  scalesPageToFit={true}
                  scrollEnabled={false}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </Animated.View>

          {/* Nearest Relevant Department */}
          <Animated.View style={deptAnim}>
            <View style={{ marginBottom: vs(16) }}>
              <AppText
                size={14}
                style={{
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginBottom: vs(10),
                }}
              >
                Nearest Relevant Department
              </AppText>
              <View
                style={[
                  styles.departmentItem,
                  {
                    backgroundColor: "#FFF8E1",
                    borderColor: "#FFE082",
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <AppText
                    size={12}
                    style={{
                      color: colors.textPrimary,
                      fontWeight: "600",
                      marginBottom: vs(4),
                    }}
                  >
                    LHDN Putih
                  </AppText>
                  <AppText
                    size={11}
                    style={{
                      color: colors.textSecondary,
                    }}
                  >
                    5 waiting
                  </AppText>
                </View>
                <TouchableOpacity
                  style={[styles.queueButton, { backgroundColor: "#D4F1D4" }]}
                >
                  <AppText
                    size={11}
                    style={{
                      color: "#2E7D32",
                      fontWeight: "600",
                    }}
                  >
                    Join Queue
                  </AppText>
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.departmentItem,
                  {
                    backgroundColor: "#FFF8E1",
                    borderColor: "#FFE082",
                    marginTop: vs(8),
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <AppText
                    size={12}
                    style={{
                      color: colors.textPrimary,
                      fontWeight: "600",
                      marginBottom: vs(4),
                    }}
                  >
                    LHDN Putchong
                  </AppText>
                  <AppText
                    size={11}
                    style={{
                      color: colors.textSecondary,
                    }}
                  >
                    3 waiting
                  </AppText>
                </View>
                <TouchableOpacity
                  style={[styles.queueButton, { backgroundColor: "#D4F1D4" }]}
                >
                  <AppText
                    size={11}
                    style={{
                      color: "#2E7D32",
                      fontWeight: "600",
                    }}
                  >
                    Join Queue
                  </AppText>
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.departmentItem,
                  {
                    backgroundColor: "#FFE0B2",
                    borderColor: "#FFCC80",
                    marginTop: vs(8),
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <AppText
                    size={12}
                    style={{
                      color: colors.textPrimary,
                      fontWeight: "600",
                      marginBottom: vs(4),
                    }}
                  >
                    LHDN Cyberjays
                  </AppText>
                  <AppText
                    size={11}
                    style={{
                      color: colors.textSecondary,
                    }}
                  >
                    0 waiting
                  </AppText>
                </View>
                <TouchableOpacity
                  style={[styles.queueButton, { backgroundColor: "#FFCDD2" }]}
                >
                  <AppText
                    size={11}
                    style={{
                      color: "#C62828",
                      fontWeight: "600",
                    }}
                  >
                    Closed
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Required Documents */}
          <Animated.View style={docsAnim}>
            <View style={{ marginBottom: vs(16) }}>
              <AppText
                size={14}
                style={{
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginBottom: vs(10),
                }}
              >
                Required Documents
              </AppText>
              <View
                style={[
                  styles.docCard,
                  { backgroundColor: "#FFCCCC", borderColor: "#FF9999" },
                ]}
              >
                <AppText
                  size={12}
                  style={{
                    color: colors.textPrimary,
                    fontWeight: "600",
                    marginBottom: vs(6),
                  }}
                >
                  IC / MyKad
                </AppText>
                <AppText
                  size={11}
                  style={{
                    color: colors.textSecondary,
                    marginBottom: vs(6),
                  }}
                >
                  Tax Reference Number
                </AppText>
                <AppText
                  size={11}
                  style={{
                    color: colors.textSecondary,
                  }}
                >
                  Income details (if needed)
                </AppText>
              </View>
            </View>
          </Animated.View>

          {/* Scan Document Button */}
          <Animated.View style={scanAnim}>
            <TouchableOpacity
              style={[
                styles.scanButton,
                {
                  backgroundColor: colors.backgroundGrouped,
                  borderColor: colors.primary,
                },
              ]}
            >
              <AppText
                size={12}
                style={{
                  color: colors.primary,
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                Scan document to auto-fill your details
              </AppText>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  titleSection: {
    paddingHorizontal: s(16),
    marginBottom: vs(12),
  },
  sectionCard: {
    borderRadius: 8,
    padding: s(12),
    marginBottom: vs(12),
  },
  urlInput: {
    borderWidth: 1,
    borderRadius: 6,
    padding: s(10),
    fontSize: 11,
    marginBottom: vs(8),
  },
  openButton: {
    paddingVertical: vs(10),
    borderRadius: 6,
    marginBottom: vs(8),
  },
  videoContainer: {
    height: 220,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  departmentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: s(12),
    borderRadius: 6,
    borderWidth: 1,
  },
  queueButton: {
    paddingVertical: vs(6),
    paddingHorizontal: s(10),
    borderRadius: 4,
  },
  docCard: {
    borderWidth: 1,
    borderRadius: 6,
    padding: s(12),
  },
  scanButton: {
    paddingVertical: vs(12),
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: vs(20),
  },
});
