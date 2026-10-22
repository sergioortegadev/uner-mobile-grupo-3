import { authService } from '@/services/auth';
import { isOnline } from '@/services/network';
import { reportService } from '@/services/reports';
import {
  getPendingReports,
  markReportAsSynced,
  savePendingReport,
  updateSyncStatus,
} from '@/services/storage';
import type { NewReportInput, SendReportResult, SyncSummary } from './types';
import { validateNewReport } from './validation';

/**
 * Crea un reporte a partir de los datos del formulario.
 *
 */
export async function sendReport(data: NewReportInput): Promise<SendReportResult> {
  const validation = validateNewReport(data);

  if (!validation.ok) {
    return { status: 'invalido', errors: validation.errors };
  }

  const author = await authService.getCurrentUser();

  if (!author) {
    return {
      status: 'invalido',
      errors: { autorId: 'Necesitás iniciar sesión para enviar un reporte.' },
    };
  }

  const online = await isOnline();

  if (!online) {
    const pendingItem = await savePendingReport({
      ...validation.datos,
      autorId: author.id,
      cuadrillaId: null,
    });

    return {
      status: 'pendiente',
      reporte: pendingItem,
      codigo: pendingItem.reporte.codigo,
    };
  }

  const report = await reportService.createReport({
    ...validation.datos,
    autorId: author.id,
    cuadrillaId: null,
  });

  return { status: 'enviado', reporte: report, codigo: report.codigo };
}

/**
 * Envía los reportes pendientes de la cola local, del más antiguo al más reciente.
 */
export async function syncPendingReports(): Promise<SyncSummary> {
  const pending = (await getPendingReports()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  let sent = 0;

  for (const item of pending) {
    await updateSyncStatus(item.localId, 'sincronizando');

    const report = await reportService.createReport(item.payload);

    const synced = await markReportAsSynced(item.localId, report.id, report.codigo);

    if (synced) {
      sent += 1;
    }
  }

  const remaining = await getPendingReports();

  return {  sent, pending: remaining.length };
}

export const enviarReporte = sendReport;
export const sincronizarPendientes = syncPendingReports;

export type {
  InvalidReportResult,
  NewReportInput,
  PendingReportResult,
  ReportField,
  ReportFieldErrors,
  SendReportResult,
  SentReportResult,
  SyncSummary,
} from './types';
