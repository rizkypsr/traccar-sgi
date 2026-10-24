import { useEffect, useRef, useState } from 'react';
import { Button, TextField, Link, Alert, IconButton, Tooltip, InputAdornment } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { alpha } from '@mui/material/styles';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { sessionActions } from '../store';
import { useTranslation } from '../common/components/LocalizationProvider';
import LoginLayout from './LoginLayout';
import { brandColor, brandColorDark, brandColorLight } from '../common/theme/brand';
import usePersistedState from '../common/util/usePersistedState';
import {
  generateLoginToken,
  handleLoginTokenListeners,
  nativeEnvironment,
  nativePostMessage,
} from '../common/components/NativeInterface';
import { useCatch } from '../reactHelper';
import PasswordField from '../common/components/PasswordField';
import { SolarLockKeyholeLinear, SolarUserLinear } from '../common/components/SolarIcons';

const useStyles = makeStyles()((theme) => ({
  options: {
    position: 'fixed',
    top: theme.spacing(2),
    right: theme.spacing(2),
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(1),
    padding: theme.spacing(0.5),
    borderRadius: theme.spacing(1.5),
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2.25),
  },
  fields: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2.25),
    marginTop: theme.spacing(5),
  },
  field: {
    '& .MuiOutlinedInput-root': {
      height: 52,
      borderRadius: 12,
      backgroundColor: alpha('#FFFFFF', 0.93),
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'transparent',
    },
    '& .MuiInputAdornment-positionStart': {
      marginRight: theme.spacing(1.5),
    },
    '& .MuiInputAdornment-positionEnd .MuiSvgIcon-root': {
      fontSize: 26,
      color: theme.palette.grey[800],
    },
    '& .MuiFormHelperText-root': {
      color: '#FFD9D2',
    },
  },
  userIcon: {
    fontSize: 26,
    color: theme.palette.grey[900],
  },
  lockIcon: {
    fontSize: 26,
    color: brandColor,
  },
  loginButton: {
    height: 48,
    marginTop: theme.spacing(0.75),
    borderRadius: 12,
    fontSize: '1.05rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: '#FFFFFF',
    background: `linear-gradient(180deg, ${brandColorLight} 0%, ${brandColor} 100%)`,
    boxShadow: `0 8px 22px ${alpha(brandColor, 0.45)}`,
    '&:hover': {
      background: `linear-gradient(180deg, ${brandColor} 0%, ${brandColorDark} 100%)`,
    },
    '&.Mui-disabled': {
      color: '#FFFFFF',
      opacity: 1,
    },
  },
  extraContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  link: {
    cursor: 'pointer',
    fontWeight: 700,
    color: brandColor,
  },
  resetLink: {
    marginLeft: 'auto',
  },
}));

