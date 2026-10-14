import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet } from "react-native";

const DetalleReporteVecinoScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Detalle de Reporte #{id}</ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        [R02-R06] Historial y QR
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

export default DetalleReporteVecinoScreen;
