import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()(() => ({
  image: {
    width: 116,
    maxWidth: '60%',
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
      src={logo || `${import.meta.env.BASE_URL}login-logo-white.webp`}
      alt=""
    />
  );
};

export default LogoImage;
