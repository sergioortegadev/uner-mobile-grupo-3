import { CredencialesAuth, RegistroUsuarioDTO, Usuario } from "@/types";
import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/auth";

interface AuthContextType {
  user: Usuario | null;
  isLoading: boolean;
  login: (credenciales: CredencialesAuth) => Promise<void>;
  register: (datos: RegistroUsuarioDTO) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authService
      .getCurrentUser()
      .then(setUser)
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (credenciales: CredencialesAuth) => {
    const res = await authService.login(credenciales);
    setUser(res.user);
  };

  const register = async (datos: RegistroUsuarioDTO) => {
    const res = await authService.register(datos);
    setUser(res.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
