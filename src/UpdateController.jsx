import { useSelector } from 'react-redux';
import { useRegisterSW } from 'virtual:pwa-register/react';

// Based on https://vite-pwa-org.netlify.app/frameworks/react.html
// With registerType 'autoUpdate' a new service worker activates immediately and the page reloads.
const UpdateController = () => {
  const swUpdateInterval = useSelector(
    (state) => state.session.server.attributes.serviceWorkerUpdateInterval || 3600000,
  );

  useRegisterSW({
    onRegisteredSW(swUrl, swRegistration) {
      if (!swRegistration) {
        return;
      }

      const checkUpdate = async () => {
        if (swRegistration.installing || !navigator) {
          return;
        }

        if ('connection' in navigator && !navigator.onLine) {
          return;
        }

        const newSW = await fetch(swUrl, {
          cache: 'no-store',
          headers: {
            cache: 'no-store',
            'cache-control': 'no-cache',
          },
        });

        if (newSW?.status === 200) {
          await swRegistration.update();
        }
      };

      if (swUpdateInterval > 0) {
        setInterval(checkUpdate, swUpdateInterval);
      }

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          checkUpdate();
        }
      });
    },
  });

  return null;
};

export default UpdateController;
