import React, { useRef, useEffect, use } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  ExpandedOrder,
  useGetExpandedOrdersQuery,
  useGetDriversQuery,
} from "../orderSlice";
import createNumberedPin from "./customMarker";
import { useAppDispatch } from "../hooks";
import { fitBounds, setMapInstance } from "../mapSlice";

function MapComponent({ onMarkerClick }) {
  const { data: orders = [] } = useGetExpandedOrdersQuery();
  const { data: drivers = [] } = useGetDriversQuery();
  const dispatch = useAppDispatch();

  const mapContainer = useRef(null);
  const map = useRef(null);
  // Use a ref to keep track of markers to clean them up
  const markersRef = useRef([]);

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

    dispatch(setMapInstance(map.current));

    // Cleanup function to remove map on component unmount
    return () => {
      map.current.remove();
      map.current = null;
      dispatch(setMapInstance(null));
    };
  }, [dispatch]); // Empty dependency array ensures this runs only once

  // Effect for updating markers and bounds when data changes
  useEffect(() => {
    if (!map.current || !orders.length) return; // Don't do anything if map is not yet initialized or no orders

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    const activeOrderCoords = [];

    const activeOrders = orders.filter(
      (order) =>
        order.active && order.location?.latitude && order.location?.longitude
    );

    activeOrders.forEach((order: ExpandedOrder) => {
      if (
        order.active &&
        order.location?.latitude &&
        order.location?.longitude
      ) {
        const { longitude, latitude } = order.location;
        activeOrderCoords.push([longitude, latitude]);

        // Create a DOM element for the marker.
        const el = document.createElement("div");
        el.innerHTML = createNumberedPin(order.id, order.color);

        const popup = new maplibregl.Popup({
          offset: 25,
          className: "text-black",
          closeButton: false,
        }).setText(order.contact.name);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .setPopup(popup)
          .addTo(map.current);

        // Get the marker's DOM element and add event listeners
        const markerElement = marker.getElement();

        markerElement.addEventListener("mouseenter", () =>
          marker.togglePopup()
        );
        markerElement.addEventListener("mouseleave", () =>
          marker.togglePopup()
        );

        markerElement.addEventListener("click", () => {
          onMarkerClick(order.id);
        });

        markersRef.current.push(marker);
      }
    });

    if (activeOrderCoords.length > 0) {
      dispatch(fitBounds(calcBounds(activeOrderCoords)));
    }

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [orders, dispatch, onMarkerClick]);

  useEffect(() => {
    if (!map.current) return;

    drivers.forEach((driver) => {
      const sourceId = `driver-${driver.id}`;
      const pathSourceId = `driver-path-${driver.id}`;
      const layerId = `driver-layer-${driver.id}`;
      const pathLayerId = `driver-path-layer-${driver.id}`;

      // Update driver marker (Point)
      if (driver.geojson?.geometry?.coordinates) {
        const source = map.current.getSource(sourceId);
        if (source) {
          // If source exists, just update the data
          source.setData(driver.geojson);
        } else {
          // Otherwise, add a new source and a layer to render it
          map.current.addSource(sourceId, {
            type: "geojson",
            data: driver.geojson,
          });

          map.current.addLayer({
            id: layerId,
            type: "circle",
            source: sourceId,
            paint: {
              "circle-radius": 8,
              "circle-color": "#007cbf", // A nice blue color for drivers
              "circle-stroke-width": 2,
              "circle-stroke-color": "white",
            },
          });
        }
      }

      // Update driver path (LineString)
      const pathCoordinates = driver.geojson?.properties?.path;
      if (pathCoordinates && pathCoordinates.length > 1) {
        const pathGeoJson = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: pathCoordinates,
          },
        };

        const pathSource = map.current.getSource(pathSourceId);
        if (pathSource) {
          pathSource.setData(pathGeoJson);
        } else {
          map.current.addSource(pathSourceId, {
            type: "geojson",
            data: pathGeoJson,
          });

          map.current.addLayer({
            id: pathLayerId,
            type: "line",
            source: pathSourceId,
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#888",
              "line-width": 4,
            },
          });
        }
      }
    });
  }, [drivers]);

  return <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />;
}

export default MapComponent;
