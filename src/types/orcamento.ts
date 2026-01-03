export type StatusOrcamento = 'PENDENTE' | 'ACEITO' | 'RECUSADO' | 'EXPIRADO';

export interface OrcamentoResumo {
  id: number;
  valor: number;
  prazoEstimado: string;
  mensagem: string;
  status: StatusOrcamento;
  profissionalNome: string;
  profissionalId: number;
  profissionalCelular: string | null;
  criadoEm: string;
}

export interface OrcamentoEnviado {
  id: number;
  valor: number;
  prazoEstimado: string;
  mensagem: string;
  status: StatusOrcamento;
  solicitacaoId: number;
  solicitacaoTitulo: string;
  categoriaNome: string;
  categoriaIcone: string;
  clienteNome: string;
  criadoEm: string;
}

export interface EnviarOrcamentoRequest {
  valor: number;
  prazoEstimado: string;
  mensagem: string;
}
