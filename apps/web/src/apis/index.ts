import axios from 'axios'

const API_ROOT = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export const handleLogoutApi = () => {
  return axios.delete(`${API_ROOT}/auth/logout`, { withCredentials: true })
}

export const handleRefreshTokenApi = (refreshToken: string | null) => {
  return axios.put(`${API_ROOT}/auth/refresh_token`, { refreshToken }, { withCredentials: true })
}
