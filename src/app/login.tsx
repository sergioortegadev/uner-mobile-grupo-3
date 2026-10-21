import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/state-views";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { authService } from "@/services/auth";
import { Usuario } from "@/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ErroresLogin = {
  email?: string;
  password?: string;
};

function irSegunRol(usuario: Usuario) {
  router.replace(usuario.rol === "operador" ? "/operador" : "/");
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errores, setErrores] = useState<ErroresLogin>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [verificandoSesion, setVerificandoSesion] = useState(true);

  // Si ya hay una sesión persistida, se omite el login. Si no hay, se muestra el formulario limpio.
  useFocusEffect(
    useCallback(() => {
      let activo = true;

      authService
        .getCurrentUser()
        .then((usuario) => {
          if (!activo) return;
          if (usuario) {
            irSegunRol(usuario);
          } else {
            setEmail("");
            setPassword("");
            setErrores({});
            setErrorGeneral(null);
            setVerificandoSesion(false);
          }
        })
        .catch(() => {
          if (activo) setVerificandoSesion(false);
        });

      return () => {
        activo = false;
      };
    }, []),
  );

  async function iniciarSesion() {
    const emailLimpio = email.trim();
    const nuevosErrores: ErroresLogin = {};

    if (!emailLimpio) {
      nuevosErrores.email = "Ingresá tu correo electrónico.";
    } else if (!EMAIL_REGEX.test(emailLimpio)) {
      nuevosErrores.email = "El correo electrónico no es válido.";
    }

    if (!password) {
      nuevosErrores.password = "Ingresá tu contraseña.";
    }

    setErrores(nuevosErrores);
    setErrorGeneral(null);
    if (Object.keys(nuevosErrores).length > 0) return;

    setCargando(true);
    try {
      const respuesta = await authService.login({ email: emailLimpio, password });
      irSegunRol(respuesta.user);
    } catch (error) {
      setErrorGeneral(error instanceof Error ? error.message : "No se pudo iniciar sesión.");
    } finally {
      setCargando(false);
    }
  }

  if (verificandoSesion) {
    return (
      <ThemedView style={styles.flex}>
        <LoadingState message="Verificando sesión..." />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <ThemedText type="title">Iniciar sesión</ThemedText>
            <ThemedText themeColor="textSecondary">Ingresá con tu cuenta para continuar.</ThemedText>

            <View style={styles.form}>
              <Input
                label="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                error={errores.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                disabled={cargando}
              />
              <Input
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                error={errores.password}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                disabled={cargando}
              />

              {errorGeneral ? (
                <ThemedText themeColor="danger" style={styles.errorGeneral}>
                  ✖ {errorGeneral}
                </ThemedText>
              ) : null}

              <View style={styles.acciones}>
                <Button title="Iniciar sesión" onPress={iniciarSesion} loading={cargando} />
                <Button
                  title="¿No tenés cuenta? Registrate"
                  variant="texto"
                  onPress={() => router.push("/registro")}
                  disabled={cargando}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    flexDirection: "row",
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Spacing.four,
    gap: Spacing.three,
  },
  form: {
    marginTop: Spacing.three,
  },
  errorGeneral: {
    marginBottom: Spacing.three,
  },
  acciones: {
    gap: Spacing.two,
  },
});
