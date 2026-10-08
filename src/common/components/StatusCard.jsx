import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import { Card, Typography, IconButton, Menu, MenuItem, ButtonBase } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import dayjs from 'dayjs';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import KeyIcon from '@mui/icons-material/Key';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import BatteryStdIcon from '@mui/icons-material/BatteryStd';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import AssistantDirectionOutlinedIcon from '@mui/icons-material/AssistantDirectionOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { useTranslation } from './LocalizationProvider';
import RemoveDialog from './RemoveDialog';
import AddressValue from './AddressValue';
import { useDeviceReadonly, useRestriction } from '../util/permissions';
import { devicesActions } from '../../store';
import { useCatch, useCatchCallback } from '../../reactHelper';
import { useAttributePreference } from '../util/preferences';
import { getDeviceState } from '../util/formatter';
import { speedFromKnots, speedUnitString } from '../util/converter';
import { deviceStateColors, mapIconKey, mapIcons } from '../../map/core/preloadImages';
import fetchOrThrow from '../util/fetchOrThrow';
import { brandColor } from '../theme/brand';

const stateLabels = {
  moving: 'deviceStateMoving',
  parking: 'deviceStateParked',
  offline: 'deviceStateOffline',
};

const useStyles = makeStyles()((theme, { desktopPadding, color }) => ({
  root: {
    pointerEvents: 'none',
    position: 'fixed',
    zIndex: 5,
    left: '50%',
    [theme.breakpoints.up('md')]: {
      left: `calc(50% + ${desktopPadding} / 2)`,
      bottom: theme.spacing(3),
    },
    [theme.breakpoints.down('md')]: {
      left: '50%',
      bottom: `calc(${theme.spacing(3)} + ${theme.dimensions.bottomBarHeight}px)`,
    },
    transform: 'translateX(-50%)',
  },
  card: {
    pointerEvents: 'auto',
    width: 440,
    maxWidth: `calc(100vw - ${theme.spacing(4)})`,
    padding: theme.spacing(1.25, 1.5, 1.5),
    borderRadius: theme.spacing(2.5),
    backgroundColor: theme.palette.background.paper,
    backgroundImage: `linear-gradient(${alpha(brandColor, 0.04)}, ${alpha(brandColor, 0.04)})`,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1, 1.25, 1.25),
      gap: theme.spacing(0.75),
    },
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    cursor: 'move',
  },
  glyph: {
    flexShrink: 0,
    width: 28,
    height: 28,
    backgroundColor: color,
    maskSize: 'contain',
    maskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
  },
  photo: {
    flexShrink: 0,
    width: 32,
    height: 32,
    borderRadius: '50%',
    objectFit: 'cover',
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontWeight: 700,
    lineHeight: 1.25,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  subtitle: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: theme.spacing(1.5),
  },
  stateInline: {
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  stateSide: {
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  state: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    color,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    '&::before': {
      content: '""',
      width: 8,
      height: 8,
      borderRadius: '50%',
      backgroundColor: color,
    },
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: theme.spacing(0.75),
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(0.75),
    padding: theme.spacing(0.75, 0.5),
    borderRadius: theme.spacing(1.25),
    backgroundColor: alpha(brandColor, 0.08),
    minWidth: 0,
    '& svg': {
      color: brandColor,
      fontSize: 20,
    },
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      gap: 0,
      '& svg': {
        fontSize: 16,
      },
    },
  },
  statText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 0,
  },
  statLabel: {
    fontSize: '0.7rem',
    lineHeight: 1.2,
  },
  statValue: {
    fontWeight: 700,
    fontSize: '0.9rem',
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
  },
  address: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    padding: theme.spacing(0.75, 1),
    borderRadius: theme.spacing(1.25),
    backgroundColor: alpha(theme.palette.text.primary, 0.06),
    minWidth: 0,
    '& svg': {
      color: brandColor,
      fontSize: 18,
    },
  },
  addressText: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: theme.spacing(0.75),
  },
  action: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.25),
    padding: theme.spacing(0.75, 0.25),
    borderRadius: theme.spacing(1.25),
    backgroundColor: alpha(brandColor, 0.08),
    color: theme.palette.text.primary,
    textAlign: 'center',
    '& svg': {
      color: brandColor,
      fontSize: 20,
    },
    '&:hover': {
      backgroundColor: alpha(brandColor, 0.16),
    },
    '&.Mui-disabled': {
      opacity: 0.45,
    },
  },
  actionActive: {
    backgroundColor: brandColor,
    color: theme.palette.common.white,
    '& svg': {
      color: theme.palette.common.white,
    },
    '&:hover': {
      backgroundColor: brandColor,
    },
  },
  actionLabel: {
    fontSize: '0.7rem',
    lineHeight: 1.15,
  },
}));

