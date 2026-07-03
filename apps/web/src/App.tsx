import { Navigate, Route, Routes } from 'react-router-dom'

import { LoginPage } from '~/features/auth/LoginPage'
import { ProtectedRoute } from '~/features/auth/ProtectedRoute'
import { RegisterPage } from '~/features/auth/RegisterPage'
import { TwoFactorSetupPage } from '~/features/auth/TwoFactorSetupPage'
import { SongWorkspace } from '~/features/songs/SongWorkspace'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/2fa-setup"
        element={
          <ProtectedRoute>
            <TwoFactorSetupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <SongWorkspace />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
