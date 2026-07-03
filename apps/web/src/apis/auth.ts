import authorizedAxiosInstance from '~/utils/authorizedAxios'

export interface AuthTokens {
  id: string
  email: string
  accessToken: string
  refreshToken: string
}

export type LoginResult = AuthTokens | { requires2FA: true; userId: string }

export function storeSession(tokens: AuthTokens): void {
  localStorage.setItem('accessToken', tokens.accessToken)
  localStorage.setItem('refreshToken', tokens.refreshToken)
  localStorage.setItem('userInfo', JSON.stringify({ id: tokens.id, email: tokens.email }))
}

export const registerApi = async (email: string, password: string): Promise<AuthTokens> => {
  const { data } = await authorizedAxiosInstance.post<AuthTokens>('/auth/register', { email, password })
  return data
}

export const loginApi = async (email: string, password: string): Promise<LoginResult> => {
  const { data } = await authorizedAxiosInstance.post<LoginResult>('/auth/login', { email, password })
  return data
}

export const verify2faApi = async (userId: string, token: string): Promise<AuthTokens> => {
  const { data } = await authorizedAxiosInstance.post<AuthTokens>('/auth/2fa/verify', { userId, token })
  return data
}

export const setup2faApi = async (): Promise<{ otpauth: string; qr: string }> => {
  const { data } = await authorizedAxiosInstance.post<{ otpauth: string; qr: string }>('/auth/2fa/setup')
  return data
}

export const enable2faApi = async (token: string): Promise<{ enabled: boolean }> => {
  const { data } = await authorizedAxiosInstance.post<{ enabled: boolean }>('/auth/2fa/enable', { token })
  return data
}
