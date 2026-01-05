import { api } from './api';
import {
  Notificacao,
  RegistrarTokenRequest,
  NotificacaoCountResponse,
} from '../types/notificacao';

export const notificacaoService = {
  registrarToken: async (data: RegistrarTokenRequest): Promise<void> => {
    await api.post('/notificacoes/token', data);
  },

  removerToken: async (token: string): Promise<void> => {
    await api.delete(`/notificacoes/token/${encodeURIComponent(token)}`);
  },

  listar: async (): Promise<Notificacao[]> => {
    const response = await api.get<Notificacao[]>('/notificacoes');
    return response.data;
  },

  contarNaoLidas: async (): Promise<number> => {
    const response = await api.get<NotificacaoCountResponse>('/notificacoes/nao-lidas/count');
    return response.data.count;
  },

  marcarComoLida: async (id: number): Promise<void> => {
    await api.put(`/notificacoes/${id}/lida`);
  },

  marcarTodasComoLidas: async (): Promise<void> => {
    await api.put('/notificacoes/lidas');
  },
};
