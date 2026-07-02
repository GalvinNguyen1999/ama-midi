import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0e0e12',
      paper: '#16161d',
    },
    primary: {
      main: '#7c3aed',
    },
  },
  shape: {
    borderRadius: 8,
  },
});
