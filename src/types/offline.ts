import { CreateReportDTO, Foto, Coordenadas, Reporte } from './index';

export type SyncStatus = 'pendiente' | 'sincronizando' | 'error' | 'sincronizado';

export interface PendingReport {
  localId: string;
  clientRequestId: string;
  reporte: Reporte;
  payload: CreateReportDTO;
  syncStatus: SyncStatus;
  retryCount: number;
  createdAt: string;
  lastAttemptAt?: string;
  errorMessage?: string;
  serverReportId?: string;
}

export interface ReportDraft {
  tipoId?: string;
  descripcion?: string | null;
  audioUrl?: string | null;
  fotos?: Foto[];
  coordenadas?: Coordenadas;
  direccion?: string;
  updatedAt: string;
}
