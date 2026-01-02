import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

import { UsuarioAuth } from '@/src/types/auth';

interface AuthState {
  usuario: UsuarioAuth | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (usuario: UsuarioAuth, token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  usuario: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

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

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('usuario');

    set({
      usuario: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      const usuarioJson = await SecureStore.getItemAsync('usuario');

      if (token && refreshToken && usuarioJson) {
        const usuario = JSON.parse(usuarioJson) as UsuarioAuth;
        set({
          usuario,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
