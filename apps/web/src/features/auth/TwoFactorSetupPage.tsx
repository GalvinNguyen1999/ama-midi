import { Alert, Box, Button, CircularProgress, Stack, TextField } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { enable2faApi, setup2faApi } from '~/apis/auth'
import { AuthLayout } from '~/features/auth/AuthLayout'

export function TwoFactorSetupPage() {
  const [qr, setQr] = useState('')
  const [code, setCode] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const requested = useRef(false)

  useEffect(() => {
    if (requested.current) return
    requested.current = true
    setup2faApi().then((r) => setQr(r.qr))
  }, [])

  const onEnable = async () => {
    if (code.length !== 6) return
    setBusy(true)
    try {
      await enable2faApi(code)
      setEnabled(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Two-factor authentication"
      subtitle={enabled ? undefined : 'Scan the QR with Google Authenticator, then enter the code.'}
    >
      {enabled ? (
        <Stack spacing={2}>
          <Alert severity="success">2FA enabled. Your next login will require a code.</Alert>
          <Button component={Link} to="/" variant="contained">
            Back to editor
          </Button>
        </Stack>
      ) : (
        <Stack spacing={2} alignItems="center">
          {qr ? (
            <Box
              component="img"
              src={qr}
              alt="2FA QR code"
              sx={{ width: 200, height: 200, borderRadius: 1, bgcolor: '#fff', p: 1 }}
            />
          ) : (
            <CircularProgress sx={{ my: 6 }} />
          )}
          <TextField
            label="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            slotProps={{ htmlInput: { maxLength: 6, inputMode: 'numeric' } }}
            sx={{ input: { letterSpacing: '0.4em', textAlign: 'center', fontFamily: 'monospace' } }}
            fullWidth
          />
          <Button variant="contained" onClick={onEnable} disabled={busy || code.length !== 6} fullWidth>
            {busy ? 'Enabling…' : 'Enable 2FA'}
          </Button>
          <Button component={Link} to="/" size="small">
            Cancel
          </Button>
        </Stack>
      )}
    </AuthLayout>
  )
}
