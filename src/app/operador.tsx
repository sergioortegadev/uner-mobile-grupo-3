import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, TextInput, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { reportService } from "@/services/reports";
import { CambioDeEstado, Cuadrilla, EstadoReporte, Reporte } from "@/types";
import { coloresOficiales, Spacing } from "@/constants/theme";

const estados: { label: string; value: EstadoReporte }[] = [
  { label: "Recibido", value: "recibido" },
  { label: "En revisión", value: "en_revision" },
  { label: "Asignado", value: "asignado" },
  { label: "Resuelto", value: "resuelto" },
  { label: "Rechazado", value: "rechazado" },
];

export default function OperadorScreen() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cuadrillas, setCuadrillas] = useState<Cuadrilla[]>([]);
  const [reporteId, setReporteId] = useState("");
  const [comentario, setComentario] = useState("");
  const [estado, setEstado] = useState<EstadoReporte>("en_revision");
  const [cuadrillaId, setCuadrillaId] = useState("");
  const [duplicadoId, setDuplicadoId] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [historial, setHistorial] = useState<CambioDeEstado[]>([]);
  const [cargando, setCargando] = useState(false);

  async function cargarDatos() {
    try {
      const [lista, equipos] = await Promise.all([reportService.getReports(), reportService.getCrews()]);
      setReportes(lista);
      setCuadrillas(equipos);
      if (!reporteId && lista.length) setReporteId(lista[0].id);
    } catch {
      Alert.alert("Error", "No se pudieron cargar los reportes.");
    }
  }

  useEffect(() => { void cargarDatos(); }, []);
  useEffect(() => {
    if (!reporteId) return;
    reportService.getStatusHistory(reporteId).then(setHistorial).catch(() => setHistorial([]));
  }, [reporteId]);

  const reporteActual = reportes.find((item) => item.id === reporteId);

  async function ejecutar(accion: () => Promise<Reporte>, mensaje: string) {
    if (!reporteId) {
      Alert.alert("Atención", "Seleccioná un reporte.");
      return;
    }
    setCargando(true);
    try {
      await accion();
      Alert.alert("Listo", mensaje);
      setComentario("");
      setFotoUrl("");
      await cargarDatos();
      setHistorial(await reportService.getStatusHistory(reporteId));
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo completar la acción.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="title">Gestión de reportes</ThemedText>
          <ThemedText themeColor="textSecondary">Seleccioná un reporte para gestionar su estado y seguimiento.</ThemedText>

          <View style={styles.card}>
            <ThemedText type="subtitle">Reporte</ThemedText>
            {reportes.map((item) => (
              <Pressable key={item.id} onPress={() => setReporteId(item.id)} style={[styles.reportOption, reporteId === item.id && styles.selected]}>
                <ThemedText style={{ fontWeight: reporteId === item.id ? "700" : "400" }}>{item.codigo} · {item.direccion}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{item.estado.replace("_", " ")}</ThemedText>
              </Pressable>
            ))}
          </View>

          <View style={styles.card}>
            <ThemedText type="subtitle">OP06 - Agregar comentario al cambio de estado</ThemedText>
            <ThemedText themeColor="textSecondary">Estado nuevo</ThemedText>
            <View style={styles.options}>
              {estados.map((item) => <Pressable key={item.value} onPress={() => setEstado(item.value)} style={[styles.chip, estado === item.value && styles.chipSelected]}><ThemedText>{item.label}</ThemedText></Pressable>)}
            </View>
            <TextInput value={comentario} onChangeText={setComentario} placeholder="Escribí un comentario..." placeholderTextColor="#888" multiline style={styles.input} />
            <Pressable disabled={cargando} style={styles.button} onPress={() => ejecutar(() => reportService.updateReportStatus(reporteId, estado, comentario.trim() || null, "usr-02"), "Se actualizó el estado del reporte.")}><ThemedText style={styles.buttonText}>Guardar cambio</ThemedText></Pressable>
            {historial.map((item) => <View key={item.id} style={styles.historyItem}><ThemedText>{item.estado.replace("_", " ")} · {item.comentario || "Sin comentario"}</ThemedText><ThemedText type="small" themeColor="textSecondary">{new Date(item.fechaHora).toLocaleString("es-AR")}</ThemedText></View>)}
          </View>

          <View style={styles.card}>
            <ThemedText type="subtitle">OP07 - Asignar cuadrilla</ThemedText>
            <ThemedText themeColor="textSecondary">Elegí la cuadrilla responsable.</ThemedText>
            {cuadrillas.map((item) => <Pressable key={item.id} onPress={() => setCuadrillaId(item.id)} style={[styles.reportOption, cuadrillaId === item.id && styles.selected]}><ThemedText style={{ fontWeight: cuadrillaId === item.id ? "700" : "400" }}>{item.nombre}</ThemedText><ThemedText type="small" themeColor="textSecondary">{item.especialidad}</ThemedText></Pressable>)}
            <Pressable disabled={cargando || !cuadrillaId} style={[styles.button, !cuadrillaId && styles.disabled]} onPress={() => ejecutar(() => reportService.assignCrew(reporteId, cuadrillaId), "Se asignó la cuadrilla al reporte.")}><ThemedText style={styles.buttonText}>Asignar cuadrilla</ThemedText></Pressable>
          </View>

          <View style={styles.card}>
            <ThemedText type="subtitle">OP08 - Marcar reporte como duplicado</ThemedText>
            <ThemedText themeColor="textSecondary">Indicá el código o ID del reporte original.</ThemedText>
            <TextInput value={duplicadoId} onChangeText={setDuplicadoId} placeholder="Código o ID del reporte original" placeholderTextColor="#888" style={styles.input} autoCapitalize="characters" />
            <Pressable disabled={cargando || !duplicadoId.trim() || duplicadoId.trim() === reporteId} style={[styles.button, (!duplicadoId.trim() || duplicadoId.trim() === reporteId) && styles.disabled]} onPress={() => {
              const original = reportes.find((item) => item.id === duplicadoId.trim() || item.codigo.toLowerCase() === duplicadoId.trim().toLowerCase());
              if (!original) { Alert.alert("Reporte no encontrado", "Revisá el código o ID del reporte original."); return; }
              void ejecutar(() => reportService.markAsDuplicate(reporteId, original.id), "El reporte quedó marcado como duplicado.");
            }}><ThemedText style={styles.buttonText}>Marcar duplicado</ThemedText></Pressable>
            {reporteActual?.duplicadoDe ? <ThemedText>Duplicado de: {reporteActual.duplicadoDe}</ThemedText> : null}
          </View>

          <View style={styles.card}>
            <ThemedText type="subtitle">OP09 - Cargar fotografía de reparación</ThemedText>
            <ThemedText themeColor="textSecondary">Pegá la URL de la fotografía que documenta el arreglo.</ThemedText>
            <TextInput value={fotoUrl} onChangeText={setFotoUrl} placeholder="https://..." placeholderTextColor="#888" style={styles.input} autoCapitalize="none" keyboardType="url" />
            <Pressable disabled={cargando || !fotoUrl.trim()} style={[styles.button, !fotoUrl.trim() && styles.disabled]} onPress={() => ejecutar(() => reportService.updateReportStatus(reporteId, "resuelto", comentario.trim() || "Se adjunta fotografía de reparación.", "usr-02", fotoUrl.trim()), "Se cargó la fotografía y el reporte quedó resuelto.")}><ThemedText style={styles.buttonText}>Cargar fotografía</ThemedText></Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.three, paddingBottom: 40 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#D5D8DC", gap: 12 },
  reportOption: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#D5D8DC", gap: 4 },
  selected: { borderColor: coloresOficiales.primario, backgroundColor: "#EAF4F8" },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#D5D8DC" },
  chipSelected: { backgroundColor: "#EAF4F8", borderColor: coloresOficiales.primario },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#D5D8DC", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: "#222", fontSize: 15 },
  button: { backgroundColor: coloresOficiales.primario, borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#FFFFFF", fontWeight: "700" },
  disabled: { opacity: 0.45 },
  historyItem: { borderTopWidth: 1, borderTopColor: "#D5D8DC", paddingTop: 8, gap: 3 },
});
