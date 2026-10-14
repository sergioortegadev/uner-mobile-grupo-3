import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { StyleSheet } from "react-native";

const PerfilOperadorScreen = () => {
  const { user, logout } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Operador: {user?.nombre}</ThemedText>
      <ThemedText type="default" themeColor="textSecondary">
        Zona asignada: {user?.zonaId || "Sin zona"}
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

export default PerfilOperadorScreen;
