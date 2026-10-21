import { authService } from '@/services/auth';
import { reportService } from '@/services/reports';
import { getPendingReports } from '@/services/storage';
import type { CreateReportDTO } from '@/types/index';
import type {
  NewReportInput,
  ReportFieldErrors,
  SendReportResult,
  SyncSummary,
} from './types';

type BuildDtoResult =
  | { ok: true; dto: CreateReportDTO }
  | { ok: false; errors: ReportFieldErrors };

/**
 * Traduce los datos crudos del formulario al contrato del servicio de reportes.
 */
function buildCreateReportDTO(datos: NewReportInput, autorId: string): BuildDtoResult {
  const errors: ReportFieldErrors = {};

  if (!datos.tipoId) {
    errors.tipoId = 'Seleccioná el tipo de problema.';
  }

  if (!datos.coordenadas) {
    errors.coordenadas = 'Falta la ubicación del problema.';
  }

  if (!datos.tipoId || !datos.coordenadas) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    dto: {
      tipoId: datos.tipoId,
      descripcion: datos.descripcion ?? null,
      audioUrl: datos.audioUrl ?? null,
      fotos: datos.fotos ?? [],
      coordenadas: datos.coordenadas,
      direccion: datos.direccion ?? '',
      zonaId: datos.zonaId ?? '',
      autorId,
      cuadrillaId: null,
    },
  };
}

/**
 * Crea un reporte a partir de los datos del formulario.
 */
export async function enviarReporte(datos: NewReportInput): Promise<SendReportResult> {
  const autor = await authService.getCurrentUser();

  if (!autor) {
    return {
      status: 'invalido',
      errors: { autorId: 'Necesitás iniciar sesión para enviar un reporte.' },
    };
  }

  const built = buildCreateReportDTO(datos, autor.id);

  if (!built.ok) {
    return { status: 'invalido', errors: built.errors };
  }

  const reporte = await reportService.createReport(built.dto);

  return { status: 'enviado', reporte, codigo: reporte.codigo };
}

/**
 * Envía los reportes pendientes de la cola local.
 */
export async function sincronizarPendientes(): Promise<SyncSummary> {
  const pendientes = await getPendingReports();

  return { enviados: 0, pendientes: pendientes.length };
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
