import { api } from './api';
import { Interesse, CriarInteresseRequest, ProfissionalStats, MeuTrabalho } from '@/src/types/interesse';

export const interesseService = {
  criar: async (request: CriarInteresseRequest): Promise<Interesse> => {
    const response = await api.post<Interesse>('/interesses', request);
    return response.data;
  },

  listarPorSolicitacao: async (solicitacaoId: number): Promise<Interesse[]> => {
    const response = await api.get<Interesse[]>(`/interesses/solicitacao/${solicitacaoId}`);
    return response.data;
  },

  marcarComoVisualizado: async (interesseId: number): Promise<void> => {
    await api.patch(`/interesses/${interesseId}/visualizar`);
  },

  marcarComoContratado: async (interesseId: number): Promise<void> => {
    await api.patch(`/interesses/${interesseId}/contratar`);
  },

  getStats: async (): Promise<ProfissionalStats> => {
    const response = await api.get<ProfissionalStats>('/interesses/stats');
    return response.data;
  },

  listarMeusTrabalhos: async (): Promise<MeuTrabalho[]> => {
    const response = await api.get<MeuTrabalho[]>('/interesses/meus-trabalhos');
    return response.data;
  },
};
