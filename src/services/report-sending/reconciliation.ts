import { logDevError } from "@/helpers/log";
import { reportService } from "@/services/reports";
import type { Coordenadas, Reporte } from "@/types/index";
import type { PendingReport } from "@/types/offline";
import { calculateDistanceInMeters, isWithinRadius } from "@/utils/geo";
import { withTimeout } from "./timeout";

export const MATCH_RADIUS_METERS = 15;
export const CLOCK_SKEW_TOLERANCE_MS = 60_000;

export type ReconciliationResult =
  | { status: "found"; report: Reporte }
  | { status: "not_found" }
  | { status: "error"; errorMessage: string };

export interface CandidateReport {
  tipoId: string;
  autorId: string;
  coordenadas: Coordenadas;
  createdAt: string;
}

export interface MatchingOptions {
  maxRadiusMeters?: number;
  clockSkewToleranceMs?: number;
  excludeReportIds?: ReadonlySet<string>;
}

export function findMatchingServerReport(
  candidate: CandidateReport,
  serverReports: Reporte[],
  options?: MatchingOptions,
): Reporte | null {
  const candidateTime = new Date(candidate.createdAt).getTime();
  if (Number.isNaN(candidateTime)) {
    return null;
  }

  const maxRadius = options?.maxRadiusMeters ?? MATCH_RADIUS_METERS;
  const tolerance = options?.clockSkewToleranceMs ?? CLOCK_SKEW_TOLERANCE_MS;
  const minTime = candidateTime - tolerance;

  const matches = serverReports.filter((report) => {
    if (options?.excludeReportIds?.has(report.id)) {
      return false;
    }
    if (report.autorId !== candidate.autorId) {
      return false;
    }
    if (report.tipoId !== candidate.tipoId) {
      return false;
    }
    const reportTime = new Date(report.creadoEn).getTime();
    if (Number.isNaN(reportTime) || reportTime < minTime) {
      return false;
    }
    return isWithinRadius(candidate.coordenadas, report.coordenadas, maxRadius);
  });

  if (matches.length === 0) {
    return null;
  }

  matches.sort((a, b) => {
    const timeA = new Date(a.creadoEn).getTime();
    const timeB = new Date(b.creadoEn).getTime();
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    const distA = calculateDistanceInMeters(candidate.coordenadas, a.coordenadas);
    const distB = calculateDistanceInMeters(candidate.coordenadas, b.coordenadas);
    return distA - distB;
  });

  return matches[0];
}

export async function reconcileUncertainReport(
  item: PendingReport,
  options?: MatchingOptions,
): Promise<ReconciliationResult> {
  try {
    const candidate: CandidateReport = {
      tipoId: item.payload.tipoId,
      autorId: item.payload.autorId,
      coordenadas: item.payload.coordenadas,
      createdAt: item.createdAt,
    };

    const result = await withTimeout(
      reportService.getReports({ autorId: candidate.autorId }),
    );

    if (result.timedOut) {
      const errorMessage =
        "El servicio no respondió a tiempo al verificar reportes del vecino.";
      logDevError("Timeout en reconciliación de reporte incierto", new Error(errorMessage));
      return { status: "error", errorMessage };
    }

    const matched = findMatchingServerReport(candidate, result.value, options);
    if (matched) {
      return { status: "found", report: matched };
    }

    return { status: "not_found" };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error desconocido al consultar reportes del servidor.";
    logDevError("Error en reconciliación de reporte incierto", error);
    return { status: "error", errorMessage };
  }
}
