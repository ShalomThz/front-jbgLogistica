import { z } from 'zod';

// Login
export const LoginCredentialsSchema = z.object({
  email: z.email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;

// Tokens
export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresIn: z.number().optional(),
});

export type AuthTokens = z.infer<typeof AuthTokensSchema>;

// User
export const UserSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string(),
  role: z.enum(['ADMIN', 'HQ', 'PARTNER']),
  storeId: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export type User = z.infer<typeof UserSchema>;

// Login Response
export const LoginResponseSchema = z.object({
  user: UserSchema,
  tokens: AuthTokensSchema,
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;
