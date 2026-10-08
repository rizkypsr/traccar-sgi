import { useMemo } from 'react';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import LogoImage from './LogoImage';
import { brandColor } from '../common/theme/brand';

const useStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
    padding: theme.spacing(2),
    backgroundColor: brandColor,
    backgroundImage: `url(${import.meta.env.BASE_URL}login-background.webp)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: theme.spacing(56),
    padding: theme.spacing(6, 4, 5),
    borderRadius: theme.spacing(3),
    position: 'relative',
    isolation: 'isolate',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    boxShadow: '0 16px 48px rgba(120, 0, 10, 0.25)',
    // blur on a pseudo-element so the card doesn't become the containing block for fixed children
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      zIndex: -1,
      borderRadius: 'inherit',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    },
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(5, 3, 4),
    },
  },
  logo: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: theme.spacing(4),
  },
}));

const LoginLayout = ({ children }) => {
  const { classes } = useStyles();
  const outerTheme = useTheme();

  const loginTheme = useMemo(
    () =>
      createTheme({
        typography: { fontFamily: outerTheme.typography.fontFamily },
        direction: outerTheme.direction,
        dimensions: outerTheme.dimensions,
        components: outerTheme.components,
        palette: {
          mode: 'light',
          primary: { main: brandColor },
          secondary: { main: brandColor },
          background: { default: '#FFFFFF' },
        },
      }),
    [outerTheme],
  );

  return (
    <ThemeProvider theme={loginTheme}>
      <main className={classes.root}>
        <form className={classes.card}>
          <div className={classes.logo}>
            <LogoImage />
          </div>
          {children}
        </form>
      </main>
    </ThemeProvider>
  );
};

export default LoginLayout;
