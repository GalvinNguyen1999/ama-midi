import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Link as MuiLink, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { loginApi, storeSession, verify2faApi } from '~/apis/auth'
import { AuthLayout } from '~/features/auth/AuthLayout'
import { PasswordField } from '~/features/auth/PasswordField'
import { loginSchema, type LoginValues } from '~/features/auth/schemas'

const OTP_INPUT_SX = {
  input: { letterSpacing: '0.5em', textAlign: 'center', fontFamily: 'monospace', fontSize: 22 },
}

export function LoginPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })
  const [pending2FA, setPending2FA] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (data: LoginValues) => {
    setBusy(true)

    try {
      const res = await loginApi(data.email, data.password)

      if ('requires2FA' in res) {
        setPending2FA(res.userId)
        return
      }

      storeSession(res)
      toast.success('Signed in')
      navigate('/')
    } finally {
      setBusy(false)
    }
  }

  const onVerify = async () => {
    if (!pending2FA || code.length !== 6) return

    setBusy(true)

    try {
      const res = await verify2faApi(pending2FA, code)

      storeSession(res)
      toast.success('Signed in')
      navigate('/')
    } finally {
      setBusy(false)
    }
  }

  if (pending2FA) {
    return (
      <AuthLayout title="Two-factor code" subtitle="Enter the 6-digit code from your authenticator app.">
        <Stack spacing={2}>
          <TextField
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            slotProps={{ htmlInput: { maxLength: 6, inputMode: 'numeric' } }}
            sx={OTP_INPUT_SX}
            fullWidth
          />
          <Button variant="contained" size="large" onClick={onVerify} disabled={busy || code.length !== 6}>
            {busy ? 'Verifying…' : 'Verify'}
          </Button>
          <Button size="small" onClick={() => setPending2FA(null)}>
            Back
          </Button>
        </Stack>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to AMA-MIDI">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            {...register('email')}
          />
          <PasswordField
            label="Password"
            fullWidth
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" variant="contained" size="large" loading={busy}>
            Login
          </Button>
          <Typography variant="body2" color="text.secondary">
            No account? <MuiLink component={Link} to="/register">Create one</MuiLink>
          </Typography>
        </Stack>
      </form>
    </AuthLayout>
  )
}
