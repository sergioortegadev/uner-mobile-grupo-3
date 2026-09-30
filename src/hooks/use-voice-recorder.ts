import { useAudioPermissions } from "@/hooks/use-audio-permissions";
import { deleteAudioFile, persistAudioFile } from "@/utils/audio-storage";
import {
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useEffect, useRef, useState } from "react";

/**
 * Duración mínima para aceptar una grabación. Descarta toques accidentales
 * (apretar y soltar) que producen archivos vacíos o casi vacíos como prueba
 * de un reclamo. El texto del error se deriva de este valor para que nunca
 * quede desincronizado de la validación.
 */
export const MIN_RECORDING_DURATION_MILLIS = 1000;

const MIN_RECORDING_SECONDS = Math.round(MIN_RECORDING_DURATION_MILLIS / 1000);

export const VOICE_RECORDER_ERRORS = {
  PERMISSION_CHECK_FAILED: "Error al verificar permisos del micrófono.",
  PERMISSION_REQUEST_FAILED: "Error al solicitar permisos para el micrófono.",
  PERMISSION_DENIED: "Permisos del micrófono no otorgados.",
  START_RECORDING_FAILED: "Error al comenzar la grabación.",
  PAUSE_RECORDING_FAILED: "Error al pausar la grabación.",
  RESUME_RECORDING_FAILED: "Error al reanudar la grabación.",
  STOP_RECORDING_FAILED: "Error al detener y guardar la grabación.",
  RECORDING_TOO_SHORT: `La grabación es muy corta (mínimo ${MIN_RECORDING_SECONDS} segundo${
    MIN_RECORDING_SECONDS === 1 ? "" : "s"
  }).`,
  NO_RECORDING_TO_PLAY: "No hay ninguna grabación disponible para reproducir.",
  PLAY_FAILED: "Error al reproducir el audio.",
  PAUSE_PLAYBACK_FAILED: "Error al pausar la reproducción.",
  STOP_PLAYBACK_FAILED: "Error al detener la reproducción.",
  DELETE_FAILED: "Ocurrió un error al eliminar la grabación.",
} as const;

export type VoiceRecorderErrorCode = keyof typeof VOICE_RECORDER_ERRORS;

export interface VoiceRecorderState {
  permissionGranted: boolean | null;
  canAskPermission: boolean;
  isRecording: boolean;
  isRecordingPaused: boolean;
  recordingDurationMillis: number;
  recordingUri: string | null;
  isPlaying: boolean;
  playbackPositionMillis: number;
  playbackDurationMillis: number;
  isPreparing: boolean;
  error: string | null;
}

export interface UseVoiceRecorderReturn extends VoiceRecorderState {
  requestPermission: () => Promise<boolean>;
  checkPermissions: () => Promise<boolean>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => void;
  playRecording: () => Promise<void>;
  pausePlayback: () => void;
  stopPlayback: () => void;
  deleteRecording: () => Promise<void>;
  clearError: () => void;
}

const DEFAULT_PLAYER_OPTIONS = {
  updateInterval: 200,
} as const;

const RECORDING_AUDIO_MODE = {
  playsInSilentMode: true,
  allowsRecording: true,
} as const;

const PLAYBACK_AUDIO_MODE = {
  playsInSilentMode: true,
  allowsRecording: false,
} as const;

