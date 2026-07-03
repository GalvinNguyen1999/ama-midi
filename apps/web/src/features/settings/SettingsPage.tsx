import LogoutIcon from '@mui/icons-material/Logout'
import SecurityIcon from '@mui/icons-material/Security'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { handleLogoutApi } from '~/apis'
import { enable2faApi, setup2faApi } from '~/apis/auth'
import { readUser } from '~/utils/session'

export function SettingsPage() {
  const navigate = useNavigate()
  const user = useMemo(readUser, [])
  const email = user?.email ?? ''

  const [qr, setQr] = useState('')
  const [code, setCode] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [starting, setStarting] = useState(false)
  const [busy, setBusy] = useState(false)

  const startSetup = async () => {
    setStarting(true)
    try {
      const res = await setup2faApi()
      setQr(res.qr)
    } finally {
      setStarting(false)
    }
  }

  const confirmEnable = async () => {
    if (code.length !== 6) return
    setBusy(true)
    try {
      await enable2faApi(code)
      setEnabled(true)
    } finally {
      setBusy(false)
    }
  }

  const logout = async () => {
    await handleLogoutApi()
    localStorage.clear()
    navigate('/login')
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3, letterSpacing: '-0.02em' }}>
        Settings
      </Typography>

      <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
        <CardHeader title="Profile" titleTypographyProps={{ variant: 'h6' }} />
        <CardContent sx={{ pt: 0 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: 22 }}>
              {(email[0] ?? 'U').toUpperCase()}
            </Avatar>
            <Box>
              <Typography fontWeight={600}>{email || 'Signed in'}</Typography>
              <Typography variant="caption" color="text.secondary">
                AMA-MIDI account
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
        <CardHeader
          avatar={<SecurityIcon color="primary" />}
          title="Two-factor authentication"
          titleTypographyProps={{ variant: 'h6' }}
          subheader="Add a second step at login with an authenticator app"
        />
        <CardContent sx={{ pt: 0 }}>
          {enabled ? (
            <Alert severity="success">Two-factor is enabled. Your next login will require a code.</Alert>
          ) : qr ? (
            <Stack spacing={2} alignItems="center">
              <Box
                component="img"
                src={qr}
                alt="2FA QR code"
                sx={{ width: 180, height: 180, borderRadius: 2, bgcolor: '#fff', p: 1 }}
              />
              <TextField
                label="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                slotProps={{ htmlInput: { maxLength: 6, inputMode: 'numeric' } }}
                sx={{ input: { letterSpacing: '0.4em', textAlign: 'center', fontFamily: 'monospace' } }}
                fullWidth
              />
              <Button variant="contained" fullWidth onClick={confirmEnable} disabled={busy || code.length !== 6}>
                {busy ? 'Enabling…' : 'Confirm & enable'}
              </Button>
            </Stack>
          ) : (
            <Button
              variant="outlined"
              startIcon={starting ? <CircularProgress size={16} /> : <SecurityIcon />}
              onClick={startSetup}
              disabled={starting}
            >
              Set up two-factor
            </Button>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardHeader title="Account" titleTypographyProps={{ variant: 'h6' }} />
        <CardContent sx={{ pt: 0 }}>
          <Button color="error" variant="outlined" startIcon={<LogoutIcon />} onClick={logout}>
            Logout
          </Button>
        </CardContent>
      </Card>
    </Container>
  )
}
