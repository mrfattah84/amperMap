import React, { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useSelector } from "react-redux";
import { selectAllUsers } from "../userSlice";

function MapComponent() {
  const data = useSelector(selectAllUsers);

  const mapContainer = useRef(null);
  // CHANGE 1: Use a ref for the map instance. It's not needed in state.
  const map = useRef(null);
  // CHANGE 2: Use a ref to store markers. This prevents re-renders when markers are added/removed.
  const markers = useRef({});

  function calcBounds(coords) {
    if (coords.length === 0) {
      return [
        [44.0, 25.0], // Default Southwest coordinates
        [63.5, 39.8], // Default Northeast coordinates
      ];
    } else if (coords.length === 1) {
      const offset = 0.01;
      return [
        [coords[0][0] - offset, coords[0][1] - offset],
        [coords[0][0] + offset, coords[0][1] + offset],
      ];
    } else {
      const bounds = new maplibregl.LngLatBounds();
      coords.forEach((coord) => {
        bounds.extend(coord);
      });
      return bounds;
    }
  }

  // Effect for initializing the map once
  useEffect(() => {
    // Check if map is not already initialized
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
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

    // Cleanup function to remove map on component unmount
    return () => {
      map.current.remove();
      map.current = null;
    };
  }, []); // Empty dependency array ensures this runs only once

  // Effect for updating markers and bounds when data changes
  useEffect(() => {
    if (!map.current) return; // Don't do anything if map is not yet initialized

    const activeUserCoords = [];
    const currentMarkerIds = Object.keys(markers.current);
    const dataUserIds = data.map((user) => user.id);

    // First, remove markers for users that are no longer in the data or are inactive
    currentMarkerIds.forEach((id) => {
      const user = data.find((u) => u.id.toString() === id.toString());
      if (!user || !user.active) {
        markers.current[id].remove();
        delete markers.current[id];
      }
    });

    // Next, add or update markers for active users
    data.forEach((user) => {
      if (user.latitude && user.longitude && user.active) {
        activeUserCoords.push([user.longitude, user.latitude]);

        // If marker exists, update its position. If not, create it.
        if (markers.current[user.id]) {
          markers.current[user.id].setLngLat([user.longitude, user.latitude]);
        } else {
          const pin = new maplibregl.Marker()
            .setLngLat([user.longitude, user.latitude])
            .addTo(map.current);
          markers.current[user.id] = pin;
        }
      }
    });

    // CHANGE 3: Only fit bounds if there are active users to show
    // This prevents the map from flying away when the last user becomes inactive.
    if (activeUserCoords.length > 0) {
      map.current.fitBounds(calcBounds(activeUserCoords), {
        padding: 50,
        maxZoom: 14,
        duration: 1000,
      });
    }

    // Since we are mutating a ref, `data` is the only dependency we need.
  }, [data]);

  return <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />;
}

export default MapComponent;
