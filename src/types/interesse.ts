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
