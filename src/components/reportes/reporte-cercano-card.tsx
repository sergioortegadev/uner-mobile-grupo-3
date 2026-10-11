import React from "react";
import { StyleSheet, View } from "react-native";
import type { Reporte } from "@/types";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

export interface NearbyReportItem {
  report: Reporte;
  distanceMeters: number;
  typeName: string;
}

export interface NearbyReportCardProps {
  item: NearbyReportItem;
  selected: boolean;
  disabled: boolean;
  adhering: boolean;
  onAdhere: (item: NearbyReportItem) => void;
}

export const NearbyReportCard = React.memo(
  ({ item, selected, disabled, adhering, onAdhere }: NearbyReportCardProps) => {
    const adhesionsCount = item.report.adhesiones ?? 0;
    const neighborsCountText =
      adhesionsCount === 1
        ? "1 vecino"
        : `${adhesionsCount} vecinos`;

    const handlePress = React.useCallback(() => {
      onAdhere(item);
    }, [onAdhere, item]);

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

        <View style={styles.cardAction}>
          <Button
            title={selected ? "Sumado" : "Sumarme"}
            variant={selected ? "secundario" : "primario"}
            size="mediano"
            loading={adhering}
            disabled={disabled || adhering}
            onPress={handlePress}
            style={styles.sumarmeButton}
          />
        </View>
      </Card>
    );
  },
);

NearbyReportCard.displayName = "NearbyReportCard";

const styles = StyleSheet.create({
  reportCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    flex: 1,
    paddingRight: 12,
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
  cardAction: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  sumarmeButton: {
    minWidth: 104,
    height: 42,
    borderRadius: 10,
    paddingHorizontal: 16,
  },
});
