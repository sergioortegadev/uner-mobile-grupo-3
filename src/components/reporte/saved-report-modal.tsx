import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { coloresOficiales, Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Image } from "expo-image";
import { Modal, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface PendingConfirmation {
  codigo: string;
  tipoNombre: string;
  direccion: string;
  fotoUri?: string | null;
}

export interface SavedReportModalProps {
  visible: boolean;
  data: PendingConfirmation | null;
  onGoToMap: () => void;
  onGoToMyReports: () => void;
  onClose: () => void;
}

export const SavedReportModal = ({
  visible,
  data,
  onGoToMap,
  onGoToMyReports,
  onClose,
}: SavedReportModalProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (!data) return null;

  const headerLocation = [data.tipoNombre, data.direccion].filter(Boolean).join(" · ");

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <View
          style={[
            styles.headerBar,
            {
              backgroundColor: coloresOficiales.primario,
              paddingTop: Math.max(insets.top, 16) + 4,
            },
          ]}
        >
          <ThemedText style={styles.headerTitle}>Reporte guardado</ThemedText>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: Math.max(insets.bottom, 16) + Spacing.two,
            },
          ]}
          bounces={false}
        >
          <View style={styles.topSection}>
            <View style={[styles.banner, { backgroundColor: "#FEF3C7", borderColor: coloresOficiales.accion }]}>
              <ThemedText style={[styles.bannerText, { color: coloresOficiales.tinta }]}>
                Sin señal · guardado en tu teléfono
              </ThemedText>
            </View>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              {data.fotoUri ? (
                <Image
                  source={{ uri: data.fotoUri }}
                  style={styles.thumbnail}
                  contentFit="cover"
                  transition={200}
                  accessibilityLabel="Foto del reporte guardado"
                />
              ) : (
                <View style={[styles.thumbnailPlaceholder, { backgroundColor: theme.background }]}>
                  <Icon name="image-outline" size={36} color={theme.textSecondary} />
                  <ThemedText type="small" themeColor="textSecondary">
                    Sin foto adjunta
                  </ThemedText>
                </View>
              )}

              <ThemedText style={styles.cardTitle}>{headerLocation || "Reporte"}</ThemedText>

              <View style={[styles.chip, { borderColor: theme.border }]}>
                <ThemedText style={styles.chipText}>• Pendiente de envío</ThemedText>
              </View>
            </View>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              <ThemedText style={styles.sectionHeader}>Todavía no se envió</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.bodyText}>
                Lo subimos solo cuando vuelva la señal. No hace falta que hagas nada.
              </ThemedText>
            </View>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.codeSection}>
                <ThemedText type="small" themeColor="textSecondary">
                  Código provisorio
                </ThemedText>
                <ThemedText style={[styles.codeValue, { fontFamily: Fonts?.mono ?? "monospace" }]}>
                  {data.codigo}
                </ThemedText>
              </View>

              <View style={styles.divider} />

              <View style={styles.codeSection}>
                <ThemedText type="small" themeColor="textSecondary">
                  Número de seguimiento
                </ThemedText>
                <ThemedText style={styles.subtextValue}>Se asigna al enviarse</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="Volver al mapa"
              variant="accion"
              size="grande"
              onPress={onGoToMap}
            />
            <Button
              title="Ver mis reportes"
              variant="contorno"
              size="grande"
              onPress={onGoToMyReports}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    padding: Spacing.three,
  },
  topSection: {
    gap: 12,
  },
  banner: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "flex-start",
  },
  bannerText: {
    fontSize: 14,
    fontWeight: "700",
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  thumbnail: {
    width: "100%",
    height: 140,
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  chip: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
  },
  bodyText: {
    lineHeight: 20,
  },
  codeSection: {
    gap: 2,
  },
  codeValue: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  subtextValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  divider: {
    height: 6,
  },
  actions: {
    gap: 12,
    marginTop: 20,
  },
});
