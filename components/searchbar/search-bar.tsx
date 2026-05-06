import { IconSymbol } from "@/components/ui/icon-symbol";
import { Radii } from "@/constants/colors";
import { useAppContext } from "@/context/AppContext";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export const SearchBar = ({
  value,
  onChangeText,
  placeholder = "Search services, offices, news…",
  onClear,
}: SearchBarProps) => {
  const { colors } = useAppContext();

  return (
    <View
      style={[
        styles.searchContainer,
        {
          backgroundColor: colors.backgroundElevated,
          borderColor: colors.borderLight,
        },
      ]}
    >
      <IconSymbol size={18} name="magnifyingglass" color={colors.textSecondary} />
      <TextInput
        style={[styles.searchInput, { color: colors.textPrimary }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textPlaceholder}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => {
            onChangeText("");
            onClear?.();
          }}
          hitSlop={8}
          style={({ pressed }) => [
            styles.clearBtn,
            { backgroundColor: colors.backgroundGrouped, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <IconSymbol size={12} name="xmark" color={colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
});
