import { AppText } from "@/components/common/AppText";
import { s, vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { Stack, useRouter } from "expo-router";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PayTaxPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppContext();

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
          title: "Pay Tax",
        }}
      />
      <ScrollView style={styles.content}>
        <View style={{ padding: s(16) }}>
          <AppText
            size={18}
            style={{
              fontWeight: "700",
              marginBottom: vs(16),
              color: colors.textPrimary,
            }}
          >
            Pay Tax
          </AppText>
          <AppText
            size={14}
            style={{
              color: colors.textSecondary,
              lineHeight: 20,
              marginBottom: vs(16),
            }}
          >
            Select your tax type and proceed with payment
          </AppText>

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
              Income Tax Payment
            </AppText>
          </TouchableOpacity>

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
              Property Tax Payment
            </AppText>
          </TouchableOpacity>
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
