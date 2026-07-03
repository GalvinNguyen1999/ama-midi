import { Box, Card, Typography } from '@mui/material'
import type { ReactNode } from 'react'

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: 'radial-gradient(1200px 600px at 50% -10%, rgba(124,58,237,0.25), transparent), #0e0e12',
      }}
    >
      <Card sx={{ p: 4, width: 400, maxWidth: '100%' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, mt: 0.5 }}>
            {subtitle}
          </Typography>
        ) : (
          <Box sx={{ mb: 2 }} />
        )}
        {children}
      </Card>
    </Box>
  )
}
