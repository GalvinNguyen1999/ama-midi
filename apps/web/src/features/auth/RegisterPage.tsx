import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Link as MuiLink, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { registerApi, storeSession } from '~/apis/auth'
import { AuthLayout } from '~/features/auth/AuthLayout'
import { PasswordField } from '~/features/auth/PasswordField'
import { registerSchema, type RegisterValues } from '~/features/auth/schemas'

export function RegisterPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) })
  const [busy, setBusy] = useState(false)

  const onSubmit = async (data: RegisterValues) => {
    setBusy(true)
    try {
      const res = await registerApi(data.email, data.password)
      storeSession(res)
      toast.success('Account created')
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
            {...register('email')}
          />
          <PasswordField
            label="Password"
            fullWidth
            error={Boolean(errors.password)}
            helperText={errors.password?.message ?? 'At least 6 characters'}
            {...register('password')}
          />
          <Button type="submit" variant="contained" size="large" loading={busy}>
            Create account
          </Button>
          <Typography variant="body2" color="text.secondary">
            Have an account? <MuiLink component={Link} to="/login">Login</MuiLink>
          </Typography>
        </Stack>
      </form>
    </AuthLayout>
  )
}
