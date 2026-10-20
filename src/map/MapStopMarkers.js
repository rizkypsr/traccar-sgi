import { useCallback, useEffect } from 'react';
import { map } from './core/MapView';
import useMapLayer from './core/useMapLayer';
import { preparePin, toMapCoordinates } from './core/mapUtil';
import { deviceStateColors } from './core/preloadImages';

const imagePrefix = 'stop-pin-';

const onMouseEnter = () => (map.getCanvas().style.cursor = 'pointer');
const onMouseLeave = () => (map.getCanvas().style.cursor = '');

// Numbered pins are generated on demand, which also survives map style changes
const onImageMissing = ({ id }) => {
  if (id.startsWith(imagePrefix) && !map.hasImage(id)) {
    map.addImage(id, preparePin(deviceStateColors.parking, id.slice(imagePrefix.length)), {
      pixelRatio: window.devicePixelRatio,
    });
  }
};

// Numbered pin markers for stop locations, anchored at the pin tip
const MapStopMarkers = ({ stops, selectedIndex, onClick }) => {
  useEffect(() => {
    map.on('styleimagemissing', onImageMissing);
    return () => map.off('styleimagemissing', onImageMissing);
  }, []);

  const onStopClick = useCallback(
    (event) => {
      event.preventDefault();
      onClick?.(event.features[0].properties.index);
    },
    [onClick],
  );

  useMapLayer({
    layers: [
      {
        type: 'symbol',
        layout: {
          'icon-image': ['concat', imagePrefix, ['to-string', ['+', ['get', 'index'], 1]]],
          'icon-anchor': 'bottom',
          'icon-allow-overlap': true,
          'symbol-sort-key': ['get', 'sort'],
        },
        on: { mouseenter: onMouseEnter, mouseleave: onMouseLeave, click: onStopClick },
      },
    ],
    layersDeps: [onStopClick],
    data: {
      type: 'FeatureCollection',
      features: stops.map((stop, index) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: toMapCoordinates(stop.longitude, stop.latitude),
        },
        properties: { index, sort: index === selectedIndex ? stops.length : index },
      })),
    },
    dataDeps: [stops, selectedIndex],
  });

  return null;
};

export default MapStopMarkers;
