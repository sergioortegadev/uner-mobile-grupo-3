import { AudioModule } from "expo-audio";
import { useCallback, useEffect, useState } from "react";
import {
  AppState,
  type AppStateStatus,
  PermissionsAndroid,
  Platform,
} from "react-native";

export interface AudioPermissionsState {
  permissionGranted: boolean | null;
  canAskPermission: boolean;
  permissionError: string | null;
}

export interface UseAudioPermissionsReturn extends AudioPermissionsState {
  requestPermission: () => Promise<boolean>;
  checkPermissions: () => Promise<boolean>;
}

async function queryPermissions(errorMessageCheck: string): Promise<{
  granted: boolean;
  canAskAgain: boolean;
  error: string | null;
}> {
  try {
    const response = await AudioModule.getRecordingPermissionsAsync();
    let granted = response.granted;
    let canAskAgain = response.canAskAgain;

    // En Android  el PermissionsService interno
    // puede quedar desincronizado con los permisos reales del sistema operativo.
    // Usamos PermissionsAndroid directo del sistema para corroborar.
    if (Platform.OS === "android" && !granted) {
      try {
        const hasNative = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        );
        if (hasNative) {
          granted = true;
          canAskAgain = true;
        }
      } catch (err) {
        console.error("PermissionsAndroid.check error:", err);
      }
    }

    return { granted, canAskAgain, error: null };
  } catch (err) {
    console.error("useAudioPermissions.queryPermissions error:", err);
    return { granted: false, canAskAgain: true, error: errorMessageCheck };
  }
}

export function useAudioPermissions(
  errorMessageCheck = "Error al verificar permisos del micrófono.",
  errorMessageRequest = "Error al solicitar permisos para el micrófono.",
): UseAudioPermissionsReturn {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null,
  );
  const [canAskPermission, setCanAskPermission] = useState<boolean>(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const checkPermissions = useCallback(async (): Promise<boolean> => {
    const result = await queryPermissions(errorMessageCheck);
    setPermissionGranted(result.granted);
    setCanAskPermission(result.canAskAgain);
    if (result.error) {
      setPermissionError(result.error);
    }
    return result.granted;
  }, [errorMessageCheck]);

  useEffect(() => {
    let isMounted = true;

    const syncPermissions = async () => {
      const result = await queryPermissions(errorMessageCheck);
      if (isMounted) {
        setPermissionGranted(result.granted);
        setCanAskPermission(result.canAskAgain);
        if (result.error) {
          setPermissionError(result.error);
        }
      }
    };

    syncPermissions();

    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          syncPermissions();
        }
      },
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [errorMessageCheck]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setPermissionError(null);
      const { granted, canAskAgain } =
        await AudioModule.requestRecordingPermissionsAsync();
      setPermissionGranted(granted);
      setCanAskPermission(canAskAgain);
      return granted;
    } catch (err) {
      console.error("useAudioPermissions.requestPermission error:", err);
      setPermissionError(errorMessageRequest);
      return false;
    }
  }, [errorMessageRequest]);

  return {
    permissionGranted,
    canAskPermission,
    permissionError,
    requestPermission,
    checkPermissions,
  };
}
