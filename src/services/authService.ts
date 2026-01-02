import { api } from './api';
import { AuthResponse, LoginRequest, RefreshRequest, RegistrarRequest } from '@/src/types/auth';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async registrar(data: RegistrarRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/registrar', data);
    return response.data;
  },

  async refresh(data: RefreshRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/refresh', data);
    return response.data;
  },
};
