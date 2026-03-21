import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppContext } from "@/context/AppContext";
import { StyleSheet, TextInput, View } from "react-native";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar = ({
  value,
  onChangeText,
  placeholder = "Search",
}: SearchBarProps) => {
  const { colors } = useAppContext();

  return (
    <View
      style={[
        styles.searchContainer,
        { backgroundColor: colors.backgroundGrouped },
      ]}
    >
      <IconSymbol
        size={20}
        name="magnifyingglass"
        color={colors.textPlaceholder}
      />
      <TextInput
        style={[styles.searchInput, { color: colors.textPrimary }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textPlaceholder}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 8,
  },
});
