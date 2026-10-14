import { logDevError } from "@/helpers/log";
import { reportService } from "@/services/reports";
import { TipoDeReporte } from "@/types";
import { useEffect, useState } from "react";

export function useReportTypes() {
    const [reportTypes, setReportTypes] = useState<TipoDeReporte[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        reportService.getReportTypes()
            .then((types) => setReportTypes(types))
            .catch((error: unknown) => {
                logDevError("Error al cargar los tipos de reporte:", error);
                setErrorMessage("No pudimos cargar los tipos de reporte. Revisá tu conexión e intentá de nuevo.");
            })
            .finally(() => setIsLoading(false));
    }, [attempt]);

    function retry() {
        setIsLoading(true);
        setErrorMessage("");
        setAttempt(attempt + 1);
    }
    return { reportTypes, isLoading, errorMessage, retry };
}
