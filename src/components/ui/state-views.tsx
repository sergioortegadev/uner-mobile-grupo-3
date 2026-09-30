import { ActivityIndicator, StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";
import { Button } from "./button";

export const LoadingState = ({ message = "Cargando..." }: { message?: string }) => {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size={"large"} />
      <ThemedText style={{ marginTop: 12 }}>{message}</ThemedText>
    </View>
  );
};

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => {
  return (
    <View style={styles.centerContainer}>
      <ThemedText type="subtitle" style={{ marginBottom: 8 }}>
        Ocurrió un problema
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={{ textAlign: "center", marginBottom: 16 }}>
        {message}
      </ThemedText>
      {onRetry && <Button title="Reintentar" variant="contorno" onPress={onRetry} />}
    </View>
  );
};

export const EmptyState = ({ message }: { message: string }) => {
  return (
    <View style={styles.centerContainer}>
      <ThemedText themeColor="textSecondary" style={{ textAlign: "center" }}>
        {message}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});
