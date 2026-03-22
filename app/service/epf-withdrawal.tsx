import { AppText } from "@/components/common/AppText";
import { s, vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { useFadeInUp, stagger } from "@/hooks/useAnimations";
import { Stack } from "expo-router";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function EpfWithdrawalPage() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppContext();

  const titleAnim = useFadeInUp(stagger(0, 100));
  const descAnim = useFadeInUp(stagger(1, 100));
  const btn0 = useFadeInUp(stagger(2, 100));
  const btn1 = useFadeInUp(stagger(3, 100));

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "EPF Withdrawal",
        }}
      />
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
              EPF Withdrawal
            </AppText>
          </Animated.View>

          <Animated.View style={descAnim}>
            <AppText
              size={14}
              style={{
                color: colors.textSecondary,
                lineHeight: 20,
                marginBottom: vs(16),
              }}
            >
              Apply for your EPF withdrawal or view withdrawal status
            </AppText>
          </Animated.View>

          <Animated.View style={btn0}>
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
                New Withdrawal Application
              </AppText>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={btn1}>
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
                Check Withdrawal Status
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
  button: {
    paddingVertical: vs(14),
    marginBottom: vs(12),
    borderRadius: 8,
    borderWidth: 1,
  },
});
