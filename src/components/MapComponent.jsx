import React, { useRef, useEffect, useState, use } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

function MapComponent({ data }) {
  // useRef is used to get a reference to the DOM element that will contain the map.
  const mapContainer = useRef(null);

  // useState can store the map object itself.
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState({});

  function calcBounds(coords) {
    if (coords.length === 0) {
      return [
        [44.0, 25.0], // Southwest coordinates
        [63.5, 39.8], // Northeast coordinates
      ];
    } else if (coords.length === 1) {
      const offset = 0.01;
      return [
        [coords[0][0] - offset, coords[0][1] - offset],
        [coords[0][0] + offset, coords[0][1] + offset],
      ];
    } else {
      let sw = [180.0, 90.0];
      let ne = [-180.0, -90.0];

      coords.forEach((coord) => {
        if (coord[0] < sw[0]) sw[0] = coord[0];
        if (coord[1] < sw[1]) sw[1] = coord[1];
        if (coord[0] > ne[0]) ne[0] = coord[0];
        if (coord[1] > ne[1]) ne[1] = coord[1];
      });

      return [sw, ne];
    }
  }

  // useEffect runs once after the component mounts, thanks to the empty dependency array [].
  useEffect(() => {
    // Prevents the map from being initialized more than once.
    if (map) return;

    // Initialize the map.
    const newMap = new maplibregl.Map({
      container: mapContainer.current, // The ref to the DOM element
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxzoom: 19,
          },
        },
        layers: [
          {
            id: "osm-tiles",
            type: "raster",
            source: "osm",
          },
        ],
      },
    });

    setMap(newMap);

    // This is the cleanup function that will run when the component unmounts.
    return () => {
      newMap.remove();
    };
  }, []);

  useEffect(() => {
    if (map) {
      let bounds = [];
      data.forEach((user) => {
        if (user.latitude && user.longitude && user.active) {
          bounds.push([user.longitude, user.latitude]);
          if (!markers[user.id]) {
            const pin = new maplibregl.Marker()
              .setLngLat([user.longitude, user.latitude])
              .setPopup(
                new maplibregl.Popup({ offset: 25 }).setText(
                  `User: ${user.name}`
                )
              )
              .addTo(map);

            setMarkers({ ...markers, [user.id]: pin });
          }
        } else if (
          user.latitude &&
          user.longitude &&
          markers[user.id] &&
          !user.active
        ) {
          markers[user.id].remove();
          const updatedMarkers = { ...markers };
          delete updatedMarkers[user.id];
          setMarkers(updatedMarkers);
        }
      });
      map.fitBounds(calcBounds(bounds), {
        padding: 50,
        maxZoom: 14,
        duration: 1000,
      });
    }
  }, [data, map]);

  return <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />;
}

export default MapComponent;
