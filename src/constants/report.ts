import type { EstadoReporte } from "@/types";

export const ESTADO_OPTIONS: { value: EstadoReporte; label: string }[] = [
  { value: "recibido", label: "Recibido" },
  { value: "en_revision", label: "En revisión" },
  { value: "asignado", label: "Asignado" },
  { value: "resuelto", label: "Resuelto" },
  { value: "rechazado", label: "Rechazado" },
];

/** El comentario es obligatorio al pasar un reporte a 'resuelto' o 'rechazado'. */
export const requiresComment = (estado: EstadoReporte): boolean =>
  estado === "resuelto" || estado === "rechazado";

/** Un reporte está "abierto" mientras no esté resuelto ni rechazado. */
export const isOpenStatus = (estado: EstadoReporte): boolean => !requiresComment(estado);
