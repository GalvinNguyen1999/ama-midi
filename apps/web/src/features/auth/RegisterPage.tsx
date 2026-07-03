import { Button, Link as MuiLink, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { registerApi, storeSession } from '~/apis/auth'
import { AuthLayout } from '~/features/auth/AuthLayout'

interface RegisterForm {
  email: string
  password: string
}

export function RegisterPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>()
  const [busy, setBusy] = useState(false)

  const onSubmit = async (data: RegisterForm) => {
    setBusy(true)
    try {
      const res = await registerApi(data.email, data.password)
      storeSession(res)
      navigate('/')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Create account" subtitle="Start sketching MIDI sequences">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            {...register('email', { required: 'Email is required' })}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            error={Boolean(errors.password)}
            helperText={errors.password?.message ?? 'At least 6 characters'}
            {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'At least 6 characters' } })}
          />
          <Button type="submit" variant="contained" size="large" disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </Button>
          <Typography variant="body2" color="text.secondary">
            Have an account? <MuiLink component={Link} to="/login">Login</MuiLink>
          </Typography>
        </Stack>
      </form>
    </AuthLayout>
  )
}
