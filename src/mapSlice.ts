import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import maplibregl, { LngLatBoundsLike, LngLatLike } from "maplibre-gl";
import { AppThunk } from "./store";

type MapState = {
  isLoaded: boolean;
};

const initialState: MapState = {
  isLoaded: false,
};

// This is not part of the state, just a module-level variable to hold the map instance.
let mapInstance: maplibregl.Map | null = null;

const mapSlice = createSlice({
  name: "map",
  initialState,
  reducers: {
    mapLoaded: (state) => {
      state.isLoaded = true;
    },
    mapUnloaded: (state) => {
      state.isLoaded = false;
    },
  },
});

export const { mapLoaded, mapUnloaded } = mapSlice.actions;

export const setMapInstance =
  (map: maplibregl.Map | null): AppThunk =>
  (dispatch) => {
    mapInstance = map;
    if (map) {
      dispatch(mapLoaded());
    } else {
      dispatch(mapUnloaded());
    }
  };

export const panTo =
  (lngLat: LngLatLike): AppThunk =>
  () => {
    if (mapInstance) {
      mapInstance.panTo(lngLat, { duration: 1000 });
    }
  };

export const fitBounds =
  (bounds: LngLatBoundsLike, options?: maplibregl.FitBoundsOptions): AppThunk =>
  () => {
    if (mapInstance) {
      mapInstance.fitBounds(bounds, {
        padding: 50,
        maxZoom: 14,
        duration: 1000,
        ...options,
      });
    }
  };

export default mapSlice.reducer;
