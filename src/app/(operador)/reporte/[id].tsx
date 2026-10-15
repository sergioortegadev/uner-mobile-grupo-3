import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet } from "react-native";

const GestionReporteOperadorScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Gestión de Reclamo #{id}</ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        [OP05-OP09] Asignar cuadrilla y cambiar estado
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

export default GestionReporteOperadorScreen;
