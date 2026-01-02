export interface UsuarioResponse {
  id: number;
  nome: string;
  celular: string;
  fotoUrl: string | null;
  uf: string;
  cidadeIbgeId: number;
  cidadeNome: string;
  bairro: string;
  criadoEm: string;
}

export interface AtualizarUsuarioRequest {
  nome: string;
  uf: string;
  cidadeIbgeId: number;
  cidadeNome: string;
  bairro: string;
}

export interface AlterarSenhaRequest {
  senhaAtual: string;
  novaSenha: string;
}

export interface UploadFotoRequest {
  fotoUrl: string;
}
