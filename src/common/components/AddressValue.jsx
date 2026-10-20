import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from '@mui/material';
import { useLocalization, useTranslation } from './LocalizationProvider';
import { useCatch } from '../../reactHelper';
import { formatAddress } from '../util/formatter';
import { usePreference } from '../util/preferences';
import { lookupAddress } from '../util/useAddress';

const AddressValue = ({ latitude, longitude, originalAddress }) => {
  const t = useTranslation();
  const { language } = useLocalization();

  const addressEnabled = useSelector((state) => state.session.server.geocoderEnabled);
  const coordinateFormat = usePreference('coordinateFormat');

  const [address, setAddress] = useState();
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    setAddress(originalAddress);
    setResolved(false);
  }, [latitude, longitude, originalAddress]);

  // server geocoder first, falling back to Nominatim when it returns nothing
  const showAddress = useCatch(async (event) => {
    event.preventDefault();
    setAddress(await lookupAddress(latitude, longitude, true, language.replace('_', '-')));
    setResolved(true);
  });

  if (address) {
    return address;
  }
  if (addressEnabled && !resolved) {
    return (
      <Link href="#" onClick={showAddress}>
        {t('sharedShowAddress')}
      </Link>
    );
  }
  return formatAddress({ latitude, longitude }, coordinateFormat);
};

export default AddressValue;
