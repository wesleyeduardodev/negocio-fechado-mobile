import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { AxiosError } from 'axios';

import { authService } from '@/src/services/authService';
import { useAuthStore } from '@/src/stores/authStore';
import { LoginRequest, RegistrarRequest } from '@/src/types/auth';

interface ErrorResponse {
  message: string;
}

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: async (response) => {
      await setAuth(response.usuario, response.token, response.refreshToken);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const message = error.response?.data?.message || 'Erro ao fazer login';
      Alert.alert('Erro', message);
    },
  });
}

export function useRegistrar() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (data: RegistrarRequest) => authService.registrar(data),
    onSuccess: async (response) => {
      await setAuth(response.usuario, response.token, response.refreshToken);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const message = error.response?.data?.message || 'Erro ao registrar';
      Alert.alert('Erro', message);
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: async () => {
      await logout();
    },
  });
}
