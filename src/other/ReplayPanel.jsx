import { useEffect, useMemo, useState } from 'react';
import { ButtonBase, Collapse, IconButton, Paper, Slider, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import dayjs from 'dayjs';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useAttributePreference } from '../common/util/preferences';
import {
  distanceFromMeters,
  distanceUnitString,
  speedFromKnots,
  speedUnitString,
} from '../common/util/converter';
import { formatTime } from '../common/util/formatter';
import useAddress from '../common/util/useAddress';
import { deviceStateColors } from '../map/core/preloadImages';
import { brandColor } from '../common/theme/brand';
import {
  SolarClockDuotone,
  SolarKeyDuotone,
  SolarMapPointDuotone,
  SolarPause,
  SolarPlay,
  SolarRoutingDuotone,
  SolarStopwatchDuotone,
} from '../common/components/SolarIcons';

export const playbackSpeeds = [1, 2, 3, 5];

const useStyles = makeStyles()((theme) => ({
  panel: {
    borderRadius: theme.spacing(2.5, 2.5, 0, 0),
    overflow: 'hidden',
    [theme.breakpoints.up('md')]: {
      borderRadius: theme.spacing(2.5),
    },
  },
  handle: {
    width: '100%',
    height: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&::before': {
      content: '""',
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.palette.divider,
    },
  },
  section: {
    padding: theme.spacing(0, 1.5, 1),
  },
  // play | slider + range | speed, with the controls centered on the slider block
  player: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr) auto',
    alignItems: 'center',
    columnGap: theme.spacing(1.25),
  },
  play: {
    width: 36,
    height: 36,
    color: theme.palette.common.white,
    backgroundColor: brandColor,
    '& svg': {
      fontSize: 18,
    },
    '&:hover': {
      backgroundColor: alpha(brandColor, 0.85),
    },
    '&.Mui-disabled': {
      color: theme.palette.common.white,
      backgroundColor: alpha(brandColor, 0.4),
    },
  },
  sliderBox: {
    padding: theme.spacing(0, 0.75),
  },
  slider: {
    display: 'block',
    color: brandColor,
    padding: theme.spacing(1, 0),
    '& .MuiSlider-thumb': {
      width: 12,
      height: 12,
    },
  },
  range: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: theme.spacing(-0.5, -0.75, 0),
    fontSize: '0.65rem',
    lineHeight: 1.2,
    color: theme.palette.text.secondary,
  },
  speedButton: {
    minWidth: 40,
    height: 28,
    padding: theme.spacing(0, 1),
    borderRadius: 14,
    fontSize: '0.75rem',
    fontWeight: 700,
    color: brandColor,
    backgroundColor: alpha(brandColor, 0.1),
  },
  summary: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    marginTop: theme.spacing(1),
    paddingTop: theme.spacing(0.75),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  name: {
    minWidth: 0,
    fontSize: '0.8rem',
    fontWeight: 700,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  speedChip: {
    flexShrink: 0,
    padding: theme.spacing(0, 0.75),
    borderRadius: theme.spacing(0.75),
    fontSize: '0.7rem',
    fontWeight: 700,
    lineHeight: 1.6,
    color: deviceStateColors.moving,
    backgroundColor: alpha(deviceStateColors.moving, 0.12),
  },
  distance: {
    marginLeft: 'auto',
    flexShrink: 0,
  },
  iconText: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    fontSize: '0.7rem',
    '& svg': {
      fontSize: 15,
      color: brandColor,
    },
  },
  details: {
    maxHeight: '45vh',
    overflowY: 'auto',
  },
  detailSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.75),
    padding: theme.spacing(1, 1.5),
    borderTop: `6px solid ${theme.palette.action.hover}`,
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    fontSize: '0.75rem',
    lineHeight: 1.4,
    '& > svg': {
      flexShrink: 0,
      fontSize: 16,
      color: brandColor,
    },
  },
  point: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  pointBadge: {
    flexShrink: 0,
    width: 20,
    height: 20,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.common.white,
    fontSize: '0.65rem',
    fontWeight: 700,
  },
  pointText: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    fontSize: '0.75rem',
    lineHeight: 1.4,
  },
}));

const formatDuration = (milliseconds, t) => {
  const totalMinutes = Math.round(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours
    ? `${hours}${t('sharedHourAbbreviation')} ${minutes}${t('sharedMinuteAbbreviation')}`
    : `${minutes}${t('sharedMinuteAbbreviation')}`;
};

const haversine = (a, b) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
};

// Debounced value so addresses are only looked up once the playhead settles
const useSettled = (value, delay) => {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return settled;
};

const coordinatesText = (position) =>
  `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`;

const Point = ({ classes, letter, color, position }) => {
  const address = useAddress(position.latitude, position.longitude, position.address);
  return (
    <div className={classes.point}>
      <div className={classes.pointBadge} style={{ backgroundColor: color }}>
        {letter}
      </div>
      <div className={classes.pointText}>
        <Typography variant="caption" color="textSecondary">
          {formatTime(position.fixTime, 'seconds')}
        </Typography>
        <span>{address || coordinatesText(position)}</span>
      </div>
    </div>
  );
};

