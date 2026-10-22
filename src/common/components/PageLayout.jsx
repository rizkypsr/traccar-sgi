import { useState } from 'react';
import {
  AppBar,
  Breadcrumbs,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { alpha } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from './LocalizationProvider';
import BackIcon from './BackIcon';
import { SolarHamburgerLinear } from './SolarIcons';
import BrandSurface, { brandGradient } from '../theme/BrandSurface';
import { brandColor, brandColorDark, brandColorLight } from '../theme/brand';

const useStyles = makeStyles()((theme, { miniVariant }) => ({
  root: {
    height: '100%',
    display: 'flex',
    [theme.breakpoints.down('md')]: {
      flexDirection: 'column',
      // mobile pages sit entirely on the brand gradient
      background: brandGradient,
    },
  },
  desktopDrawer: {
    width: miniVariant ? theme.spacing(7) : theme.dimensions.drawerWidthDesktop,
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    borderRight: `1px solid ${theme.palette.divider}`,
    ...(miniVariant && {
      '& .MuiListItemButton-root': {
        minHeight: 44,
        margin: theme.spacing(0.25, 1),
        padding: theme.spacing(1),
        justifyContent: 'center',
      },
      '& .MuiListItemIcon-root': {
        minWidth: 0,
      },
      '& .MuiListItemText-root': {
        display: 'none',
      },
    }),
    '& .MuiDivider-root': {
      margin: theme.spacing(1, 2),
    },
    '@media print': {
      display: 'none',
    },
  },
  drawerHeader: {
    gap: theme.spacing(1),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(1.5),
    '& .MuiTypography-h6': {
      fontWeight: 700,
      fontSize: '1.125rem',
    },
  },
  // mobile: gradient drawer and header matching the main page
  mobileDrawer: {
    width: theme.dimensions.drawerWidthTablet,
    paddingTop: 'calc(env(safe-area-inset-top) + 8px)',
    background: `linear-gradient(160deg, ${brandColorLight} 0%, ${brandColor} 55%, ${brandColorDark} 100%)`,
    '& .MuiDivider-root': {
      margin: theme.spacing(1, 2),
      borderColor: alpha(theme.palette.common.white, 0.3),
    },
    '& .MuiListItemButton-root': {
      color: alpha(theme.palette.common.white, 0.85),
    },
    '& .MuiListItemButton-root:hover': {
      color: theme.palette.common.white,
      backgroundColor: alpha(theme.palette.common.white, 0.1),
    },
    '& .MuiListItemButton-root.Mui-selected, & .MuiListItemButton-root.Mui-selected:hover': {
      color: theme.palette.common.white,
      backgroundColor: alpha(theme.palette.common.white, 0.2),
    },
    '@media print': {
      display: 'none',
    },
  },
  mobileToolbar: {
    zIndex: 1,
    color: theme.palette.common.white,
    paddingTop: 'env(safe-area-inset-top)',
    borderRadius: theme.spacing(0, 0, 3, 3),
    background: `linear-gradient(135deg, ${brandColorLight} 0%, ${brandColor} 55%, ${brandColorDark} 100%)`,
    boxShadow: `0 6px 18px ${alpha(brandColor, 0.3)}`,
    '& .MuiTypography-root, & .MuiBreadcrumbs-separator': {
      color: theme.palette.common.white,
    },
    '@media print': {
      display: 'none',
    },
  },
  content: {
    flexGrow: 1,
    alignItems: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
}));

const PageTitle = ({ breadcrumbs }) => {
  const theme = useTheme();
  const t = useTranslation();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  if (desktop) {
    return (
      <Typography variant="h6" noWrap>
        {t(breadcrumbs[0])}
      </Typography>
    );
  }
  return (
    <Breadcrumbs>
      {breadcrumbs.slice(0, -1).map((breadcrumb) => (
        <Typography variant="h6" color="inherit" key={breadcrumb}>
          {t(breadcrumb)}
        </Typography>
      ))}
      <Typography variant="h6" color="textPrimary">
        {t(breadcrumbs[breadcrumbs.length - 1])}
      </Typography>
    </Breadcrumbs>
  );
};

const PageLayout = ({ menu, breadcrumbs, children }) => {
  const [miniVariant, setMiniVariant] = useState(false);
  const { classes } = useStyles({ miniVariant });
  const theme = useTheme();
  const navigate = useNavigate();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const [searchParams] = useSearchParams();

  const [openDrawer, setOpenDrawer] = useState(!desktop && searchParams.has('menu'));

  const toggleDrawer = () => setMiniVariant(!miniVariant);

  return (
    <div className={classes.root}>
      {desktop ? (
        <Drawer
          variant="permanent"
          className={classes.desktopDrawer}
          slotProps={{ paper: { className: classes.desktopDrawer } }}
        >
          <Toolbar className={classes.drawerHeader} disableGutters>
            {!miniVariant && (
              <>
                <IconButton color="inherit" onClick={() => navigate('/')}>
                  <BackIcon />
                </IconButton>
                <PageTitle breadcrumbs={breadcrumbs} />
              </>
            )}
            <IconButton
              color="inherit"
              sx={{ ml: miniVariant ? -0.5 : 'auto' }}
              onClick={toggleDrawer}
            >
              {miniVariant !== (theme.direction === 'rtl') ? (
                <ChevronRightIcon />
              ) : (
                <ChevronLeftIcon />
              )}
            </IconButton>
          </Toolbar>
          {menu}
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
          open={openDrawer}
          onClose={() => setOpenDrawer(false)}
          slotProps={{ paper: { className: classes.mobileDrawer } }}
        >
          {menu}
        </Drawer>
      )}
      {!desktop && (
        <AppBar className={classes.mobileToolbar} position="static" color="inherit">
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              sx={{ mr: 2 }}
              onClick={() => setOpenDrawer(true)}
            >
              <SolarHamburgerLinear />
            </IconButton>
            <PageTitle breadcrumbs={breadcrumbs} />
          </Toolbar>
        </AppBar>
      )}
      <BrandSurface enabled={!desktop}>
        <div className={classes.content}>{children}</div>
      </BrandSurface>
    </div>
  );
};

export default PageLayout;
