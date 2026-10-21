import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import PhotoSelector from "@/components/reporte/photo-selector";
import { TypeSelector } from "@/components/reporte/type-selector";
import {
  DescriptionField,
  type DescriptionValue,
} from "@/components/reporte/description-field";
import {
  PendingReportModal,
  type PendingReportSummary,
} from "@/components/reporte/pending-report-modal";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/state-views";
import { Spacing } from "@/constants/theme";
import { useReportTypes } from "@/hooks/use-report-types";
import { useTheme } from "@/hooks/use-theme";
import { useUserLocation } from "@/hooks/use-user-location";
import { sendReport } from "@/services/report-sending";
import type { ReportFieldErrors } from "@/services/report-sending/types";
import type { Coordenadas, Foto } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { type ReactNode, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
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
        <ThemedText
          type="smallBold"
          themeColor="danger"
          accessibilityRole="alert"
        >
          ✖ {error}
        </ThemedText>
      )}
    </View>
  );
};

const ReportarScreen = () => {
  const params = useLocalSearchParams<{
    latitud?: string;
    longitud?: string;
    direccion?: string;
    zonaId?: string;
    tipoId?: string;
  }>();

  const theme = useTheme();
  const {
    reportTypes,
    isLoading: reportTypesLoading,
    errorMessage: reportTypesError,
    retry: retryReportTypes,
  } = useReportTypes();
  const {
    requestLocation,
    isLoading: locating,
    errorMessage: locationError,
  } = useUserLocation();

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(
    params.tipoId ?? null,
  );
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [descripcionValue, setDescripcionValue] = useState<DescriptionValue>({
    descripcion: null,
    audioUrl: null,
  });
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(() => {
    if (params.latitud && params.longitud) {
      const lat = parseFloat(params.latitud);
      const lng = parseFloat(params.longitud);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { latitud: lat, longitud: lng };
      }
    }
    return null;
  });
  const [direccion, setDireccion] = useState<string>(params.direccion ?? "");
  const zonaId = params.zonaId ?? "";
  const [fieldErrors, setFieldErrors] = useState<ReportFieldErrors>({});
  const [isSending, setIsSending] = useState(false);
  const [pendingSummary, setPendingSummary] =
    useState<PendingReportSummary | null>(null);

  const resetForm = () => {
    setSelectedTypeId(null);
    setFotos([]);
    setDescripcionValue({ descripcion: null, audioUrl: null });
    setCoordenadas(null);
    setDireccion("");
    setFieldErrors({});
  };

  const handleSendReport = async () => {
    if (isSending) return;

    setIsSending(true);
    setFieldErrors({});

    try {
      const result = await sendReport({
        tipoId: selectedTypeId,
        fotos,
        audioUrl: descripcionValue.audioUrl,
        descripcion: descripcionValue.descripcion,
        coordenadas,
        direccion,
        zonaId,
      });

      switch (result.status) {
        case "invalido": {
          setFieldErrors(result.errors);
          if (result.errors.autorId) {
            Alert.alert("Sesión requerida", result.errors.autorId);
          }
          return;
        }

        case "enviado": {
          Alert.alert(
            "¡Reporte enviado!",
            `Número de seguimiento:\n\n${result.codigo}\n\nTu reporte ha sido confirmado por el municipio.`,
            [{ text: "Aceptar" }],
          );

          resetForm();
          return;
        }

        case "pendiente": {
          const tipoSeleccionado = reportTypes.find(
            (t) => t.id === selectedTypeId,
          );

          setPendingSummary({
            codigo: result.codigo,
            tipoNombre: tipoSeleccionado?.nombre ?? "Reporte",
            direccion:
              result.reporte.reporte.direccion || "Ubicación seleccionada",
            fotoUri: result.reporte.payload.fotos[0]?.url || null,
          });

          resetForm();
          return;
        }

        default: {
          const estadoNoContemplado: never = result;
          throw new Error(
            `Estado de envío no contemplado: ${String(estadoNoContemplado)}`,
          );
        }
      }
    } catch {
      Alert.alert(
        "Error inesperado",
        "No se pudo completar el envío del reporte. Intentá nuevamente.",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <SafeAreaView>
          <Section title="Nuevo Reporte: ¿Qué pasa?" error={fieldErrors.tipoId}>
            {reportTypesLoading ? (
              <LoadingState message="Cargando tipos de problema..." />
            ) : reportTypesError ? (
              <ErrorState
                message={reportTypesError}
                onRetry={retryReportTypes}
              />
            ) : (
              <TypeSelector
                types={reportTypes}
                selectedTypeId={selectedTypeId}
                onSelect={(id) => {
                  setSelectedTypeId(id);
                  if (fieldErrors.tipoId) {
                    setFieldErrors((prev) => ({ ...prev, tipoId: undefined }));
                  }
                }}
              />
            )}
          </Section>

          <Section title="Foto" note="(obligatoria)" error={fieldErrors.fotos}>
            <PhotoSelector
              photos={fotos}
              onChangePhotos={(nextFotos) => {
                setFotos(nextFotos);
                if (fieldErrors.fotos) {
                  setFieldErrors((prev) => ({ ...prev, fotos: undefined }));
                }
              }}
            />
          </Section>

          <Section
            title="¿Dónde?"
            error={fieldErrors.coordenadas ?? locationError}
          >
            {coordenadas ? (
              <View style={[styles.placeholder, { borderColor: theme.border }]}>
                <ThemedText type="smallBold">
                  📍 {direccion || "Ubicación seleccionada"}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Lat: {coordenadas.latitud.toFixed(5)}, Lon:{" "}
                  {coordenadas.longitud.toFixed(5)}
                </ThemedText>
              </View>
            ) : (
              <View style={[styles.placeholder, { borderColor: theme.border }]}>
                <ThemedText type="small" themeColor="textSecondary">
                  Ubicación (V04 / V05)
                </ThemedText>
                <Button
                  title="Detectar ubicación actual"
                  variant="contorno"
                  size="mediano"
                  style={styles.locationButton}
                  loading={locating}
                  disabled={locating}
                  onPress={async () => {
                    const loc = await requestLocation({ fetchAddress: true });
                    if (loc?.coordinates) {
                      setCoordenadas({
                        latitud: loc.coordinates.latitude,
                        longitud: loc.coordinates.longitude,
                      });
                      if (loc.address) setDireccion(loc.address);
                      if (fieldErrors.coordenadas) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          coordenadas: undefined,
                        }));
                      }
                    }
                  }}
                />
              </View>
            )}
          </Section>

          <Section
            title="Contanos"
            note="(opcional)"
            error={fieldErrors.descripcion}
          >
            <DescriptionField
              value={descripcionValue}
              onChange={(next) => {
                setDescripcionValue(next);
                if (fieldErrors.descripcion) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    descripcion: undefined,
                  }));
                }
              }}
            />
          </Section>
        </SafeAreaView>
      </ScrollView>
      <View
        style={[styles.enviar, { backgroundColor: theme.backgroundElement }]}
      >
        <Button
          title={isSending ? "Enviando reporte..." : "Enviar reporte"}
          variant="accion"
          onPress={handleSendReport}
          disabled={isSending}
          loading={isSending}
        />
      </View>
      <PendingReportModal
        key={pendingSummary?.codigo}
        data={pendingSummary}
        onGoToMap={() => {
          setPendingSummary(null);
          router.navigate("/(vecino)");
        }}
        onGoToMyReports={() => {
          setPendingSummary(null);
          router.navigate("/(vecino)/mis-reportes");
        }}
      />
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
  locationButton: {
    marginTop: 8,
  },
  enviar: {
    padding: Spacing.three,
    borderTopWidth: 1,
  },
});

export default ReportarScreen;
