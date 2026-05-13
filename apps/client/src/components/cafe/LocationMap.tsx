import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationMapProps {
  address?: string;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
}

export interface LocationMapHandle {
  geocodeAndSearch: (addr: string) => Promise<void>;
}

const createCafeIcon = (imageUrl?: string) => {
  return new L.Icon({
    iconUrl: imageUrl || "https://cdn-icons-png.flaticon.com/512/2776/2776067.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: "custom-marker-icon"
  });
};

const centerHanoi: [number, number] = [21.028511, 105.804817];

function MapClickHandler({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export const LocationMap = forwardRef<LocationMapHandle, LocationMapProps>(
  ({ address, onLocationSelect }, ref) => {
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [currentAddress, setCurrentAddress] = useState<string>(address || "");
    const [loading, setLoading] = useState(false);
    const [map, setMap] = useState<L.Map | null>(null);

    // Chuyển đổi địa chỉ sang tọa độ (Geocoding)
    const geocodeAddress = async (addr: string) => {
      if (!addr.trim()) return;
      
      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`
        );
        const data = await response.json();
        
        if (data.length > 0) {
          const { lat, lon } = data[0];
          const newLat = parseFloat(lat);
          const newLon = parseFloat(lon);
          
          setSelectedLocation({ lat: newLat, lng: newLon });
          
          // Pan bản đồ đến vị trí mới
          if (map) {
            map.setView([newLat, newLon], 14);
          }
          
          if (onLocationSelect) {
            onLocationSelect(newLat, newLon, addr);
          }
        } else {
          alert("Không tìm thấy địa chỉ này. Vui lòng thử lại.");
        }
      } catch (error) {
        console.error("Lỗi geocode:", error);
        alert("Lỗi khi tìm kiếm địa chỉ.");
      } finally {
        setLoading(false);
      }
    };

    // Expose method to parent component
    useImperativeHandle(ref, () => ({
      geocodeAndSearch: geocodeAddress
    }), [map, onLocationSelect]);

    // Chuyển đổi tọa độ sang địa chỉ (Reverse Geocoding)
    const reverseGeocode = async (lat: number, lng: number) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        
        // Tạo địa chỉ từ các thành phần chi tiết
        const addr = data.address || {};
        const addressParts = [];
        
        // Lấy các thành phần theo thứ tự chi tiết
        if (addr.house_number) addressParts.push(addr.house_number);
        if (addr.road) addressParts.push(addr.road);
        if (addr.neighbourhood) addressParts.push(addr.neighbourhood);
        if (addr.suburb) addressParts.push(addr.suburb);
        if (addr.city_district) addressParts.push(addr.city_district);
        if (addr.district) addressParts.push(addr.district);
        if (addr.city) addressParts.push(addr.city);
        
        let newAddress = addressParts.filter(Boolean).join(", ");
        
        // Nếu không có chi tiết, dùng city hoặc town
        if (!newAddress) {
          newAddress = addr.city || addr.town || "Địa chỉ không xác định";
        }
        
        setCurrentAddress(newAddress);
        return newAddress;
      } catch (error) {
        console.error("Lỗi reverse geocode:", error);
        setCurrentAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    };

  // Lắng nghe thay đổi của address prop từ parent
  useEffect(() => {
    if (address && address !== currentAddress) {
      setCurrentAddress(address);
      // Không tự động geocode khi địa chỉ thay đổi - chỉ cập nhật state
      // User sẽ nhấn Enter để trigger geocoding
    }
  }, [address]);

  const handleMapClick = async (latlng: L.LatLng) => {
    const { lat, lng } = latlng;
    setSelectedLocation({ lat, lng });
    const newAddress = await reverseGeocode(lat, lng);
    if (onLocationSelect) {
      onLocationSelect(lat, lng, newAddress);
    }
  };

  // Lấy vị trí hiện tại của người dùng
  const getCurrentLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setSelectedLocation({ lat: latitude, lng: longitude });
          
          if (map) {
            map.setView([latitude, longitude], 14);
          }
          
          const newAddress = await reverseGeocode(latitude, longitude);
          if (onLocationSelect) {
            onLocationSelect(latitude, longitude, newAddress);
          }
          setLoading(false);
        },
        (error) => {
          console.error("Lỗi lấy vị trí:", error);
          alert("Không thể lấy vị trí của bạn. Vui lòng cấp quyền truy cập GPS.");
          setLoading(false);
        }
      );
    } else {
      alert("Trình duyệt của bạn không hỗ trợ GPS.");
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-[#e5e3df] rounded-xl overflow-hidden border border-[#d6cfc7]">
      {/* Bản đồ Leaflet */}
      <MapContainer
        center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : centerHanoi}
        zoom={14}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        ref={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onMapClick={handleMapClick} />

        {selectedLocation && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={createCafeIcon()}
          />
        )}
      </MapContainer>

      {/* Nút GPS */}
      <button
        type="button"
        onClick={getCurrentLocation}
        disabled={loading}
        className="absolute right-4 bottom-20 w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-[#4f453e] hover:text-[#614734] hover:bg-gray-50 disabled:opacity-50 transition-colors z-[400]"
        title="Lấy vị trí hiện tại"
      >
        <span className="material-symbols-outlined">my_location</span>
      </button>

      {/* Zoom Controls */}
      <div className="absolute right-4 bottom-4 flex flex-col bg-white rounded-lg shadow-md overflow-hidden z-[400]">
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center text-[#4f453e] hover:bg-gray-50 border-b border-gray-100 transition-colors"
          title="Phóng to"
          onClick={() => {
            if (map) map.zoomIn();
          }}
        >
          <span className="material-symbols-outlined">add</span>
        </button>
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center text-[#4f453e] hover:bg-gray-50 transition-colors"
          title="Thu nhỏ"
          onClick={() => {
            if (map) map.zoomOut();
          }}
        >
          <span className="material-symbols-outlined">remove</span>
        </button>
      </div>

      {/* Info Card */}
      <div className="absolute top-4 left-4 right-16 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-white/50 z-[400]">
        <p className="text-sm font-medium text-[#4f453e] flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#614734]">map</span>
          {selectedLocation 
            ? currentAddress || `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`
            : "地図をクリックして場所を指定してください"
          }
        </p>
      </div>
    </div>
  );
  }
);
