import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

import { UsuarioAuth } from '@/src/types/auth';

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

export const useAuthStore = create<AuthState>((set) => ({
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

    set({
      usuario,
      token,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
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
    await SecureStore.setItemAsync('modoAtual', modo);
    set({ modoAtual: modo });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('usuario');
    await SecureStore.deleteItemAsync('modoAtual');

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
      const modoAtual = await SecureStore.getItemAsync('modoAtual') as ModoApp | null;

      if (token && refreshToken && usuarioJson) {
        const usuario = JSON.parse(usuarioJson) as UsuarioAuth;
        set({
          usuario,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          modoAtual: modoAtual || 'cliente',
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
