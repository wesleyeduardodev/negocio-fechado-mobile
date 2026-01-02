export interface UsuarioAuth {
  id: number;
  nome: string;
  celular: string;
  fotoUrl: string | null;
  uf: string;
  cidadeIbgeId: number;
  cidadeNome: string;
  bairro: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  usuario: UsuarioAuth;
}

export interface LoginRequest {
  celular: string;
  senha: string;
}

export interface RegistrarRequest {
  nome: string;
  celular: string;
  senha: string;
  uf: string;
  cidadeIbgeId: number;
  cidadeNome: string;
  bairro: string;
}

export interface RefreshRequest {
  refreshToken: string;
}
