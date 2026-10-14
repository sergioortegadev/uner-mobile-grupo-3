import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet } from "react-native";

const ReportarScreen = () => {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Nuevo Reporte</ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        [V01-V10] Formulario de creación de reporte
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

export default ReportarScreen;
