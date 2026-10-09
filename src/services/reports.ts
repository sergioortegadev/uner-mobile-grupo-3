import { MOCK_CREWS, MOCK_REPORT_TYPES, MOCK_REPORTS, MOCK_STATUS_HISTORY, MOCK_ZONES } from "../mocks/reports";
import {
  CambioDeEstado,
  Coordenadas,
  Cuadrilla,
  EstadoReporte,
  Foto,
  Reporte,
  TipoDeReporte,
  Zona,
} from "../types/index";
import { calculateDistanceInMeters } from "../utils/geo";

export interface CreateReportDTO {
  tipoId: string;
  descripcion: string | null;
  audioUrl: string | null;
  fotos: Foto[];
  coordenadas: Coordenadas;
  direccion: string;
  autorId: string;
}

export interface ReportFilterParams {
  estado?: EstadoReporte;
  tipoId?: string;
  zonaId?: string;
  autorId?: string;
}

export interface ReportService {
  getReports(filters?: ReportFilterParams): Promise<Reporte[]>;
  getReportById(id: string): Promise<Reporte | null>;
  createReport(data: CreateReportDTO): Promise<Reporte>;
  updateReportStatus(
    id: string,
    status: EstadoReporte,
    comment?: string | null,
    operatorId?: string | null,
    repairPhotoUrl?: string | null,
  ): Promise<Reporte>;
  addAdhesion(reportId: string): Promise<Reporte>;
  getNearbyReports(coordinates: Coordenadas, radiusMeters?: number, typeId?: string): Promise<Reporte[]>;
  getReportTypes(): Promise<TipoDeReporte[]>;

  getStatusHistory(reportId: string): Promise<CambioDeEstado[]>;
  getZones(): Promise<Zona[]>;
  getCrews(zonaId?: string): Promise<Cuadrilla[]>;
  assignCrew(reportId: string, crewId: string): Promise<Reporte>;
  markAsDuplicate(reportId: string, originalReportId: string): Promise<Reporte>;
}

// Simular latencia de red, (600ms)

