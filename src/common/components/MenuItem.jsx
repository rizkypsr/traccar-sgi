import { makeStyles } from 'tss-react/mui';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import { brandColor } from '../theme/brand';

const useStyles = makeStyles()((theme) => ({
  item: {
    margin: theme.spacing(0.25, 1.5),
    padding: theme.spacing(1, 1.5),
    borderRadius: theme.spacing(1.5),
    color: theme.palette.text.secondary,
    transition: theme.transitions.create(['background-color', 'color'], {
      duration: theme.transitions.duration.shortest,
    }),
    '& .MuiListItemIcon-root': {
      minWidth: 40,
      color: 'inherit',
    },
    '&:hover': {
      backgroundColor: alpha(brandColor, 0.06),
      color: theme.palette.text.primary,
    },
    '&.Mui-selected, &.Mui-selected:hover': {
      backgroundColor: alpha(brandColor, 0.1),
      color: brandColor,
    },
    '&.Mui-selected .MuiListItemText-primary': {
      fontWeight: 600,
    },
  },
  menuItemText: {
    whiteSpace: 'nowrap',
  },
}));

const MenuItem = ({ title, link, icon, selected }) => {
  const { classes } = useStyles();
  return (
    <ListItemButton
      key={link}
      component={Link}
      to={link}
      selected={selected}
      className={classes.item}
    >
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText primary={title} className={classes.menuItemText} />
    </ListItemButton>
  );
};

export default MenuItem;
