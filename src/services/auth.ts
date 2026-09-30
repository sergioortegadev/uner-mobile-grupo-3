import { MOCK_USERS } from "../mocks/auth";
import { CredencialesAuth, RespuestaAuth, Usuario } from "../types";

export interface AuthService {
  login(credenciales: CredencialesAuth): Promise<RespuestaAuth>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<Usuario | null>;
  getStoredToken(): Promise<string | null>;
}

const delay = (ms: number = 500) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockAuthService implements AuthService {
  private currentUser: Usuario | null = null;
  private currentToken: string | null = null;

  async login(credenciales: CredencialesAuth): Promise<RespuestaAuth> {
    await delay();

    const usuarioEncontrado = MOCK_USERS[credenciales.email.toLowerCase()];

    if (!usuarioEncontrado || credenciales.password !== "123456") throw new Error("Credenciales inválidas");

    // Generar token JWT simulado
    const tokenSimulado = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockToken.${usuarioEncontrado.id}`;
    const refreshTokenSimulado = `e7cJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`;

    this.currentUser = usuarioEncontrado;
    this.currentToken = tokenSimulado;

    return {
      user: usuarioEncontrado,
      access_token: tokenSimulado,
      refresh_token: refreshTokenSimulado,
      token_type: "Bearer",
      expires_in: "15d",
      access_token_expires_at: "2026-10-15T20:20:20.200Z",
      refresh_token_expires_at: "2026-12-15T20:20:20.200Z",
    };
  }

  async logout(): Promise<void> {
    await delay(250);
    this.currentUser = null;
    this.currentToken = null;
  }

  async getCurrentUser(): Promise<Usuario | null> {
    await delay(350);
    return this.currentUser;
  }

  async getStoredToken(): Promise<string | null> {
    await delay(250);
    return this.currentToken;
  }
}

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK !== "false";

export const authService: AuthService = USE_MOCK ? new MockAuthService() : new MockAuthService(); // cuando esté se cambia por -> ApiAuthService()
