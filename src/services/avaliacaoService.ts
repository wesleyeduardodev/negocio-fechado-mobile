import { api } from './api';
import { AvaliacaoRequest, AvaliacaoResponse } from '../types/avaliacao';
import { PageResponse } from '../types/solicitacao';

export const avaliacaoService = {
  criar: async (solicitacaoId: number, data: AvaliacaoRequest): Promise<AvaliacaoResponse> => {
    const response = await api.post<AvaliacaoResponse>(`/avaliacoes/solicitacao/${solicitacaoId}`, data);
    return response.data;
  },

  listarPorProfissional: async (profissionalId: number, page: number = 0, size: number = 10): Promise<PageResponse<AvaliacaoResponse>> => {
    const response = await api.get<PageResponse<AvaliacaoResponse>>(`/avaliacoes/profissional/${profissionalId}`, {
      params: { page, size },
    });
    return response.data;
  },
};
