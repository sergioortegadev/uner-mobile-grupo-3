import { Directory, File, Paths } from "expo-file-system";

export const RECORDINGS_DIRECTORY_NAME = "recordings";

export function getRecordingsDirectory(): Directory {
  return new Directory(Paths.document, RECORDINGS_DIRECTORY_NAME);
}

export function ensureRecordingsDirectory(): Directory {
  const dir = getRecordingsDirectory();
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

export async function persistAudioFile(tempUri: string): Promise<string> {
  const sourceFile = new File(tempUri);
  const recordingsDir = ensureRecordingsDirectory();
  const ext = sourceFile.extension || "m4a";
  const sanitizedExt = ext.startsWith(".") ? ext.slice(1) : ext;
  const targetFile = new File(
    recordingsDir,
    `recording_${Date.now()}.${sanitizedExt}`,
  );

  await sourceFile.copy(targetFile);

  if (sourceFile.exists && sourceFile.uri !== targetFile.uri) {
    try {
      sourceFile.delete();
    } catch {}
  }

  return targetFile.uri;
}

export async function deleteAudioFile(fileUri: string): Promise<void> {
  const file = new File(fileUri);
  if (file.exists) {
    file.delete();
  }
}
