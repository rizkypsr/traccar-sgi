import { useMemo } from 'react';
import { alpha, createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import LogoImage from './LogoImage';
import { brandColor } from '../common/theme/brand';

const useStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
    padding: theme.spacing(2.75),
    backgroundColor: '#141414',
    backgroundImage: `url(${import.meta.env.BASE_URL}login-background.webp)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  // frosted glass card over the highway photo
  card: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: 400,
    padding: theme.spacing(11, 3, 4),
    borderRadius: 22,
    position: 'relative',
    isolation: 'isolate',
    backgroundColor: alpha('#FFFFFF', 0.14),
    border: `1px solid ${alpha('#FFFFFF', 0.32)}`,
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
    // blur on a pseudo-element so the card doesn't become the containing block for fixed children
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      zIndex: -1,
      borderRadius: 'inherit',
      backdropFilter: 'blur(1.5px)',
      WebkitBackdropFilter: 'blur(1.5px)',
    },
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(11.5, 2.75, 4),
    },
  },
  logo: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: theme.spacing(3),
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
