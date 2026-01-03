import { api } from './api';
import {
  OrcamentoResumo,
  OrcamentoEnviado,
  EnviarOrcamentoRequest,
} from '../types/orcamento';
import { PageResponse } from '../types/solicitacao';

export const orcamentoService = {
  enviar: async (solicitacaoId: number, data: EnviarOrcamentoRequest): Promise<OrcamentoResumo> => {
    const response = await api.post<OrcamentoResumo>(`/orcamentos/solicitacao/${solicitacaoId}`, data);
    return response.data;
  },

  listarPorSolicitacao: async (solicitacaoId: number): Promise<OrcamentoResumo[]> => {
    const response = await api.get<OrcamentoResumo[]>(`/orcamentos/solicitacao/${solicitacaoId}`);
    return response.data;
  },

  listarEnviados: async (page: number = 0, size: number = 10): Promise<PageResponse<OrcamentoEnviado>> => {
    const response = await api.get<PageResponse<OrcamentoEnviado>>('/orcamentos/enviados', {
      params: { page, size },
    });
    return response.data;
  },

  aceitar: async (orcamentoId: number): Promise<void> => {
    await api.patch(`/orcamentos/${orcamentoId}/aceitar`);
  },

  recusar: async (orcamentoId: number): Promise<void> => {
    await api.patch(`/orcamentos/${orcamentoId}/recusar`);
  },
};