const delay = (ms: number = 600) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockReportService implements ReportService {
  private reports: Reporte[] = [...MOCK_REPORTS];
  private history: CambioDeEstado[] = [...MOCK_STATUS_HISTORY];
  private crews: Cuadrilla[] = [...MOCK_CREWS];

  async getStatusHistory(reportId: string): Promise<CambioDeEstado[]> {
    await delay();

    return this.history
      .filter((h) => h.reporteId === reportId)
      .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
  }

  async getZones(): Promise<Zona[]> {
    await delay();
    return MOCK_ZONES;
  }

  async getCrews(zonaId?: string): Promise<Cuadrilla[]> {
    await delay();
    let resultado = this.crews.filter((c) => c.activa);
    if (zonaId) {
      resultado = resultado.filter((c) => c.zonaId === zonaId);
    }

    return resultado;
  }

  async assignCrew(reportId: string, crewId: string): Promise<Reporte> {
    await delay();

    const reporte = this.reports.find((r) => r.id === reportId);
    if (!reporte) throw new Error("Reporte no encontrado");

    reporte.cuadrillaId = crewId;
    reporte.estado = "asignado";

    // Registrar en el historial de cambios
    this.history.push({
      id: `hist-${Date.now()}`,
      reporteId: reportId,
      estado: "asignado",
      comentario: `Asignado a la cuadrilla ${crewId}`,
      operadorId: "usr-02",
      fechaHora: new Date().toISOString(),
    });

    return { ...reporte };
  }

  async markAsDuplicate(reportId: string, originalReportId: string): Promise<Reporte> {
    await delay();

    const reporte = this.reports.find((r) => r.id === reportId);
    if (!reporte) throw new Error("Reporte no encontrado");

    reporte.duplicadoDe = originalReportId;
    reporte.estado = "rechazado";

    // Registrar en el historial
    this.history.push({
      id: `hist-${Date.now()}`,
      reporteId: reportId,
      estado: "rechazado",
      comentario: `Marcado como duplicado del reporte ${originalReportId}`,
      operadorId: "usr-02",
      fechaHora: new Date().toISOString(),
    });

    return { ...reporte };
  }

  async getReports(filters?: ReportFilterParams): Promise<Reporte[]> {
    await delay();
    let resultado = [...this.reports];

    if (filters?.estado) {
      resultado = resultado.filter((r) => r.estado === filters.estado);
    }
    if (filters?.tipoId) {
      resultado = resultado.filter((r) => r.tipoId === filters.tipoId);
    }
    if (filters?.zonaId) {
      resultado = resultado.filter((r) => r.zonaId === filters.zonaId);
    }
    if (filters?.autorId) {
      resultado = resultado.filter((r) => r.autorId === filters.autorId);
    }
    // PRD: mostrar ordenado: mas nuevo al mas viejo
    return resultado.sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());
  }

  async getReportById(reportId: string): Promise<Reporte | null> {
    await delay(400);
    const reporte = this.reports.find((r) => r.id === reportId);

    return reporte || null;
  }

  async createReport(data: CreateReportDTO): Promise<Reporte> {
    await delay(900);

    // Generar nuevo reporte
    const nuevoReporte: Reporte = {
      id: `rep-${Date.now()}`,
      codigo: `RC-2026-${Math.floor(100 + Math.random() * 900)}`,
      tipoId: data.tipoId,
      descripcion: data.descripcion,
      audioUrl: data.audioUrl,
      fotos: data.fotos,
      coordenadas: data.coordenadas,
      direccion: data.direccion,
      zonaId: "zona-1",
      estado: "recibido",
      autorId: data.autorId,
      cuadrillaId: null,
      duplicadoDe: null,
      adhesiones: 0,
      creadoEn: new Date().toISOString(),
      sincronizado: true,
    };

    this.reports.unshift(nuevoReporte);
    return nuevoReporte;
  }

  async updateReportStatus(
    reportId: string,
    status: EstadoReporte,
    comment?: string | null,
    operatorId?: string | null,
    repairPhotoUrl?: string | null,
  ): Promise<Reporte> {
    await delay(800);

    const reporte = this.reports.find((r) => r.id === reportId);
    if (!reporte) throw new Error("Reporte no encontrado");

    reporte.estado = status;

    if (repairPhotoUrl) {
      reporte.fotos.push({
        id: `foto-${Date.now()}`,
        url: repairPhotoUrl,
        momento: "arreglo",
      });
    }

    // Registrar en el historial de cambios
    this.history.push({
      id: `hist-${Date.now()}`,
      reporteId: reportId,
      estado: status,
      comentario: comment || null,
      operadorId: operatorId || null,
      fechaHora: new Date().toISOString(),
    });

    return { ...reporte };
  }

  async addAdhesion(reportId: string): Promise<Reporte> {
    await delay(300);
    const reporte = this.reports.find((r) => r.id === reportId);
    if (!reporte) throw new Error("Reporte no encontrado");

    reporte.adhesiones++;

    // Registrar en el historial de cambios
    this.history.push({
      id: `hist-${Date.now()}`,
      reporteId: reportId,
      estado: reporte.estado,
      comentario: `Se añadió un usuario al reporte`,
      operadorId: null,
      fechaHora: new Date().toISOString(),
    });

    return { ...reporte };
  }

  async getNearbyReports(
    coordinates: Coordenadas,
    radiusMeters: number = 50,
    typeId?: string,
  ): Promise<Reporte[]> {
    await delay();

    return this.reports
      .filter((report) => report.estado !== "resuelto" && report.estado !== "rechazado")
      .filter((report) => !typeId || report.tipoId === typeId)
      .filter((report) => {
        const distance = calculateDistanceInMeters(coordinates, report.coordenadas);
        return distance <= radiusMeters;
      })
      .sort((reportA, reportB) => {
        const distanceA = calculateDistanceInMeters(coordinates, reportA.coordenadas);
        const distanceB = calculateDistanceInMeters(coordinates, reportB.coordenadas);
        return distanceA - distanceB;
      });
  }

  async getReportTypes(): Promise<TipoDeReporte[]> {
    await delay(250);

    return MOCK_REPORT_TYPES;
  }
}

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK !== "false";

export const mockReportService = new MockReportService();
export const reportService: ReportService = USE_MOCK ? mockReportService : mockReportService; // cuando esté se cambia por -> ApiReportService()
