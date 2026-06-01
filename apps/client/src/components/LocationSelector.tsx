import { useState, type FC } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationSelectorProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
}

const createLocationIcon = () => {
  return new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/2776/2776067.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: "custom-marker-icon"
  });
};

const centerHanoi: [number, number] = [21.0056, 105.8433];

function MapClickHandler({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export const LocationSelector: FC<LocationSelectorProps> = ({ onLocationSelect }) => {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Lấy vị trí hiện tại của người dùng
  const getCurrentLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSelectedLocation({ lat: latitude, lng: longitude });
          reverseGeocode(latitude, longitude);
          onLocationSelect(latitude, longitude, "現在位置");
          setLoading(false);
        },
        (error) => {
          console.error("位置情報の取得エラー:", error);
          let errorMessage = "現在位置を取得できません。もう一度お試しいただくか、地図上で位置を選択してください。";
          
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = "ブラウザの設定でGPSアクセスを許可してください。";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = "デバイスの現在位置を判定できません。地図上で手動で位置を選択してください。";
          } else if (error.code === error.TIMEOUT) {
            errorMessage = "位置情報の取得がタイムアウトしました。もう一度お試しください。";
          }
          
          console.error(errorMessage);
          setLoading(false);
        },
        {
          enableHighAccuracy: false,
          timeout: 30000,
          maximumAge: 60000,
        }
      );
    } else {
      console.error("このブラウザはGPSをサポートしていません。");
      setLoading(false);
    }
  };

  // Chuyển đổi tọa độ sang địa chỉ
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`
      );
      const data = await response.json();
      setAddress(data.address?.city || data.address?.town || "住所不明");
    } catch (error) {
      console.error("逆ジオコーディングエラー:", error);
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const handleMapClick = (latlng: L.LatLng) => {
    const { lat, lng } = latlng;
    setSelectedLocation({ lat, lng });
    reverseGeocode(lat, lng);
    onLocationSelect(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  return (
    <div className="location-selector">
      <div className="location-selector__header">
        <h3 style={{ marginTop: 0, marginBottom: "8px", fontSize: "16px", fontWeight: "600" }}>
          📍 位置を選択してください
        </h3>
        <p style={{ marginTop: 0, marginBottom: "12px", fontSize: "13px", color: "#666" }}>
          地図をクリックして位置を選択するか、GPSを使用してください
        </p>
      </div>

      <div className="location-selector__map-container" style={{ position: "relative", height: "300px", borderRadius: "8px", overflow: "hidden", marginBottom: "12px", border: "1px solid #ddd" }}>
        <MapContainer
          center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : centerHanoi}
          zoom={14}
          minZoom={8}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onMapClick={handleMapClick} />

          {selectedLocation && (
            <Marker
              position={[selectedLocation.lat, selectedLocation.lng]}
              icon={createLocationIcon()}
            />
          )}
        </MapContainer>
      </div>

      <div className="location-selector__info" style={{ display: "flex", gap: "12px", alignItems: "stretch" }}>
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={loading}
          style={{
            flex: 1,
            padding: "10px",
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          {loading ? "位置を確認中..." : "📍 現在のGPSを使用"}
        </button>
      </div>

      {selectedLocation && (
        <div style={{
          marginTop: "12px",
          padding: "10px",
          backgroundColor: "#f0f8ff",
          borderRadius: "6px",
          borderLeft: "4px solid #007bff",
          fontSize: "14px",
          color: "#333"
        }}>
          <p style={{ margin: "0 0 4px 0", fontWeight: "500" }}>✓ 選択した位置:</p>
          <p style={{ margin: "0", color: "#666" }}>
            {address || `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`}
          </p>
        </div>
      )}
    </div>
  );
};
