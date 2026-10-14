import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { router } from "expo-router";
import { StyleSheet } from "react-native";

const LoginScreen = () => {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Iniciar Session</ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        [L01] Pantalla de Login
      </ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        Aquí añadir los input de user y pass
      </ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        Si no tiene cuenta que use el siguiente botón
      </ThemedText>
      <Button title="registrarse" onPress={() => router.push("/(auth)/register")} />
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

export default LoginScreen;
