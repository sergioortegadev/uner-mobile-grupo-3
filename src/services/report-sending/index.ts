import { logDevError } from "@/helpers/log";
import { authService } from "@/services/auth";
import { isOnline } from "@/services/network";
import { reportService } from "@/services/reports";
import {
  getAllLocalReports,
  getPendingReports,
  markReportAsSynced,
  normalizeInterruptedReports,
  savePendingReport,
  updateSyncStatus,
} from "@/services/storage";
import type { CreateReportDTO, Reporte } from "@/types/index";
import { reconcileUncertainReport } from "./reconciliation";
import { SEND_TIMEOUT_MS, withTimeout } from "./timeout";
import type { NewReportInput, SendReportResult, SyncSummary } from "./types";
import { validateNewReport } from "./validation";

/**
 * Crea un reporte a partir de los datos del formulario.
 * Con conexión se intenta enviar con un tiempo máximo de espera. Si el servicio
 * falla o no confirma a tiempo, el reporte se encola como pendiente
 */
export async function sendReport(
  data: NewReportInput,
): Promise<SendReportResult> {
  const validation = validateNewReport(data);

  if (!validation.ok) {
    return { status: "invalido", errors: validation.errors };
  }
  try {
    const author = await authService.getCurrentUser();

    if (!author) {
      return {
        status: "invalido",
        errors: { autorId: "Necesitas iniciar sesión para enviar un reporte." },
      };
    }

    const reportData: CreateReportDTO = {
      ...validation.datos,
      autorId: author.id,
      cuadrillaId: null,
    };

    let timedOut = false;
    if (await isOnline()) {
      const attempt = await attemptSend(reportData);
      if (attempt.ok) {
        return {
          status: "enviado",
          reporte: attempt.report,
          codigo: attempt.report.codigo,
        };
      }
      timedOut = attempt.timedOut;
    }

    const pendingItem = await savePendingReport(reportData, {
      uncertainResponse: timedOut,
    });

    return {
      status: "pendiente",
      reporte: pendingItem,
      codigo: pendingItem.reporte.codigo,
    };
  } catch (error) {
    logDevError("Error crítico en sendReport", error);
    throw error;
  }
}

/** Resultado de un intento de envío: confirmado por el servicio o motivo del fallo. */
type SendAttempt =
  | { ok: true; report: Reporte }
  | { ok: false; timedOut: boolean; errorMessage: string };

/**
 * Intenta enviar un reporte con el tiempo máximo de espera.
 */
async function attemptSend(payload: CreateReportDTO): Promise<SendAttempt> {
  try {
    const result = await withTimeout(reportService.createReport(payload));

    const seconds = SEND_TIMEOUT_MS / 1000;
    return result.timedOut
      ? {
          ok: false,
          timedOut: true,
          errorMessage: `El servicio no confirmó el envío en ${seconds} segundos.`,
        }
      : { ok: true, report: result.value };
  } catch (error) {
    logDevError("Falló el envío de un reporte.", error);
    return {
      ok: false,
      timedOut: false,
      errorMessage: "El servicio respondió con un error al enviar el reporte.",
    };
  }
}

/**
 * Pasada de sincronización en curso. un disparo a la vez
 */
let syncInFlight: Promise<SyncSummary> | null = null;

/**
 * Envía los reportes pendientes de la cola local, del más antiguo al más reciente.
 * Sin conexión no recorre la cola. Varias llamadas simultáneas comparten una sola pasada.
 */
export function syncPendingReports(): Promise<SyncSummary> {
  if (syncInFlight) {
    return syncInFlight;
  }

  syncInFlight = runSync().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}

async function runSync(): Promise<SyncSummary> {
  await normalizeInterruptedReports();

  if (!(await isOnline())) {
    return { sent: 0, pending: null };
  }

  const allLocal = await getAllLocalReports();
  const claimedServerIds = new Set<string>(
    allLocal.flatMap((r) =>
      r.syncStatus === "sincronizado" && r.serverReportId
        ? [r.serverReportId]
        : [],
    ),
  );

  const pending = (await getPendingReports()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  let sent = 0;

  for (const item of pending) {
    await updateSyncStatus(item.localId, "sincronizando");

    if (item.uncertainResponse) {
      const reconciliation = await reconcileUncertainReport(item, {
        excludeReportIds: claimedServerIds,
      });

      if (reconciliation.status === "found") {
        claimedServerIds.add(reconciliation.report.id);
        const synced = await markReportAsSynced(
          item.localId,
          reconciliation.report.id,
          reconciliation.report.codigo,
        );
        if (synced) {
          sent += 1;
        }
        continue;
      }

      if (reconciliation.status === "error") {
        await updateSyncStatus(
          item.localId,
          "pendiente",
          reconciliation.errorMessage,
        );
        continue;
      }
    }

    const attempt = await attemptSend(item.payload);

    if (!attempt.ok) {
      await updateSyncStatus(
        item.localId,
        "pendiente",
        attempt.errorMessage,
        attempt.timedOut ? { uncertainResponse: true } : undefined,
      );
      continue;
    }

    claimedServerIds.add(attempt.report.id);
    const synced = await markReportAsSynced(
      item.localId,
      attempt.report.id,
      attempt.report.codigo,
    );

    if (synced) {
      sent += 1;
    }
  }

  const remaining = await getPendingReports();

  return { sent, pending: remaining.length };
}

export const enviarReporte = sendReport;

export {
  CLOCK_SKEW_TOLERANCE_MS,
  MATCH_RADIUS_METERS,
  findMatchingServerReport,
  reconcileUncertainReport,
} from "./reconciliation";
export type {
  CandidateReport,
  MatchingOptions,
  ReconciliationResult,
} from "./reconciliation";

export type {
  InvalidReportResult,
  NewReportInput,
  PendingReportResult,
  ReportField,
  ReportFieldErrors,
  SendReportResult,
  SentReportResult,
  SyncSummary,
} from "./types";
