import { Fab } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import { useRestriction } from '../../common/util/permissions';
import { SolarAddCircleDuotone } from '../../common/components/SolarIcons';
import { brandColor, brandColorDark, brandColorLight } from '../../common/theme/brand';

const useStyles = makeStyles()((theme) => ({
  fab: {
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
    [theme.breakpoints.down('md')]: {
      bottom: `calc(${theme.dimensions.bottomBarHeight}px + ${theme.spacing(2)})`,
    },
  },
  button: {
    color: theme.palette.common.white,
    background: `linear-gradient(135deg, ${brandColorLight} 0%, ${brandColor} 55%, ${brandColorDark} 100%)`,
    boxShadow: `0 6px 16px ${alpha(brandColor, 0.4)}`,
    '&:hover': {
      background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColorDark} 100%)`,
    },
    '& svg': {
      fontSize: 28,
    },
  },
}));

const CollectionFab = ({ editPath, disabled }) => {
  const { classes } = useStyles();
  const navigate = useNavigate();

  const readonly = useRestriction('readonly');

  if (!readonly && !disabled) {
    return (
      <div className={classes.fab}>
        <Fab size="medium" className={classes.button} onClick={() => navigate(editPath)}>
          <SolarAddCircleDuotone />
        </Fab>
      </div>
    );
  }
  return '';
};

export default CollectionFab;
