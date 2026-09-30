import { Colores } from "@/constants/colores";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

export interface AudioRecorderFieldProps {
  /** Valor controlado desde el form (null = sin audio). */
  uri: string | null;
  /** Emite la URI persistida al detener, o null al eliminar. */
  onChange: (uri: string | null) => void;
  disabled?: boolean;
}

function formatDuration(millis: number): string {
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Campo controlado de grabación de audio. El hook `useVoiceRecorder` es la
 * fuente de verdad de la sesión; la prop `uri` sólo sincroniza resets
 * externos (por ejemplo, cuando el padre descarta el valor).
 */
export function AudioRecorderField({
  uri,
  onChange,
  disabled = false,
}: AudioRecorderFieldProps) {
  const recorder = useVoiceRecorder(uri);
  const handledUriRef = useRef<string | null>(null);
  const recorderRef = useRef(recorder);
  // Reset externo: si el padre puso `uri` en null mientras este componente
  // todavía tiene una grabación en el hook, hay que descartar el archivo.
  // `handledUriRef` evita repetir la operación (y por lo tanto un loop).
  useEffect(() => {
    if (uri !== null) {
      handledUriRef.current = null;
      return;
    }

    const recordingUri = recorder.recordingUri;
    if (recordingUri === null || handledUriRef.current === recordingUri) {
      return;
    }

    handledUriRef.current = recordingUri;
    recorder.deleteRecording().catch(() => {});
  }, [recorder, uri]);

  useEffect(() => {
    recorderRef.current = recorder;
  }, [recorder]);

  // pausar en cambio de tabs por ejemplo
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (recorderRef.current.isRecording) {
          recorderRef.current.pauseRecording();
        }
        if (recorderRef.current.isPlaying) {
          recorderRef.current.pausePlayback();
        }
      };
    }, []),
  );

  const isRecordingActive = recorder.isRecording || recorder.isRecordingPaused;
  const isPermanentlyDenied =
    recorder.permissionGranted === false && !recorder.canAskPermission;
  const isRecordDisabled =
    disabled || recorder.isPreparing || isPermanentlyDenied;

  const totalDuration =
    recorder.playbackDurationMillis || recorder.recordingDurationMillis || 1;
  const progressPercent = Math.min(
    (recorder.playbackPositionMillis / totalDuration) * 100,
    100,
  );

  const handleStop = async () => {
    const nextUri = await recorder.stopRecording();
    onChange(nextUri);
  };

  const handleDelete = async () => {
    await recorder.deleteRecording();
    onChange(null);
  };

  return (
    <View style={styles.container}>
      {isRecordingActive && (
        <View style={styles.recordingRow}>
          <Pressable
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={
              recorder.isRecordingPaused
                ? "Reanudar grabación"
                : "Pausar grabación"
            }
            accessibilityHint={
              recorder.isRecordingPaused
                ? "Continúa la grabación interrumpida"
                : "Interrumpe la grabación temporalmente"
            }
            accessibilityState={{ disabled }}
            onPress={() => {
              if (recorder.isRecordingPaused) {
                recorder.resumeRecording();
              } else {
                recorder.pauseRecording();
              }
            }}
            style={[styles.secondaryBtn, disabled && styles.disabled]}
          >
            <Text maxFontSizeMultiplier={2} style={styles.secondaryBtnText}>
              {recorder.isRecordingPaused ? "▶ Reanudar" : "❚❚ Pausar"}
            </Text>
          </Pressable>

          <Pressable
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`Detener grabación, tiempo ${formatDuration(recorder.recordingDurationMillis)}`}
            accessibilityHint="Detiene y guarda la grabación"
            accessibilityState={{ disabled }}
            onPress={handleStop}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && !disabled && styles.primaryBtnPressed,
              disabled && styles.disabled,
            ]}
          >
            <Text maxFontSizeMultiplier={2} style={styles.primaryBtnText}>
              ■ Detener ({formatDuration(recorder.recordingDurationMillis)})
            </Text>
          </Pressable>
        </View>
      )}

      {!isRecordingActive && recorder.recordingUri && (
        <View style={styles.playerCard}>
          <Pressable
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={
              recorder.isPlaying ? "Pausar audio" : "Reproducir audio"
            }
            accessibilityHint="Alterna la reproducción del audio grabado"
            accessibilityState={{ disabled }}
            onPress={() => {
              if (recorder.isPlaying) {
                recorder.pausePlayback();
              } else {
                recorder.playRecording();
              }
            }}
            style={[styles.playButton, disabled && styles.disabled]}
          >
            <Text maxFontSizeMultiplier={1.5} style={styles.playIcon}>
              {recorder.isPlaying ? "❚❚" : "▶"}
            </Text>
          </Pressable>

          <View style={styles.trackContainer}>
            <View style={styles.trackBackground}>
              <View
                style={[styles.trackFill, { width: `${progressPercent}%` }]}
              />
            </View>
            <Text maxFontSizeMultiplier={1.5} style={styles.timeText}>
              {recorder.isPlaying
                ? formatDuration(recorder.playbackPositionMillis)
                : formatDuration(totalDuration)}
            </Text>
          </View>

          <Pressable
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel="Eliminar grabación"
            accessibilityHint="Descarta el archivo grabado"
            accessibilityState={{ disabled }}
            onPress={handleDelete}
            style={[styles.deleteButton, disabled && styles.disabled]}
          >
            <Text maxFontSizeMultiplier={1.5} style={styles.deleteText}>
              ✕
            </Text>
          </Pressable>
        </View>
      )}

      {!isRecordingActive && !recorder.recordingUri && (
        <Pressable
          disabled={isRecordDisabled}
          accessibilityRole="button"
          accessibilityLabel="Grabar audio"
          accessibilityHint="Inicia la grabación con el micrófono"
          accessibilityState={{ disabled: isRecordDisabled }}
          onPress={() => {
            recorder.startRecording();
          }}
          style={({ pressed }) => [
            styles.recordButton,
            pressed && !isRecordDisabled && styles.primaryBtnPressed,
            isRecordDisabled && styles.disabled,
          ]}
        >
          <Ionicons name="mic" size={26} color="#FFFFFF" />
        </Pressable>
      )}

      {recorder.error && (
        <Text
          maxFontSizeMultiplier={2}
          style={styles.errorText}
          accessibilityRole="alert"
        >
          {recorder.error}
        </Text>
      )}

      {isPermanentlyDenied && (
        <Pressable
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="Abrir ajustes para permitir micrófono"
          accessibilityHint="Abre la configuración del celular para otorgar permisos"
          accessibilityState={{ disabled }}
          onPress={() => {
            Linking.openSettings();
          }}
          style={[styles.settingsBtn, disabled && styles.disabled]}
        >
          <Text maxFontSizeMultiplier={2} style={styles.settingsBtnText}>
            ⚙ Abrir ajustes para permitir micrófono
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  recordingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  primaryBtn: {
    backgroundColor: Colores.primario,
    minHeight: 44,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnPressed: {
    backgroundColor: Colores.primarioPresionado,
  },
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colores.primario,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryBtn: {
    backgroundColor: Colores.superficie,
    borderWidth: 1,
    borderColor: Colores.primario,
    minHeight: 44,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: Colores.primario,
    fontSize: 17,
    fontWeight: "600",
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colores.superficie,
    borderWidth: 1,
    borderColor: Colores.borde,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    gap: 12,
    maxWidth: 320,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colores.primario,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    marginLeft: 2,
  },
  trackContainer: {
    flex: 1,
    justifyContent: "center",
  },
  trackBackground: {
    height: 4,
    backgroundColor: Colores.rioSuave,
    borderRadius: 2,
    overflow: "hidden",
  },
  trackFill: {
    height: 4,
    backgroundColor: Colores.primario,
    borderRadius: 2,
  },
  timeText: {
    fontSize: 14,
    color: Colores.textoSuave,
    fontVariant: ["tabular-nums"],
    marginTop: 4,
  },
  deleteButton: {
    minWidth: 44,
    minHeight: 44,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: {
    color: Colores.textoSuave,
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    color: Colores.rechazado,
    fontSize: 15,
    fontWeight: "500",
  },
  settingsBtn: {
    minHeight: 44,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: Colores.niebla,
    borderWidth: 1,
    borderColor: Colores.borde,
    borderRadius: 8,
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsBtnText: {
    color: Colores.tinta,
    fontSize: 16,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.6,
  },
});
