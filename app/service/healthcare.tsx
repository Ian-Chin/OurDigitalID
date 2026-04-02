import { AppText } from "@/components/common/AppText";
import { s, vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { stagger, useFadeInUp } from "@/hooks/useAnimations";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HealthcarePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppContext();
  const { t } = useTranslation();

  const services = [
    t("healthcare"),
    "Health Check-up",
    "Vaccination Appointment",
    "Prescription Refill",
  ];

  const titleAnim = useFadeInUp(stagger(0, 100));
  const btn0 = useFadeInUp(stagger(1, 100));
  const btn1 = useFadeInUp(stagger(2, 100));
  const btn2 = useFadeInUp(stagger(3, 100));
  const btn3 = useFadeInUp(stagger(4, 100));
  const btnAnims = [btn0, btn1, btn2, btn3];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          {t("healthcare")}
        </AppText>
      </View>
      <ScrollView style={styles.content}>
        <View style={{ padding: s(16) }}>
          <Animated.View style={titleAnim}>
            <AppText
              size={18}
              style={{
                fontWeight: "700",
                marginBottom: vs(16),
                color: colors.textPrimary,
              }}
            >
              {t("healthcare")}
            </AppText>
          </Animated.View>

          {services.map((service, index) => (
            <Animated.View key={index} style={btnAnims[index]}>
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: colors.primary + "20",
                    borderColor: colors.primary,
                  },
                ]}
              >
                <AppText
                  size={14}
                  style={{
                    fontWeight: "600",
                    color: colors.primary,
                    textAlign: "center",
                  }}
                >
                  {service}
                </AppText>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
        <View style={{ height: 80 }} />
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
  button: {
    paddingVertical: vs(14),
    marginBottom: vs(12),
    borderRadius: 8,
    borderWidth: 1,
  },
});
