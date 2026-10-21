import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { alpha } from '@mui/material/styles';
import { brandColor } from '../common/theme/brand';
import {
  IconButton,
  Tooltip,
  Avatar,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { devicesActions } from '../store';
import {
  formatAlarm,
  formatBoolean,
  formatPercentage,
  formatStatus,
  getDeviceState,
} from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { deviceIconUrl, deviceStateColors } from '../map/core/preloadImages';
import {
  SolarBatteryChargeDuotone,
  SolarBatteryDuotone,
  SolarBatteryHalfDuotone,
  SolarBatteryLowDuotone,
  SolarDangerDuotone,
  SolarKeyDuotone,
} from '../common/components/SolarIcons';
import { useAdministrator } from '../common/util/permissions';
import { useAttributePreference } from '../common/util/preferences';
import GeofencesValue from '../common/components/GeofencesValue';
import DriverValue from '../common/components/DriverValue';
import MotionBar from './components/MotionBar';

dayjs.extend(relativeTime);

// onGradient: the mobile list sits on the brand gradient, so content switches to white tones
const useStyles = makeStyles()((theme, { onGradient }) => {
  const white = theme.palette.common.white;
  return {
    avatar: {
      backgroundColor: 'transparent',
    },
    icon: {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
    },
    batteryText: {
      fontSize: '0.75rem',
      fontWeight: 'normal',
      lineHeight: '0.875rem',
    },
    // status colors shared with map labels and the device card
    success: {
      color: onGradient ? white : deviceStateColors.moving,
    },
    warning: {
      color: onGradient ? alpha(white, 0.85) : '#F59E0B',
    },
    error: {
      color: onGradient ? '#FFE08A' : brandColor,
    },
    neutral: {
      color: onGradient ? alpha(white, 0.6) : deviceStateColors.offline,
    },
    statusIcon: {
      fontSize: 18,
    },
    row: {
      height: 64,
      margin: theme.spacing(0.5, 1),
      padding: theme.spacing(0, 1, 0, 1.5),
      borderRadius: theme.spacing(1.5),
      transition: theme.transitions.create('background-color', {
        duration: theme.transitions.duration.shortest,
      }),
      '&:hover': {
        backgroundColor: onGradient ? alpha(white, 0.1) : alpha(brandColor, 0.05),
      },
      '&.Mui-selected, &.Mui-selected:hover': {
        backgroundColor: onGradient ? alpha(white, 0.18) : alpha(brandColor, 0.1),
      },
      '& .MuiListItemText-primary': {
        fontWeight: 500,
        ...(onGradient && { color: white }),
      },
      '& .MuiListItemText-secondary': {
        ...(onGradient && { color: alpha(white, 0.8) }),
      },
      '&.Mui-selected .MuiListItemText-primary': {
        fontWeight: 700,
      },
    },
  };
});

const batteryIcon = (attributes, classes, cx) => {
  const level = attributes.batteryLevel;
  const levelClass =
    (level > 70 && classes.success) || (level > 30 && classes.warning) || classes.error;
  const className = cx(classes.statusIcon, levelClass);
  if (attributes.charge) {
    return <SolarBatteryChargeDuotone className={className} />;
  }
  if (level > 70) {
    return <SolarBatteryDuotone className={className} />;
  }
  if (level > 30) {
    return <SolarBatteryHalfDuotone className={className} />;
  }
  return <SolarBatteryLowDuotone className={className} />;
};

const DeviceRow = ({ devices, index, style }) => {
  const theme = useTheme();
  const onGradient = useMediaQuery(theme.breakpoints.down('md'));
  const { classes, cx } = useStyles({ onGradient });
  const dispatch = useDispatch();
  const t = useTranslation();

  const admin = useAdministrator();
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);

  const item = devices[index];
  const position = useSelector((state) => state.session.positions[item.id]);

  const devicePrimary = useAttributePreference('devicePrimary', 'name');
  const deviceSecondary = useAttributePreference('deviceSecondary', '');

  const resolveFieldValue = (field) => {
    if (field === 'geofenceIds') {
      const geofenceIds = position?.geofenceIds;
      return geofenceIds?.length ? <GeofencesValue geofenceIds={geofenceIds} /> : null;
    }
    if (field === 'driverUniqueId') {
      const driverUniqueId = position?.attributes?.driverUniqueId;
      return driverUniqueId ? <DriverValue driverUniqueId={driverUniqueId} /> : null;
    }
    if (field === 'motion') {
      return <MotionBar deviceId={item.id} />;
    }
    return item[field];
  };

  const primaryValue = resolveFieldValue(devicePrimary);
  const secondaryValue = resolveFieldValue(deviceSecondary);

  const secondaryText = () => {
    let status;
    if (item.status === 'online' || !item.lastUpdate) {
      status = formatStatus(item.status, t);
    } else {
      status = dayjs(item.lastUpdate).fromNow();
    }
    return (
      <>
        {secondaryValue && (
          <>
            {secondaryValue}
            {' • '}
          </>
        )}
        <span className={item.status === 'online' ? classes.success : classes.neutral}>
          {status}
        </span>
      </>
    );
  };

  return (
    <div style={style}>
      <ListItemButton
        key={item.id}
        onClick={() => dispatch(devicesActions.selectId(item.id))}
        disabled={!admin && item.disabled}
        selected={selectedDeviceId === item.id}
        className={classes.row}
      >
        <ListItemAvatar>
          <Avatar variant="square" className={classes.avatar}>
            <img
              className={classes.icon}
              src={deviceIconUrl(item.category, getDeviceState(item, position))}
              alt=""
            />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={primaryValue}
          secondary={secondaryText()}
          slots={{
            primary: Typography,
            secondary: Typography,
          }}
          slotProps={{
            primary: { noWrap: true },
            secondary: { noWrap: true },
          }}
        />
        {position && (
          <>
            {position.attributes.hasOwnProperty('alarm') && (
              <Tooltip title={`${t('eventAlarm')}: ${formatAlarm(position.attributes.alarm, t)}`}>
                <IconButton size="small">
                  <SolarDangerDuotone className={cx(classes.statusIcon, classes.error)} />
                </IconButton>
              </Tooltip>
            )}
            {position.attributes.hasOwnProperty('ignition') && (
              <Tooltip
                title={`${t('positionIgnition')}: ${formatBoolean(position.attributes.ignition, t)}`}
              >
                <IconButton size="small">
                  <SolarKeyDuotone
                    className={cx(
                      classes.statusIcon,
                      position.attributes.ignition ? classes.success : classes.neutral,
                    )}
                  />
                </IconButton>
              </Tooltip>
            )}
            {position.attributes.hasOwnProperty('batteryLevel') && (
              <Tooltip
                title={`${t('positionBatteryLevel')}: ${formatPercentage(position.attributes.batteryLevel)}`}
              >
                <IconButton size="small">
                  {batteryIcon(position.attributes, classes, cx)}
                </IconButton>
              </Tooltip>
            )}
          </>
        )}
      </ListItemButton>
    </div>
  );
};

export default DeviceRow;
