import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()(() => ({
  image: {
    maxWidth: '260px',
    maxHeight: '120px',
    width: '75%',
    height: 'auto',
    objectFit: 'contain',
  },
}));

const LogoImage = () => {
  const { classes } = useStyles();

  const logo = useSelector((state) => state.session.server.attributes?.logo);

  return (
    <img
      className={classes.image}
      src={logo || `${import.meta.env.BASE_URL}login-logo.webp`}
      alt=""
    />
  );
};

export default LogoImage;
