import { AppText } from "@/components/common/AppText";
import { s, vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { Stack } from "expo-router";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function IdentityDocumentsPage() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppContext();

  const services = [
    "Renew MyKad",
    "Birth Certificate Application",
    "Passport Application",
    "Passport Renewal",
  ];

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
          title: "Identity & Personal Documents",
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
            Identity & Personal Documents
          </AppText>

          {services.map((service, index) => (
            <TouchableOpacity
              key={index}
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
          ))}
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
