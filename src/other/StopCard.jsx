import { IconButton, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import { useTranslation } from '../common/components/LocalizationProvider';
import { formatTime } from '../common/util/formatter';
import useAddress from '../common/util/useAddress';
import {
  SolarClockDuotone,
  SolarCloseCircleDuotone,
  SolarMapPointDuotone,
  SolarStopwatchDuotone,
} from '../common/components/SolarIcons';
import { deviceStateColors } from '../map/core/preloadImages';
import { brandColor } from '../common/theme/brand';

const useStyles = makeStyles()((theme) => ({
  card: {
    width: '100%',
    maxWidth: 280,
    padding: theme.spacing(1, 1, 1, 1.25),
    borderRadius: theme.spacing(1.75),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
  },
  badge: {
    flexShrink: 0,
    width: 22,
    height: 22,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.common.white,
    backgroundColor: deviceStateColors.parking,
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  title: {
    fontWeight: 700,
  },
  duration: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.25),
    color: brandColor,
    fontWeight: 600,
    '& svg': {
      fontSize: 14,
    },
  },
  close: {
    padding: 2,
    '& svg': {
      fontSize: 18,
    },
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    padding: theme.spacing(0.5, 0.75),
    borderRadius: theme.spacing(1),
    backgroundColor: alpha(brandColor, 0.06),
    '& > svg': {
      flexShrink: 0,
      color: brandColor,
      fontSize: 16,
    },
  },
  text: {
    minWidth: 0,
    lineHeight: 1.35,
  },
}));

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

const Row = ({ classes, icon, children }) => (
  <div className={classes.row}>
    {icon}
    <Typography variant="caption" className={classes.text}>
      {children}
    </Typography>
  </div>
);

const StopCard = ({ stop, number, onClose }) => {
  const { classes } = useStyles();
  const t = useTranslation();

  const address = useAddress(stop.latitude, stop.longitude, stop.address);

  return (
    <Paper elevation={3} className={classes.card}>
      <div className={classes.header}>
        <div className={classes.badge}>{number}</div>
        <Typography variant="subtitle2" className={classes.title}>
          {`${t('reportStop')} ${number}`}
        </Typography>
        <Typography variant="caption" className={classes.duration} title={t('reportDuration')}>
          <SolarStopwatchDuotone />
          {formatDuration(stop.duration, t)}
        </Typography>
        <IconButton size="small" className={classes.close} onClick={onClose}>
          <SolarCloseCircleDuotone />
        </IconButton>
      </div>
      <Row classes={classes} icon={<SolarClockDuotone />}>
        {`${formatTime(stop.startTime, 'minutes')} – ${formatTime(stop.endTime, 'minutes')}`}
      </Row>
      <Row classes={classes} icon={<SolarMapPointDuotone />}>
        {address && (
          <>
            {address}
            <br />
          </>
        )}
        {`${stop.latitude.toFixed(6)}, ${stop.longitude.toFixed(6)}`}
      </Row>
    </Paper>
  );
};

export default StopCard;
