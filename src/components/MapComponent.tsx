import React, { useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ExpandedOrder, useGetExpandedOrdersQuery } from "../orderSlice";
import createNumberedPin from "./customMarker";
import { useAppDispatch } from "../hooks";
import { fitBounds, setMapInstance } from "../mapSlice";

function MapComponent({ onMarkerClick }) {
  const { data: orders = [] } = useGetExpandedOrdersQuery();
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

  return <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />;
}

export default MapComponent;
