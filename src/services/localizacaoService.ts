import { api } from './api';
import { Cidade } from '@/src/types/localizacao';

export const localizacaoService = {
  async listarCidades(uf: string = 'MA'): Promise<Cidade[]> {
    const response = await api.get<Cidade[]>('/cidades', { params: { uf } });
    return response.data;
  },
};
