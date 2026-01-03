import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

import { UsuarioAuth } from '@/src/types/auth';
import { usuarioService } from '@/src/services/usuarioService';

export type ModoApp = 'cliente' | 'profissional';

interface AuthState {
  usuario: UsuarioAuth | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  modoAtual: ModoApp;
  setAuth: (usuario: UsuarioAuth, token: string, refreshToken: string) => Promise<void>;
  updateUsuario: (usuario: Partial<UsuarioAuth>) => Promise<void>;
  setModo: (modo: ModoApp) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  usuario: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  modoAtual: 'cliente',

  setAuth: async (usuario, token, refreshToken) => {
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('usuario', JSON.stringify(usuario));

    // Usa o modoPreferido que veio do banco de dados
    const modoPreferido = usuario.modoPreferido || 'cliente';

    // Salva localmente como cache
    await SecureStore.setItemAsync(`modoAtual_${usuario.id}`, modoPreferido);

    set({
      usuario,
      token,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
      modoAtual: modoPreferido,
    });
  },

  updateUsuario: async (usuarioData) => {
    set((state) => {
      if (!state.usuario) return state;
      const updatedUsuario = { ...state.usuario, ...usuarioData };
      SecureStore.setItemAsync('usuario', JSON.stringify(updatedUsuario));
      return { usuario: updatedUsuario };
    });
  },

  setModo: async (modo) => {
    const state = get();
    if (!state.usuario) return;

    // Atualiza o estado local imediatamente para UX responsiva
    set({ modoAtual: modo });

    // Salva localmente como cache/fallback offline
    await SecureStore.setItemAsync(`modoAtual_${state.usuario.id}`, modo);

    // Atualiza o usuario local com o novo modo
    const updatedUsuario = { ...state.usuario, modoPreferido: modo };
    await SecureStore.setItemAsync('usuario', JSON.stringify(updatedUsuario));
    set({ usuario: updatedUsuario });

    // Envia para o servidor (fire and forget, nao bloqueia a UI)
    try {
      await usuarioService.atualizarModo(modo);
    } catch (error) {
      // Se falhar, o modo ja esta salvo localmente
      // Sera sincronizado na proxima vez que o usuario logar
      console.warn('Falha ao sincronizar modo com servidor:', error);
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('usuario');
    // Nao deleta modoAtual - cada usuario mantem sua preferencia salva localmente

    set({
      usuario: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      modoAtual: 'cliente',
    });
  },

  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      const usuarioJson = await SecureStore.getItemAsync('usuario');

      if (token && refreshToken && usuarioJson) {
        const usuario = JSON.parse(usuarioJson) as UsuarioAuth;

        // Prioridade: modoPreferido do usuario (banco) > cache local > 'cliente'
        const modoPreferido = usuario.modoPreferido
          || await SecureStore.getItemAsync(`modoAtual_${usuario.id}`) as ModoApp | null
          || 'cliente';

        set({
          usuario,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          modoAtual: modoPreferido,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
