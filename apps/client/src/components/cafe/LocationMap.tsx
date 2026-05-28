import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationMapProps {
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  onLocationSelect?: (lat: number, lng: number, address: string, fromGeocode?: boolean) => void;
}

export interface LocationMapHandle {
  geocodeAndSearch: (addr: string) => Promise<void>;
}

const createCafeIcon = (imageUrl?: string) => {
  return new L.Icon({
    iconUrl:
      imageUrl || "https://cdn-icons-png.flaticon.com/512/2776/2776067.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: "custom-marker-icon",
  });
};

const centerHanoi: [number, number] = [21.0056, 105.8433];

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (latlng: L.LatLng) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export const LocationMap = forwardRef<LocationMapHandle, LocationMapProps>(
  ({ address, latitude, longitude, onLocationSelect }, ref) => {
    const [selectedLocation, setSelectedLocation] = useState<{
      lat: number;
      lng: number;
    } | null>(latitude && longitude ? { lat: latitude, lng: longitude } : null);
    const [currentAddress, setCurrentAddress] = useState<string>(address || "");
    const [loading, setLoading] = useState(false);
    const [map, setMap] = useState<L.Map | null>(null);
    const [mapZoom, setMapZoom] = useState(14);

    // Sync khi có tọa độ ban đầu truyền vào từ parent
    useEffect(() => {
      if (latitude && longitude) {
        setSelectedLocation((prev) => {
          if (prev?.lat === latitude && prev?.lng === longitude) return prev;
          if (map) {
            map.setView([latitude, longitude], 14);
          }
          return { lat: latitude, lng: longitude };
        });
      }
    }, [latitude, longitude, map]);

    // Sync zoom level
    useEffect(() => {
      if (!map) return;
      const onZoomEnd = () => setMapZoom(map.getZoom());
      map.on("zoomend", onZoomEnd);
      return () => {
        map.off("zoomend", onZoomEnd);
      };
    }, [map]);

    // Chuyển đổi địa chỉ sang tọa độ (Geocoding)
    const geocodeAddress = async (addr: string) => {
      if (!addr.trim()) return;

      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            addr,
          )}&limit=1&addressdetails=1&language=vi`,
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

          // Reverse geocode to get normalized Vietnamese address
          const normalized = await reverseGeocode(newLat, newLon);

          if (onLocationSelect) {
            // Truyền fromGeocode = true để parent không ghi đè text input đang gõ
            onLocationSelect(newLat, newLon, normalized || addr, true);
          }
        } else {
          console.warn("[LocationMap] Geocode not found:", addr);
        }
      } catch (error) {
        console.error("[LocationMap] Geocoding error:", error);
      } finally {
        setLoading(false);
      }
    };

    // Expose method to parent component
    useImperativeHandle(
      ref,
      () => ({
        geocodeAndSearch: geocodeAddress,
      }),
      [map, onLocationSelect],
    );

    // Chuyển đổi tọa độ sang địa chỉ (Reverse Geocoding)
    const reverseGeocode = async (lat: number, lng: number) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&language=vi`,
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const addr = data.address || {};

        // Extract parts in logical order
        const house = addr.house_number || "";
        const road = addr.road || "";
        const neighbourhood = addr.neighbourhood || "";
        const suburb = addr.suburb || "";
        const city_district = addr.city_district || "";
        const district = addr.district || "";
        const county = addr.county || "";
        const city = addr.city || addr.town || addr.village || "";

        const parts: string[] = [];
        if (house) parts.push(house);
        if (road) parts.push(road);
        if (neighbourhood) parts.push(neighbourhood);

        // For administrative parts, use raw values returned by the API
        const adminParts = [suburb, city_district, district, county].filter(
          Boolean,
        );
        parts.push(...adminParts);

        if (city) parts.push(city);

        let newAddress = parts.join(", ");

        if (!newAddress) {
          newAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }

        setCurrentAddress(newAddress);
        return newAddress;
      } catch (error) {
        console.error("[LocationMap] Reverse geocoding error:", error);
        const fallbackAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setCurrentAddress(fallbackAddress);
        return fallbackAddress;
      }
    };

    // Lắng nghe thay đổi của address prop từ parent
    useEffect(() => {
      if (address && address !== currentAddress) {
        setCurrentAddress(address);
      }
    }, [address]);

    const handleMapClick = async (latlng: L.LatLng) => {
      const { lat, lng } = latlng;
      setSelectedLocation({ lat, lng });
      const newAddress = await reverseGeocode(lat, lng);
      if (onLocationSelect) {
        // Truyền fromGeocode = false do thao tác click trực tiếp trên map
        onLocationSelect(lat, lng, newAddress, false);
      }
    };

    // Lấy vị trí hiện tại của người dùng
    const getCurrentLocation = () => {
      // Phản hồi UI ngay lập tức: đưa bản đồ về vị trí ghim hiện tại (nếu có)
      if (selectedLocation && map) {
        const currentZoom = map.getZoom();
        map.setView([selectedLocation.lat, selectedLocation.lng], currentZoom > 14 ? currentZoom : 14);
      }

      setLoading(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude: posLat, longitude: posLng } = position.coords;
            setSelectedLocation({ lat: posLat, lng: posLng });

            if (map) {
              const currentZoom = map.getZoom();
              map.setView([posLat, posLng], currentZoom > 14 ? currentZoom : 14);
            }

            const newAddress = await reverseGeocode(posLat, posLng);
            if (onLocationSelect) {
              // Truyền fromGeocode = false do thao tác chọn GPS
              onLocationSelect(posLat, posLng, newAddress, false);
            }
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
            
            // Nếu không lấy được GPS (do từ chối quyền, timeout, v.v.)
            // Ít nhất hãy đưa map về lại vị trí ghim đỏ (nếu có) để người dùng không bị kẹt
            if (selectedLocation && map) {
              const currentZoom = map.getZoom();
              map.setView([selectedLocation.lat, selectedLocation.lng], currentZoom > 14 ? currentZoom : 14);
            }

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

    return (
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        {/* Bản đồ Leaflet */}
        <div
          style={{
            position: "relative",
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <MapContainer
            center={
              selectedLocation
                ? [selectedLocation.lat, selectedLocation.lng]
                : centerHanoi
            }
            zoom={14}
            minZoom={8}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%", flex: 1 }}
            zoomControl={false}
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
        </div>

        {/* Nút GPS */}
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={loading}
          className="absolute right-4 bottom-4 w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-[#4f453e] hover:text-[#614734] hover:bg-gray-50 disabled:opacity-50 transition-colors z-400"
          title="Lấy vị trí hiện tại"
        >
          <span className="material-symbols-outlined">my_location</span>
        </button>

        {/* Zoom Controls */}
        <div className="absolute right-4 bottom-20 flex flex-col bg-white rounded-lg shadow-md overflow-hidden z-400">
          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center text-[#4f453e] hover:bg-gray-50 border-b border-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Phóng to"
            disabled={mapZoom >= 18}
            onClick={() => {
              if (map) map.zoomIn();
            }}
          >
            <span className="material-symbols-outlined">add</span>
          </button>
          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center text-[#4f453e] hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Thu nhỏ"
            disabled={mapZoom <= 8}
            onClick={() => {
              if (map) map.zoomOut();
            }}
          >
            <span className="material-symbols-outlined">remove</span>
          </button>
        </div>

        {/* Info Card */}
        <div className="absolute top-4 left-4 right-16 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-white/50 z-400">
          <p className="text-sm font-medium text-[#4f453e] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#614734]">
              map
            </span>
            {selectedLocation
              ? currentAddress ||
              `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`
              : "地図をクリックして場所を指定してください"}
          </p>
        </div>
      </div>
    );
  },
);

