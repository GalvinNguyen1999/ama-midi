import { Navigate, Route, Routes } from 'react-router-dom'

import { LoginPage } from '~/features/auth/LoginPage'
import { ProtectedRoute } from '~/features/auth/ProtectedRoute'
import { RegisterPage } from '~/features/auth/RegisterPage'
import { AppShell } from '~/features/layout/AppShell'
import { LibraryPage } from '~/features/library/LibraryPage'
import { SettingsPage } from '~/features/settings/SettingsPage'
import { EditorPage } from '~/features/songs/EditorPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/songs" element={<LibraryPage />} />
        <Route path="/songs/:id" element={<EditorPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/songs" replace />} />
    </Routes>
  )
}

export default App
