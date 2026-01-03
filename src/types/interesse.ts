export type StatusInteresse = 'PENDENTE' | 'VISUALIZADO' | 'CONTRATADO' | 'REJEITADO';

export interface Interesse {
  id: number;
  profissionalId: number;
  profissionalNome: string;
  profissionalCelular: string;
  profissionalBio: string;
  mensagem: string | null;
  status: StatusInteresse;
  criadoEm: string;
}

export interface CriarInteresseRequest {
  solicitacaoId: number;
  mensagem?: string;
}

export interface ProfissionalStats {
  interessesEnviados: number;
  contratados: number;
  emNegociacao: number;
}

export interface MeuTrabalho {
  interesseId: number;
  solicitacaoId: number;
  solicitacaoTitulo: string;
  solicitacaoDescricao: string;
  categoriaNome: string;
  categoriaIcone: string;
  status: 'ABERTA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
  clienteNome: string;
  clienteCelular: string;
  clienteBairro: string;
  clienteCidade: string;
  clienteUf: string;
  contratadoEm: string;
  avaliacaoNota: number | null;
  avaliacaoComentario: string | null;
  avaliacaoData: string | null;
}
