import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/themed-text";
import { Foto } from "@/types";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Alert, Linking, Pressable, StyleSheet, View } from "react-native";
import { logDevError } from "@/helpers/log";


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
const PhotoSelector = ({ photos, onChangePhotos }: PhotoSelectorProps) => {
  const [permission, requestPermission, getPermissionStatus] = ImagePicker.useCameraPermissions();

  const canAddPhoto = photos.length < MAX_PHOTOS;

  const addPhoto = (uri: string) => {
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
  };

  const confirmRemovePhoto = (photoId: string) => {
    Alert.alert("¿Quitar foto?", undefined, [
      {
        text: "Aceptar",
        onPress: () => onChangePhotos(photos.filter((photo) => photo.id !== photoId)),
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  // V03 para reemplazar una foto existente con una nueva.
  const replacePhoto = (photoId: string, uri: string) => {
    onChangePhotos(
      photos.map((photo) => (photo.id === photoId ? { ...photo, id: `foto-${Date.now()}`, url: uri } : photo)),
    );
  };

  const askReplacePhoto = (photoId: string) => {
    Alert.alert("Cambiar foto", "¿De dónde obtener la nueva foto?",
      [
        { text: "Cámara", onPress: () => takePhoto((uri) => replacePhoto(photoId, uri)) },
        { text: "Galería", onPress: () => takeFromGallery((uri) => replacePhoto(photoId, uri)) },
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  // opciones para cuando tocamos una foto
  const showPhotoOptions = (photoId: string) => {
    Alert.alert("Foto del reporte", "¿Qué querés hacer con esta foto?", [
      { text: "Cambiar", onPress: () => askReplacePhoto(photoId) },
      { text: "Quitar", onPress: () => confirmRemovePhoto(photoId) },
      { text: "Cancelar", style: "cancel" },
    ]);
  };


  const takePhoto = async (onPhoto: (uri: string) => void) => {
    // Rama 1: consultamos el permiso EN ESTE MOMENTO (pudo cambiar en la configuración del teléfono).
    let current = await getPermissionStatus();

    // Rama 2: no tenemos permiso.
    if (!current.granted) {
      if (!current.canAskAgain) {
        Alert.alert(
          "Permiso denegado",
          "No se puede solicitar el permiso de la cámara. Podés habilitarlo en la configuración o usar la galería.",
          [
            { text: "Usar galería", onPress: () => takeFromGallery(onPhoto) },
            { text: "Abrir configuración", onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }

      current = await requestPermission();
      if (!current.granted) {
        Alert.alert("Sin acceso a la cámara", "Podés elegir una foto de la galería.");
        return;
      }
    }

    // Rama 3: tenemos permiso.
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.7,
      });

      if (result.canceled) return;
      onPhoto(result.assets[0].uri);
    } catch (error) {
      logDevError("[PhotoSelector] No se pudo abrir la cámara:", error);
      Alert.alert("No se pudo abrir la cámara", "Probá de nuevo o elegí una foto de la galería.");
    }
  };

  const takeFromGallery = async (onPhoto: (uri: string) => void) => {
    // La galería usa el selector del sistema: no necesita permiso.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (result.canceled) return;
    onPhoto(result.assets[0].uri);
  };

  return (
    <View style={styles.container}>
      {photos.length > 0 && (
        <View style={styles.photosRow}>
          {photos.map((photo, index) => (
            <View key={photo.id} style={styles.photoCard}>
              <Pressable
                onPress={() => showPhotoOptions(photo.id)}
                accessibilityRole="button"
                accessibilityLabel={`Foto ${index + 1}`}
                accessibilityHint="Abre las opciones para cambiar o quitar la foto"
              >
                <Image
                  source={{ uri: photo.url }}
                  style={styles.photo}
                  contentFit="cover"
                  transition={200}
                  accessibilityLabel={`Foto ${index + 1} del problema`}
                />
              </Pressable>
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
              onPress={() => takePhoto(addPhoto)}
              disabled={!permission}
              accessibilityLabel="Tomar foto con la cámara"
              style={styles.button}
            />
            <Button
              title="Galería"
              variant="contorno"
              onPress={() => takeFromGallery(addPhoto)}
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
};

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

export default PhotoSelector;
