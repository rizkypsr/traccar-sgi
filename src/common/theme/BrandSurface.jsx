import { useMemo } from 'react';
import { useMediaQuery } from '@mui/material';
import { alpha, createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import { brandColor, brandColorDark, brandColorLight } from './brand';

export const brandGradient = `linear-gradient(160deg, ${brandColorLight} 0%, ${brandColor} 55%, ${brandColorDark} 100%)`;

// Accent for icons and highlights: white on brand surfaces, brand color elsewhere
export const accentColor = (theme) =>
  theme.palette.onBrand ? theme.palette.common.white : brandColor;

const white = '#FFFFFF';

// Theme for content drawn on the brand gradient: translucent white surfaces and white text,
// so stock MUI components (forms, tables, accordions) stay readable without a white background
const BrandSurface = ({ enabled = true, children }) => {
  const outer = useTheme();

  const theme = useMemo(
    () =>
      createTheme({
        typography: { fontFamily: outer.typography.fontFamily },
        direction: outer.direction,
        dimensions: outer.dimensions,
        components: {
          ...outer.components,
          MuiPaper: {
            styleOverrides: {
              root: { backgroundImage: 'none' },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: { backgroundColor: alpha(white, 0.1) },
            },
          },
          // portaled surfaces float over arbitrary content, so they get solid brand backgrounds
          MuiPopover: {
            styleOverrides: {
              paper: { background: brandGradient },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: { background: brandGradient },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: { borderBottomColor: alpha(white, 0.18) },
            },
          },
        },
        palette: {
          mode: 'dark',
          onBrand: true,
          primary: { main: white },
          secondary: { main: white },
          error: { main: '#FFE08A' },
          background: {
            default: 'transparent',
            paper: alpha(white, 0.12),
          },
          text: {
            primary: white,
            secondary: alpha(white, 0.75),
          },
          divider: alpha(white, 0.22),
          neutral: { main: alpha(white, 0.6) },
          geometry: outer.palette.geometry,
          alwaysDark: outer.palette.alwaysDark,
        },
      }),
    [outer],
  );

  if (!enabled) {
    return children;
  }
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

// Standalone pages (no PageLayout) on mobile: gradient backdrop with the content on a white sheet
export const BrandPage = ({ children }) => {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  if (desktop) {
    return children;
  }
  return (
    <div
      style={{
        height: '100%',
        boxSizing: 'border-box',
        background: brandGradient,
        paddingTop: theme.spacing(1.5),
      }}
    >
      <div
        style={{
          height: '100%',
          overflow: 'hidden',
          borderRadius: theme.spacing(3, 3, 0, 0),
          backgroundColor: theme.palette.background.paper,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default BrandSurface;