const LoginPage = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();

  const [failed, setFailed] = useState(false);

  const [email, setEmail] = usePersistedState('loginEmail', '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showServerTooltip, setShowServerTooltip] = useState(false);

  const registrationEnabled = useSelector((state) => state.session.server.registration);
  const changeEnabled = useSelector((state) => !state.session.server.attributes.disableChange);
  const emailEnabled = useSelector((state) => state.session.server.emailEnabled);
  const openIdEnabled = useSelector((state) => state.session.server.openIdEnabled);
  const openIdForced = useSelector(
    (state) => state.session.server.openIdEnabled && state.session.server.openIdForce,
  );
  const [codeEnabled, setCodeEnabled] = useState(false);

  const [announcementShown, setAnnouncementShown] = useState(false);
  const announcement = useSelector((state) => state.session.server.announcement);

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    setFailed(false);
    try {
      const query = `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      const response = await fetch('/api/session', {
        method: 'POST',
        body: new URLSearchParams(code.length ? `${query}&code=${code}` : query),
      });
      if (response.ok) {
        const user = await response.json();
        generateLoginToken();
        dispatch(sessionActions.updateUser(user));
        const target = window.sessionStorage.getItem('postLogin') || '/';
        window.sessionStorage.removeItem('postLogin');
        navigate(target, { replace: true });
      } else if (response.status === 401 && response.headers.get('WWW-Authenticate') === 'TOTP') {
        setCodeEnabled(true);
      } else {
        throw Error(await response.text());
      }
    } catch {
      setFailed(true);
      setPassword('');
    }
  };

  const handleTokenLogin = useCatch(async (token) => {
    const response = await fetch(`/api/session?token=${encodeURIComponent(token)}`);
    if (response.ok) {
      const user = await response.json();
      dispatch(sessionActions.updateUser(user));
      navigate('/');
    } else if (response.status === 401) {
      nativePostMessage('logout');
    }
  });

  const handleTokenLoginRef = useRef(handleTokenLogin);
  handleTokenLoginRef.current = handleTokenLogin;

  const handleOpenIdLogin = () => {
    document.location = '/api/session/openid/auth';
  };

  useEffect(() => nativePostMessage('authentication'), []);

  useEffect(() => {
    const listener = (token) => handleTokenLoginRef.current(token);
    handleLoginTokenListeners.add(listener);
    return () => handleLoginTokenListeners.delete(listener);
  }, []);

  useEffect(() => {
    if (window.localStorage.getItem('hostname') !== window.location.hostname) {
      window.localStorage.setItem('hostname', window.location.hostname);
      setShowServerTooltip(true);
    }
  }, []);

  return (
    <LoginLayout>
      {nativeEnvironment && changeEnabled && (
        <div className={classes.options}>
          <IconButton color="primary" onClick={() => navigate('/change-server')}>
            <Tooltip
              title={`${t('settingsServer')}: ${window.location.hostname}`}
              open={showServerTooltip}
              arrow
            >
              <VpnLockIcon />
            </Tooltip>
          </IconButton>
        </div>
      )}
      <div className={classes.container}>
        {!!announcement && !announcementShown && (
          <Alert severity="info" onClose={() => setAnnouncementShown(true)}>
            {announcement}
          </Alert>
        )}
        {!openIdForced && (
          <div className={classes.fields}>
            <TextField
              required
              error={failed}
              className={classes.field}
              placeholder={t('userEmail')}
              name="email"
              value={email}
              autoComplete="email"
              autoFocus={!email}
              onChange={(e) => setEmail(e.target.value)}
              helperText={failed && 'Invalid username or password'}
              slotProps={{
                htmlInput: { 'aria-label': t('userEmail') },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SolarUserLinear className={classes.userIcon} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <PasswordField
              required
              error={failed}
              className={classes.field}
              placeholder={t('userPassword')}
              name="password"
              value={password}
              autoComplete="current-password"
              autoFocus={!!email}
              onChange={(e) => setPassword(e.target.value)}
              slotProps={{
                htmlInput: { 'aria-label': t('userPassword') },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SolarLockKeyholeLinear className={classes.lockIcon} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            {codeEnabled && (
              <TextField
                required
                error={failed}
                className={classes.field}
                label={t('loginTotpCode')}
                name="code"
                value={code}
                type="number"
                onChange={(e) => setCode(e.target.value)}
              />
            )}
            <Button
              onClick={handlePasswordLogin}
              type="submit"
              variant="contained"
              className={classes.loginButton}
              disabled={!email || !password || (codeEnabled && !code)}
            >
              {t('loginLogin')}
            </Button>
          </div>
        )}
        {openIdEnabled && (
          <Button onClick={() => handleOpenIdLogin()} variant="contained" color="secondary">
            {t('loginOpenId')}
          </Button>
        )}
        {!openIdForced && (
          <div className={classes.extraContainer}>
            {registrationEnabled && (
              <Link
                onClick={() => navigate('/register')}
                className={classes.link}
                underline="none"
                variant="body2"
              >
                {t('loginRegister')}
              </Link>
            )}
            {emailEnabled && (
              <Link
                onClick={() => navigate('/reset-password')}
                className={`${classes.link} ${classes.resetLink}`}
                underline="none"
                variant="body2"
              >
                {t('loginReset')}
              </Link>
            )}
          </div>
        )}
      </div>
    </LoginLayout>
  );
};

export default LoginPage;
