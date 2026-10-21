import { lazy, Suspense, useState, useCallback, useEffect } from 'react';
import { GlobalStyles, Paper } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDispatch, useSelector } from 'react-redux';
import DeviceList from './DeviceList';
import BottomMenu from '../common/components/BottomMenu';
import StatusCard from '../common/components/StatusCard';
import { devicesActions } from '../store';
import usePersistedState from '../common/util/usePersistedState';
import EventsDrawer from './EventsDrawer';
import useFilter from './useFilter';
import MainToolbar from './MainToolbar';
import { useAttributePreference } from '../common/util/preferences';
import { brandColor, brandColorDark, brandColorLight } from '../common/theme/brand';

const MainMap = lazy(() => import('./MainMap'));

// height of the logo-only mobile header (excluding the safe-area inset)
const mobileHeaderHeight = 52;

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
  },
  sidebar: {
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.up('md')]: {
      position: 'fixed',
      left: 0,
      top: 0,
      gap: theme.spacing(1.5),
      height: `calc(100% - ${theme.spacing(3)})`,
      width: theme.dimensions.drawerWidthDesktop,
      margin: theme.spacing(1.5),
      zIndex: 3,
    },
    [theme.breakpoints.down('md')]: {
      height: '100%',
      width: '100%',
    },
  },
  // desktop: header and list form one rounded floating card while the list is open,
  // the bottom navigation floats separately below it
  panel: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  },
  sidebarCard: {
    borderRadius: theme.spacing(2.5),
    overflow: 'hidden',
    boxShadow: theme.shadows[6],
  },
  floating: {
    borderRadius: theme.spacing(2.5),
    overflow: 'hidden',
    boxShadow: theme.shadows[6],
  },
  // mobile: gradient header attached to the top edge with rounded bottom corners
  mobileHeader: {
    position: 'fixed',
    zIndex: 6,
    top: 0,
    left: 0,
    right: 0,
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
    paddingBottom: 12,
    borderRadius: theme.spacing(0, 0, 3, 3),
    background: `linear-gradient(135deg, ${brandColorLight} 0%, ${brandColor} 55%, ${brandColorDark} 100%)`,
    boxShadow: `0 6px 18px ${alpha(brandColor, 0.3)}`,
  },
  mobileLogo: {
    height: 28,
    width: 'auto',
    display: 'block',
  },
  header: {
    pointerEvents: 'auto',
    zIndex: 6,
  },
  footer: {
    pointerEvents: 'auto',
    zIndex: 5,
  },
  middle: {
    flex: 1,
    display: 'grid',
    minHeight: 0,
  },
  contentMap: {
    pointerEvents: 'auto',
    gridArea: '1 / 1',
  },
  contentList: {
    pointerEvents: 'auto',
    gridArea: '1 / 1',
    zIndex: 4,
    display: 'flex',
    minHeight: 0,
    [theme.breakpoints.down('md')]: {
      background: `linear-gradient(160deg, ${brandColorLight} 0%, ${brandColor} 55%, ${brandColorDark} 100%)`,
      // keep the rows clear of the mobile header and the bottom navigation
      paddingTop: `calc(${mobileHeaderHeight}px + env(safe-area-inset-top))`,
      paddingBottom: theme.dimensions.bottomBarHeight,
      flexDirection: 'column',
    },
  },
  // mobile: search and filter as a white card above the device rows
  listSearch: {
    margin: theme.spacing(1.5, 1, 1),
    borderRadius: theme.spacing(1.5),
    backgroundColor: theme.palette.common.white,
    boxShadow: theme.shadows[2],
    '& .MuiToolbar-root': {
      minHeight: 56,
      padding: theme.spacing(0, 1),
    },
    // doubled class outranks the toolbar's pill radius; corners match the cards
    '& .MuiOutlinedInput-root.MuiOutlinedInput-root': {
      flex: 1,
      minWidth: 0,
      borderRadius: theme.spacing(1.5),
    },
    '& .MuiToolbar-root > .MuiIconButton-root': {
      flexShrink: 0,
      marginRight: 0,
      width: 40,
      height: 40,
      borderRadius: theme.spacing(1.5),
    },
  },
  listRows: {
    flex: 1,
    minHeight: 0,
  },
}));

