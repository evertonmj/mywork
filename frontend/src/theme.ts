import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' }, // Professional blue
    secondary: { main: '#64748B' }, // Slate
    background: { default: '#f6f8fb', paper: '#ffffff' },
    text: { primary: '#1f2937', secondary: '#475569' }
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
    h1: { fontWeight: 700, letterSpacing: -0.5 },
    h2: { fontWeight: 700, letterSpacing: -0.25 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root, html, body': { height: '100%' },
        body: { backgroundImage: 'none' }
      }
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'default' },
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid rgba(0,0,0,0.06)'
        }
      }
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid rgba(0,0,0,0.06)'
        }
      }
    },
    MuiButton: {
      defaultProps: { disableElevation: true, variant: 'contained' }
    },
    MuiContainer: {
      defaultProps: { maxWidth: 'md' }
    }
  }
});

export default theme;
