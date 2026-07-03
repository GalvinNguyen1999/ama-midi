import authorizedAxiosInstance from '~/utils/authorizedAxios'

const API_ROOT = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export const handleLogoutApi = () => {
  return authorizedAxiosInstance.delete(`${API_ROOT}/auth/logout`, { withCredentials: true })
}

export const handleRefreshTokenApi = (refreshToken: string | null) => {
  return authorizedAxiosInstance.put(`${API_ROOT}/auth/refresh_token`, { refreshToken }, { withCredentials: true })
}
