export type StatusSolicitacao = 'ABERTA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';

export type Urgencia = 'URGENTE' | 'ESTA_SEMANA' | 'PROXIMAS_SEMANAS' | 'APENAS_ORCANDO';

export const URGENCIA_LABELS: Record<Urgencia, string> = {
  URGENTE: 'Urgente (hoje/amanha)',
  ESTA_SEMANA: 'Esta semana',
  PROXIMAS_SEMANAS: 'Proximas semanas',
  APENAS_ORCANDO: 'Apenas orcando',
};

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
  urgencia: Urgencia;
  uf: string;
  cidadeIbgeId: number;
  cidadeNome: string;
  bairro: string;
  fotos: string[];
  totalInteresses: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CriarSolicitacaoRequest {
  categoriaId: number;
  titulo: string;
  descricao: string;
  urgencia: Urgencia;
  fotos?: string[];
}

export interface AtualizarSolicitacaoRequest {
  titulo: string;
  descricao: string;
  urgencia: Urgencia;
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
  clienteCelular: string;
  categoriaNome: string;
  categoriaIcone: string;
  bairro: string;
  cidadeNome: string;
  uf: string;
  urgencia: Urgencia;
  fotos: string[];
  criadoEm: string;
}
