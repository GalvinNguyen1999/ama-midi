import axios, { AxiosError } from 'axios'
import { toast } from 'react-toastify'

import { handleLogoutApi, handleRefreshTokenApi } from '~/apis'

const authorizedAxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  timeout: 10 * 60 * 1000,
  withCredentials: true,
})

authorizedAxiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken')

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

let refreshTokenPromise: Promise<void> | null = null

authorizedAxiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status

    if (status === 401) {
      handleLogoutApi().then(() => {
        window.location.href = '/login'
      })
    }

    const originalRequest = error.config

    if (status === 410 && originalRequest) {
      if (!refreshTokenPromise) {
        const refreshToken = localStorage.getItem('refreshToken')

        refreshTokenPromise = handleRefreshTokenApi(refreshToken)
          .then((res) => {
            const accessToken = (res.data as { accessToken: string }).accessToken
            localStorage.setItem('accessToken', accessToken)
            authorizedAxiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`
          })
          .catch(() => {
            handleLogoutApi().then(() => {
              window.location.href = '/login'
            })
            return Promise.reject(error)
          })
          .finally(() => {
            refreshTokenPromise = null
          })
      }

      return refreshTokenPromise.then(() => authorizedAxiosInstance(originalRequest))
    }

    if (status !== 410) {
      const data = error.response?.data as { message?: string } | undefined
      const message = data?.message ?? error.message
      if (status === 409) toast.warning(message)
      else toast.error(message)
    }

    return Promise.reject(error)
  },
)

export default authorizedAxiosInstance
