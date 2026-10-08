import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/themed-text";
import { Foto } from "@/types";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Alert, Linking, StyleSheet, View } from "react-native";

export const MAX_PHOTOS = 2;

export interface PhotoSelectorProps {
  /** Valor controlado desde la pantalla. */
  photos: Foto[];
  /** Emite la nueva lista de fotos cuando cambia. */
  onChangePhotos: (photos: Foto[]) => void;
}

/**
 * V02 — Sección "Foto": sacar con la cámara o elegir de la galería.
 * Una foto es obligatoria (lo valida la pantalla) y se permite una segunda opcional.
 */
export function PhotoSelector({ photos, onChangePhotos }: PhotoSelectorProps) {
  const [permission, requestPermission] = ImagePicker.useCameraPermissions();

  const canAddPhoto = photos.length < MAX_PHOTOS;

  function addPhoto(uri: string) {
    if (!canAddPhoto) {
      Alert.alert("No es posible agregar más fotos", `Solo se pueden agregar hasta ${MAX_PHOTOS} fotos.`);
      return;
    }

    const newPhoto: Foto = {
      id: `foto-${Date.now()}`,
      url: uri,
      momento: "problema",
    };
    onChangePhotos([...photos, newPhoto]);
  }

  async function takePhoto() {
    // Rama 1: todavía se está consultando el permiso.
    if (!permission) return;

    // Rama 2: no tenemos permiso.
    if (!permission.granted) {
      if (!permission.canAskAgain) {
        Alert.alert(
          "Permiso denegado",
          "No se puede solicitar el permiso de la cámara. Podés habilitarlo en la configuración o usar la galería.",
          [
            { text: "Usar galería", onPress: takeFromGallery },
            { text: "Abrir configuración", onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }

      const response = await requestPermission();
      if (!response.granted) {
        Alert.alert("Sin acceso a la cámara", "Podés elegir una foto de la galería.");
        return;
      }
    }

    // Rama 3: tenemos permiso.
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (result.canceled) return;
    addPhoto(result.assets[0].uri);
  }

  async function takeFromGallery() {
    // La galería usa el selector del sistema: no necesita permiso.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (result.canceled) return;
    addPhoto(result.assets[0].uri);
  }

  return (
    <View style={styles.container}>
      {photos.length > 0 && (
        <View style={styles.photosRow}>
          {photos.map((photo, index) => (
            <View key={photo.id} style={styles.photoCard}>
              <Image
                source={{ uri: photo.url }}
                style={styles.photo}
                contentFit="cover"
                transition={200}
                accessibilityLabel={`Foto ${index + 1} del problema`}
              />
              <ThemedText type="small" themeColor="textSecondary">
                {index === 0 ? "Foto principal" : "Segunda foto"}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      {canAddPhoto ? (
        <>
          {photos.length === 1 && (
            <ThemedText type="small" themeColor="textSecondary">
              Si con una no se entiende, podés sumar otra (opcional).
            </ThemedText>
          )}

          <View style={styles.buttonsRow}>
            <Button
              title={photos.length === 0 ? "Tomar foto" : "Otra foto"}
              variant="primario"
              onPress={takePhoto}
              disabled={!permission}
              accessibilityLabel="Tomar foto con la cámara"
              style={styles.button}
            />
            <Button
              title="Galería"
              variant="contorno"
              onPress={takeFromGallery}
              accessibilityLabel="Elegir foto de la galería"
              style={styles.button}
            />
          </View>

          {/* Explicamos antes de que aparezca el cartel del sistema */}
          {permission && !permission.granted && permission.canAskAgain && (
            <ThemedText type="small" themeColor="textSecondary">
              Para sacar la foto te vamos a pedir permiso para usar la cámara.
            </ThemedText>
          )}
        </>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          Ya cargaste las {MAX_PHOTOS} fotos.
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  photosRow: {
    flexDirection: "row",
    gap: 12,
  },
  photoCard: {
    flex: 1,
    gap: 4,
  },
  photo: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 12,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flex: 1,
  },
});