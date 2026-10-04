import { kvStorage } from './kv-client';
import { CreateReportDTO, Reporte } from '@/types/index';
import { PendingReport, SyncStatus } from '@/types/offline';

const PENDING_REPORTS_KEY = '@reporte_ciudadano:reportes_pendientes';

/**
 * Genera un identificador único seguro para almacenamiento local.
 */
function generateLocalId(): string {
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `loc-${timestamp}-${random}`;
}

/**
 * Genera un código provisional legible para reportes pendientes.
 */
function generateProvisionalCode(): string {
  const random = Math.floor(100 + Math.random() * 900);
  return `RC-PEND-${random}`;
}

/**
 * Obtiene la lista completa de reportes guardados localmente.
 */
export async function getAllLocalReports(): Promise<PendingReport[]> {
  const list = await kvStorage.getItem<PendingReport[]>(PENDING_REPORTS_KEY);
  if (!Array.isArray(list)) {
    return [];
  }
  return list;
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
export async function savePendingReport(payload: CreateReportDTO): Promise<PendingReport> {
  const localId = generateLocalId();
  const clientRequestId = `req-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const reporteLocal: Reporte = {
    id: localId,
    codigo: generateProvisionalCode(),
    tipoId: payload.tipoId,
    descripcion: payload.descripcion,
    audioUrl: payload.audioUrl,
    fotos: payload.fotos,
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
    payload,
    syncStatus: 'pendiente',
    retryCount: 0,
    createdAt: now,
  };

  const queue = await getAllLocalReports();
  queue.unshift(pendingItem);
  await kvStorage.setItem(PENDING_REPORTS_KEY, queue);

  return pendingItem;
}

type PendingReportItem = PendingReport;

/**
 * Actualiza el estado de sincronización y registra errores o reintentos.
 */
export async function updateSyncStatus(
  localId: string,
  status: SyncStatus,
  errorMessage?: string
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
    retryCount: status === 'error' ? current.retryCount + 1 : current.retryCount,
    errorMessage: errorMessage ?? current.errorMessage,
  };

  queue[index] = updated;
  await kvStorage.setItem(PENDING_REPORTS_KEY, queue);
  return updated;
}

/**
 * Marca un reporte local como sincronizado exitosamente, conservando el registro
 * y asociando el identificador del servidor.
 */
export async function markReportAsSynced(
  localId: string,
  serverReportId: string
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
    serverReportId,
    reporte: {
      ...current.reporte,
      id: serverReportId,
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
