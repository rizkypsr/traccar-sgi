import { useMemo } from 'react';
import { useMediaQuery } from '@mui/material';
import { alpha, createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import { brandColor, brandColorDark, brandColorLight } from './brand';

export const brandGradient = `linear-gradient(160deg, ${brandColorLight} 0%, ${brandColor} 55%, ${brandColorDark} 100%)`;

// Accent for icons and highlights: white on brand surfaces, brand color elsewhere
export const accentColor = (theme) =>
  theme.palette.onBrand ? theme.palette.common.white : brandColor;

const white = '#FFFFFF';
// text on the solid white form surfaces inside the brand theme
const ink = 'rgba(0, 0, 0, 0.87)';
const inkSecondary = 'rgba(0, 0, 0, 0.6)';

// solid white paper for dropdown lists, so options never show the gradient through
const whitePaper = { backgroundColor: white, color: ink };

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
          // form fields are solid white with dark text on the gradient
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                backgroundColor: white,
                color: ink,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent',
                  '& legend': { maxWidth: 0 },
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(white, 0.6),
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(white, 0.9),
                },
                '&.Mui-disabled': {
                  backgroundColor: alpha(white, 0.75),
                },
                '& .MuiInputBase-input.Mui-disabled': {
                  WebkitTextFillColor: inkSecondary,
                },
                '& .MuiSvgIcon-root, & .MuiIconButton-root, & .MuiInputAdornment-root': {
                  color: inkSecondary,
                },
                '& .MuiChip-root': {
                  color: ink,
                  backgroundColor: alpha('#000', 0.08),
                },
                '& .MuiChip-root .MuiChip-deleteIcon': {
                  color: alpha('#000', 0.26),
                },
              },
            },
          },
          // floating labels sit on the field edge, so they get a white pill to stay readable
          MuiInputLabel: {
            styleOverrides: {
              root: {
                color: inkSecondary,
                '&.Mui-focused': { color: ink },
                '&.Mui-disabled': { color: inkSecondary },
                '&.MuiInputLabel-shrink': {
                  padding: '0 6px',
                  marginLeft: -6,
                  borderRadius: 4,
                  backgroundColor: white,
                },
              },
            },
          },
          MuiPopover: {
            styleOverrides: {
              paper: whitePaper,
            },
          },
          MuiAutocomplete: {
            styleOverrides: {
              paper: whitePaper,
              noOptions: { color: inkSecondary },
              loading: { color: inkSecondary },
            },
          },
          MuiMenuItem: {
            styleOverrides: {
              root: {
                color: ink,
                '&.Mui-selected': { backgroundColor: alpha(brandColor, 0.1) },
                '&.Mui-selected:hover, &:hover': { backgroundColor: alpha(brandColor, 0.06) },
              },
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

// Full page on the brand gradient on mobile, for standalone pages that don't use PageLayout
export const BrandPage = ({ children }) => {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  if (desktop) {
    return children;
  }
  return (
    <BrandSurface>
      <div style={{ height: '100%', background: brandGradient, color: white }}>{children}</div>
    </BrandSurface>
  );
};

export default BrandSurface;
