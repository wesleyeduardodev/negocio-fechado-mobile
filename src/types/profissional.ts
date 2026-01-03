export interface CategoriaResumo {
  id: number;
  nome: string;
  icone: string;
}

export interface PerfilProfissional {
  id: number;
  usuarioId: number;
  nome: string;
  fotoUrl: string | null;
  bio: string;
  uf: string;
  cidadeNome: string;
  bairro: string;
  categorias: CategoriaResumo[];
  mediaAvaliacoes: number;
  totalAvaliacoes: number;
  ativo: boolean;
  criadoEm: string;
}

export interface CriarPerfilProfissionalRequest {
  bio: string;
  categoriasIds: number[];
}

export interface AtualizarPerfilProfissionalRequest {
  bio: string;
  categoriasIds: number[];
  ativo?: boolean;
}
