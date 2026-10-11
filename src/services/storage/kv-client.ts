import AsyncStorage from 'expo-sqlite/kv-store';


export const kvStorage = {
  /**
   * Obtiene y parsea un valor almacenado.
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItemAsync(key);
      if (raw === null || raw === undefined) {
        return null;
      }
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /**
   * Serializa y almacena un valor.
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);
    await AsyncStorage.setItemAsync(key, serialized);
  },

  /**
   * Elimina una clave del almacenamiento.
   */
  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItemAsync(key);
  },

  /**
   * Limpia todas las claves del almacenamiento.
   */
  async clear(): Promise<void> {
    await AsyncStorage.clearAsync();
  },

  /**
   * Obtiene todas las claves almacenadas.
   */
  async getAllKeys(): Promise<string[]> {
    return AsyncStorage.getAllKeysAsync();
  },
};