const Stat = ({ classes, icon, label, value }) => (
  <div className={classes.stat}>
    {icon}
    <div className={classes.statText}>
      <Typography color="textSecondary" className={classes.statLabel} noWrap>
        {label}
      </Typography>
      <Typography className={classes.statValue}>{value}</Typography>
    </div>
  </div>
);

const Action = ({ classes, cx, icon, label, active, ...props }) => (
  <ButtonBase className={cx(classes.action, active && classes.actionActive)} {...props}>
    {icon}
    <Typography className={classes.actionLabel}>{label}</Typography>
  </ButtonBase>
);

const StatusCard = ({ deviceId, position, onClose, disableActions, desktopPadding = 0 }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();

  const readonly = useRestriction('readonly');
  const deviceReadonly = useDeviceReadonly();

  const shareDisabled = useSelector((state) => state.session.server.attributes.disableShare);
  const user = useSelector((state) => state.session.user);
  const device = useSelector((state) => state.devices.items[deviceId]);
  const follow = useSelector((state) => state.devices.follow);

  const speedUnit = useAttributePreference('speedUnit');
  const navigationAppLink = useAttributePreference('navigationAppLink');
  const navigationAppTitle = useAttributePreference('navigationAppTitle');

  const state = getDeviceState(device, position);
  const { classes, cx } = useStyles({ desktopPadding, color: deviceStateColors[state] });

  const [anchorEl, setAnchorEl] = useState(null);
  const [removing, setRemoving] = useState(false);

  const handleRemove = useCatch(async (removed) => {
    if (removed) {
      const response = await fetchOrThrow('/api/devices');
      dispatch(devicesActions.refresh(await response.json()));
    }
    setRemoving(false);
  });

  const handleGeofence = useCatchCallback(async () => {
    const newItem = {
      name: t('sharedGeofence'),
      area: `CIRCLE (${position.latitude} ${position.longitude}, 50)`,
    };
    const response = await fetchOrThrow('/api/geofences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
    const item = await response.json();
    await fetchOrThrow('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: position.deviceId, geofenceId: item.id }),
    });
    navigate(`/settings/geofence/${item.id}`);
  }, [navigate, position, t]);

  const deviceImage = device?.attributes?.deviceImage;
  const glyphUrl = device && `url("${mapIcons[mapIconKey(device.category)]}")`;
  const attributes = position?.attributes || {};
  const coordinates = position && `${position.latitude},${position.longitude}`;

  const speed = position
    ? `${Math.round(speedFromKnots(position.speed, speedUnit))} ${speedUnitString(speedUnit, t)}`
    : '-';
  const ignition = attributes.hasOwnProperty('ignition')
    ? attributes.ignition
      ? 'ON'
      : 'OFF'
    : '-';
  const satellites = attributes.hasOwnProperty('sat') ? attributes.sat : '-';
  const battery = attributes.hasOwnProperty('batteryLevel')
    ? `${Math.round(attributes.batteryLevel)}%`
    : '-';

  const navigationLink =
    position &&
    (navigationAppLink
      ? navigationAppLink
          .replace('{latitude}', position.latitude)
          .replace('{longitude}', position.longitude)
      : `https://www.google.com/maps/dir/?api=1&destination=${coordinates}`);

  return (
    <>
      <div className={classes.root}>
        {device && (
          <Rnd
            default={{ x: 0, y: 0, width: 'auto', height: 'auto' }}
            enableResizing={false}
            dragHandleClassName="draggable-header"
            cancel="button"
            style={{ position: 'relative' }}
          >
            <Card elevation={6} className={classes.card}>
              <div className={cx(classes.header, 'draggable-header')}>
                {deviceImage ? (
                  <img
                    className={classes.photo}
                    src={`/api/media/${device.uniqueId}/${deviceImage}`}
                    alt=""
                  />
                ) : (
                  <span
                    className={classes.glyph}
                    style={{ maskImage: glyphUrl, WebkitMaskImage: glyphUrl }}
                  />
                )}
                <div className={classes.title}>
                  <Typography variant="subtitle1" className={classes.name}>
                    {device.name}
                  </Typography>
                  <div className={classes.subtitle}>
                    {position && (
                      <Typography variant="caption" color="textSecondary">
                        {dayjs(position.fixTime).format('DD MMM YYYY, HH:mm')}
                      </Typography>
                    )}
                    <Typography variant="body2" className={cx(classes.state, classes.stateInline)}>
                      {t(stateLabels[state])}
                    </Typography>
                  </div>
                </div>
                <Typography className={cx(classes.state, classes.stateSide)}>
                  {t(stateLabels[state])}
                </Typography>
                <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
                  <MoreVertIcon />
                </IconButton>
                <IconButton size="small" onClick={onClose} onTouchStart={onClose}>
                  <CloseIcon />
                </IconButton>
              </div>
              {position && (
                <>
                  <div className={classes.stats}>
                    <Stat
                      classes={classes}
                      icon={<SpeedOutlinedIcon />}
                      label={t('deviceCardSpeed')}
                      value={speed}
                    />
                    <Stat
                      classes={classes}
                      icon={<KeyIcon />}
                      label={t('deviceCardIgnition')}
                      value={ignition}
                    />
                    <Stat
                      classes={classes}
                      icon={<SatelliteAltIcon />}
                      label={t('deviceCardSatellites')}
                      value={satellites}
                    />
                    <Stat
                      classes={classes}
                      icon={<BatteryStdIcon />}
                      label={t('deviceCardBattery')}
                      value={battery}
                    />
                  </div>
                  <div className={classes.address}>
                    <PlaceOutlinedIcon />
                    <Typography variant="body2" className={classes.addressText}>
                      <AddressValue
                        latitude={position.latitude}
                        longitude={position.longitude}
                        originalAddress={position.address}
                      />
                    </Typography>
                  </div>
                </>
              )}
              <div className={classes.actions}>
                <Action
                  classes={classes}
                  cx={cx}
                  icon={<GpsFixedIcon />}
                  label={t('deviceFollow')}
                  active={follow}
                  onClick={() => dispatch(devicesActions.toggleFollow())}
                  disabled={disableActions || !position}
                />
                <Action
                  classes={classes}
                  cx={cx}
                  icon={<PlayCircleOutlinedIcon />}
                  label={t('deviceCardPlayback')}
                  onClick={() => navigate(`/replay?deviceId=${deviceId}`)}
                  disabled={disableActions || !position}
                />
                <Action
                  classes={classes}
                  cx={cx}
                  icon={<AssistantDirectionOutlinedIcon />}
                  label={
                    navigationAppLink && navigationAppTitle
                      ? navigationAppTitle
                      : t('deviceCardNavigate')
                  }
                  component="a"
                  href={navigationLink}
                  target="_blank"
                  disabled={!position}
                />
                <Action
                  classes={classes}
                  cx={cx}
                  icon={<MapOutlinedIcon />}
                  label={t('linkGoogleMaps')}
                  component="a"
                  href={`https://www.google.com/maps/search/?api=1&query=${coordinates}`}
                  target="_blank"
                  disabled={!position}
                />
                <Action
                  classes={classes}
                  cx={cx}
                  icon={<InfoOutlinedIcon />}
                  label={t('deviceCardDetails')}
                  onClick={() => navigate(`/position/${position.id}`)}
                  disabled={!position}
                />
              </div>
            </Card>
          </Rnd>
        )}
      </div>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem
          onClick={() => navigate(`/settings/device/${deviceId}/command`)}
          disabled={disableActions}
        >
          {t('commandTitle')}
        </MenuItem>
        <MenuItem
          onClick={() => navigate(`/settings/device/${deviceId}`)}
          disabled={disableActions || deviceReadonly}
        >
          {t('sharedEdit')}
        </MenuItem>
        {position && (
          <MenuItem
            onClick={() => navigate(`/stream?deviceId=${deviceId}`)}
            disabled={position.protocol !== 'jt808'}
          >
            {t('linkLiveVideo')}
          </MenuItem>
        )}
        {position && !readonly && (
          <MenuItem onClick={handleGeofence}>{t('sharedCreateGeofence')}</MenuItem>
        )}
        {position && (
          <MenuItem
            component="a"
            target="_blank"
            href={`https://maps.apple.com/?ll=${coordinates}`}
          >
            {t('linkAppleMaps')}
          </MenuItem>
        )}
        {position && (
          <MenuItem
            component="a"
            target="_blank"
            href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${position.latitude}%2C${position.longitude}&heading=${position.course}`}
          >
            {t('linkStreetView')}
          </MenuItem>
        )}
        {!shareDisabled && !user.temporary && (
          <MenuItem onClick={() => navigate(`/settings/device/${deviceId}/share`)}>
            {t('sharedShare')}
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setRemoving(true);
          }}
          disabled={disableActions || deviceReadonly}
        >
          <Typography color="error">{t('sharedRemove')}</Typography>
        </MenuItem>
      </Menu>
      <RemoveDialog
        open={removing}
        endpoint="devices"
        itemId={deviceId}
        onResult={(removed) => handleRemove(removed)}
      />
    </>
  );
};

export default StatusCard;
