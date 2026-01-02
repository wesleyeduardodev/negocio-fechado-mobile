export interface Usuario {
  id: number;
  nome: string;
  celular: string;
  fotoUrl: string | null;
  cidade: Cidade;
  bairro: Bairro;
  isProfissional: boolean;
  criadoEm: string;
}

export interface Cidade {
  id: number;
  nome: string;
  uf: string;
}

export interface Bairro {
  id: number;
  nome: string;
}
