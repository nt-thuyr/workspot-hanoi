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
          onLocationSelect(latitude, longitude, "Vị trí hiện tại của bạn");
          setLoading(false);
        },
        (error) => {
          console.error("Lỗi lấy vị trí:", error);
          let errorMessage = "Không thể lấy vị trí của bạn lúc này. Vui lòng thử lại hoặc chọn vị trí trên bản đồ.";
          
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = "Vui lòng cấp quyền truy cập GPS trong cài đặt trình duyệt để xác định vị trí của bạn.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = "Không thể xác định vị trí hiện tại của thiết bị. Vui lòng chọn vị trí thủ công trên bản đồ.";
          } else if (error.code === error.TIMEOUT) {
            errorMessage = "Thời gian lấy vị trí đã hết hạn. Vui lòng thử lại.";
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
      console.error("Trình duyệt của bạn không hỗ trợ GPS.");
      setLoading(false);
    }
  };

  // Chuyển đổi tọa độ sang địa chỉ
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      setAddress(data.address?.city || data.address?.town || "Địa chỉ không xác định");
    } catch (error) {
      console.error("Lỗi reverse geocode:", error);
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
          📍 Chọn vị trí của bạn
        </h3>
        <p style={{ marginTop: 0, marginBottom: "12px", fontSize: "13px", color: "#666" }}>
          Nhấp vào bản đồ để chọn vị trí hoặc sử dụng GPS của bạn
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
          {loading ? "Đang xác định vị trí..." : "📍 Dùng GPS hiện tại"}
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
          <p style={{ margin: "0 0 4px 0", fontWeight: "500" }}>✓ Vị trí đã chọn:</p>
          <p style={{ margin: "0", color: "#666" }}>
            {address || `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`}
          </p>
        </div>
      )}
    </div>
  );
};
