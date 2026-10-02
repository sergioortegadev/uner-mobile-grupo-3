import { MOCK_USERS } from "../mocks/auth";
import { CredencialesAuth, RegistroUsuarioDTO, RespuestaAuth, Usuario } from "../types";

export interface AuthService {
  login(credenciales: CredencialesAuth): Promise<RespuestaAuth>;
  register(datos: RegistroUsuarioDTO): Promise<RespuestaAuth>;
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

    const emailLimpio = credenciales.email.toLowerCase().trim();

    // Escenario 1: Error de comunicación / Falla de servidor o red
    if (emailLimpio === "error@gualeguaychu.gov.ar" || emailLimpio.endsWith("@offline.com")) {
      throw new Error("Error de conexión a internet");
    }

    const usuarioEncontrado = MOCK_USERS[emailLimpio];

    // 🔴 Escenario 2: Credenciales inválidas (Usuario inexistente o clave incorrecta)
    if (!usuarioEncontrado || credenciales.password !== "123456") {
      throw new Error("Usuario o password incorrecta");
    }

    // 🟢 Escenario 3: Respuesta exitosa (Vecino u Operador). Generar token JWT simulado
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

  async register(datos: RegistroUsuarioDTO): Promise<RespuestaAuth> {
    await delay(750);

    const emailLimpio = datos.email.toLowerCase().trim();

    // 🔴 Escenario de Error de Red / Conexión
    if (emailLimpio === "error@gualeguaychu.gov.ar" || emailLimpio.endsWith("@offline.com")) {
      throw new Error("Error de conexión a internet");
    }

    // 🔴 Escenario de Validación: Usuario ya registrado
    if (MOCK_USERS[emailLimpio]) {
      throw new Error("El correo electrónico ya se encuentra registrado.");
    }

    // 🟢 Construcción del nuevo vecino
    const nuevoUsuario: Usuario = {
      id: `usr-${Date.now()}`,
      nombre: datos.nombre,
      ...(datos.dni !== undefined ? { dni: datos.dni } : {}), // dni opcional hasta que la API esté lista.
      email: emailLimpio,
      telefono: datos.telefono || null,
      rol: "vecino", // Todo usuario autoregistrado ingresa como vecino, luego se cambiaría en la DB
      zonaId: null,
      avisosActivos: true,
      creadoEn: new Date().toISOString(),
    };

    // Registrar en memoria para la sesión mock
    MOCK_USERS[emailLimpio] = nuevoUsuario;

    const tokenSimulado = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockToken.${nuevoUsuario.id}`;
    const refreshTokenSimulado = `e7cJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`;

    this.currentUser = nuevoUsuario;
    this.currentToken = tokenSimulado;

    return {
      user: nuevoUsuario,
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