export function useVoiceRecorder(
  initialUri?: string | null,
): UseVoiceRecorderReturn {
  const {
    permissionGranted,
    canAskPermission,
    permissionError,
    requestPermission,
    checkPermissions,
  } = useAudioPermissions(
    VOICE_RECORDER_ERRORS.PERMISSION_CHECK_FAILED,
    VOICE_RECORDER_ERRORS.PERMISSION_REQUEST_FAILED,
  );

  const [recordingUri, setRecordingUri] = useState<string | null>(
    initialUri ?? null,
  );
  const [recordedDurationMillis, setRecordedDurationMillis] =
    useState<number>(0);
  const [isPreparing, setIsPreparing] = useState<boolean>(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);

  const player = useAudioPlayer(
    recordingUri ? { uri: recordingUri } : null,
    DEFAULT_PLAYER_OPTIONS,
  );
  const playerStatus = useAudioPlayerStatus(player);

  const isRecordingRef = useRef(false);
  const isRecordingPausedRef = useRef(false);
  const recordingUriRef = useRef<string | null>(null);
  const isBusyRef = useRef(false);

  useEffect(() => {
    isRecordingRef.current = recorderState.isRecording;
    isRecordingPausedRef.current = isRecordingPaused;
    recordingUriRef.current = recordingUri;
  }, [isRecordingPaused, recorderState.isRecording, recordingUri]);

  useEffect(() => {
    return () => {
      if (isRecordingRef.current || isRecordingPausedRef.current) {
        recorder
          .stop()
          .then(() => {
            if (recorder.uri) {
              deleteAudioFile(recorder.uri).catch(() => {});
            }
          })
          .catch(() => {});

        setAudioModeAsync(PLAYBACK_AUDIO_MODE).catch(() => {});
      }

      try {
        player.pause();
      } catch {}
    };
  }, [player, recorder]);

  const startRecording = async () => {
    if (isBusyRef.current || isRecordingRef.current) {
      return;
    }

    isBusyRef.current = true;
    try {
      setError(null);
      setIsPreparing(true);

      const hasPermission = permissionGranted || (await requestPermission());
      if (!hasPermission) {
        setError(VOICE_RECORDER_ERRORS.PERMISSION_DENIED);
        return;
      }

      if (playerStatus.playing) {
        player.pause();
      }

      // Si existía un audio grabado previo, limpiarlo antes de comenzar la nueva grabación
      if (recordingUriRef.current) {
        try {
          await deleteAudioFile(recordingUriRef.current);
        } catch {}
      }

      setRecordingUri(null);
      setRecordedDurationMillis(0);

      await setAudioModeAsync(RECORDING_AUDIO_MODE);
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecordingPaused(false);
    } catch (err) {
      console.error("useVoiceRecorder.startRecording error:", err);
      await setAudioModeAsync(PLAYBACK_AUDIO_MODE).catch(() => {});
      setError(VOICE_RECORDER_ERRORS.START_RECORDING_FAILED);
    } finally {
      setIsPreparing(false);
      isBusyRef.current = false;
    }
  };

  const pauseRecording = async () => {
    try {
      if (recorderState.isRecording) {
        recorder.pause();
        setIsRecordingPaused(true);
      }
    } catch (err) {
      console.error("useVoiceRecorder.pauseRecording error:", err);
      setError(VOICE_RECORDER_ERRORS.PAUSE_RECORDING_FAILED);
    }
  };

  const resumeRecording = () => {
    try {
      if (isRecordingPaused) {
        recorder.record();
        setIsRecordingPaused(false);
      }
    } catch (err) {
      console.error("useVoiceRecorder.resumeRecording error:", err);
      setError(VOICE_RECORDER_ERRORS.RESUME_RECORDING_FAILED);
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    if (
      isBusyRef.current ||
      (!isRecordingRef.current && !isRecordingPausedRef.current)
    ) {
      return null;
    }

    isBusyRef.current = true;
    try {
      setError(null);
      setIsPreparing(true);
      setIsRecordingPaused(false);

      const directDuration =
        recorder.getStatus().durationMillis ||
        Math.round((recorder.currentTime || 0) * 1000);

      await recorder.stop();
      const tempUri = recorder.uri;
      const duration = Math.max(
        directDuration,
        recorder.getStatus().durationMillis,
      );

      await setAudioModeAsync(PLAYBACK_AUDIO_MODE);

      if (duration < MIN_RECORDING_DURATION_MILLIS) {
        if (tempUri) {
          try {
            await deleteAudioFile(tempUri);
          } catch {
            // Silenciosamente ignorar fallo al borrar archivo temporal
          }
        }
        setRecordingUri(null);
        setRecordedDurationMillis(0);
        setError(VOICE_RECORDER_ERRORS.RECORDING_TOO_SHORT);
        return null;
      }

      let finalUri: string | null = null;
      if (tempUri) {
        finalUri = await persistAudioFile(tempUri);
        setRecordingUri(finalUri);
        setRecordedDurationMillis(duration);
      }

      return finalUri;
    } catch (err) {
      console.error("useVoiceRecorder.stopRecording error:", err);
      await setAudioModeAsync(PLAYBACK_AUDIO_MODE).catch(() => {});
      setError(VOICE_RECORDER_ERRORS.STOP_RECORDING_FAILED);
      return null;
    } finally {
      setIsPreparing(false);
      isBusyRef.current = false;
    }
  };

  const playRecording = async () => {
    if (!recordingUri) {
      setError(VOICE_RECORDER_ERRORS.NO_RECORDING_TO_PLAY);
      return;
    }

    try {
      setError(null);
      await setAudioModeAsync(PLAYBACK_AUDIO_MODE);

      const isNearEnd =
        playerStatus.duration > 0 &&
        Math.abs(playerStatus.currentTime - playerStatus.duration) < 0.2;

      if (playerStatus.didJustFinish || isNearEnd) {
        await player.seekTo(0);
      }

      player.play();
    } catch (err) {
      console.error("useVoiceRecorder.playRecording error:", err);
      setError(VOICE_RECORDER_ERRORS.PLAY_FAILED);
    }
  };

  const pausePlayback = () => {
    try {
      player.pause();
    } catch (err) {
      console.error("useVoiceRecorder.pausePlayback error:", err);
      setError(VOICE_RECORDER_ERRORS.PAUSE_PLAYBACK_FAILED);
    }
  };

  const stopPlayback = () => {
    try {
      player.pause();
      player.seekTo(0).catch(() => {});
    } catch (err) {
      console.error("useVoiceRecorder.stopPlayback error:", err);
      setError(VOICE_RECORDER_ERRORS.STOP_PLAYBACK_FAILED);
    }
  };

  const deleteRecording = async () => {
    if (isBusyRef.current) {
      return;
    }

    isBusyRef.current = true;
    try {
      setError(null);
      if (playerStatus.playing) {
        player.pause();
      }

      if (recordingUri) {
        await deleteAudioFile(recordingUri);
      }

      setIsRecordingPaused(false);
      setRecordingUri(null);
      setRecordedDurationMillis(0);
    } catch (err) {
      console.error("useVoiceRecorder.deleteRecording error:", err);
      setError(VOICE_RECORDER_ERRORS.DELETE_FAILED);
    } finally {
      isBusyRef.current = false;
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    // Permisos
    permissionGranted,
    canAskPermission,

    // Grabación
    isRecording: recorderState.isRecording,
    isRecordingPaused,
    recordingDurationMillis: recordingUri
      ? recordedDurationMillis
      : recorderState.durationMillis,
    recordingUri,

    // Reproducción
    isPlaying: playerStatus.playing,
    playbackPositionMillis: Math.round((playerStatus.currentTime || 0) * 1000),
    playbackDurationMillis: Math.round((playerStatus.duration || 0) * 1000),

    // Estado / Error
    isPreparing,
    error: error || permissionError,

    // Acciones
    requestPermission,
    checkPermissions,
    startRecording,
    pauseRecording,
    stopRecording,
    playRecording,
    pausePlayback,
    stopPlayback,
    deleteRecording,
    resumeRecording,
    clearError,
  };
}
