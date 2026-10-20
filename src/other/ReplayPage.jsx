import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GlobalStyles,
  IconButton,
  Paper,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { brandColor } from '../common/theme/brand';
import * as maplibregl from 'maplibre-gl';
import { makeStyles } from 'tss-react/mui';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MapView, { map, useMapReady } from '../map/core/MapView';
import { toMapCoordinates } from '../map/core/mapUtil';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import MapPositionMarkers from '../map/MapPositionMarkers';
import MapStopMarkers from '../map/MapStopMarkers';
import StopCard from './StopCard';
import ReplayPanel from './ReplayPanel';
import ReportFilter from '../reports/components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useCatchCallback } from '../reactHelper';
import MapGeofence from '../map/MapGeofence';
import MapScale from '../map/MapScale';
import BackIcon from '../common/components/BackIcon';
import { SolarDownloadDuotone, SolarTuningDuotone } from '../common/components/SolarIcons';
import fetchOrThrow from '../common/util/fetchOrThrow';
import MapOverlay from '../map/overlay/MapOverlay';

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    zIndex: 3,
    left: 0,
    top: 0,
    gap: theme.spacing(1),
    margin: theme.spacing(1.5),
    width: theme.dimensions.drawerWidthDesktop,
    [theme.breakpoints.down('md')]: {
      width: `calc(100% - ${theme.spacing(2)})`,
      margin: theme.spacing(1),
    },
  },
  // floating rounded cards, matching the rest of the redesigned UI
  card: {
    borderRadius: theme.spacing(2.5),
    overflow: 'hidden',
    boxShadow: theme.shadows[6],
  },
  toolbar: {
    gap: theme.spacing(0.5),
    minHeight: 56,
    padding: theme.spacing(0, 1),
  },
  title: {
    flexGrow: 1,
    marginLeft: theme.spacing(0.5),
    fontWeight: 700,
    fontSize: '1.1rem',
  },
  activeButton: {
    color: brandColor,
    backgroundColor: alpha(brandColor, 0.1),
    '&:hover': {
      backgroundColor: alpha(brandColor, 0.16),
    },
  },
  // bottom sheet on mobile, floating card under the sidebar column on desktop
  bottom: {
    position: 'fixed',
    zIndex: 3,
    left: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: theme.dimensions.drawerWidthDesktop,
      margin: theme.spacing(1.5),
    },
  },
  stopCard: {
    [theme.breakpoints.down('md')]: {
      padding: theme.spacing(0, 1),
    },
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
  },
}));