const MainPage = () => {
  const { classes, cx } = useStyles();
  const dispatch = useDispatch();
  const theme = useTheme();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const mapOnSelect = useAttributePreference('mapOnSelect', true);

  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const selectedPosition = filteredPositions.find(
    (position) => selectedDeviceId && position.deviceId === selectedDeviceId,
  );

  const [filteredDevices, setFilteredDevices] = useState([]);

  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = usePersistedState('deviceFilter', {
    statuses: [],
    groups: [],
    geofences: [],
  });
  const [filterSort, setFilterSort] = usePersistedState('filterSort', '');
  const [filterMap, setFilterMap] = usePersistedState('filterMap', false);

  const listOpen = useSelector((state) => state.devices.listOpen);
  const devicesOpen = listOpen ?? desktop;
  const setDevicesOpen = useCallback(
    (open) => dispatch(devicesActions.setListOpen(open)),
    [dispatch],
  );
  const [eventsOpen, setEventsOpen] = useState(false);

  const onEventsClick = useCallback(() => setEventsOpen(true), [setEventsOpen]);

  useEffect(() => {
    if (!desktop && mapOnSelect && selectedDeviceId) {
      setDevicesOpen(false);
    }
  }, [desktop, mapOnSelect, selectedDeviceId, setDevicesOpen]);

  useFilter(
    keyword,
    filter,
    filterSort,
    filterMap,
    positions,
    setFilteredDevices,
    setFilteredPositions,
  );

  const toolbarProps = {
    filteredDevices,
    devicesOpen,
    setDevicesOpen,
    keyword,
    setKeyword,
    filter,
    setFilter,
    filterSort,
    setFilterSort,
    filterMap,
    setFilterMap,
  };

  return (
    <div className={classes.root}>
      {desktop && (
        <Suspense fallback={null}>
          <MainMap
            filteredPositions={filteredPositions}
            selectedPosition={selectedPosition}
            onEventsClick={onEventsClick}
          />
        </Suspense>
      )}
      <div className={classes.sidebar}>
        <div className={cx(classes.panel, desktop && devicesOpen && classes.sidebarCard)}>
          {desktop ? (
            <Paper
              square
              elevation={0}
              className={cx(classes.header, !devicesOpen && classes.floating)}
            >
              <MainToolbar {...toolbarProps} />
            </Paper>
          ) : (
            <div className={classes.mobileHeader}>
              <img
                className={classes.mobileLogo}
                src={`${import.meta.env.BASE_URL}login-logo.webp`}
                alt="IDGPS"
              />
              <GlobalStyles
                styles={{
                  '.maplibregl-ctrl-top-right': {
                    marginTop: `calc(${mobileHeaderHeight}px + env(safe-area-inset-top))`,
                  },
                }}
              />
            </div>
          )}
          <div className={classes.middle}>
            {!desktop && (
              <div className={classes.contentMap}>
                <Suspense fallback={null}>
                  <MainMap
                    filteredPositions={filteredPositions}
                    selectedPosition={selectedPosition}
                    onEventsClick={onEventsClick}
                  />
                </Suspense>
              </div>
            )}
            <Paper
              square
              elevation={desktop ? 0 : 1}
              className={classes.contentList}
              style={devicesOpen ? {} : { visibility: 'hidden' }}
            >
              {desktop ? (
                <DeviceList devices={filteredDevices} />
              ) : (
                <>
                  <div className={classes.listSearch}>
                    <MainToolbar {...toolbarProps} />
                  </div>
                  <div className={classes.listRows}>
                    <DeviceList devices={filteredDevices} />
                  </div>
                </>
              )}
            </Paper>
          </div>
        </div>
        {desktop && (
          <div className={classes.footer}>
            <BottomMenu />
          </div>
        )}
      </div>
      <EventsDrawer open={eventsOpen} onClose={() => setEventsOpen(false)} />
      {/* on mobile the device list covers the map, so the card stays hidden while it is open */}
      {selectedDeviceId && (desktop || !devicesOpen) && (
        <StatusCard
          deviceId={selectedDeviceId}
          position={selectedPosition}
          onClose={() => dispatch(devicesActions.selectId(null))}
          desktopPadding={theme.dimensions.drawerWidthDesktop}
          attachToNav
        />
      )}
    </div>
  );
};

export default MainPage;
