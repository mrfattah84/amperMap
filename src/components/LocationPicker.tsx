import React, { useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface LocationValue {
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  value?: LocationValue;
  onChange?: (value: LocationValue) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ value, onChange }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);

  // Default to the center of Iran if no value is provided
  const initialCoords = value || { latitude: 32.4279, longitude: 53.688 };

  useEffect(() => {
    if (!mapContainer.current || map.current) return; // initialize map only once

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
      center: [initialCoords.longitude, initialCoords.latitude],
      zoom: 4,
    });

    marker.current = new maplibregl.Marker({
      draggable: true,
    })
      .setLngLat([initialCoords.longitude, initialCoords.latitude])
      .addTo(map.current);

    const onDragEnd = () => {
      if (marker.current && onChange) {
        const lngLat = marker.current.getLngLat();
        onChange({ latitude: lngLat.lat, longitude: lngLat.lng });
      }
    };

    marker.current.on("dragend", onDragEnd);

    // Handle map clicks to move the marker
    map.current.on("click", (e) => {
      if (marker.current && onChange) {
        marker.current.setLngLat(e.lngLat);
        onChange({ latitude: e.lngLat.lat, longitude: e.lngLat.lng });
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker if the form value changes from the outside
  useEffect(() => {
    if (marker.current && value) {
      marker.current.setLngLat([value.longitude, value.latitude]);
    }
  }, [value]);

  return (
    <div
      ref={mapContainer}
      style={{ height: "250px", width: "100%", borderRadius: "8px" }}
    />
  );
};

export default LocationPicker;
