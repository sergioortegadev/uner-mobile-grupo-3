import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet } from "react-native";

const MapaOperadorScreen = () => {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Mapa Operativo de Zonas</ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        [Z01, Z03] Cuadrillas y Zonas
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

export default MapaOperadorScreen;