const ReplayPanel = ({
  deviceName,
  positions,
  index,
  setIndex,
  playing,
  setPlaying,
  speed,
  setSpeed,
}) => {
  const { classes } = useStyles();
  const t = useTranslation();

  const [expanded, setExpanded] = useState(false);

  const speedUnit = useAttributePreference('speedUnit');
  const distanceUnit = useAttributePreference('distanceUnit');

  const first = positions[0];
  const last = positions[positions.length - 1];
  const position = positions[index];

  // cumulative distance (meters) and moving time (ms) up to each position
  const { distances, movingTimes } = useMemo(() => {
    const distanceList = [0];
    const movingList = [0];
    for (let i = 1; i < positions.length; i += 1) {
      const previous = positions[i - 1];
      const current = positions[i];
      const step = current.attributes.distance ?? haversine(previous, current);
      distanceList.push(distanceList[i - 1] + step);
      const interval = new Date(current.fixTime) - new Date(previous.fixTime);
      const moving = previous.attributes.motion ?? previous.speed > 0;
      movingList.push(movingList[i - 1] + (moving ? interval : 0));
    }
    return { distances: distanceList, movingTimes: movingList };
  }, [positions]);

  // how long the current ignition (or motion) state has lasted
  const statusText = useMemo(() => {
    const key = position.attributes.hasOwnProperty('ignition') ? 'ignition' : 'motion';
    const value = position.attributes[key];
    if (value === undefined) {
      return '-';
    }
    let start = index;
    while (start > 0 && positions[start - 1].attributes[key] === value) {
      start -= 1;
    }
    const duration = new Date(position.fixTime) - new Date(positions[start].fixTime);
    const label = key === 'ignition' ? 'ACC' : t('positionMotion');
    return `${label} ${value ? 'ON' : 'OFF'} · ${formatDuration(duration, t)}`;
  }, [positions, index, position, t]);

  const settledIndex = useSettled(index, 600);
  const settledPosition = positions[Math.min(settledIndex, positions.length - 1)];
  const address = useAddress(
    settledPosition.latitude,
    settledPosition.longitude,
    settledPosition.address,
    expanded && !playing,
  );

  const formatDistance = (meters) => distanceFromMeters(meters, distanceUnit).toFixed(1);
  const rangeTime = (value) => dayjs(value).format('MM-DD HH:mm:ss');
  const nextSpeed = () =>
    setSpeed(playbackSpeeds[(playbackSpeeds.indexOf(speed) + 1) % playbackSpeeds.length]);

  return (
    <Paper elevation={6} className={classes.panel}>
      <ButtonBase
        className={classes.handle}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      />
      <div className={classes.section}>
        <div className={classes.player}>
          <IconButton
            className={classes.play}
            onClick={() => setPlaying(!playing)}
            disabled={index >= positions.length - 1}
          >
            {playing ? <SolarPause /> : <SolarPlay />}
          </IconButton>
          <div className={classes.sliderBox}>
            <Slider
              className={classes.slider}
              size="small"
              max={positions.length - 1}
              value={index}
              onChange={(_, value) => setIndex(value)}
            />
            <div className={classes.range}>
              <span>{rangeTime(first.fixTime)}</span>
              <span>{rangeTime(last.fixTime)}</span>
            </div>
          </div>
          <ButtonBase className={classes.speedButton} onClick={nextSpeed}>
            {`x${speed}`}
          </ButtonBase>
        </div>
        <div className={classes.summary}>
          <Typography className={classes.name}>{deviceName}</Typography>
          <Typography className={classes.speedChip}>
            {`${Math.round(speedFromKnots(position.speed, speedUnit))} ${speedUnitString(speedUnit, t)}`}
          </Typography>
          <Typography
            component="span"
            className={`${classes.iconText} ${classes.distance}`}
            title={t('sharedDistance')}
          >
            <SolarRoutingDuotone />
            {`${formatDistance(distances[index])} / ${formatDistance(
              distances[distances.length - 1],
            )} ${distanceUnitString(distanceUnit, t)}`}
          </Typography>
        </div>
      </div>
      <Collapse in={expanded} unmountOnExit>
        <div className={classes.details}>
          <div className={classes.detailSection}>
            <div className={classes.detailRow} title={t('reportDuration')}>
              <SolarStopwatchDuotone />
              <span>{formatDuration(movingTimes[index], t)}</span>
            </div>
            <div className={classes.detailRow} title={t('reportTimeType')}>
              <SolarClockDuotone />
              <span>{formatTime(position.fixTime, 'seconds')}</span>
            </div>
            <div className={classes.detailRow} title={t('deviceStatus')}>
              <SolarKeyDuotone />
              <span>{statusText}</span>
            </div>
            <div className={classes.detailRow} title={t('positionAddress')}>
              <SolarMapPointDuotone />
              <span>{address || coordinatesText(position)}</span>
            </div>
          </div>
          <div className={classes.detailSection}>
            <Point classes={classes} letter="S" color={deviceStateColors.moving} position={first} />
            <Point classes={classes} letter="E" color={brandColor} position={last} />
          </div>
        </div>
      </Collapse>
    </Paper>
  );
};

export default ReplayPanel;
