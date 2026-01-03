export type StatusSolicitacao = 'ABERTA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';

export interface SolicitacaoResumo {
  id: number;
  titulo: string;
  categoriaNome: string;
  categoriaIcone: string;
  status: StatusSolicitacao;
  cidadeNome: string;
  uf: string;
  criadoEm: string;
}

export interface SolicitacaoDetalhe {
  id: number;
  titulo: string;
  descricao: string;
  categoriaId: number;
  categoriaNome: string;
  categoriaIcone: string;
  status: StatusSolicitacao;
  uf: string;
  cidadeIbgeId: number;
  cidadeNome: string;
  bairro: string;
  fotos: string[];
  totalOrcamentos: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CriarSolicitacaoRequest {
  categoriaId: number;
  titulo: string;
  descricao: string;
  fotos?: string[];
}

export interface SolicitacoesStats {
  total: number;
  abertas: number;
  emAndamento: number;
  concluidas: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface SolicitacaoParaProfissional {
  id: number;
  titulo: string;
  descricao: string;
  clienteNome: string;
  categoriaNome: string;
  categoriaIcone: string;
  bairro: string;
  cidadeNome: string;
  uf: string;
  quantidadeFotos: number;
  criadoEm: string;
}
