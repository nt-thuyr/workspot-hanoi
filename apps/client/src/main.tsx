import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Giả lập vị trí GPS (HUST B1) trong môi trường dev để tránh sai lệch do lấy theo IP máy tính
if (import.meta.env.DEV) {
  const mockGeolocation = {
    getCurrentPosition: (success: PositionCallback) => {
      success({
        coords: {
          latitude: 21.004519737728625,
          longitude: 105.84671270832611,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition);
    },
    watchPosition: (success: PositionCallback) => {
      success({
        coords: {
          latitude: 21.004519737728625,
          longitude: 105.84671270832611,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition);
      return 1;
    },
    clearWatch: () => {},
  };

  Object.defineProperty(navigator, "geolocation", {
    value: mockGeolocation,
    configurable: true,
  });
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
