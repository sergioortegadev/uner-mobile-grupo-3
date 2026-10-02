import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { coloresOficiales as Colores } from "@/constants/theme";
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
  // `handledUriRef` evita repetir la operación
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
          <Button
            disabled={disabled}
            size="mediano"
            variant="contorno"
            title={recorder.isRecordingPaused ? "▶ Reanudar" : "❚❚ Pausar"}
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
            onPress={() => {
              if (recorder.isRecordingPaused) {
                recorder.resumeRecording();
              } else {
                recorder.pauseRecording();
              }
            }}
          />

          <Button
            disabled={disabled}
            size="mediano"
            variant="primario"
            title={`■ Detener (${formatDuration(recorder.recordingDurationMillis)})`}
            accessibilityLabel={`Detener grabación, tiempo ${formatDuration(recorder.recordingDurationMillis)}`}
            accessibilityHint="Detiene y guarda la grabación"
            onPress={handleStop}
          />
        </View>
      )}

      {!isRecordingActive && recorder.recordingUri && (
        <Card style={styles.playerCard}>
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
            <Ionicons
              name={recorder.isPlaying ? "pause" : "play"}
              size={22}
              color="#FFFFFF"
              style={!recorder.isPlaying ? styles.playIconOffset : undefined}
            />
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
            <Ionicons name="trash-outline" size={22} color={Colores.textoSuave} />
          </Pressable>
        </Card>
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
            pressed && !isRecordDisabled && styles.recordButtonPressed,
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
        <Button
          disabled={disabled}
          size="mediano"
          variant="contorno"
          title="⚙ Abrir ajustes para permitir micrófono"
          accessibilityLabel="Abrir ajustes para permitir micrófono"
          accessibilityHint="Abre la configuración del celular para otorgar permisos"
          onPress={() => {
            Linking.openSettings();
          }}
        />
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
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colores.primario,
    alignItems: "center",
    justifyContent: "center",
  },
  recordButtonPressed: {
    backgroundColor: Colores.primarioPresionado,
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    gap: 12,
    maxWidth: 320,
    marginBottom: 0,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colores.primario,
    alignItems: "center",
    justifyContent: "center",
  },
  playIconOffset: {
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
  errorText: {
    color: Colores.rechazado,
    fontSize: 15,
    fontWeight: "500",
  },
  disabled: {
    opacity: 0.6,
  },
});
