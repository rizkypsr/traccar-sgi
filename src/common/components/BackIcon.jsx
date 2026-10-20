import { useTheme } from '@mui/material';
import { SolarArrowLeftLinear } from './SolarIcons';

const BackIcon = () => {
  const theme = useTheme();
  return (
    <SolarArrowLeftLinear
      sx={theme.direction === 'rtl' ? { transform: 'scaleX(-1)' } : undefined}
    />
  );
};

export default BackIcon;
