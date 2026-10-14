import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet } from "react-native";

const MisReportesScreen = () => {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Mis Reportes</ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        [R01] Lista de reclamos propios
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

export default MisReportesScreen;
