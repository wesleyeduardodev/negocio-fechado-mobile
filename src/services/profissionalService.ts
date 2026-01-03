import { api } from './api';
import {
  PerfilProfissional,
  CriarPerfilProfissionalRequest,
  AtualizarPerfilProfissionalRequest,
} from '../types/profissional';

export const profissionalService = {
  criar: async (data: CriarPerfilProfissionalRequest): Promise<PerfilProfissional> => {
    const response = await api.post<PerfilProfissional>('/profissionais', data);
    return response.data;
  },

  buscarMeuPerfil: async (): Promise<PerfilProfissional> => {
    const response = await api.get<PerfilProfissional>('/profissionais/me');
    return response.data;
  },

  atualizar: async (data: AtualizarPerfilProfissionalRequest): Promise<PerfilProfissional> => {
    const response = await api.put<PerfilProfissional>('/profissionais/me', data);
    return response.data;
  },

  buscarPorId: async (id: number): Promise<PerfilProfissional> => {
    const response = await api.get<PerfilProfissional>(`/profissionais/${id}`);
    return response.data;
  },

  isProfissional: async (): Promise<boolean> => {
    const response = await api.get<boolean>('/profissionais/me/status');
    return response.data;
  },
};
