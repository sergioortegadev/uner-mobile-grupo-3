import { router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth";

export function LogoutButton() {
  const [cargando, setCargando] = useState(false);

  async function cerrarSesion() {
    setCargando(true);
    try {
      await authService.logout();
      router.replace("/login");
    } catch {
      Alert.alert("Error", "No se pudo cerrar la sesión.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <Button
      title="Cerrar sesión"
      variant="contorno"
      size="mediano"
      onPress={cerrarSesion}
      loading={cargando}
      style={{ alignSelf: "stretch" }}
    />
  );
}
