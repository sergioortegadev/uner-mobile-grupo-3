import React, { useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Coordenadas, Reporte, TipoDeReporte } from "@/types";
import { reportService } from "@/services/reports";
import { calculateDistanceInMeters } from "@/utils/geo";
import { coloresOficiales } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Icon } from "@/components/ui/icon";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/state-views";
import { NearbyMiniMap } from "./mini-mapa-cercanos";

export interface NearbyReportItem {
  report: Reporte;
  distanceMeters: number;
  typeName: string;
}

export type ReporteCercanoItem = NearbyReportItem;

export interface CheckNearbyReportsScreenProps {
  coordinates: Coordenadas;
  typeId: Reporte["tipoId"];
  onBack?: () => void;
  onContinueNew?: () => void;
}

export const CheckNearbyReportsScreen = ({
  coordinates,
  typeId,
  onBack,
  onContinueNew,
}: CheckNearbyReportsScreenProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nearbyItems, setNearbyItems] = useState<NearbyReportItem[]>([]);

  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const [reports, types] = await Promise.all([
          reportService.getNearbyReports(coordinates, 50, typeId),
          reportService.getReportTypes(),
        ]);
        console.log("Nearby reports fetched:", reports);

        if (ignore) return;

        const typesMap = new Map<string, TipoDeReporte>();
        types.forEach((item) => typesMap.set(item.id, item));

        const formatTypeName = (id: string): string => {
          const type = typesMap.get(id);
          return type ? type.nombre : "Reporte";
        };

        const mappedItems: NearbyReportItem[] = reports.map((report) => ({
          report,
          distanceMeters: calculateDistanceInMeters(
            coordinates,
            report.coordenadas,
          ),
          typeName: formatTypeName(report.tipoId),
        }));

        setNearbyItems(mappedItems);
      } catch (err: unknown) {
        if (ignore) return;
        const errorText =
          err instanceof Error
            ? err.message
            : "Error al cargar reportes cercanos";
        setErrorMessage(errorText);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, [coordinates, typeId, reloadCount]);

  const handleRetry = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setReloadCount((prev) => prev + 1);
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={coloresOficiales.primario}
      />

      {/* Cabecera azul */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            {onBack ? (
              <Pressable
                onPress={onBack}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Volver atrás"
                hitSlop={8}
              >
                <Icon name="chevron-back" size={24} color="#FFFFFF" />
              </Pressable>
            ) : (
              <View style={styles.backButtonPlaceholder} />
            )}

            <ThemedText style={styles.headerTitle} numberOfLines={1}>
              ¿Es el mismo problema?
            </ThemedText>
          </View>
        </SafeAreaView>
      </View>

      {/* Contenido principal */}
      <View style={styles.content}>
        {isLoading ? (
          <LoadingState message="Buscando reportes en 50 metros..." />
        ) : errorMessage ? (
          <ErrorState message={errorMessage} onRetry={handleRetry} />
        ) : (
          <FlatList
            data={nearbyItems}
            keyExtractor={(item) => item.report.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View>
                <ThemedText style={styles.subtitle}>
                  Ya hay reportes a menos de 50 m de donde estás.
                </ThemedText>

                <NearbyMiniMap
                  userCoordinates={coordinates}
                  reports={nearbyItems.map((it) => ({
                    ...it.report,
                    distanciaMetros: it.distanceMeters,
                  }))}
                />
              </View>
            }
            renderItem={({ item }) => {
              const neighborsCountText =
                item.report.adhesiones === 1
                  ? "1 vecino"
                  : `${item.report.adhesiones} vecinos`;

              return (
                <Card style={styles.reportCard}>
                  <View style={styles.cardInfo}>
                    <ThemedText style={styles.reportTitle}>
                      {item.typeName} · {item.report.direccion}
                    </ThemedText>

                    <ThemedText style={styles.reportSubtitle}>
                      a {item.distanceMeters} m · {neighborsCountText}
                    </ThemedText>

                    <StatusBadge status={item.report.estado} />
                  </View>
                </Card>
              );
            }}
            ListEmptyComponent={
              <EmptyState message="No se encontraron otros reportes cercanos a menos de 50 metros." />
            }
          />
        )}
      </View>

      {/* Botón inferior fijo */}
      <SafeAreaView style={styles.footerSafeArea}>
        <View style={styles.footerContainer}>
          <Button
            title="No es ninguno, seguir"
            variant="contorno"
            size="grande"
            onPress={onContinueNew}
            style={styles.seguirButton}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: coloresOficiales.primario,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 12) : 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonPlaceholder: {
    width: 8,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: "#475569",
    marginBottom: 4,
    lineHeight: 22,
  },
  reportCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  cardInfo: {
    width: "100%",
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 8,
  },
  footerSafeArea: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  seguirButton: {
    width: "100%",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderColor: coloresOficiales.primario,
    borderWidth: 2,
  },
});