const ReplayPage = () => {
  const t = useTranslation();
  const { classes } = useStyles();
  const navigate = useNavigate();
  const timerRef = useRef();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const [searchParams] = useSearchParams();

  const defaultDeviceId = useSelector((state) => state.devices.selectedId);

  const [positions, setPositions] = useState([]);
  const [stops, setStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [index, setIndex] = useState(0);
  const [selectedDeviceId, setSelectedDeviceId] = useState(defaultDeviceId);
  const [speed, setSpeed] = useState(1);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const loaded = Boolean(from && to && !loading && positions.length);

  // keep the route clear of the floating panels when fitting the camera
  const mapReady = useMapReady();
  const panelRef = useRef();
  const panelHeightRef = useRef(0);
  const [panelMeasured, setPanelMeasured] = useState(false);

  useEffect(() => {
    const element = panelRef.current;
    if (!element) {
      setPanelMeasured(false);
      return undefined;
    }
    const observer = new ResizeObserver(([entry]) => {
      panelHeightRef.current = entry.contentRect.height;
      setPanelMeasured(entry.contentRect.height > 0);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [loaded, filterOpen]);

  useEffect(() => {
    if (!mapReady || !positions.length) {
      return;
    }
    const coordinates = positions.map((item) => toMapCoordinates(item.longitude, item.latitude));
    const bounds = coordinates.reduce(
      (result, item) => result.extend(item),
      new maplibregl.LngLatBounds(coordinates[0], coordinates[0]),
    );
    const margin = 40;
    const panelOffset = panelMeasured ? panelHeightRef.current : 0;
    let padding = desktop
      ? {
          top: margin,
          bottom: margin,
          left: parseInt(theme.dimensions.drawerWidthDesktop, 10) + margin,
          right: margin,
        }
      : { top: 64 + margin, bottom: panelOffset + margin, left: margin, right: margin };
    // fall back to a small uniform padding when the panels leave too little room
    const { clientWidth, clientHeight } = map.getCanvas();
    if (
      padding.left + padding.right > clientWidth - 80 ||
      padding.top + padding.bottom > clientHeight - 80
    ) {
      padding = Math.min(margin, clientWidth / 4, clientHeight / 4);
    }
    try {
      map.fitBounds(bounds, { padding, duration: 0 });
    } catch {
      // map not sized yet; the next layout pass refits
    }
  }, [mapReady, positions, panelMeasured, desktop, theme]);

  const deviceName = useSelector((state) => {
    if (selectedDeviceId) {
      const device = state.devices.items[selectedDeviceId];
      if (device) {
        return device.name;
      }
    }
    return null;
  });

  useEffect(() => {
    if (!from && !to) {
      setPositions([]);
      setStops([]);
      setSelectedStop(null);
    }
  }, [from, to, setPositions]);

  useEffect(() => {
    if (playing && positions.length > 0) {
      timerRef.current = setInterval(() => {
        setIndex((index) => index + 1);
      }, 500 / speed);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [playing, positions, speed]);

  useEffect(() => {
    if (index >= positions.length - 1) {
      clearInterval(timerRef.current);
      setPlaying(false);
    }
  }, [index, positions]);

  const onPointClick = useCallback(
    (_, index) => {
      setIndex(index);
    },
    [setIndex],
  );

  const onStopClick = useCallback(
    (stopNumber) => {
      const stop = stops[stopNumber];
      setSelectedStop(stopNumber);
      let stopIndex = positions.findIndex((position) => position.id === stop.positionId);
      if (stopIndex < 0) {
        const startTime = new Date(stop.startTime).getTime();
        stopIndex = positions.findIndex(
          (position) => new Date(position.fixTime).getTime() >= startTime,
        );
      }
      if (stopIndex >= 0) {
        setPlaying(false);
        setIndex(stopIndex);
      }
    },
    [positions, stops],
  );

  const onShow = useCatchCallback(
    async ({ deviceIds, from, to }) => {
      const deviceId = deviceIds.find(() => true);
      setLoading(true);
      setSelectedDeviceId(deviceId);
      const query = new URLSearchParams({ deviceId, from, to });
      try {
        const [response, stopsResponse] = await Promise.all([
          fetchOrThrow(`/api/positions?${query.toString()}`),
          fetchOrThrow(`/api/reports/stops?${query.toString()}`, {
            headers: { Accept: 'application/json' },
          }),
        ]);
        setIndex(0);
        const positions = await response.json();
        setPositions(positions);
        setStops(await stopsResponse.json());
        setSelectedStop(null);
        if (!positions.length) {
          throw Error(t('sharedNoData'));
        }
        setFilterOpen(false);
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  const handleDownload = () => {
    const query = new URLSearchParams({ deviceId: selectedDeviceId, from, to });
    window.location.assign(`/api/positions/kml?${query.toString()}`);
  };

  return (
    <div className={classes.root}>
      <MapView>
        <MapOverlay />
        <MapGeofence />
        <MapRoutePath positions={positions} solid />
        <MapRoutePoints positions={positions} onClick={onPointClick} arrows />
        <MapStopMarkers stops={stops} selectedIndex={selectedStop} onClick={onStopClick} />
        {index < positions.length && (
          <MapPositionMarkers positions={[positions[index]]} titleField="fixTime" />
        )}
      </MapView>
      <MapScale />
      {!desktop && (
        // keep the map's top-right controls below the floating header
        <GlobalStyles styles={{ '.maplibregl-ctrl-top-right': { marginTop: 64 } }} />
      )}
      <div className={classes.sidebar}>
        <Paper elevation={0} className={classes.card}>
          <Toolbar className={classes.toolbar} disableGutters>
            <IconButton onClick={() => navigate(-1)}>
              <BackIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}>
              {t('reportReplay')}
            </Typography>
            {loaded && (
              <>
                <IconButton onClick={handleDownload}>
                  <SolarDownloadDuotone />
                </IconButton>
                <IconButton
                  className={filterOpen ? classes.activeButton : null}
                  onClick={() => setFilterOpen((open) => !open)}
                >
                  <SolarTuningDuotone />
                </IconButton>
              </>
            )}
          </Toolbar>
        </Paper>
        <Paper
          elevation={0}
          className={`${classes.content} ${classes.card}`}
          style={{ display: loaded && !filterOpen ? 'none' : 'flex' }}
        >
          <ReportFilter onShow={onShow} deviceType="single" loading={loading} />
        </Paper>
      </div>
      {loaded && !filterOpen && (
        <div className={classes.bottom}>
          {selectedStop != null && stops[selectedStop] && (
            <div className={classes.stopCard}>
              <StopCard
                stop={stops[selectedStop]}
                number={selectedStop + 1}
                onClose={() => setSelectedStop(null)}
              />
            </div>
          )}
          <div ref={panelRef}>
            <ReplayPanel
              deviceName={deviceName}
              positions={positions}
              index={index}
              setIndex={setIndex}
              playing={playing}
              setPlaying={setPlaying}
              speed={speed}
              setSpeed={setSpeed}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReplayPage;
