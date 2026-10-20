import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Menu,
  MenuItem,
  Typography,
  Badge,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import {
  SolarDocumentDuotone,
  SolarServerDuotone,
  SolarLogoutDuotone,
  SolarMapDuotone,
  SolarSettingsDuotone,
  SolarUserDuotone,
} from './SolarIcons';

import { devicesActions, sessionActions } from '../../store';
import { useTranslation } from './LocalizationProvider';
import { useRestriction } from '../util/permissions';
import { nativePostMessage } from './NativeInterface';
import { brandColor } from '../theme/brand';

const useStyles = makeStyles()((theme) => ({
  // floating pill bar; placement margins come from the parent wrapper
  // floating rounded card on desktop, full-width bar attached to the screen edges otherwise
  root: {
    borderRadius: theme.spacing(2.5),
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[6],
    [theme.breakpoints.down('md')]: {
      borderRadius: 0,
      boxShadow: `0 -1px 0 ${theme.palette.divider}, 0 -4px 12px rgba(0, 0, 0, 0.06)`,
      paddingBottom: 'env(safe-area-inset-bottom)',
    },
  },
  navigation: {
    backgroundColor: 'transparent',
  },
  action: {
    minWidth: 0,
    padding: theme.spacing(0.75, 0.5),
    color: theme.palette.text.secondary,
    '& .MuiBottomNavigationAction-label': {
      marginTop: theme.spacing(0.5),
      fontSize: '0.7rem',
      fontWeight: 500,
      lineHeight: 1.2,
      transition: 'none',
    },
    '& .MuiBottomNavigationAction-label.Mui-selected': {
      fontSize: '0.7rem',
      fontWeight: 700,
    },
    '&.Mui-selected': {
      color: brandColor,
    },
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 28,
    borderRadius: 14,
  },
}));

const BottomMenu = () => {
  const { classes, cx } = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const t = useTranslation();

  const readonly = useRestriction('readonly');
  const disableReports = useRestriction('disableReports');
  const devices = useSelector((state) => state.devices.items);
  const user = useSelector((state) => state.session.user);
  const socket = useSelector((state) => state.session.socket);
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  // the device list replaces the old toolbar toggle; it defaults to open on desktop
  const listOpen = useSelector((state) => state.devices.listOpen) ?? desktop;

  const [anchorEl, setAnchorEl] = useState(null);

  const currentSelection = () => {
    if (location.pathname === `/settings/user/${user.id}`) {
      return 'account';
    }
    if (location.pathname.startsWith('/settings')) {
      return 'settings';
    }
    if (location.pathname.startsWith('/reports')) {
      return 'reports';
    }
    if (location.pathname === '/') {
      return listOpen ? 'devices' : 'map';
    }
    return null;
  };

  const handleAccount = () => {
    setAnchorEl(null);
    navigate(`/settings/user/${user.id}`);
  };

  const handleLogout = async () => {
    setAnchorEl(null);

    const notificationToken = window.localStorage.getItem('notificationToken');
    if (notificationToken && !user.readonly) {
      window.localStorage.removeItem('notificationToken');
      const tokens = user.attributes.notificationTokens?.split(',') || [];
      if (tokens.includes(notificationToken)) {
        const updatedUser = {
          ...user,
          attributes: {
            ...user.attributes,
            notificationTokens:
              tokens.length > 1
                ? tokens.filter((it) => it !== notificationToken).join(',')
                : undefined,
          },
        };
        await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedUser),
        });
      }
    }

    await fetch('/api/session', { method: 'DELETE' });
    nativePostMessage('logout');
    navigate('/login');
    dispatch(sessionActions.updateUser(null));
  };

  const handleSelection = (event, value) => {
    switch (value) {
      case 'devices':
        if (location.pathname === '/' && listOpen) {
          dispatch(devicesActions.setListOpen(false));
        } else {
          dispatch(devicesActions.setListOpen(true));
          navigate('/');
        }
        break;
      case 'map':
        dispatch(devicesActions.setListOpen(false));
        navigate('/');
        break;
      case 'reports': {
        let id = selectedDeviceId;
        if (id == null) {
          const deviceIds = Object.keys(devices);
          if (deviceIds.length === 1) {
            id = deviceIds[0];
          }
        }

        if (id != null) {
          navigate(`/reports/combined?deviceId=${id}`);
        } else {
          navigate('/reports/combined');
        }
        break;
      }
      case 'settings':
        navigate('/settings/preferences?menu=true');
        break;
      case 'account':
        setAnchorEl(event.currentTarget);
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  const selection = currentSelection();

  // bold duotone icons take the item color: grey when inactive, brand when active
  const icon = (Icon, wrap = (child) => child) => (
    <span className={cx(classes.pill, 'navPill')}>{wrap(<Icon />)}</span>
  );

  return (
    <Paper square elevation={0} className={classes.root}>
      <BottomNavigation
        value={selection}
        onChange={handleSelection}
        showLabels
        className={classes.navigation}
      >
        <BottomNavigationAction
          className={classes.action}
          label={t('deviceTitle')}
          icon={icon(SolarServerDuotone)}
          value="devices"
        />
        <BottomNavigationAction
          className={classes.action}
          label={t('mapTitle')}
          icon={icon(SolarMapDuotone, (child) => (
            <Badge color="error" variant="dot" overlap="circular" invisible={socket !== false}>
              {child}
            </Badge>
          ))}
          value="map"
        />
        {!disableReports && (
          <BottomNavigationAction
            className={classes.action}
            label={t('reportTitle')}
            icon={icon(SolarDocumentDuotone)}
            value="reports"
          />
        )}
        {!readonly && (
          <BottomNavigationAction
            className={classes.action}
            label={t('settingsTitle')}
            icon={icon(SolarSettingsDuotone)}
            value="settings"
          />
        )}
        {readonly ? (
          <BottomNavigationAction
            className={classes.action}
            label={t('loginLogout')}
            icon={icon(SolarLogoutDuotone)}
            value="logout"
          />
        ) : (
          <BottomNavigationAction
            className={classes.action}
            label={t('settingsUser')}
            icon={icon(SolarUserDuotone)}
            value="account"
          />
        )}
      </BottomNavigation>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={handleAccount}>
          <Typography color="textPrimary">{t('settingsUser')}</Typography>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <Typography color="error">{t('loginLogout')}</Typography>
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default BottomMenu;
