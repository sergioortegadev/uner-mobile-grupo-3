import * as Network from 'expo-network';

import { isOnlineFromState } from '@/types/network';

/**
 * Consulta el estado actual de la conexión de red.
 */
export async function getNetworkState(): Promise<Network.NetworkState> {
  try {
    return await Network.getNetworkStateAsync();
  } catch {
    return {
      isConnected: false,
      isInternetReachable: false,
      type: Network.NetworkStateType.UNKNOWN,
    };
  }
}

/**
 * Determina si el dispositivo cuenta con conexión a internet activa.
 */
export async function isOnline(): Promise<boolean> {
  const state = await getNetworkState();
  return isOnlineFromState(state);
}

/**
 * Determina si se puede intentar la sincronización
 */
export async function canAttemptSync(): Promise<boolean> {
  return isOnline();
}

/**
 * Suscribe un listener a cambios en la conectividad del dispositivo.
 * Retorna la función para cancelar la suscripción.
 */
export function subscribeToNetworkChanges(
  listener: (isOnline: boolean, state: Network.NetworkState) => void
): () => void {
  const subscription = Network.addNetworkStateListener((state) => {
    listener(isOnlineFromState(state), state);
  });

  return () => {
    subscription.remove();
  };
}
