import { CambioDeEstado, Cuadrilla, Reporte, TipoDeReporte, Zona } from "../types/index";

export const MOCK_REPORT_TYPES: TipoDeReporte[] = [
  {
    id: "type-1",
    nombre: "Bacheo y Calzada",
    icono: "car-outline",
    color: "#E65100",
    areaResponsable: "Obras Públicas",
  },
  {
    id: "type-2",
    nombre: "Alumbrado Público",
    icono: "bulb-outline",
    color: "#F57F17",
    areaResponsable: "Electrotecnia",
  },
  {
    id: "type-3",
    nombre: "Higiene y Maleza",
    icono: "leaf-outline",
    color: "#33691E",
    areaResponsable: "Higiene Urbana",
  },
  {
    id: "type-4",
    nombre: "Agua y Cloacas",
    icono: "water-outline",
    color: "#01579B",
    areaResponsable: "Obras Sanitarias",
  },
];

export const MOCK_REPORTS: Reporte[] = [
  {
    id: "rep-101",
    codigo: "RC-2026-101",
    tipoId: "type-1", // Bacheo y Calzada
    descripcion: "Bache de gran profundidad sobre la calzada dificultando el paso de colectivos.",
    audioUrl: null,
    fotos: [
      {
        id: "ph-101-1",
        url: "https://picsum.photos/id/1071/600/400",
        momento: "problema",
      },
    ],
    coordenadas: { latitud: -33.0094, longitud: -58.5172 },
    direccion: "Urquiza 450",
    zonaId: "zone-1",
    estado: "recibido",
    autorId: "usr-vecino-1",
    cuadrillaId: null,
    duplicadoDe: null,
    adhesiones: 5,
    creadoEn: "2026-09-20T10:15:00-03:00",
    sincronizado: true,
  },
  {
    id: "rep-102",
    codigo: "RC-2026-102",
    tipoId: "type-2", // Alumbrado Público
    descripcion: "Luminaria LED fuera de servicio en la esquina. Zona muy oscura por la noche.",
    audioUrl: null,
    fotos: [
      {
        id: "ph-102-1",
        url: "https://picsum.photos/id/1043/600/400",
        momento: "problema",
      },
    ],
    coordenadas: { latitud: -33.012, longitud: -58.514 },
    direccion: "25 de Mayo 820",
    zonaId: "zone-2",
    estado: "asignado",
    autorId: "usr-vecino-2",
    cuadrillaId: "crew-electrotecnia-1",
    duplicadoDe: null,
    adhesiones: 2,
    creadoEn: "2026-09-21T18:40:00-03:00",
    sincronizado: true,
  },
  {
    id: "rep-103",
    codigo: "RC-2026-103",
    tipoId: "type-3", // Higiene y Maleza
    descripcion: "Acumulación de ramas y maleza alta obstaculizando la visibilidad del peatón.",
    audioUrl: null,
    fotos: [{ id: "ph-103-1", url: "https://picsum.photos/id/106/600/400", momento: "problema" }],
    coordenadas: { latitud: -33.0055, longitud: -58.521 },
    direccion: "Av. Primera Junta 1120",
    zonaId: "zone-3",
    estado: "en_revision",
    autorId: "usr-vecino-1",
    cuadrillaId: null,
    duplicadoDe: null,
    adhesiones: 0,
    creadoEn: "2026-09-22T08:00:00-03:00",
    sincronizado: true,
  },
  {
    id: "rep-104",
    codigo: "RC-2026-104",
    tipoId: "type-4", // Agua y Cloacas
    descripcion: "Pérdida de agua potable en vereda desde hace 2 días.",
    audioUrl: null,
    fotos: [
      {
        id: "ph-104-1",
        url: "https://picsum.photos/id/1050/600/400",
        momento: "problema",
      },
      {
        id: "ph-104-2",
        url: "https://picsum.photos/id/1051/600/400",
        momento: "arreglo",
      },
    ],
    coordenadas: { latitud: -33.0182, longitud: -58.5098 },
    direccion: "Bolívar 310",
    zonaId: "zone-4",
    estado: "resuelto",
    autorId: "usr-vecino-3",
    cuadrillaId: "crew-sanitarias-2",
    duplicadoDe: null,
    adhesiones: 8,
    creadoEn: "2026-09-18T11:30:00-03:00",
    sincronizado: true,
  },
];

export const MOCK_ZONES: Zona[] = [
  {
    id: "zona-1",
    nombre: "Zona Norte",
    referente: "Ing. Carlos Rossi",
    limite: [
      { latitud: -33.0, longitud: -58.53 },
      { latitud: -33.0, longitud: -58.5 },
      { latitud: -33.01, longitud: -58.5 },
      { latitud: -33.01, longitud: -58.53 },
    ],
  },
  {
    id: "zona-2",
    nombre: "Zona Centro / Este",
    referente: "Arq. María Fernandez",
    limite: [
      { latitud: -33.01, longitud: -58.52 },
      { latitud: -33.01, longitud: -58.49 },
      { latitud: -33.025, longitud: -58.49 },
      { latitud: -33.025, longitud: -58.52 },
    ],
  },
  {
    id: "zona-3",
    nombre: "Zona Oeste",
    referente: "Téc. Roberto Gómez",
    limite: [
      { latitud: -33.0, longitud: -58.56 },
      { latitud: -33.0, longitud: -58.53 },
      { latitud: -33.02, longitud: -58.53 },
      { latitud: -33.02, longitud: -58.56 },
    ],
  },
  {
    id: "zona-4",
    nombre: "Zona Sur",
    referente: "Sra. Laura Benítez",
    limite: [
      { latitud: -33.025, longitud: -58.53 },
      { latitud: -33.025, longitud: -58.5 },
      { latitud: -33.04, longitud: -58.5 },
      { latitud: -33.04, longitud: -58.53 },
    ],
  },
];

export const MOCK_CREWS: Cuadrilla[] = [
  {
    id: "crew-01",
    nombre: "Cuadrilla A - Bacheo Nocturno",
    zonaId: "zona-1",
    especialidad: "Bacheo y Asfalto",
    activa: true,
  },
  {
    id: "crew-02",
    nombre: "Cuadrilla Electrotecnia 1",
    zonaId: "zona-2",
    especialidad: "Alumbrado Público",
    activa: true,
  },
  {
    id: "crew-03",
    nombre: "Cuadrilla Higiene y Poda",
    zonaId: "zona-3",
    especialidad: "Maleza y Poda",
    activa: true,
  },
  {
    id: "crew-04",
    nombre: "Cuadrilla Obras Sanitarias 2",
    zonaId: "zona-4",
    especialidad: "Agua y Cloacas",
    activa: true,
  },
];

export const MOCK_STATUS_HISTORY: CambioDeEstado[] = [
  {
    id: "hist-101-1",
    reporteId: "rep-101",
    estado: "recibido",
    comentario: "Reporte ingresado por el vecino mediante la aplicación móvil.",
    operadorId: null,
    fechaHora: "2026-09-20T10:15:00-03:00",
  },
  {
    id: "hist-102-1",
    reporteId: "rep-102",
    estado: "recibido",
    comentario: "Reporte ingresado por el vecino.",
    operadorId: null,
    fechaHora: "2026-09-21T18:40:00-03:00",
  },
  {
    id: "hist-102-2",
    reporteId: "rep-102",
    estado: "asignado",
    comentario: "Asignado a Cuadrilla Electrotecnia 1 para inspección y cambio de fotocélula.",
    operadorId: "usr-02",
    fechaHora: "2026-09-22T09:00:00-03:00",
  },
];
