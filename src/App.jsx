import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { GlobalStyles, useMediaQuery, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import { brandGradient } from './common/theme/BrandSurface';
import BottomMenu from './common/components/BottomMenu';
import SocketController from './SocketController';
import CachingController from './CachingController';
import { useCatch, useAsyncTask } from './reactHelper';
import { sessionActions } from './store';
import MotionController from './main/MotionController';
import TermsDialog from './common/components/TermsDialog';
import Loader from './common/components/Loader';
import fetchOrThrow from './common/util/fetchOrThrow';

// The mobile bottom navigation only appears on the main sections; detail pages
// (replay, position, event, geofences, ...) have their own back button instead
const isMainSection = (pathname) =>
  pathname === '/' || pathname.startsWith('/settings') || pathname.startsWith('/reports');

const useStyles = makeStyles()((theme) => ({
  page: {
    flexGrow: 1,
    overflow: 'auto',
  },
  pagePadded: {
    paddingBottom: theme.dimensions.bottomBarHeight,
  },
  menu: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
    pointerEvents: 'none',
    '& > *': {
      pointerEvents: 'auto',
    },
    '@media print': {
      display: 'none',
    },
  },
}));

const App = () => {
  const { classes, cx } = useStyles();
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const showMenu = !desktop && isMainSection(location.pathname);
  // the main map runs full screen under the floating bottom navigation
  const fullScreenMap = location.pathname === '/';

  const newServer = useSelector((state) => state.session.server.newServer);
  const termsUrl = useSelector((state) => state.session.server.attributes.termsUrl);
  const user = useSelector((state) => state.session.user);

  const acceptTerms = useCatch(async () => {
    const response = await fetchOrThrow(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...user, attributes: { ...user.attributes, termsAccepted: true } }),
    });
    dispatch(sessionActions.updateUser(await response.json()));
  });

  useAsyncTask(
    async ({ signal }) => {
      if (!user) {
        const response = await fetch('/api/session', { signal });
        if (response.ok) {
          dispatch(sessionActions.updateUser(await response.json()));
        } else {
          window.sessionStorage.setItem(
            'postLogin',
            window.location.pathname + window.location.search,
          );
          navigate(newServer ? '/register' : '/login', { replace: true });
        }
      }
      return null;
    },
    [user, dispatch, navigate, newServer],
  );

  if (user == null) {
    return <Loader />;
  }
  if (termsUrl && !user.attributes.termsAccepted) {
    return <TermsDialog open onCancel={() => navigate('/login')} onAccept={() => acceptTerms()} />;
  }
  return (
    <>
      <SocketController />
      <CachingController />
      <MotionController />
      <GlobalStyles
        styles={{
          // map controls sit on the brand gradient on mobile, with icons tinted white
          [theme.breakpoints.down('md')]: {
            '.maplibregl-ctrl-group': {
              background: brandGradient,
            },
            '.maplibregl-ctrl-group button + button': {
              borderTopColor: alpha(theme.palette.common.white, 0.25),
            },
            '.maplibregl-ctrl-group .maplibregl-ctrl-icon, .mapbox-gl-draw_ctrl-draw-btn': {
              filter: 'brightness(0) invert(1)',
            },
            '.maplibregl-ctrl-group button:not(:disabled):hover': {
              backgroundColor: alpha(theme.palette.common.white, 0.15),
            },
          },
        }}
      />
      <div className={cx(classes.page, showMenu && !fullScreenMap && classes.pagePadded)}>
        <Outlet />
      </div>
      {showMenu && (
        <>
          {fullScreenMap && (
            <GlobalStyles
              styles={{
                '.maplibregl-ctrl-bottom-left, .maplibregl-ctrl-bottom-right': {
                  marginBottom: theme.dimensions.bottomBarHeight,
                },
              }}
            />
          )}
          <div className={classes.menu}>
            <BottomMenu />
          </div>
        </>
      )}
    </>
  );
};

export default App;
