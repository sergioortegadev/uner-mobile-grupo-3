import { kvStorage, StorageReadError } from './kv-client';
import { CreateReportDTO, Reporte } from '@/types/index';
import { PendingReport, SyncStatus } from '@/types/offline';
import { persistReportPhotos } from '@/utils/photo-storage';

const PENDING_REPORTS_KEY = '@reporte_ciudadano:reportes_pendientes';

/**
 * Genera un identificador único seguro para almacenamiento local.
 */
function generateLocalId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `loc-${timestamp}-${random}`;
}

/**
 * Deriva el código provisional determinista a partir del identificador

 */
function generateProvisionalCode(localId: string): string {
  const suffix = localId.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(-12);
  return `RC-PEND-${suffix}`;
}

/**
 * Obtiene la lista completa de reportes guardados localmente.
 * Solo la ausencia de datos se interpreta como lista vacía.
 */
export async function getAllLocalReports(): Promise<PendingReport[]> {
  return readQueue();
}

/**
 * Lee la cola local y valida que el contenido guardado sea una lista.
 */
async function readQueue(): Promise<PendingReport[]> {
  const stored = await kvStorage.getItem<unknown>(PENDING_REPORTS_KEY);

  if (stored === null) {
    return [];
  }

  if (!Array.isArray(stored)) {
    throw new StorageReadError(PENDING_REPORTS_KEY, JSON.stringify(stored));
  }

  return stored as PendingReport[];
}

/**
 * Obtiene únicamente los reportes pendientes de sincronización (no sincronizados).
 */
export async function getPendingReports(): Promise<PendingReport[]> {
  const all = await getAllLocalReports();
  return all.filter((item) => item.syncStatus !== 'sincronizado' && !item.reporte.sincronizado);
}

/**
 * Obtiene un reporte local por su ID local o clientRequestId.
 */
export async function getLocalReportById(id: string): Promise<PendingReport | null> {
  const all = await getAllLocalReports();
  return all.find((item) => item.localId === id || item.clientRequestId === id) ?? null;
}

/**
 * Guarda un nuevo reporte en la cola local marcado como sincronizado: false.
 */
export async function savePendingReport(
  payload: CreateReportDTO,
  options?: { uncertainResponse?: boolean }
): Promise<PendingReport> {
  // Se lee antes de copiar fotos: si la cola es ilegible conviene fallar sin dejar archivos huérfanos.
  const queue = await readQueue();

  const localId = generateLocalId();
  const clientRequestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const fotosPersistidas = payload.fotos?.length
    ? await persistReportPhotos(payload.fotos)
    : [];

  const reporteLocal: Reporte = {
    id: localId,
    codigo: generateProvisionalCode(localId),
    tipoId: payload.tipoId,
    descripcion: payload.descripcion,
    audioUrl: payload.audioUrl,
    fotos: fotosPersistidas,
    coordenadas: payload.coordenadas,
    direccion: payload.direccion,
    zonaId: payload.zonaId ,
    estado: 'recibido',
    autorId: payload.autorId,
    cuadrillaId: payload.cuadrillaId,
    duplicadoDe: null,
    adhesiones: 0,
    creadoEn: now,
    sincronizado: false,
  };

  const pendingItem: PendingReportItem = {
    localId,
    clientRequestId,
    reporte: reporteLocal,
    payload: {
      ...payload,
      fotos: fotosPersistidas,
    },
    syncStatus: 'pendiente',
    uncertainResponse: options?.uncertainResponse ?? false,
    retryCount: 0,
    createdAt: now,
  };

  queue.unshift(pendingItem);
  await kvStorage.setItem(PENDING_REPORTS_KEY, queue);

  return pendingItem;
}

type PendingReportItem = PendingReport;

export interface UpdateSyncStatusOptions {
  uncertainResponse?: boolean;
}

/**
 * Normaliza a 'pendiente' con respuesta incierta cualquier reporte que haya quedado
 * en estado 'sincronizando' a causa de un cierre o interrupción previa de la aplicación.
 */
export async function normalizeInterruptedReports(): Promise<number> {
  const queue = await getAllLocalReports();
  let normalizedCount = 0;

  const updatedQueue = queue.map((item) => {
    if (item.syncStatus === 'sincronizando') {
      normalizedCount += 1;
      return {
        ...item,
        syncStatus: 'pendiente' as const,
        uncertainResponse: true,
      };
    }
    return item;
  });

  if (normalizedCount > 0) {
    await kvStorage.setItem(PENDING_REPORTS_KEY, updatedQueue);
  }

  return normalizedCount;
}

/**
 * Actualiza el estado de sincronización y registra errores o reintentos.
 */
export async function updateSyncStatus(
  localId: string,
  status: SyncStatus,
  errorMessage?: string,
  options?: UpdateSyncStatusOptions
): Promise<PendingReport | null> {
  const queue = await getAllLocalReports();
  const index = queue.findIndex((item) => item.localId === localId);

  if (index === -1) {
    return null;
  }

  const current = queue[index];
  const updated: PendingReport = {
    ...current,
    syncStatus: status,
    lastAttemptAt: new Date().toISOString(),
    retryCount: status === 'sincronizando' ? current.retryCount + 1 : current.retryCount,
    errorMessage: errorMessage ?? current.errorMessage,
    uncertainResponse:
      options?.uncertainResponse !== undefined
        ? options.uncertainResponse
        : current.uncertainResponse,
  };

  queue[index] = updated;
  await kvStorage.setItem(PENDING_REPORTS_KEY, queue);
  return updated;
}

/**
 * Marca un reporte local como sincronizado exitosamente, conservando el registro
 * y asociando el identificador y el número de seguimiento definitivo del servidor.
 */
export async function markReportAsSynced(
  localId: string,
  serverReportId: string,
  codigo: string
): Promise<PendingReport | null> {
  const queue = await getAllLocalReports();
  const index = queue.findIndex((item) => item.localId === localId);

  if (index === -1) {
    return null;
  }

  const current = queue[index];
  const updated: PendingReport = {
    ...current,
    syncStatus: 'sincronizado',
    uncertainResponse: false,
    serverReportId,
    reporte: {
      ...current.reporte,
      id: serverReportId,
      codigo,
      sincronizado: true,
    },
    errorMessage: undefined,
  };

  queue[index] = updated;
  await kvStorage.setItem(PENDING_REPORTS_KEY, queue);
  return updated;
}

/**
 * Elimina un reporte del almacenamiento local.
 */
export async function removeLocalReport(localId: string): Promise<boolean> {
  const queue = await getAllLocalReports();
  const filtered = queue.filter((item) => item.localId !== localId);

  if (filtered.length === queue.length) {
    return false;
  }

  await kvStorage.setItem(PENDING_REPORTS_KEY, filtered);
  return true;
}

/**
 * Limpia todos los reportes almacenados localmente.
 */
export async function clearAllLocalReports(): Promise<void> {
  await kvStorage.removeItem(PENDING_REPORTS_KEY);
}
