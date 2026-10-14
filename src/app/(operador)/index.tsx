import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet } from "react-native";

const BandejaOperadorScreen = () => {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Bandeja de entrada del operador</ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        [OP01-OP04] Reclamos por Zonas
      </ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});

export default BandejaOperadorScreen;
