import React, { useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useGetExpandedOrdersQuery } from "../orderSlice";

function MapComponent() {
  const { data: orders = [] } = useGetExpandedOrdersQuery();

  const mapContainer = useRef(null);
  // CHANGE 1: Use a ref for the map instance. It's not needed in state.
  const map = useRef(null);

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
    if (!map.current || !orders.length) return; // Don't do anything if map is not yet initialized or no orders

    const markers = [];
    const activeOrderCoords = [];

    orders.forEach((order) => {
      if (
        order.active &&
        order.location?.latitude &&
        order.location?.longitude
      ) {
        const { longitude, latitude } = order.location;
        activeOrderCoords.push([longitude, latitude]);
        const marker = new maplibregl.Marker()
          .setLngLat([longitude, latitude])
          .addTo(map.current);
        markers.push(marker);
      }
    });

    if (activeOrderCoords.length > 0) {
      map.current.fitBounds(calcBounds(activeOrderCoords), {
        padding: 50,
        maxZoom: 14,
        duration: 1000,
      });
    }

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [orders]);

  return <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />;
}

export default MapComponent;
