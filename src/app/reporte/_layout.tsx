import { coloresOficiales } from "@/constants/theme";
import { Stack } from "expo-router";

export default function ReporteLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: coloresOficiales.primario },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Nuevo reporte" }} />
    </Stack>
  );
}