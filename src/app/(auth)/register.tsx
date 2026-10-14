import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet } from "react-native";

const RegisterScreen = () => {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Crear Cuenta</ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        [L01] Pantalla de Registro
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

export default RegisterScreen;
