import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import PhotoSelector from "@/components/reporte/photo-selector";
import { Button } from "@/components/ui/button";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Foto } from "@/types";
import { type ReactNode, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { TypeSelector } from "@/components/reporte/type-selector";
import { ErrorState, LoadingState } from "@/components/ui/state-views";
import { useReportTypes } from "@/hooks/use-report-types";
import { SafeAreaView } from "react-native-safe-area-context";

const Section = ({
  title,
  note,
  error,
  children,
}: {
  title: string;
  note?: string;
  error?: string | null;
  children: ReactNode;
}) => {
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
};

// Relleno provisorio para las secciones que todavía no están hechas. Borrar este comment y la funcion Placeholder cuando estén implementados los faltantes
const Placeholder = ({ text }: { text: string }) => {
  const theme = useTheme();
  return (
    <View style={[styles.placeholder, { borderColor: theme.border }]}>
      <ThemedText type="small" themeColor="textSecondary">
        {text}
      </ThemedText>
    </View>
  );
};

const ReportarScreen = () => {
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const theme = useTheme();
  const {
    reportTypes,
    isLoading: reportTypesLoading,
    errorMessage: reportTypesError,
    retry: retryReportTypes,
  } = useReportTypes();

  const [photos, setPhotos] = useState<Foto[]>([]);
  const [triedToSend, setTriedToSend] = useState(false);

  const missingPhoto = photos.length === 0;

  const sendReport = () => {
    setTriedToSend(true);

    if (missingPhoto) {
      Alert.alert("Falta la foto", "Sacá o elegí al menos una foto del problema.");
      return;
    }
    if (!selectedTypeId) {
      Alert.alert("Falta el tipo de problema", "Seleccioná el tipo de problema.");
      return;
    }

    Alert.alert("Reporte listo", `${photos.length} foto(s) cargada(s).`);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <SafeAreaView>
          <Section title="Nuevo Reporte: ¿Qué pasa?">
            {reportTypesLoading ? (
              <LoadingState message="Cargando tipos de problema..." />
            ) : reportTypesError ? (
              <ErrorState message={reportTypesError} onRetry={retryReportTypes} />
            ) : (
              <TypeSelector types={reportTypes} selectedTypeId={selectedTypeId} onSelect={setSelectedTypeId} />
            )}
          </Section>

          <Section
            title="Foto"
            note="(obligatoria)"
            error={triedToSend && missingPhoto ? "La foto es obligatoria." : null}
          >
            <PhotoSelector photos={photos} onChangePhotos={setPhotos} />
          </Section>

          <Section title="¿Dónde?">
            <Placeholder text="Ubicación (V04 / V05)" />
          </Section>

          <Section title="Contanos" note="(opcional)">
            <Placeholder text="Descripción (V06 / V07)" />
          </Section>
        </SafeAreaView>
      </ScrollView>
      <View style={[styles.enviar, { backgroundColor: theme.backgroundElement }]}>
        <Button title="Enviar reporte" variant="accion" onPress={sendReport} />
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
  },
  section: {
    paddingBottom: Spacing.three,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    paddingVertical: Spacing.two,
  },
  placeholder: {
    padding: Spacing.three,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
  },
  enviar: {
    padding: Spacing.three,
    borderTopWidth: 1,
  },
});

export default ReportarScreen;
