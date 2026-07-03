import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0e0e12', paper: '#16161d' },
    primary: { main: '#7c3aed' },
    secondary: { main: '#22d3ee' },
    success: { main: '#22c55e' },
    divider: 'rgba(255,255,255,0.09)',
    text: { secondary: 'rgba(255,255,255,0.6)' },
  },
  shape: { borderRadius: 10 },
  typography: {
    button: { textTransform: 'none', fontWeight: 600 },
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'transparent' },
      styleOverrides: { root: { backgroundImage: 'none', borderBottom: '1px solid rgba(255,255,255,0.09)' } },
    },
  },
})
