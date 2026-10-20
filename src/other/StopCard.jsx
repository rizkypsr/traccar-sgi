import { useState } from 'react';
import { useSelector } from 'react-redux';
import { IconButton, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { useLocalization, useTranslation } from '../common/components/LocalizationProvider';
import { formatTime } from '../common/util/formatter';
import { useAsyncTask } from '../reactHelper';
import { deviceStateColors } from '../map/core/preloadImages';
import { brandColor } from '../common/theme/brand';

const useStyles = makeStyles()((theme) => ({
  card: {
    padding: theme.spacing(1.5, 2, 2),
    borderRadius: theme.spacing(2.5),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.25),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
  },
  badge: {
    flexShrink: 0,
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.common.white,
    backgroundColor: deviceStateColors.parking,
    fontWeight: 700,
  },
  title: {
    flex: 1,
    fontWeight: 700,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.25),
    padding: theme.spacing(1, 1.25),
    borderRadius: theme.spacing(1.25),
    backgroundColor: alpha(brandColor, 0.06),
    '& > svg': {
      color: brandColor,
      fontSize: 20,
    },
  },
  rowText: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '0.75rem',
    lineHeight: 1.3,
  },
}));

// Server geocoder first; if it is disabled or returns nothing, fall back to public Nominatim.
// Results are cached per coordinate to stay within Nominatim's usage limits.
const addressCache = new Map();

const lookupAddress = async (latitude, longitude, geocoderEnabled, language, signal) => {
  const key = `${latitude.toFixed(5)},${longitude.toFixed(5)},${language}`;
  if (addressCache.has(key)) {
    return addressCache.get(key);
  }
  let address = '';
  if (geocoderEnabled) {
    try {
      const query = new URLSearchParams({ latitude, longitude });
      const response = await fetch(`/api/server/geocode?${query.toString()}`, { signal });
      if (response.ok) {
        address = (await response.text()).trim();
      }
    } catch (error) {
      if (error.name === 'AbortError') throw error;
    }
  }
  if (!address) {
    const query = new URLSearchParams({
      format: 'jsonv2',
      lat: latitude,
      lon: longitude,
      'accept-language': language,
    });
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${query.toString()}`,
      {
        signal,
      },
    );
    if (response.ok) {
      address = (await response.json()).display_name || '';
    }
  }
  if (address) {
    addressCache.set(key, address);
  }
  return address;
};

const formatDuration = (value, t) => {
  const totalSeconds = Math.round(value / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  const parts = [];
  if (hours) {
    parts.push(`${hours}${t('sharedHourAbbreviation')}`);
  }
  parts.push(
    `${hours ? String(minutes).padStart(2, '0') : minutes}${t('sharedMinuteAbbreviation')}`,
  );
  parts.push(`${seconds}${t('sharedSecondAbbreviation')}`);
  return parts.join(' ');
};

const Row = ({ classes, icon, label, children }) => (
  <div className={classes.row}>
    {icon}
    <div className={classes.rowText}>
      <Typography color="textSecondary" className={classes.label}>
        {label}
      </Typography>
      <Typography variant="body2">{children}</Typography>
    </div>
  </div>
);

const StopCard = ({ stop, number, onClose }) => {
  const { classes } = useStyles();
  const t = useTranslation();

  const { language } = useLocalization();
  const geocoderEnabled = useSelector((state) => state.session.server.geocoderEnabled);

  const [address, setAddress] = useState(stop.address);

  useAsyncTask(
    async ({ signal }) => {
      setAddress(stop.address);
      if (!stop.address) {
        try {
          setAddress(
            await lookupAddress(
              stop.latitude,
              stop.longitude,
              geocoderEnabled,
              language.replace('_', '-'),
              signal,
            ),
          );
        } catch (error) {
          if (error.name === 'AbortError') throw error;
        }
      }
    },
    [stop, geocoderEnabled, language],
  );

  return (
    <Paper elevation={3} className={classes.card}>
      <div className={classes.header}>
        <div className={classes.badge}>{number}</div>
        <Typography variant="h6" className={classes.title}>
          {`${t('reportStop')} ${number}`}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>
      <Row classes={classes} icon={<TimerOutlinedIcon />} label={t('reportDuration')}>
        {formatDuration(stop.duration, t)}
      </Row>
      <Row classes={classes} icon={<ScheduleIcon />} label={t('reportTimeType')}>
        {`${formatTime(stop.startTime, 'minutes')} – ${formatTime(stop.endTime, 'minutes')}`}
      </Row>
      <Row classes={classes} icon={<PlaceOutlinedIcon />} label={t('sharedLocation')}>
        {address && (
          <>
            {address}
            <br />
          </>
        )}
        {`Lat: ${stop.latitude.toFixed(6)}, Lng: ${stop.longitude.toFixed(6)}`}
      </Row>
    </Paper>
  );
};

export default StopCard;
