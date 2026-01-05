export type TipoNotificacao =
  | 'NOVA_SOLICITACAO'
  | 'NOVO_INTERESSE'
  | 'INTERESSE_ACEITO'
  | 'SERVICO_CONCLUIDO'
  | 'NOVA_AVALIACAO';

export interface Notificacao {
  id: number;
  tipo: TipoNotificacao;
  titulo: string;
  corpo: string;
  referenciaId: number | null;
  lida: boolean;
  criadoEm: string;
}

export interface RegistrarTokenRequest {
  token: string;
  plataforma: 'ANDROID' | 'IOS';
}

export interface NotificacaoCountResponse {
  count: number;
}
