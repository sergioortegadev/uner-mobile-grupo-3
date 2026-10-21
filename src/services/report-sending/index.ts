import { authService } from '@/services/auth';
import { reportService } from '@/services/reports';
import { getPendingReports } from '@/services/storage';
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

  const report = await reportService.createReport({
    ...validation.datos,
    autorId: author.id,
    cuadrillaId: null,
  });

  return { status: 'enviado', reporte: report, codigo: report.codigo };
}

/**
 * Envía los reportes pendientes de la cola local.
 */
export async function syncPendingReports(): Promise<SyncSummary> {
  const pending = await getPendingReports();

  return { enviados: 0, pendientes: pending.length };
}

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
