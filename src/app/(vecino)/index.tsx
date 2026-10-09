import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet } from "react-native";

const VecinoMapaScreen = () => {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Mapa de Reportes</ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        [M01-M04] Vista de Mapa
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

export default VecinoMapaScreen;
