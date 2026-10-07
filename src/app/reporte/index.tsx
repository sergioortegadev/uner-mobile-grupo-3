import { PhotoSelector } from "@/components/reporte/photo-selector";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Foto } from "@/types";
import { type ReactNode, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";


export default function NewReportScreen() {
  const theme = useTheme();

  // Las fotos viven en la pantalla: las necesitamos para validar al enviar (y después para V10).
  const [photos, setPhotos] = useState<Foto[]>([]);
  // Los errores se muestran recién después del primer intento de envío.
  const [triedToSend, setTriedToSend] = useState(false);

  const missingPhoto = photos.length === 0;

  function sendReport() {
    setTriedToSend(true);

    if (missingPhoto) {
      Alert.alert("Falta la foto", "Sacá o elegí al menos una foto del problema.");
      return;
    }

    // TODO(V10): enviar el reporte con reportService.createReport.
    Alert.alert("Reporte listo", `${photos.length} foto(s) cargada(s).`);
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="¿Qué pasa?">
          {/* V01 */}
          <Placeholder text="Tipos de problema (V01)" />
        </Section>

        <Section title="Foto" note="(obligatoria)" error={triedToSend && missingPhoto ? "La foto es obligatoria." : null}>
          {/* V02 */}
          <PhotoSelector photos={photos} onChangePhotos={setPhotos} />
        </Section>

        <Section title="¿Dónde?">
          {/* V04 / V05 */}
          <Placeholder text="Ubicación (V04 / V05)" />
        </Section>

        <Section title="Contanos" note="(opcional)">
          {/* V06 / V07 */}
          <Placeholder text="Descripción (V06 / V07)" />
        </Section>
      </ScrollView>

      {/* Botón fijo abajo, fuera del ScrollView, para que siempre esté visible */}
      <View style={[styles.footer, { backgroundColor: theme.backgroundElement, borderTopColor: theme.border }]}>
        <Button title="Enviar reporte" variant="accion" onPress={sendReport} />
      </View>
    </View>
  );
}

function Section({
  title,
  note,
  error,
  children,
}: {
  title: string;
  note?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle} accessibilityRole="header">
        {title}{" "}
        {note && (
          <ThemedText type="small" themeColor="textSecondary">
            {note}
          </ThemedText>
        )}
      </ThemedText>
      {children}
      {error && (
        <ThemedText type="smallBold" themeColor="danger" accessibilityRole="alert">
          ✖ {error}
        </ThemedText>
      )}
    </View>
  );
}

// Relleno provisorio para las secciones que todavía no están hechas.
function Placeholder({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.placeholder, { borderColor: theme.border }]}>
      <ThemedText type="small" themeColor="textSecondary">
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
  },
  placeholder: {
    padding: Spacing.three,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
  },
  footer: {
    padding: Spacing.three,
    borderTopWidth: 1,
  },
});