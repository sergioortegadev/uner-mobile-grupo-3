import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { StyleSheet } from "react-native";

const PerfilVecinoScreen = () => {
  const { user, logout } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{user?.nombre ?? "Juanito Perez"}</ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        [N02] Configuración de avisos (notificaciones), y cerrar sessión de vecino.
      </ThemedText>
      <Button title="Cerrar Sesión" onPress={logout} />
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

export default PerfilVecinoScreen;
