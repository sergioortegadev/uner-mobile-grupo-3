import { useState } from "react";
import { TextInput, View, StyleSheet, type TextInputProps } from "react-native";
import { ThemedText } from "../themed-text";
import { useTheme } from "@/hooks/use-theme";
import { coloresOficiales } from "@/constants/theme";

type InputProps = TextInputProps & {
  label?: string;
  error?: string | null;
  disabled?: boolean;
};

export const Input = ({ label, error, style, disabled = false, ...rest }: InputProps) => {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText type="small" style={styles.label} themeColor="textSecondary">
          {label}
        </ThemedText>
      )}

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: disabled ? theme.border : theme.backgroundElement,
            color: theme.text,
            borderColor: error ? coloresOficiales.rechazado : focused ? coloresOficiales.primario : theme.border,
          },
          style,
        ]}
        placeholderTextColor={theme.textSecondary}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={!disabled}
        {...rest}
      />
      {error && (
        <ThemedText type="small" style={styles.errorText}>
          ✖ {error}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  errorText: {
    color: coloresOficiales.rechazado,
    marginTop: 4,
  },
});
