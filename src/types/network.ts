import type { NetworkState } from 'expo-network';

export interface AppNetworkStatus {
  isOnline: boolean;
  isConnected: boolean;
  isChecking: boolean;
  rawState?: NetworkState;
}

export function isOnlineFromState(
  state?: Pick<NetworkState, 'isConnected' | 'isInternetReachable'> | null
): boolean {
  if (!state) return false;
  return state.isConnected === true && state.isInternetReachable !== false;
}
