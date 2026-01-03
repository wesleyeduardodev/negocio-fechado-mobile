import { api } from './api';
import {
  SolicitacaoResumo,
  SolicitacaoDetalhe,
  CriarSolicitacaoRequest,
  SolicitacoesStats,
  PageResponse,
  SolicitacaoParaProfissional,
} from '../types/solicitacao';

export const solicitacaoService = {
  criar: async (data: CriarSolicitacaoRequest): Promise<SolicitacaoDetalhe> => {
    const response = await api.post<SolicitacaoDetalhe>('/solicitacoes', data);
    return response.data;
  },

  listar: async (page: number = 0, size: number = 10): Promise<PageResponse<SolicitacaoResumo>> => {
    const response = await api.get<PageResponse<SolicitacaoResumo>>('/solicitacoes', {
      params: { page, size },
    });
    return response.data;
  },

  buscarPorId: async (id: number): Promise<SolicitacaoDetalhe> => {
    const response = await api.get<SolicitacaoDetalhe>(`/solicitacoes/${id}`);
    return response.data;
  },

  cancelar: async (id: number): Promise<void> => {
    await api.delete(`/solicitacoes/${id}`);
  },

  getStats: async (): Promise<SolicitacoesStats> => {
    const response = await api.get<SolicitacoesStats>('/solicitacoes/stats');
    return response.data;
  },

  listarDisponiveis: async (page: number = 0, size: number = 10): Promise<PageResponse<SolicitacaoParaProfissional>> => {
    const response = await api.get<PageResponse<SolicitacaoParaProfissional>>('/solicitacoes/disponiveis', {
      params: { page, size },
    });
    return response.data;
  },

  buscarDisponivelPorId: async (id: number): Promise<SolicitacaoDetalhe> => {
    const response = await api.get<SolicitacaoDetalhe>(`/solicitacoes/disponiveis/${id}`);
    return response.data;
  },
};
