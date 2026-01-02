import { api } from './api';
import { Categoria } from '../types/categoria';

export const categoriaService = {
  listar: async (): Promise<Categoria[]> => {
    const response = await api.get<Categoria[]>('/categorias');
    return response.data;
  },
};
