import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { authService } from "@/services/auth";
import { Usuario } from "@/types";

/**
 * Verifica la sesión persistida cada vez que la pantalla toma foco.
 * Devuelve el usuario autenticado, o null mientras se verifica.
 * Si no hay sesión, redirige al login.
 */
export function useRequireAuth(): Usuario | null {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useFocusEffect(
    useCallback(() => {
      let activo = true;

      authService
        .getCurrentUser()
        .then((actual) => {
          if (!activo) return;
          if (actual) {
            setUsuario(actual);
          } else {
            setUsuario(null);
            router.replace("/login");
          }
        })
        .catch(() => {
          if (!activo) return;
          setUsuario(null);
          router.replace("/login");
        });

      return () => {
        activo = false;
      };
    }, []),
  );

  return usuario;
}
