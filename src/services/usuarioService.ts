import { api } from './api';
import {
  UsuarioResponse,
  AtualizarUsuarioRequest,
  AlterarSenhaRequest,
  UploadFotoRequest,
} from '../types/usuario';

export const usuarioService = {
  buscarMeusDados: async (): Promise<UsuarioResponse> => {
    const response = await api.get<UsuarioResponse>('/usuarios/me');
    return response.data;
  },

  atualizar: async (data: AtualizarUsuarioRequest): Promise<UsuarioResponse> => {
    const response = await api.put<UsuarioResponse>('/usuarios/me', data);
    return response.data;
  },

  alterarSenha: async (data: AlterarSenhaRequest): Promise<void> => {
    await api.put('/usuarios/me/senha', data);
  },

  atualizarFoto: async (data: UploadFotoRequest): Promise<UsuarioResponse> => {
    const response = await api.post<UsuarioResponse>('/usuarios/me/foto', data);
    return response.data;
  },

  atualizarModo: async (modo: 'cliente' | 'profissional'): Promise<void> => {
    await api.patch('/usuarios/me/modo', { modo });
  },
};
