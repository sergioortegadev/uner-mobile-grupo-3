import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { LoadingState } from "@/components/ui/state-view";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { DarkTheme, DefaultTheme, Slot, ThemeProvider, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { useColorScheme } from "react-native";

const NavigationGuard = () => {
  const { user, isLoading } = useAuth();
  const segments = useSegments() as string[];
  const router = useRouter();
  const currentSegment = segments[0];
  const isInAuthGroup = currentSegment === "(auth)" || currentSegment === "login";
  const isInVecinoGroup = currentSegment === "(vecino)";
  const isInOperadorGroup = currentSegment === "(operador)";

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      if (!isInAuthGroup) {
        router.replace("/(auth)/login" as any);
      }
      return;
    }

    if (user.rol === "vecino" && !isInVecinoGroup) {
      router.replace("/(vecino)" as any);
      return;
    }

    if (user.rol === "operador" && !isInOperadorGroup) {
      router.replace("/(operador)" as any);
      return;
    }
  }, [user, isLoading, isInAuthGroup, isInVecinoGroup, isInOperadorGroup, router]);

  if (isLoading) {
    return <LoadingState message="Verificando sesión..." />;
  }

  return <Slot />;
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <NavigationGuard />
      </AuthProvider>
    </ThemeProvider>
  );
}
