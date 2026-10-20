import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocalization } from '../components/LocalizationProvider';
import { useAsyncTask } from '../../reactHelper';

// Server geocoder first; if it is disabled or returns nothing, fall back to public Nominatim.
// Results are cached per coordinate to stay within Nominatim's usage limits.
const addressCache = new Map();

export const lookupAddress = async (latitude, longitude, geocoderEnabled, language, signal) => {
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

// Resolves a full address for a coordinate; pass enabled=false to skip lookups (e.g. while playing)
const useAddress = (latitude, longitude, originalAddress, enabled = true) => {
  const { language } = useLocalization();
  const geocoderEnabled = useSelector((state) => state.session.server.geocoderEnabled);

  const [address, setAddress] = useState(originalAddress);

  useAsyncTask(
    async ({ signal }) => {
      setAddress(originalAddress);
      if (!originalAddress && enabled && latitude != null && longitude != null) {
        try {
          setAddress(
            await lookupAddress(
              latitude,
              longitude,
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
    [latitude, longitude, originalAddress, enabled, geocoderEnabled, language],
  );

  return address;
};

export default useAddress;
