import { z } from 'zod';

export const loginSchema = z.object({
  celular: z
    .string()
    .min(1, 'Celular é obrigatório')
    .regex(/^\d{11}$/, 'Celular deve ter 11 dígitos'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

export const registrarSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  celular: z
    .string()
    .min(1, 'Celular é obrigatório')
    .regex(/^\d{11}$/, 'Celular deve ter 11 dígitos'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmarSenha: z.string().min(1, 'Confirmação de senha é obrigatória'),
  uf: z.string().min(1, 'Estado é obrigatório'),
  cidadeIbgeId: z.number().min(1, 'Cidade é obrigatória'),
  cidadeNome: z.string().min(1, 'Cidade é obrigatória'),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: 'Senhas não conferem',
  path: ['confirmarSenha'],
});

export const recuperarSenhaSchema = z.object({
  celular: z
    .string()
    .min(1, 'Celular é obrigatório')
    .regex(/^\d{11}$/, 'Celular deve ter 11 dígitos'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegistrarFormData = z.infer<typeof registrarSchema>;
export type RecuperarSenhaFormData = z.infer<typeof recuperarSenhaSchema>;
