import { useState } from 'react';
import { TextField, IconButton, InputAdornment } from '@mui/material';
import { SolarEyeClosedLinear, SolarEyeLinear } from './SolarIcons';

const PasswordField = ({ slotProps, ...others }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <TextField
      {...others}
      type={showPassword ? 'text' : 'password'}
      slotProps={{
        ...slotProps,
        input: {
          ...slotProps?.input,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                {showPassword ? <SolarEyeLinear /> : <SolarEyeClosedLinear />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};

export default PasswordField;
