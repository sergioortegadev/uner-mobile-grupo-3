import { StyleSheet, View } from "react-native";
import { Coordenadas, EstadoReporte, Reporte } from "@/types";
import { coloresOficiales } from "@/constants/theme";

export interface NearbyMiniMapProps {
  userCoordinates: Coordenadas;
  reports: (Reporte & { distanciaMetros?: number })[];
}

const COLOR_BY_STATUS: Record<EstadoReporte, string> = {
  recibido: coloresOficiales.recibido,
  en_revision: coloresOficiales.enRevision,
  asignado: coloresOficiales.asignado,
  resuelto: coloresOficiales.resuelto,
  rechazado: coloresOficiales.rechazado,
};

export const NearbyMiniMap = ({
  userCoordinates,
  reports,
}: NearbyMiniMapProps) => {
  // Calculamos posiciones relativas normalizadas para cada reporte en un rango de +/- 65 metros
  const METERS_RANGE = 65;
  const METERS_PER_DEGREE_LAT = 110900;
  const METERS_PER_DEGREE_LON =
    111320 * Math.cos((userCoordinates.latitud * Math.PI) / 180);

  return (
    <View style={styles.container} accessibilityLabel="Vista previa de mapa con reportes cercanos">
      {/* Cuadrícula urbana estilizada de calles */}
      <View style={[styles.horizontalStreet, { top: "30%" }]} />
      <View style={[styles.horizontalStreet, { top: "68%" }]} />
      <View style={[styles.verticalStreet, { left: "45%" }]} />
      <View style={[styles.verticalStreet, { left: "72%" }]} />

      {/* Marcadores de reportes cercanos */}
      {reports.map((report, index) => {
        const deltaLatMeters =
          (report.coordenadas.latitud - userCoordinates.latitud) * METERS_PER_DEGREE_LAT;
        const deltaLonMeters =
          (report.coordenadas.longitud - userCoordinates.longitud) * METERS_PER_DEGREE_LON;

        // Normalizar posición relativa centrada en 50%
        // Y se invierte porque latitud positiva va hacia el norte
        let percentX = 50 + (deltaLonMeters / METERS_RANGE) * 38;
        let percentY = 50 - (deltaLatMeters / METERS_RANGE) * 38;

        // Limitar dentro del contenedor para asegurar visibilidad
        percentX = Math.max(14, Math.min(86, percentX));
        percentY = Math.max(16, Math.min(84, percentY));

        const color = COLOR_BY_STATUS[report.estado] || coloresOficiales.primario;
        const isAssigned = report.estado === "asignado";

        return (
          <View
            key={report.id || `marker-${index}`}
            style={[
              styles.markerWrapper,
              {
                left: `${percentX}%`,
                top: `${percentY}%`,
              },
            ]}
          >
            {isAssigned ? (
              <View style={[styles.diamondMarker, { backgroundColor: color }]}>
                <View style={styles.innerDot} />
              </View>
            ) : (
              <View style={[styles.circleMarker, { backgroundColor: color }]}>
                <View style={styles.innerDot} />
              </View>
            )}
          </View>
        );
      })}

      {/* Marcador de la posición actual del usuario */}
      <View style={styles.userMarkerContainer}>
        <View style={styles.userHalo} />
        <View style={styles.userDot} />
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    height: 154,
    borderRadius: 16,
    backgroundColor: "#DFECE5",
    borderWidth: 1,
    borderColor: "#D3DCE0",
    overflow: "hidden",
    position: "relative",
    marginVertical: 14,
  },
  horizontalStreet: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: "#FFFFFF",
  },
  verticalStreet: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 18,
    backgroundColor: "#FFFFFF",
  },
  userMarkerContainer: {
    position: "absolute",
    left: "48%",
    top: "48%",
    transform: [{ translateX: -17 }, { translateY: -17 }],
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  userHalo: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(35, 115, 244, 0.28)",
  },
  userDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: coloresOficiales.primario,
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
  },
  markerWrapper: {
    position: "absolute",
    transform: [{ translateX: -12 }, { translateY: -12 }],
    zIndex: 5,
  },
  diamondMarker: {
    width: 22,
    height: 22,
    borderRadius: 4,
    transform: [{ rotate: "45deg" }],
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  circleMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  innerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#FFFFFF",
  },
});
